/*
 * The loader's memory: localStorage "rt-theme-asset:script" and "rt-theme-asset:style", value
 * "<file name>|<token>". It must work without storage, and it must never trust a stored value
 * that does not match the file or does not look like one of its own tokens.
 */
import {
    ALL_404,
    attemptOf,
    expect,
    expectStartedOnce,
    expectStylesheetApplied,
    freshTokenPattern,
    isRetry,
    openThemePage,
    seedStorage,
    test,
    themeState,
    waitForStart,
    type Simulator
} from "../support/theme";
import { STORE_KEYS } from "../support/constants.mjs";

const POISONED_PLAIN = { js: { plain: 404 as const }, css: { plain: 404 as const } };

test.describe("when reading window.localStorage throws (site data blocked)", () => {
    test.beforeEach(async ({ context }) => {
        await context.addInitScript(() => {
            Object.defineProperty(window, "localStorage", {
                configurable: true,
                get() {
                    throw new DOMException("The operation is insecure.", "SecurityError");
                }
            });
        });
    });

    test("a cached-404 plain address still recovers, on every visit", async ({ page, sim }) => {
        await sim.reset(POISONED_PLAIN);
        await openThemePage(page, "?execution=visit-1");
        expect(await page.evaluate(() => {
            try {
                return typeof window.localStorage;
            } catch (error) {
                return (error as DOMException).name;
            }
        }), "reading localStorage in the page").toBe("SecurityError");

        await waitForStart(page);
        await expectStartedOnce(page, sim);
        await expectStylesheetApplied(page, sim, { retried: true });
        expect((await sim.entries(isRetry("js"))).map(e => e.status)).toEqual([200]);

        // No memory, so the next visit asks for a new address again; it still recovers.
        await sim.reset(POISONED_PLAIN);
        await openThemePage(page, "?execution=visit-2");
        await waitForStart(page);
        await expectStartedOnce(page, sim);
        const retries = await sim.entries(isRetry("js"));
        expect(retries.map(e => e.status)).toEqual([200]);
        expect(retries[0].kcr).toMatch(freshTokenPattern(1));
    });
});

test.describe("when localStorage.setItem throws (storage full)", () => {
    test.beforeEach(async ({ context }) => {
        await context.addInitScript(() => {
            Storage.prototype.setItem = function () {
                throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
            };
        });
    });

    test("a cached-404 plain address still recovers and nothing is stored", async ({ page, sim }) => {
        await sim.reset(POISONED_PLAIN);
        await openThemePage(page);
        await waitForStart(page);
        const state = await expectStartedOnce(page, sim);
        await expectStylesheetApplied(page, sim, { retried: true });
        expect(state.storage).toEqual({ script: null, style: null });
        expect((await sim.entries(isRetry("js"))).map(e => e.status)).toEqual([200]);
    });
});

test("a remembered address that now answers 404 is dropped, the next attempt recovers, and its token replaces it", async ({
    page,
    sim
}) => {
    await seedStorage(page, {
        [STORE_KEYS.script]: sim.info.scriptFile + "|1-remembered",
        [STORE_KEYS.style]: sim.info.styleFile + "|1-remembered"
    });
    await sim.reset({ js: { plain: 404, failFirstRetries: 1 }, css: { plain: 404, failFirstRetries: 1 } });

    await openThemePage(page);
    await waitForStart(page);
    await expectStartedOnce(page, sim);
    await expectStylesheetApplied(page, sim, { retried: true });
    await page.waitForTimeout(300);

    const entries = await sim.entries();
    const stored = (await themeState(page, sim.info.scriptFile)).storage;
    for (const [kind, key, file] of [
        ["js", "script", sim.info.scriptFile],
        ["css", "style", sim.info.styleFile]
    ] as const) {
        const retries = entries.filter(isRetry(kind));
        expect(retries.map(e => [e.kcr === "1-remembered" ? "remembered" : attemptOf(e.kcr), e.status]), kind).toEqual([
            ["remembered", 404],
            [2, 200]
        ]);
        expect(retries[1].kcr).toMatch(freshTokenPattern(2));
        expect(stored, kind).not.toBe("unreadable");
        expect((stored as Record<string, string | null>)[key], key).toBe(file + "|" + retries[1].kcr);
    }
});

