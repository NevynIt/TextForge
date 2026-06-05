# WP-05B Validation Checklist

## Scope

`WP-05B` validates document-scoped capability activation and deterministic resolver context on top of the already validated `WP-05A` bundled registry. It does not close contribution execution or intermediate reopening. Those remain `WP-05C`.

## Required checks

- `@textforge/core` exposes one pure document-scoped resolver over the canonical bundled registry rather than adding package-local activation logic.
- Capability activation is deterministic and ordered across explicit `%require`, document defaults, workspace/app defaults, and core defaults.
- Capability local names and aliases resolve bundled `%require` inputs without requiring package authors to duplicate fully qualified IDs in documents.
- Missing or ambiguous `%require` inputs emit shared diagnostics instead of silently activating the wrong capability or falling back to global lookup.
- Active short-name conflicts are diagnosed over the current document context instead of being hidden behind global registry order.
- Markdown preview and surface open-with selection consume the resolved active document context instead of assuming every bundled capability is globally active.
- The shell inspector exposes the current document capability context, active contributions, requirements, and diagnostics on top of the existing package registry view.
- Composition remains bundled/static only; `%require` does not fetch, install, import, or remotely load code.

## Validation evidence

- `corepack pnpm --filter @textforge/core test`
- `corepack pnpm --filter @textforge/core lint`
- `corepack pnpm --filter @textforge/core typecheck`
- `corepack pnpm --filter @textforge/markdown test`
- `corepack pnpm --filter @textforge/markdown lint`
- `corepack pnpm --filter @textforge/markdown typecheck`
- `corepack pnpm --filter @textforge/surfaces test`
- `corepack pnpm --filter @textforge/surfaces lint`
- `corepack pnpm --filter @textforge/surfaces typecheck`
- `corepack pnpm --filter ./apps/textforge-web test`
- `corepack pnpm --filter ./apps/textforge-web build`
- `corepack pnpm verify`

## Notes

- The Markdown baseline stays conservative by default: Markdown preview, local asset resolution, math, Mermaid, and Graphviz remain document-default active for Markdown resources, while SVG/JSON/YAML fenced-block renderers now require explicit activation.
- `WP-05B` intentionally stops before canonical runtime contribution execution and intermediate reopening; those remain in `WP-05C`.
