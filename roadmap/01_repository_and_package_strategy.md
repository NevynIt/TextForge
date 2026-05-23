# TextForge V15b Repository and Package Strategy

## Purpose

TextForge should be developed as a **single Git repository containing multiple npm workspace packages**. This gives coding agents and human developers one coherent working tree while preserving package-level boundaries for build, test, ownership, versioning, and release discipline.

The goal is to avoid locking the whole codebase every time a feature changes, without introducing the operational friction of Git submodules.

---


## Existing repository pivot strategy

TextForge should keep its current repository name and Git history. The rebuild should not start in a new `TextForge2` repository and should not erase the old implementation without a recovery path.

The recommended pivot is:

```text
1. Tag the current implementation as `textforge-v1-final`.
2. Create `archive/v1-current` from the current implementation.
3. Create `rewrite/v2-monorepo` for the greenfield modular rebuild.
4. Preserve selected legacy docs/specs/fixtures under `docs/legacy`, `docs/specs`, and `fixtures/legacy`.
5. Remove the old implementation from the rewrite branch in one explicit pivot commit.
6. Add the pnpm workspace skeleton and package folders.
7. Merge the rewrite branch back to the default branch only when the new shell is minimally runnable.
```

This pivot strategy is part of the repository architecture. It gives the rewrite a clean working tree while keeping the old implementation recoverable through normal Git history, tag, and archival branch.

## Stable runnable baseline

TextForge should not be treated as "ready" merely because the workspace exists or the packages compile as placeholders.

The first stable user-facing checkpoint is the first runnable shell. At that point the app must:

```text
launch without a blank placeholder screen
render the app frame and brand
show workspace/navigation chrome
show the main surface region
expose toolbar or command entry points
show status badges or equivalent shell feedback
route registered contributions through the shell
```

That checkpoint is the boundary between repository plumbing and a usable first-run experience. Phase 1 and later milestones extend that shell with real workspace, surface, editor, and asset behavior.

If that shell must also ship as a direct local `file://` artifact, the packaged local entry should be treated as a first-class source path, not as an afterthought. Do not ship the local artifact behind `<script type="module">` and then repair generated HTML in a postprocess step. Prefer a source-owned file-launch HTML document, a dedicated loader entry, and a deterministic classic bundle with focused checks that reject runtime ES module syntax.

## Recommended model

```text
textforge/
  package.json
  pnpm-workspace.yaml
  tsconfig.base.json
  turbo.json or nx.json
  apps/
    textforge-web/
  packages/
    core/
    workspace/
    surfaces/
    pipeline/
    itm/
    security-profile/
    ui/
    editors/
    assets/
    markdown/
    diagrams/
    lua/
    bpmn/
    tables/
    archimate/
    examples-docs/
```

Each package has its own `package.json`, build script, test script, TypeScript configuration, public exports, and documentation. The application under `apps/textforge-web` composes package contributions into the final browser workbench.

---

## Why one Git repository

A single Git repository is preferred because TextForge has many cross-cutting changes, especially during the rebuild phase.

Examples:

```text
Adding generated SVG resources may touch:
  @textforge/core
  @textforge/workspace
  @textforge/diagrams
  @textforge/assets
  apps/textforge-web

Adding BPMN visual editing may touch:
  @textforge/core
  @textforge/surfaces
  @textforge/pipeline
  @textforge/bpmn
  @textforge/editors
  apps/textforge-web
```

A single repo lets one coding agent make all related changes in one branch, run the full affected test set, and submit one coherent pull request.

---

## Why not Git submodules initially

Git submodules provide separate Git histories per package, but they add coordination overhead:

- every cross-package change requires commits in multiple repositories;
- the parent repository must then update submodule pointers;
- agent workflows become more fragile;
- checkout and update behavior becomes less obvious;
- pull requests are split across repositories even when the feature is conceptually one change.

For TextForge, submodules are too heavy for the initial rebuild. Package boundaries should be enforced by npm workspace structure, TypeScript project references, tests, dependency rules, and contribution manifests instead.

---

## Why not separate repositories initially

Separate repositories are useful only when a package has become a stable product with independent consumers, governance, and release cadence.

Possible future extraction candidates:

```text
@textforge/itm
@textforge/security-profile
```

Even these should start inside the monorepo. Once stable, they can be extracted with a repository split, subtree, or release mirroring strategy.

---

## npm and pnpm compatibility

The package structure should use npm-compatible workspace packages. The preferred package manager is **pnpm**, because it works well for TypeScript monorepos and supports workspace references cleanly.

Root `package.json`:

