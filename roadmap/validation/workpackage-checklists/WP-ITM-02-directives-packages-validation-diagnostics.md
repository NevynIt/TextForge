# WP-ITM-02 Validation Checklist

## Scope

`WP-ITM-02` validates the TextForge-owned ITM directive, package, validation, and diagnostics layer on top of the validated `WP-ITM-01` parser/model wrapper plus the `WP-05B` active capability context.

The delivered slice must evaluate `%require`, `%package`, and `%using` deterministically inside `@textforge/itm`, activate package-owned declarations by scope without remote loading, execute the built-in validation-rule primitives when the required bundled `itm.*` capabilities are active, and emit stable diagnostics when required capabilities or providers are unavailable.

`WP-ITM-02` does not close BPMN-specific or ArchiMate-specific semantic providers. Those remain `WP-BPMN-SEM` and `WP-ARCHIMATE-SEM`.

## Required checks

- `@textforge/itm` exposes bundled semantic capabilities for the shipped `itm.core`, `itm.type-hierarchy`, `itm.relationship-identity`, `itm.validation`, `itm.graph-model`, `itm.viewpoint`, and `itm.roundtrip.meta` requirement names without introducing runtime package loading.
- `%using` activates package-owned namespaces, types, styles, rules, and viewpoints by deterministic source provenance and requested scope, while inactive package content stays out of the effective document model.
- `%require` resolution reuses the `WP-05B` capability model when a contribution registry is available and falls back to the bundled `@textforge/itm` capability manifest otherwise.
- Built-in validation steps such as `requireId`, `requireAttribute`, `requireSourceType`, and `requireResolvedTarget` execute when their bundled capability is active; missing or inactive providers emit stable diagnostics instead of silently passing.
- Active viewpoint pipelines surface provider-capability mismatches through the same ITM diagnostic path, without fetching or dynamically loading code.
- Markdown `itm` fences propagate the same package/rule diagnostics through the public contribution path used by the web shell.

## Validation evidence

- `corepack pnpm --filter @textforge/itm test`
- `corepack pnpm --filter @textforge/itm build`
- `corepack pnpm --filter @textforge/markdown test`
- `corepack pnpm --filter @textforge/markdown build`
- `corepack pnpm --filter @textforge/textforge-web test`
- `corepack pnpm --filter @textforge/textforge-web build`
- `corepack pnpm verify`

## Notes

- The delivered package-evaluation model associates declarations to the nearest preceding `%package` in the same source document, so included profile files can stay canonical text while `%using` controls which declarations become active in the effective model.
- `%require` remains capability activation/check metadata, not a package loader. The implementation emits diagnostics for missing, ambiguous, incompatible, or inactive capabilities and never fetches, installs, or imports remote code.
- Bundled semantic capabilities intentionally do not expose provider names such as `requireId`, `graph.auto`, or `markdown` as aliases. Capability lookup relies on IDs, derived local names such as `itm.validation`, and the explicit `itmBuiltinValidationCapabilityByProvider` map for built-in rule-provider gating.
