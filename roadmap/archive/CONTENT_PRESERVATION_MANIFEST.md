# Content Preservation Manifest — Roadmap V18

V18 cleans and streamlines the roadmap structure without deleting V16/V17 content.

Every file from the V17 source package is preserved exactly under:

```text
archive/source-v17-roadmap/
```

Many files are also promoted or copied into canonical V18 locations.

## Preservation table

| V17 source file | V18 preservation / promoted location |
|---|---|
| `00_package_aware_roadmap.md` | `archive/v16-linear-roadmap.md + archive/source-v17-roadmap/00_package_aware_roadmap.md` |
| `00_workpackage_roadmap_v17_draft.md` | `archive/source-v17-roadmap/00_workpackage_roadmap_v17_draft.md` |
| `01_repository_and_package_strategy.md` | `specs/architecture/ + archive/source-v17-roadmap/01_repository_and_package_strategy.md` |
| `02_architecture_paragraph_reference_index.md` | `specs/architecture/ + archive/source-v17-roadmap/02_architecture_paragraph_reference_index.md` |
| `02_phase_architecture_pnpm_matrix.md` | `archive/v16-phase-package-matrix.md + archive/source-v17-roadmap/02_phase_architecture_pnpm_matrix.md` |
| `03_package_dependency_activity_diagram.md` | `archive/v16-package-dependency-activity-diagram.md + archive/source-v17-roadmap/03_package_dependency_activity_diagram.md` |
| `04_phase_3_5_screenshot_validation_checklist.md` | `validation/ui/04_phase_3_5_screenshot_validation_checklist.md + archive/source-v17-roadmap/04_phase_3_5_screenshot_validation_checklist.md` |
| `AGENTS_START_HERE.md` | `archive/source-v17-roadmap/AGENTS_START_HERE.md` |
| `RAPID.md` | `decisions/RAPID.md + archive/source-v17-roadmap/RAPID.md` |
| `README.md` | `archive/source-v17-roadmap/README.md` |
| `grilling/README.md` | `grilling/README.md + archive/source-v17-roadmap/grilling/README.md` |
| `grilling/backend-grilling.md` | `grilling/backend-grilling.md + archive/source-v17-roadmap/grilling/backend-grilling.md` |
| `grilling/phase-4.1-grilling.md` | `grilling/phase-4.1-grilling.md + archive/source-v17-roadmap/grilling/phase-4.1-grilling.md` |
| `grilling/phase-5-grilling.md` | `grilling/phase-5-grilling.md + archive/source-v17-roadmap/grilling/phase-5-grilling.md` |
| `packages/archimate.md` | `package-guides/archimate.md + archive/source-v17-roadmap/packages/archimate.md` |
| `packages/assets.md` | `package-guides/assets.md + archive/source-v17-roadmap/packages/assets.md` |
| `packages/backend-optional.md` | `package-guides/backend-optional.md + archive/source-v17-roadmap/packages/backend-optional.md` |
| `packages/bpmn.md` | `package-guides/bpmn.md + archive/source-v17-roadmap/packages/bpmn.md` |
| `packages/core.md` | `package-guides/core.md + archive/source-v17-roadmap/packages/core.md` |
| `packages/diagrams.md` | `package-guides/diagrams.md + archive/source-v17-roadmap/packages/diagrams.md` |
| `packages/editors.md` | `package-guides/editors.md + archive/source-v17-roadmap/packages/editors.md` |
| `packages/examples-docs.md` | `package-guides/examples-docs.md + archive/source-v17-roadmap/packages/examples-docs.md` |
| `packages/itm.md` | `package-guides/itm.md + archive/source-v17-roadmap/packages/itm.md` |
| `packages/lua.md` | `package-guides/lua.md + archive/source-v17-roadmap/packages/lua.md` |
| `packages/markdown.md` | `package-guides/markdown.md + archive/source-v17-roadmap/packages/markdown.md` |
| `packages/pipeline.md` | `package-guides/pipeline.md + archive/source-v17-roadmap/packages/pipeline.md` |
| `packages/security-profile.md` | `package-guides/security-profile.md + archive/source-v17-roadmap/packages/security-profile.md` |
| `packages/surfaces.md` | `package-guides/surfaces.md + archive/source-v17-roadmap/packages/surfaces.md` |
| `packages/tables.md` | `package-guides/tables.md + archive/source-v17-roadmap/packages/tables.md` |
| `packages/ui.md` | `package-guides/ui.md + archive/source-v17-roadmap/packages/ui.md` |
| `packages/workspace.md` | `package-guides/workspace.md + archive/source-v17-roadmap/packages/workspace.md` |
| `specs/textforge_markdown_profile.md` | `specs/architecture/textforge-markdown-profile.md + archive/source-v17-roadmap/specs/textforge_markdown_profile.md` |
| `textforge_backend_optional_architecture_whitepaper.md` | `specs/architecture/ + archive/source-v17-roadmap/textforge_backend_optional_architecture_whitepaper.md` |
| `textforge_rebuild_whitepaper_main.md` | `specs/architecture/ + archive/source-v17-roadmap/textforge_rebuild_whitepaper_main.md` |
| `validation/phase-3-5-reference-antipattern.png` | `validation/ui/phase-3-5-reference-antipattern.png + archive/source-v17-roadmap/validation/phase-3-5-reference-antipattern.png` |
| `validation/phase-3-5-resize-panel-widths.json` | `validation/ui/phase-3-5-resize-panel-widths.json + archive/source-v17-roadmap/validation/phase-3-5-resize-panel-widths.json` |
| `validation/phase-3-5-validation-report.json` | `validation/ui/phase-3-5-validation-report.json + archive/source-v17-roadmap/validation/phase-3-5-validation-report.json` |
| `workpackages/dependency-reassessment-v17.md` | `archive/source-v17-roadmap/workpackages/dependency-reassessment-v17.md` |
| `workpackages/workpackage-dependency-map.md` | `workpackages/dependency-map.md + archive/v17-workpackage-dependency-map.md + archive/source-v17-roadmap/workpackages/workpackage-dependency-map.md` |
| `workpackages/workpackage-register.md` | `workpackages/workpackage-register.md + archive/v17-workpackage-register.md + archive/source-v17-roadmap/workpackages/workpackage-register.md` |
| `workpackages/workpackage-template.md` | `workpackages/templates/workpackage-template.md + archive/source-v17-roadmap/workpackages/workpackage-template.md` |

## Rule for future cleanups

Do not remove archived source files unless a new archive package explicitly supersedes this one and records an equivalent manifest.
