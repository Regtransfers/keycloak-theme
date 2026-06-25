# Regtransfers Keycloak Provider

A small Keycloak SPI that backs the "verify your email" waiting page so it can
show a terminal **"Email address has been verified, it is safe to close this
window"** message — instead of redirecting/logging in or hitting an expired page.

## What it adds

A realm resource endpoint:

```
GET /realms/{realm}/verify-email-status?client_id={clientId}&tab_id={tabId}
→ 200 {"verified": true|false}
```

The browser tab on the verify-email page polls this every few seconds
(`src/login/pages/LoginVerifyEmail.tsx`). The endpoint never trusts a user id
from the caller; it resolves the user from the caller's own cookies:

1. **Cross-device** (verify on phone, desktop tab still open): the desktop's
   authentication session is still alive, so we read the attached user from it
   (`AUTH_SESSION_ID` cookie + `tab_id`/`client_id` from the page URL) and report
   its persisted `emailVerified` flag.
2. **Same-browser** (link opened in another tab, which consumed the auth
   session): we fall back to the SSO identity cookie.

Only ever returns a single boolean about the caller's own session — no user
enumeration, no PII.

## Version

Targets **Keycloak 26.6.1** (`quay.io/keycloak/keycloak:26.6.1`), compiled for
**JDK 17**. Keep `keycloak.version` in `pom.xml` in lockstep with the running
image. All Keycloak deps are `provided` (present in the server at runtime).

## Build

```bash
mvn -f keycloak-provider/pom.xml clean package
# → keycloak-provider/target/regtransfers-keycloak-provider.jar
```

CI (`.github/workflows/release.yml`) builds this on every `v*` tag and attaches
`regtransfers-keycloak-provider.jar` to the GitHub Release.

## Deploy

The flux Keycloak CR init-container `wget`s release JARs into
`/opt/keycloak/providers`. Add a line pulling
`regtransfers-keycloak-provider.jar` from the matching release tag. With
`startOptimized: false`, Keycloak augments (discovers providers) on pod start.
