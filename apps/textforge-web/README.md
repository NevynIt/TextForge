# @textforge/textforge-web

React workbench shell recovery for the TextForge rebuild.

The shell is packaged with Vite so package dependencies such as React, React DOM, and CodeMirror are bundled instead of resolved through browser import-map shims.

The source entry is a dedicated `src/scriptLoader.js` bootstrap. Development still runs through Vite, and the normal build emits the classic loader bundle, stylesheet, optional bundled-docs payload under `dist/`, both standalone single-file distributions, and a versioned release zip. The app boots when `assets/textforge-bundled-docs.js` is omitted, but the read-only bundled documentation tree is empty in that mode. `build:single` emits a full one-file artifact with docs inlined, while `build:single:small` emits a smaller one-file artifact without bundled docs.

The React-rendered workbench frame keeps editor and asset behaviour inside package-owned surface factories. It hydrates from a browser-managed Dexie workspace, adds explicit storage reset/recovery flow, and restores local UI sessions without treating shell state as canonical workspace content.

The shell provides deterministic placement-based resource badges, calmer contribution-driven command chrome, viewport-safe top-bar menus, explicit local scroll regions for the editor/sidebar/inspector surfaces, and a utility drawer that no longer disturbs the main layout. React icon usage stays centralized in `@textforge/ui` through `lucide-react`.

Popup sessions render inside a bounded overlay host, the left workspace rail and right inspector/utility rail resize and collapse through `@textforge/ui`, the inspector stays in the resizable right panel, and repeated active-resource titles are trimmed so the shell does not waste central space. Current deterministic validation entry points use explicit `?testProfile=...` fixtures.

## Commands

- `pnpm --filter @textforge/textforge-web build`
- `pnpm --filter @textforge/textforge-web build:dist`
- `pnpm --filter @textforge/textforge-web build:single`
- `pnpm --filter @textforge/textforge-web build:single:small`
- `pnpm --filter @textforge/textforge-web build:zip`
- `pnpm --filter @textforge/textforge-web dev --port 4173`
- `pnpm --filter @textforge/textforge-web preview --port 4173`
- `pnpm --filter @textforge/textforge-web test`

## Verification

- Build the package to regenerate `dist/index.html`, `dist-single/index.html`, `dist-single-small/index.html`, and the versioned release zip together.
- Run `build:dist`, `build:single`, `build:single:small`, or `build:zip` only when rebuilding one artifact family deliberately.
- Run the Vite preview server for the browser-served path.
- Run `pnpm --filter @textforge/textforge-web test` to catch shell entrypoint regressions and storage-boundary regressions.
