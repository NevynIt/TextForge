# WP-REPO-01 Validation Checklist

## Scope

`WP-REPO-01` validates the provider-backed repository/include resolver on top of the validated `WP-RES-01` resource descriptors and `WP-ITM-01` parser/model foundation. The slice must let `%repository` and `%include` resolve through local provider roots, bundled roots, and explicit logical alias maps without turning URL-like values into direct frontend fetches.

`WP-REPO-01` does not close `%require`, package evaluation, or TF-MD report-stream composition. Those remain `WP-ITM-02` and `WP-MD-REPORT`.

## Required checks

- `@textforge/workspace` exposes frontend-safe repository root/location helpers for local workspace paths, bundled roots, relative paths, provider-URI hints, and logical alias fixtures without importing backend adapters.
- `@textforge/itm` resolves `%repository` and `%include` through those helpers, including nested includes loaded from provider-backed roots.
- URL-like repository declarations are treated as provider/backend inputs in local mode and produce resolver diagnostics rather than direct frontend fetches.
- Resolver diagnostics distinguish unsupported, unauthorized, unavailable, unresolved, blocked, circular, and conflicting-alias outcomes through the stable `itm.resolve.*` taxonomy.
- Markdown `itm` fences surface the same repository/include diagnostics through the public contribution path instead of a shell-private adapter.
- Focused package checks, the app shell checks/build, the dependency map regeneration, and repo-wide verification all pass after the resolver changes.

## Validation evidence

- `corepack pnpm --filter @textforge/workspace lint`
- `corepack pnpm --filter @textforge/workspace test`
- `corepack pnpm --filter @textforge/workspace build`
- `corepack pnpm --filter @textforge/itm lint`
- `corepack pnpm --filter @textforge/itm test`
- `corepack pnpm --filter @textforge/itm build`
- `corepack pnpm --filter @textforge/markdown test`
- `corepack pnpm --filter @textforge/textforge-web test`
- `corepack pnpm --filter @textforge/textforge-web build`
- `corepack pnpm roadmap:dependency-map`
- `corepack pnpm roadmap:dependency-map:publish`
- `corepack pnpm verify`

## Notes

- The local/offline resolver currently recognizes workspace-relative paths, bundled provider URIs, and explicit logical alias fixtures supplied by the host or tests; unsupported URL-like values remain declarations that surface diagnostics instead of fetching.
- The delivered shell path inherits the resolver through the public `@textforge/itm` Markdown fence handlers, so later host/profile work can supply richer repository alias maps without changing the Markdown package contract.
