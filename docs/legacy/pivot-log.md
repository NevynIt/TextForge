# TextForge Pivot Log

- Source branch before pivot: `main`
- Archival branch: `archive/v1-current`
- Archival tag: `textforge-v1-final`
- Rewrite branch: `rewrite/v2-monorepo`
- Date: `2026-05-23`
- Maintainer: `agent`

## Preserved material

- Legacy root README and planning notes were moved into `docs/legacy/`.
- Selected whitepapers and implementation guides were moved into `docs/design/`.
- Selected bundled specs were copied into `docs/specs/`.
- Selected bundled examples were copied into `fixtures/legacy/`.

## Removed implementation areas

- Pending removal of the old app implementation, root build files, and other legacy runtime code from the rewrite branch.

## Notes for future recovery

- Recover the previous implementation from `textforge-v1-final` or `archive/v1-current`.
- Keep the rewrite branch focused on the pnpm workspace skeleton and package boundaries.
