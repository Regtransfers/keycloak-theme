import fs from "node:fs";
import path from "node:path";
import {
    test as base,
    expect,
    type APIRequestContext,
    type Page,
    type Request,
    type Response,
    type Route
} from "@playwright/test";

/*
 * The built theme jar in a real Keycloak, started in production mode by .github/workflows/verify.yml:
 *
 *   KC_BASE_URL=http://127.0.0.1:8080 npm run e2e -- --project=keycloak-chromium
 *
 * Realms: e2e-realm.json and e2e-dark-realm.json in this directory, imported at start-up. This is the
 * only suite that sees what Keycloakify and FreeMarker make of the page: the <base> tag, the kcContext
 * script, Keycloak's resource addresses, and the script Keycloak adds to the answer to a form post.
 *
 * Every test intercepts requests (at the very least to refuse other hosts), and interception switches
 * off the browser's HTTP cache. Nothing here can show how cached responses behave: e2e/static does.
 */

const LIGHT_THEME = "keycloak-theme";
const DARK_THEME = "keycloak-theme-dark";
// Must match redirectUris in the realm files. No test completes a sign-in, so nothing is sent there.
const REDIRECT_URI = "http://127.0.0.1:8080/e2e-callback";
const NOTICE = "[data-rt-asset-notice]";
const STORE_PREFIX = "rt-theme-asset:";
const NOTICE_TITLE = "This page is taking longer than usual to load";

/** The authorisation endpoint. With the stock browser flow Keycloak answers with login.ftl. */
function authPath(realm: string, clientId = "e2e-client"): string {
    const query = new URLSearchParams({
        client_id: clientId,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: "openid"
    });
    return `/realms/${realm}/protocol/openid-connect/auth?${query.toString()}`;
}

const test = base.extend<{ guardPage: void }>({
    guardPage: [
        async ({ page, baseURL }, use) => {
            if (!baseURL) {
                throw new Error("No baseURL: run this file through the keycloak-chromium project (set KC_BASE_URL).");
            }
            const origin = new URL(baseURL).origin;
            // Nothing leaves the machine: the logo (on a regtransfers host) and Google Fonts are refused
            // before a request is made. The loader must ignore those failures, being cross-origin.
            await page.context().route(
                url => url.origin !== origin,
                route => route.abort("blockedbyclient")
            );
            const errors: string[] = [];
            page.on("pageerror", error => errors.push(error.stack ?? error.message));
            await use();
            expect(errors, "uncaught errors in the page").toEqual([]);
        },
        { auto: true }
    ]
});

// ---------------------------------------------------------------------------------------------
// The theme's files and the loader's retries
// ---------------------------------------------------------------------------------------------

type AssetKind = "script" | "style";

type AssetRequest = {
    url: URL;
    kind: AssetKind | null;
    attempt: number | null;
    request: Request;
};

/** The theme's own built files, at their plain address or a retry address. */
function isThemeAsset(url: URL): boolean {
    return url.pathname.includes("/dist/assets/");
}

function kindOf(url: URL): AssetKind | null {
    if (url.pathname.endsWith(".js")) {
        return "script";
    }
    return url.pathname.endsWith(".css") ? "style" : null;
}

/**
 * The attempt number at the front of a kcr value ("2-lx3k9a1q" is attempt 2), or null for a plain
 * address. Each test has a fresh browser context, so there is never a remembered token from an
 * earlier page whose number would not match.
 */
function attemptOf(url: URL): number | null {
    const token = url.searchParams.get("kcr");
    if (token === null) {
        return null;
    }
    const match = /^(\d+)-[a-z0-9]+$/.exec(token);
    return match ? Number(match[1]) : Number.NaN;
}

/** What the loader stores after a retry address loads: "<file name>|<token>". */
function memoryOf(url: URL): string {
    return `${url.pathname.split("/").pop()}|${url.searchParams.get("kcr")}`;
}

/** What Cloudflare served on 05-10-2026: a 404 that says it may be kept for a year. */
function answerLikeTheEdge(route: Route): Promise<void> {
    return route.fulfill({
        status: 404,
        headers: { "content-type": "text/html", "cache-control": "max-age=31536000" },
        body: "<!doctype html><title>404 Not Found</title>"
    });
}

