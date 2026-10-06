/*
 * Loads that keep failing: the notice, the slow retries after it, healing in place, and the
 * events and watchdog that bring the notice or an attempt forward.
 *
 * Schedule under test (src/loader/assetRetry.js): attempts 1 to 6 after 0, 300, 800, 1500, 3000
 * and 5000 ms (the sixth at about 10.6 s); the notice when the sixth script attempt fails; then
 * attempts after 8 s, 10 s, 15 s and every 20 s. No automatic reload, ever.
 */
import type { Page } from "@playwright/test";
import {
    ALL_404,
    attemptOf,
    expect,
    expectNoticeLegible,
    expectStartedOnce,
    expectStylesheetApplied,
    isPage,
    isRetry,
    notice,
    openThemePage,
    test,
    themeState,
    waitForStart,
    type LogEntry,
    type Simulator
} from "../support/theme";

test("nothing loads: the notice shows, the page never reloads itself, retries go on slowly, and it starts in place once the edge heals", async ({
    page,
    sim
}) => {
    test.setTimeout(90_000);
    await sim.reset({ js: ALL_404, css: ALL_404 });
    const navigations = watchMainFrameNavigations(page);

    await openThemePage(page);
    await expect(notice(page)).toBeVisible({ timeout: 16_000 });
    const shownAt = (await themeState(page, sim.info.scriptFile)).noticeShownAt!;
    expect(shownAt, "ms from navigation to the notice").toBeGreaterThanOrEqual(9_000);
    expect(shownAt, "ms from navigation to the notice").toBeLessThanOrEqual(14_000);
    await expectNoticeLegible(page);
    await markDocument(page);
    const navigationsAtNotice = navigations.count;

    // The next 25 s: no navigation of any kind, and the script keeps being retried, slowly.
    await page.waitForTimeout(25_000);
    expect(navigations.count, "main-frame navigations since the notice").toBe(navigationsAtNotice);
    let entries = await sim.entries();
    expect(entries.filter(isPage), "page requests").toHaveLength(1);
    for (const kind of ["js", "css"] as const) {
        const retries = entries.filter(isRetry(kind));
        expect(retries.map(e => attemptOf(e.kcr)), kind + " attempts so far").toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
        expect(retries.every(e => e.status === 404)).toBe(true);
        expect(gap(retries, 6, 7), kind + ": ms between attempts 6 and 7").toBeGreaterThanOrEqual(7_500);
        expect(gap(retries, 6, 7), kind + ": ms between attempts 6 and 7").toBeLessThanOrEqual(9_500);
        expect(gap(retries, 7, 8), kind + ": ms between attempts 7 and 8").toBeGreaterThanOrEqual(9_500);
        expect(gap(retries, 7, 8), kind + ": ms between attempts 7 and 8").toBeLessThanOrEqual(11_500);
    }
    await expect(notice(page)).toBeVisible();

    // Heal the edge. The next attempt (9, about 15 s after attempt 8) loads, in the same document.
    await sim.setRules({});
    await waitForStart(page, 20_000);
    const state = await expectStartedOnce(page, sim);
    expect(state.noticeGoneAt, "the notice was removed").not.toBeNull();
    expect(await isSameDocument(page), "still the document the notice was shown in").toBe(true);
    expect(navigations.count, "main-frame navigations since the notice").toBe(navigationsAtNotice);
    await expectStylesheetApplied(page, sim, { retried: true });

    entries = await sim.entries();
    expect(entries.filter(isPage), "page requests").toHaveLength(1);
    expect(entries.filter(e => isRetry("js")(e) && e.status === 200).map(e => attemptOf(e.kcr))).toEqual([9]);
});

