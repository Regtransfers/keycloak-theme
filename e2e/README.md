# Browser tests

Playwright tests for the theme. The static projects prove that the asset-retry loader
(`src/loader/assetRetry.js`, background in `docs/asset-loading.md`) recovers in a real browser,
against a real HTTP cache, with no Keycloak involved.

## Running

```sh
npm run build                                              # the static tests serve dist/
PW_CHANNEL=chrome npm run e2e -- --project=static-chromium # installed Google Chrome
```

`PW_CHANNEL=chrome` uses the Chrome already on the machine; without it Playwright wants its own
Chromium download (`npx playwright install chromium`). The static suite takes about three and a half
minutes on one worker: several tests have to sit through the loader's real timings (the notice at
about 10.6 s, retries 8 s and 10 s apart after it).

| Project             | When                                   | What it runs                                                   |
| ------------------- | -------------------------------------- | -------------------------------------------------------------- |
| `static-chromium`   | always                                 | `e2e/static` against the edge simulator                        |
| `static-firefox`    | `CI` set or `PW_ALL_BROWSERS=1`        | the same, in Firefox (`npx playwright install firefox`)        |
| `static-webkit`     | `CI` set or `PW_ALL_BROWSERS=1`        | the same, in WebKit (`npx playwright install webkit`)          |
| `keycloak-chromium` | `KC_BASE_URL` set                      | `e2e/keycloak` against the Keycloak at that address            |

Playwright starts the simulator for you (its `webServer`), unless `--project` names only Keycloak
projects. Retries are off on purpose: a retry would hide a flaky loader.

## The edge simulator

`e2e/support/edge-simulator.mjs` is a dependency-free Node server that plays "Keycloak behind
Cloudflare" for `dist/`, on `http://127.0.0.1:47213` (`E2E_SIM_PORT` changes it):

- `/realms/e2e/login-actions/authenticate` (GET or POST) is `dist/index.html` reshaped as Keycloak
  serves it: assets under `/resources/abcde/login/keycloak-theme/dist/assets/`, `<base href>` first
  in `<head>`, `no-store`. The Google Fonts tags are removed so that nothing touches the internet.
  There is no `kcContext`, so the app renders `<h1>No Keycloak Context</h1>`.
- Every asset answer, 200 or 404, carries `Cache-Control: max-age=31536000`, as Cloudflare did on
  05-10-2026. That is what makes a browser keep a 404. The 404 has no body and no content type,
  exactly as production answers for a file it does not have (probed 06-10-2026). That matters in
  Chromium, where the strict checks run: Blink gives up on a failed script or stylesheet as soon as
  it sees the status, and a 404 with a body is kept in its cache only if all of it had been read by
  then. With a body, the "later visits ask the server for nothing" checks become timing-dependent
  in the Chromium 153 headless shell: the old 66-byte body failed once in CI run 37344236337 (it
  passed 25 in 25 locally), and a 64 kB body failed 5 times in 25 locally (Chrome 154 passed all
  25).
- Each test scripts the failures through a JSON control API (`/__sim/reset`, `/__sim/rules`,
  `/__sim/log`). The rules and their order are documented at the top of the file.

By hand:

```sh
node e2e/support/edge-simulator.mjs
curl -X POST http://127.0.0.1:47213/__sim/reset -d '{"js":{"plain":404},"css":{"plain":404}}'
# open http://127.0.0.1:47213/realms/e2e/login-actions/authenticate in a browser
curl http://127.0.0.1:47213/__sim/log
```

## The static specs

- `recovery.spec.ts`: healthy load is inert; cached 404 on the plain addresses (including later
  visits, a new tab and a reload served entirely from the cache); mixed servers; a repeating edge;
  a slow original; the boot guard.
- `notice.spec.ts`: nothing loads (notice timing and legibility, no reload, slow retries, healing
  in place); an edge that ignores the query string; stylesheet-only and script-only failures;
  `online` and `visibilitychange`; the watchdog.
- `try-again.spec.ts`: the button's GET, without the fragment, after a GET and after a form POST.
- `storage.spec.ts`: no storage, storage full, stale and foreign remembered tokens, garbage values.
- `simulator.spec.ts`: checks on the simulator itself.

Every test fails on an uncaught page error. Helpers and the in-page probe live in
`e2e/support/theme.ts`.

**Never use `page.route` or `context.route` in `e2e/static`.** Any route handler switches the
browser's HTTP cache off, and half of what these tests prove is how the loader behaves with a
cached 404. Make the simulator fail instead.

## What these tests cannot prove

- Real Cloudflare: whether it really caches a 404 for a `kcr` address, ignores or honours the
  query string, or keeps a 404 for longer than the simulator's rules describe.
- Real Keycloak: the FreeMarker templates Keycloakify generates, a real `kcContext`, the resource
  version changing between releases, Content-Security-Policy and nonces, a rolling restart's timing.
  The `keycloak-chromium` project is for those.
- The loader's 360 s give-up: too long for this suite.
- Real connectivity and tab changes: `online` and `visibilitychange` are dispatched, not caused.
  A blocker that swallows error events is simulated with an init script.
- Mobile browsers, back/forward cache restores, service workers, cache eviction under pressure.
- Firefox and WebKit locally: they run on CI only. There the "no request reaches the server on a
  later visit" checks are relaxed to "the page starts once" (Firefox revalidates a cached 404 on a
  normal load; WebKit's reuse of a failed file depends on timing).
