# TextForge Rebuild Roadmap Package V17 — Reassessment Start

This package is arranged as a single drop-in `roadmap/` folder for the TextForge repository. Copy or merge this folder into the repository root. After that, every coding agent should start from `roadmap/AGENTS_START_HERE.md`.

The roadmap folder contains the standalone architecture body, the authoritative implementation roadmap set, package guides, reference specifications, and the append-only RAPID log for risks, actions, progress, issues, and decisions. V16 marks the backend-optional architecture integration. It preserves the existing phase order and Phase 5 contribution/capability roadmap, adds backend/resource-provider work as explicit later sub-phases, stores the backend whitepaper and grilling record, and keeps exact architecture-paragraph anchors plus explicit pnpm dependency actions for every existing and new phase/package row. It also keeps reverse traceability paragraphs after the architecture source blocks so implementers can see the responsible phase/package from the architecture document itself.

The roadmap also includes exact architecture-reference anchors, a consolidated pnpm install matrix, and a phase-sequenced package dependency activity diagram that shows when each package starts depending on other packages and app surfaces across Phases -1 through 19, including the 3.6/3.7 pre-Phase-4 corrections, the Phase 4.1 pre-Phase-5 stabilization gate, and the V16 backend-optional sub-phase sequence from 5.1 onward.

For runnable local artifacts, the live instruction set now assumes a source-owned bootstrap path: a canonical file-launch HTML document plus a deterministic classic loader bundle, not a shipped module-script HTML entry repaired by post-build rewriting.

Authority split:

- `textforge_rebuild_whitepaper_main.md` owns target architecture, invariants, and design rationale.
- `00_package_aware_roadmap.md`, `01_repository_and_package_strategy.md`, `packages/*.md`, and `RAPID.md` own implementation sequencing, package rollout, and current execution state.



## V17 workpackage reassessment

V17 starts the conversion from a strictly linear Phase 5+ roadmap into a dependency-gated workpackage backlog. The existing phase roadmap remains the detailed scope and traceability source, but agents should use `roadmap/workpackages/workpackage-register.md` and `roadmap/workpackages/dependency-reassessment-v17.md` to determine real prerequisites, optional adapters, and current status from WP5 onward.

This V17 start package does not fully rewrite every phase row yet. It adds the planning layer, initial dependency reassessment, and status register so the roadmap can be converted safely without losing V16 scope.

## Contents

- `AGENTS_START_HERE.md` - first document for any coding agent unleashed on the repository.
- `00_package_aware_roadmap.md` - phase roadmap showing which packages are created or updated at each step.
- `00_workpackage_roadmap_v17_draft.md` - transitional V17 workpackage planning entry point.
- `01_repository_and_package_strategy.md` - monorepo, pnpm workspace, package versioning, scoped commits, and package-boundary strategy.
- `02_architecture_paragraph_reference_index.md` - exact paragraph/block anchors for the architecture whitepaper.
- `02_phase_architecture_pnpm_matrix.md` - consolidated phase/package architecture references and pnpm install commands.
- `03_package_dependency_activity_diagram.md` - package dependency activity sequence diagram across roadmap phases.
- `04_phase_3_5_screenshot_validation_checklist.md` - screenshot-based validation checklist for Phase 3.5 shell usability.
- `grilling/README.md` - reusable phase-grilling prompt, usage rules, and index of phase grilling records.
- `grilling/phase-4.1-grilling.md` - accepted grilling record that introduced Phase 4.1 as the pre-Phase-5 foundation stabilization gate.
- `grilling/phase-5-grilling.md` - accepted Phase 5 contribution/capability registry grilling record.
- `grilling/backend-grilling.md` - accepted backend-optional architecture grilling record.
- `textforge_backend_optional_architecture_whitepaper.md` - standalone backend-optional architecture update whitepaper.
- `specs/textforge_markdown_profile.md` - TF-MD source specification used to phase Markdown-profile implementation across Phases 4, 5, 6, 9, and 14.
- `validation/phase-3-5-reference-antipattern.png` - reference screenshot showing the layout anti-patterns Phase 3.5 must eliminate.
- `validation/phase-3-5-validation-report.json` - browser-measured Phase 3.5 layout, overflow, popup, and duplicate-title metrics at the required desktop states.
- `validation/phase-3-5-resize-panel-widths.json` - Phase 3.5 width evidence for default, narrow, wide, and dragged shell-panel states.
- `RAPID.md` - repository-local append-only RAPID log.
- `workpackages/` - V17 dependency-based workpackage register, reassessment, map, and template.
- `textforge_rebuild_whitepaper_main.md` - main standalone architecture body; it deliberately does not own phase sequencing.
- `packages/*.md` - one implementation guide per package, including Phase 3.1/3.2/3.3/3.4/3.5 recovery, pull-forward, readability, resource-identity, popup usability, resizable-panel, screenshot-validation responsibilities, phased TF-MD implementation responsibilities, and V16 backend-optional package-split guidance.

## How to use

1. Copy or merge the entire `roadmap/` folder into the repository root.
2. Start with `roadmap/AGENTS_START_HERE.md`.
3. If the repository has not yet been pivoted, use Phase -1 in `roadmap/00_package_aware_roadmap.md` together with `roadmap/01_repository_and_package_strategy.md`.
4. Use `roadmap/00_package_aware_roadmap.md` to determine the current phase.
5. If `roadmap/grilling/phase-[PHASE-NUMBER]-grilling.md` exists for the active phase, read it before implementation.
6. Use `roadmap/02_phase_architecture_pnpm_matrix.md` to confirm the active phase's exact architecture anchors and pnpm dependency commands.
7. Use `roadmap/03_package_dependency_activity_diagram.md` to understand cross-package dependency activation for the current and next phases.
8. Maintain `roadmap/RAPID.md` continuously. Historical RAPID rows are append-only and must always be appended at the end of the file; add superseding or correction rows instead of editing old entries or regrouping rows by type.
9. Commit roadmap/RAPID updates together with implementation changes.

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
  textforge_backend_optional_architecture_whitepaper.md
  specs/
    textforge_markdown_profile.md
  grilling/
    README.md
    phase-4.1-grilling.md
    phase-5-grilling.md
    backend-grilling.md
  workpackages/
    README.md
    workpackage-register.md
    dependency-reassessment-v17.md
    workpackage-dependency-map.md
    workpackage-template.md
  packages/
    backend-optional.md
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
