# 04 — Markdown, ITM, and Document Models

This cluster covers TextForge Markdown, ITM, report generation, packages, repositories, validation, and document-model semantics.

## Workpackages

| WP | Title | Depends on | Notes |
|---|---|---|---|
| WP-ITM-01 | ITM parser/model foundation | WP-05A recommended | Parser/model foundation. |
| WP-ITM-02 | ITM directives, packages, validation, diagnostics | WP-ITM-01, WP-05B | `%require`, packages, selectors, validation. |
| WP-REPO-01 | Repository reference and include resolver | WP-RES-01, WP-ITM-01 | Provider-resolved `%repository`/`%include`. |
| WP-MD-REPORT | Markdown + ITM report generation | Markdown base, WP-ITM-01, WP-REPO-01 | Keeps the old Phase 9 report role separate from backend work. |
| WP-MD-RICH | Rich Markdown editing | Markdown/report baseline | Optional and round-trip gated. |
| WP-PDF-EXPORT | PDF generation/export | WP-MD-REPORT | Optional late export capability. |

## Canonical specs

- `specs/architecture/textforge-markdown-profile.md`
- `specs/architecture/backend-optional-architecture.md`
- `package-guides/markdown.md`
- `package-guides/itm.md`

## Key constraints

- The canonical source remains text.
- Rich editors are optional and must be round-trip gated.
- Includes and repositories are resolved by active providers; frontend does not fetch arbitrary URLs in local/offline mode.
- Document semantics do not change when optional backend capabilities are unavailable.
