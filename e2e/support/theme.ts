/*
 * Shared fixtures and helpers for the static specs (e2e/static). They drive the edge simulator
 * (edge-simulator.mjs) through its control API and read the page through a small probe.
 *
 * Never add page.route or context.route here or in a spec: any route handler switches the
 * browser's HTTP cache off, and these tests exist to show how the loader behaves with a cached 404.
 */
import { test as base, expect, type APIRequestContext, type Page } from "@playwright/test";
import { PAGE_PATH, RETRY_PARAM, SIM_ORIGIN, STORE_KEYS } from "./constants.mjs";

export { expect };

// ---------------------------------------------------------------------------------------------
// Simulator client

export type Status = 200 | 404;

/** One asset kind's behaviour. Field meanings and precedence: edge-simulator.mjs. */
export interface AssetRule {
    plain?: Status;
    plainDelayMs?: number;
    failFirstRetries?: number;
    retries?: Status;
    outageMs?: number;
    pattern?: Status[];
}

export interface Rules {
    js?: AssetRule;
    css?: AssetRule;
}

/** The plain address and every retry answer 404 (with a one-year max-age). */
export const ALL_404: AssetRule = { plain: 404, retries: 404 };

export interface LogEntry {
    seq: number;
    /** Milliseconds since the last reset, when the request arrived. */
    at: number;
    method: string;
    path: string;
    query: string;
    kcr: string | null;
    kind: "page" | "js" | "css" | "asset" | "other";
    status: number;
    delayMs: number;
}

export interface SimInfo {
    pagePath: string;
    scriptPath: string;
    stylePath: string;
    scriptFile: string;
    styleFile: string;
}

export class Simulator {
    constructor(
        private readonly api: APIRequestContext,
        readonly info: SimInfo
    ) {}

    /** Clears the log and counters and sets the rules. `{}` is a healthy edge. */
    async reset(rules: Rules = {}): Promise<void> {
        await this.post("/__sim/reset", rules);
    }

    /** Replaces the rules, keeping the log and counters: heals (or breaks) the edge mid-test. */
    async setRules(rules: Rules): Promise<void> {
        await this.post("/__sim/rules", rules);
    }

    async log(): Promise<{ now: number; entries: LogEntry[] }> {
        const response = await this.api.get("/__sim/log");
        expect(response.ok(), "GET /__sim/log").toBe(true);
        return response.json();
    }

    async entries(filter: (entry: LogEntry) => boolean = () => true): Promise<LogEntry[]> {
        return (await this.log()).entries.filter(filter);
    }

    private async post(route: string, body: Rules): Promise<void> {
        const response = await this.api.post(route, { data: body });
        expect(response.ok(), route + " refused: " + (await response.text())).toBe(true);
    }
}

export const isPage = (entry: LogEntry) => entry.kind === "page";
export const isAsset = (entry: LogEntry) => entry.kind === "js" || entry.kind === "css" || entry.kind === "asset";
export const isRetry = (kind: "js" | "css") => (entry: LogEntry) => entry.kind === kind && entry.kcr !== null;

/** The attempt number the loader put at the front of a kcr value ("3-abc" is attempt 3). */
export function attemptOf(kcr: string | null): number {
    return Number(String(kcr).split("-")[0]);
}

/** A token the loader made for this attempt: attempt number, dash, lower-case letters and digits. */
export function freshTokenPattern(attempt: number): RegExp {
    return new RegExp("^" + attempt + "-[a-z0-9]+$");
}

// ---------------------------------------------------------------------------------------------
// In-page probe

export interface ProbeState {
    /** performance.now() each time the bundle set window.__rtThemeBooted. */
    boots: number[];
    /** Load and error events of script and link elements, in order. */
    events: { type: "load" | "error"; tag: string; url: string; retry: string | null; at: number }[];
    noticeShownAt: number | null;
    noticeGoneAt: number | null;
}

declare global {
    interface Window {
        __e2e: ProbeState;
        __rtThemeBooted?: boolean;
    }
}

/**
 * Runs before any page script. It only observes: window.__rtThemeBooted becomes an accessor that
 * behaves exactly like a plain property but records when it is set; load and error events of
 * script and link elements are recorded on the way down, without stopping them; a mutation
 * observer records when the notice appears and disappears. Times are performance.now(), so
 * milliseconds since this document's navigation started.
 */