test("an edge that ignores the query string (every address 404 for 25 s): the page heals itself in place", async ({ page, sim }) => {
    test.setTimeout(60_000);
    await sim.reset({ js: { outageMs: 25_000 }, css: { outageMs: 25_000 } });
    const navigations = watchMainFrameNavigations(page);

    await openThemePage(page);
    await expect(notice(page)).toBeVisible({ timeout: 16_000 });
    await markDocument(page);
    const navigationsAtNotice = navigations.count;

    await waitForStart(page, 35_000);
    const state = await expectStartedOnce(page, sim);
    expect(state.noticeGoneAt, "the notice was removed").not.toBeNull();
    expect(await isSameDocument(page)).toBe(true);
    expect(navigations.count).toBe(navigationsAtNotice);
    await expectStylesheetApplied(page, sim, { retried: true });

    const entries = await sim.entries();
    expect(entries.filter(isPage), "page requests").toHaveLength(1);
    for (const kind of ["js", "css"] as const) {
        const requests = entries.filter(e => e.kind === kind);
        // Everything during the outage failed; the first attempt after it (attempt 8, at about
        // 28.6 s) loaded.
        expect(requests.filter(e => e.at < 25_000).every(e => e.status === 404), kind + ": all 404 during the outage").toBe(true);
        expect(requests.filter(e => e.status === 200).map(e => attemptOf(e.kcr)), kind + ": the attempt that loaded").toEqual([8]);
    }
});

test("only the stylesheet fails: the page starts, the retried stylesheet applies, no notice", async ({ page, sim }) => {
    await sim.reset({ css: { plain: 404 } });

    await openThemePage(page);
    await waitForStart(page);
    await expectStylesheetApplied(page, sim, { retried: true });
    await page.waitForTimeout(500);
    const state = await expectStartedOnce(page, sim);
    expect(state.noticeShownAt).toBeNull();

    const entries = await sim.entries();
    expect(entries.filter(isRetry("js")), "script retries").toEqual([]);
    expect(entries.filter(isRetry("css")).map(e => ({ attempt: attemptOf(e.kcr), status: e.status }))).toEqual([
        { attempt: 1, status: 200 }
    ]);
});

