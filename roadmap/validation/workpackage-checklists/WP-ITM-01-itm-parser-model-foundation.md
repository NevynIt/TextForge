# WP-ITM-01 Validation Checklist

## Scope

`WP-ITM-01` validates the `@textforge/itm` parser/model foundation. The delivered slice vendors the current upstream ITM runtime inside the TextForge workspace, then layers TextForge-owned workspace include resolution, stable resolver-diagnostic taxonomy helpers, projection/publication helpers, and Markdown `itm`/`itm-pub` contribution integration on top of that foundation.

`WP-ITM-01` does not close `%require` capability activation, package evaluation, or profile-specific rule execution. Those remain `WP-ITM-02`.

## Required checks

- Stable public parse/serialize/resolve/validate/project APIs are exported from `@textforge/itm` without app-shell-private imports.
- Workspace include resolution consumes provider/workspace contracts and does not introduce direct frontend network fetching for `%repository` or `%include`.
- Resolver diagnostics expose stable categories for unresolved, unsupported, unauthorized, unavailable, conflicting alias, and version/capability mismatch outcomes so downstream Markdown/surface layers can consume one taxonomy.
- Selector/style/view/viewpoint projection behavior is covered by focused package tests.
- Vendored BPMN and ArchiMate profile fixtures load through the public package APIs.
- Markdown `itm` and `itm-pub` contribution handlers consume the package through public exports and render publication HTML over embedded ITM sources.

## Validation evidence

- `corepack pnpm --filter @textforge/itm lint`
- `corepack pnpm --filter @textforge/itm test`
- `corepack pnpm --filter @textforge/itm build`
- `corepack pnpm --filter @textforge/markdown test`
- `corepack pnpm --filter ./apps/textforge-web test`
- `corepack pnpm roadmap:dependency-map`
- `corepack pnpm roadmap:dependency-map:check`
- `corepack pnpm verify`

## Notes

- The validated package vendors the upstream `nevynit/ITM` runtime under `packages/itm/src/upstream/` and keeps the TextForge integration logic in the package wrapper so TextForge can eventually replace the standalone ITM repository without forking the public package surface.
- The current resolver taxonomy is intentionally foundational: it standardizes the diagnostics that later provider/package-capability work will emit, while leaving `%require` capability activation and package execution semantics to `WP-ITM-02`.
