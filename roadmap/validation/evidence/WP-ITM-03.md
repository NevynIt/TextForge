# WP-ITM-03 Validation Evidence

## Summary

`WP-ITM-03` is validated for the revised ITM format additions: comments/trivia, identity maps, named contexts, scoped activation, package context activation, include isolation, scoped inference, and diagnostics.

The `ADR-0007` patch is also validated for regulated type inheritance, canonical context defaults, ordered node/relationship inference rules, package `defaultContext` activation, abstract-type diagnostics, polymorphic relationship constraints, and identity-only `%idmap` semantics.

## Implementation Evidence

- Canonical spec replaced at `docs/reference/specs/itm-format.md`.
- ADR added at `roadmap/decisions/ADR-0006-itm-format-scoped-contexts-and-identity.md`.
- ADR patch added at `roadmap/decisions/ADR-0007-itm-type-inheritance-and-context-inference.md`.
- Parser/model support added in `packages/itm/src/upstream/`.
- Evaluation support added in `packages/itm/src/internal.js` and `packages/itm/src/internal.ts`.
- Regression tests added in `packages/itm/test/index.test.js`.
- Example added at `docs/examples/itm/wp-itm-03-scoped-contexts.itm`.

## Commands Run

| Command | Result | Notes |
|---|---|---|
| `corepack pnpm --filter @textforge/itm test` | Pass | 33/33 ITM tests passed, including WP-ITM-03 and ADR-0007 coverage. |
| `corepack pnpm --filter @textforge/itm lint` | Pass | ITM package checks passed. |
| `corepack pnpm --filter @textforge/itm build` | Pass | Node syntax checks passed for ITM entrypoints. |
| `corepack pnpm --filter @textforge/markdown test` | Pass | 12/12 Markdown tests passed. |
| `corepack pnpm --filter @textforge/markdown build` | Pass | Markdown entrypoint syntax check passed. |
| `corepack pnpm --filter @textforge/textforge-web test` | Pass | 11/11 web tests passed and shell checks passed. |
| `corepack pnpm --filter @textforge/textforge-web build` | Pass | Dist, single-file, small single-file, and zip artifacts built. |
| `corepack pnpm roadmap:dependency-map` | Pass | Roadmap dependency map regenerated. |
| `corepack pnpm roadmap:dependency-map:check` | Pass | Roadmap dependency map was current. |
| `corepack pnpm verify` | Pass | Full repository lint, typecheck, test, and build passed. |

## ADR-0007 Patch Coverage

- Scalar/list `extends` normalization and canonical context fields are covered in `packages/itm/test/index.test.js`.
- Context inheritance, local-before-inherited rule ordering, explicit type precedence, and inferred type provenance are covered by ADR-0007 tests.
- Package `defaultContext` activation is covered for `%using package` and `%begin packageName`.
- Abstract inferred type diagnostics, relationship constraint diagnostics, invalid inference rules, invalid regexes, unknown context types, and `%idmap` type-alias misuse are covered by diagnostics tests.

## Notes

- No headless browser UI checks were run, following repository guidance.
- The web build emitted existing Vite/Rolldown warnings for externalized Node modules and `import.meta` in bundled dependencies, but the build and dist checks completed successfully.
