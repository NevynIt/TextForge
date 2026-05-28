# WP-BPMN-VISUAL-A — BPMN.io Viewer Surface Checklist

## Scope

Read-only BPMN XML visual consumption using BPMN.io / `bpmn-js`.

## Acceptance checks

- BPMN XML resources can open in a dedicated BPMN visual surface.
- The surface mounts `bpmn-js` / BPMN.io viewer runtime, not a static image substitute.
- Invalid BPMN XML produces diagnostics instead of a blank or silent failure.
- The viewer is read-only in this slice.
- No modeler/edit/write-back UI appears in this slice.
- No ITM `%view` / `%viewpoint` target integration is required in this slice.
- Package dependencies are declared through the package manifest and pass license checks.
- Surface lifecycle works with open/close/reopen flows.

## Evidence to attach when implemented

- Unit/integration tests.
- Build/test commands.
- Manual screenshot or validation notes for loading a BPMN XML fixture.
