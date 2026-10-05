#!/usr/bin/env node
/* global process */
/*
 * Checks that a build has the shape docs/asset-loading.md depends on.
 *
 *   node scripts/check-build.mjs                      checks dist/
 *   node scripts/check-build.mjs --jar <path> ...     also checks each theme jar (needs `unzip`)
 *
 * Run after `npm run build` (or `npm run build-keycloak-theme` when jars are given). It exits
 * non-zero and lists every failure. It prints the sha256 of the two assets and of the generated
 * login.ftl, so a pull-request build and a release build can be compared.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(root, "dist");
const assetsDir = path.join(distDir, "assets");
const loaderPath = path.join(root, "src", "loader", "assetRetry.js");

// The bundle is about 535 kB. A jump past this almost certainly means the other languages are
// back in it (all of them add about 1 MB).
const MAX_BUNDLE_BYTES = 700_000;

// Sign-in wording that exists only in the German, French, Spanish, Polish, Chinese and Japanese
// message files.
const OTHER_LANGUAGE_WORDS = ["Anmelden", "Se connecter", "Iniciar sesi\u00f3n", "Zaloguj", "\u767b\u5f55", "\u30ed\u30b0\u30a4\u30f3"];

// The theme names vite.config.ts registers. Both must be in every jar, with the same pages.
const EXPECTED_THEMES = ["keycloak-theme", "keycloak-theme-dark"];
const MIN_PAGES = 40;

// The tag vite.config.ts writes the loader into, as Vite and Keycloakify serialise it.
const LOADER_OPEN_TAG = '<script data-rt-asset-loader="" data-cfasync="false">';

// File names that browsers and the edge may hold a cached "not found" for, from the releases of
// 29-09-2026 and 05-10-2026. A build must never produce them again.
const BURNT_NAMES = ["index-FlsncwqC.js", "index-D2HBz0Zq.js", "main-oMN4XPY2.css"];

// Sequences that must not appear in the loader: it is copied into a FreeMarker template, inside an
// HTML script element, and Keycloak inserts its own script before the first closing head tag.
const LOADER_FORBIDDEN = [
    ["FreeMarker interpolation", /\$\{|#\{/],
    ["FreeMarker directive", /<\/?[#@]/],
    ["closing script, head or body tag", /<\/(script|head|body)/i],
    ["HTML comment or script opener", /<!--|<script/i]
];

const failures = [];
const fail = message => failures.push(message);
const sha256 = data => createHash("sha256").update(data).digest("hex");
const count = (text, needle) => text.split(needle).length - 1;

function readLoader() {
    return fs.readFileSync(loaderPath, "utf8").replace(/\r\n?/g, "\n");
}

function checkLoaderSource(loader) {
    for (const [what, pattern] of LOADER_FORBIDDEN) {
        if (pattern.test(loader)) {
            fail(`src/loader/assetRetry.js contains a ${what}`);
        }
    }
}

/** Order and uniqueness of the tags in a page, built (index.html) or generated (.ftl). */
function checkPage({ label, html, loader, scriptSrc, styleHref, expectBase }) {
    const loaderCount = count(html, loader);

    if (loaderCount !== 1) {
        fail(`${label}: the loader appears ${loaderCount} times, expected exactly once and unaltered`);
        return;
    }

    const loaderAt = html.indexOf(loader);

    // The whole element, not only the text: anything else inside the same tag, or a type attribute,
    // could stop the loader running while its text is still there, unaltered.
    if (count(html, LOADER_OPEN_TAG + loader + "</script>") !== 1) {
        fail(`${label}: the loader is not the whole content of a plain ${LOADER_OPEN_TAG} element`);
    }

    const scriptTag = `src="${scriptSrc}"`;
    const styleTag = `href="${styleHref}"`;

    for (const [what, needle] of [
        ["bundle script tag", scriptTag],
        ["stylesheet tag", styleTag]
    ]) {
        const found = count(html, needle);

        if (found !== 1) {
            fail(`${label}: ${what} ${needle} appears ${found} times, expected once`);
        }
    }

    const firstStylesheetAt = html.search(/rel="stylesheet"/);
    const scriptAt = html.indexOf(scriptTag);
    const styleAt = html.indexOf(styleTag);

    if (firstStylesheetAt !== -1 && firstStylesheetAt < loaderAt) {
        fail(`${label}: a stylesheet link comes before the loader, so it could fail before the loader is listening`);
    }

    if (scriptAt !== -1 && scriptAt < loaderAt) {
        fail(`${label}: the bundle script tag comes before the loader`);
    }

    if (styleAt !== -1 && styleAt < loaderAt) {
        fail(`${label}: the stylesheet tag comes before the loader`);
    }

    const headCloses = count(html.toLowerCase(), "</head");

    if (headCloses !== 1) {
        fail(`${label}: ${headCloses} closing head tags, expected one (Keycloak inserts a script before the first)`);
    }

    if (expectBase) {
        const baseAt = html.indexOf("<base ");

        if (baseAt === -1 || baseAt > loaderAt) {
            fail(`${label}: expected Keycloakify's <base> tag before the loader`);
        }
    }
}

