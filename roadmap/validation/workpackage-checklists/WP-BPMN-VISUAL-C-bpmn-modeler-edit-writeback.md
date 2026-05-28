# WP-BPMN-VISUAL-C — BPMN Modeler/Edit/Write-back Checklist

## Status

Deferred. This workpackage is not part of the minimal BPMN visual consumption chain.

## Scope when activated

- BPMN modeler mode.
- Edit session boundaries.
- Patch preview.
- Apply/discard flow.
- BPMN XML write-back.
- Possible ITM model patch or `%view` delta write-back.
- Conflict/revision handling through appropriate resource/change infrastructure.

## Required dependencies before activation

- `WP-BPMN-VISUAL-B` implemented.
- `WP-GRAPH-EDIT-VITM` or an equivalent visual edit/write-back foundation available.
- `WP-RES-03` or an equivalent changeset/write policy layer available if multi-resource write-back is involved.

## Non-goal

This workpackage must not be used as a blocker for read-only BPMN visual consumption.
