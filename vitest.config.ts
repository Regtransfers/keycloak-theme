import { defineConfig } from "vitest/config";

// Kept apart from vite.config.ts so unit tests do not load the Keycloakify and Tailwind plugins.
export default defineConfig({
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"]
    }
});
