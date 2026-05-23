# TextForge V15 Repository Pivot Instruction for Coding Agents

## Purpose

This instruction tells a coding agent how to pivot the existing `TextForge` repository into the modular greenfield architecture while preserving the project name, Git history, and recoverability of the existing implementation.

The goal is **not** to delete the old project history or start a separate `TextForge2` repository. The goal is to preserve the old implementation as an archival branch and tag, then create a clean pnpm-workspace monorepo skeleton in the same repository.

---

## Required outcome

After completing this instruction, the repository must have:

```text
main or current default branch
  still available as the starting point before the pivot, unless the maintainer explicitly merges the rewrite later

archive/v1-current
  archival branch pointing to the current pre-rebuild implementation

textforge-v1-final
  tag pointing to the current pre-rebuild implementation

rewrite/v2-monorepo
  active branch containing the new monorepo skeleton
```

The rewrite branch must contain:

```text
apps/textforge-web/
packages/core/
packages/workspace/
packages/surfaces/
packages/pipeline/
packages/itm/
packages/security-profile/
packages/ui/
packages/editors/
packages/assets/
packages/markdown/
packages/diagrams/
packages/lua/
packages/bpmn/
packages/tables/
packages/archimate/
packages/examples-docs/
docs/
fixtures/
```

The old implementation must remain recoverable from the archival branch and tag.

---

## Pre-flight checks

Before changing the repository, run:

```bash
git status --short
git branch --show-current
git remote -v
```

If there are uncommitted changes, stop and ask the maintainer whether to commit, stash, or discard them. Do not proceed on a dirty working tree.

Then verify the current branch is the intended source branch:

```bash
git checkout main
git pull --ff-only
```

If the default branch is not named `main`, substitute the actual default branch name and record it in the pivot log.

---

## Step 1 — Preserve the current implementation

Create an immutable tag and archival branch:

```bash
git tag textforge-v1-final
git branch archive/v1-current
git push origin textforge-v1-final
git push origin archive/v1-current
```

If either name already exists, do not overwrite it without maintainer approval. Instead report the existing tag/branch and ask for the desired replacement name.

---

## Step 2 — Create the rewrite branch

Create the greenfield rewrite branch from the current default branch:

```bash
git checkout -b rewrite/v2-monorepo
```

All cleanup and new skeleton work happens on this branch. Do not modify the archival branch.

---

## Step 3 — Inventory useful legacy material

Before deleting implementation files, create an inventory of files that should be preserved, migrated, or reviewed.

Create:

```text
docs/legacy/
docs/design/
docs/specs/
fixtures/legacy/
```

Preserve these categories where present:

```text
README and project notes
ITM specification and examples
security whitepapers and accreditation notes
Lua design documents and examples
Markdown/report examples
BPMN examples and fixtures
ArchiMate/EA examples and fixtures, if present
manual test plans
sample workspaces
useful viewer/rendering fixtures
license and attribution files
```

Recommended moves:

```bash
mkdir -p docs/legacy docs/design docs/specs fixtures/legacy
```

Then move or copy useful files deliberately. Do not bulk-copy the whole old source tree into `legacy/`; that would confuse dependency scans and future coding agents.

Good examples:

```bash
git mv README.md docs/legacy/README_v1.md || true
git mv docs docs/legacy/original-docs || true
```

If useful fixtures are embedded in old source folders, copy them into `fixtures/legacy/` and note their origin in `fixtures/legacy/README.md`.

---

## Step 4 — Remove old implementation from the rewrite branch

After preserving selected docs/specs/fixtures, remove the old implementation files from the rewrite branch.

Do this as a deliberate pivot, not as scattered cleanup.

Typical removal targets may include:

```text
old src/
old public/
old build output
old package files
old bundler config
old test config
old extension/PWA output
```

Use `git rm` for tracked files. Keep licenses, notices, and preserved documentation.

Do not remove `.git`, archival branches, tags, or repository metadata.

---

## Step 5 — Add the pnpm workspace skeleton

Create the new root files:

```text
package.json
pnpm-workspace.yaml
tsconfig.base.json
eslint.config.js
vitest.config.ts
README.md
```

Root `package.json` baseline:

```json
{
  "private": true,
  "name": "textforge",
  "version": "0.0.0",
  "packageManager": "pnpm@latest",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "verify": "pnpm lint && pnpm typecheck && pnpm test && pnpm build"
  }
}
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Create the application package:

```text
apps/textforge-web/
  package.json
  index.html
  src/
    main.tsx
    App.tsx
