// Addresses shared by the edge simulator, the Playwright config and the static specs.
// Plain JavaScript so that the simulator can import it with no build step.
import process from "node:process";

export const SIM_HOST = "127.0.0.1";

// Fixed and unusual, so that it is unlikely to clash with a dev server. E2E_SIM_PORT overrides it
// for both the simulator and the tests (they read the same environment).
export const SIM_PORT = Number(process.env.E2E_SIM_PORT || 47213);

export const SIM_ORIGIN = "http://" + SIM_HOST + ":" + SIM_PORT;

// Where Keycloak serves a login page.
export const PAGE_PATH = "/realms/e2e/login-actions/authenticate";

// Where Keycloak serves the theme's built files ("abcde" stands in for Keycloak's resource version).
export const RESOURCES_PATH = "/resources/abcde/login/keycloak-theme/dist/";
export const ASSETS_PATH = RESOURCES_PATH + "assets/";

// The query parameter the loader adds to a retried address.
export const RETRY_PARAM = "kcr";

// The localStorage keys the loader remembers a working address under.
export const STORE_KEYS = { script: "rt-theme-asset:script", style: "rt-theme-asset:style" };
