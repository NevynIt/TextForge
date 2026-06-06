# WP-ITM-03 - ITM scoped contexts, identity maps, and comments

## Registry

- Workpackage ID: `WP-ITM-03`
- Authoritative state: `roadmap-state.yaml`
- Module: `MOD-ITM`
- ADRs: `ADR-0006`, `ADR-0007`

## Outcome

`@textforge/itm` implements the revised ITM format additions for comments/trivia, identity maps, named contexts, scoped activation, package context exports, context-driven inference, and include module isolation.

`ADR-0007` patches the validated baseline with regulated type inheritance, canonical context defaults/inference rules, package `defaultContext` activation, and `%idmap` identity-only semantics.

## Scope

- Parse and preserve `//` whole-line and trailing comments as trivia.
- Parse `%idmap`, `%context`, `%begin`, and `%end` into first-class document structures.
- Evaluate scoped context stacks for default namespace, root/child type inference, and default relationship type inference.
- Treat explicit authored ids, types, and typed links as authoritative over inferred values.
- Keep included-file active state local to the included module.
- Allow packages to export contexts and identity maps that consumers activate explicitly.
- Surface diagnostics for unresolved, ambiguous, mismatched, or unclosed scoped activations and identity-map conflicts.
- Normalize scalar/list `extends` for entity and relationship types and evaluate polymorphic inheritance.
- Use canonical context `defaults` and ordered `infer.nodes` / `infer.relationships` rules for type inference.
- Reserve `%idmap` for canonical identity mapping instead of type aliases.

## Non-goals

- Browser UI verification by headless browser.
- BPMN-specific or ArchiMate-specific semantic completeness beyond the shared ITM language behavior.
- Visual edit/write-back workflows beyond preserving the model data needed by those future flows.

## Package Impact

- `packages/itm`
- ITM examples and documentation that demonstrate the revised format.

## Interfaces / Contracts Changed

- Public ITM document model gains comments/trivia, identity maps, contexts, and scoped activations.
- Resolved/effective ITM model exposes inferred semantics and canonical identity data.
- ITM diagnostics gain scope/context/identity-oriented cases.

## Validation Criteria

Use `validation/checklists/workpackages/WP-ITM-03-scoped-contexts-identity-comments.md` plus implementation evidence.

## Evidence Required

- Focused package tests for the new format constructs.
- Focused builds/checks for touched packages.
- Updated validation evidence under `validation/evidence/`.
- RAPID event entry for material progress, issues, or decisions.

## Open Decisions

- None. `ADR-0006` owns the base format addition and `ADR-0007` owns the inheritance/context-inference patch.

## Archive Trace

- Introduced by `ADR-0006`; refined by `ADR-0007`.
