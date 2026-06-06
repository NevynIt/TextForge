# TextForge Manual User Test Suite

This folder contains human-run acceptance tests for the bundled TextForge workbench. Use it after large refactors, before release packaging, and when a change touches the shell, workspace storage, surface routing, Markdown rendering, ITM projections, Lua automation, or bundled resources.

These tests complement automated unit and integration tests. They focus on behavior a user can see: navigation, persistence, rendering, command availability, recovery, and exported artifacts.

## Test Files

- [00 Test Setup And Evidence](00-test-setup-and-evidence.md): environment, launch modes, reset steps, and how to record results.
- [01 Workbench Shell And Workspace](01-workbench-shell-and-workspace.md): startup, panels, workspace tree, commands, persistence, ZIP import/export, and resource badges.
- [02 Markdown And Diagrams](02-markdown-and-diagrams.md): Markdown preview, local links/assets, TF-MD metadata, fenced blocks, Mermaid, Graphviz, and generated diagram exports.
- [03 ITM Visual Surfaces](03-itm-visual-surfaces.md): ITM parser diagnostics, tree, graph, mindmap, catalogue, matrix, report, visual target picker, and renderer routing.
- [04 Lua Automation And Power Sessions](04-lua-automation-and-power-sessions.md): Lua console, scripts, automation discovery, pipeline catalog, power sessions, and recovery.
- [05 BPMN EA Assets And Tables](05-bpmn-ea-assets-and-tables.md): BPMN read-only viewer chain, EA dashboard samples, image/SVG/PDF/binary asset handling, and current tables expectations.
- [06 Recovery Packaging And Regression Pass](06-recovery-packaging-and-regression-pass.md): browser storage recovery, direct file artifact launch, preview-server launch, responsive layout, and release regression pass.
- [test-log-template.md](test-log-template.md): copy this format into issue comments, release notes, or validation evidence.

## Minimum Pass Before A Release

Run these files in order:

1. [00 Test Setup And Evidence](00-test-setup-and-evidence.md)
2. [01 Workbench Shell And Workspace](01-workbench-shell-and-workspace.md)
3. [02 Markdown And Diagrams](02-markdown-and-diagrams.md)
4. [03 ITM Visual Surfaces](03-itm-visual-surfaces.md)
5. [04 Lua Automation And Power Sessions](04-lua-automation-and-power-sessions.md)
6. [05 BPMN EA Assets And Tables](05-bpmn-ea-assets-and-tables.md)
7. [06 Recovery Packaging And Regression Pass](06-recovery-packaging-and-regression-pass.md)

If time is limited, run the smoke tests marked `Release smoke`. If a release smoke test fails, stop and log the failure before continuing to lower-priority coverage.

## Pass And Fail Rules

A test passes when the visible behavior matches the expected result and no unexpected console errors, blank surfaces, data loss, or layout overlaps occur.

A test fails when any of these occur:

- the app cannot boot in the tested launch mode;
- user-created workspace content disappears after reload without an explicit reset;
- bundled docs become editable in place instead of requiring copy into the workspace;
- a surface opens blank where the expected fixture should render;
- a command is enabled for an incompatible resource;
- a command silently does nothing when it should create, open, download, or report a result;
- storage recovery loops or resets without clear user confirmation;
- main panels, popup panels, menus, or tabs overlap at normal desktop or mobile widths.

Record known product limitations separately from regressions. For example, the current BPMN chain is intentionally read-only, and the current tables package is a placeholder unless a later workpackage changes that.

