// One-shot email preview: renders every template in src/email/templates to
// .rendered/ (HTML + plain text) using the templates' own getTemplate/getSubject,
// i.e. exactly what the Keycloak build ships, then exits. No watcher, no server.
//
//   npm run email:build            then open .rendered/index.html
//
// FreeMarker expressions such as ${magicLink} are left as-is; Keycloak fills them
// in at send time.

import { build } from "esbuild";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const templatesDir = path.join(root, "src/email/templates");
const outDir = path.join(root, ".rendered");
const bundleDir = path.join(outDir, ".bundle");

// JSON safe to inline in a <script> tag.
const json = v => JSON.stringify(v).replace(/</g, "\\u003c");

const escapeHtml = s =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

await rm(outDir, { recursive: true, force: true });
await mkdir(bundleDir, { recursive: true });

const names = (await readdir(templatesDir)).filter(f => f.endsWith(".tsx")).map(f => f.slice(0, -4)).sort();

await build({
    entryPoints: names.map(n => path.join(templatesDir, `${n}.tsx`)),
    outdir: bundleDir,
    outExtension: { ".js": ".mjs" },
    bundle: true,
    platform: "node",
    format: "esm",
    jsx: "automatic",
    packages: "external",
    logLevel: "error"
});

const props = { locale: "en", themeName: "keycloak-theme" };
const rows = [];

for (const name of names) {
    const mod = await import(pathToFileURL(path.join(bundleDir, `${name}.mjs`)).href);
    const [html, text, subject] = await Promise.all([
        mod.getTemplate({ ...props, plainText: false }),
        mod.getTemplate({ ...props, plainText: true }),
        mod.getSubject({ ...props, plainText: false })
    ]);
    await writeFile(path.join(outDir, `${name}.html`), html);
    await writeFile(path.join(outDir, `${name}.txt`), text);
    rows.push({ name, title: mod.templateName ?? name, subject, text });
}

await rm(bundleDir, { recursive: true, force: true });

const list = rows
    .map(
        r => `<li><button data-name="${r.name}">${escapeHtml(r.title)}</button>
            <small>${escapeHtml(r.subject)}</small></li>`
    )
    .join("\n");

await writeFile(
    path.join(outDir, "index.html"),
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Email preview</title>
<style>
    :root { color-scheme: light; }
    body { margin: 0; background: #fff; color: #222; display: grid; grid-template-columns: 280px 1fr; height: 100vh; font: 14px/1.4 system-ui, sans-serif; }
    nav { overflow: auto; border-right: 1px solid #ddd; padding: 12px; }
    ul { list-style: none; margin: 0; padding: 0; }
    li { margin-bottom: 10px; }
    button { all: unset; cursor: pointer; font-weight: 600; display: block; }
    button[aria-current] { color: #0a9c8a; }
    small { color: #777; }
    main { display: flex; flex-direction: column; min-width: 0; }
    header { display: flex; gap: 8px; padding: 8px 12px; border-bottom: 1px solid #ddd; align-items: center; }
    header span { margin-left: auto; color: #555; }
    iframe, pre { flex: 1; border: 0; margin: 0; }
    pre { padding: 16px; overflow: auto; white-space: pre-wrap; background: #fafafa; }
</style>
</head>
<body>
<nav><ul>${list}</ul></nav>
<main>
    <header>
        <label><input type="radio" name="view" value="html" checked /> HTML</label>
        <label><input type="radio" name="view" value="txt" /> Plain text</label>
        <label><input type="radio" name="width" value="100%" checked /> Desktop</label>
        <label><input type="radio" name="width" value="375px" /> Mobile</label>
        <span id="subject"></span>
    </header>
    <iframe id="frame" title="Email"></iframe>
    <pre id="text" hidden></pre>
</main>
<script>
    const subjects = ${json(Object.fromEntries(rows.map(r => [r.name, r.subject])))};
    const texts = ${json(Object.fromEntries(rows.map(r => [r.name, r.text])))};
    const frame = document.getElementById("frame"), text = document.getElementById("text");
    let current = location.hash.slice(1) || ${JSON.stringify(rows[0]?.name ?? "")};
    function show() {
        const view = document.querySelector("input[name=view]:checked").value;
        frame.style.width = document.querySelector("input[name=width]:checked").value;
        document.querySelectorAll("nav button").forEach(b => b.toggleAttribute("aria-current", b.dataset.name === current));
        document.getElementById("subject").textContent = "Subject: " + subjects[current];
        frame.hidden = view !== "html";
        text.hidden = view !== "txt";
        if (view === "html") frame.src = current + ".html";
        else text.textContent = texts[current];
        location.hash = current;
    }
    document.querySelectorAll("nav button").forEach(b => b.addEventListener("click", () => { current = b.dataset.name; show(); }));
    document.querySelectorAll("input").forEach(i => i.addEventListener("change", show));
    show();
</script>
</body>
</html>
`
);

console.log(`Rendered ${rows.length} emails to ${path.relative(root, outDir)}/ — open ${path.relative(root, outDir)}/index.html`);
