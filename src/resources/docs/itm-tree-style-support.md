# ITM Tree Style Support

The ITM tree viewer applies node `%style` directives and direct node style attributes to the rendered outline.

Supported node selectors:

- `*`: all nodes.
- `&id`: one node by declared id.
- `[type]`: nodes of a type.
- `#tag`: nodes with a tag.
- `{key=value}`: nodes with an attribute value.

Tree view does not draw graph edges, so `->`, `->[link-type]`, and `=>` styles are ignored there. Links are still shown as clickable badges.

Style directives may be one line or multiline:

```itt
%style [risk] {
  background: #ffe8e8;
  color: #4c1d1d;
  border-color: #cc3333;
  font-weight: bold;
}
```

Later matching rules override earlier matching rules. CSS-inherited text properties such as `color`, `font-size`, `font-style`, and `font-weight` are inherited by child nodes. Direct node attributes override inherited and selector styles on that node.

Supported tree node style properties:

- `background`, `background-color`, `backgroundColor`, `bg`, `fill`: row background colour.
- `color`, `foreground-color`, `foregroundColor`, `text-color`, `textColor`, `fg`: row text colour.
- `font-size`, `fontSize`: row text size.
- `font-weight`, `fontWeight`, `weight`: row text weight.
- `font-style`, `fontStyle`, `style`: row text style.
- `border-color`, `borderColor`, `stroke`: row border colour.
- `border-width`, `borderWidth`, `stroke-width`: row border width.
- `shape`, `node-shape`, `nodeShape`: row corner shape using the same names as the mind-map viewer.
- `opacity`: row opacity.

`%include other-file.itm` is supported for ITM tree visualizers, limited to files currently open in the editor. Includes are expanded in place and circular includes are ignored with a diagnostic.
