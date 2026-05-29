# @textforge/bpmn

`@textforge/bpmn` owns the narrowed V19a BPMN chain for TextForge.

Current delivered scope:

- `WP-BPMN-SEM` semantic MVP profile, fixtures, BPMN XML import helpers, and validation diagnostics
- `WP-BPMN-VISUAL-A` read-only `bpmn-js` viewer surface for BPMN XML resources
- `WP-BPMN-DI-01` read-only Diagram Interchange extraction, validation, and application helpers
- `WP-BPMN-VISUAL-B` shared ITM visual-target integration for BPMN `%view` and `%viewpoint` targets
- contribution capabilities for `bpmn.semantic`, `bpmn.rules`, `bpmn.xml`, `bpmn.viewer`, and `bpmn.di`
- preserved references to the broader bundled BPMN assets under `docs/examples/bpmn/`

The package intentionally keeps full BPMN completeness, modeler/editing, and write-back out of the delivered read-only chain.
