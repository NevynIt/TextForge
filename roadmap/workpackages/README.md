# Workpackages

This folder is the canonical V18 planning layer from WP5 onward.

## Files

| File | Purpose |
|---|---|
| `workpackage-register.md` | Canonical WP list, dependencies, optionality, status baseline. |
| `implementation-status.md` | Mutable current state tracker. |
| `dependency-map.md` | Mermaid dependency map. |
| `templates/workpackage-template.md` | Template for new workpackage detail pages. |
| `00-foundation-archive.md` | Preserved phase-shaped foundation up to Phase 4.1. |
| `01-core-platform.md` | Core platform and contribution/capability backbone. |
| `02-workspace-resources-repositories.md` | Resource providers, revisions, changesets, repositories. |
| `03-contributions-capabilities-pipelines.md` | Capability activation, contribution execution, pipelines. |
| `04-markdown-itm-document-models.md` | Markdown, ITM, report generation, domain document models. |
| `05-surfaces-ui-workbench.md` | Workbench, surfaces, UI capacity, user settings UI. |
| `06-backend-optional-enterprise.md` | Backend profile, persistence, identity/policy, private/group spaces. |
| `07-domain-profiles.md` | BPMN, ArchiMate, tables/catalogues, Lua, diagrams. |
| `08-distribution-security-accreditation.md` | Security invariants, distributions, release evidence. |
| `09-optional-adapters.md` | Entra, OIDC/SAML, GitLab, AI, SharePoint-like adapters. |
| `10-later-investigations.md` | True live collaboration, advanced editing, future wrappers. |

## Dependency map styling guidance

When updating `dependency-map.md`, keep status coloring aligned with `implementation-status.md`:

- color completed baseline work green;
- color currently startable workpackages blue;
- color the direct edge from completed work to each currently startable workpackage blue;
- keep all other nodes/edges in the default Mermaid style.
