# ITT Graph Style Support

The ITT to graph pipeline carries node attributes and `%style` directives into the Cytoscape and Sigma viewers. Direct node attributes still work, but selector rules are now the preferred way to style repeated types of nodes and edges.

Supported style selectors:

- `*`: all nodes.
- `&id`: one node by declared id.
- `[type]`: nodes of a type.
- `#tag`: nodes with a tag.
- `{key=value}`: nodes with an attribute value.
- `->`: all cross-links.
- `->[link-type]`: cross-links with a relationship type.
- `=>`: hierarchy edges.

Style directives may be one line or multiline:

```itt
%style [risk] {
  fill: #ffe8e8;
  stroke: #cc3333;
  shape: hexagon;
}
```

Later matching rules override earlier matching rules. CSS-inherited text properties such as `color`, `font-size`, `font-style`, and `font-weight` are inherited by child nodes. Direct node attributes override inherited and selector styles on that node.

Supported node style properties and attributes:

- `background`, `background-color`, `backgroundColor`, `bg`, `fill`: node colour. Legacy direct node attribute `color` is also accepted as a node colour.
- `color`, `foreground-color`, `foregroundColor`, `text-color`, `textColor`, `fg`: label colour where supported.
- `font-size`, `fontSize`, `font-weight`, `fontWeight`, `font-style`, `fontStyle`: label styling where supported.
- `border-color`, `borderColor`, `border`, `stroke`: node border colour.
- `border-width`, `borderWidth`, `stroke-width`: node border width.
- `shape`, `node-shape`, `nodeShape`: Cytoscape node shape. Sigma keeps circular nodes in V1.
- `opacity`: node opacity in Cytoscape.
- `size`, `node-size`, `nodeSize`: node size.
- `x`, `y`: initial graph coordinates, used as starting positions before layout.

Supported hierarchy edge style properties and attributes:

- `stroke`, `edge-color`, `edgeColor`, `line-color`, `lineColor`: edge colour.
- `stroke-width`, `edge-width`, `edgeWidth`, `line-width`, `lineWidth`, `width`: edge width.
- `line-style`, `lineStyle`, `stroke-style`, `strokeStyle`, `stroke-dasharray`: Cytoscape line style.
- `curve`, `curve-style`, `curveStyle`: Cytoscape edge curve style.
- `opacity`: edge opacity in Cytoscape.

Supported cross-link edge style properties and attributes:

- `stroke`, `link-color`, `linkColor`, `line-color`, `lineColor`, `edge-color`, `edgeColor`: cross-link colour.
- `stroke-width`, `link-width`, `linkWidth`, `line-width`, `lineWidth`, `edge-width`, `edgeWidth`, `width`: cross-link width.
- `line-style`, `lineStyle`, `stroke-style`, `strokeStyle`, `stroke-dasharray`: Cytoscape line style.
- `curve`, `curve-style`, `curveStyle`: Cytoscape edge curve style.
- `opacity`: edge opacity in Cytoscape.

The graph model also records `depth` and sibling `rank` for every ITT node. Viewers use explicit node colours first; if none are present, ITT-derived graphs fall back to depth-based colours.

Example:

```itt
&root [topic] Roadmap {fill: #28343c, size: 18}
%style [work] { fill: #eaf3ff; stroke: #3a6ea5; }
%style ->[depends] { stroke: #cf6f2a; stroke-width: 3; }
%style => { stroke: #9aa6ad; }
  &api API work {fill: #eaf3ff, edge-color: #3a6ea5}
  &ui [work] UI work {background: #fff3e0} @depends:api
```

`%include other-file.itt` is supported for ITT graph visualizers, limited to files currently open in the editor. Includes are expanded in place and circular includes are ignored with a diagnostic.

Not supported in V1: arbitrary CSS selectors beyond the ITT selector subset, icons, Sigma node shapes, and saving moved Sigma/Cytoscape positions back to ITT source.
