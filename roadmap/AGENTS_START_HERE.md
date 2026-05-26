# Agents Start Here — TextForge Modular Rebuild

## Purpose

This is the first document a coding agent must read before working on the TextForge rebuild repository.

The goal is to let any agent understand the architecture, locate the current phase, continue the next useful work, and leave the repository more understandable than it found it.

TextForge is being rebuilt as a React-based, local-first, text-first workbench with a pnpm-workspace monorepo, package-level contribution boundaries, ITM as the canonical structural model, a virtual workspace, stable document identity badges, a readable overflow-safe workbench shell, Surface-based editors/viewers, restricted Lua automation, progressively implemented TF-MD Markdown/report generation, BPMN and enterprise architecture support, a reusable browser-envelope security profile, and a V16 backend-optional enterprise path based on provider contracts, revisions/changesets, manifests, one approved backend origin, and backend-enforced policy.

## Repository-local roadmap folder

The repository must contain a `roadmap/` folder. Treat it as the operational control room for implementation.

Expected repository-local files:

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

This package is already arranged as a drop-in `roadmap/` folder. Copy or merge the `roadmap/` folder into the repository root so future agents can use stable paths.

## Required first actions for every agent run

Before changing code, do the following:

1. Read `roadmap/AGENTS_START_HERE.md`.
2. Read `roadmap/RAPID.md`.
3. Read `roadmap/00_package_aware_roadmap.md`.
4. If `roadmap/grilling/phase-[PHASE-NUMBER]-grilling.md` exists for the active phase, read it as binding decision guidance after checking `RAPID.md` and the main roadmap entry.
5. Read `roadmap/02_phase_architecture_pnpm_matrix.md` for the active phase's architecture anchors and pnpm dependency commands.
6. Read `roadmap/03_package_dependency_activity_diagram.md` for cross-package phase sequencing context.
7. For Markdown work, read `roadmap/specs/textforge_markdown_profile.md` before implementing any TF-MD parsing, directive, include, block-registry, or rich-editor behavior.
8. For backend-optional, provider, settings, identity, persistence, service-folder, GitLab, AI, private/group space, or enterprise-container work, read `roadmap/textforge_backend_optional_architecture_whitepaper.md`, `roadmap/grilling/backend-grilling.md`, and `roadmap/packages/backend-optional.md` before implementation.
9. Inspect `git status`, current branch, recent commits, and package structure.
10. Determine the current phase and the next incomplete step.
11. Check whether the roadmap still matches the repository reality.
12. Proceed only within the next coherent phase or phase slice.

Do not start by guessing from file names alone. The RAPID log and roadmap are the authoritative operational context.


## V16 backend-optional rule

Backend work is an optional enterprise extension, not a replacement for the local/offline roadmap. Agents must preserve these V16 invariants whenever touching provider, repository, service, persistence, identity, settings, GitLab, AI, or deployment code:

- local/offline TextForge remains fully supported;
- local/offline mode has no File System Access API, persistent directory handles, silent local file reads/writes, background folder sync, or arbitrary network providers;
- enterprise mode uses one approved backend origin and a fail-fast backend manifest;
- backend-only adapters never enter frontend-safe packages;
- settings personalize UI/defaults only and never grant permissions;
- backend-backed writes use revisions and multi-resource changesets;
- GitLab, Entra, AI providers, private/group enforcement, and backend persistence remain server-side;
- initial AI is read/suggest only and non-mutating.

## Required phase plan shape

Every agent plan for a phase or phase slice must include these five checkpoints:

1. Understand the target phase, current repository reality, acceptance criteria, and any instruction drift.
2. Implement the next smallest coherent slice that advances the active phase without skipping package boundaries.
3. Verify with the narrowest relevant checks first, then broader checks when shared wiring or phase boundaries are touched.
4. Document the outcome by updating package docs, roadmap notes, and `roadmap/RAPID.md` when implementation reality, expectations, or verification evidence changed.
5. Finalize the slice by reviewing the next roadmap step, recording remaining gaps or decisions, and leaving the repository at a clear handoff point.

