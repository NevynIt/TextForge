# TextForge

TextForge is being rebuilt as a modular local-first React workbench.
The previous implementation is preserved at tag `textforge-v1-final` and branch `archive/v1-current`.
This repository keeps the TextForge name and history while replacing the implementation with a pnpm-workspace package architecture.

## Preserved legacy material

- [Bundled resources index](docs/README.md)
- [Legacy README](docs/archive/legacy/README_v1.md)
- [Legacy notes](docs/archive/legacy/Initial_plan.md)
- [Legacy backlog](docs/archive/legacy/Still_to_do.md)
- [Design papers](docs/architecture)
- [Specs](docs/reference/specs)

## Rebuild status

The rewrite branch has completed Phase 3.2 of the modular rebuild:

- ZIP workspace import/export is implemented.
- The React workbench shell is restored.
- The workspace now persists through browser-managed IndexedDB via Dexie.

Current next step: Phase 3.3 command palette and contribution-driven shell commands.