function checkDist() {
    if (!fs.existsSync(path.join(distDir, "index.html"))) {
        fail("dist/index.html is missing: run `npm run build` first");
        return null;
    }

    const loader = readLoader();
    checkLoaderSource(loader);

    const top = fs.readdirSync(distDir).sort();

    if (top.join(",") !== "assets,index.html") {
        fail(`dist/ should hold only assets/ and index.html, found: ${top.join(", ")}`);
    }

    const assets = fs.readdirSync(assetsDir).sort();
    const scripts = assets.filter(name => name.endsWith(".js"));
    const styles = assets.filter(name => name.endsWith(".css"));

    if (assets.length !== 2 || scripts.length !== 1 || styles.length !== 1) {
        fail(
            `dist/assets should hold exactly one .js and one .css, found: ${assets.join(", ")}. ` +
                "Anything else is a file the loader cannot retry (see docs/asset-loading.md)."
        );
        return null;
    }

    const [script] = scripts;
    const [style] = styles;

    for (const name of [script, style]) {
        if (BURNT_NAMES.includes(name)) {
            fail(`dist/assets/${name} reuses a file name from a failed rollout; browsers may hold a cached "not found" for it`);
        }
    }

    const scriptBytes = fs.readFileSync(path.join(assetsDir, script));
    const styleBytes = fs.readFileSync(path.join(assetsDir, style));
    const scriptText = scriptBytes.toString("utf8");
    const styleText = styleBytes.toString("utf8");

    if (scriptBytes.length > MAX_BUNDLE_BYTES) {
        fail(`dist/assets/${script} is ${scriptBytes.length} bytes, over the ${MAX_BUNDLE_BYTES} ceiling`);
    }

    for (const word of OTHER_LANGUAGE_WORDS) {
        if (scriptText.includes(word)) {
            fail(`dist/assets/${script} contains "${word}": the other languages are back in the bundle`);
        }
    }

    if (/\bfrom\s*["']\.{1,2}\//.test(scriptText) || /\bimport\(\s*["']\.{1,2}\//.test(scriptText)) {
        fail(`dist/assets/${script} imports another file by relative path; the bundle must be self-contained`);
    }

    if (/@import\b/.test(styleText) || /url\(/.test(styleText)) {
        fail(
            `dist/assets/${style} references another file (@import or url()). ` +
                "A file loaded from the stylesheet cannot be retried by the loader."
        );
    }

    const html = fs.readFileSync(path.join(distDir, "index.html"), "utf8").replace(/\r\n?/g, "\n");

    checkPage({
        label: "dist/index.html",
        html,
        loader,
        scriptSrc: `/assets/${script}`,
        styleHref: `/assets/${style}`,
        expectBase: false
    });

    // Not counting the loader itself, which names the directory in its own code.
    const assetReferences = count(html.replace(loader, ""), "/assets/");

    if (assetReferences !== 2) {
        fail(`dist/index.html refers to /assets/ ${assetReferences} times, expected 2 (the bundle and the stylesheet)`);
    }

    console.log(`sha256 ${sha256(scriptBytes)}  dist/assets/${script}  (${scriptBytes.length} bytes)`);
    console.log(`sha256 ${sha256(styleBytes)}  dist/assets/${style}  (${styleBytes.length} bytes)`);

    return { loader, script, style, scriptHash: sha256(scriptBytes), styleHash: sha256(styleBytes) };
}

function unzip(args) {
    return execFileSync("unzip", args, { maxBuffer: 256 * 1024 * 1024 });
}

function checkJar(jarPath, dist) {
    const label = path.relative(root, path.resolve(jarPath));

    if (!fs.existsSync(jarPath)) {
        fail(`${label}: file not found`);
        return;
    }

    const entries = unzip(["-Z1", jarPath])
        .toString("utf8")
        .split("\n")
        .filter(entry => entry && !entry.endsWith("/"));
    const themes = [...new Set(entries.map(entry => entry.match(/^theme\/([^/]+)\/login\//)?.[1]).filter(Boolean))];

    if (themes.slice().sort().join(",") !== EXPECTED_THEMES.join(",")) {
        fail(`${label}: login themes are [${themes.join(", ")}], expected [${EXPECTED_THEMES.join(", ")}]`);
    }

    let firstPages = null;

    for (const theme of themes) {
        const failuresBefore = failures.length;

        const assetPrefix = `theme/${theme}/login/resources/dist/assets/`;
        const assets = entries.filter(entry => entry.startsWith(assetPrefix)).map(entry => entry.slice(assetPrefix.length));

        if (assets.sort().join(",") !== [dist.script, dist.style].sort().join(",")) {
            fail(`${label}: ${assetPrefix} holds ${assets.join(", ") || "nothing"}, expected ${dist.script} and ${dist.style}`);
            continue;
        }

        for (const [name, expected] of [
            [dist.script, dist.scriptHash],
            [dist.style, dist.styleHash]
        ]) {
            if (sha256(unzip(["-p", jarPath, assetPrefix + name])) !== expected) {
                fail(`${label}: ${assetPrefix}${name} differs from dist/assets/${name}`);
            }
        }

        const pagePrefix = `theme/${theme}/login/`;
        const pages = entries.filter(entry => entry.startsWith(pagePrefix) && entry.endsWith(".ftl") && !entry.slice(pagePrefix.length).includes("/"));

        const pageNames = pages.map(page => page.slice(pagePrefix.length)).sort();

        if (pages.length < MIN_PAGES || !pageNames.includes("login.ftl")) {
            fail(`${label}: ${pages.length} page templates under ${pagePrefix}, expected at least ${MIN_PAGES} including login.ftl`);
        }

        if (firstPages === null) {
            firstPages = pageNames;
        } else if (firstPages.join(",") !== pageNames.join(",")) {
            fail(`${label}: theme ${theme} does not have the same page templates as ${themes[0]}`);
        }

        for (const page of pages) {
            const ftl = unzip(["-p", jarPath, page]).toString("utf8");
            const pageLabel = `${label}!${page}`;

            checkPage({
                label: pageLabel,
                html: ftl,
                loader: dist.loader,
                scriptSrc: `\${xKeycloakify.resourcesPath}/dist/assets/${dist.script}`,
                styleHref: `\${xKeycloakify.resourcesPath}/dist/assets/${dist.style}`,
                expectBase: true
            });

            // Everything after Keycloakify's own first script (the kcContext declaration, which is
            // FreeMarker by design) must be plain HTML apart from three interpolations of the
            // resources path: the base tag, the bundle and the stylesheet.
            const afterContext = ftl.slice(ftl.indexOf("</script>"));
            const interpolations = count(afterContext, "${");

            if (interpolations !== 3) {
                fail(`${pageLabel}: ${interpolations} FreeMarker interpolations after the kcContext script, expected 3`);
            }

            if (/#\{|<\/?[#@]/.test(afterContext)) {
                fail(`${pageLabel}: FreeMarker syntax after the kcContext script; the loader text was not kept plain`);
            }
        }

        if (theme === themes[0]) {
            const login = entries.find(entry => entry === `${pagePrefix}login.ftl`);

            if (login) {
                console.log(`sha256 ${sha256(unzip(["-p", jarPath, login]))}  ${label}!${login}`);
            }
        }

        if (failures.length === failuresBefore) {
            console.log(`ok     ${label}: theme ${theme}, ${pages.length} page templates`);
        }
    }
}

const jars = [];
const args = process.argv.slice(2);

for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--jar" && args[i + 1]) {
        jars.push(args[i + 1]);
        i += 1;
    } else {
        console.error(`Unknown argument: ${args[i]}\nUsage: node scripts/check-build.mjs [--jar <path>]...`);
        process.exit(2);
    }
}

const dist = checkDist();

if (dist) {
    for (const jar of jars) {
        checkJar(jar, dist);
    }
}

if (failures.length > 0) {
    console.error(`\ncheck-build: ${failures.length} problem(s)`);

    for (const failure of failures) {
        console.error(` - ${failure}`);
    }

    process.exit(1);
}

console.log(`check-build: ok (${jars.length} jar(s) checked)`);
