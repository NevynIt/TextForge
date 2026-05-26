# 07 — Domain Profiles

This cluster covers domain-specific profiles and domain-driven views.

## Workpackages

| WP | Title | Split rationale |
|---|---|---|
| WP-BPMN-SEM | BPMN semantic profile and validation | Useful validation/model value before mature visual editing. |
| WP-BPMN-VISUAL | BPMN viewer/editor surface | Visual value after semantics/projections exist. |
| WP-ARCHIMATE-SEM | ArchiMate semantic profile | Semantic profile before visual editing investigation. |
| WP-ARCHIMATE-VISUAL | ArchiMate visual editing investigation | Optional investigation, not guaranteed product feature. |
| WP-TABLES | Tables, catalogues, and matrices | Catalogue/matrix UX over model content. |
| WP-LUA | Lua automation | Optional pipeline automation; sandboxed/local/capability-gated. |
| WP-ITM-VISUALS | ITM visual projections | Shared visual projection base for mindmaps/graphs/domain views. |

## General rule

Split domain work into:

```text
semantic model/profile -> validation/catalogue/report value -> visual editing/write-back
```

Do not make mature visual editing a prerequisite for useful semantic validation or reporting.
