# V18 Security and Accreditation Invariants

All workpackages must preserve these invariants unless a future RAPID decision creates a separate explicit security profile.

1. Local/offline mode remains fully supported.
2. Local/offline mode has no File System Access API, persistent directory handles, silent local reads/writes, or background folder sync.
3. Local/offline mode has no arbitrary network providers.
4. Enterprise mode uses one approved backend origin per app session/deployment.
5. Backend-only adapters never leak into frontend-safe packages.
6. Settings personalize UI/defaults only; they do not grant permissions.
7. Backend-backed writes use revisions and multi-resource changesets.
8. AI is backend-mediated and non-mutating at first.
9. Optional backend capabilities hide/disable actions or emit diagnostics; they do not change document semantics.
10. Identity adapters such as Entra, OIDC, SAML, or Keycloak are production adapters behind `identity-contract`; they do not block generic backend development.

## Local profile claim

TextForge runs locally in the browser, does not require a backend, does not silently access or modify local files, and moves files in/out only through explicit user-mediated import/export.

## Enterprise backend profile claim

TextForge communicates only with one approved backend origin. The backend serves the app and API, enforces SSO/policy/repository/service/AI/audit rules, and keeps provider-specific adapters backend-only.
