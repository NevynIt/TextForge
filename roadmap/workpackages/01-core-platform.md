# 01 — Core Platform Workpackages

This cluster contains the generic platform work that should normally happen before broad feature expansion.

## Primary path

```text
WP-05A -> WP-05B -> WP-05C
```

## Workpackages

| WP | Title | Role |
|---|---|---|
| WP-05A | Contribution manifest and registry model | Defines canonical manifests and registry model. |
| WP-05B | Capability activation and resolver context | Defines active capability context, conflict diagnostics, and deterministic resolver inputs. |
| WP-05C | Pipeline/contribution execution integration | Replaces temporary shell adapter with canonical contribution execution. |
| WP-05D | Minimal package/capability inspector | Useful diagnostics/UI helper; not a hard platform gate. |
| WP-RELEASE-GATE | Release envelope and accreditation evidence | Recurring gate for selected release scopes. |

## Binding source material

- `grilling/phase-5-grilling.md`
- `package-guides/core.md`
- `package-guides/pipeline.md`
- `package-guides/security-profile.md`

## Key constraints

- Phase 5 contribution/capability decisions remain binding.
- Do not create a second extension system through resource providers.
- Package contribution manifests remain the executable contribution mechanism.
- `%require` is activation/check metadata, not an arbitrary dynamic package loader.
