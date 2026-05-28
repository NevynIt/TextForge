# WP-ITM-VRESOLVE-01 — Shared ITM visual target resolver

## Gate

This workpackage must be grilled before implementation because it defines the shared contract used by runtime surfaces, publication, and later BPMN visual target integration.

## Checklist

- [x] Resolver resolves source model from workspace/repository context.
- [x] `%view` resolves to referenced `%viewpoint`.
- [x] Raw model fallback target is explicit and deterministic.
- [x] Existing viewpoint pipeline `render:` step is used as renderer reference and precedence is documented.
- [x] Filtered model is produced before Visual ITM generation.
- [x] Visual ITM contains source/view/viewpoint provenance.
- [x] Missing declared renderer produces diagnostic/error without silent fallback.
- [x] Resolver is usable by both interactive surfaces and `itm-pub`.
- [x] Derived Visual ITM uses the source target's renderer syntax/precedence, while standalone/manual Visual ITM treats its own renderer metadata as local truth.
- [x] First-slice parity requires stable provenance and visual-to-source navigation, while declared view-delta consumption and live bidirectional source/visual sync remain later work.
