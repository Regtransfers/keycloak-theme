# CLAUDE.md — keycloak-theme

Hand-maintained project memory for this repo. Keep it concise and current.

> **README.md is the source of truth** for build, Storybook, email preview, and JAR
> output details — read it first. This file is the quick orientation layer.

## What this is

`~/Github/keycloak-theme` · **React 18 + Vite + Keycloakify**. A custom Keycloak
**login UI** *and* a fully **branded email theme** (keycloakify-emails + jsx-email).
Deploys into the Keycloak instance (flux: `infrastructure/base/controllers/keycloak`;
`identity.regtransfers.net`).

## Stack / versions

- Keycloakify `^11.15.0`, keycloakify-emails `^3.3.1`, jsx-email `^2.8.4`
- React `^18.2.0`, Vite `^5`, Tailwind v4 (`@tailwindcss/vite`), shadcn, Storybook 8
- TypeScript `^5.2`, Node `^18 || >=20`
- Themes (from `vite.config.ts`): `["keycloak-theme", "keycloak-theme-dark"]`
  (light default + dark variant). `accountThemeImplementation: "none"`.

## Build / Dev

- `npm test` — Vitest unit tests (`src/**/*.test.ts`, node environment, config in
  `vitest.config.ts`). Pure logic, plus the asset loader evaluated in jsdom; pages are previewed in
  Storybook, not unit-tested.
- `npm run dev` — Vite dev server. (Uncomment the mock context block in
  `src/main.tsx` to preview a specific page.)
- `npm run storybook` — Storybook on port **6006**; preview login/account pages
  outside Keycloak with hot reload.
- `npm run email` — jsx-email preview server for the templates in
  `src/email/templates`.
- `npm run build-keycloak-theme` — `npm run build` (`tsc && vite build`) then
  `keycloakify build`. **Apache Maven is a prerequisite.** Produces, in
  `dist_keycloak/`:
  - `keycloak-theme-for-kc-all-other-versions.{jar,zip}` (KC 11–21, 26+)
  - `keycloak-theme-for-kc-22-to-25.{jar,zip}` (KC 22–25)
- `npm run format` — Prettier (`prettier . --write`).

## Layout (`src/`)

- `login/` — login theme (`KcPage.tsx`, `pages/`, `components/`, `i18n.ts`,
  `main.css`).
- `account/` — account theme pages/components (theme impl is "none" at build, but
  source lives here).
- `email/` — branded email theme: `templates/` (~16 `.tsx` templates),
  `EmailWrapper.tsx` (shared branded wrapper), `layout.tsx`, `i18n.ts`.
- `components/`, `lib/` — shared UI / utilities.
- `kc.gen.tsx`, `main.tsx` — Keycloakify generated context + entrypoint.
- `src/main/resources/theme-resources/` — **SOURCE** dir for custom provider-level
  FreeMarker templates (e.g. magic-link `.ftl`), copied into the build output by the
  `postBuild` hook in `vite.config.ts`. The build **output** is the JAR/zip in
  `dist_keycloak/`.

## Asset loading (read before touching the build)

**`docs/asset-loading.md` is required reading** before changing `vite.config.ts`, `index.html`,
`src/main.tsx`, `src/loader/` or the workflows. In brief:

- The build emits **one JavaScript file and one stylesheet** (`inlineDynamicImports`, English-only
  locales). `src/loader/assetRetry.js` is copied verbatim into a script tag at the top of `<head>` and
  asks for either file again, at a new address (`?kcr=`), if it fails to load. This exists because a
  rolling restart of the Keycloak pods plus Cloudflare caching a 404 (with a one-year browser lifetime)
  blanked the sign-in page on 29-09-2026 and 05-10-2026.
- Do not split the bundle, import images or fonts, or add `url()` / `@import` to the stylesheet: a file
  the page does not name in a tag cannot be retried. `npm run check-build` enforces the shape.
- Every page module runs at start-up now. No side effects at module top level.
- The loader file is ES5 and ends up inside a FreeMarker template; its header lists what it must not
  contain, and `src/loader/assetRetry.test.ts` enforces it.
- Never redeploy 2.0.10 or earlier: they have no loader and browsers hold cached 404s for their files.

Tests: `npm test` (unit, includes the loader in jsdom), `npm run check-build` (after a build),
`PW_CHANNEL=chrome npm run e2e -- --project=static-chromium` (real browser, local), and the
real-Keycloak run in CI (`.github/workflows/verify.yml`), which also gates every release tag.

## Terminology

- Keycloak ships **login** and **account** themes; pages render via FreeMarker
  `.ftl` templates. **Keycloakify** lets us author those in React/TSX instead.

## Estate context

Part of the Regtransfers identity estate. Customer auth = Keycloak (this theme).
Deployments go through the **flux** repo (kustomize + SOPS) — never hand-applied.
Other repos in the estate (graph proxy, feature-flag service, etc.) are not present
here; this file covers only `keycloak-theme`.