test("a remembered address that answers 404 is forgotten even when nothing loads afterwards", async ({ page, sim }) => {
    await seedStorage(page, {
        [STORE_KEYS.script]: sim.info.scriptFile + "|1-remembered",
        [STORE_KEYS.style]: sim.info.styleFile + "|1-remembered"
    });
    await sim.reset({ js: ALL_404, css: ALL_404 });

    await openThemePage(page);
    // Two retries of each: the remembered address, then the first fresh one. No later success
    // overwrites the stored value, so this shows the failed address really was dropped.
    await expect.poll(async () => (await sim.entries(isRetry("js"))).length, { timeout: 10_000 }).toBeGreaterThanOrEqual(2);
    await expect.poll(async () => (await sim.entries(isRetry("css"))).length, { timeout: 10_000 }).toBeGreaterThanOrEqual(2);

    expect((await sim.entries(isRetry("js")))[0].kcr).toBe("1-remembered");
    expect((await themeState(page, sim.info.scriptFile)).storage).toEqual({ script: null, style: null });
});

test("a remembered token for a different file name is not used", async ({ page, sim }) => {
    await seedStorage(page, {
        [STORE_KEYS.script]: "index-0ldHash1.js|1-oldscript",
        [STORE_KEYS.style]: "index-0ldHash2.css|1-oldstyle"
    });
    await sim.reset(POISONED_PLAIN);

    await openThemePage(page);
    await waitForStart(page);
    await expectStartedOnce(page, sim);
    await expectStylesheetApplied(page, sim, { retried: true });
    await page.waitForTimeout(300);

    await expectFreshFirstRetry(sim, ["1-oldscript", "1-oldstyle"]);
    const entries = await sim.entries();
    expect((await themeState(page, sim.info.scriptFile)).storage).toEqual({
        script: sim.info.scriptFile + "|" + entries.find(isRetry("js"))!.kcr,
        style: sim.info.styleFile + "|" + entries.find(isRetry("css"))!.kcr
    });
});

test.describe("a stored value that is not the loader's own shape is ignored and never requested", () => {
    // [label, token]. Each is stored after the right file name, except where the label says otherwise.
    const cases: [string, string, (file: string, token: string) => string][] = [
        ["no separator", "garbage", (_file, token) => token],
        ["empty file name", "1-abc", (_file, token) => "|" + token],
        ["empty token", "", (file, token) => file + "|" + token],
        ["41 characters (one too many)", "1-" + "a".repeat(39), (file, token) => file + "|" + token],
        ["very long", "1-" + "a".repeat(5000), (file, token) => file + "|" + token],
        ["upper case", "1-ABCdef", (file, token) => file + "|" + token],
        ["a space", "1-ab cd", (file, token) => file + "|" + token],
        ["a second parameter", "1-ab&kcr=evil", (file, token) => file + "|" + token],
        ["path characters", "../../evil", (file, token) => file + "|" + token],
        ["percent-encoding", "1-%2e%2e", (file, token) => file + "|" + token],
        ["markup", '1-"><script>x</script>', (file, token) => file + "|" + token],
        ["non-ASCII", "1-abc\u00e9", (file, token) => file + "|" + token],
        ["file name with a different case", "1-abc", (file, token) => file.toUpperCase() + "|" + token]
    ];

    for (const [label, token, value] of cases) {
        test(label, async ({ page, sim }) => {
            await seedStorage(page, {
                [STORE_KEYS.script]: value(sim.info.scriptFile, token),
                [STORE_KEYS.style]: value(sim.info.styleFile, token)
            });
            await sim.reset(POISONED_PLAIN);

            await openThemePage(page);
            await waitForStart(page);
            await expectStartedOnce(page, sim);
            await page.waitForTimeout(300);

            await expectFreshFirstRetry(sim, [token]);
            if (token.length >= 4) {
                // Whatever form it might take in a URL, it never appears in one.
                const forms = [token, encodeURIComponent(token), new URLSearchParams({ t: token }).toString().slice(2)];
                for (const entry of await sim.entries()) {
                    for (const form of forms) {
                        expect(entry.query.includes(form), entry.path + "?" + entry.query).toBe(false);
                    }
                }
            }
        });
    }
});

/** The first retry of each kind used a token the loader made just now, not a stored one. */
async function expectFreshFirstRetry(sim: Simulator, notThese: string[]): Promise<void> {
    for (const kind of ["js", "css"] as const) {
        const retries = await sim.entries(isRetry(kind));
        expect(retries.map(e => e.status), kind + " retries").toEqual([200]);
        expect(retries[0].kcr, kind + " first retry").toMatch(freshTokenPattern(1));
        expect(notThese, kind + " first retry").not.toContain(retries[0].kcr);
    }
}
