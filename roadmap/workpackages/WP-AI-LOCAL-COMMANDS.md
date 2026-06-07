# WP-AI-LOCAL-COMMANDS - Local AI command palette and editor actions

## Registry

- Workpackage ID: `WP-AI-LOCAL-COMMANDS`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-LOCAL-AI`
- ADRs: `ADR-0011`

## Outcome

TextForge command surfaces expose user-triggered local AI actions for selected text, current resources, and selected diagnostics, with results shown as transient output or reviewable previews.

## Scope

- Add command palette entries for local AI actions.
- Route summarize, translate, language detection, rewrite, and diagnostic explanation through `WP-AI-LOCAL-01`.
- Disable or hide commands when policy or provider availability blocks them.
- Show results as transient surfaces, inline previews, copies, or patch previews according to action type.

## Non-goals

- Always-on background AI behavior.
- Applying edits without explicit user review.
- Markdown-specific extraction or ITM-specific semantic review; those belong to downstream workpackages.

## Package Impact

- `apps/textforge-web`
- command/action registry
- editor selection and diagnostic surfaces
- future local AI package

## Interfaces / Contracts Changed

- Local AI command descriptors.
- Command availability metadata.
- Result preview and patch preview adapters.

## Validation Criteria

Use `validation/checklists/workpackages/WP-AI-LOCAL-COMMANDS-local-ai-command-actions.md` plus implementation evidence once this candidate is accepted for implementation.

## Evidence Required

- Focused tests for command registration and availability gating.
- Focused tests for result routing to transient or preview flows.
- Manual UI evidence from the user for command palette/editor flows.
- RAPID event entries for material decisions, progress, issues, or risks.

## Open Decisions

- First command set for implementation.
- Whether diagnostic explanation belongs in this workpackage or first ships with ITM review.

## Archive Trace

- Introduced as proposed by `ADR-0011`.
