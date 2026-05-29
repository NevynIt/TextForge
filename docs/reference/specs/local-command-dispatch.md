# Local Command Dispatch Boundary

Phase 3.3 adds a local command registry, a local command dispatcher, contribution-driven menus and toolbar slots, and a command palette for the TextForge shell.

This boundary is intentionally narrow:

- Command execution stays local to the running shell process.
- Commands are contributed only by packages already bundled into the workspace.
- The shell does not load external packages to satisfy commands.
- The shell does not execute remote commands or remote automation through the palette.
- The shell does not introduce a plugin manager, package marketplace, or command permission model in Phase 3.3.

User-triggered file import remains explicit browser input selection. User-triggered file export remains explicit browser download output. The Phase 3.3 command layer does not add silent local file access, File System Access API usage, background sync, or remote sync.
