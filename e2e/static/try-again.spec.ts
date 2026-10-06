/*
 * The notice's "Try again" button: location.replace() of the current address without its
 * fragment. It must reach the server as a GET for the same page (never a repeated form POST),
 * and the <base href> Keycloakify puts in the page must not send it anywhere else.
 */
import type { Page } from "@playwright/test";
import { ALL_404, expect, isPage, notice, test, themeState, type Simulator } from "../support/theme";
import { PAGE_PATH, SIM_ORIGIN } from "../support/constants.mjs";

const EVERYTHING_FAILS = { js: ALL_404, css: ALL_404 };

test("Try again asks for the same page and query, without the fragment and not under /resources/", async ({ page, sim }) => {
    test.setTimeout(40_000);
    await sim.reset(EVERYTHING_FAILS);

    await page.goto(PAGE_PATH + "?execution=abc#frag", { waitUntil: "commit" });
    await expect(notice(page)).toBeVisible({ timeout: 16_000 });
    expect((await sim.entries(isPage)).map(e => [e.method, e.path, e.query])).toEqual([["GET", PAGE_PATH, "execution=abc"]]);
    const historyBefore = (await themeState(page, sim.info.scriptFile)).historyLength;

    await clickTryAgain(page, sim, 2);

    expect((await sim.entries(isPage)).map(e => [e.method, e.path, e.query])).toEqual([
        ["GET", PAGE_PATH, "execution=abc"],
        ["GET", PAGE_PATH, "execution=abc"]
    ]);
    const url = new URL(page.url());
    expect(url.href).toBe(SIM_ORIGIN + PAGE_PATH + "?execution=abc");
    expect(url.hash).toBe("");
    expect(url.pathname).not.toContain("/resources/");
    // replace(), not assign(): the failed page does not stay in the history.
    expect((await themeState(page, sim.info.scriptFile)).historyLength).toBe(historyBefore);
});

test("on a page that answered a form POST, Try again sends a GET, not a second POST", async ({ page, sim }) => {
    test.setTimeout(40_000);
    await sim.reset(EVERYTHING_FAILS);

    // A sign-in form on the same origin posts to the page, as Keycloak's own forms do.
    await page.goto("/__sim/blank");
    await page.evaluate(action => {
        const form = document.createElement("form");
        form.method = "post";
        form.action = action;
        const field = document.createElement("input");
        field.name = "username";
        field.value = "e2e";
        const submit = document.createElement("button");
        submit.type = "submit";
        submit.textContent = "Sign in";
        form.append(field, submit);
        document.body.append(form);
    }, PAGE_PATH + "?execution=post-1");
    await Promise.all([
        page.waitForURL("**" + PAGE_PATH + "?execution=post-1", { waitUntil: "commit" }),
        page.getByRole("button", { name: "Sign in" }).click()
    ]);
    await expect(notice(page)).toBeVisible({ timeout: 16_000 });
    expect((await sim.entries(isPage)).map(e => e.method)).toEqual(["POST"]);

    await clickTryAgain(page, sim, 2);

    expect((await sim.entries(isPage)).map(e => [e.method, e.query])).toEqual([
        ["POST", "execution=post-1"],
        ["GET", "execution=post-1"]
    ]);
    expect(page.url()).toBe(SIM_ORIGIN + PAGE_PATH + "?execution=post-1");
});

/** Clicks the notice's button and waits until the server has seen the expected number of page requests. */
async function clickTryAgain(page: Page, sim: Simulator, pageRequests: number): Promise<void> {
    await notice(page).getByRole("button", { name: "Try again" }).click();
    await expect.poll(async () => (await sim.entries(isPage)).length, { message: "page requests after Try again" }).toBe(pageRequests);
    await page.waitForURL(url => !url.hash, { waitUntil: "commit" });
}