```json
{
  "private": true,
  "name": "textforge",
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

Package-to-package references should use workspace dependencies:

```json
{
  "dependencies": {
    "@textforge/core": "workspace:*",
    "@textforge/surfaces": "workspace:*"
  }
}
```

This keeps local development fast and avoids accidental dependency on a published older package version.

---

## Package-level commits without package-level Git repositories

Commits remain in the single repository history, but should be scoped by package.

Preferred commit style:

```text
feat(core): add generated resource provenance types
feat(workspace): support generated binary resources
feat(diagrams): persist SVG outputs
feat(assets): preview generated SVG resources
fix(bpmn): preserve BPMN XML namespace order
```

For a cross-package change, either use one coherent commit with the main feature scope:

```text
feat(diagrams): store generated SVG resources in workspace
```

or a short series of package-scoped commits:

```text
feat(core): add generated resource provenance contracts
feat(workspace): add generated resource persistence
feat(diagrams): write rendered SVG outputs to workspace
feat(assets): display generated SVG provenance
```

Both approaches preserve traceability without requiring submodules.

---

## Versioning and changelogs

Use **Changesets** to maintain package-level versioning and changelogs inside the monorepo.

The repository can remain private during early development while packages still have independent semantic versions. When packages become reusable outside the app, they can be published individually.

Recommended policy:

```text
Stable contract packages:
  version carefully and avoid breaking changes.

Feature packages:
  version independently and evolve faster.

Application package:
  depends on workspace package versions during development;
  pins released versions if packages are published later.
```

---

## Build and test orchestration

Use Turborepo or Nx to run only affected tasks when possible.

Useful commands:

```bash
pnpm --filter @textforge/core test
pnpm --filter @textforge/workspace build
pnpm --filter @textforge/markdown typecheck
pnpm -r test
pnpm -r build
```

A coding agent should normally run:

```bash
pnpm --filter <changed-package> test
pnpm --filter <changed-package> typecheck
pnpm verify
```

for local confidence, and should do so progressively as implementation advances rather than waiting until the end of a large phase slice. Before a phase-slice commit, the agent should run the relevant changed-package checks and the broader root verification when shared contracts or cross-package wiring changed. CI should run affected plus full release checks as appropriate.

---

## Dependency rules between packages

The monorepo should enforce dependency direction.

Allowed:

```text
Feature packages -> @textforge/core
Feature packages -> @textforge/surfaces contracts
Feature packages -> @textforge/pipeline contracts
Feature packages -> @textforge/workspace contracts
Feature packages -> @textforge/ui primitives
```

Disallowed:

```text
Core packages importing feature packages.
Feature packages importing the app shell.
Feature packages depending on unrelated feature packages just for convenience.
UI package containing domain logic.
Workspace package knowing about BPMN, ArchiMate, Markdown, or Lua semantics.
```

This should be checked through ESLint import rules or a dependency-boundary tool.

---

## Contribution-based composition

Packages should expose contribution packs rather than requiring app-specific integration code.

Example:

```ts
export const markdownContributions: TextForgeContributionPack = {
  id: "@textforge/markdown",
  surfaces: [markdownPreviewSurface, markdownReportSurface],
  pipelines: [markdownToHtmlPipeline, markdownReportPipeline],
  commands: [insertWorkspaceImageCommand, insertMermaidBlockCommand],
  diagnostics: [markdownLinkDiagnostics]
};
```

The app shell composes packages:

```ts
registerContributions([
  editorContributions,
  assetContributions,
  markdownContributions,
  diagramContributions,
  itmContributions,
  luaContributions,
  bpmnContributions,
  archimateContributions
]);
```

This keeps the app shell thin and prevents each feature from editing central application code repeatedly.

---

## Phase implication

### Phase 3 recovery implication

Phase 3.1, Phase 3.2, and Phase 3.3 are inserted between ZIP import/export and Markdown/diagram work. They are still package-boundary validation phases:

```text
Phase 3.1: React shell/UI recovery across apps/textforge-web, @textforge/ui, @textforge/surfaces, @textforge/editors, @textforge/assets, and @textforge/security-profile.
Phase 3.2: Dexie persistence recovery across @textforge/workspace, apps/textforge-web, @textforge/ui, @textforge/assets, and @textforge/security-profile.
Phase 3.3: shell-command and palette composition across @textforge/core, @textforge/ui, @textforge/workspace, @textforge/surfaces, @textforge/editors, @textforge/assets, and apps/textforge-web.
```

Phase 3.3 creates the shell command substrate only. Phase 5 remains responsible for the full contribution-pack system, pipeline contribution loading, diagnostics aggregation, and broad package composition.

Every roadmap phase should say which packages are created or updated. A phase is not only a feature phase; it is also a package-boundary validation phase.

Example:

```text
Phase: Generated diagrams as workspace assets
  @textforge/core: add GeneratedResourceProvenance type
  @textforge/workspace: persist generated binary resources
  @textforge/diagrams: render Mermaid/DOT to SVG and PNG
  @textforge/assets: preview generated SVG/PNG resources
  apps/textforge-web: register contributions and expose commands
```

This ensures features are implemented by extending package contributions rather than modifying one large application core.

---

## Recommended repository strategy summary

```text
Use one Git repository.
Use pnpm workspaces.
Use one package per major TextForge capability.
Use package-scoped commits and Changesets.
Use contribution manifests for extensibility.
Use TypeScript project references and dependency-boundary checks.
Avoid Git submodules during the rebuild.
Extract only mature reusable packages later, if needed.
```
