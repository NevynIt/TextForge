# 02 Markdown And Diagrams

## Release Smoke: Markdown Preview

What to test:

- Markdown resources open in source and preview surfaces;
- preview rendering is asynchronous but stable;
- inspector summary matches the rendered document.

How:

1. Open `http://127.0.0.1:4173/?testProfile=markdown-tfmd`.
2. Wait for the preview to finish rendering.
3. Open the same resource with `Text editor`.
4. Switch between source and preview tabs.
5. Open the inspector utility pane.

Expected:

- preview first shows a loading state only briefly, then rendered content;
- headings, paragraphs, lists, code blocks, tables, and links are styled and readable;
- source editor remains editable for writable resources and read-only for bundled resources unless copied;
- inspector includes `TF-MD summary` with metadata title, diagnostics count, asset count, and generated diagram count.

## Minimal Markdown Fixture

What to test:

- the smallest bundled Markdown sample renders without optional features.

How:

1. Open `http://127.0.0.1:4173/?testProfile=markdown-minimal`.
2. Read the preview.
3. Open the command palette and search for `Open with`.

Expected:

- the minimal document renders without diagnostics;
- `Open with Markdown preview` and `Open with Text editor` are available;
- non-Markdown surfaces are not offered unless they are generic text-compatible surfaces.

## TF-MD Metadata And Diagnostics

What to test:

- TF-MD metadata drives the preview summary;
- malformed fenced blocks produce diagnostics rather than breaking the page.

How:

1. Copy the bundled TF-MD Markdown preview fixture into `/docs/manual-markdown.tfmd`.
2. Open the copy in the text editor.
3. Add an invalid JSON fenced block:

````markdown
```json
{ broken:
```
````

4. Open or refresh the Markdown preview.
5. Inspect the summary and diagnostics.

Expected:

- preview still renders the rest of the document;
- diagnostics count increases;
- the invalid JSON block is visibly represented as data/code, not as raw app failure;
- console does not show uncaught render exceptions.

## Local Links And Workspace Assets

What to test:

- relative links and images resolve through the browser-managed workspace, not host filesystem access.

How:

1. Create `/docs/linked-target.md` with a visible heading.
2. Create or upload `/docs/manual-image.svg`.
3. Create `/docs/link-source.md` with:

```markdown
# Link source

[Open linked target](./linked-target.md)

![Manual image](./manual-image.svg)
```

4. Open `/docs/link-source.md` in Markdown preview.
5. Click the relative link.
6. Return to `/docs/link-source.md`.

Expected:

- SVG image renders through workspace asset resolution;
- clicking the relative link opens `/docs/linked-target.md`;
- link activation does not navigate the browser away from the app shell;
- missing local assets show a clear missing/unresolved state rather than a broken shell.

## Insert Markdown Snippets

What to test:

- Markdown commands modify the selected writable resource at the editor selection.

How:

1. Create `/docs/snippet-test.md` and open it in the text editor.
2. Run `Insert image reference`.
3. Enter a workspace-relative image path when prompted.
4. Run `Insert Mermaid block`.
5. Run `Insert Graphviz block`.
6. Open the Markdown preview.

Expected:

- image, Mermaid, and Graphviz snippets are inserted into the source;
- the file persists after reload;
- preview renders or reports each block through the Markdown pipeline;
- commands are disabled or ineffective with a clear reason for read-only bundled resources.

## Mermaid And Graphviz Preview

What to test:

- diagram fenced blocks render and do not block normal Markdown output.

How:

1. Open bundled diagram examples under `/.textforge/resources/docs/examples/diagrams`.
2. Open at least one Mermaid sample and one DOT sample in Markdown preview.
3. Resize the main panel from wide to narrow.
4. Scroll through the rendered page.

Expected:

- diagrams render as visible SVG or a clear generated preview;
- large diagrams remain inside the surface viewport;
- scrolling is local to the surface and does not break the workbench frame;
- invalid or unsupported diagrams produce diagnostics, not a blank page.

## Export Print HTML

What to test:

- a Markdown resource can export to print-oriented HTML.

How:

1. Select a Markdown resource that has headings, diagrams, and local links.
2. Run `Export print HTML`.
3. Open the downloaded `.html` file.

Expected:

- the file downloads with a document-derived filename;
- exported HTML contains rendered Markdown content;
- print styling is usable;
- generated diagrams or diagnostic placeholders are present where expected;
- export does not mutate the source resource.

## Export Generated Diagrams

What to test:

- generated diagram resources are saved into the workspace and are viewable as assets.

How:

1. Select a Markdown resource containing Mermaid or Graphviz fenced blocks.
2. Run `Export generated diagrams`.
3. Inspect `/generated`.
4. Open the created `.svg` and `.png` resources.

Expected:

- `/generated` is created or expanded;
- SVG and PNG resources have deterministic names derived from the source document and block ids;
- generated SVG opens in the SVG viewer;
- generated PNG opens in the image viewer or generic asset viewer;
- generated resources include provenance or clear generated-resource metadata in the inspector when available.
