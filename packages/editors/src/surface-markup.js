function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function createEditorSurfaceMarkup(model) {
  const diagnosticsCount = model.diagnostics.length;
  return `
    <section class="editor-frame editor-frame--${model.state}">
      <header class="editor-frame__header">
        <div>
          <span class="editor-frame__eyebrow">Text editor</span>
          <h4>Source editor</h4>
        </div>
        <div class="editor-frame__meta">
          <span>${escapeHtml(model.languageLabel)}</span>
          <span>${model.state}</span>
        </div>
      </header>
      <div class="editor-frame__body">
        <div
          class="editor-frame__codemirror"
          data-codemirror-host
          aria-label="${escapeHtml(model.title)}"
        ></div>
      </div>
      <div class="editor-frame__diagnostics" aria-live="polite">
        <span>${diagnosticsCount} diagnostics</span>
        <span>${escapeHtml(model.selectionLabel)}</span>
      </div>
      <footer class="editor-frame__footer">
        <span>Range ${model.range.start.line}:${model.range.start.column} to ${model.range.end.line}:${model.range.end.column}</span>
        <span>${model.characterCount} characters</span>
      </footer>
    </section>
  `;
}
