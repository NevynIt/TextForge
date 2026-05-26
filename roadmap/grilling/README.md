# Phase Grilling Records and Prompt

This folder records focused grilling sessions used to test TextForge roadmap phases before implementation changes are proposed or applied.

The grilling records are decision-support documents. They do not replace `roadmap/00_package_aware_roadmap.md`, package guides, or `roadmap/RAPID.md`; instead, their accepted decisions must be woven back into those authoritative implementation files when the roadmap is updated.

## Current grilling records

| Phase | File | Status | How to use |
|---|---|---|---|
| 4.1 | `phase-4.1-grilling.md` | Accepted stabilization gate | Read before implementing Phase 4.1. Treat it as the source for the foundation-stabilization scope, validation gates, audit checks, and package implications. |
| 5 | `phase-5-grilling.md` | Round 1 complete | Read before implementing Phase 5. Treat it as the source for the canonical contribution/capability model, document-scoped resolver, `%require` semantics, package inspector, and golden fixture expectations. |
| Backend optional | `backend-grilling.md` | Round 1 complete; integrated in V16 | Read before implementing any provider, backend, enterprise container, identity, settings, private/group space, GitLab, service-folder, AI, or changeset work. Treat it as cross-cutting guidance, not a replacement for phase-specific grilling. |

## Agent usage instructions

1. Before implementing a phase, check whether `roadmap/grilling/phase-[PHASE-NUMBER]-grilling.md` exists.
2. If it exists, read it after `RAPID.md` and the main roadmap entry, and before editing package code.
3. Use accepted decisions as binding implementation guidance unless a later RAPID decision explicitly supersedes them.
4. Keep each grilling document focused on one phase.
5. If another grilling round targets the same phase, append to that phase file rather than creating a second document.
6. When grilling decisions change implementation scope, update the main roadmap, affected package guides, validation criteria, and `RAPID.md` in the same roadmap update.

## Reusable grilling prompt

Use this prompt when a phase needs decision grilling before implementation:

```text
Grill me on one selected TextForge roadmap phase before proposing implementation changes.

Repository context:

Repo: https://github.com/NevynIt/TextForge

Branch: rewrite/v2-monorepo

Start from the roadmap folder in that branch.


Selected phase: XXX

Specific concern or idea to test: YYY

Working mode:

1. Focus only on the selected phase.

2. Inspect the repo/roadmap context before asking questions.

3. Interview me one decision at a time.

4. For each question:
explain why it matters;
give your recommended answer;
say what would change in the roadmap/spec/package if I accept it.

5. Do not rewrite the roadmap during the grilling.

6. When the phase is sufficiently clarified, produce a dedicated phase grilling document.

The phase grilling document must be created for this phase only.

Use this filename pattern:
roadmap/grilling/phase-[PHASE-NUMBER]-grilling.md

For example:
roadmap/grilling/phase-3.6-grilling.md

The document must include:
phase number and title;
short purpose of the phase;
index of grilling topics at the top for quick consultation;
questions asked;
recommended answers;
user decisions;
unresolved questions;
roadmap/spec/package implications;
risks and mitigations;
validation checks / definition of done;
follow-up changes to apply later.

Document rules:
one grilling document per phase;
keep the document focused on that phase only;
make it append-friendly if the same phase is grilled in multiple rounds;
preserve earlier decisions unless explicitly instructed to revise them;
include a short “latest status” section near the top.
```

## Roadmap integration rule

A grilling document is considered integrated only after:

- the document is stored under `roadmap/grilling/`;
- the main roadmap references the phase-specific implications;
- affected package guides include the relevant implementation responsibilities;
- validation or definition-of-done checks reflect the accepted decisions;
- `roadmap/RAPID.md` records the decision or progress rows append-only.
