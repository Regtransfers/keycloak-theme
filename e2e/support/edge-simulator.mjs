#!/usr/bin/env node
/*
 * Edge simulator: a dependency-free HTTP server that plays "Keycloak behind Cloudflare" for the
 * built dist/ directory, so that the static browser tests can show how the asset-retry loader
 * (src/loader/assetRetry.js) behaves against a real browser HTTP cache.
 *
 *     npm run build
 *     node e2e/support/edge-simulator.mjs
 *
 * What it serves
 *   GET|POST /realms/e2e/login-actions/authenticate[?query]
 *       dist/index.html reshaped the way Keycloakify and Keycloak serve it (see reshapePage).
 *       200, text/html, Cache-Control: no-store.
 *   GET /resources/abcde/login/keycloak-theme/dist/assets/<file>[?query]
 *       dist/assets/<file>. Every answer, 200 or 404, carries Cache-Control: max-age=31536000:
 *       that is what Cloudflare stamped on the 404 that left the sign-in page blank on 05-10-2026,
 *       and it is why a browser that received the 404 keeps it.
 *   Anything else: a plain 404 with no caching headers.
 *
 * Control API (JSON over HTTP, never logged)
 *   GET  /__sim/health  200 once the server is ready (Playwright's webServer waits for it).
 *   GET  /__sim/info    { pagePath, scriptFile, styleFile, scriptPath, stylePath }
 *   POST /__sim/reset   Body: rules. Clears the log and the request counters, then sets the rules.
 *   POST /__sim/rules   Body: rules. Replaces the rules but keeps the log and the counters, so a
 *                       test can "heal" the edge in the middle of a page's life.
 *   GET  /__sim/log     { now, entries: [{ seq, at, method, path, query, kcr, kind, status, delayMs }] }
 *                       `at` and `now` are milliseconds since the last reset. `kind` is "page",
 *                       "js", "css", "asset" (another file under assets/) or "other".
 *   GET  /__sim/blank   An empty page on this origin, for seeding localStorage before a visit.
 *
 * Rules: { js?: AssetRule, css?: AssetRule }. A kind or field that is left out behaves like a
 * healthy server. Unknown kinds or fields are refused with a 400, so a typo in a test fails loudly.
 * Each request of a kind is answered by the first of these that applies (counters run from the
 * last reset; "a retry" is any request whose query has a kcr parameter):
 *   outageMs: T          404 for every request of the kind, whatever its query, until T ms after
 *                        the rules were set. Models an edge that ignores the query string while it
 *                        holds a cached 404.
 *   pattern: [s, ...]    The nth request of the kind (plain or retry, counting from 0) answers
 *                        pattern[n % length]. [404, 404, 200] is "two 404s then one 200".
 *   plain: 200 | 404     Answer for the plain address (no kcr). Default 200.
 *   plainDelayMs: D      Hold the plain answer for D ms before sending it. Default 0.
 *   failFirstRetries: N  The first N retries answer 404. Default 0.
 *   retries: 200 | 404   Answer for every other retry. Default 200.
 * "Everything fails" is { plain: 404, retries: 404 }. A file that does not exist is a 404 whatever
 * the rules say. There is no randomness anywhere.
 *
 * The page and the asset list are read once at start-up: restart the simulator after a rebuild.
 * It refuses to start if dist/ is missing or carries a different loader from src/loader/.
 */
import { Buffer } from "node:buffer";
import http from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import process from "node:process";
import { ASSETS_PATH, PAGE_PATH, RESOURCES_PATH, RETRY_PARAM, SIM_HOST, SIM_ORIGIN, SIM_PORT } from "./constants.mjs";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const distDir = path.join(repoRoot, "dist");
const assetsDir = path.join(distDir, "assets");
const indexPath = path.join(distDir, "index.html");
const loaderPath = path.join(repoRoot, "src", "loader", "assetRetry.js");

const ONE_YEAR = "max-age=31536000";
const NOT_FOUND_BODY = "<!doctype html><title>404 Not Found</title><h1>404 Not Found</h1>\n";
const CONTENT_TYPES = {
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".ttf": "font/ttf"
};

function fail(message) {
    console.error("edge-simulator: " + message);
    process.exit(1);
}

if (!existsSync(indexPath)) {
    fail(indexPath + " is missing. Run `npm run build` first; the static tests serve the built theme.");
}