If a plan does not include understanding, implementation, verification, documentation, and finalization, it is incomplete.

## Closure rule

Facade closures are not accepted.

A package, shell, editor, viewer, or other surface does not count as closed just because it preserves an API, renders a placeholder, or exposes a browser-native shim behind the promised contract.

Do not revise a phase claim downward to escape incomplete work. If the promised phase value is not implemented, the phase stays open.

A closure claim must be backed by validation that exercises the promised user-facing value of the phase.

Before claiming phase closure or phase-slice closure, validate the delivered behavior against the roadmap promise itself, not only against build, lint, typecheck, or smoke-test success.


## First command sequence for a fresh agent

When starting from a clean clone or an unknown repository state, run these commands before editing files:

```bash
git status
git branch --show-current
git log --oneline -5
find roadmap -maxdepth 2 -type f | sort || true
cat roadmap/RAPID.md 2>/dev/null || true
cat roadmap/00_package_aware_roadmap.md 2>/dev/null || true
cat roadmap/02_phase_architecture_pnpm_matrix.md 2>/dev/null || true
cat roadmap/03_package_dependency_activity_diagram.md 2>/dev/null || true
```

If `roadmap/` does not exist yet, copy or merge the latest `roadmap/` folder into the repository root. If the repository has not yet been pivoted, follow the Phase -1 instructions in `roadmap/00_package_aware_roadmap.md`, using Git history and the preserved RAPID record as the operational source.

After the repository is initialized, use the available verification commands instead of inventing new ones. Typical commands will eventually be:

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

If one of these commands does not exist yet, record that fact in `roadmap/RAPID.md` and create the minimal package script only when it belongs to the current phase.

As implementation progresses, run the narrowest relevant verification repeatedly instead of waiting until the end of a large change. Prefer changed-package checks first, then broader workspace verification when the phase slice is ready.

Treat the first runnable shell as a separate phase boundary from later feature work. The shell is stable enough for first use when it launches without a blank placeholder screen, exposes the frame, workspace/navigation chrome, main surface region, toolbar or command entry points, status feedback, and registered contribution routing, and remains runnable as a direct local `file://` artifact where that behavior previously existed or through the supported extension-hosted path.

Do not let preview-server success weaken the local runnable-artifact requirement. Preview/browser-served validation is useful additional evidence, but it does not replace the requirement to preserve direct local `file://` launchability or extension-hosted execution when those are part of the product behavior.

Treat relative built asset paths in `dist/index.html` as necessary but not sufficient evidence. Agents must preserve the runtime behavior needed for the shell to execute as a local artifact or extension surface, not just the packaging shape of the built output.

When a runnable local artifact must support direct `file://` launch, do not ship that artifact behind `<script type="module">` or rely on a post-build rewrite of generated HTML to repair a module entry. Chromium-based browsers can block module-script local launches. Prefer a source-owned classic bootstrap path: a dedicated loader entry, a canonical file-launch HTML document, and focused checks that reject runtime ES module syntax in the emitted local bundle.

## Commit discipline

Commit after every coherent phase slice.

Commit more frequently when:

- a logically complete package boundary is established;
- a public interface is added;
- a risky refactor is completed;
- the repo reaches a buildable/testable checkpoint;
- work must pause for clarification.

Phase-slice commits should normally include:

```text
implementation changes
package tests or placeholders
roadmap/RAPID.md update
roadmap updates, if the plan changed
```

Before any phase-slice commit, run the relevant verification for the work that was just completed. At minimum, run the affected package build, test, lint, or typecheck commands when they exist, and run the root verification command when the phase slice changes shared contracts, workspace wiring, or multiple packages.

Do not treat a phase slice as complete until the best available verification has passed or the remaining verification gap is explicitly recorded in `roadmap/RAPID.md`.

