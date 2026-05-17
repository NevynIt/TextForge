# ITT Mindmap Style Support

TextForge V1 reads a small, local-only subset of ITT node attributes and `%style` directives in the jsMind viewer.

Supported node selectors:

- `*`: all nodes.
- `&id`: one node by declared id.
- `[type]`: nodes of a type.
- `#tag`: nodes with a tag.
- `{key=value}`: nodes with an attribute value.

Supported cross-link selectors:

- `->`: all cross-links.
- `->[link-type]`: cross-links with a relationship type.

`=>` hierarchy-edge styles are not rendered by jsMind in V1 because jsMind owns the parent-child branch drawing.

Style directives may be one line or multiline. Later matching rules override earlier rules. CSS-inherited text properties such as `color`, `font-size`, `font-style`, and `font-weight` are inherited by child nodes. Direct node attributes override inherited and selector styles on that node.

Supported node style attributes:

- `background-color`, `backgroundColor`, `background`, `bg`, `fill`: node fill colour.
- `color`, `foreground-color`, `foregroundColor`, `text-color`, `textColor`, `fg`: node text colour.
- `font-size`, `fontSize`: node text size.
- `font-weight`, `fontWeight`, `weight`: `normal`, `bold`, or numeric CSS weights.
- `font-style`, `fontStyle`, `style`: `normal`, `italic`, or `oblique`.
- `border-color`, `borderColor`, `border`, `stroke`: node border colour.
- `border-width`, `borderWidth`: node border width.
- `shape`, `node-shape`, `nodeShape`: `round`, `rounded`, `square`, `rectangle`, `pill`, or `capsule`.

Supported cross-link style attributes:

- `link-color`, `linkColor`, `line-color`, `lineColor`: cross-link colour for links leaving that node.
- `link-width`, `linkWidth`, `line-width`, `lineWidth`: cross-link stroke width for links leaving that node.

Example:

```itt
%style * { font-size: 13px; }
%style [topic] {
  bg: #28343c;
  fg: white;
  shape: pill;
}
%style ->[depends] { stroke: #cf6f2a; stroke-width: 3; }
&root [topic] Roadmap {bg: #28343c, fg: white, shape: pill}
  &api API work {fill: #eaf3ff, border-color: #3a6ea5}
  &ui UI work {background: #fff3e0, line-color: #cf6f2a, line-width: 3} @depends:api
```

`%include other-file.itt` is supported for ITT mind-map visualizers, limited to files currently open in the editor. Includes are expanded in place and circular includes are ignored with a diagnostic.

Not supported in V1: arbitrary CSS selectors beyond the ITT selector subset, remote images, per-branch hierarchy line styling, layout coordinates, icons, and write-back from the mindmap viewer.
