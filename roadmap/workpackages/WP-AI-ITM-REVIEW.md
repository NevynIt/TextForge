# WP-AI-ITM-REVIEW - ITM semantic review, diagnostics, and patch proposals

## Registry

- Workpackage ID: `WP-AI-ITM-REVIEW`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-LOCAL-AI`
- ADRs: `ADR-0011`

## Outcome

TextForge can run local AI semantic review over parsed and deterministically validated ITM scopes, producing clearly labelled observations, diagnostics, explanations, and reviewable patch proposals.

## Scope

- Run only after ITM parse, include resolution, package activation, deterministic validation, and profile/conformance checks.
- Review selected files, subtrees, views, and package/profile scopes.
- Emit AI-labelled semantic observations with scope and confidence where useful.
- Explain selected deterministic diagnostics without changing their authoritative status.
- Generate source patch previews or change proposals instead of direct edits.

## Non-goals

- Replacing deterministic ITM validation or conformance modules.
- Accepting AI output as authoritative model truth.
- Implementing BPMN or ArchiMate completeness rules inside generic ITM validation.

## Package Impact

- `packages/itm`
- future local AI package
- `apps/textforge-web`
- visual ITM and exploration surfaces where review is integrated

## Interfaces / Contracts Changed

- AI review diagnostic/observation source.
- Semantic finding schema with scope, confidence, and optional patch preview.
- Diagnostic explanation command integration.

## Validation Criteria

Use `validation/checklists/workpackages/WP-AI-ITM-REVIEW-itm-semantic-review.md` plus implementation evidence once this candidate is accepted for implementation.

## Evidence Required

- Focused tests proving AI review is gated behind deterministic parse/validation output.
- Focused tests for finding labelling, source scope, and patch preview safety.
- Manual UI evidence from the user for ITM review workflows.
- RAPID event entries for material decisions, progress, issues, or risks.

## Open Decisions

- Stable semantic review schema for findings and patch previews.
- Which ITM scopes ship first: current file, selected subtree, view, or package/profile review.
- How optional integration with comments sidecars and change proposals is sequenced.

## Archive Trace

- Introduced as proposed by `ADR-0011`.
