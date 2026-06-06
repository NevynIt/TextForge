# ADR-0002 UI Attachment

## Selected Package

- `@textforge/ui`

## Scope

- Refactored only `packages/ui/**`.
- Added this report at `roadmap/decisions/ADR-0002-attachments/ui.md`.
- No package manifest changes.
- No new public package subpaths; `package.json` still exports only `"."`.
- No commits created.

## Files Created

- `packages/ui/src/app-frame.js`
- `packages/ui/src/app-frame.ts`
- `packages/ui/src/chrome.js`
- `packages/ui/src/chrome.ts`
- `packages/ui/src/command-palette.js`
- `packages/ui/src/command-palette.ts`
- `packages/ui/src/contributions.js`
- `packages/ui/src/contributions.ts`
- `packages/ui/src/icons.js`
- `packages/ui/src/icons.ts`
- `packages/ui/src/models.js`
- `packages/ui/src/models.ts`
- `packages/ui/src/primitive-components.js`
- `packages/ui/src/primitive-components.ts`
- `packages/ui/src/shared.js`
- `packages/ui/src/theme.js`
- `packages/ui/src/theme.ts`

## Files Modified

- `packages/ui/src/index.js`
- `packages/ui/src/index.ts`

## Files Removed

- None.

## Module Split

- `theme`: workbench theme factory and default theme.
- `models`: frame, surface, workspace tree, status badge, toolbar slot, and chrome model factories.
- `icons`: lucide-backed internal icon registry, workspace item icon resolution, and `defaultIcons`.
- `primitive-components`: low-level shell primitives such as buttons, callouts, badges, cards, empty state, and status rail.
- `chrome`: top bar, workspace sidebar/tree, tabs, context menu, select field, utility pane, and popup host.
- `command-palette`: palette filtering and dialog component.
- `app-frame`: resizable app shell frame.
- `contributions`: package contribution metadata.
- `shared`: internal React element and DOM/component helper utilities.

## Before Public Runtime Exports

- `TextForgeAppFrame`
- `TextForgeCallout`
- `TextForgeCommandPalette`
- `TextForgeContextMenu`
- `TextForgeEmptyState`
- `TextForgeInspectorCard`
- `TextForgePopupHost`
- `TextForgeResourceBadge`
- `TextForgeSelectField`
- `TextForgeSessionTabStrip`
- `TextForgeStatusRail`
- `TextForgeToolbarButton`
- `TextForgeTopBar`
- `TextForgeUtilityPane`
- `TextForgeWorkspaceSidebar`
- `contributions`
- `createAppFrameModel`
- `createStatusBadge`
- `createSurfaceFrameModel`
- `createToolbarSlot`
- `createWorkbenchChromeModel`
- `createWorkbenchTheme`
- `createWorkspaceTreeFrameModel`
- `defaultAppFrameModel`
- `defaultIcons`
- `defaultTheme`

## After Public Runtime Exports

- Same as before. Verified with dynamic import of `packages/ui/src/index.js`.

## Public Type Exports Preserved

- `AppFrameModel`
- `BadgeTone`
- `ChromeDensity`
- `ChromeSlot`
- `CommandMenuGroup`
- `CommandMenuItem`
- `CommandPaletteEntry`
- `ContextMenuAnchor`
- `FrameRegion`
- `FrameRegionKind`
- `IconName`
- `IconSpec`
- `ResourceAttention`
- `SelectFieldControl`
- `SelectFieldOption`
- `ShellPanelLayoutConfig`
- `StatusBadge`
- `SurfaceFrame`
- `SurfaceTab`
- `SurfaceTabLayout`
- `TextForgeAppFramePanelLayout`
- `TextForgeAppFrameProps`
- `TextForgeCalloutProps`
- `TextForgeCommandPaletteProps`
- `TextForgeContextMenuProps`
- `TextForgeEmptyStateProps`
- `TextForgeInspectorCardProps`
- `TextForgePopupHostProps`
- `TextForgeResourceBadgeProps`
- `TextForgeSelectFieldProps`
- `TextForgeSessionTabStripProps`
- `TextForgeStatusRailProps`
- `TextForgeToolbarButtonProps`
- `TextForgeTopBarProps`
- `TextForgeUtilityPaneProps`
- `TextForgeWorkspaceSidebarProps`
- `ThemeMode`
- `ThemeTokens`
- `ToolbarSlot`
- `TypographyTokens`
- `UtilityPaneSection`
- `WorkbenchChromeModel`
- `WorkbenchTheme`
- `WorkspaceTreeFrame`
- `WorkspaceTreeItem`
- `WorkspaceTreeItemKind`

## Import Compatibility

- Existing root imports remain compatible through explicit facades in `packages/ui/src/index.js` and `packages/ui/src/index.ts`.
- Root import scan found package-level `@textforge/ui` usage in `apps/textforge-web`, `packages/assets`, `packages/editors`, `packages/surfaces`, and `packages/ui`.
- Deep-import scan for `@textforge/ui/` across existing `apps` and `packages` returned no matches.
- `tests` and `examples` directories were not present in this workspace.

## Commands Run

- `Get-Content -Path packages/ui/src/index.js`
- `Get-Content -Path packages/ui/src/index.ts`
- `rg "@textforge/ui" apps packages tests examples`
- `rg "@textforge/ui/" apps packages`
- `node --check packages/ui/src/index.js`
- `node --check packages/ui/src/chrome.js`
- `node --check packages/ui/src/app-frame.js`
- `node --check packages/ui/src/command-palette.js`
- `Get-ChildItem packages/ui/src -Filter *.js | ForEach-Object { node --check $_.FullName }`
- `node -e "import('./packages/ui/src/index.js').then((m)=>console.log(Object.keys(m).sort().join('\n')))"`
- `npm run lint --workspace @textforge/ui`
- `npm run typecheck --workspace @textforge/ui`
- `npm run test --workspace @textforge/ui`
- `npm run build --workspace @textforge/ui`
- `corepack pnpm --filter @textforge/ui lint`
- `corepack pnpm --filter @textforge/ui typecheck`
- `corepack pnpm --filter @textforge/ui test`
- `corepack pnpm --filter @textforge/ui build`
- `rg "@textforge/ui/src/|@textforge/ui/dist/" apps packages --glob '!**/node_modules/**'`
- `rg "from '@textforge/ui'|from \"@textforge/ui\"" apps packages --glob '!**/node_modules/**'`
- `git status --short -- packages/ui roadmap/decisions/ADR-0002-attachments/ui.md`
- `git diff --name-status -- packages/ui roadmap/decisions/ADR-0002-attachments/ui.md`

## Results

- JavaScript syntax check for every `packages/ui/src/*.js` file passed.
- Runtime dynamic import of the root facade passed and returned the preserved export names.
- `npm run lint --workspace @textforge/ui`: passed.
- `npm run typecheck --workspace @textforge/ui`: passed.
- `npm run test --workspace @textforge/ui`: passed, 2 tests passed.
- `npm run build --workspace @textforge/ui`: passed.
- `corepack pnpm --filter @textforge/ui lint`: passed.
- `corepack pnpm --filter @textforge/ui typecheck`: passed.
- `corepack pnpm --filter @textforge/ui test`: passed, 2 tests passed.
- `corepack pnpm --filter @textforge/ui build`: passed.
- Deep-import grep: no `@textforge/ui/` imports found.

## Risks

- The package typecheck script is `node --check src/index.js`, so it validates JavaScript syntax but not TypeScript declaration graph semantics.
- Internal modules are not public API, but their filenames now exist under `src`; package export-map restrictions should continue preventing package-level deep imports.
