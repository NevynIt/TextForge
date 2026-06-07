# R-LOCAL-AI-MVP - Local AI MVP

## Outcome

Policy-gated browser-local AI provider foundation with explicit user-triggered assistance for commands, Markdown, ITM semantic review, and cited workspace search.

## Included Workpackages

The included workpackage list is generated from `roadmap-state.yaml`.

| WP | Title | Status source | Required |
|---|---|---|---|
| `WP-AI-LOCAL-01` | Browser local AI provider and policy-gated capability contract | Registry-owned | no |
| `WP-AI-LOCAL-COMMANDS` | Local AI command palette and editor actions | Registry-owned | no |
| `WP-AI-MD-ASSIST` | Markdown authoring, review, extraction, and report assistance | Registry-owned | no |
| `WP-AI-ITM-REVIEW` | ITM semantic review, diagnostics, and patch proposals | Registry-owned | no |
| `WP-AI-SEARCH-01` | Workspace semantic search without embeddings | Registry-owned | no |

## Excluded / Deferred

- `WP-AI-EMBED-01` is deferred from the MVP. Embeddings and vector indexes remain optional provider-backed derived data.
- Anything else not listed in the registry under this release is excluded until `roadmap-state.yaml` is updated.

## Dependency Gates

Dependency gates are resolved from `roadmap-state.yaml` and visualized in `views/dependency-map-full.md`.

## Acceptance Criteria

- All included workpackages have resolved dependencies or explicit waivers.
- Required validation evidence exists under `validation/evidence/`.
- Release-specific risks are recorded in `RAPID.md`.
- Browser local AI availability is feature-detected and policy-gated before any UI action is exposed.
- AI output is transient or reviewable unless the user explicitly applies a normal source edit.

## Validation Evidence Required

- Workpackage checklist evidence for included workpackages.
- Release cut evidence file if the release moves beyond candidate/defined state.
- Manual UI validation evidence from the user for local AI workflows, following repository guidance.

## Risks

| Risk | Mitigation |
|---|---|
| Browser API churn | Re-check Chrome API status immediately before implementation and keep provider detection defensive. |
| AI output confused with deterministic validation | Label AI findings separately and keep deterministic validators authoritative. |
| Registry drift | Regenerate views from `roadmap-state.yaml` and validate references before release. |

## Release Notes Draft

Policy-gated browser-local AI provider foundation with command, Markdown, ITM semantic review, and cited workspace search assistance.

## Open Decisions

- See `decisions/ADR-0011-local-ai-capability-architecture-and-semantic-assistance-layer.md` and `RAPID.md`.
