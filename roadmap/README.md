# TextForge Rebuild Roadmap Package V15a

This package is arranged as a single drop-in `roadmap/` folder for the TextForge repository. Copy or merge this folder into the repository root. After that, every coding agent should start from `roadmap/AGENTS_START_HERE.md`.

The roadmap folder contains the standalone architecture body, the authoritative implementation roadmap set, package guides, and the append-only RAPID log for risks, actions, progress, issues, and decisions.

For runnable local artifacts, the live instruction set now assumes a source-owned bootstrap path: a canonical file-launch HTML document plus a deterministic classic loader bundle, not a shipped module-script HTML entry repaired by post-build rewriting.

Authority split:

- `textforge_rebuild_whitepaper_main.md` owns target architecture, invariants, and design rationale.
- `00_package_aware_roadmap.md`, `01_repository_and_package_strategy.md`, `packages/*.md`, and `RAPID.md` own implementation sequencing, package rollout, and current execution state.

## Contents

- `AGENTS_START_HERE.md` — first document for any coding agent unleashed on the repository.
- `00_package_aware_roadmap.md` — phase roadmap showing which packages are created or updated at each step.
- `01_repository_and_package_strategy.md` — monorepo, pnpm workspace, package versioning, scoped commits, and package-boundary strategy.
- `RAPID.md` — repository-local append-only RAPID log.
- `textforge_rebuild_whitepaper_main.md` — main standalone architecture body; it deliberately does not own phase sequencing.
- `packages/*.md` — one implementation guide per package.

## How to use

1. Copy or merge the entire `roadmap/` folder into the repository root.
2. Start with `roadmap/AGENTS_START_HERE.md`.
3. If the repository has not yet been pivoted, use Phase -1 in `roadmap/00_package_aware_roadmap.md` together with `roadmap/01_repository_and_package_strategy.md`.
4. Use `roadmap/00_package_aware_roadmap.md` to determine the current phase.
5. Maintain `roadmap/RAPID.md` continuously. Historical RAPID rows are append-only and must always be appended at the end of the file; add superseding or correction rows instead of editing old entries or regrouping rows by type.
6. Commit roadmap/RAPID updates together with implementation changes.

## Repository-local structure after upload

```text
roadmap/
  AGENTS_START_HERE.md
  00_package_aware_roadmap.md
  01_repository_and_package_strategy.md
  RAPID.md
  textforge_rebuild_whitepaper_main.md
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
