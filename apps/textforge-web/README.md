# @textforge/textforge-web

React workbench shell recovery for the TextForge rebuild.

The shell is packaged with Vite so package dependencies such as React, React DOM, and CodeMirror are bundled instead of resolved through browser import-map shims.

The source entry is a dedicated `src/scriptLoader.js` bootstrap. Development still runs through Vite, but the built local artifact is emitted as a classic script bundle plus a source-owned `public/index.html` so direct `file://` launch does not depend on `<script type="module">`.

Phase 3.1 replaced the earlier imperative shell bootstrap with a React-rendered workbench frame while keeping editor and asset behaviour inside their package-owned surface factories. Phase 3.2 keeps that shell but hydrates it from a browser-managed Dexie workspace, adds explicit storage reset/recovery flow, and preserves the deliberate non-goals of no tab restore and no saved shell layout.

Phase 3.4 turns that shell into the readable authoring workbench promised by the roadmap: deterministic placement-based resource badges, calmer contribution-driven command chrome, viewport-safe top-bar menus, explicit local scroll regions for the editor/sidebar/inspector surfaces, and a utility drawer that no longer disturbs the main layout. React icon usage stays centralized in `@textforge/ui` through `lucide-react`.

Phase 3.5 finishes the next shell-usability pass: popup sessions render inside a bounded overlay host, the left workspace rail and right inspector/utility rail resize and collapse through `@textforge/ui`, the inspector stays in the resizable right panel, and repeated active-resource titles are trimmed so the shell does not waste central space. The app also exposes deterministic `?phase35=` validation presets and keeps browser-measured layout evidence under `roadmap/validation/`.

## Commands

- `pnpm --filter @textforge/textforge-web build`
- `pnpm --filter @textforge/textforge-web dev --port 4173`
- `pnpm --filter @textforge/textforge-web preview --port 4173`
- `pnpm --filter @textforge/textforge-web test`

## Verification

- Build the package and open `dist/index.html` directly when checking the local artifact path.
- Run the Vite preview server for the browser-served path.
- Run `pnpm --filter @textforge/textforge-web test` to catch shell entrypoint regressions and storage-boundary regressions.
