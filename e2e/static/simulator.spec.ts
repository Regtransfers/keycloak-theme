/*
 * Checks on the test harness itself (no browser page): the edge simulator must keep serving the
 * page and the files the way Keycloak behind Cloudflare does, or every other spec here proves
 * less than it claims.
 */
import { expect, test } from "../support/theme";
import { ASSETS_PATH, PAGE_PATH, RESOURCES_PATH } from "../support/constants.mjs";

const ONE_YEAR = "max-age=31536000";

test("the page is served as Keycloak serves it: not cached, <base> first, loader before the assets, no Google Fonts", async ({
    request,
    sim
}) => {
    for (const method of ["get", "post"] as const) {
        const response = await request[method](PAGE_PATH + "?execution=abc");
        expect(response.status(), method).toBe(200);
        expect(response.headers()["content-type"]).toBe("text/html; charset=utf-8");
        expect(response.headers()["cache-control"]).toBe("no-store");

        const html = await response.text();
        const head = html.indexOf("<head>");
        const base = html.indexOf('<base href="' + RESOURCES_PATH + '"');
        const loader = html.indexOf("<script data-rt-asset-loader");
        const script = html.indexOf('src="' + sim.info.scriptPath + '"');
        const style = html.indexOf('href="' + sim.info.stylePath + '"');
        expect(head).toBeGreaterThan(-1);
        expect(html.slice(head + "<head>".length, base).trim(), "nothing between <head> and <base>").toBe("");
        expect(loader).toBeGreaterThan(base);
        expect(script).toBeGreaterThan(loader);
        expect(style).toBeGreaterThan(loader);
        expect(html).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
        expect(html).not.toMatch(/(src|href)="\/assets\//);
    }
    expect(sim.info.scriptPath.startsWith(ASSETS_PATH)).toBe(true);
    expect(sim.info.stylePath.startsWith(ASSETS_PATH)).toBe(true);
});

test("every asset answer carries a one-year max-age; a 404 is the empty answer production gives; anything else is a plain 404", async ({ request, sim }) => {
    await sim.reset({ js: { plain: 404 } });

    // As auth.regtransfers.co.uk answered for a file it does not have (06-10-2026): no body, no
    // content type. The empty body is what keeps the cached-404 tests reliable in the Chromium
    // headless shell (see the simulator).
    const plain404 = await request.get(sim.info.scriptPath);
    expect(plain404.status()).toBe(404);
    expect(plain404.headers()["cache-control"]).toBe(ONE_YEAR);
    expect(plain404.headers()["content-type"]).toBeUndefined();
    expect(plain404.headers()["content-length"]).toBe("0");
    expect(plain404.headers()["x-content-type-options"]).toBe("nosniff");
    expect(await plain404.text()).toBe("");

    const retried = await request.get(sim.info.scriptPath + "?kcr=1-abc");
    expect(retried.status()).toBe(200);
    expect(retried.headers()["cache-control"]).toBe(ONE_YEAR);
    expect(retried.headers()["content-type"]).toBe("text/javascript; charset=utf-8");

    const style = await request.get(sim.info.stylePath);
    expect(style.status()).toBe(200);
    expect(style.headers()["cache-control"]).toBe(ONE_YEAR);
    expect(style.headers()["content-type"]).toBe("text/css; charset=utf-8");

    // A file this build does not have: what an old server answered for the new bundle.
    const missing = await request.get(ASSETS_PATH + "index-n0tBu1lt.js");
    expect(missing.status()).toBe(404);
    expect(missing.headers()["cache-control"]).toBe(ONE_YEAR);

    const elsewhere = await request.get("/resources/abcde/login/keycloak-theme/other.js");
    expect(elsewhere.status()).toBe(404);
    expect(elsewhere.headers()["cache-control"]).toBeUndefined();

    expect((await sim.entries()).map(e => [e.kind, e.kcr, e.status])).toEqual([
        ["js", null, 404],
        ["js", "1-abc", 200],
        ["css", null, 200],
        ["js", null, 404],
        ["other", null, 404]
    ]);
});

test("rules answer deterministically, and a mistyped rule is refused", async ({ request, sim }) => {
    const statuses = async (paths: string[]) => {
        const result: number[] = [];
        for (const path of paths) {
            result.push((await request.get(path)).status());
        }
        return result;
    };
    const js = sim.info.scriptPath;

    await sim.reset({ js: { pattern: [404, 404, 200] } });
    expect(await statuses([js, js + "?kcr=1-a", js + "?kcr=2-b", js + "?kcr=3-c", js + "?kcr=4-d", js + "?kcr=5-e"])).toEqual([
        404, 404, 200, 404, 404, 200
    ]);

    await sim.reset({ js: { plain: 404, failFirstRetries: 2 } });
    expect(await statuses([js, js + "?kcr=1-a", js + "?kcr=2-b", js + "?kcr=3-c", js])).toEqual([404, 404, 404, 200, 404]);

    await sim.reset({ js: { outageMs: 1_000 } });
    expect(await statuses([js, js + "?kcr=1-a"])).toEqual([404, 404]);
    await new Promise(resolve => setTimeout(resolve, 1_100));
    expect(await statuses([js, js + "?kcr=2-b"])).toEqual([200, 200]);

    const refused = await request.post("/__sim/reset", { data: { js: { plian: 404 } } });
    expect(refused.status()).toBe(400);
    expect(await refused.json()).toEqual({ error: "unknown rule js.plian" });
});
