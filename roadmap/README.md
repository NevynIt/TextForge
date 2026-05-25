# TextForge Rebuild Roadmap Package V15l

This package is arranged as a single drop-in `roadmap/` folder for the TextForge repository. Copy or merge this folder into the repository root. After that, every coding agent should start from `roadmap/AGENTS_START_HERE.md`.

The roadmap folder contains the standalone architecture body, the authoritative implementation roadmap set, package guides, reference specifications, and the append-only RAPID log for risks, actions, progress, issues, and decisions. V15l keeps Phases 3.5, 3.6, and 3.7 as completed, moves the next implementation step to the Phase 4 TF-MD baseline after the unified resource model plus target-aware command affordances, and keeps exact architecture-paragraph anchors plus explicit pnpm dependency actions for every phase/package row. It also keeps reverse traceability paragraphs after the architecture source blocks so implementers can see the responsible phase/package from the architecture document itself.

The roadmap also includes exact architecture-reference anchors, a consolidated pnpm install matrix, and a phase-sequenced package dependency activity diagram that shows when each package starts depending on other packages and app surfaces across Phases -1 through 19, including the new 3.6/3.7 pre-Phase-4 corrections.

For runnable local artifacts, the live instruction set now assumes a source-owned bootstrap path: a canonical file-launch HTML document plus a deterministic classic loader bundle, not a shipped module-script HTML entry repaired by post-build rewriting.

Authority split:

- `textforge_rebuild_whitepaper_main.md` owns target architecture, invariants, and design rationale.
- `00_package_aware_roadmap.md`, `01_repository_and_package_strategy.md`, `packages/*.md`, and `RAPID.md` own implementation sequencing, package rollout, and current execution state.

## Contents

- `AGENTS_START_HERE.md` - first document for any coding agent unleashed on the repository.
- `00_package_aware_roadmap.md` - phase roadmap showing which packages are created or updated at each step.
- `01_repository_and_package_strategy.md` - monorepo, pnpm workspace, package versioning, scoped commits, and package-boundary strategy.
- `02_architecture_paragraph_reference_index.md` - exact paragraph/block anchors for the architecture whitepaper.
- `02_phase_architecture_pnpm_matrix.md` - consolidated phase/package architecture references and pnpm install commands.
- `03_package_dependency_activity_diagram.md` - package dependency activity sequence diagram across roadmap phases.
- `04_phase_3_5_screenshot_validation_checklist.md` - screenshot-based validation checklist for Phase 3.5 shell usability.
- `specs/textforge_markdown_profile.md` - TF-MD source specification used to phase Markdown-profile implementation across Phases 4, 5, 6, 9, and 14.
- `validation/phase-3-5-reference-antipattern.png` - reference screenshot showing the layout anti-patterns Phase 3.5 must eliminate.
- `validation/phase-3-5-validation-report.json` - browser-measured Phase 3.5 layout, overflow, popup, and duplicate-title metrics at the required desktop states.
- `validation/phase-3-5-resize-panel-widths.json` - Phase 3.5 width evidence for default, narrow, wide, and dragged shell-panel states.
- `RAPID.md` - repository-local append-only RAPID log.
- `textforge_rebuild_whitepaper_main.md` - main standalone architecture body; it deliberately does not own phase sequencing.
- `packages/*.md` - one implementation guide per package, including Phase 3.1/3.2/3.3/3.4/3.5 recovery, pull-forward, readability, resource-identity, popup usability, resizable-panel, screenshot-validation responsibilities, and phased TF-MD implementation responsibilities or compatibility notes.

## How to use

1. Copy or merge the entire `roadmap/` folder into the repository root.
2. Start with `roadmap/AGENTS_START_HERE.md`.
3. If the repository has not yet been pivoted, use Phase -1 in `roadmap/00_package_aware_roadmap.md` together with `roadmap/01_repository_and_package_strategy.md`.
4. Use `roadmap/00_package_aware_roadmap.md` to determine the current phase.
5. Use `roadmap/02_phase_architecture_pnpm_matrix.md` to confirm the active phase's exact architecture anchors and pnpm dependency commands.
6. Use `roadmap/03_package_dependency_activity_diagram.md` to understand cross-package dependency activation for the current and next phases.
7. Maintain `roadmap/RAPID.md` continuously. Historical RAPID rows are append-only and must always be appended at the end of the file; add superseding or correction rows instead of editing old entries or regrouping rows by type.
8. Commit roadmap/RAPID updates together with implementation changes.

## Repository-local structure after upload

```text
roadmap/
  AGENTS_START_HERE.md
  00_package_aware_roadmap.md
  01_repository_and_package_strategy.md
  02_architecture_paragraph_reference_index.md
  02_phase_architecture_pnpm_matrix.md
  03_package_dependency_activity_diagram.md
  RAPID.md
  textforge_rebuild_whitepaper_main.md
  specs/
    textforge_markdown_profile.md
  packages/
    core.md
    workspace.md
    surfaces.md
    pipeline.md
    itm.md
    security-profile.md
    ui.md
    editors.md
    assets.md
    markdown.md
    diagrams.md
    lua.md
    bpmn.md
    tables.md
    archimate.md
    examples-docs.md
```
