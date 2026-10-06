import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parse } from "acorn";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

/*
 * The loader is tested as the text that ships: the file is read from disk and evaluated in a fresh
 * jsdom window per test, exactly as the browser evaluates the inlined script. Timers and the clock
 * are replaced so the retry schedule can be stepped through.
 *
 * What cannot be proved here (jsdom fetches nothing and cannot navigate) is proved in a real
 * browser by e2e/: that a retried script actually loads and runs once, the HTTP cache behaviour,
 * and the "Try again" navigation.
 */

const source = readFileSync(fileURLToPath(new URL("./assetRetry.js", import.meta.url)), "utf8");

const PAGE_URL = "https://auth.example.test/realms/e2e/login-actions/authenticate?execution=abc";
const ASSETS = "https://auth.example.test/resources/abcde/login/keycloak-theme/dist/assets/";
const SCRIPT = ASSETS + "index-AAAA1111.js";
const STYLE = ASSETS + "index-BBBB2222.css";
const QUICK = [0, 300, 800, 1500, 3000, 5000];

type Timer = { id: number; at: number; fn: () => void };

function setUp(options: { storage?: "ok" | "throws-on-read" | "throws-on-write"; run?: boolean } = {}) {
    const dom = new JSDOM(
        `<!doctype html><html><head>` +
            `<script type="module" crossorigin="" src="${SCRIPT}"></script>` +
            `<link rel="stylesheet" crossorigin="" href="${STYLE}">` +
            `</head><body><div id="root"></div></body></html>`,
        { url: PAGE_URL, runScripts: "outside-only", pretendToBeVisual: true }
    );
    const window = dom.window as unknown as Window & typeof globalThis & Record<string, unknown>;
    const document = window.document;

    // A clock and timer queue under the test's control.
    let nowMs = 1_800_000_000_000;
    let nextId = 1;
    let timers: Timer[] = [];

    window.setTimeout = ((fn: () => void, delay?: number) => {
        const id = nextId++;
        timers.push({ id, at: nowMs + (delay ?? 0), fn });
        return id;
    }) as unknown as typeof window.setTimeout;
    window.clearTimeout = ((id: number) => {
        timers = timers.filter(timer => timer.id !== id);
    }) as unknown as typeof window.clearTimeout;

    const RealDate = window.Date;
    window.Date = class extends RealDate {
        getTime() {
            return nowMs;
        }
    } as DateConstructor;

    if (options.storage === "throws-on-read") {
        Object.defineProperty(window, "localStorage", {
            configurable: true,
            get() {
                throw new Error("SecurityError");
            }
        });
    } else if (options.storage === "throws-on-write") {
        window.Storage.prototype.setItem = () => {
            throw new Error("QuotaExceededError");
        };
    }

    /** Move the clock forward, running every timer that falls due, in order. */
    function advance(ms: number) {
        const end = nowMs + ms;

        for (;;) {
            const due = timers.filter(timer => timer.at <= end).sort((a, b) => a.at - b.at || a.id - b.id)[0];

            if (!due) {
                break;
            }

            timers = timers.filter(timer => timer !== due);
            nowMs = Math.max(nowMs, due.at);
            due.fn();
        }

        nowMs = end;
    }

    const original = {
        script: document.querySelector<HTMLScriptElement>("script[type=module]")!,
        style: document.querySelector<HTMLLinkElement>("link[rel=stylesheet]")!
    };

    const retries = (kind: "script" | "link") =>
        Array.from(document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(`${kind}[data-rt-asset-retry]`));
    const address = (el: Element) => (el as HTMLScriptElement).src || (el as HTMLLinkElement).href;
    const token = (el: Element) => new URL(address(el)).searchParams.get("kcr");
    const fail = (el: Element) => el.dispatchEvent(new window.Event("error"));
    const succeed = (el: Element) => el.dispatchEvent(new window.Event("load"));
    const notice = () => document.querySelector("[data-rt-asset-notice]");
    const noticeLine = () => notice()?.querySelectorAll("p")[1]?.textContent ?? null;
    const run = () => window.eval(source);

    // jsdom reports an exception thrown inside an event listener as an ErrorEvent on the window.
    const uncaught: unknown[] = [];
    window.addEventListener("error", event => {
        if (event.target === window && "error" in event) {
            uncaught.push((event as ErrorEvent).error);
        }
    });

    /**
     * Fail the original and then each retry as it is made, until `count` loads have failed in all.
     * The next attempt is left waiting on its timer.
     */
    function failScript(count: number) {
        fail(original.script);

        for (let made = 0; made < count - 1; made += 1) {
            advance(made < QUICK.length ? QUICK[made] : 20_000);
            fail(retries("script")[made]);
        }
    }

    if (options.run !== false) {
        run();
    }

    return {
        window,
        document,
        original,
        retries,
        address,
        token,
        fail,
        succeed,
        notice,
        noticeLine,
        advance,
        run,
        failScript,
        uncaught,
        pending: () => timers.length
    };
}

