import { fileURLToPath } from "node:url";
import { defineConfig, devices, type Project } from "@playwright/test";
import { SIM_ORIGIN } from "./support/constants.mjs";

/*
 * Browser tests for the theme. See e2e/README.md.
 *
 *   PW_CHANNEL=chrome npm run e2e -- --project=static-chromium
 *
 * Projects
 *   static-chromium    Always. The built theme (dist/) served by e2e/support/edge-simulator.mjs.
 *   static-firefox     With CI set or PW_ALL_BROWSERS=1.
 *   static-webkit      With CI set or PW_ALL_BROWSERS=1.
 *   keycloak-chromium  With KC_BASE_URL set: a real Keycloak at that address.
 */

const onCI = !!process.env.CI;
const allBrowsers = onCI || process.env.PW_ALL_BROWSERS === "1";
// "chrome" uses the installed Google Chrome instead of Playwright's own Chromium download.
const channel = process.env.PW_CHANNEL || undefined;
const keycloakBaseUrl = process.env.KC_BASE_URL;
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

const projects: Project[] = [
    {
        name: "static-chromium",
        testDir: "./static",
        use: { ...devices["Desktop Chrome"], channel, baseURL: SIM_ORIGIN }
    }
];

if (allBrowsers) {
    projects.push(
        { name: "static-firefox", testDir: "./static", use: { ...devices["Desktop Firefox"], baseURL: SIM_ORIGIN } },
        { name: "static-webkit", testDir: "./static", use: { ...devices["Desktop Safari"], baseURL: SIM_ORIGIN } }
    );
}

if (keycloakBaseUrl) {
    projects.push({
        name: "keycloak-chromium",
        testDir: "./keycloak",
        use: { ...devices["Desktop Chrome"], channel, baseURL: keycloakBaseUrl }
    });
}

/**
 * The project names given with --project on the command line (none means all). Playwright has no
 * per-project web server, so this is how a run of only the Keycloak project avoids starting the
 * simulator, which needs dist/ to exist. Mirrors Playwright's own parsing: --project takes every
 * following argument up to the next option.
 */
function selectedProjects(argv: string[]): string[] {
    const names: string[] = [];
    for (let i = 0; i < argv.length; i++) {
        if (argv[i].startsWith("--project=")) {
            names.push(argv[i].slice("--project=".length));
        } else if (argv[i] === "--project") {
            while (i + 1 < argv.length && !argv[i + 1].startsWith("-")) {
                names.push(argv[++i]);
            }
        }
    }
    return names;
}

const selected = selectedProjects(process.argv);
const needsSimulator = selected.length === 0 || selected.some(name => !name.startsWith("keycloak-"));

export default defineConfig({
    projects,
    workers: 1,
    fullyParallel: false,
    // A retry would hide a flaky loader.
    retries: 0,
    forbidOnly: onCI,
    reporter: onCI ? [["list"], ["html", { outputFolder: "../playwright-report", open: "never" }]] : "list",
    outputDir: "../test-results",
    use: {
        trace: "retain-on-failure"
    },
    webServer: needsSimulator
        ? {
              command: "node e2e/support/edge-simulator.mjs",
              cwd: repoRoot,
              url: SIM_ORIGIN + "/__sim/health",
              reuseExistingServer: false,
              timeout: 15_000,
              stdout: "pipe",
              stderr: "pipe"
          }
        : undefined
});
