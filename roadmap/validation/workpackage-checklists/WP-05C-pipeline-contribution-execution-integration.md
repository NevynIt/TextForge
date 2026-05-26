# WP-05C Validation Checklist

## Scope

`WP-05C` validates canonical bundled contribution execution on top of the already validated `WP-05A` registry and `WP-05B` document-scoped resolver. It closes the remaining shell-side runtime adapters, active-context pipeline execution, and intermediate reopening over registered surfaces.

## Required checks

- Surface, pipeline, and Markdown fence-handler runtime behavior is executed from canonical registered contributions instead of shell-local `contributionId` switch logic.
- Active document pipeline execution resolves both qualified contribution IDs and unambiguous short names over the current document contribution context.
- Ambiguous active short-name pipeline execution fails with shared diagnostics instead of silently picking one implementation.
- Pipeline runs record intermediate values with representation metadata so later reopening does not depend on ad hoc shell objects.
- Markdown fenced-block rendering resolves active handlers from the current document context and delegates Mermaid/Graphviz execution through canonical active pipeline contributions.
- Pipeline intermediate reopening can project a pipeline value into surface open-with selection using the active document capability context, with a safe text fallback where a richer viewer is not active.
- Composition remains bundled/static only; contribution execution and `%require` activation do not fetch, install, import, or remotely load code.

## Validation evidence

- `corepack pnpm --filter @textforge/pipeline test`
- `corepack pnpm --filter @textforge/pipeline lint`
- `corepack pnpm --filter @textforge/surfaces test`
- `corepack pnpm --filter @textforge/surfaces lint`
- `corepack pnpm --filter @textforge/markdown test`
- `corepack pnpm --filter @textforge/markdown lint`
- `corepack pnpm --filter @textforge/diagrams test`
- `corepack pnpm --filter @textforge/diagrams lint`
- `corepack pnpm --filter ./apps/textforge-web test`
- `corepack pnpm --filter ./apps/textforge-web build`
- `corepack pnpm verify`

## Notes

- `WP-05C` keeps execution bundled and local: runtime functions are attached to canonical contribution records, and the app shell consumes them generically through the registry/resolver model rather than by reintroducing package-local dispatch tables.
- The delivered reopening baseline is intentionally conservative: pipeline values reopen through normal surface compatibility over synthesized resource facts, which allows richer viewers when active and otherwise falls back to the source editor path when that is the only compatible active surface.
