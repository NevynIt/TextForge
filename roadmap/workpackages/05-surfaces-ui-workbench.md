# 05 — Surfaces, UI, and Workbench

This cluster covers editor/surface capacity, workbench usability, command projection, and settings UI.

## Workpackages

| WP | Title | Role |
|---|---|---|
| WP-SET-01 | User settings core and local persistence | Frontend-safe personalization. |
| WP-SET-UI | User settings UI | Manage command/menu/layout complexity. |
| WP-SURFACES-ADV | Advanced tabbed main surfaces | Stage 2 surface capacity. |
| WP-ITM-VISUALS | ITM static visual projections/publication baseline | Validated projection/publication baseline, not runtime parity. |
| WP-ITM-VTARGET-01 | ITM visual target picker MVP | View/viewpoint/raw-model visual target selection. |
| WP-GRAPH-EDIT-VITM | Visual ITM edit/write-back foundation | Later review/apply patch model before direct write-back. |
| WP-SKETCH | Sketch and annotation resources | Optional annotation resources. |
| WP-PDF-ANNOTATE | PDF annotation | Optional, separate from PDF export. |

## Settings rule

Settings personalize UI/defaults only. They never grant permissions, repository access, AI rights, publication approval, group membership, write rights, or backend service access.

## UI validation

Phase 3.5 validation material is preserved under `validation/ui/` and remains relevant when later surface/UI work changes chrome density, popups, panels, or scroll behavior.


## V19 visual target picker update

V19 adds `WP-ITM-VTARGET-01` to this cluster.

Rules:

- Plain `.itm` open goes to CodeMirror.
- `Open visuals...` opens a visual target picker.
- The picker lists declared `%view` entries, declared `%viewpoint` entries, and raw model fallback options.
- The picker supports multi-select.
- Multi-select opens multiple independent surfaces.
- The picker is not a dashboard builder; dashboards remain Markdown `itm-pub` responsibility.
- Missing declared renderer reports an error/diagnostic; no silent fallback.

This work should reduce context-menu pollution rather than adding all views/viewpoints/renderers as peer context-menu commands.
