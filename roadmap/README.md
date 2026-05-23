# TextForge Rebuild Roadmap Package V15a

This package is arranged as a single drop-in `roadmap/` folder for the TextForge repository. Copy or merge this folder into the repository root. After that, every coding agent should start from `roadmap/AGENTS_START_HERE.md`.

The roadmap folder contains the standalone architecture body, package-aware implementation roadmap, repository pivot instructions, package guides, and the append-only RAPID log for risks, actions, progress, issues, and decisions.

## Contents

- `AGENTS_START_HERE.md` — first document for any coding agent unleashed on the repository.
- `00_package_aware_roadmap.md` — milestone roadmap showing which packages are created or updated at each step.
- `01_repository_and_package_strategy.md` — monorepo, pnpm workspace, package versioning, scoped commits, and package-boundary strategy.
- `02_repository_pivot_instruction.md` — step-by-step coding-agent instruction for preserving the current implementation, creating the archival branch/tag, cleaning the rewrite branch, and setting up the pnpm monorepo skeleton.
- `RAPID.md` — repository-local append-only RAPID log.
- `textforge_rebuild_whitepaper_main.md` — main standalone architecture body.
- `packages/*.md` — one implementation guide per package.

## How to use

1. Copy or merge the entire `roadmap/` folder into the repository root.
2. Start with `roadmap/AGENTS_START_HERE.md`.
3. Follow `roadmap/02_repository_pivot_instruction.md` if the repository has not yet been pivoted.
4. Use `roadmap/00_package_aware_roadmap.md` to determine the current milestone.
5. Maintain `roadmap/RAPID.md` continuously. Historical RAPID rows are append-only and must always be appended at the end of the file; add superseding or correction rows instead of editing old entries or regrouping rows by type.
6. Commit roadmap/RAPID updates together with implementation changes.

## Repository-local structure after upload

```text
roadmap/
  AGENTS_START_HERE.md
  00_package_aware_roadmap.md
  01_repository_and_package_strategy.md
  02_repository_pivot_instruction.md
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
