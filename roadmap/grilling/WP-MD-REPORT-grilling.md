# WP-MD-REPORT Grilling — Markdown + ITM report generation

Status: Round 1 drafted  
Date: 2026-06-07 Europe/Brussels  
Branch: `main`  
Workpackage: `WP-MD-REPORT`  
Module: `MOD-MARKDOWN-ITM`

## Latest status

`WP-MD-REPORT` is the next value-oriented implementation target.

Current roadmap facts:

- `WP-MD-REPORT` is `defined`.
- Its direct dependencies are `WP-ITM-01` and `WP-REPO-01`.
- Both dependencies are already validated in the active roadmap registry.
- It enables `WP-ITM-PUB-VISUAL-01`, `WP-MD-RICH`, `WP-PDF-EXPORT`, and `WP-AI-MD-ASSIST`.
- It belongs to `MOD-MARKDOWN-ITM`, which owns the TF-MD profile, Markdown preview/report flows, ITM publication blocks, parameterized ITM Markdown reports, and PDF export flow.

## Current conclusion

`WP-MD-REPORT` is implementable now, but the implementation must not become a second Markdown engine, a PDF exporter, a backend reporting service, or a custom hand-built document framework.

The workpackage should stabilize a reusable report contract around the existing Markdown rendering path, existing `markdown-it` library stack, existing fence contribution model, existing ITM/repository resolution path, and existing print-optimized HTML output.

The main ambiguity to remove is the meaning of “report generation”. For this workpackage, it should mean:

> deterministic local generation of a complete, printable, asset-aware HTML report from TextForge Markdown and ITM publication content, including diagnostics and generated-resource metadata.

PDF export remains follow-on scope in `WP-PDF-EXPORT`.

## User preference applied

Prefer stable libraries and established examples over handcrafted simplification.

Concrete application:

- keep `markdown-it` as the Markdown rendering engine because it is already in `@textforge/markdown` and supports plugins;
- use existing `markdown-it-anchor`, `markdown-it-footnote`, and `markdown-it-katex` integrations rather than replacing them;
- use the current contribution/fence/pipeline system rather than adding bespoke report-specific dispatch;
- treat `unified` / `remark` / `rehype` as design inspiration for processor shape, diagnostics, AST/report metadata, and future migration options, not as a new dependency in this workpackage;
- consider `DOMPurify` only if the implementation needs a stronger HTML sanitation boundary for preview/report DOM insertion, but do not make sanitization a custom regex/string-rewrite layer.

## Grilling log

### Topic 1 — Report generation boundary

**Question tested:**  
Should `WP-MD-REPORT` define report generation as local printable HTML generation, not PDF export, backend rendering, or external publication?

**Why it matters:**  
The word “report” can easily expand into PDF rendering, server-side jobs, templates, exports, dashboards, or AI-generated documents.

**Recommended answer:**  
Yes. `WP-MD-REPORT` should deliver local, deterministic, printable HTML report generation.

**Decision to apply unless revised:**

- In scope: report model, printable HTML document, asset resolution metadata, generated resources, diagnostics, and test fixtures.
- Out of scope: PDF rendering, backend jobs, external fetch, remote assets, visual editing, AI assistance, and report scheduling.
- The generated report should be useful by itself in the browser and as the later input to `WP-PDF-EXPORT`.

**Implementation implication:**  
Do not add PDF dependencies here. Keep `printHtml` as the stable export surface for later PDF work.

---

### Topic 2 — Markdown engine strategy

**Question tested:**  
Should the workpackage keep using `markdown-it`, rather than introducing a new Markdown processor or handcrafted parser?

**Why it matters:**  
`@textforge/markdown` already depends on `markdown-it` and related plugins. Adding a second Markdown stack would create parallel semantics and duplicate extension points.

**Recommended answer:**  
Yes. Keep `markdown-it` as the active Markdown engine for this workpackage.

**Decision to apply unless revised:**

- `markdown-it` remains the renderer.
- Existing plugins remain the first-class extension path.
- Do not migrate to `unified` / `remark` / `rehype` in this workpackage.
- Use `unified` only as architecture inspiration for processor stages, file metadata, messages, and plugin discipline.

**Implementation implication:**  
The output contract should wrap the existing render result instead of replacing `renderMarkdownDocument`.

---

### Topic 3 — Report contract

**Question tested:**  
Should `WP-MD-REPORT` introduce a named report-generation contract instead of leaving report generation as an incidental preview side effect?

**Why it matters:**  
The current renderer already returns useful fields, but follow-on workpackages need a stable report surface they can target without knowing preview internals.

**Recommended answer:**  
Yes. Define a stable report-oriented contract.

**Decision to apply unless revised:**

A report result should expose at least:

```ts
interface MarkdownReportResult {
  html: string;
  bodyHtml: string;
  printHtml: string;
  resolvedSource: string;
  metadata: Record<string, unknown>;
  styles: Record<string, unknown>;
  styleSheet: string;
  diagnostics: TextForgeDiagnostic[];
  referencedAssets: ResourceReference[];
  generatedResources: GeneratedResource[];
  capabilityContext?: DocumentCapabilityContext;
}
```

