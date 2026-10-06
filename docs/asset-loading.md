# How the sign-in page loads its files, and why

Read this before changing `vite.config.ts`, `index.html`, `src/main.tsx`, `src/loader/` or the release
workflow. The short version: **the page needs exactly two files of its own, one script and one
stylesheet, and a small inline loader asks for either again, at a new address, if it fails to load.**

## What went wrong

On 05-10-2026 release 2.0.10 left the production sign-in page blank for about five minutes. The same
thing had happened, unnoticed, on 29-09-2026 with 2.0.8. The build was sound both times. The cause was
how a release reaches the browser:

1. Production runs three Keycloak pods. Each one downloads its own copy of the theme jar, and a release
   restarts them one at a time. For about a minute, old and new pods answer requests side by side, and
   nothing keeps a browser on the pod that served its page.
2. Built files have a hash of their content in their names. A release that changes the JavaScript
   therefore changes the file name. A page from a new pod asks for the new name, the request lands on an
   old pod, and the answer is 404.
3. `auth.regtransfers.co.uk` is behind Cloudflare, which caches that 404 for three minutes and serves
   it to everyone using that edge location.
4. Cloudflare also adds `Cache-Control: max-age=31536000` to every `.js` and `.css` response, errors
   included. **A browser that received the 404 keeps it for a year.** Chrome then fails the file from
   its own cache on every later visit, with no request at all, until the file name changes. A reload
   does not clear it. (Measured in Chrome 154, and in Chromium 153 by the browser tests. With
   production's empty 404 it holds every time: Chrome abandons a script or stylesheet as soon as it
   sees a 4xx, and keeps the 404 only if its body had been read to the end before that cancel took
   effect. An empty body always has been; a 404 with a body is usually kept too, but not always.
   Firefox and Safari have not been measured here; from their source, Firefox is expected to
   revalidate and Safari to vary.)

Measured on the day: three 404s at the origin during the restart; no sign-in form submissions for three
minutes; the page recovered by itself when the edge entry expired.

## What the build guarantees now

- **One JavaScript file and one stylesheet**, both named by tags in the page (`inlineDynamicImports` in
  `vite.config.ts`). Before, the page was 106 files that imported each other by name. A file that is
  imported by name from another file cannot be asked for at a different address, so a page made of them
  cannot be retried safely.
- **English only.** Internationalisation is off on every realm. A single file would otherwise carry
  every language Keycloakify ships and be three times the size (1.5 MB, not 0.5 MB), so each other
  language resolves to English (`englishOnlyLocales` in `vite.config.ts`). If a realm ever enabled
  another language it would show English text.
- **The loader runs first.** `src/loader/assetRetry.js` is copied, unchanged, into a script tag at the
  top of `<head>`. Keycloakify carries it into every page template it generates (45 pages, both theme
  names).
- **The stylesheet is byte-for-byte what it was** before this change (same sha256 as 2.0.10's). Tailwind
  builds a class for every class-like word in any file git does not ignore, so it is told not to scan
  `src/loader/`, `e2e/`, `scripts/` and `docs/` (`@source not` in `src/login/main.css`). Other files
  outside `src/`, such as `README.md` and the workflows, are still scanned: rewording them can change
  the stylesheet's name, and the script's with it. That is harmless now, but do not be surprised by it.

`npm run check-build` fails if the build stops being one script and one stylesheet with the loader
ahead of them, if the loader is not the whole, unaltered content of its script tag in the page and in
every generated template of both themes, or if another language or more than 700 kB reaches the
bundle. It does not compare the stylesheet with the previous release; it prints its sha256.

## What the loader does

It listens for the `error` event of the theme's own script and stylesheet tags. When one fails:

| Step | What happens |
| --- | --- |
| Attempts 1 to 6 | A new tag for the same file with `?kcr=<attempt>-<token>` added, after 0, 0.3, 0.8, 1.5, 3 and 5 seconds. About 10.6 s in all. |
| After attempt 6 (script only) | A notice appears: "This page is taking longer than usual to load", with a **Try again** button. |
| Attempts 7 onwards | It keeps trying quietly: after 8, 10 and 15 seconds, then every 20 seconds. |
| Six minutes after the first failure | It stops, and the notice stops saying it is still trying. The button stays. |
| The connection or the tab comes back | A waiting attempt is made at once. If it had stopped, it starts again for another six minutes. |

Why this gets past all three problems:

- **Mixed pods.** Each attempt is a fresh request, so it reaches whichever pod answers next.
- **Edge-cached 404.** Cloudflare's cache key includes the query string (checked on production,
  05-10-2026), so every attempt is a new entry that goes to the origin.
- **Browser-cached 404.** A different address is a different cache entry.

Details that matter:

- **One attempt at a time, and only after an error.** A new address is asked for only once the previous
  one has definitely failed, so the bundle can never be fetched successfully twice. `src/main.tsx` also
  renders only once (`window.__rtThemeBooted`).
- **It remembers what worked.** When a retry loads, and for the script only if the page then started,
  the token is stored in `localStorage` (`rt-theme-asset:script`, `rt-theme-asset:style`) with the file
  name. A browser holding a cached 404 then goes straight to an address it has cached as good, with no
  network request. A remembered token is used only for the same file, and is forgotten if it fails.
  The loader works without storage.
- **It never reloads the page by itself.** A reload re-runs the current Keycloak step, which for the
  "Check your email" page could mean sending another email. Only the button reloads, and it uses a GET
  for the current address without its fragment.
