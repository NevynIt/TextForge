# 05 BPMN EA Assets And Tables

## Release Smoke: BPMN Read-Only Viewer

What to test:

- BPMN XML resources open in the read-only viewer;
- BPMN is not accidentally editable through the viewer chain.

How:

1. Open bundled BPMN examples under `/.textforge/resources/docs/examples/bpmn`.
2. Select a `.bpmn` or BPMN XML resource.
3. Open with the BPMN viewer if available.
4. Pan, zoom, or fit the diagram if controls are present.
5. Open the same resource with the text editor.

Expected:

- BPMN diagram renders with visible events, tasks, gateways, flows, and labels from the source;
- parse diagnostics appear for malformed XML instead of a blank viewer;
- text source can be inspected;
- viewer does not expose model editing or write-back controls in the current delivered scope.

## BPMN ITM Visual Target Integration

What to test:

- BPMN-oriented ITM files can resolve BPMN visual targets through `%view` and `%viewpoint`.

How:

1. Open the bundled BPMN ITM example under `/.textforge/resources/docs/examples/bpmn`.
2. Run `Open visuals...`.
3. Select a BPMN viewer target if offered.
4. Open the target.

Expected:

- target picker identifies BPMN view/viewpoint targets;
- valid BPMN target opens in the read-only BPMN viewer;
- missing source XML, missing DI, or invalid target references show diagnostics;
- non-BPMN ITM targets in the same file remain available if valid.

## BPMN Diagram Interchange Fidelity

What to test:

- preserved Diagram Interchange geometry is applied read-only where present.

How:

1. Open a BPMN fixture that includes DI bounds/routes/labels.
2. Compare task and event placement against the expected fixture shape from docs or previous evidence.
3. Open a copy with intentionally damaged DI references if practical.

Expected:

- nodes appear at stable, recognizable positions;
- routes and labels are present where DI provides them;
- damaged DI produces specific diagnostics such as missing element bounds or relationship references;
- semantic model still loads where possible.

## EA Dashboard Samples

What to test:

- enterprise architecture dashboard fixtures render through the EA viewer or ITM graph surface.

How:

1. Open each URL:

```text
/?testProfile=ea-dashboard-sample
/?testProfile=ea-dashboard-retail
/?testProfile=ea-dashboard-retail-itm
```

2. Inspect the first viewport, charts/cards/tables if present, and scroll behavior.
3. Resize the browser.

Expected:

- JSON dashboard samples open in the EA dashboard viewer;
- ITM retail sample opens through the ITM graph path;
- dashboard content is readable and not clipped;
- malformed or missing dashboard sections show empty/diagnostic states instead of app failure.

## Image, SVG, PDF, And Generic Asset Viewers

What to test:

- asset resources open with appropriate viewers and can be downloaded/exported.

How:

1. Upload or create:
   - a small PNG or JPEG image;
   - a text-stored SVG;
   - a byte-backed SVG if available;
   - a small PDF;
   - an unknown binary file.
2. Open each resource.
3. Run available asset commands:
   - `Download selected asset`;
   - `Export selected SVG`;
   - `Export selected SVG as PNG`.

Expected:

- image viewer shows the image at usable scale;
- SVG viewer works for text-stored and byte-backed SVG resources;
- PDF viewer opens PDF resources or reports a clear browser/PDF limitation;
- unknown bytes open in a generic binary viewer or download path;
- downloads have stable filenames;
- SVG-to-PNG export rasterizes locally and does not mutate the source SVG.

## Asset Persistence And Archive Round Trip

What to test:

- asset resources survive browser persistence and ZIP export/import.

How:

1. Upload SVG, PNG, PDF, and unknown binary resources.
2. Reload the browser.
3. Confirm each still opens.
4. Export workspace ZIP.
5. Reset browser workspace.
6. Import the ZIP.
7. Reopen each asset.

Expected:

- text-stored SVG remains text-stored and previewable;
- byte resources remain byte resources;
- MIME type and extension still route to the same viewer;
- no imported asset is corrupted or changed to an empty file.

## Tables Current Scope

What to test:

- current tables behavior matches shipped scope.

How:

1. Search bundled docs and command palette for table-specific surfaces or commands.
2. Open Markdown documents containing pipe tables.
3. Upload a `.csv` file if a table surface is advertised by the current build.

Expected:

- Markdown pipe tables render correctly inside Markdown preview;
- if no table-specific surface is shipped, `.csv` opens as text or generic resource behavior and no table command is misleadingly advertised;
- if a later build ships `@textforge/tables` behavior, document the observed table surface, editing, import/export, and diagnostics in this file before release.

