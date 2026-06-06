# R-LOCAL-AUTHORING-MVP - Local authoring MVP

## Outcome

Validated local/offline authoring baseline plus selected next local workspace capabilities, including recovery-boot hardening for the browser-managed shell, live overlay-aware workspace tree counts, and browser-first Fengari Lua host hardening.

## Included Workpackages

The included workpackage list is generated from `roadmap-state.yaml`.

| WP | Title | Status source | Required |
|---|---|---|---|
| `WP-05A` | Contribution manifest and registry model | Registry-owned | yes |
| `WP-05B` | Capability activation and resolver context | Registry-owned | yes |
| `WP-05C` | Pipeline/contribution execution integration | Registry-owned | yes |
| `WP-05D` | Minimal package/capability inspector | Registry-owned | no |
| `WP-RES-01` | Provider-aware resource descriptors | Registry-owned | yes |
| `WP-RES-02` | Revisions, dirty state, and conflict diagnostics | Registry-owned | yes |
| `WP-RES-03` | Multi-resource changesets and provider allowlists | Registry-owned | yes |
| `WP-LINK-INDEX` | Document link, backlink, and mention index | Registry-owned | no |
| `WP-ITM-01` | ITM parser/model foundation | Registry-owned | yes |
| `WP-ITM-02` | ITM directives, packages, validation, diagnostics | Registry-owned | yes |
| `WP-REPO-01` | Repository reference and include resolver | Registry-owned | yes |
| `WP-ITM-VISUALS` | ITM static visual projections and publication baseline | Registry-owned | no |
| `WP-VITM-01` | Visual ITM profile v1 | Registry-owned | no |
| `WP-ITM-VTARGET-01` | ITM visual target picker MVP | Registry-owned | no |
| `WP-ITM-VRESOLVE-01` | Shared ITM visual target resolver | Registry-owned | no |
| `WP-RENDER-CYTOSCAPE` | Cytoscape runtime renderer package | Registry-owned | no |
| `WP-ITM-PUB-VISUAL-01` | Shared visual pipeline for itm-pub | Registry-owned | no |
| `WP-RENDER-JSMIND` | jsMind runtime renderer package | Registry-owned | no |
| `WP-RENDER-SIGMA` | Sigma/Graphology runtime renderer package | Registry-owned | no |
| `WP-CANVAS` | Spatial workspace canvas | Registry-owned | no |
| `WP-LUA` | Lua automation | Registry-owned | no |
| `WP-LUA-POWER-SESSION` | Lua self-escalation session and one-click recovery | Registry-owned | no |
| `WP-LUA-VIRTUAL-HOST-01` | TextForge Lua virtual host for Fengari | Registry-owned | yes |
| `WP-BPMN-SEM` | BPMN semantic profile and validation | Registry-owned | no |
| `WP-BPMN-VISUAL-A` | BPMN.io viewer surface | Registry-owned | no |
| `WP-BPMN-DI-01` | BPMN Diagram Interchange read-only fidelity | Registry-owned | no |
| `WP-BPMN-VISUAL-B` | ITM/BPMN visual target integration | Registry-owned | no |
| `WP-COMMENTS-SIDECAR` | Comments and review sidecars | Registry-owned | no |
| `WP-CHANGE-PROPOSALS` | Reviewable change proposals | Registry-owned | no |
| `WP-REPO-SHAREPOINT` | SharePoint-like repository adapter | Registry-owned | no |

## Excluded / Deferred

Anything not listed in the registry under this release is excluded until `roadmap-state.yaml` is updated.

## Dependency Gates

Dependency gates are resolved from `roadmap-state.yaml` and visualized in `views/dependency-map-full.md`.

## Acceptance Criteria

- All included workpackages have resolved dependencies or explicit waivers.
- Required validation evidence exists under `validation/evidence/`.
- Release-specific risks are recorded in `RAPID.md`.

## Validation Evidence Required

- Workpackage checklist evidence for included workpackages.
- Release cut evidence file if the release moves beyond candidate/defined state.

## Risks

| Risk | Mitigation |
|---|---|
| Registry drift | Regenerate views from `roadmap-state.yaml` and validate references before release. |

## Release Notes Draft

Validated local/offline authoring baseline plus selected next local workspace capabilities.

## Open Decisions

- See `decisions/` and `RAPID.md`.
