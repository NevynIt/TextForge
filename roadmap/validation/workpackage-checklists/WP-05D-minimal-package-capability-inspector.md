# WP-05D Validation Checklist

## Scope

`WP-05D` validates the minimal package/capability inspector on top of the already validated `WP-05A` bundled registry and `WP-05B` document-scoped resolver. It closes the diagnostics-oriented shell visibility slice without adding plugin installation, remote loading, or editable package configuration.

## Required checks

- `@textforge/core` exposes a deterministic inspector read model over the canonical bundled registry and optional current-document contribution context instead of introducing a second app-local registry projection.
- The shell utility pane exposes a registry overview with bundled package counts, blocked package counts, capability counts, active capability counts, and diagnostic counts.
- The current-document inspector shows activation order, `%require` requirement state, active capability routing, exposed active contributions, active-context short-name conflicts, and current resolver diagnostics.
- Each package card shows package status, dependency state, conflicts, provided capabilities, active capability state for the inspected document, exposed contribution state, and package-linked diagnostics.
- Inspector ordering remains deterministic across packages, capabilities, and contributions; the read model is test-covered in `@textforge/core`.
- Composition remains bundled/static only; the inspector does not add package installation, marketplace flows, remote loading, or editable package configuration.
- The built shell still passes the `file://` artifact checks after the inspector changes.

## Validation evidence

- `corepack pnpm --filter @textforge/core test`
- `corepack pnpm --filter @textforge/core lint`
- `corepack pnpm --filter @textforge/core typecheck`
- `corepack pnpm --filter ./apps/textforge-web test`
- `corepack pnpm --filter ./apps/textforge-web build`
- `corepack pnpm verify`

## Notes

- Preview-server validation confirmed that the built shell serves `./assets/textforge.css` and `./assets/textforge-loader.js` from `http://127.0.0.1:4173/` after the `WP-05D` changes.
- Headless Edge screenshot capture did not emit a usable local image artifact in this environment during this run; that remaining visual-capture gap is recorded in `roadmap/decisions/RAPID.md`.
