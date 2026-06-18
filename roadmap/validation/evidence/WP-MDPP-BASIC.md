# WP-MDPP-BASIC Validation Evidence

## Summary

`WP-MDPP-BASIC` is validated for the intentionally limited TextForge md++ slice: basic `[md:*]:` directive parsing, metadata and requirement surfacing, workspace-backed include/resource resolution, embedded DOT model rendering, basic theme/stylesheet handling, semantic preview HTML, and preservation of the md++ v0.14 reference material.

This does not validate the complete md++ runtime described by the upstream spec. Worker RPC, plugin manifests, source maps, patches, page model, pagination, PDF export, visual editing, interactions, and Office import remain out of scope for this workpackage.

## Implementation Evidence

- md++ v0.14 reference material copied under `docs/reference/specs/mdpp/v0.14/`.
- Workpackage and checklist added at `roadmap/workpackages/WP-MDPP-BASIC.md` and `roadmap/validation/checklists/workpackages/WP-MDPP-BASIC-basic-mdpp-parser-renderer.md`.
- Basic md++ preprocessing added in `packages/markdown/src/mdpp.js`.
- Markdown render integration added in `packages/markdown/src/render.js`, `packages/markdown/src/fences.js`, `packages/markdown/src/processor.js`, `packages/markdown/src/tfmd.js`, and package export/type files.
- md++ capability aliases added in `packages/markdown/src/contributions.js` and DOT model aliases in `packages/diagrams/src/capabilities.js`.
- Workspace-backed md++ resource resolution added in `apps/textforge-web/src/workbench/controller/index.js`.
- Regression coverage added in `packages/markdown/test/index.test.js` and `apps/textforge-web/test/markdownWorkbenchIntegration.test.js`.

## Commands Run

| Command | Result | Notes |
|---|---|---|
| `corepack pnpm --filter @textforge/markdown test` | Pass | 18/18 Markdown tests passed, including md++ directive, include, theme, stylesheet, model, and diagnostics coverage. |
| `corepack pnpm --filter @textforge/diagrams test` | Pass | 5/5 diagram tests passed after DOT capability alias additions. |
| `corepack pnpm --filter @textforge/markdown build` | Pass | Markdown package build passed. |
| `corepack pnpm --filter @textforge/textforge-web test -- markdownWorkbenchIntegration.test.js` | Pass | Web workbench integration tests passed, including workspace-backed md++ includes/resources. Existing Lua circular dependency warnings were emitted but did not fail the run. |
| `node roadmap/scripts/generate-views.mjs --check` | Pass | Generated roadmap views are current. |
| `corepack pnpm roadmap:dependency-map:publish:check` | Pass | Published dependency map is current. |

## Notes

- No headless browser UI checks were run, following repository guidance.
- Manual UI validation remains appropriate for visual preview confirmation in the browser.
