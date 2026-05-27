# AGENTS START HERE — Roadmap V18

This roadmap is now workpackage-first.

## Required reading order

1. `README.md`
2. `ROADMAP_V18.md`
3. `decisions/RAPID.md`
4. `workpackages/workpackage-register.md`
5. The relevant workpackage cluster file under `workpackages/`
6. Any package guide under `package-guides/` touched by the work
7. Any grilling record under `grilling/` referenced by the workpackage

## Planning rule

Phases `-1` through `4.1` are historical foundation. Do not reopen them unless an explicit defect or decision requires it.

From WP5 onward, do not assume the next numeric item is automatically the next implementation step. Use:

```text
status + dependencies + selected release scope + validation readiness
```

The workpackage register is the canonical current planning source.

## Current implementation posture

Unless a newer RAPID entry supersedes this, the default recommendation remains:

```text
WP-ITM-02
```

`WP-05A`, `WP-05B`, `WP-05C`, `WP-05D`, `WP-RES-01`, `WP-ITM-01`, `WP-REPO-01`, `WP-LUA`, and `WP-LUA-POWER-SESSION` are now validated. The remaining first-shippable implementation order is `WP-ITM-02 -> WP-ITM-VISUALS -> WP-MD-REPORT -> WP-BPMN-SEM -> WP-BPMN-VISUAL -> WP-TABLES -> WP-SKETCH -> WP-ARCHIMATE-SEM -> WP-ARCHIMATE-VISUAL -> WP-SET-01`; completing that sequence defines the first version to polish and ship. `WP-RES-02`, `WP-ID-01`, `WP-SET-01`, `WP-ITM-VISUALS`, and `WP-TABLES` remain separately startable under the current dependency posture.

These workpackages preserve the accepted Phase 5 grilling decisions around contribution manifests, capability activation, resolver context, contribution execution, `%require` diagnostics, package composition, active capability context, and surface reopening for intermediate values.

## Adapter rule

Provider-specific integrations are not allowed to become hidden blockers.

Standalone optional adapters include, at minimum:

- `WP-SSO-ENTRA`
- `WP-SSO-OIDC`
- `WP-SSO-SAML`
- `WP-GITLAB`
- `WP-AI-*` provider adapters
- SharePoint-like repository adapters
- browser extension wrapper
- future PWA/native/local packaged variants

A selected release may require one of these, but generic roadmap progress should depend on contracts, fixtures, and policy engines, not on enterprise infrastructure access.

## Identity rule

Microsoft Entra SSO is a production adapter, not the generic identity foundation.

The blocking generic identity path is:

```text
WP-ID-01 Identity contract
WP-ID-DEV Development identity fixture provider
WP-POLICY-01 Provider-neutral server policy engine
```

Entra, OIDC, SAML, Keycloak, or other providers may be added later behind the same identity contract.

## RAPID rule

`decisions/RAPID.md` remains append-only. Do not edit previous rows. Add new rows for decisions, actions, progress, issues, and dependencies.

## Completion rule

A workpackage can only be marked `Implemented` or `Validated` when:

- its dependencies are satisfied or explicitly waived in RAPID;
- its acceptance criteria are met;
- relevant package checks pass;
- security/accreditation invariants are preserved;
- any remaining verification gap is recorded in RAPID;
- `workpackages/implementation-status.md` is updated.

Facade closure is not accepted. A workpackage cannot be closed by preserving API shape while omitting promised behavior.