```

Create the initial package folders:

```text
packages/core/
packages/workspace/
packages/surfaces/
packages/pipeline/
packages/itm/
packages/security-profile/
packages/ui/
packages/editors/
packages/assets/
packages/markdown/
packages/diagrams/
packages/lua/
packages/bpmn/
packages/tables/
packages/archimate/
packages/examples-docs/
```

Each package should start with:

```text
package.json
src/index.ts
tsconfig.json
README.md
```

Use package names such as:

```text
@textforge/core
@textforge/workspace
@textforge/surfaces
@textforge/pipeline
@textforge/itm
@textforge/security-profile
@textforge/ui
@textforge/editors
@textforge/assets
@textforge/markdown
@textforge/diagrams
@textforge/lua
@textforge/bpmn
@textforge/tables
@textforge/archimate
@textforge/examples-docs
```

---

## Step 6 — Add placeholder contribution manifests

Every package should export a minimal contribution object or explicit empty placeholder. This makes the architecture composable from the beginning.

Example:

```ts
export const coreContributions = {
  id: "@textforge/core",
  diagnostics: [],
  commands: [],
  surfaces: [],
  pipelines: []
} as const;
```

The app shell should import and register contribution packs, even if most are empty initially.

---

## Step 7 — Add the pivot README section

The new root `README.md` must explain the pivot clearly:

```text
TextForge is being rebuilt as a modular local-first React workbench.
The previous implementation is preserved at tag `textforge-v1-final` and branch `archive/v1-current`.
This repository keeps the TextForge name and history while replacing the implementation with a pnpm-workspace package architecture.
```

Also link to:

```text
docs/legacy/README_v1.md
docs/design/
docs/specs/
```

---

## Step 8 — Add pivot log

Create:

```text
docs/legacy/pivot-log.md
```

Include:

```text
# TextForge Pivot Log

- Source branch before pivot:
- Archival branch: archive/v1-current
- Archival tag: textforge-v1-final
- Rewrite branch: rewrite/v2-monorepo
- Date:
- Maintainer:

## Preserved material

## Removed implementation areas

## Notes for future recovery
```

---

## Step 9 — Commit the pivot skeleton

The first rewrite commit should be a single explicit structural commit:

```bash
git add -A
git commit -m "chore: pivot TextForge to modular React workspace architecture"
```

This commit should contain:

```text
archival documentation moves
old implementation removal
new pnpm workspace skeleton
initial package folders
pivot log
new README
```

Do not mix feature implementation into this pivot commit.

---

## Step 10 — Install and verify

Run:

```bash
corepack enable
pnpm install
pnpm verify
```

If the packages only contain placeholders, `pnpm verify` should still pass by using placeholder scripts such as:

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run --passWithNoTests",
    "lint": "eslint .",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  }
}
```

If lint/test tooling is not yet installed, create a smaller initial verification script and document the gap in the pivot log.

---

## Step 11 — First implementation branch after pivot

After the skeleton is committed, create a feature branch for the first real milestone:

```bash
git checkout -b feat/core-contracts
```

Start with:

```text
@textforge/core
@textforge/security-profile
@textforge/ui
@textforge/examples-docs
```

Do not begin feature packages such as BPMN, ArchiMate, Lua, diagrams, or rich Markdown until the core contribution, diagnostics, workspace, and surface contracts are stable enough.

---

## Agent rules

- Preserve the old implementation with tag and archival branch before cleanup.
- Do not create a new repository.
- Do not use Git submodules.
- Do not bulk-copy old implementation under `legacy/`.
- Keep selected historical docs/specs/fixtures only.
- Make one explicit pivot commit before feature work.
- Use pnpm workspaces.
- Use `workspace:*` dependencies between packages.
- Keep the app shell thin.
- Add package contribution manifests from the start.
- Keep package APIs small and explicit.
- Run package-level and root verification commands before reporting success.

---

## Done criteria

The pivot setup is complete when:

```text
[ ] `textforge-v1-final` tag exists and points to the pre-rebuild implementation.
[ ] `archive/v1-current` branch exists and points to the pre-rebuild implementation.
[ ] `rewrite/v2-monorepo` branch exists.
[ ] Old implementation has been removed from the rewrite branch after selected docs/specs/fixtures were preserved.
[ ] pnpm workspace skeleton exists.
[ ] `apps/textforge-web` exists.
[ ] all planned `packages/*` folders exist.
[ ] each package has package.json, src/index.ts, tsconfig.json, and README.md.
[ ] root README explains the pivot and links to preserved legacy material.
[ ] docs/legacy/pivot-log.md exists.
[ ] the pivot skeleton is committed as a single structural commit.
[ ] `pnpm install` succeeds.
[ ] root verification command succeeds, or documented minimal verification succeeds with remaining gaps logged.
```


## Commit discipline during the pivot

Make explicit commits at the following checkpoints:

```text
1. Preserve archival tag and branch.
2. Move selected legacy docs/specs/fixtures into their new locations.
3. Remove old implementation files from the rewrite branch.
4. Add pnpm workspace skeleton and initial packages.
5. Add roadmap folder and initialize RAPID log/RAPID log.
```

If the agent discovers unexpected repository state or uncommitted user work, it must stop and ask before destructive cleanup.
