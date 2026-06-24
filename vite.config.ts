import path from "path";
import fs from "node:fs/promises";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { keycloakify } from "keycloakify/vite-plugin";
import { buildEmailTheme } from "keycloakify-emails";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
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
