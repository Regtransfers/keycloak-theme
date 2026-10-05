import path from "path";
import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { keycloakify } from "keycloakify/vite-plugin";
import { buildEmailTheme } from "keycloakify-emails";

/**
 * Copies src/loader/assetRetry.js, verbatim, into a script tag at the very top of <head> of the
 * app's index.html, so it runs before the bundle and the stylesheet are requested. Keycloakify
 * then carries it into every page template it generates. See docs/asset-loading.md.
 */
function inlineAssetRetryLoader(): Plugin {
    const loaderPath = path.resolve(__dirname, "src", "loader", "assetRetry.js");

    return {
        name: "rt-inline-asset-retry-loader",
        apply: "build",
        transformIndexHtml(_html, ctx) {
            // Storybook runs this hook too, on its own iframe.html. The loader belongs in the app only.
            if (ctx.path !== "/index.html") {
                return undefined;
            }

            const source = readFileSync(loaderPath, "utf8").replace(/\r\n?/g, "\n");

            if (/<\/script/i.test(source)) {
                throw new Error("src/loader/assetRetry.js must not contain a closing script tag");
            }

            return [
                {
                    tag: "script",
                    // data-cfasync: keeps Cloudflare's Rocket Loader, should it ever be switched on,
                    // from deferring this script behind the tags it has to run before.
                    attrs: { "data-rt-asset-loader": "", "data-cfasync": "false" },
                    children: source,
                    injectTo: "head-prepend"
                }
            ];
        }
    };
}

/**
 * Internationalisation is off on every realm, so English is the only language ever shown. The
 * build produces a single JavaScript file (docs/asset-loading.md), which would otherwise carry
 * every language Keycloakify ships and be three times the size (1.5 MB, not 0.5 MB). So each other
 * language resolves to English instead. If a realm ever enabled another language it would show
 * English text, not fail.
 */
function englishOnlyLocales(): Plugin {
    let stubbed = 0;

    return {
        name: "rt-english-only-locales",
        enforce: "pre",
        load(id) {
            const match = id
                .replace(/\\/g, "/")
                .match(/\/keycloakify\/(?:src\/)?(?:login|account)\/i18n\/messages_defaultSet\/([A-Za-z-]+)\.(js|ts)$/);

            if (!match || ["en", "index", "types"].includes(match[1])) {
                return null;
            }

            stubbed += 1;

            return `export { default } from "./en.${match[2]}";`;
        },
        closeBundle() {
            if (stubbed > 0) {
                console.log(`rt-english-only-locales: ${stubbed} language files resolved to English`);
            }
        }
    };
}

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                // One JavaScript file and one stylesheet, both named in the page itself. A page
                // made of files that import each other by name cannot be retried safely when one
                // of them fails to load: see docs/asset-loading.md before changing this.
                inlineDynamicImports: true
            }
        }
    },
    plugins: [
        inlineAssetRetryLoader(),
        englishOnlyLocales(),
        tailwindcss(),
        react(),
        keycloakify({
            accountThemeImplementation: "none",
            postBuild: async buildContext => {
                // Build email theme from JSX templates
                await buildEmailTheme({
                    templatesSrcDirPath: path.join(
                        buildContext.themeSrcDirPath,
                        "email",
                        "templates"
                    ),
                    i18nSourceFile: path.join(
                        buildContext.themeSrcDirPath,
                        "email",
                        "i18n.ts"
                    ),
                    themeNames: buildContext.themeNames,
                    keycloakifyBuildDirPath: buildContext.keycloakifyBuildDirPath,
                    locales: ["en"],
                    cwd: import.meta.dirname,
                });

                const customTemplatesDir = path.join(
                    buildContext.projectDirPath,
                    "src",
                    "main",
                    "resources",
                    "theme-resources",
                    "templates"
                );

                const generatedResourcesDir = buildContext.keycloakifyBuildDirPath;

                // Keep custom provider-level templates (magic-link and extensions) in generated output.
                await fs.mkdir(
                    path.join(generatedResourcesDir, "theme-resources", "templates"),
                    { recursive: true }
                );
                await fs.cp(
                    customTemplatesDir,
                    path.join(generatedResourcesDir, "theme-resources", "templates"),
                    { recursive: true }
                );

                // Ensure server-rendered waiting pages override in each theme's login directory.
                for (const themeName of buildContext.themeNames) {
                    const loginDir = path.join(
                        generatedResourcesDir,
                        "theme",
                        themeName,
                        "login"
                    );

                    await fs.mkdir(loginDir, { recursive: true });

                    for (const ftlName of [
                        "view-email.ftl",
                        "view-email-continuation.ftl"
                    ]) {
                        await fs.copyFile(
                            path.join(customTemplatesDir, ftlName),
                            path.join(loginDir, ftlName)
                        );
                    }
                }


            },
            // Register two theme variants: light (default) and dark.
            // In the Keycloak admin console, Realm Settings → Themes,
            // you can select either "keycloak-theme" or "keycloak-theme-dark".
            themeName: ["keycloak-theme", "keycloak-theme-dark"]
        })
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src")
        }
    }
});
