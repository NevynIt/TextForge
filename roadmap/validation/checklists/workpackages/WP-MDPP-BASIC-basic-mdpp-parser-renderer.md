# WP-MDPP-BASIC - Basic md++ Parser And Embedded Renderer Checklist

## Scope

Basic md++ parsing, include/resource resolution, embedded fence rendering, and reference spec preservation in the TextForge Markdown preview pipeline.

## Acceptance checks

- md++ v0.14 specs, schemas, implementation notes, and examples are copied under `docs/reference/specs/mdpp/v0.14/`; converter/importer subprojects are excluded.
- `[md:*]:` directives are collected in source order and stripped from visible preview output.
- md++ metadata and requirements are surfaced through existing Markdown render results and capability activation.
- Relative and repository-qualified includes resolve through workspace resources with diagnostics for missing files, escapes, duplicate repositories, and cycles.
- DOT model blocks are absorbed, duplicate names are diagnosed, and `diagram.dot.render source=...` renders registered models.
- Basic themes/stylesheets are loaded through the workspace resolver and rendered as scoped preview CSS.
- md++ preview output exposes `.mdpp-document` and semantic mdpp classes without breaking existing `.tfmd-preview` consumers.
- Existing plain Markdown and TF-MD tests continue to pass.

## Validation evidence

- Focused `@textforge/markdown` tests.
- Focused web workbench integration tests for workspace-backed md++ includes/resources.
- Roadmap view generation check.