/** Attribute map of every `<tag ...>` opening tag in the page, in document order. */
function tagsNamed(html, tag) {
    const tags = [];
    for (const match of html.matchAll(new RegExp("<" + tag + "\\b([^>]*)>", "gi"))) {
        const attrs = {};
        for (const attr of match[1].matchAll(/([^\s"'=/>]+)(?:\s*=\s*"([^"]*)")?/g)) {
            attrs[attr[1].toLowerCase()] = attr[2] === undefined ? "" : attr[2];
        }
        tags.push(attrs);
    }
    return tags;
}

/**
 * dist/index.html as Keycloak would serve it from a Keycloakify theme:
 *  - The Google Fonts tags (two preconnect links and the fonts.googleapis.com stylesheet) are
 *    removed, so that the tests never touch the internet. Nothing else depends on them.
 *  - Every src or href that starts with /assets/ is moved under Keycloak's resource path, as
 *    Keycloakify's generateFtl does for link and script tags. Only attributes are rewritten:
 *    Keycloakify leaves the loader's own "/assets/" string alone, and so does this.
 *  - <base href> goes at the very start of <head>, before the loader, as in the real template.
 */
function reshapePage(html) {
    let page = html.replace(
        /^[ \t]*<link\b[^>]*\bhref="https:\/\/fonts\.(?:googleapis|gstatic)\.com[^"]*"[^>]*>[ \t]*\r?\n?/gim,
        ""
    );
    if (/https:\/\/fonts\.(?:googleapis|gstatic)\.com/.test(page)) {
        fail("dist/index.html has a Google Fonts reference the simulator could not remove; update reshapePage.");
    }

    page = page.replace(/(<(?:script|link)\b[^>]*\s(?:src|href)=")\/assets\//gi, "$1" + ASSETS_PATH);

    if (!/<head>/i.test(page)) {
        fail("dist/index.html has no plain <head> tag to put <base> in.");
    }
    page = page.replace(/<head>/i, '<head>\n        <base href="' + RESOURCES_PATH + '" />');

    if (tagsNamed(page, "script").filter(attrs => "data-rt-asset-loader" in attrs).length !== 1) {
        fail("dist/index.html does not have exactly one <script data-rt-asset-loader>. Is the loader plugin in vite.config.ts?");
    }
    // A build older than the loader source would test the wrong loader without anyone noticing.
    const inlined = page.match(/<script data-rt-asset-loader[^>]*>([\s\S]*?)<\/script>/)[1];
    const source = readFileSync(loaderPath, "utf8").replace(/\r\n?/g, "\n");
    if (inlined !== source) {
        fail("the loader in dist/index.html differs from src/loader/assetRetry.js. Run `npm run build` again.");
    }
    const scripts = tagsNamed(page, "script")
        .filter(attrs => attrs.type === "module" && (attrs.src || "").startsWith(ASSETS_PATH))
        .map(attrs => attrs.src);
    const styles = tagsNamed(page, "link")
        .filter(attrs => /(^|\s)stylesheet(\s|$)/i.test(attrs.rel || "") && (attrs.href || "").startsWith(ASSETS_PATH))
        .map(attrs => attrs.href);
    if (scripts.length !== 1 || styles.length !== 1) {
        fail(
            "dist/index.html must name exactly one module script and one stylesheet under /assets/ " +
                "(found " + scripts.length + " and " + styles.length + "). See docs/asset-loading.md."
        );
    }
    return { page, scriptPath: scripts[0], stylePath: styles[0] };
}

const { page: PAGE_HTML, scriptPath, stylePath } = reshapePage(readFileSync(indexPath, "utf8"));
const INFO = {
    pagePath: PAGE_PATH,
    scriptPath,
    stylePath,
    scriptFile: scriptPath.slice(ASSETS_PATH.length),
    styleFile: stylePath.slice(ASSETS_PATH.length)
};

// ---------------------------------------------------------------------------------------------
// Rules and state

/** A refusal the control API sends back as { error } with this status. */
class HttpError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

const STATUSES = [200, 404];

function nonNegativeInteger(value, name) {
    if (!Number.isInteger(value) || value < 0) {
        throw new HttpError(400, name + " must be a whole number of 0 or more");
    }
    return value;
}

function status(value, name) {
    if (!STATUSES.includes(value)) {
        throw new HttpError(400, name + " must be one of " + STATUSES.join(", "));
    }
    return value;
}

function normaliseRule(input, kind) {
    const rule = { plain: 200, plainDelayMs: 0, failFirstRetries: 0, retries: 200, outageMs: 0, pattern: null };
    if (input === undefined || input === null) {
        return rule;
    }
    if (typeof input !== "object" || Array.isArray(input)) {
        throw new HttpError(400, kind + " must be an object");
    }
    for (const [key, value] of Object.entries(input)) {
        const name = kind + "." + key;
        switch (key) {
            case "plain":
            case "retries":
                rule[key] = status(value, name);
                break;
            case "plainDelayMs":
            case "failFirstRetries":
            case "outageMs":
                rule[key] = nonNegativeInteger(value, name);
                break;
            case "pattern":
                if (!Array.isArray(value) || value.length === 0) {
                    throw new HttpError(400, name + " must be a non-empty array");
                }
                rule.pattern = value.map((item, index) => status(item, name + "[" + index + "]"));
                break;
            default:
                throw new HttpError(400, "unknown rule " + name);
        }
    }
    return rule;
}

function normaliseRules(input) {
    if (input === undefined || input === null) {
        input = {};
    }
    if (typeof input !== "object" || Array.isArray(input)) {
        throw new HttpError(400, "rules must be an object like { js: {...}, css: {...} }");
    }
    for (const key of Object.keys(input)) {
        if (key !== "js" && key !== "css") {
            throw new HttpError(400, 'unknown asset kind "' + key + '" (expected js or css)');
        }
    }
    return { js: normaliseRule(input.js, "js"), css: normaliseRule(input.css, "css") };
}

const state = {
    rules: normaliseRules({}),
    resetAt: performance.now(),
    rulesSetAt: performance.now(),
    seq: 0,
    log: [],
    requests: { js: 0, css: 0 },
    retries: { js: 0, css: 0 }
};

function sinceReset() {
    return Math.round(performance.now() - state.resetAt);
}

/** How to answer this request for a js or css file. Counts it, so call it once per request. */
function decide(kind, kcr) {
    const rule = state.rules[kind];
    const nth = state.requests[kind]++;
    const nthRetry = kcr === null ? -1 : state.retries[kind]++;

    if (rule.outageMs > 0 && performance.now() - state.rulesSetAt < rule.outageMs) {
        return { status: 404, delayMs: 0 };
    }
    if (rule.pattern) {
        return { status: rule.pattern[nth % rule.pattern.length], delayMs: 0 };
    }
    if (kcr === null) {
        return { status: rule.plain, delayMs: rule.plainDelayMs };
    }
    return { status: nthRetry < rule.failFirstRetries ? 404 : rule.retries, delayMs: 0 };
}

function record(req, url, kind, answer) {
    const entry = {
        seq: ++state.seq,
        at: sinceReset(),
        method: req.method,
        path: url.pathname,
        query: url.search.replace(/^\?/, ""),
        kcr: url.searchParams.get(RETRY_PARAM),
        kind,
        status: answer.status,
        delayMs: answer.delayMs
    };
    state.log.push(entry);
    if (process.stdout.isTTY) {
        const delay = entry.delayMs ? " (held " + entry.delayMs + " ms)" : "";
        console.log(
            String(entry.at).padStart(7) + " ms  " + entry.method.padEnd(4) + " " + entry.status + " " +
                entry.kind.padEnd(5) + " " + entry.path + (entry.query ? "?" + entry.query : "") + delay
        );
    }
}

// ---------------------------------------------------------------------------------------------
// HTTP

function send(res, statusCode, headers, body, method) {
    if (res.destroyed || res.writableEnded) {
        return;
    }
    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body, "utf8");
    res.writeHead(statusCode, { ...headers, "Content-Length": buffer.length });
    res.end(method === "HEAD" ? undefined : buffer);
}

function sendJson(res, statusCode, value) {
    send(res, statusCode, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }, JSON.stringify(value));
}

function later(res, delayMs, fn) {
    if (delayMs <= 0) {
        fn();
        return;
    }
    const timer = setTimeout(fn, delayMs);
    // The browser may give up (or the test end) before the answer is due.
    res.on("close", () => clearTimeout(timer));
}

async function readJson(req) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        size += chunk.length;
        if (size > 64 * 1024) {
            throw new HttpError(413, "body too large");
        }
        chunks.push(chunk);
    }
    const text = Buffer.concat(chunks).toString("utf8").trim();
    if (!text) {
        return undefined;
    }
    try {
        return JSON.parse(text);
    } catch {
        throw new HttpError(400, "body is not JSON");
    }
}