describe("the loader as text", () => {
    it("contains nothing FreeMarker, the HTML parser, Keycloak or the build tools would act on", () => {
        const forbidden: [string, RegExp][] = [
            ["FreeMarker interpolation", /\$\{|#\{/],
            ["FreeMarker directive", /<\/?[#@]/],
            ["a closing script, head or body tag", /<\/(script|head|body)/i],
            ["an HTML comment or script opener", /<!--|<script/i],
            ["a template string", /`/],
            ["a dollar sign (special in string replacement)", /\$/],
            ["a percent sign (Vite replaces %NAME% in HTML)", /%/],
            ["doubled braces (Keycloakify placeholders)", /\{\{|\}\}/],
            ["a quoted asset path (Keycloakify rewrites those)", /["']\/?assets\/[^"'\s]+["']/],
            ["an href attribute (a relative link would resolve against the <base> tag)", /href\s*=\s*["']/],
            ["a dynamic import", /\bimport\s*\(/],
            // eslint-disable-next-line no-control-regex
            ["a non-ASCII character", /[^\x09\x0a\x20-\x7e]/]
        ];

        for (const [what, pattern] of forbidden) {
            expect(pattern.test(source), `the loader must not contain ${what}`).toBe(false);
        }
    });

    it("is ES5: it must parse in any browser that can parse the page", () => {
        expect(() => parse(source, { ecmaVersion: 5, sourceType: "script" })).not.toThrow();
    });

    it("uses LF line endings, so the copy in the page can be compared byte for byte", () => {
        expect(source.includes("\r")).toBe(false);
    });
});

describe("what it reacts to", () => {
    it("does nothing while everything loads", () => {
        const page = setUp();

        page.succeed(page.original.script);
        page.succeed(page.original.style);
        page.advance(10_000);

        expect(page.retries("script")).toHaveLength(0);
        expect(page.retries("link")).toHaveLength(0);
        expect(page.window.localStorage.length).toBe(0);
    });

    it("ignores errors from anything that is not this theme's bundle or stylesheet", () => {
        const page = setUp();
        const { document } = page;
        const others: Element[] = [];

        const classic = document.createElement("script");
        classic.src = ASSETS + "classic.js";
        const elsewhere = document.createElement("script");
        elsewhere.type = "module";
        elsewhere.src = "https://cdn.example.test/assets/other.js";
        const notAsset = document.createElement("script");
        notAsset.type = "module";
        notAsset.src = "https://auth.example.test/resources/abcde/common/keycloak/authChecker.js";
        const icon = document.createElement("link");
        icon.rel = "icon";
        icon.href = ASSETS + "favicon.css";
        const fonts = document.createElement("link");
        fonts.rel = "stylesheet";
        fonts.href = "https://fonts.googleapis.com/css2?family=Roboto";
        const cdnStyle = document.createElement("link");
        cdnStyle.rel = "stylesheet";
        cdnStyle.href = "https://cdn.example.test/assets/other.css";
        const notAssetStyle = document.createElement("link");
        notAssetStyle.rel = "stylesheet";
        notAssetStyle.href = "https://auth.example.test/resources/abcde/common/keycloak/patternfly.css";
        const image = document.createElement("img");
        image.src = ASSETS + "logo.png";

        for (const el of [classic, elsewhere, notAsset, icon, fonts, cdnStyle, notAssetStyle, image]) {
            document.head.appendChild(el);
            others.push(el);
        }

        // The page has not started: once it has, the loader makes no script attempt whatever the
        // filter says, and this test would prove nothing about scripts.
        others.forEach(page.fail);
        // A runtime error reaches the same listener with the window as its target.
        page.window.dispatchEvent(new page.window.Event("error"));
        // Short of the 20 s watchdog, which shows the notice on a page that has not started.
        page.advance(19_000);

        expect(document.querySelectorAll("[data-rt-asset-retry]")).toHaveLength(0);
        expect(page.notice()).toBeNull();
    });
});

describe("retrying the bundle", () => {
    it("asks again at once, at a new address, with a new element in the same place", () => {
        const page = setUp();

        page.fail(page.original.script);
        page.advance(0);

        const [retry] = page.retries("script");

        expect(page.retries("script")).toHaveLength(1);
        expect(retry.getAttribute("type")).toBe("module");
        expect(retry.getAttribute("crossorigin")).toBe("");
        expect(retry.getAttribute("data-rt-asset-retry")).toBe("1");
        expect(page.address(retry).split("?")[0]).toBe(SCRIPT);
        expect(page.token(retry)).toMatch(/^1-[a-z0-9]+$/);
        expect(page.original.script.nextElementSibling).toBe(retry);
        expect(page.address(page.original.script)).toBe(SCRIPT);
    });

    it("keeps any query string the address already had", () => {
        const page = setUp({ run: false });

        page.original.script.src = SCRIPT + "?v=7";
        page.run();
        page.fail(page.original.script);
        page.advance(0);

        const url = new URL(page.address(page.retries("script")[0]));

        expect(url.searchParams.get("v")).toBe("7");
        expect(url.searchParams.get("kcr")).toMatch(/^1-/);
    });

    it("makes one attempt at a time, on the schedule, each at a different address", () => {
        const page = setUp();

        page.fail(page.original.script);
        page.advance(0);
        expect(page.retries("script")).toHaveLength(1);

        // Nothing more happens until that attempt has failed.
        page.advance(60_000);
        expect(page.retries("script")).toHaveLength(1);

        for (let made = 1; made < QUICK.length; made += 1) {
            page.fail(page.retries("script")[made - 1]);
            page.advance(QUICK[made] - 1);
            expect(page.retries("script"), `attempt ${made + 1} must wait ${QUICK[made]} ms`).toHaveLength(made);
            page.advance(1);
            expect(page.retries("script")).toHaveLength(made + 1);
        }

        const tokens = page.retries("script").map(page.token);

        expect(new Set(tokens).size).toBe(QUICK.length);
        expect(tokens.map(value => value!.split("-")[0])).toEqual(["1", "2", "3", "4", "5", "6"]);
    });

    it("ignores an error from anything but the attempt it is waiting for", () => {
        const page = setUp();

        page.fail(page.original.script);
        page.advance(0);
        // The original reporting again, and a stray second tag for the same file.
        page.fail(page.original.script);
        const twin = page.document.createElement("script");
        twin.type = "module";
        twin.src = SCRIPT;
        page.document.head.appendChild(twin);
        page.fail(twin);
        page.advance(60_000);

        expect(page.retries("script")).toHaveLength(1);
    });

    it("stops as soon as an attempt loads, and remembers what worked for that file", () => {
        const page = setUp();

        page.fail(page.original.script);
        page.advance(0);
        page.fail(page.retries("script")[0]);
        page.advance(300);

        const second = page.retries("script")[1];

        // As in a browser: the bundle runs, setting the flag (src/main.tsx), and then "load" fires.
        page.window.__rtThemeBooted = true;
        page.succeed(second);
        page.fail(second);
        page.advance(600_000);

        expect(page.retries("script")).toHaveLength(2);
        expect(page.window.localStorage.getItem("rt-theme-asset:script")).toBe("index-AAAA1111.js|" + page.token(second));
        expect(page.notice()).toBeNull();
        expect(page.pending()).toBe(0);
    });

    it("does not remember an address that loaded without starting the page", () => {
        const page = setUp({ run: false });

        // "load" also fires for a script that does not parse, or is not this bundle.
        page.window.localStorage.setItem("rt-theme-asset:script", "index-AAAA1111.js|3-abc123");
        page.run();
        page.fail(page.original.script);
        page.advance(0);
        page.succeed(page.retries("script")[0]);

        expect(page.token(page.retries("script")[0])).toBe("3-abc123");
        expect(page.window.localStorage.getItem("rt-theme-asset:script")).toBeNull();

        const fresh = setUp();

        fresh.fail(fresh.original.script);
        fresh.advance(0);
        fresh.succeed(fresh.retries("script")[0]);

        expect(fresh.window.localStorage.getItem("rt-theme-asset:script")).toBeNull();
    });

    it("does not start another attempt once the page has started", () => {
        const page = setUp();

        page.fail(page.original.script);
        page.window.__rtThemeBooted = true;
        page.advance(60_000);

        expect(page.retries("script")).toHaveLength(0);
    });

    it("runs only once even if the script is included twice", () => {
        const page = setUp();

        page.run();
        page.fail(page.original.script);
        page.advance(0);

        expect(page.retries("script")).toHaveLength(1);
    });
});

describe("when the quick attempts are used up", () => {
    it("shows a notice and keeps trying, more slowly", () => {
        const page = setUp();

        // The original and five retries have failed; the sixth and last quick attempt is made.
        page.failScript(6);
        page.advance(5000);
        expect(page.retries("script")).toHaveLength(6);
        expect(page.notice()).toBeNull();

        page.fail(page.retries("script")[5]);

        const box = page.notice()!;

        expect(box).not.toBeNull();
        expect(box.parentElement!.id).toBe("root");
        expect(box.getAttribute("role")).toBe("alert");
        expect(box.textContent).toContain("taking longer than usual");
        expect(page.noticeLine()).toContain("still trying");
        expect(box.querySelector("button")!.getAttribute("type")).toBe("button");
        expect(box.querySelector("a, [href]")).toBeNull();

        const slow = [8000, 10_000, 15_000, 20_000, 20_000];

        slow.forEach((delay, index) => {
            page.advance(delay - 1);
            expect(page.retries("script"), `attempt ${7 + index} must wait ${delay} ms`).toHaveLength(6 + index);
            page.advance(1);
            expect(page.retries("script")).toHaveLength(7 + index);
            page.fail(page.retries("script")[6 + index]);
        });

        expect(page.document.querySelectorAll("[data-rt-asset-notice]")).toHaveLength(1);
    });

    /** The original and six retries have failed (10.6 s in); the seventh is in flight at 18.6 s. */
    function seventhInFlight() {
        const page = setUp();

        page.failScript(7);
        page.advance(8000);
        expect(page.retries("script")).toHaveLength(7);

        return page;
    }

    it("goes on when an attempt fails just inside six minutes from the first failure", () => {
        const page = seventhInFlight();

        page.advance(359_000 - 18_600);
        page.fail(page.retries("script")[6]);

        expect(page.pending()).toBe(1);
        page.advance(10_000);
        expect(page.retries("script")).toHaveLength(8);
        expect(page.noticeLine()).toContain("still trying");
    });

    it("stops when an attempt fails after six minutes, and the notice stops saying it is trying", () => {
        const page = seventhInFlight();

        page.advance(361_000 - 18_600);
        page.fail(page.retries("script")[6]);
        page.advance(600_000);

        expect(page.pending()).toBe(0);
        expect(page.retries("script")).toHaveLength(7);
        expect(page.notice()!.querySelector("button")).not.toBeNull();
        expect(page.noticeLine()).toBe("Use the button to load it again.");
    });

    it("starts again, for another six minutes, when the connection or the tab comes back after a stop", () => {
        const page = seventhInFlight();

        // A laptop lid closed for twenty minutes: the overdue attempt fails before the network is up.
        page.advance(1_200_000);
        page.fail(page.retries("script")[6]);
        expect(page.pending()).toBe(0);

        page.window.dispatchEvent(new page.window.Event("online"));
        expect(page.retries("script")).toHaveLength(8);
        expect(page.noticeLine()).toContain("still trying");

        // One attempt at a time, as ever.
        page.window.dispatchEvent(new page.window.Event("online"));
        page.document.dispatchEvent(new page.window.Event("visibilitychange"));
        expect(page.retries("script")).toHaveLength(8);

        page.fail(page.retries("script")[7]);
        page.advance(20_000);
        expect(page.retries("script")).toHaveLength(9);
    });

    it("leaves a page that has rendered alone", () => {
        const page = setUp();

        page.document.getElementById("root")!.innerHTML = "<h1>rendered</h1>";
        page.failScript(7);

        expect(page.notice()).toBeNull();
    });

    it("puts the notice in the body when there is no #root", () => {
        const page = setUp({ run: false });

        page.document.getElementById("root")!.remove();
        page.run();
        page.failScript(7);

        expect(page.notice()!.parentElement).toBe(page.document.body);
    });
});

describe("retrying the stylesheet", () => {
    it("keeps retrying with a new link element once the page has started, and shows no notice", () => {
        const page = setUp();

        // Only the stylesheet is in trouble: the bundle loaded and the page has started.
        page.window.__rtThemeBooted = true;
        page.fail(page.original.style);
        page.advance(0);

        const [retry] = page.retries("link");

        expect(retry.getAttribute("rel")).toBe("stylesheet");
        expect(retry.getAttribute("crossorigin")).toBe("");
        expect(page.address(retry).split("?")[0]).toBe(STYLE);
        expect(page.original.style.nextElementSibling).toBe(retry);

        for (let made = 1; made < 8; made += 1) {
            page.fail(page.retries("link")[made - 1]);
            page.advance(20_000);
        }

        expect(page.retries("link").length).toBe(8);
        expect(page.notice()).toBeNull();
    });

    it("keeps to the quick schedule and shows no notice of its own while the page has not started", () => {
        const page = setUp();

        // The bundle is still downloading: nothing has set __rtThemeBooted, and #root is empty.
        page.fail(page.original.style);

        for (let made = 0; made < QUICK.length; made += 1) {
            if (QUICK[made] > 0) {
                page.advance(QUICK[made] - 1);
                expect(page.retries("link"), `attempt ${made + 1} must wait ${QUICK[made]} ms`).toHaveLength(made);
                page.advance(1);
            } else {
                page.advance(0);
            }
            expect(page.retries("link")).toHaveLength(made + 1);
            page.fail(page.retries("link")[made]);
        }

        // 10.6 s in: the quick attempts are used up. Then the first slow attempt, at 18.6 s. All of
        // it is before the 20 s watchdog, which is the only thing allowed to show the notice here.
        expect(page.notice()).toBeNull();
        page.advance(8000);
        expect(page.retries("link")).toHaveLength(7);
        expect(page.notice()).toBeNull();
    });

    it("puts each retry straight after the element that failed, not at the end of the head", () => {
        const page = setUp({ run: false });
        const later = page.document.createElement("style");

        page.document.head.appendChild(later);
        page.run();
        page.fail(page.original.style);
        page.advance(0);
        page.fail(page.retries("link")[0]);
        page.advance(300);

        const [first, second] = page.retries("link");

        expect(page.original.style.nextElementSibling).toBe(first);
        expect(first.nextElementSibling).toBe(second);
        expect(second.nextElementSibling).toBe(later);
        expect(page.document.head.lastElementChild).toBe(later);
    });

    it("is independent of the bundle", () => {
        const page = setUp();

        page.fail(page.original.style);
        page.fail(page.original.script);
        page.advance(0);
        page.window.__rtThemeBooted = true;
        page.succeed(page.retries("script")[0]);
        page.fail(page.retries("link")[0]);
        page.advance(300);

        expect(page.retries("script")).toHaveLength(1);
        expect(page.retries("link")).toHaveLength(2);
        expect(page.window.localStorage.getItem("rt-theme-asset:script")).toContain("index-AAAA1111.js|");
        expect(page.window.localStorage.getItem("rt-theme-asset:style")).toBeNull();
    });
});

describe("the remembered address", () => {
    it("is tried first for the same file", () => {
        const page = setUp({ run: false });

        page.window.localStorage.setItem("rt-theme-asset:script", "index-AAAA1111.js|3-abc123");
        page.run();
        page.fail(page.original.script);
        page.advance(0);

        expect(page.token(page.retries("script")[0])).toBe("3-abc123");
    });

    it("is forgotten when it fails, and never asked for again", () => {
        const page = setUp({ run: false });

        page.window.localStorage.setItem("rt-theme-asset:script", "index-AAAA1111.js|3-abc123");
        page.run();
        page.fail(page.original.script);
        page.advance(0);
        page.fail(page.retries("script")[0]);

        expect(page.window.localStorage.getItem("rt-theme-asset:script")).toBeNull();

        page.advance(300);

        expect(page.token(page.retries("script")[1])).toMatch(/^2-/);
        expect(page.token(page.retries("script")[1])).not.toBe("3-abc123");
    });

    it.each([
        ["a different file", "index-OLDOLD00.js|3-abc123"],
        ["no separator", "3-abc123"],
        ["characters that do not belong in a token", "index-AAAA1111.js|../../x?y=<z>"],
        ["an over-long token", "index-AAAA1111.js|" + "a".repeat(200)],
        ["an empty token", "index-AAAA1111.js|"]
    ])("is ignored when it is for %s", (_what, stored) => {
        const page = setUp({ run: false });

        page.window.localStorage.setItem("rt-theme-asset:script", stored);
        page.run();
        page.fail(page.original.script);
        page.advance(0);

        expect(page.token(page.retries("script")[0])).toMatch(/^1-[a-z0-9]+$/);
    });

    it("is kept separately for the stylesheet", () => {
        const page = setUp({ run: false });

        page.window.localStorage.setItem("rt-theme-asset:script", "index-AAAA1111.js|3-abc123");
        page.run();
        page.fail(page.original.style);
        page.advance(0);

        expect(page.token(page.retries("link")[0])).toMatch(/^1-/);
    });

    it.each(["throws-on-read", "throws-on-write"] as const)("is optional: retries still work when storage %s", storage => {
        const page = setUp({ storage });

        page.fail(page.original.script);
        page.advance(0);
        expect(page.retries("script")).toHaveLength(1);

        page.window.__rtThemeBooted = true;
        page.succeed(page.retries("script")[0]);
        page.advance(60_000);

        expect(page.retries("script")).toHaveLength(1);
        expect(page.uncaught, "errors thrown out of the loader's listeners").toEqual([]);

        if (storage === "throws-on-write") {
            expect(page.window.localStorage.getItem("rt-theme-asset:script")).toBeNull();
        }
    });
});

describe("waiting attempts", () => {
    it("are brought forward when the connection comes back, without overlapping one in flight", () => {
        const page = setUp();

        page.failScript(7);
        expect(page.retries("script")).toHaveLength(6);

        page.window.dispatchEvent(new page.window.Event("online"));
        expect(page.retries("script")).toHaveLength(7);

        // That attempt is now in flight: another "online" must not start a second.
        page.window.dispatchEvent(new page.window.Event("online"));
        page.advance(60_000);
        expect(page.retries("script")).toHaveLength(7);
    });

    it("are brought forward when the tab becomes visible again, not when it is hidden", () => {
        const page = setUp();
        let visibility = "hidden";

        Object.defineProperty(page.document, "visibilityState", { configurable: true, get: () => visibility });
        page.failScript(7);
        page.document.dispatchEvent(new page.window.Event("visibilitychange"));
        expect(page.retries("script")).toHaveLength(6);

        visibility = "visible";
        page.document.dispatchEvent(new page.window.Event("visibilitychange"));
        expect(page.retries("script")).toHaveLength(7);
    });
});

describe("the watchdog", () => {
    it("shows the notice if the page has not started 20 s after the loader ran, and fetches nothing", () => {
        const page = setUp();

        // It must not wait for DOMContentLoaded: a bundle that is still downloading holds that back.
        expect(page.document.readyState).toBe("loading");
        page.advance(19_999);
        expect(page.notice()).toBeNull();
        page.advance(1);

        expect(page.notice()).not.toBeNull();
        expect(page.document.querySelectorAll("[data-rt-asset-retry]")).toHaveLength(0);
    });

    it("stays quiet when the page has started", () => {
        const page = setUp();

        page.window.__rtThemeBooted = true;
        page.advance(60_000);

        expect(page.notice()).toBeNull();
    });
});
