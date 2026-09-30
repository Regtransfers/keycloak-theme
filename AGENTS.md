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
  `vitest.config.ts`). Pure logic only; pages are previewed in Storybook, not unit-tested.
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

## Sign-in awareness (`src/login/lib/signInAwareness.ts`)

Our custom `Template` does not load Keycloak's `authChecker.js`, so pages do not get its "signed in in
another tab" handling for free. `useSignInAwareness` restores it where it matters — currently the
magic-link "Check your email" page (`ViewEmail.tsx`), which customers leave open while they go to their
inbox:

- `KEYCLOAK_SESSION` appearing, or changing from the value it had at load → go to
  `url.ssoLoginInOtherTabsUrl`, which finishes this tab's sign-in.
- 30 minutes passing (the realm's login timeout) → the attempt is gone; go to the website's
  `/authentication/challenge`, which sends a signed-in customer on and gives anyone else a fresh sign-in.
- `KC_AUTH_SESSION_HASH` is deliberately not watched: opening the magic link can replace it before the
  session cookie appears (well before, when a profile form is shown first), so reacting to it would
  abandon a sign-in that is about to complete.
- `Error.tsx` does the same hand-off for Keycloak's "cookie not found" error (an old sign-in page
  reloaded after its attempt ended — 430 of ~880 login errors in the first 18 h measured), once per tab
  per two minutes so a browser that really blocks cookies still sees the message.

Nothing redirects by itself unless the page is served from a `*.regtransfers.*` Keycloak host, so
Storybook stays put. A sign-in completed in a different browser or device cannot be seen from the page.

## Terminology

- Keycloak ships **login** and **account** themes; pages render via FreeMarker
  `.ftl` templates. **Keycloakify** lets us author those in React/TSX instead.

## Estate context

Part of the Regtransfers identity estate. Customer auth = Keycloak (this theme).
Deployments go through the **flux** repo (kustomize + SOPS) — never hand-applied.
Other repos in the estate (graph proxy, feature-flag service, etc.) are not present
here; this file covers only `keycloak-theme`.