- **A 20-second watchdog**, counted from when the loader runs, shows the same notice if the page has
  not started and no error event ever arrived (a request that hangs, say). It fetches nothing.

## Rules

- Keep the build to one script and one stylesheet. Do not add `manualChunks`, remove
  `inlineDynamicImports`, or reference a file from the stylesheet (`url()`, `@import`) or from code
  (imported images or fonts). A file the page did not name in a tag cannot be retried. Host images
  elsewhere, as the logo is.
- Every page module now runs when the page starts, whichever page is shown. Do not put side effects at
  the top level of a module; put them in components or in `src/main.tsx`.
- `src/loader/assetRetry.js` is ES5 and is copied into a FreeMarker template inside an HTML script
  tag. Its header lists what it must never contain. The unit test enforces it.
- If you change the loader's timings or attribute names, change the tests in `src/loader/` and `e2e/`
  with it.

## What this does not protect

- **An old page asking a new pod for an old file.** During a restart a not-yet-restarted pod can serve
  a page naming the previous release's files. If the edge no longer has them, the request can reach a
  new pod and fail. Releases before 2.1.0 have no loader, so their pages go blank in that case. From
  2.1.0 on, the loader retries, shows the notice after ten seconds, and **Try again** fetches the new
  page.
- **Rolling back to 2.0.10 or earlier.** Those builds have no loader, and browsers hold cached 404s for
  some of their file names. Never redeploy them. If a release has to be undone, release the previous
  loader-carrying version again or roll forward.
- **Cloudflare itself.** The 404 should not be cached and should not carry a one-year lifetime. That is
  a Cloudflare setting, tracked separately; this design works without it. Sticky routing in Traefik
  would also remove most mixed-pod 404s.

## Releasing

1. Bump `version` in `package.json` in its own commit (`chore: bump version to X`). The release
   workflow refuses a tag that does not match it. **The next version is 2.1.0** (a minor bump for a
   significant change): the tag `v2.0.10` exists (cut without a bump, so `package.json` stayed at
   2.0.9) and must never be reused or moved.
2. Tag `vX`. The workflow builds, runs every check below, and publishes exactly the jars it built. The
   theme jar production uses and the provider jar are both started in a real Keycloak first; the
   kc-22-to-25 jar is only build-checked. It refuses to publish to a tag that already has a release.
3. Change the jar address in the flux repo for **staging only**. Walk through sign-in there.
4. Production in the 21:30 to 02:00 window. While the pods restart:
   - Do not request the new files through the public address to "see if they are up". One request that
     lands on an old pod is cached as a 404 for three minutes for everyone.
   - A few 404s at the origin for the new file names are expected. Retries carry `kcr=`. While old
     pods are still serving, any single retry can land on one, so expect chains of several attempts
     and the occasional notice. They should stop within about a minute of the last old pod going.
   - If the page misbehaves, wait until the last old pod has stopped plus three minutes before deciding
     anything. Reverting mid-restart adds a third version to the mix.

Useful Loki queries (counts only; never print request paths from the auth host, they can carry
sign-in tokens):

```logql
# 404s at the origin for theme files, by minute: the seed of the 05-10 incident
sum(count_over_time({app="traefik", container="public-traefik"} |= "keycloak-theme/dist/assets" |= "\"DownstreamStatus\":404" [1m]))

# Retries in use
sum(count_over_time({app="traefik", container="public-traefik"} |= "keycloak-theme/dist/assets" |= "kcr=" [1m]))

# Sign-in forms being submitted: this went to zero during the incident
sum(count_over_time({app="traefik", container="public-traefik"} |= "login-actions/authenticate" |~ "\"RequestMethod\":\\s*\"POST\"" [1m]))
```

Before the first release with a new edge configuration, check that the retry can still get past the
edge. Two different `kcr` values on a made-up file must both be a `MISS`:

```bash
U="https://auth.regtransfers.co.uk/resources/zzzzz/login/keycloak-theme/dist/assets/probe-$(date +%s).js"
curl -sI "$U?kcr=1" | grep -i cf-cache-status
curl -sI "$U?kcr=2" | grep -i cf-cache-status
```

## Tests

| Where | What it proves | What it cannot |
| --- | --- | --- |
| `src/loader/assetRetry.test.ts` (Vitest, jsdom) | The loader's decisions: what it reacts to, the schedule, one attempt at a time, the remembered token, the notice, the forbidden text. | Anything a real browser does: fetching, caching, running the bundle, navigating. |
| `scripts/check-build.mjs` | The built page and every generated template have the loader, once and unaltered, ahead of the two tags; the jar holds exactly the two files; no FreeMarker syntax leaked. | That FreeMarker renders it. |
| `e2e/static` (Playwright; Chrome locally, plus Firefox and WebKit in CI) | Real-browser behaviour against a local stand-in for Keycloak behind Cloudflare, with the real HTTP cache: cached 404s, mixed pods, total failure, recovery in place, the button. | FreeMarker, real Keycloak pages, Cloudflare. |
| `e2e/keycloak` (Playwright, CI only) | The built jar renders in real Keycloak 26.7.3 and the loader recovers there, including on a page that answers a form post and under the `<base>` tag Keycloakify adds. | The browser cache (request interception switches it off) and Cloudflare. |

Cloudflare's behaviour exists only in production; staging is not behind it.
