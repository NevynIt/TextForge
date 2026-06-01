# WP-BPMN-VISUAL-B — ITM/BPMN Visual Target Integration Checklist

## Scope

Connect ITM visual target resolution to BPMN visual output for read-only consumption.

## Acceptance checks

- An ITM `%view` or `%viewpoint` can select a BPMN-oriented visual target.
- The shared `WP-ITM-VRESOLVE-01` resolver is used; BPMN code does not reimplement ITM target resolution.
- A selected BPMN render target opens the BPMN.io viewer surface from `WP-BPMN-VISUAL-A`.
- Missing BPMN renderer/viewer support produces diagnostics; no silent fallback to generic graph rendering.
- Source/view/viewpoint provenance is preserved enough for diagnostics and navigation.
- The integration remains read-only; no modeler/write-back behavior is introduced.
- Fixtures include at least one BPMN-oriented ITM model rendered through the target picker/resolver path.

## Validation evidence

- Implemented across `@textforge/itm`, `@textforge/bpmn`, and the web shell, and recorded in RAPID `P-095`.
- Focused ITM/BPMN tests, web build, bundled-doc typing, and repo-wide `corepack pnpm verify` passed.
- The slice remains read-only and does not claim BPMN modeler/edit/write-back behavior.
