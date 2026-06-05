# R-BACKEND-PREVIEW - Backend preview

## Outcome

Optional local backend host/API/persistence preview behind provider-neutral identity and policy contracts.

## Included Workpackages

The included workpackage list is generated from `roadmap-state.yaml`.

| WP | Title | Status source | Required |
|---|---|---|---|
| `WP-ID-01` | Identity contract | Registry-owned | yes |
| `WP-ID-DEV` | Development identity fixture provider | Registry-owned | no |
| `WP-POLICY-01` | Provider-neutral server policy engine | Registry-owned | yes |
| `WP-PRIVATE-CONTRACT` | Private/group space contracts | Registry-owned | yes |
| `WP-BE-HOST` | Enterprise container and app host | Registry-owned | yes |
| `WP-BE-API` | Backend API contract and frontend provider | Registry-owned | yes |
| `WP-BE-PERSIST` | Reference persistence server | Registry-owned | yes |
| `WP-PRIVATE-SERVER` | Private/group spaces server | Registry-owned | no |
| `WP-GITLAB` | GitLab persistence adapter | Registry-owned | no |
| `WP-SERVICES-BE` | Backend-backed service folders | Registry-owned | no |
| `WP-COLLAB-LEASES` | Soft collaboration leases | Registry-owned | no |
| `WP-AI-MEDIATOR` | AI contract and backend mediator | Registry-owned | no |
| `WP-AI-PREF` | AI preference integration | Registry-owned | no |

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

Optional local backend host/API/persistence preview behind provider-neutral identity and policy contracts.

## Open Decisions

- See `decisions/` and `RAPID.md`.