function installProbe() {
    const state: ProbeState = { boots: [], events: [], noticeShownAt: null, noticeGoneAt: null };
    Object.defineProperty(window, "__e2e", { value: state });

    let booted: boolean | undefined;
    Object.defineProperty(window, "__rtThemeBooted", {
        configurable: true,
        enumerable: true,
        get: () => booted,
        set: value => {
            booted = value;
            state.boots.push(Math.round(performance.now()));
        }
    });

    // On the document, not the window: a "load" event never travels from the document to the window.
    for (const type of ["load", "error"] as const) {
        document.addEventListener(
            type,
            event => {
                const el = event.target as Element | null;
                if (el instanceof HTMLScriptElement || el instanceof HTMLLinkElement) {
                    state.events.push({
                        type,
                        tag: el.tagName.toLowerCase(),
                        url: el instanceof HTMLScriptElement ? el.src : el.href,
                        retry: el.getAttribute("data-rt-asset-retry"),
                        at: Math.round(performance.now())
                    });
                }
            },
            true
        );
    }

    new MutationObserver(() => {
        const present = !!document.querySelector("[data-rt-asset-notice]");
        if (present && state.noticeShownAt === null) {
            state.noticeShownAt = Math.round(performance.now());
        } else if (!present && state.noticeShownAt !== null && state.noticeGoneAt === null) {
            state.noticeGoneAt = Math.round(performance.now());
        }
    }).observe(document, { childList: true, subtree: true });
}

// ---------------------------------------------------------------------------------------------
// Fixtures

export const test = base.extend<{ sim: Simulator; pageErrors: Error[] }>({
    sim: async ({ playwright }, use) => {
        const api = await playwright.request.newContext({ baseURL: SIM_ORIGIN });
        const info = (await (await api.get("/__sim/info")).json()) as SimInfo;
        const sim = new Simulator(api, info);
        await sim.reset();
        await use(sim);
        await api.dispose();
    },

    context: async ({ context }, use) => {
        await context.addInitScript(installProbe);
        await use(context);
    },

    // Every test fails on an uncaught error in any page of its context.
    pageErrors: [
        async ({ context }, use) => {
            const errors: Error[] = [];
            context.on("weberror", webError => errors.push(webError.error()));
            await use(errors);
            expect(
                errors.map(error => error.stack || error.message),
                "uncaught errors in the page"
            ).toEqual([]);
        },
        { auto: true }
    ]
});

// ---------------------------------------------------------------------------------------------
// Page helpers

/**
 * Opens the theme page. Waits only for the navigation to commit: a failing asset can hold the
 * window "load" event back for a long time, so tests wait on what they assert instead.
 */
export async function openThemePage(page: Page, query = ""): Promise<void> {
    await page.goto(PAGE_PATH + query, { waitUntil: "commit" });
}

/** Seeds localStorage on the simulator's origin before the first visit to the theme page. */
export async function seedStorage(page: Page, values: Record<string, string>): Promise<void> {
    await page.goto("/__sim/blank");
    await page.evaluate(entries => {
        for (const [key, value] of Object.entries(entries)) {
            localStorage.setItem(key, value);
        }
    }, values);
}

/** Waits until the bundle has started and React has rendered the page. */
export async function waitForStart(page: Page, timeout = 10_000): Promise<void> {
    await page.waitForFunction(
        () =>
            window.__rtThemeBooted === true &&
            document.querySelector("#root h1")?.textContent === "No Keycloak Context",
        undefined,
        { timeout }
    );
}

export interface ThemeState {
    booted: boolean;
    boots: number[];
    headings: number;
    rootChildren: number;
    /** Successful runs of the bundle: load events of module scripts for the bundle's file. */
    bundleRuns: number;
    notice: boolean;
    noticeShownAt: number | null;
    noticeGoneAt: number | null;
    retryElements: { tag: string; attempt: string; kcr: string | null }[];
    storage: { script: string | null; style: string | null } | "unreadable";
    historyLength: number;
}

export async function themeState(page: Page, scriptFile: string): Promise<ThemeState> {
    return page.evaluate(
        ({ scriptFile, keys, param }) => {
            const probe = window.__e2e;
            let storage: ThemeState["storage"];
            try {
                storage = { script: localStorage.getItem(keys.script), style: localStorage.getItem(keys.style) };
            } catch {
                storage = "unreadable";
            }
            return {
                booted: window.__rtThemeBooted === true,
                boots: probe.boots.slice(),
                headings: document.querySelectorAll("#root h1").length,
                rootChildren: document.getElementById("root")?.children.length ?? -1,
                bundleRuns: probe.events.filter(
                    e => e.type === "load" && e.tag === "script" && new URL(e.url).pathname.endsWith("/" + scriptFile)
                ).length,
                notice: !!document.querySelector("[data-rt-asset-notice]"),
                noticeShownAt: probe.noticeShownAt,
                noticeGoneAt: probe.noticeGoneAt,
                retryElements: Array.from(document.querySelectorAll("[data-rt-asset-retry]")).map(el => ({
                    tag: el.tagName.toLowerCase(),
                    attempt: el.getAttribute("data-rt-asset-retry") || "",
                    kcr: new URL((el as HTMLScriptElement).src || (el as HTMLLinkElement).href).searchParams.get(param)
                })),
                storage,
                historyLength: history.length
            };
        },
        { scriptFile, keys: STORE_KEYS, param: RETRY_PARAM }
    );
}