async function handleControl(req, res, url) {
    const route = req.method + " " + url.pathname;
    switch (route) {
        case "GET /__sim/health":
            send(res, 200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }, "ok\n");
            return;
        case "GET /__sim/info":
            sendJson(res, 200, INFO);
            return;
        case "GET /__sim/log":
            sendJson(res, 200, { now: sinceReset(), entries: state.log });
            return;
        case "GET /__sim/blank":
            send(
                res,
                200,
                { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
                "<!doctype html><html><head><title>blank</title></head><body></body></html>\n"
            );
            return;
        case "POST /__sim/reset": {
            const rules = normaliseRules(await readJson(req));
            state.rules = rules;
            state.resetAt = state.rulesSetAt = performance.now();
            state.seq = 0;
            state.log = [];
            state.requests = { js: 0, css: 0 };
            state.retries = { js: 0, css: 0 };
            sendJson(res, 200, { rules });
            return;
        }
        case "POST /__sim/rules": {
            const rules = normaliseRules(await readJson(req));
            state.rules = rules;
            state.rulesSetAt = performance.now();
            sendJson(res, 200, { rules, at: sinceReset() });
            return;
        }
        default:
            throw new HttpError(404, "no control route " + route);
    }
}

async function handleAsset(req, res, url) {
    const name = url.pathname.slice(ASSETS_PATH.length);
    const ext = path.extname(name).toLowerCase();
    const kind = ext === ".js" ? "js" : ext === ".css" ? "css" : "asset";

    let answer = kind === "asset" ? { status: 200, delayMs: 0 } : decide(kind, url.searchParams.get(RETRY_PARAM));
    let body = null;
    if (answer.status === 200) {
        // Only plain file names directly in dist/assets.
        if (/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name) && CONTENT_TYPES[ext]) {
            body = await readFile(path.join(assetsDir, name)).catch(() => null);
        }
        if (body === null) {
            answer = { status: 404, delayMs: answer.delayMs };
        }
    }
    record(req, url, kind, answer);

    later(res, answer.delayMs, () => {
        if (answer.status === 200) {
            send(res, 200, { "Content-Type": CONTENT_TYPES[ext], "Cache-Control": ONE_YEAR }, body, req.method);
        } else {
            send(res, 404, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": ONE_YEAR }, NOT_FOUND_BODY, req.method);
        }
    });
}