/** Theme files for which shouldFail is true get the edge's 404; everything else goes to Keycloak. */
async function failThemeAssets(page: Page, shouldFail: (url: URL) => boolean): Promise<() => Promise<void>> {
    const matcher = (url: URL) => isThemeAsset(url) && shouldFail(url);
    await page.route(matcher, answerLikeTheEdge);
    return () => page.unroute(matcher, answerLikeTheEdge);
}

/** Every request for a theme file from now on, in order. */
function logThemeAssetRequests(page: Page): AssetRequest[] {
    const seen: AssetRequest[] = [];
    page.on("request", request => {
        const url = new URL(request.url());
        if (isThemeAsset(url)) {
            seen.push({ url, kind: kindOf(url), attempt: attemptOf(url), request });
        }
    });
    return seen;
}

function retriesOf(seen: AssetRequest[], kind: AssetKind): AssetRequest[] {
    return seen.filter(asset => asset.kind === kind && asset.attempt !== null);
}

async function statusOf(asset: AssetRequest): Promise<number | null> {
    const response = await asset.request.response();
    return response ? response.status() : null;
}

/** The data-rt-asset-retry numbers on the elements the loader added, in document order. */
async function retryMarks(page: Page, kind: AssetKind): Promise<string[]> {
    const selector =
        kind === "script"
            ? 'script[type="module"][data-rt-asset-retry]'
            : 'link[rel="stylesheet"][data-rt-asset-retry]';
    return page
        .locator(selector)
        .evaluateAll(elements => elements.map(element => element.getAttribute("data-rt-asset-retry") ?? ""));
}

async function remembered(page: Page): Promise<{ script: string | null; style: string | null }> {
    return page.evaluate(
        prefix => ({
            script: window.localStorage.getItem(prefix + "script"),
            style: window.localStorage.getItem(prefix + "style")
        }),
        STORE_PREFIX
    );
}

async function hasBooted(page: Page): Promise<boolean> {
    return page.evaluate(() => (window as unknown as { __rtThemeBooted?: unknown }).__rtThemeBooted === true);
}

/** The sign-in form is up, the bundle started and the stylesheet applies. */
async function expectSignInPage(page: Page): Promise<void> {
    await expect(page.locator("input#username")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("button#kc-login")).toBeVisible();
    // Proof that the stylesheet applies, not just the script: the button is inline-flex inside a
    // flex-column form, which computes to "flex". Without the stylesheet it is "inline-block".
    await expect(page.locator("button#kc-login")).toHaveCSS("display", "flex");
    expect(await hasBooted(page), "window.__rtThemeBooted").toBe(true);
    await expect(page.locator(NOTICE)).toHaveCount(0);
}

/** The sign-in page again, with Keycloak's "invalid username or password" on the field. */
async function expectSignInError(page: Page): Promise<void> {
    // Login.tsx sets aria-invalid when Keycloak reports a username or password error.
    await expect(page.locator("input#username")).toHaveAttribute("aria-invalid", "true", { timeout: 15_000 });
    await expectSignInPage(page);
}

/**
 * Submits the sign-in form with an address no account has, and returns Keycloak's answer to the
 * POST once the browser has committed to the page it carries.
 */
async function submitSignIn(page: Page): Promise<Response> {
    await page.locator("input#username").fill("nobody@e2e.invalid");
    const [answer] = await Promise.all([
        page.waitForResponse(
            response =>
                response.request().method() === "POST" &&
                new URL(response.url()).pathname.endsWith("/login-actions/authenticate")
        ),
        page.waitForEvent("framenavigated", { predicate: frame => frame === page.mainFrame() }),
        page.locator("button#kc-login").click()
    ]);
    return answer;
}

// ---------------------------------------------------------------------------------------------
// The page as Keycloak serves it
// ---------------------------------------------------------------------------------------------

type Element = {
    name: string;
    attrs: Map<string, string>;
    start: number;
    end: number;
    content: string;
};

const ENTITIES: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", "#39": "'" };