The actual implementation can reuse the existing render result shape if names are already compatible.

**Implementation implication:**  
Prefer adding `createMarkdownReport(...)` or `generateMarkdownReport(...)` as a semantic wrapper over `renderMarkdownDocument(...)`, rather than duplicating rendering logic.

---

### Topic 4 — Preview vs report separation

**Question tested:**  
Should preview and report share the same renderer but have separate intent-level entry points?

**Why it matters:**  
Preview is interactive and mounted in a surface. Report generation is a deterministic artifact-producing operation. They overlap but are not identical.

**Recommended answer:**  
Yes. Share internals, separate intent.

**Decision to apply unless revised:**

- `renderMarkdownDocument` may remain the low-level engine.
- `createMarkdownPreviewSurface` remains a UI surface concern.
- `generateMarkdownReport` or equivalent should be the stable artifact/report entry point.
- The report function should not mount DOM, intercept links, or assume a surface session.

**Implementation implication:**  
Tests should prove a report can be generated without creating a preview surface.

---

### Topic 5 — Fenced block execution

**Question tested:**  
Should reports resolve fenced blocks through the existing contribution/capability/pipeline system?

**Why it matters:**  
A report-specific fenced-block dispatcher would undo the contribution architecture and create a second path for ITM, diagrams, JSON, BPMN, and later AI-assisted blocks.

**Recommended answer:**  
Yes. Reports must use the existing contribution context and fence handler contributions.

**Decision to apply unless revised:**

- `tf-md`, `itm`, `itm-pub`, Mermaid, Graphviz/DOT, JSON, SVG, BPMN publication, and later blocks should resolve through active capabilities.
- `%require` should activate/check capabilities through the existing document capability context.
- Missing handlers should produce diagnostics, not silent fallback.
- Static code/data blocks may still render as escaped `<pre><code>` when no active special handler is required.

**Implementation implication:**  
Do not special-case report fences outside the current `resolveKnownFencedBlocks` / pipeline path except for thin report metadata collection.

---

### Topic 6 — ITM and repository integration

**Question tested:**  
Should `WP-MD-REPORT` consume existing ITM parser/resolver/repository behavior instead of extending ITM semantics?

**Why it matters:**  
The report package must not become the owner of ITM parsing, includes, repositories, views, or visual target resolution.

**Recommended answer:**  
Yes. Consume existing ITM/repository contracts only.

**Decision to apply unless revised:**

- `WP-MD-REPORT` may depend on validated `WP-ITM-01` and `WP-REPO-01` behavior.
- It may render output from `itm` and `itm-pub` blocks.
- It must not redefine `%include`, `%repository`, `%view`, `%viewpoint`, package activation, selector semantics, or ITM diagnostics.
- Repository-backed issues should surface as report diagnostics.

**Implementation implication:**  
Any missing ITM capability is a dependency bug or follow-on workpackage, not hidden report scope.

---

### Topic 7 — Asset handling

**Question tested:**  
Should report generation make local asset references and generated resources explicit first-class outputs?

**Why it matters:**  
A printable report is not just HTML. It may reference images, generated SVGs, rendered diagrams, and assets resolved relative to the source document.

**Recommended answer:**  
Yes. Asset references and generated resources should be part of the report result and tests.

**Decision to apply unless revised:**

- Input asset references should be resolved through the host/resource resolver.
- Generated diagrams should be emitted as generated-resource metadata.
- Reports should not fetch remote assets automatically.
- Broken assets should be diagnostics, not console-only warnings.

**Implementation implication:**  
Add fixture tests for relative images, generated SVG blocks, and unresolved assets.

---

### Topic 8 — HTML safety and CSP posture

**Question tested:**  
Should report generation preserve TextForge’s local/no-network posture and avoid arbitrary unsafe report behavior?

**Why it matters:**  
Markdown output is inserted into the DOM and can include generated SVG/HTML. The current local profile reduces exfiltration risk, but report generation should not weaken it.

**Recommended answer:**  
Yes. Treat report HTML as local-only content under the existing TextForge security posture.

**Decision to apply unless revised:**

- No CDN assets.
- No automatic remote fetch.
- No script execution in generated report HTML.
- Report output should remain compatible with strict CSP.
- If sanitization is needed, use a maintained sanitizer such as DOMPurify rather than custom filtering.
- Do not use regex-only HTML sanitization as a security boundary.

**Implementation implication:**  
Add tests or manual evidence that generated reports contain no `<script>` and no unexpected remote references for built-in blocks.

---

### Topic 9 — Styling and print defaults

**Question tested:**  
Should reports use a stable built-in print stylesheet with optional TF-MD style overlays?

**Why it matters:**  
Reports must look acceptable without requiring users to hand-style every document, while still respecting TextForge Markdown style blocks.

**Recommended answer:**  
Yes.

**Decision to apply unless revised:**

- Keep a conservative built-in print stylesheet.
- Apply TF-MD style rules inside the report document.
- Do not introduce a full theme system in this workpackage.
- Do not couple report styles to a specific preview surface chrome.