The roadmap and RAPID log are part of the implementation evidence. Do not leave them uncommitted when the code changes depend on them.

## RAPID log requirements

Maintain `roadmap/RAPID.md` continuously. RAPID means **Risks, Actions, Progress, Issues, and Decisions**. Use one append-only table for all five types.

The historical RAPID entries are append-only: do not edit or delete previous entries. If an entry becomes obsolete, add a new entry with `Status` set to `Superseded` and link it to the previous entry. If a mistake must be corrected, add a correction entry and link it to the mistaken entry.

Append every new historical RAPID row at the end of the file. Do not insert entries earlier in the table to keep decisions, risks, actions, progress, or issues grouped by type; the table is meant to preserve chronological order.

The only editable part of `RAPID.md` is the current-status block at the top, because it is an operational pointer rather than the historical record.

Use this table shape consistently:

```markdown
| ID | Type | Phase | Status | Entry | Owner | Updated | Links |
|---|---|---|---|---|---|---|---|
```

Use these ID prefixes:

```text
R-### = Risk
A-### = Action
P-### = Progress
I-### = Issue
D-### = Decision
```

Use these status values unless there is a strong reason to extend them:

```text
Open
In progress
Done
Blocked
Accepted
Superseded
```

Update the RAPID log:

- before starting a phase or phase slice, by reviewing open risks, actions, issues, and decisions;
- during work, when choices, risks, blockers, or deviations appear;
- before committing, with a progress entry summarizing what changed;
- after clarification, by recording the answer as a decision or issue update;
- after each phase or phase slice, by recording the roadmap review and next recommended step.

If a user or maintainer answers a question, record the answer in the RAPID log before continuing.

## Assumptions and clarification rules

Use this decision rule:

```text
Low-risk assumption:
  Make the assumption explicitly.
  Record it in the RAPID log.
  Continue.

High-impact assumption:
  Stop.
  Commit the current safe work.
  Ask for clarification.
```

Low-risk assumptions include naming cleanup, small file organization choices, obvious test placeholders, non-public implementation details, or harmless documentation wording.

High-impact assumptions include architecture, security posture, licensing, package boundaries, canonical file formats, public APIs, dependency choices, migration strategy, visual editor write-back behavior, and anything that would be expensive to reverse.

## Roadmap review after each phase slice

At the end of every phase slice:

1. Review the roadmap section for the next phase.
2. Review affected package guides.
3. Check whether the implementation revealed that the next steps should change.
4. Update roadmap documents if needed.
5. Record the review in the RAPID log.
6. Include the roadmap/RAPID.md updates in the phase-slice commit.

The plan is expected to evolve. Changes to the plan must be traceable and auditable.

## How to find the next work item

Use this order:

1. Check the active branch.
2. Read the latest entries in `roadmap/RAPID.md`.
3. Identify the current phase from `roadmap/00_package_aware_roadmap.md`.
4. Check `roadmap/grilling/` for a phase-specific grilling document and apply accepted decisions.
5. Check package-specific guides under `roadmap/packages/` if they exist in the repo.
6. Run the existing verification command if available.
7. Continue with the next smallest coherent task that advances the current phase.
8. Re-run the narrowest relevant verification after each coherent slice and before any phase-slice commit.

## Phase 3 recovery and pre-Phase-4 correction sequence

After Phase 3 ZIP import/export closes, do not jump directly to Phase 4. The roadmap now inserts seven explicit phases:

```text
Phase 3.1 — React workbench shell and UI recovery
Phase 3.2 — Dexie workspace persistence recovery
Phase 3.3 — Command palette and contribution-driven shell commands
Phase 3.4 — Resource identity badges and workbench readability pass
Phase 3.5 — Popup usability, resizable panels, and chrome deduplication pass
Phase 3.6 — Unified workspace resources and representation-based surface routing
Phase 3.7 — Context menus as thin command projections
```

