# Keycloak Theme

Custom Keycloak theme built with [Keycloakify](https://docs.keycloakify.dev) and React.

## Getting Started

### Install dependencies

```bash
npm install
```

### Development with Storybook (recommended)

Test your theme outside of Keycloak using Storybook with hot reloading:

```bash
# Add stories for pages you want to work on
npx keycloakify add-story

# Start Storybook
npm run storybook
```

Storybook will be available at http://localhost:6006

### Development with Vite dev server

```bash
npm run dev
```

> Uncomment the mock context block in `src/main.tsx` to preview a specific page.

## Building the Theme

### Build the Keycloak JAR

> **Prerequisite:** [Apache Maven](https://maven.apache.org/install.html) must be installed.
> On Windows: `choco install maven` — On macOS: `brew install maven`

```bash
npm run build-keycloak-theme
```

This generates JAR files in `dist_keycloak/`:

- `keycloak-theme-for-kc-all-other-versions.jar` — Keycloak 11–21 and 26+
- `keycloak-theme-for-kc-22-to-25.jar` — Keycloak 22–25

### Build Storybook

```bash
npm run build-storybook
```

## Testing

### Outside Keycloak (Storybook)

See [Keycloakify docs](https://docs.keycloakify.dev/testing-your-theme/outside-of-keycloak).

Run `npm run storybook` to preview pages in different states without needing a live Keycloak instance.

### Inside Keycloak (Docker)

See [Keycloakify docs](https://docs.keycloakify.dev/testing-your-theme/inside-of-keycloak).

```bash
npx keycloakify start-keycloak
```

## Customisation

### Adding a new page

To customise a specific Keycloak page, eject it into your project:

```bash
npx keycloakify eject-page
```

Then add it to the `switch` statement in `src/login/KcPage.tsx`.

### Adding a story for a page

```bash
npx keycloakify add-story
```

### CSS customisation

Import a stylesheet in `src/login/KcPage.tsx`:

```tsx
import "./main.css";
```

CSS class names are available via the `ClassKey` type from `keycloakify/login`.

## Deployment

Push to `master` to trigger GitHub Actions which:
1. Builds the Storybook and deploys it to GitHub Pages
2. Builds the Keycloak theme JAR and uploads it as a workflow artifact

To load the JAR into Keycloak:

```bash
docker run \
    -v "./dist_keycloak/keycloak-theme-for-kc-all-other-versions.jar":/opt/keycloak/providers/keycloak-theme.jar \
    quay.io/keycloak/keycloak:26.0.7 \
    start
```

Then enable the theme in **Realm Settings → Themes** in the Keycloak Admin Console.
