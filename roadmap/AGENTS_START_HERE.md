# AGENTS START HERE - Roadmap V19a

This roadmap is workpackage-first and active-roadmap-only.

## Required reading order

1. `README.md`
2. `ROADMAP_V19A.md`
3. `decisions/RAPID.md`
4. `workpackages/workpackage-register.md`
5. The relevant workpackage cluster file under `workpackages/`
6. Any package guide under `package-guides/` touched by the work
7. Any grilling record under `grilling/` referenced by the workpackage

## Active-roadmap rule

Do not use `roadmap/archive/` or `ROADMAP_V18.md` as active implementation instructions. They are retained locally for traceability only.

The active roadmap is the V19a file set. Implement against current workpackages, package guides, specs, validation files, and RAPID entries.

## Frozen baseline rule

Already validated work is frozen unless a later RAPID decision explicitly reopens a defect.

Frozen baseline:

```text
WP-05A
WP-05B
WP-05C
WP-05D
WP-RES-01
WP-REPO-01
WP-ITM-01
WP-ITM-02
WP-ITM-VISUALS
WP-LUA
WP-LUA-POWER-SESSION
```

Do not absorb new scope into frozen workpackages. Add or implement follow-on workpackages instead.

## Current implementation posture

Unless a newer RAPID entry supersedes this, the recommended visual recovery path is:

```text
WP-VITM-01
-> WP-ITM-VTARGET-01
-> WP-ITM-VRESOLVE-01
-> WP-RENDER-CYTOSCAPE
```

`WP-MD-REPORT`, `WP-BPMN-SEM`, `WP-ARCHIMATE-SEM`, `WP-TABLES`, `WP-RES-02`, `WP-ID-01`, and `WP-SET-01` remain separately startable, but BPMN/ArchiMate visual work should not rely on `WP-ITM-VISUALS` alone for runtime renderer parity.

## ITM visual recovery rule

`WP-ITM-VISUALS` is the validated static projection/publication baseline. It is not full runtime renderer parity.

Runtime visual recovery must use the V19a chain:

```text
WP-VITM-01
WP-ITM-VTARGET-01
WP-ITM-VRESOLVE-01
WP-RENDER-CYTOSCAPE
WP-ITM-PUB-VISUAL-01
WP-RENDER-JSMIND
WP-RENDER-SIGMA
```

A `.itm` file may contain a model, `%viewpoint` pipelines, and `%view` instances. Visual opening must resolve those targets instead of treating the file as one monolithic graph.

## Adapter rule

Provider-specific integrations are not hidden blockers.

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

## BPMN visual rule

When BPMN visual work is implemented, use BPMN.io / `bpmn-js`. Use `WP-BPMN-VISUAL-A` for the read-only viewer, `WP-BPMN-VISUAL-B` for ITM/BPMN visual target integration, and defer `WP-BPMN-VISUAL-C` for modeler/edit/write-back.

## RAPID rule

`decisions/RAPID.md` remains append-only for historical rows. Keep new entries at the end of the table. Update the status block when the active recommendation changes.

## Completion rule

A workpackage can only be marked `Implemented` or `Validated` when:

- its dependencies are satisfied or explicitly waived in RAPID;
- its acceptance criteria are met;
- relevant package checks pass;
- security/accreditation invariants are preserved;
- any remaining verification gap is recorded in RAPID;
- `workpackages/implementation-status.md` is updated.

Facade closure is not accepted. A workpackage cannot be closed by preserving API shape while omitting promised behavior.
