# ITM And ITM-Pub BPMN Inline Publication

```tf-md
%metadata {
  title: "ITM and ITM-Pub BPMN Inline Publication"
}
%require itm
%require itm-pub
```

This bundled example keeps the publication contract in an `itm` block and renders the referenced BPMN XML inline through `itm-pub`.

## Publication Source

```itm name=training-bpmn-publication
%metadata
{
  title: "Training By Design inline BPMN publication"
  sourceFile: "Training By Design.bpmn"
}

%require bpmn.viewer ^0.1.0

%viewpoint training_bpmn_preview
{
  pipeline:
    - render: bpmn.viewer
}

%view training_bpmn_diagram
{
  viewpoint: training_bpmn_preview
}
```

## Inline BPMN Diagram

```itm-pub
source: training-bpmn-publication
view: training_bpmn_diagram
projection: graph
title: "Training By Design BPMN Diagram"
```

## Notes

- The `itm` block declares the model-backed publication contract and points at the bundled BPMN XML with `sourceFile`.
- The `itm-pub` block resolves the BPMN-oriented visual target and renders the BPMN diagram inline in the Markdown preview.
- Open `Training By Design.bpmn` directly if you want the full read-only BPMN surface with pan and zoom controls.
