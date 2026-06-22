# 01 Workbench Shell And Workspace

## Release Smoke: Initial Boot

What to test:

- the React workbench shell boots;
- starter user workspace and bundled read-only resources are present;
- basic panels render without overlap.

How:

1. Start the app with `http://127.0.0.1:4173/`.
2. Wait until the loading state finishes.
3. Inspect the top toolbar, workspace sidebar, main document area, and utility/inspector region.
4. Expand the workspace tree.

Expected:

- the app shows a usable workbench, not a landing page;
- the status area reports the workspace is ready;
- the workspace tree contains user workspace roots such as `/docs`, `/examples`, `/roadmap`, and `/.textforge`;
- bundled docs appear under `/.textforge/resources`;
- the main area restores existing tabs when present, otherwise opens the bundled README resource;
- no panel, tab, toolbar, or inspector text overlaps.

## Release Smoke: Workspace Tree And Selection

What to test:

- selecting folders and resources updates the active selection;
- folder expand/collapse state is predictable;
- document tab badges remain visible and consistent after resources are opened.

How:

1. Expand `/.textforge/resources/docs/examples`.
2. Select several Markdown, ITM, and BPMN example resources.
3. Collapse and re-expand parent folders.
4. Open two different resources into the main area.
5. Switch between tabs.

Expected:

- selected tree row, active tab, surface header, and inspector refer to the same resource;
- each opened resource has a stable badge token in its document tab;
- badge tokens do not change just because the user switches tabs or collapses a folder;
- the workspace tree stays focused on folder counts and labels without badge or warning-icon chrome.

## Create, Edit, Rename, And Delete User Resources

What to test:

- writable workspace resources can be created and edited;
- inline rename and delete behavior work;
- bundled resources are protected from direct modification.

How:

1. Select `/docs`.
2. Run `New resource...` from the command palette or workspace context menu.
3. Name it `/docs/manual-test-notes.md` if prompted.
4. Open it with `Text editor`.
5. Enter:

```markdown
# Manual test notes

This file should persist after reload.
```

6. Reload the browser.
7. Confirm `/docs/manual-test-notes.md` still exists and contains the text.
8. Rename it to `/docs/manual-test-notes-renamed.md`.
9. Delete the renamed file and confirm the browser confirmation prompt.
10. Select a bundled resource under `/.textforge/resources` and inspect available commands.

Expected:

- created text persists after reload;
- rename updates the tree path, tab title, and inspector path;
- delete removes the resource and closes or invalidates related tabs cleanly;
- bundled resources do not expose direct write, rename, or delete behavior;
- bundled resources can be copied into the writable workspace when the copy command is available.

## Folders, Moves, And Drag/Drop

What to test:

- folders can be created;
- items can move within the writable workspace;
- file drop/upload creates resources in the intended folder.

How:

1. Create `/docs/manual-test-folder`.
2. Create a Markdown resource inside that folder.
3. Move the resource to `/examples` using drag/drop if available.
4. Upload or drop a small local `.md`, `.svg`, and `.pdf` file into `/docs/manual-test-folder`.
5. Open each uploaded file.

Expected:

- writable folders accept child resources;
- moved resources keep content and receive an updated path;
- uploaded Markdown opens in the text editor and Markdown preview;
- uploaded SVG opens in the SVG viewer;
- uploaded PDF opens in the PDF viewer or a clear PDF asset view;
- no uploaded file is placed in the wrong folder.

## Command Palette And Context Menus

What to test:

- commands are discoverable and enabled only when applicable.

How:

1. Open the command palette with the toolbar `Commands` control.
2. Search for `workspace`.
3. Select a folder and inspect workspace commands.
4. Select a text resource and inspect text/editor/surface commands.
5. Select a binary or PDF resource and inspect asset commands.
6. Right-click or otherwise open the context menu on a folder, a writable resource, and a bundled resource.

Expected:

- `New folder...`, `New resource...`, import, export, upload, rename, delete, copy, and reset commands appear in sensible contexts;
- resource-specific commands do not appear for incompatible selections;
- context menu actions target the clicked item, not a stale previous selection;
- command palette closes after a command is executed or canceled.

## Main And Popup Surface Management

What to test:

- package surfaces can move between main and popup placements;
- tab commands work without losing state.

How:

1. Open a Markdown resource in the main area.
2. Run `Move active surface to popup`.
3. Confirm the surface appears in the popup utility pane.
4. Run `Focus main surface`, then `Focus popup surface`.
5. Run `Move active surface to main`.
6. Run `Refresh active surface`.
7. Run `Close active surface`.
8. Open multiple resources and run `Close all open editors`.

Expected:

- moving a surface changes placement without duplicating the underlying resource;
- focus commands move keyboard and visual focus to the requested tab strip;
- refresh reopens against current workspace content;
- close commands affect only the active tab strip unless explicitly closing all in that strip;
- no popup content escapes the bounded overlay host.

## Workspace ZIP Import And Export

What to test:

- workspace archive and folder archive flows preserve text, bytes, badges, and paths.

How:

1. Create a folder with at least one Markdown file, one SVG file, and one binary/PDF file.
2. Run `Download selected folder as ZIP`.
3. Run `Download workspace dump ZIP`.
4. Reset browser workspace using the storage utility.
5. Import the workspace dump ZIP.
6. Import the selected-folder ZIP into a new folder.
7. Open restored resources.

Expected:

- ZIP downloads have clear filenames;
- imported resources preserve content, path structure, representation, and previewability;
- imported text resources remain editable;
- imported byte resources remain viewable or downloadable;
- badge identity persists where the archive contains badge metadata;
- import conflicts are handled predictably and do not silently overwrite unrelated content.

## Browser Persistence

What to test:

- browser-managed workspace storage persists content, but shell layout and tabs are not treated as canonical content.

How:

1. Create `/docs/persistence-check.md`.
2. Open several tabs and change panel widths.
3. Reload the browser.
4. Close and reopen the browser tab.
5. Reopen the app in the same browser profile.

Expected:

- `/docs/persistence-check.md` persists;
- selected resource may persist, but open tabs and custom layout should not be considered required workspace content;
- bundled resources are overlaid again after each boot;
- storage status returns to ready after hydration.
