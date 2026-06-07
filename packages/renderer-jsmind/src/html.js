function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function createRuntimeMessageHtml(title, message, tone = 'info') {
  return `
    <section class="tf-visual-runtime tf-visual-runtime--${escapeHtml(tone)}">
      <header class="tf-visual-runtime__header">
        <div>
          <span class="tf-visual-runtime__eyebrow">jsMind runtime</span>
          <h4>${escapeHtml(title)}</h4>
        </div>
      </header>
      <div class="tf-visual-runtime__body tf-visual-runtime__body--message">
        <p class="tf-visual-runtime__message">${escapeHtml(message)}</p>
      </div>
    </section>
  `;
}

export function createBaseRuntimeMarkup(title, diagnosticsCount) {
  return `
    <section class="tf-visual-runtime tf-visual-runtime--jsmind">
      <header class="tf-visual-runtime__header">
        <div>
          <span class="tf-visual-runtime__eyebrow">jsMind runtime</span>
          <h4>${escapeHtml(title)}</h4>
        </div>
        <div class="tf-visual-runtime__meta">
          <span data-runtime-summary>0 topics</span>
          <span data-runtime-diagnostics>${diagnosticsCount} diagnostics</span>
        </div>
      </header>
      <div class="tf-visual-runtime__toolbar">
        <label class="tf-visual-runtime__field">
          <span>Expansion</span>
          <select data-runtime-expansion>
            <option value="depth2">Depth 2</option>
            <option value="full">Full</option>
            <option value="collapsed">Collapsed</option>
          </select>
        </label>
        <label class="tf-visual-runtime__field tf-visual-runtime__field--search">
          <span>Search</span>
          <input type="search" data-runtime-search placeholder="Topic, type, tag" />
        </label>
        <div class="tf-visual-runtime__actions">
          <button type="button" data-runtime-fit>Fit</button>
          <button type="button" data-runtime-center>Center</button>
          <button type="button" data-runtime-fold-all>Fold all</button>
          <button type="button" data-runtime-unfold-all>Unfold all</button>
          <button type="button" data-runtime-zoom-in>Zoom in</button>
          <button type="button" data-runtime-zoom-out>Zoom out</button>
        </div>
      </div>
      <div class="tf-visual-runtime__body">
        <div class="tf-visual-runtime__stage tf-visual-runtime__stage--mindmap">
          <div class="tf-visual-runtime__mindmap-viewport" data-runtime-viewport>
            <div class="tf-visual-runtime__mindmap-host" data-runtime-stage></div>
          </div>
        </div>
        <aside class="tf-visual-runtime__sidebar">
          <section class="tf-visual-runtime__panel">
            <h5>Selection</h5>
            <div data-runtime-selection class="tf-visual-runtime__empty">Select a topic.</div>
          </section>
          <section class="tf-visual-runtime__panel">
            <h5>Search</h5>
            <div data-runtime-search-status class="tf-visual-runtime__empty">No active search.</div>
          </section>
        </aside>
      </div>
    </section>
  `;
}

export function createEmbeddedRenderMarkup(title, topicsCount) {
  return `
    <figure class="tf-jsmind-render" data-jsmind-embedded-render>
      <figcaption>
        <span class="tf-visual-runtime__eyebrow">jsMind render</span>
        <strong>${escapeHtml(title)}</strong>
        <span>${topicsCount} topics</span>
      </figcaption>
      <div class="tf-jsmind-render__stage" data-jsmind-embedded-stage></div>
    </figure>
  `;
}

export function createEmptySelectionMarkup(message = 'Select a topic.') {
  return `<p class="tf-visual-runtime__empty">${escapeHtml(message)}</p>`;
}

export function createSelectionMarkup(node) {
  const primaryProvenance = node.provenance?.[0];
  const secondaryProvenance = node.provenance?.slice(1) ?? [];
  return `
    <dl class="tf-visual-runtime__detail-list">
      <div><dt>Label</dt><dd>${escapeHtml(node.label ?? node.id)}</dd></div>
      <div><dt>ID</dt><dd>${escapeHtml(node.id)}</dd></div>
      <div><dt>Kind</dt><dd>${escapeHtml(node.kind ?? 'n/a')}</dd></div>
      <div><dt>Classes</dt><dd>${escapeHtml((node.classes ?? []).join(', ') || 'none')}</dd></div>
      <div><dt>Tags</dt><dd>${escapeHtml((node.tags ?? []).join(', ') || 'none')}</dd></div>
      <div><dt>Trace</dt><dd>${escapeHtml(primaryProvenance?.sourceId ?? primaryProvenance?.sourcePath ?? 'none')}</dd></div>
      <div><dt>Extra provenance</dt><dd>${escapeHtml(String(secondaryProvenance.length))}</dd></div>
    </dl>
    <div class="tf-visual-runtime__detail-actions">
      <button type="button" data-runtime-open-source ${primaryProvenance?.sourcePath ? '' : 'disabled'}>Open source</button>
    </div>
  `;
}