Treat Phase 3.1 and Phase 3.2 as recovery phases for promised work that was previously deferred. Treat Phase 3.3 as a deliberate pull-forward of only the shell-facing command palette and menu/toolbar slice from Phase 5. Treat Phase 3.4 as the integrated resource-identity/readability pass. Treat Phase 3.5 as a focused shell-usability pass for real app popups, bounded side-panel resizing, chrome deduplication, and screenshot-based validation. Treat Phase 3.6 as a resource-model correction before Markdown/assets/diagrams build on the current text/binary split. Treat Phase 3.7 as a deliberately thin context-menu projection of the existing command system.

Phase 3.3 is not permission to pull the whole Phase 5 contribution system forward. Phase 3.5 is not permission to pull Phase 13 forward. Phase 3.6 is not permission to introduce a larger persistent file-type taxonomy: remove or deprecate `text`/`binary` as public resource kinds, keep SVG as text, and compute open-with compatibility from minimal facts. Phase 3.7 is not permission to create a second command system or broad plugin UX: context menus must resolve existing commands against explicit targets. Do not implement pipeline contribution loading, diagnostics aggregation UI, plugin management, later domain package work, advanced tab groups, tab drag/reorder, saved layouts, detached browser windows, split panes, or broad contribution-pack behavior in these recovery/correction phases.

Each of these phases must update the central roadmap, the affected package guide, and `RAPID.md` in the same commit as the implementation slice. Phase 3.5 also requires screenshot evidence against `roadmap/04_phase_3_5_screenshot_validation_checklist.md` or an explicit RAPID note explaining any validation gap.

## Phase 4.1 stabilization gate before Phase 5

After Phase 4 closes, do not jump directly to Phase 5. The roadmap now inserts Phase 4.1 as a mandatory foundation-stabilization gate before contribution registries and package composition.

Read `roadmap/grilling/phase-4.1-grilling.md` before implementing Phase 4.1. The phase stabilizes local artifact invariants, phase-closure rules, resource facts versus surface eligibility, shared diagnostics, the single command/action spine, default contributions, active capability scope, public package API boundaries, and migration-audit checks for implemented Phase 0–4 code.

Only after Phase 4.1 closes should Phase 5 start. Read `roadmap/grilling/phase-5-grilling.md` before implementing Phase 5.

## Package-boundary rules

TextForge uses a single Git repository with pnpm workspaces. Packages are independently extensible, but not separate Git submodules.

Prefer changes through contribution manifests and public interfaces.

Do not introduce private cross-package imports to get around missing contracts. If a package needs a contract from another package, add or revise the public contract deliberately and record the decision.

## Canonical-source rules

The name TextForge matters: text and explicit workspace resources remain canonical.

Do not let a visual editor, viewer, generated diagram, generated report, or cached projection become the hidden source of truth.

Any rich, visual, table, graph, BPMN, ArchiMate, Markdown, or future editor must declare:

```text
canonical resource format
supported edit operations
unsupported constructs
patch/write-back strategy
round-trip tests or equivalent validation
fallback source editor
```

## Security-profile rule

The reusable accreditation harness verifies browser-enforced safeguards: CSP, manifests, service-worker patterns, remote assets/origins, forbidden privileged browser APIs, and dependency/license policy.

Do not turn the reusable accreditation harness into a TextForge-internal architecture checker. Internal gateway discipline is useful application architecture, but the reusable harness should stay application-generic.

## Stop conditions

Stop and ask before proceeding if:

- the next step would change the security claim;
- a dependency has unclear or incompatible licensing;
- an implementation choice would make a generated artifact canonical;
- the roadmap conflicts with the repo state in a non-trivial way;
- a public package interface must be broken;
- a visual editor cannot provide a reliable write-back contract;
- the old implementation preservation steps appear incomplete;
- the repository is on an unexpected branch or has uncommitted user work.

Before stopping, commit any safe completed work if possible and update the RAPID log with the question.
