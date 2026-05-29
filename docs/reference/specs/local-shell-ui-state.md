# Local Shell UI State Boundary

Phase 3.5 keeps popup overlays, side-panel collapse state, and side-panel sizing inside ordinary local UI state.

The delivered shell:

- renders popup-capable surfaces as in-app overlays inside the existing workbench window;
- keeps workspace-tree and right-panel resizing inside local component state and browser-managed layout state only;
- does not open detached browser windows for popup surfaces;
- does not load remote popup content or remote layout state;
- does not use File System Access API, directory handles, background sync, or remote sync to restore popup or layout state.

This boundary is intentionally narrow. Popup overlays and panel layout improve usability, but they do not change the browser-envelope claim or turn shell state into a new persistence or permission surface.
