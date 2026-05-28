# 09 — Optional Adapter Workpackages

Optional adapters are provider-specific integrations behind stable TextForge contracts.

They should not block generic roadmap progress unless a specific release profile selects them.

## Identity adapters

| WP | Adapter | Depends on | Blocks only |
|---|---|---|---|
| WP-SSO-ENTRA | Microsoft Entra SSO | WP-ID-01, WP-POLICY-01, backend manifest | Production Entra validation/accreditation. |
| WP-SSO-OIDC | Generic OIDC / Keycloak-compatible adapter | WP-ID-01, WP-POLICY-01 | OIDC-based production deployments. |
| WP-SSO-SAML | SAML adapter | WP-ID-01, WP-POLICY-01 | SAML-based production deployments. |
| WP-SSO-KEYCLOAK | Named Keycloak adapter if needed | WP-ID-01, WP-POLICY-01 | Keycloak-specific deployment polish. |

## Repository/persistence adapters

| WP | Adapter | Depends on | Notes |
|---|---|---|---|
| WP-GITLAB | GitLab persistence adapter | WP-BE-PERSIST, WP-RES-03, WP-POLICY-01 | Backend-only; maps changesets to commits/MRs. |
| WP-REPO-SHAREPOINT | SharePoint-like repository adapter | WP-BE-PERSIST, WP-RES-03, WP-POLICY-01 | Candidate future backend-only adapter. |

## AI adapters

| WP | Adapter | Depends on | Notes |
|---|---|---|---|
| WP-AI-MEDIATOR | Backend AI mediator contract/service | WP-BE-PERSIST, WP-POLICY-01, audit hooks | Read/suggest first; non-mutating. |
| WP-AI-CHAT | AI client and chat surface | WP-AI-MEDIATOR | Talk-with-docs UX. |
| WP-AI-PREF | AI preference integration | WP-AI-CHAT, WP-SET-01/SET-UI | Preferences cannot expand permissions/scope. |
| Future AI provider adapters | Provider-specific LLM routing | WP-AI-MEDIATOR | Backend-only; not frontend SDKs. |

## Distribution adapters

| WP | Adapter | Notes |
|---|---|---|
| Browser extension wrapper | Thin wrapper over local static frontend | No separate product roadmap. |
| WP-DIST-PWA | PWA/local packaged variant investigation | Requires separate security profile if storage/network posture changes. |

## Adapter validation rule

Every adapter must prove:

- provider-specific dependencies stay behind the adapter boundary;
- frontend contracts remain provider-neutral;
- optional unavailability disables actions or emits diagnostics without changing document semantics;
- selected release/security claims remain true.


## Visual ITM translator adapters

`WP-VITM-TRANSLATORS` is a standalone format-adapter/domain track.

It depends only on `WP-VITM-01` and can be implemented independently from runtime renderer recovery or visual editing.

Candidate translators:

- DOT -> Visual ITM;
- Visual ITM -> DOT;
- Visual ITM -> Mermaid;
- later BPMN-related translators.

Translator loss profiles should be user-facing documentation rather than a heavy automated compatibility engine at first.
