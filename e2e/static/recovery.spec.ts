/*
 * Loads that succeed, straight away or after retries. Each test runs in a fresh browser context
 * with a fresh HTTP cache; the simulator decides what each request gets.
 */
import {
    ALL_404,
    attemptOf,
    expect,
    expectStartedOnce,
    expectStylesheetApplied,
    isAsset,
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
import type { Page } from "@playwright/test";
import { SIM_ORIGIN } from "../support/constants.mjs";

const POISONED_PLAIN = { js: { plain: 404 as const }, css: { plain: 404 as const } };

test("a healthy load is left alone: no retries, nothing remembered", async ({ page, sim }) => {
    await openThemePage(page);
    await waitForStartAndSettle(page);

    const state = await expectStartedOnce(page, sim);
    expect(state.retryElements, "elements the loader added").toEqual([]);
    expect(state.storage).toEqual({ script: null, style: null });
    await expectStylesheetApplied(page, sim);

    const entries = await sim.entries();
    expect(entries.filter(entry => entry.kcr !== null), "requests with kcr").toEqual([]);
    expect(entries.filter(isPage)).toHaveLength(1);
    expect(entries.filter(entry => entry.kind === "js"), "script requests").toHaveLength(1);
    expect(entries.filter(entry => entry.kind === "css"), "stylesheet requests").toHaveLength(1);
});

test("plain addresses cached as a one-year 404: the retries load, are remembered, and later visits ask the server for nothing", async ({
    page,
    context,
    sim,
    browserName
}) => {
    await sim.reset(POISONED_PLAIN);

    // First visit: both plain addresses answer 404 with a one-year max-age; the retries succeed.
    await openThemePage(page, "?execution=visit-1");
    await waitForStartAndSettle(page);
    await expectStartedOnce(page, sim);
    await expectStylesheetApplied(page, sim, { retried: true });

    const first = await sim.entries();
    const pageRequest = first.find(isPage)!;
    const scriptRetries = first.filter(isRetry("js"));
    const styleRetries = first.filter(isRetry("css"));
    expect(scriptRetries.map(summary)).toEqual([{ attempt: 1, status: 200 }]);
    expect(styleRetries.map(summary)).toEqual([{ attempt: 1, status: 200 }]);
    expect(scriptRetries[0].at - pageRequest.at, "ms from the page request to the script retry").toBeLessThan(1000);

    const remembered = (await themeState(page, sim.info.scriptFile)).storage;
    expect(remembered).toEqual({
        script: sim.info.scriptFile + "|" + scriptRetries[0].kcr,
        style: sim.info.styleFile + "|" + styleRetries[0].kcr
    });

    // Second visit, same tab: the plain 404 and the remembered addresses all come from the cache.
    await sim.reset(POISONED_PLAIN);
    await openThemePage(page, "?execution=visit-2");
    await waitForStartAndSettle(page);
    const second = await expectStartedOnce(page, sim);
    await expectStylesheetApplied(page, sim, { retried: true });
    expect(second.retryElements, "the first attempt used the remembered addresses").toEqual([
        { tag: "script", attempt: "1", kcr: scriptRetries[0].kcr },
        { tag: "link", attempt: "1", kcr: styleRetries[0].kcr }
    ]);
    expect(second.storage).toEqual(remembered);
    await expectNoAssetRequests(sim, browserName);

    // Third visit, in a new tab of the same browser: the same again.
    await sim.reset(POISONED_PLAIN);
    const tab = await context.newPage();
    await openThemePage(tab, "?execution=visit-3");
    await waitForStartAndSettle(tab);
    const third = await expectStartedOnce(tab, sim);
    await expectStylesheetApplied(tab, sim, { retried: true });
    expect(third.retryElements.map(el => el.kcr)).toEqual([scriptRetries[0].kcr, styleRetries[0].kcr]);
    await expectNoAssetRequests(sim, browserName);

    // And a reload, which is what someone looking at a blank page does. Chrome revalidates only
    // the page on a reload, so the cached 404 is used again: without the loader this stays blank.
    await sim.reset(POISONED_PLAIN);
    await tab.reload({ waitUntil: "commit" });
    await waitForStartAndSettle(tab);
    const reloaded = await expectStartedOnce(tab, sim);
    expect(reloaded.retryElements.map(el => el.kcr)).toEqual([scriptRetries[0].kcr, styleRetries[0].kcr]);
    await expectNoAssetRequests(sim, browserName);
});

test("a later visit never asks again for a retry address that failed on an earlier one", async ({ page, sim, browserName }) => {
    // Visit 1: nothing loads, so every retry address ends up cached as a one-year 404 as well.
    await sim.reset({ js: ALL_404, css: ALL_404 });
    await openThemePage(page, "?execution=visit-1");
    await expect.poll(async () => (await sim.entries(isRetry("js"))).length, { timeout: 10_000 }).toBeGreaterThanOrEqual(3);

    // Visit 2: only the plain address is bad. If the loader reused its earlier addresses, Chrome
    // would answer them from its cache and the page would wait through each of them again.
    await sim.reset(POISONED_PLAIN);
    await openThemePage(page, "?execution=visit-2");
    await waitForStartAndSettle(page);
    await expectStartedOnce(page, sim);

    const retries = (await sim.entries(isRetry("js"))).map(summary);
    if (browserName === "chromium") {
        expect(retries, "script retries that reached the server on visit 2").toEqual([{ attempt: 1, status: 200 }]);
    } else {
        // Firefox revalidates a cached 404 and WebKit may not have kept it, so more may arrive.
        expect(retries[retries.length - 1]).toEqual({ attempt: 1, status: 200 });
    }
});

test("mixed servers: plain 404 and two failed retries, the third retry loads within 3 s", async ({ page, sim }) => {
    await sim.reset({ js: { plain: 404, failFirstRetries: 2 }, css: { plain: 404, failFirstRetries: 2 } });

    await openThemePage(page);
    await waitForStartAndSettle(page);
    const state = await expectStartedOnce(page, sim);
    expect(state.boots[0], "ms from navigation to start").toBeLessThan(3000);
    await expectStylesheetApplied(page, sim, { retried: true });

    const entries = await sim.entries();
    const expected = [
        { attempt: 1, status: 404 },
        { attempt: 2, status: 404 },
        { attempt: 3, status: 200 }
    ];
    expect(entries.filter(isRetry("js")).map(summary)).toEqual(expected);
    expect(entries.filter(isRetry("css")).map(summary)).toEqual(expected);
});

test('a repeating "two 404s then one 200" edge: the page starts once and no notice is shown', async ({ page, sim }) => {
    await sim.reset({ js: { pattern: [404, 404, 200] }, css: { pattern: [404, 404, 200] } });

    await openThemePage(page);
    await waitForStartAndSettle(page);
    const state = await expectStartedOnce(page, sim);
    expect(state.noticeShownAt, "the notice was never shown").toBeNull();
    await expectStylesheetApplied(page, sim, { retried: true });

    const entries = await sim.entries();
    for (const kind of ["js", "css"] as const) {
        expect(entries.filter(entry => entry.kind === kind).map(e => ({ kcr: e.kcr === null ? null : attemptOf(e.kcr), status: e.status }))).toEqual([
            { kcr: null, status: 404 },
            { kcr: 1, status: 404 },
            { kcr: 2, status: 200 }
        ]);
    }
});

test("a slow original (script answers after 12 s) is waited for: one start, no retry, no notice", async ({ page, sim }) => {
    test.setTimeout(40_000);
    await sim.reset({ js: { plainDelayMs: 12_000 } });

    await openThemePage(page);
    await waitForStartAndSettle(page, 20_000);
    const state = await expectStartedOnce(page, sim);
    expect(state.boots[0], "ms from navigation to start").toBeGreaterThanOrEqual(12_000);
    expect(state.noticeShownAt, "the notice was never shown").toBeNull();
    await expect(notice(page)).toHaveCount(0);

    const scripts = await sim.entries(entry => entry.kind === "js");
    expect(scripts.map(e => ({ kcr: e.kcr, status: e.status, delayMs: e.delayMs }))).toEqual([
        { kcr: null, status: 200, delayMs: 12_000 }
    ]);
});

test("boot guard: a second copy of the bundle runs but does not render again", async ({ page, sim }) => {
    await openThemePage(page);
    await waitForStartAndSettle(page);
    await expectStartedOnce(page, sim);

    const outcome = await page.evaluate(src => {
        const script = document.createElement("script");
        script.type = "module";
        script.src = src;
        const done = new Promise<string>(resolve => {
            script.addEventListener("load", () => resolve("load"));
            script.addEventListener("error", () => resolve("error"));
        });
        document.head.appendChild(script);
        return done;
    }, SIM_ORIGIN + sim.info.scriptPath + "?again=1");
    expect(outcome, "the second copy loaded").toBe("load");
    await page.waitForTimeout(500);

    const state = await themeState(page, sim.info.scriptFile);
    expect(state.bundleRuns, "the second copy really ran").toBe(2);
    expect(state.boots, "only the first copy set the flag").toHaveLength(1);
    expect(state.headings).toBe(1);
    expect(state.rootChildren).toBe(1);
});

// ---------------------------------------------------------------------------------------------

function summary(entry: LogEntry) {
    return { attempt: attemptOf(entry.kcr), status: entry.status };
}

async function waitForStartAndSettle(page: Page, timeout = 10_000) {
    await waitForStart(page, timeout);
    // Long enough for a stray request or a second start to show up before anything is counted.
    await page.waitForTimeout(500);
}

/**
 * Chromium keeps the cached 404 and the cached retries and uses them without asking. Firefox
 * revalidates a cached 404 on a normal load, and whether WebKit reuses a failed subresource
 * depends on timing, so for them the test only asks that the page starts once (checked above).
 */
async function expectNoAssetRequests(sim: Simulator, browserName: string) {
    const assets = await sim.entries(isAsset);
    if (browserName === "chromium") {
        expect(assets, "asset requests that reached the server").toEqual([]);
    }
}