**Implementation implication:**  
Add golden checks for title, headings, tables, code blocks, images/SVG sizing, and injected TF-MD styles.

---

### Topic 10 — Tables and matrices

**Question tested:**  
Should `WP-MD-REPORT` implement full table editing or matrix generation?

**Why it matters:**  
`WP-TABLES` is a separate high-value workpackage and should not be absorbed here.

**Recommended answer:**  
No. Reports should render Markdown/GFM tables already supported by the Markdown engine, but should not implement table editing, catalog generation, or matrix UX.

**Decision to apply unless revised:**

- Rendering existing Markdown tables is in scope.
- Table editing, catalogue surfaces, diagnostics tables, and model-derived matrix UX stay in `WP-TABLES`.
- A report may later embed table outputs produced by `WP-TABLES`, but does not own that logic.

**Implementation implication:**  
Keep table tests focused on rendering and print layout, not grid behavior.

---

### Topic 11 — Diagnostics model

**Question tested:**  
Should report generation return diagnostics as structured outputs and show them in evidence/tests?

**Why it matters:**  
Reports are only trustworthy if unresolved assets, missing fence handlers, unsupported repositories, ITM validation issues, and rendering failures are visible.

**Recommended answer:**  
Yes.

**Decision to apply unless revised:**

- Diagnostics stay structured.
- Report generation should not hide diagnostics after producing HTML.
- Diagnostics should preserve subsystem origin where available.
- Tests should cover at least one warning and one error path.

**Implementation implication:**  
Use existing diagnostic shape where possible. Do not invent report-only diagnostic types unless needed.

---

### Topic 12 — Validation evidence before implementation

**Question tested:**  
Should this workpackage get an explicit validation checklist before its status moves beyond `defined`?

**Why it matters:**  
The current workpackage page says validation evidence must be defined before implementation starts, but the registry currently has no linked checklist.

**Recommended answer:**  
Yes.

**Decision to apply unless revised:**

Create a validation checklist covering:

- report function/API exists and is exported;
- report generation works without mounting preview UI;
- `printHtml` is complete HTML with title, stylesheet, and body;
- TF-MD metadata/styles are honored;
- relative images resolve or produce diagnostics;
- generated diagram/SVG resources are captured;
- `itm` and `itm-pub` fixtures render through active capabilities;
- repository/include diagnostics flow into report diagnostics;
- no backend or remote fetch dependency is introduced;
- tests are added under the touched packages;
- RAPID/evidence entries are added when status changes.

**Implementation implication:**  
Before changing status to `in-progress`, add `roadmap/validation/checklists/workpackages/WP-MD-REPORT-markdown-itm-report-generation.md` and link it from `roadmap-state.yaml`.

---

## Recommended implementation slice

A minimal good implementation should include:

1. A report-level API exported from `@textforge/markdown`, probably as a wrapper over `renderMarkdownDocument`.
2. A clear `MarkdownReportResult` or equivalent documented contract.
3. Tests proving report generation without preview mounting.
4. Tests for metadata, style, anchors, footnotes, KaTeX, tables, image assets, generated resources, `itm`, `itm-pub`, and diagnostics.
5. A small fixture Markdown report under examples or tests.
6. Validation checklist and evidence entry before status change.

## Explicit non-goals

- No PDF generation.
- No backend service.
- No remote rendering.
- No CDN use.
- No new Markdown parser.
- No custom Markdown syntax engine.
- No table editor.
- No AI writing or summarization.
- No visual editing/write-back.
- No new ITM semantics.
- No second fenced-block dispatcher.

## Library and example findings

Current TextForge implementation already uses established libraries:

- `markdown-it` for Markdown rendering;
- `markdown-it-anchor` for heading anchors;
- `markdown-it-footnote` for footnotes;
- `markdown-it-katex` and `katex` for math rendering.

Established external inspiration:

- `markdown-it` demonstrates a stable plugin model with parser instances, plugins, render rules, and link validation hooks.
- `unified` / `remark` / `rehype` demonstrates a mature processor architecture around parse/run/stringify stages, syntax trees, file metadata, and messages.
- `DOMPurify` is a mature HTML sanitizer option if TextForge needs a stronger HTML insertion safety boundary.

Recommended posture:

- Use `markdown-it` now.
- Borrow processor/report-result discipline from `unified` concepts.
- Do not migrate engine unless a later ADR/workpackage explicitly decides that AST-level transforms justify the cost.

## Ambiguity removed

For implementation agents, `WP-MD-REPORT` means:

> Add a stable, tested Markdown report generation layer over the existing local Markdown/ITM rendering pipeline, producing complete print-optimized HTML plus diagnostics and asset/generated-resource metadata, without expanding into PDF, backend rendering, AI, table editing, visual editing, or new Markdown/ITM semantics.

## Follow-up records recommended

- Add validation checklist and link it from `roadmap-state.yaml`.
- Add implementation evidence under `roadmap/validation/evidence/` when code changes land.
- Add a RAPID entry if any topic above is accepted, revised, or rejected.
