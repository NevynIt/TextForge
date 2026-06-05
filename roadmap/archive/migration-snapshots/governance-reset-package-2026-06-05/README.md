> [!IMPORTANT]
> Archived governance reset input package. This package is non-authoritative after installation; active roadmap truth lives in oadmap/roadmap-state.yaml, oadmap/decisions/, templates, and generated views.

# Roadmap Governance Reset Package

This package defines the agreed target structure for cleaning the TextForge roadmap.

It is intended to be given to an implementation agent or multi-agent harness together with the current `roadmap/` folder.

## Main decision

Use one ADR as the governance reset decision:

- `decisions/ADR-0001-roadmap-governance-reset.md`

Detailed conventions and templates are stored as attachments under:

- `decisions/ADR-0001-attachments/`

## Implementation prompt

Use this prompt to drive the implementation:

- `prompts/multi-agent-roadmap-cutover-prompt.md`

## Key rules

- Active roadmap vocabulary uses modules, workpackages, releases, ADRs, RAPID, generated views, validation evidence, and archive.
- Phase terminology is historical only.
- `roadmap-state.yaml` is authoritative for IDs, status, dependencies, modules, workpackages, releases, and ADR registry data.
- Markdown files explain the registry.
- ADRs record durable decisions.
- RAPID records append-only events.
- Archive preserves history and is non-authoritative.

## Known current-roadmap facts

From the supplied roadmap bundle:

- Historical RAPID is currently at `roadmap/decisions/RAPID.md`.
- Last detected RAPID counters are:
  - `D-080`
  - `A-033`
  - `P-101`
  - `I-009`
  - `R-001`
- The new active RAPID should continue from those counters:
  - `D-081`
  - `A-034`
  - `P-102`
  - `I-010`
  - `R-002` if needed.
