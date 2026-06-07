# WP-AI-MD-ASSIST - Markdown authoring, review, extraction, and report assistance

## Registry

- Workpackage ID: `WP-AI-MD-ASSIST`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-LOCAL-AI`
- ADRs: `ADR-0011`

## Outcome

Markdown and ITM-in-Markdown flows can use local AI for user-triggered summarization, review, rewrite, translation, and structured extraction without mutating source until the user accepts a normal edit or proposal.

## Scope

- Add Markdown structure and readiness review.
- Add section/file/selection summarization.
- Add rewrite and translation flows over explicit scopes.
- Extract actions, decisions, questions, risks, requirements, glossary terms, and candidate ITM content.
- Propose Markdown-to-ITM changes as reviewable patches or change proposals.

## Non-goals

- Replacing deterministic Markdown parsing or publication.
- Hidden workspace scanning.
- Automatic source updates from generated content.

## Package Impact

- Markdown package and publication flows
- `apps/textforge-web`
- future local AI package
- ITM package when extraction produces ITM proposals

## Interfaces / Contracts Changed

- Markdown AI review finding shape.
- Markdown replacement/patch preview flow.
- Markdown-to-ITM extraction proposal contract.

## Validation Criteria

Use `validation/checklists/workpackages/WP-AI-MD-ASSIST-markdown-authoring-review-extraction.md` plus implementation evidence once this candidate is accepted for implementation.

## Evidence Required

- Focused tests for Markdown review and extraction result validation.
- Focused tests for patch preview generation without source mutation.
- Manual UI evidence from the user for Markdown assistance flows.
- RAPID event entries for material decisions, progress, issues, or risks.

## Open Decisions

- Stable schema for extracted decisions, risks, requirements, actions, and glossary terms.
- Whether rich Markdown editor affordances are required for the first slice.

## Archive Trace

- Introduced as proposed by `ADR-0011`.
