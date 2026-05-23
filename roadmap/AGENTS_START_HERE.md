# Agents Start Here — TextForge Modular Rebuild

## Purpose

This is the first document a coding agent must read before working on the TextForge rebuild repository.

The goal is to let any agent understand the architecture, locate the current milestone, continue the next useful work, and leave the repository more understandable than it found it.

TextForge is being rebuilt as a React-based, local-first, text-first workbench with a pnpm-workspace monorepo, package-level contribution boundaries, ITM as the canonical structural model, a virtual workspace, Surface-based editors/viewers, restricted Lua automation, Markdown/report generation, BPMN and enterprise architecture support, and a reusable browser-envelope security profile.

## Repository-local roadmap folder

The repository must contain a `roadmap/` folder. Treat it as the operational control room for implementation.

Expected repository-local files:

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

This package is already arranged as a drop-in `roadmap/` folder. Copy or merge the `roadmap/` folder into the repository root so future agents can use stable paths.

## Required first actions for every agent run

Before changing code, do the following:

1. Read `roadmap/AGENTS_START_HERE.md`.
2. Read `roadmap/RAPID.md`.
3. Read `roadmap/00_package_aware_roadmap.md`.
4. Inspect `git status`, current branch, recent commits, and package structure.
5. Determine the current milestone and the next incomplete step.
6. Check whether the roadmap still matches the repository reality.
7. Proceed only within the next coherent milestone or sub-milestone.

Do not start by guessing from file names alone. The RAPID log and roadmap are the authoritative operational context.


## First command sequence for a fresh agent

When starting from a clean clone or an unknown repository state, run these commands before editing files:

```bash
git status
git branch --show-current
git log --oneline -5
find roadmap -maxdepth 2 -type f | sort || true
cat roadmap/RAPID.md 2>/dev/null || true
cat roadmap/00_package_aware_roadmap.md 2>/dev/null || true
```

If `roadmap/` does not exist yet, copy or merge the V15a `roadmap/` folder into the repository root, then follow `roadmap/02_repository_pivot_instruction.md` to create the archival tag/branch, rewrite branch, roadmap folder, and pnpm workspace skeleton.

After the repository is initialized, use the available verification commands instead of inventing new ones. Typical commands will eventually be:

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

If one of these commands does not exist yet, record that fact in `roadmap/RAPID.md` and create the minimal package script only when it belongs to the current milestone.

## Commit discipline

Commit after every milestone.

Commit more frequently when:

- a logically complete package boundary is established;
- a public interface is added;
- a risky refactor is completed;
- the repo reaches a buildable/testable checkpoint;
- work must pause for clarification.

Milestone commits should normally include:

```text
implementation changes
package tests or placeholders
roadmap/RAPID.md update
roadmap updates, if the plan changed
```

The roadmap and RAPID log are part of the implementation evidence. Do not leave them uncommitted when the code changes depend on them.

## RAPID log requirements

Maintain `roadmap/RAPID.md` continuously. RAPID means **Risks, Actions, Progress, Issues, and Decisions**. Use one append-only table for all five types.

The historical RAPID entries are append-only: do not edit or delete previous entries. If an entry becomes obsolete, add a new entry with `Status` set to `Superseded` and link it to the previous entry. If a mistake must be corrected, add a correction entry and link it to the mistaken entry.

The only editable part of `RAPID.md` is the current-status block at the top, because it is an operational pointer rather than the historical record.

Use this table shape consistently:

```markdown
| ID | Type | Milestone | Status | Entry | Owner | Updated | Links |
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

- before starting a milestone, by reviewing open risks, actions, issues, and decisions;
- during work, when choices, risks, blockers, or deviations appear;
- before committing, with a progress entry summarizing what changed;
- after clarification, by recording the answer as a decision or issue update;
- after each milestone, by recording the roadmap review and next recommended step.

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

## Roadmap review after each milestone

At the end of every milestone:

1. Review the roadmap section for the next milestone.
2. Review affected package guides.
3. Check whether the implementation revealed that the next steps should change.
4. Update roadmap documents if needed.
5. Record the review in the RAPID log.
6. Include the roadmap/RAPID.md updates in the milestone commit.

The plan is expected to evolve. Changes to the plan must be traceable and auditable.

## How to find the next work item

Use this order:

1. Check the active branch.
2. Read the latest entries in `roadmap/RAPID.md`.
3. Identify the current milestone from `roadmap/00_package_aware_roadmap.md`.
4. Check package-specific guides under `roadmap/packages/` if they exist in the repo.
5. Run the existing verification command if available.
6. Continue with the next smallest coherent task that advances the current milestone.

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
