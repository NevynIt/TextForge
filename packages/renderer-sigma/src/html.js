export function escapeHtml(text) {
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
          <span class="tf-visual-runtime__eyebrow">Sigma runtime</span>
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
    <section class="tf-visual-runtime tf-visual-runtime--sigma">
      <header class="tf-visual-runtime__header">
        <div>
          <span class="tf-visual-runtime__eyebrow">Sigma runtime</span>
          <h4>${escapeHtml(title)}</h4>
        </div>
        <div class="tf-visual-runtime__meta">
          <span data-runtime-summary>0 nodes / 0 edges</span>
          <span data-runtime-diagnostics>${diagnosticsCount} diagnostics</span>
        </div>
      </header>
      <div class="tf-visual-runtime__toolbar">
        <label class="tf-visual-runtime__field">
          <span>Layout</span>
          <select data-runtime-layout>
            <option value="forceatlas2">ForceAtlas2</option>
            <option value="noverlap">Noverlap</option>
            <option value="circular">Circular</option>
            <option value="random">Random</option>
          </select>
        </label>
        <label class="tf-visual-runtime__field">
          <span>Node size</span>
          <select data-runtime-size-metric>
            <option value="degree">Degree</option>
            <option value="pagerank">Pagerank</option>
            <option value="fixed">Fixed</option>
          </select>
        </label>
        <label class="tf-visual-runtime__field">
          <span>Labels</span>
          <select data-runtime-label-mode>
            <option value="matched">Matches</option>
            <option value="all">All</option>
            <option value="none">None</option>
          </select>
        </label>
        <label class="tf-visual-runtime__field tf-visual-runtime__field--search">
          <span>Search</span>
          <input type="search" data-runtime-search placeholder="Node, type, relation" />
        </label>
        <div class="tf-visual-runtime__toggle-row">
          <label class="tf-visual-runtime__toggle"><input type="checkbox" data-runtime-focus-neighbors /> Focus neighbors</label>
          <label class="tf-visual-runtime__toggle"><input type="checkbox" data-runtime-filter-matches /> Matches only</label>
        </div>
        <div class="tf-visual-runtime__actions">
          <button type="button" data-runtime-fit>Fit</button>
          <button type="button" data-runtime-zoom-in>Zoom in</button>
          <button type="button" data-runtime-zoom-out>Zoom out</button>
          <button type="button" data-runtime-rerun-layout>Run layout</button>
        </div>
      </div>
      <div class="tf-visual-runtime__body">
        <div class="tf-visual-runtime__stage" data-runtime-stage></div>
        <aside class="tf-visual-runtime__sidebar">
          <section class="tf-visual-runtime__panel">
            <h5>Selection</h5>
            <div data-runtime-selection class="tf-visual-runtime__empty">Select a node or edge.</div>
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

export function createEmptySelectionMarkup(message = 'Select a node or edge.') {
  return `<p class="tf-visual-runtime__empty">${escapeHtml(message)}</p>`;
}

export function createSelectionMarkup(entry) {
  const primaryProvenance = entry.provenance?.[0];
  const secondaryProvenance = entry.provenance?.slice(1) ?? [];
  return `
    <dl class="tf-visual-runtime__detail-list">
      <div><dt>Label</dt><dd>${escapeHtml(entry.label ?? entry.id)}</dd></div>
      <div><dt>ID</dt><dd>${escapeHtml(entry.id)}</dd></div>
      <div><dt>Kind</dt><dd>${escapeHtml(entry.kind ?? 'n/a')}</dd></div>
      <div><dt>Classes</dt><dd>${escapeHtml((entry.classes ?? []).join(', ') || 'none')}</dd></div>
      <div><dt>Tags</dt><dd>${escapeHtml((entry.tags ?? []).join(', ') || 'none')}</dd></div>
      <div><dt>Trace</dt><dd>${escapeHtml(primaryProvenance?.sourceId ?? primaryProvenance?.sourcePath ?? 'none')}</dd></div>
      <div><dt>Extra provenance</dt><dd>${escapeHtml(String(secondaryProvenance.length))}</dd></div>
    </dl>
    <div class="tf-visual-runtime__detail-actions">
      <button type="button" data-runtime-open-source ${primaryProvenance?.sourcePath ? '' : 'disabled'}>Open source</button>
    </div>
  `;
}