function parseAttributes(source: string): Map<string, string> {
    const attrs = new Map<string, string>();
    const attribute = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    for (let match = attribute.exec(source); match !== null; match = attribute.exec(source)) {
        const name = match[1].toLowerCase();
        const value = match[2] ?? match[3] ?? match[4] ?? "";
        if (!attrs.has(name)) {
            const decoded = value.replace(/&(amp|quot|apos|lt|gt|#39);/g, (whole, entity: string) => ENTITIES[entity] ?? whole);
            attrs.set(name, decoded);
        }
    }
    return attrs;
}

/**
 * A small tokeniser, enough for the pages Keycloak serves: start tags with their attributes, and the
 * raw text of script and style elements, which runs to the first matching end tag whatever it
 * contains. Comments are skipped. Positions are offsets into the HTML.
 */
function parseDocument(html: string): { elements: Element[]; headEnd: number } {
    const elements: Element[] = [];
    let headEnd = -1;
    const tag = /<!--|<(\/?)([A-Za-z][A-Za-z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
    for (let match = tag.exec(html); match !== null; match = tag.exec(html)) {
        if (match[0] === "<!--") {
            const close = html.indexOf("-->", tag.lastIndex);
            tag.lastIndex = close === -1 ? html.length : close + 3;
            continue;
        }
        const name = match[2].toLowerCase();
        if (match[1] === "/") {
            if (name === "head" && headEnd === -1) {
                headEnd = match.index;
            }
            continue;
        }
        const element: Element = {
            name,
            attrs: parseAttributes(match[3]),
            start: match.index,
            end: tag.lastIndex,
            content: ""
        };
        if (name === "script" || name === "style") {
            const closing = new RegExp(`</${name}\\s*>`, "gi");
            closing.lastIndex = tag.lastIndex;
            const close = closing.exec(html);
            element.content = html.slice(tag.lastIndex, close ? close.index : html.length);
            element.end = close ? closing.lastIndex : html.length;
            tag.lastIndex = element.end;
        }
        elements.push(element);
    }
    return { elements, headEnd };
}

function hasWord(list: string | undefined, word: string): boolean {
    return ` ${(list ?? "").toLowerCase()} `.includes(` ${word} `);
}

function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Where Keycloak serves a theme's built files: /resources/<version tag>/login/<theme>/dist/. */
function distPattern(theme: string, rest: string): RegExp {
    return new RegExp(`^/resources/[^/]+/login/${escapeRegExp(theme)}/dist/${rest}$`);
}

function loaderSource(): string {
    // The project's testDir is e2e/keycloak; the loader lives at src/loader/ from the repository root.
    const file = path.resolve(test.info().project.testDir, "..", "..", "src", "loader", "assetRetry.js");
    return fs.readFileSync(file, "utf8").replace(/\r\n?/g, "\n");
}

/** Fails with the text around the first occurrence, rather than printing the whole page. */
function expectAbsent(text: string, needle: string, where: string): void {
    const at = text.indexOf(needle);
    const context = at === -1 ? "" : `: ${JSON.stringify(text.slice(Math.max(0, at - 80), at + 80))}`;
    expect(at, `"${needle}" ${where}${context}`).toBe(-1);
}

type ServedPage = {
    headEnd: number;
    loader: Element;
    moduleScript: Element;
    stylesheet: Element;
    scriptUrl: URL;
    stylesheetUrl: URL;
};

/**
 * Checks the raw HTML Keycloak served (never page.content(), which is the live DOM after scripts ran)
 * and returns the parts the tests need.
 */
function inspectServedPage(html: string, documentUrl: string, theme: string): ServedPage {
    const origin = new URL(documentUrl).origin;
    const { elements, headEnd } = parseDocument(html);
    expect(headEnd, "a closing head tag").toBeGreaterThan(0);
    expectAbsent(html, "FreeMarker template error", "in the page");

    const scripts = elements.filter(element => element.name === "script");
    const kcContextScript = scripts.find(
        element => !element.attrs.has("src") && element.content.includes("window.kcContext")
    );
    if (!kcContextScript) {
        throw new Error("No Keycloakify kcContext script in the served page");
    }

    const bases = elements.filter(element => element.name === "base");
    expect(bases, "one <base> tag").toHaveLength(1);
    const baseUrl = new URL(bases[0].attrs.get("href") ?? "", documentUrl);
    expect(baseUrl.origin, "<base href> origin").toBe(origin);
    expect(baseUrl.pathname, "<base href> path").toMatch(distPattern(theme, ""));

    const loaders = scripts.filter(element => element.attrs.has("data-rt-asset-loader"));
    expect(loaders, "one loader script").toHaveLength(1);
    const loader = loaders[0];
    expect(loader.start, "the loader comes after <base>").toBeGreaterThan(bases[0].start);
    expect(loader.content.replace(/\r\n?/g, "\n").trim(), "the loader, unaltered by Keycloakify and FreeMarker").toBe(
        loaderSource().trim()
    );

    const stylesheets = elements.filter(
        element => element.name === "link" && hasWord(element.attrs.get("rel"), "stylesheet")
    );
    expect(stylesheets.length, "stylesheet links").toBeGreaterThan(0);
    expect(loader.end, "the loader comes before the first stylesheet link").toBeLessThan(stylesheets[0].start);

    const moduleScripts = scripts.filter(element => (element.attrs.get("type") ?? "").toLowerCase() === "module");
    expect(moduleScripts, "one module script").toHaveLength(1);
    const moduleScript = moduleScripts[0];
    expect(loader.end, "the loader comes before the module script").toBeLessThan(moduleScript.start);
    const scriptUrl = new URL(moduleScript.attrs.get("src") ?? "", baseUrl);
    expect(scriptUrl.origin, "module script origin").toBe(origin);
    expect(scriptUrl.pathname, "module script path").toMatch(distPattern(theme, "assets/[^/]+\\.js"));

    const ownStylesheets = stylesheets.filter(
        element => new URL(element.attrs.get("href") ?? "", baseUrl).origin === origin
    );
    expect(ownStylesheets, "one same-origin stylesheet").toHaveLength(1);
    const stylesheet = ownStylesheets[0];
    const stylesheetUrl = new URL(stylesheet.attrs.get("href") ?? "", baseUrl);
    expect(stylesheetUrl.pathname, "stylesheet path").toMatch(distPattern(theme, "assets/[^/]+\\.css"));

    // FreeMarker syntax left in the output. Keycloakify's kcContext script is the one place where
    // these sequences can be legitimate: it is server data written out with ?js_string, which leaves
    // "$" and "#" alone, and Keycloak's own data uses "${...}" for message keys (user-profile display
    // names such as "${firstName}"). So: outside that script, none of them; inside it, no directive
    // syntax, which can only be a directive FreeMarker did not run.
    const outsideKcContext = html.slice(0, kcContextScript.start) + html.slice(kcContextScript.end);
    for (const leftover of ["${", "#{", "<#", "</#", "<@", "</@"]) {
        expectAbsent(outsideKcContext, leftover, "outside the kcContext script");
    }
    for (const directive of ["<#", "</#", "<@", "</@"]) {
        expectAbsent(kcContextScript.content, directive, "inside the kcContext script");
    }

    return { headEnd, loader, moduleScript, stylesheet, scriptUrl, stylesheetUrl };
}

async function fetchServedPage(
    request: APIRequestContext,
    address: string,
    theme: string
): Promise<{ status: number; served: ServedPage }> {
    const response = await request.get(address);
    return { status: response.status(), served: inspectServedPage(await response.text(), response.url(), theme) };
}

// ---------------------------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------------------------

test("the sign-in page renders through the theme, from a page in the right shape", async ({ page, request }) => {
    const assets = logThemeAssetRequests(page);
    const response = await page.goto(authPath("e2e"));
    expect(response?.status(), "sign-in page status").toBe(200);
    await expectSignInPage(page);

    const { status, served } = await fetchServedPage(request, authPath("e2e"), LIGHT_THEME);
    expect(status, "sign-in page status (request context)").toBe(200);

    // A healthy load: the two files the page names, each at one address, no retry, nothing remembered.
    expect(
        assets.filter(asset => asset.attempt !== null).map(asset => asset.url.href),
        "retry requests on a healthy load"
    ).toEqual([]);
    const scriptAddresses = new Set(assets.filter(asset => asset.kind === "script").map(asset => asset.url.href));
    const styleAddresses = new Set(assets.filter(asset => asset.kind === "style").map(asset => asset.url.href));
    expect([...scriptAddresses]).toEqual([served.scriptUrl.href]);
    expect([...styleAddresses]).toEqual([served.stylesheetUrl.href]);
    for (const asset of assets) {
        expect(await statusOf(asset), asset.url.pathname).toBe(200);
    }
    expect(await retryMarks(page, "script")).toEqual([]);
    expect(await retryMarks(page, "style")).toEqual([]);
    expect(await remembered(page)).toEqual({ script: null, style: null });
});

test("plain addresses answered with a year-long 404: both files load from their first retry", async ({ page }) => {
    const assets = logThemeAssetRequests(page);
    await failThemeAssets(page, url => attemptOf(url) === null);

    await page.goto(authPath("e2e"), { waitUntil: "domcontentloaded" });
    await expectSignInPage(page);

    const scriptRetries = retriesOf(assets, "script");
    const styleRetries = retriesOf(assets, "style");
    expect(scriptRetries.map(asset => asset.attempt), "script retry attempts").toEqual([1]);
    expect(styleRetries.map(asset => asset.attempt), "stylesheet retry attempts").toEqual([1]);
    expect(await statusOf(scriptRetries[0])).toBe(200);
    expect(await statusOf(styleRetries[0])).toBe(200);
    expect(await retryMarks(page, "script")).toEqual(["1"]);
    expect(await retryMarks(page, "style")).toEqual(["1"]);
    // The address that worked is remembered for this file name, for the next page.
    await expect
        .poll(() => remembered(page))
        .toEqual({ script: memoryOf(scriptRetries[0].url), style: memoryOf(styleRetries[0].url) });
});

test("the first two script retries fail as well: the third loads it", async ({ page }) => {
    const assets = logThemeAssetRequests(page);
    await failThemeAssets(page, url => {
        const attempt = attemptOf(url);
        return attempt === null || (kindOf(url) === "script" && attempt <= 2);
    });

    await page.goto(authPath("e2e"), { waitUntil: "domcontentloaded" });
    await expectSignInPage(page);

    const scriptRetries = retriesOf(assets, "script");
    expect(scriptRetries.map(asset => asset.attempt), "script retry attempts").toEqual([1, 2, 3]);
    expect(new Set(scriptRetries.map(asset => asset.url.href)).size, "a new address every attempt").toBe(3);
    expect(await statusOf(scriptRetries[2])).toBe(200);
    expect(retriesOf(assets, "style").map(asset => asset.attempt), "stylesheet retry attempts").toEqual([1]);
    expect(await retryMarks(page, "script")).toEqual(["1", "2", "3"]);
    await expect.poll(async () => (await remembered(page)).script).toBe(memoryOf(scriptRetries[2].url));
});

test("every theme file fails: the notice appears, and Try again reloads the sign-in address", async ({ page }) => {
    // Six attempts take about 10.6 s before the notice, then a reload.
    test.setTimeout(60_000);
    let navigations = 0;
    page.on("request", request => {
        if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
            navigations += 1;
        }
    });
    const restore = await failThemeAssets(page, () => true);

    await page.goto(authPath("e2e"), { waitUntil: "domcontentloaded" });
    const signInUrl = new URL(page.url());

    const notice = page.locator(NOTICE);
    await expect(notice).toBeVisible({ timeout: 15_000 });
    await expect(notice).toHaveCount(1);
    await expect(notice).toHaveAttribute("role", "alert");
    await expect(notice).toContainText(NOTICE_TITLE);
    expect(await hasBooted(page), "window.__rtThemeBooted").toBe(false);
    expect(navigations, "the loader never reloads the page by itself").toBe(1);

    // Keycloakify's <base href> points into /resources/.../dist/, so a reload built from a relative
    // address would land there. With the files back, the reload must be the sign-in page again.
    await restore();
    const [reload] = await Promise.all([
        page.waitForRequest(request => request.isNavigationRequest() && request.frame() === page.mainFrame()),
        notice.getByRole("button", { name: "Try again" }).click()
    ]);
    const landed = new URL(reload.url());
    expect(reload.method()).toBe("GET");
    expect(landed.pathname, "not under the <base href>").not.toMatch(/^\/resources\//);
    expect(landed.origin + landed.pathname + landed.search, "the same sign-in address").toBe(
        signInUrl.origin + signInUrl.pathname + signInUrl.search
    );
    await expectSignInPage(page);
    expect(navigations).toBe(2);
});

test("the answer to a form post loads, and Keycloak's script sits in the real head", async ({ page }) => {
    await page.goto(authPath("e2e"));
    await expectSignInPage(page);

    const answer = await submitSignIn(page);
    const html = await answer.text();
    const served = inspectServedPage(html, answer.url(), LIGHT_THEME);
    // Keycloak puts a history.replaceState script in front of the first "</head>" of a 200 answer to a
    // POST. If the loader's text contained that sequence, the script would land inside the loader.
    const injected = html.indexOf("history.replaceState");
    expect(injected, `Keycloak's history script in the answer (status ${answer.status()})`).toBeGreaterThan(-1);
    expect(served.loader.content.includes("history.replaceState"), "Keycloak's script inside the loader").toBe(false);
    expect(injected, "Keycloak's script comes after the stylesheet tag").toBeGreaterThan(served.stylesheet.end);
    expect(injected, "Keycloak's script comes after the module script tag").toBeGreaterThan(served.moduleScript.end);
    expect(injected, "Keycloak's script comes before </head>").toBeLessThan(served.headEnd);
    await expectSignInError(page);

    // The same post while the plain addresses fail, as during a release.
    const assets = logThemeAssetRequests(page);
    await failThemeAssets(page, url => attemptOf(url) === null);
    const second = await submitSignIn(page);
    expect(second.request().method()).toBe("POST");
    await expectSignInError(page);
    expect(retriesOf(assets, "script").map(asset => asset.attempt), "script retry attempts").toEqual([1]);
    expect(retriesOf(assets, "style").map(asset => asset.attempt), "stylesheet retry attempts").toEqual([1]);
});

test("another page (error.ftl, unknown client) starts and carries the loader", async ({ page, request }) => {
    const address = authPath("e2e", "e2e-no-such-client");
    const response = await page.goto(address);
    const status = response?.status() ?? 0;
    expect(status >= 400 && status < 500, `error page status ${status}`).toBe(true);

    // Error.tsx's own wording. The automatic hand-off to the website happens only on
    // *.regtransfers.* hosts, so the page stays put here.
    await expect(page.getByText("We are sorry, but an error has occurred.")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Return to sign in" })).toBeVisible();
    expect(await hasBooted(page), "window.__rtThemeBooted").toBe(true);
    expect(new URL(page.url()).pathname).toBe(new URL(address, page.url()).pathname);

    const fetched = await fetchServedPage(request, address, LIGHT_THEME);
    expect(fetched.status, "error page status (request context)").toBe(status);
});

test("the dark realm renders the dark variant", async ({ page, request }) => {
    const assets = logThemeAssetRequests(page);
    const response = await page.goto(authPath("e2e-dark"));
    expect(response?.status(), "sign-in page status").toBe(200);
    await expectSignInPage(page);
    await expect(page.locator("body")).toHaveClass(/(^|\s)dark(\s|$)/);

    expect(assets.length, "theme file requests").toBeGreaterThan(0);
    for (const asset of assets) {
        expect(asset.url.pathname).toContain(`/login/${DARK_THEME}/dist/assets/`);
    }
    const { status } = await fetchServedPage(request, authPath("e2e-dark"), DARK_THEME);
    expect(status).toBe(200);
});

test("for the record: how Keycloak answers for theme files", async ({ request }) => {
    const { served } = await fetchServedPage(request, authPath("e2e"), LIGHT_THEME);
    const withProbe = new URL(served.scriptUrl);
    withProbe.searchParams.set("kcr", "1-probe");
    const madeUp = new URL(served.scriptUrl);
    madeUp.pathname = madeUp.pathname.replace(/[^/]+$/, `e2e-missing-${Date.now()}.js`);

    const probes = [
        { label: "script", url: served.scriptUrl.href, expected: 200 },
        { label: "script ?kcr=1-probe", url: withProbe.href, expected: 200 },
        { label: "stylesheet", url: served.stylesheetUrl.href, expected: 200 },
        { label: "made-up file", url: madeUp.href, expected: 404 }
    ];
    const bodies = new Map<string, Buffer>();
    for (const probe of probes) {
        const response = await request.get(probe.url, { maxRedirects: 0 });
        const headers = response.headers();
        const address = new URL(probe.url);
        const line =
            `${probe.label}: ${response.status()}, cache-control: ${headers["cache-control"] ?? "(none)"}, ` +
            `content-type: ${headers["content-type"] ?? "(none)"} (${address.pathname}${address.search})`;
        console.log(line);
        test.info().annotations.push({ type: "keycloak-response", description: line });
        expect.soft(response.status(), probe.label).toBe(probe.expected);
        bodies.set(probe.label, await response.body());
    }
    // Keycloak ignores the query string on theme files: the retry address is the same file.
    expect.soft(bodies.get("script ?kcr=1-probe")?.equals(bodies.get("script") ?? Buffer.alloc(0))).toBe(true);
});