async function handle(req, res) {
    const url = new URL(req.url || "/", SIM_ORIGIN);

    if (url.pathname.startsWith("/__sim/")) {
        await handleControl(req, res, url);
        return;
    }

    if (url.pathname === PAGE_PATH && (req.method === "GET" || req.method === "POST")) {
        // A POST is the answer to a form; its body is not needed.
        req.resume();
        record(req, url, "page", { status: 200, delayMs: 0 });
        send(res, 200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }, PAGE_HTML);
        return;
    }

    if (url.pathname.startsWith(ASSETS_PATH) && (req.method === "GET" || req.method === "HEAD")) {
        await handleAsset(req, res, url);
        return;
    }

    req.resume();
    record(req, url, "other", { status: 404, delayMs: 0 });
    send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not found\n", req.method);
}

const server = http.createServer((req, res) => {
    handle(req, res).catch(error => {
        const statusCode = error instanceof HttpError ? error.statusCode : 500;
        if (statusCode === 500) {
            console.error(error);
        }
        sendJson(res, statusCode, { error: error.message });
    });
});

server.on("error", error => {
    if (error.code === "EADDRINUSE") {
        fail(SIM_HOST + ":" + SIM_PORT + " is already in use. Stop whatever is using it, or set E2E_SIM_PORT.");
    }
    fail(error.stack || String(error));
});

server.listen(SIM_PORT, SIM_HOST, () => {
    console.log("Edge simulator listening on " + SIM_ORIGIN);
    console.log("  page:    " + SIM_ORIGIN + PAGE_PATH);
    console.log("  script:  " + SIM_ORIGIN + scriptPath);
    console.log("  style:   " + SIM_ORIGIN + stylePath);
    console.log("  control: POST " + SIM_ORIGIN + '/__sim/reset  {"js":{"plain":404}}   GET ' + SIM_ORIGIN + "/__sim/log");
});

function shutDown() {
    server.close();
    server.closeAllConnections();
    process.exit(0);
}
process.on("SIGINT", shutDown);
process.on("SIGTERM", shutDown);
