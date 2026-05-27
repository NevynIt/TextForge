# ITM Markdown Graph Smoke

```tf-md
%metadata {
  title: "ITM Markdown Graph Smoke"
}
%require itm
%require itm-pub
%require graphviz
```

```itm name=graph-model
&roadmap [Capability] Capability roadmap
  &foundation [Capability] Foundation
  &delivery [Capability] Delivery
delivery @depends_on:foundation
```

```itm-pub
source: graph-model
projection: graph
title: "Graph smoke publication"
```
