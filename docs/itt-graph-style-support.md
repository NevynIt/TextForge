# ITT Graph Style Support

The ITT to graph pipeline carries a focused set of node and edge attributes into the Cytoscape and Sigma viewers.

Supported node attributes:

- `color`, `background`, `background-color`, `backgroundColor`, `bg`, `fill`: node colour.
- `size`, `node-size`, `nodeSize`: node size.
- `x`, `y`: initial graph coordinates, used as starting positions before layout.

Supported hierarchy edge attributes:

- `edge-color`, `edgeColor`, `line-color`, `lineColor`, `stroke`: edge colour from the parent-child line into that node.
- `edge-width`, `edgeWidth`, `line-width`, `lineWidth`: edge width from the parent-child line into that node.

Supported cross-link edge attributes:

- `link-color`, `linkColor`, `line-color`, `lineColor`, `edge-color`, `edgeColor`: cross-link colour for links leaving that node.
- `link-width`, `linkWidth`, `line-width`, `lineWidth`, `edge-width`, `edgeWidth`: cross-link width for links leaving that node.

The graph model also records `depth` and sibling `rank` for every ITT node. Viewers use explicit node colours first; if none are present, ITT-derived graphs fall back to depth-based colours.

Example:

```itt
&root [topic] Roadmap {fill: #28343c, size: 18}
  &api API work {fill: #eaf3ff, edge-color: #3a6ea5}
  &ui UI work {background: #fff3e0, link-color: #cf6f2a, link-width: 3} @depends:api
```

Not supported in V1: arbitrary CSS, icons, Sigma node shapes, edge curves, text styling, and saving moved Sigma/Cytoscape positions back to ITT source.
