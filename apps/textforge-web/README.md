# @textforge/textforge-web

React workbench shell recovery for the TextForge rebuild.

The shell is packaged with Vite so package dependencies such as React, React DOM, and CodeMirror are bundled instead of resolved through browser import-map shims.

The source entry is a dedicated `src/scriptLoader.js` bootstrap. Development still runs through Vite, but the built local artifact is emitted as a classic script bundle plus a source-owned `public/index.html` so direct `file://` launch does not depend on `<script type="module">`.

Phase 3.1 replaces the earlier imperative shell bootstrap with a React-rendered workbench frame while keeping editor and asset behaviour inside their package-owned surface factories. The current shell exposes the collapsible workspace tree, a narrow main-session tab strip, a utility pane for popup sessions and contribution visibility, and package-backed open-with/language controls.

## Commands

- `pnpm --filter @textforge/textforge-web build`
- `pnpm --filter @textforge/textforge-web dev --port 4173`
- `pnpm --filter @textforge/textforge-web preview --port 4173`
- `pnpm --filter @textforge/textforge-web test`

## Verification

- Build the package and open `dist/index.html` directly when checking the local artifact path.
- Run the Vite preview server for the browser-served path.
- Run `pnpm --filter @textforge/textforge-web test` to catch shell entrypoint regressions.
