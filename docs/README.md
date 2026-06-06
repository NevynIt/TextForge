# TextForge Bundled Resources

This `docs/` tree is the source for the read-only resources bundled into the TextForge app.

## Structure

- [Guides](guides/) contains current user-facing how-to material for the shipped workbench surface, Lua workflows, and plugin development.
- [Manual Tests](manual-tests/) contains human-run release and regression test procedures for the bundled workbench.
- [Examples](examples/) contains bundled sample content that can be opened directly in the app, grouped by format and workflow.
- [Reference Specs](reference/specs/) contains stable format references and rebuild-era boundary notes used by tests, shell checks, and package docs.
- [Architecture](architecture/) contains longer design and architecture papers, including the dependency-map mirror published from the active roadmap.
- [Archive](archive/legacy/) contains preserved v1-era and transition-era material kept for provenance rather than day-to-day guidance.

## Suggested Reading Order

1. [User guide](guides/user-guide.md)
2. [Examples overview](examples/README.md)
3. [Manual test suite](manual-tests/README.md)
4. [Lua guide](guides/lua-guide.md)
5. [Reference specs index](reference/specs/README.md)
6. [Architecture overview](architecture/README.md)
7. [Legacy archive](archive/legacy/README_v1.md)

## Key Bundle Entry Points

- [Minimal Markdown example](examples/markdown-minimal.md)
- [TF-MD Markdown preview fixture](examples/phase-4-markdown-preview.tf.md)
- [Manual user test suite](manual-tests/README.md)
- [ITM examples](examples/itm/)
- [BPMN examples](examples/bpmn/)
- [Resource identity badges note](reference/specs/resource-identity-badges.md)
- [Browser-managed workspace storage note](reference/specs/browser-managed-workspace-storage.md)
- [Dependency map mirror](architecture/dependency-map.md)