test.describe("with a dark colour scheme, so the stylesheet's own colours are light text on dark", () => {
    test.use({ colorScheme: "dark" });

    test("only the script fails, for good: the notice is legible on top of the real stylesheet", async ({ page, sim }) => {
        test.setTimeout(30_000);
        await sim.reset({ js: ALL_404 });

        await openThemePage(page);
        await expect(notice(page)).toBeVisible({ timeout: 16_000 });
        await expectNoticeLegible(page);

        // The stylesheet is in effect (dark body, light text), so the notice's colours had to
        // beat it rather than fall back on browser defaults.
        const body = await page.evaluate(() => {
            const computed = getComputedStyle(document.body);
            return { color: computed.color, background: computed.backgroundColor, font: computed.fontFamily };
        });
        expect(body).toEqual({ color: "rgb(250, 250, 250)", background: "rgb(8, 14, 28)", font: expect.stringMatching(/^"?Arimo/) });
        expect((await sim.entries(isRetry("css"))), "stylesheet retries").toEqual([]);
    });
});

test('"online" brings the waiting attempt forward', async ({ page, sim }) => {
    await expectEventBringsAttemptForward(page, sim, () => window.dispatchEvent(new Event("online")));
});

test("the tab becoming visible brings the waiting attempt forward", async ({ page, sim }) => {
    // The page is already visible, so this is the event the browser sends when it becomes so.
    await expectEventBringsAttemptForward(page, sim, () => document.dispatchEvent(new Event("visibilitychange")));
});

test("watchdog: an error event that never arrives (swallowed by a blocker) still leads to the notice", async ({
    page,
    context,
    sim
}) => {
    test.setTimeout(40_000);
    // Stands in for an extension or blocker that stops the bundle's error event before the loader
    // sees it. Registered before the page's own scripts, as an extension's would be.
    await context.addInitScript(() => {
        window.addEventListener(
            "error",
            event => {
                const el = event.target as Element | null;
                if (el instanceof HTMLScriptElement && el.type === "module") {
                    event.stopImmediatePropagation();
                }
            },
            true
        );
    });
    await sim.reset({ js: ALL_404 });

    await openThemePage(page);
    await expect(notice(page)).toBeVisible({ timeout: 25_000 });
    // About 20 s after the page arrived (here DOMContentLoaded follows within milliseconds, so
    // this holds whether the watchdog counts from DOMContentLoaded or from when the loader ran).
    const shownAt = (await themeState(page, sim.info.scriptFile)).noticeShownAt!;
    expect(shownAt, "ms from navigation to the notice").toBeGreaterThanOrEqual(19_500);
    expect(shownAt, "ms from navigation to the notice").toBeLessThanOrEqual(22_000);
    expect(await sim.entries(isRetry("js")), "no retries: the loader never saw a failure").toEqual([]);
    await expectNoticeLegible(page);
});

test("watchdog: a script request that hangs leads to the notice about 20 s after the page arrived", async ({ page, sim }) => {
    test.setTimeout(40_000);
    // The plain script is held for 45 s: no answer, so no error event, for the whole test. The
    // loader says its watchdog is the backstop for exactly this ("a request that hangs").
    await sim.reset({ js: { plainDelayMs: 45_000 } });

    await openThemePage(page);
    await expect(notice(page), "notice from the watchdog while the script request hangs").toBeVisible({ timeout: 25_000 });
    const shownAt = (await themeState(page, sim.info.scriptFile)).noticeShownAt!;
    expect(shownAt, "ms from navigation to the notice").toBeGreaterThanOrEqual(19_500);
    expect(shownAt, "ms from navigation to the notice").toBeLessThanOrEqual(22_000);
    await expectNoticeLegible(page);
});

// ---------------------------------------------------------------------------------------------

function watchMainFrameNavigations(page: Page): { count: number } {
    const seen = { count: 0 };
    page.on("framenavigated", frame => {
        if (frame === page.mainFrame()) {
            seen.count += 1;
        }
    });
    return seen;
}

/** Marks the current document, so a later check can tell that it was never replaced. */
async function markDocument(page: Page): Promise<void> {
    await page.evaluate(() => {
        (window as unknown as { __e2eMarked: boolean }).__e2eMarked = true;
    });
}

async function isSameDocument(page: Page): Promise<boolean> {
    return page.evaluate(() => (window as unknown as { __e2eMarked?: boolean }).__e2eMarked === true);
}

function gap(retries: LogEntry[], from: number, to: number): number {
    const at = (attempt: number) => retries.find(e => attemptOf(e.kcr) === attempt)!.at;
    return at(to) - at(from);
}

/**
 * Everything fails until the fifth attempt has failed (at about 5.6 s; the sixth then waits 5 s).
 * The edge heals and the event is sent: the sixth attempt goes out at once and the page starts,
 * seconds before the timer would have fired.
 */
async function expectEventBringsAttemptForward(page: Page, sim: Simulator, send: () => void): Promise<void> {
    await sim.reset({ js: ALL_404, css: ALL_404 });
    await openThemePage(page);
    await expect.poll(async () => (await sim.entries(isRetry("js"))).length, { timeout: 10_000 }).toBe(5);
    await page.waitForTimeout(200);

    await sim.setRules({});
    const sentAt = (await sim.log()).now;
    await page.evaluate(send);
    await waitForStart(page, 2_000);
    await expectStartedOnce(page, sim);

    const sixth = (await sim.entries(isRetry("js"))).find(e => attemptOf(e.kcr) === 6)!;
    expect(sixth.status).toBe(200);
    expect(sixth.at - sentAt, "ms from the event to the sixth attempt").toBeLessThan(1_000);
    const fifth = (await sim.entries(isRetry("js"))).find(e => attemptOf(e.kcr) === 5)!;
    expect(sixth.at - fifth.at, "ms between attempts 5 and 6 (5000 without the event)").toBeLessThan(4_000);
}
