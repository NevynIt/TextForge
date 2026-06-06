# 00 Test Setup And Evidence

## Purpose

Prepare a repeatable browser session, choose a launch mode, and record enough evidence for another person to reproduce failures.

## Prerequisites

- Node and pnpm are available through the workspace package manager.
- Dependencies have been installed.
- Run automated checks first when possible:

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

If any automated check fails, record it before manual testing. Manual testing can still continue if the failure is unrelated to the user path under test.

## Launch Modes

### Development Server

Use this for normal manual testing:

```powershell
corepack pnpm --filter @textforge/textforge-web dev --port 4173
```

Open:

```text
http://127.0.0.1:4173/
```

### Preview Server

Use this after a production build:

```powershell
corepack pnpm --filter @textforge/textforge-web build
corepack pnpm --filter @textforge/textforge-web preview --port 4173
```

Open:

```text
http://127.0.0.1:4173/
```

### Direct Local Artifact

Use this to verify the bundled local artifact path:

```powershell
corepack pnpm --filter @textforge/textforge-web build
```

Open `apps/textforge-web/dist/index.html` directly in the browser.

Expected:

- the app boots without requiring a server;
- classic bundled scripts load;
- bundled docs appear under the read-only TextForge resources area;
- source-owned UI, Markdown preview, Lua console, and package-owned surfaces still mount.

## Browser Profiles

Run at least one clean-profile pass and one dirty-profile pass.

Clean-profile pass:

1. Open the app in a browser profile with no existing TextForge IndexedDB/localStorage data.
2. Confirm starter workspace and bundled resources are created.
3. Record the browser, version, OS, launch mode, and URL.

Dirty-profile pass:

1. Use a profile that already contains user-created TextForge workspace content.
2. Reload the app.
3. Confirm user content persists and bundled docs are overlaid again.

## Useful Bootstrap URLs

Use these URLs to jump directly into deterministic fixtures.

```text
/?testProfile=markdown-minimal
/?testProfile=markdown-tfmd
/?testProfile=itm-tree
/?testProfile=itm-graph
/?testProfile=itm-mindmap
/?testProfile=itm-catalogue
/?testProfile=itm-matrix
/?testProfile=itm-report
/?testProfile=itm-markdown-tree
/?testProfile=itm-markdown-graph
/?testProfile=itm-markdown-mindmap
/?testProfile=itm-markdown-report
/?testProfile=ea-dashboard-sample
/?testProfile=ea-dashboard-retail
/?testProfile=ea-dashboard-retail-itm
/?luaConsole=1
```

Expected:

- unknown profile names fall back to normal startup;
- valid profile names open the requested bundled resource and preferred surface;
- `luaConsole=1` opens the Lua console without requiring manual command search.

## Evidence To Capture

For each failed test, capture:

- exact URL and launch mode;
- browser and OS;
- steps performed;
- expected result;
- actual result;
- screenshot or screen recording if layout, rendering, popup, or visual surface behavior is involved;
- downloaded filename if export behavior is involved;
- console errors and stack traces;
- whether the browser profile was clean or dirty.

Use [test-log-template.md](test-log-template.md) for consistent reporting.
