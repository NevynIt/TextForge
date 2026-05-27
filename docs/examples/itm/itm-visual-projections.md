# ITM Visual Projections

```tf-md
%metadata {
  title: "ITM visual projections"
}
%require itm
%require itm-pub
%require graphviz
```

```itm name=capability-roadmap
%viewpoint capability_focus
{
  pipeline:
    - select: "[Capability]"
}
%view roadmap_graph
{
  viewpoint: capability_focus
}
&roadmap [Capability] Capability roadmap
  &foundation [Capability] Foundation
  &delivery [Capability] Delivery
```

## Tree

```itm-pub
source: capability-roadmap
projection: tree
title: "Capability roadmap tree"
```

## Graph

```itm-pub
source: capability-roadmap
projection: graph
title: "Capability roadmap graph"
```

## Mindmap

```itm-pub
source: capability-roadmap
projection: mindmap
title: "Capability roadmap mindmap"
```

## Catalogue

```itm-pub
source: capability-roadmap
projection: catalogue
title: "Capability roadmap catalogue"
```

## Matrix

```itm-pub
source: capability-roadmap
projection: matrix
title: "Capability roadmap matrix"
```

## Report

```itm-pub
source: capability-roadmap
projection: report
title: "Capability roadmap report"
```
