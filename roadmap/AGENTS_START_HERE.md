# Agents Start Here - Roadmap V20

This roadmap is workpackage-first. Do not plan or implement from older phase-roadmap material.

## Required Reading

1. `roadmap/README.md`
2. `roadmap/ROADMAP_V20.md`
3. `roadmap/decisions/RAPID.md`
4. `roadmap/workpackages/workpackage-register.md`
5. `roadmap/workpackages/implementation-status.md`
6. The relevant workpackage cluster, package guide, spec, grilling record, and validation checklist for the selected work.

## Current Status

The Visual ITM/runtime renderer chain and the read-only BPMN visual chain are validated through `WP-BPMN-VISUAL-B`.

Select the next slice from V20 dependency-ready options. `WP-TABLES` remains on hold until its dedicated grilling session resolves diagnostics ownership, package boundary, and grid/editor strategy.

## Frozen Baseline

Do not reopen or expand these validated workpackages unless a later RAPID decision explicitly reopens a defect:

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
WP-VITM-01
WP-ITM-VTARGET-01
WP-ITM-VRESOLVE-01
WP-RENDER-CYTOSCAPE
WP-RENDER-JSMIND
WP-RENDER-SIGMA
WP-BPMN-SEM
WP-BPMN-VISUAL-A
WP-BPMN-DI-01
WP-BPMN-VISUAL-B
```

New scope belongs in follow-on workpackages.

## Completion Rule

A workpackage can be marked `Implemented` or `Validated` only when:

- dependencies are satisfied or explicitly waived in RAPID;
- acceptance criteria are met;
- relevant package checks pass;
- security/accreditation invariants are preserved;
- any remaining verification gap is recorded in RAPID;
- `workpackages/implementation-status.md` is updated.

Facade closure is not accepted. Do not claim completion by preserving API shape while omitting promised behavior.

## RAPID Rule

`decisions/RAPID.md` historical rows are append-only. New rows go at the end of the table. The current status block may be edited because it is an operational pointer.