/** The bundle ran once, set the flag once and React rendered one heading into an otherwise empty #root. */
export async function expectStartedOnce(page: Page, sim: Simulator): Promise<ThemeState> {
    const state = await themeState(page, sim.info.scriptFile);
    expect(state.booted, "window.__rtThemeBooted").toBe(true);
    expect(state.boots, "times the bundle set window.__rtThemeBooted").toHaveLength(1);
    expect(state.bundleRuns, "bundle scripts that loaded and ran").toBe(1);
    expect(state.headings, "headings in #root").toBe(1);
    expect(state.rootChildren, "children of #root").toBe(1);
    expect(state.notice, "notice on screen").toBe(false);
    return state;
}

/**
 * The real stylesheet is in effect: a same-origin sheet for the built CSS file has rules, and the
 * heading and body have the font settings src/login/main.css gives them (15px, "Arimo") rather
 * than the browser's defaults (32px, Times). With `retried`, the sheet in effect is a retry.
 */
export async function expectStylesheetApplied(page: Page, sim: Simulator, options: { retried?: boolean } = {}) {
    await expect
        .poll(
            () =>
                page.evaluate(
                    ({ styleFile, param }) => {
                        const sheets = Array.from(document.styleSheets)
                            .filter(sheet => !!sheet.href && new URL(sheet.href).pathname.endsWith("/" + styleFile))
                            .map(sheet => {
                                let rules = -1;
                                try {
                                    rules = sheet.cssRules.length;
                                } catch {
                                    // Not readable: counts as not applied.
                                }
                                return { retried: new URL(sheet.href!).searchParams.has(param), rules };
                            })
                            .filter(sheet => sheet.rules > 0);
                        const h1 = document.querySelector("#root h1");
                        return {
                            sheets,
                            h1FontSize: h1 ? getComputedStyle(h1).fontSize : null,
                            bodyFont: getComputedStyle(document.body).fontFamily.split(",")[0].replace(/["']/g, "").trim()
                        };
                    },
                    { styleFile: sim.info.styleFile, param: RETRY_PARAM }
                ),
            { message: "the built stylesheet is applied", timeout: 5_000 }
        )
        .toEqual({
            sheets: [{ retried: !!options.retried, rules: expect.any(Number) }],
            h1FontSize: "15px",
            bodyFont: "Arimo"
        });
}

export function notice(page: Page) {
    return page.locator("[data-rt-asset-notice]");
}

/**
 * The notice is on screen, says what it should and is readable whatever the page's stylesheet
 * does: the computed colours of the box, its two lines and the button are the inline ones.
 */
export async function expectNoticeLegible(page: Page): Promise<void> {
    const box = notice(page);
    await expect(box).toBeVisible();
    await expect(box).toHaveAttribute("role", "alert");
    await expect(box).toBeInViewport();
    await expect(box.locator("p").first()).toHaveText("This page is taking longer than usual to load");
    const button = box.getByRole("button", { name: "Try again" });
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("type", "button");

    const colours = await box.evaluate(el => {
        const pick = (node: Element | null) => {
            const element = node as HTMLElement;
            const computed = getComputedStyle(element);
            return {
                color: computed.color,
                background: computed.backgroundColor,
                inlineColor: element.style.color,
                inlineBackground: element.style.backgroundColor
            };
        };
        const lines = el.querySelectorAll("p");
        return { box: pick(el), title: pick(lines[0]), text: pick(lines[1]), button: pick(el.querySelector("button")) };
    });

    // #111827 text on white, white text on #111827, as assetRetry.js sets them inline.
    expect(colours.box).toEqual({
        color: "rgb(17, 24, 39)",
        background: "rgb(255, 255, 255)",
        inlineColor: "rgb(17, 24, 39)",
        inlineBackground: "rgb(255, 255, 255)"
    });
    expect(colours.button).toEqual({
        color: "rgb(255, 255, 255)",
        background: "rgb(17, 24, 39)",
        inlineColor: "rgb(255, 255, 255)",
        inlineBackground: "rgb(17, 24, 39)"
    });
    expect(colours.title.color).toBe("rgb(17, 24, 39)");
    expect(colours.text.color).toBe("rgb(55, 65, 81)");
}
