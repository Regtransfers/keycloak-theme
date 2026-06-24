<!-- generated-by: generate_repo_claude_md.py -->
# CLAUDE.md — keycloak-theme

> Auto-generated from the central Regtransfers docs repo ("Regtransfers Software" folder).
> Re-generate with scripts/generate_repo_claude_md.py — do not hand-edit (changes will be
> overwritten). For estate-wide rules read docs/playbooks/AGENT-GUIDE.md in the docs repo.

## Estate ground rules (summary)

- Deployments go through the **flux** repo (kustomize base + overlays, SOPS secrets) — never
  kubectl-apply by hand.
- New code uses **MassTransit** over RabbitMQ (the custom EventBus is legacy-BlueMountain).
- Match the project's existing .NET TFM unless the task is an upgrade.
- Customer auth = Keycloak (phantom token via Regtransfers-Gateway); staff = identity-api/Azure AD.
- The Classic ASP intranet is live; check legacy-api before assuming data ownership.
- After changing endpoints/services: re-run extract_method_calls.py + generate_service_map.py
  in the docs repo.

## This repo

# Identity & Feature-Flag Repos

## keycloak-theme

`~/Projects/keycloak-theme` · React 18 + Vite + **Keycloakify** · custom login UI **and**
branded email theme (keycloakify-emails + jsx-email). theme-resources/ holds output. Deploys
into the Keycloak instance (flux: infrastructure/base/controllers/keycloak;
identity.regtransfers.net).

## keycloak-graph-proxy

`~/Projects/keycloak-graph-proxy` · zero-dependency Node http server (server.js) + k8s.yaml.
Fixes Keycloak↔Azure AD federation: Keycloak requires userinfo `sub` to match ID-token `sub`,
but MS Graph /me returns raw OID. Proxy extracts sub from the access token, merges Graph
attributes, returns compliant userinfo. Optional Keycloak group auto-sync via env vars.
Well-commented — read server.js directly.

## flagd-service

`~/Projects/flagd-service` · Node 20+ monorepo (packages/{api,ui,shared}) · "OpenFeature UI" —
self-hosted management platform for flagd feature flags (Apache 2.0, looks open-sourceable or
forked). Deployed as own namespace; host openfeature.regtransfers.net. Pairs with
open-feature-operator (repo not local; flux controller present) and flux docs/FEATURE_FLAGS.md.
Feature flags gate things like the Gateway's dual auth mode — flags are part of runtime
behaviour, so the service map should note flagd as a dependency of flagged services.

