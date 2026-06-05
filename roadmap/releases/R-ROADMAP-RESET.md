# R-ROADMAP-RESET - Roadmap governance reset

## Outcome

Clean module/workpackage/release-based roadmap with archived legacy material.

## Included Workpackages

The included workpackage list is generated from `roadmap-state.yaml`.

| WP | Title | Status source | Required |
|---|---|---|---|
| `WP-ROADMAP-CLEANUP` | Roadmap cleanup and governance reset | Registry-owned | yes |

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

Clean module/workpackage/release-based roadmap with archived legacy material.

## Open Decisions

- See `decisions/` and `RAPID.md`.
