import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { keycloakify } from "keycloakify/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        tailwindcss(),
        react(),
        keycloakify({
            accountThemeImplementation: "none",
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
