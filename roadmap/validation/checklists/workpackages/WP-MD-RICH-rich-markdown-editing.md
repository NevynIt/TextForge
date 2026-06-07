# WP-MD-RICH - Rich Markdown Editing Checklist

## Scope

Rich Markdown editing and export behavior layered on the package-owned Markdown preview flow.

## Acceptance checks

- Markdown print HTML export renders active Mermaid and Graphviz fenced blocks as diagram markup instead of leaving raw fences.
- Generated diagram export creates stable SVG and PNG workspace assets without filename sanitization runtime errors.
- Export commands use the same document capability context and fence execution services as Markdown preview.
- Exported print HTML remains self-contained enough for browser print/open workflows.
- Build and focused Markdown/web tests pass for touched packages.

## Validation evidence

- Focused Markdown package tests.
- Focused web tests for Markdown export command integration.
- Manual UI confirmation for print HTML and generated diagram export.
