# 02 — Workspace, Resources, and Repositories

This cluster converts workspace content into provider-aware, revision-aware, capability-aware resources while preserving the local/offline security model.

`WP-RES-01` is now validated and establishes the provider-aware descriptor baseline for `WP-RES-02`, `WP-REPO-01`, and later backend provider work. `WP-REPO-01` is now validated on top of that baseline: local/offline repository declarations resolve through workspace-owned provider roots, bundled roots, and explicit logical alias fixtures, while URL-like values stay diagnostic-producing declarations instead of becoming direct frontend fetches.

## Workpackages

| WP | Title | Depends on | Notes |
|---|---|---|---|
| WP-RES-01 | Provider-aware resource descriptors | Foundation resource facts | Extend existing resource facts; do not invent parallel metadata. |
| WP-RES-02 | Revisions, dirty state, and conflict diagnostics | WP-RES-01 | Enables backend save and stale revision warnings. |
| WP-RES-03 | Multi-resource changesets and provider allowlists | WP-RES-02 | Backend writes, GitLab, AI patches, generated artifacts converge here. |
| WP-REPO-01 | Repository reference and include resolver | WP-RES-01, WP-ITM-01 | Validated local/offline provider-backed `%repository`/`%include`; logical names, provider hints, and bundled roots resolve without arbitrary frontend fetch. |
| WP-SERVICES-LOCAL | Local service-folder convention | WP-RES-01, WP-05C recommended | Data-plane only; control-plane actions remain explicit operations. |

## Security constraints

- Local/offline mode forbids File System Access API, persistent directory handles, silent local reads/writes, and background folder sync.
- Local/offline mode must not directly fetch arbitrary repository URLs.
- Provider allowlists are distribution/profile-specific.
- Backend-only adapters must not leak into frontend-safe packages.

## Package guidance

Relevant package guides:

- `package-guides/workspace.md`
- `package-guides/backend-optional.md`
- `package-guides/security-profile.md`
- `package-guides/itm.md`
