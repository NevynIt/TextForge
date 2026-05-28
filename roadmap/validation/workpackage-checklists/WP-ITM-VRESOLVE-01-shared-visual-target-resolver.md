# WP-ITM-VRESOLVE-01 — Shared ITM visual target resolver

## Gate

This workpackage must be grilled before implementation because it defines the shared contract used by runtime surfaces, publication, and later BPMN visual target integration.

## Checklist

- [ ] Resolver resolves source model from workspace/repository context.
- [ ] `%view` resolves to referenced `%viewpoint`.
- [ ] Raw model fallback target is explicit and deterministic.
- [ ] Existing viewpoint pipeline `render:` step is used as renderer reference and precedence is documented.
- [ ] Filtered model is produced before Visual ITM generation.
- [ ] Visual ITM contains source/view/viewpoint provenance.
- [ ] Missing declared renderer produces diagnostic/error without silent fallback.
- [ ] Resolver is usable by both interactive surfaces and `itm-pub`.
