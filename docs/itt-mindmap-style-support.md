# ITT Mindmap Style Support

TextForge V1 reads a small, local-only subset of ITT node attributes in the jsMind viewer.

Supported node style attributes:

- `background-color`, `backgroundColor`, `background`, `bg`, `fill`, `color`: node fill colour.
- `foreground-color`, `foregroundColor`, `text-color`, `textColor`, `fg`: node text colour.
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
&root [topic] Roadmap {bg: #28343c, fg: white, shape: pill}
  &api API work {fill: #eaf3ff, border-color: #3a6ea5}
  &ui UI work {background: #fff3e0, line-color: #cf6f2a, line-width: 3} @depends:api
```

Not supported in V1: arbitrary CSS, remote images, per-branch hierarchy line styling, layout coordinates, icons, and write-back from the mindmap viewer.
