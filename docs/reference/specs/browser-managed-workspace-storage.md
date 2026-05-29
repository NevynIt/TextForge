# Browser-Managed Workspace Storage

TextForge stores its private workspace in browser-managed IndexedDB through Dexie.

The workspace boundary is explicit:

- Workspace files live inside the browser profile, not in a live local folder.
- Clearing site data or browser storage may remove the stored workspace.
- Import and export remain explicit user actions.
- TextForge does not use File System Access API.
- TextForge does not use directory handles.
- TextForge does not use background sync.
- TextForge does not use remote sync.
- TextForge does not use silent local file access or persistent local file handles.

Phase 3.2 keeps document tabs and shell layout transient. Workspace content persists; open-session state does not.
