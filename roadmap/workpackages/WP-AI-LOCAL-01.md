# WP-AI-LOCAL-01 - Browser local AI provider and policy-gated capability contract

## Registry

- Workpackage ID: `WP-AI-LOCAL-01`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-LOCAL-AI`
- ADRs: `ADR-0011`

## Outcome

TextForge exposes browser-local AI as a typed, policy-gated capability provider with defensive runtime availability reporting and a mandatory no-op fallback provider.

## Scope

- Define the local AI provider contract and capability report.
- Implement Chrome built-in AI feature detection behind a provider adapter.
- Implement `noopLocalAiProvider` for disabled or unavailable local AI.
- Add policy gates for disabled and local-only modes.
- Report provider, capability, model-download, policy, device, language, context, and error availability states.
- Keep all local AI actions user-triggered.

## Non-goals

- Backend-mediated AI execution.
- Assuming Chrome exposes embeddings.
- Automatic source mutation from AI output.
- Provider-specific UI calls outside the capability contract.

## Package Impact

- Future local AI package
- `apps/textforge-web`
- core contribution/capability contracts
- settings and command/action integration code

## Interfaces / Contracts Changed

- Local AI provider contract.
- Capability availability report.
- Local AI policy and settings contract.
- No-op provider behavior.

## Validation Criteria

Use `validation/checklists/workpackages/WP-AI-LOCAL-01-browser-local-ai-provider.md` plus implementation evidence once this candidate is accepted for implementation.

## Evidence Required

- Focused tests for provider detection and no-op behavior.
- Focused tests for policy gates and unavailable states.
- Manual UI evidence from the user if settings or availability surfaces are implemented.
- RAPID event entries for material decisions, progress, issues, or risks.

## Open Decisions

- Stable TypeScript shape for provider requests and structured prompt results.
- Whether AI policy later consolidates with backend AI policy under a shared module.
- Exact display wording for browser-managed model download state.

## Archive Trace

- Introduced as proposed by `ADR-0011`.
