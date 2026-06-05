# WP-05A Validation Checklist

## Scope

`WP-05A` validates the canonical bundled contribution manifest and registry model. It does not close document-scoped capability activation, `%require` resolution, or contribution execution. Those remain `WP-05B` and `WP-05C`.

## Required checks

- Canonical manifest normalization exists in `@textforge/core` for package identity, dependency descriptors, contribution local names, and derived canonical IDs.
- The registry exposes deterministic manifest/package ordering independent of import order.
- Package dependency failures are surfaced as registry package state plus diagnostics instead of being silently ignored.
- Canonical ID conflicts are surfaced as registry diagnostics instead of silently overriding prior registrations.
- The workbench contribution inspector consumes the core registry read model rather than ad hoc raw manifest counting.
- Composition remains bundled/static only; no runtime package install, fetch, or remote code loading is introduced.

## Validation evidence

- `corepack pnpm --filter @textforge/core test`
- `corepack pnpm --filter @textforge/core lint`
- `corepack pnpm --filter @textforge/core typecheck`
- `corepack pnpm --filter ./apps/textforge-web test`
- `corepack pnpm --filter ./apps/textforge-web build`
- `corepack pnpm verify`

## Notes

- `WP-05A` intentionally keeps active document capability context separate from package availability. Package status blocks broken bundles early; active/inactive document capability selection still belongs to `WP-05B`.
