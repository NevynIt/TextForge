# TextForge

TextForge is being rebuilt as a modular local-first React workbench.
The previous implementation is preserved at tag `textforge-v1-final` and branch `archive/v1-current`.
This repository keeps the TextForge name and history while replacing the implementation with a pnpm-workspace package architecture.

## Table of contents

### Repository and bundle guides

- [Bundled resources index](docs/README.md)
- [Examples index](docs/examples/README.md)
- [Reference specs index](docs/reference/specs/README.md)
- [Architecture papers index](docs/architecture/README.md)

### Current guides

- [User guide](docs/guides/user-guide.md)
- [Lua guide](docs/guides/lua-guide.md)
- [Lua package notes](docs/guides/lua-package.md)
- [Plugin development guide](docs/guides/plugin-dev.md)

### Key examples and references

- [Minimal Markdown example](docs/examples/markdown-minimal.md)
- [Phase 4 Markdown preview fixture](docs/examples/phase-4-markdown-preview.tf.md)
- [BPMN examples](docs/examples/bpmn/README.md)
- [Resource identity badges](docs/reference/specs/resource-identity-badges.md)
- [Browser-managed workspace storage](docs/reference/specs/browser-managed-workspace-storage.md)
- [Dependency map mirror](docs/architecture/dependency-map.md)

### Preserved legacy material

- [Legacy README](docs/archive/legacy/README_v1.md)
- [Legacy notes](docs/archive/legacy/Initial_plan.md)
- [Legacy backlog](docs/archive/legacy/Still_to_do.md)

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
