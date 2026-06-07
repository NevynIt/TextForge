function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function readCspNonce(documentRef) {
  if (!documentRef?.querySelector) {
    return undefined;
  }

  const meta = documentRef.querySelector('meta[name="textforge-csp-nonce"]');
  const nonce = meta?.getAttribute('content')?.trim();
  return nonce || undefined;
}

function createStyleElement(documentRef) {
  const style = documentRef.createElement('style');
  style.dataset.textforgeTablesStyle = 'true';
  const cspNonce = readCspNonce(documentRef);
  if (cspNonce) {
    style.setAttribute('nonce', cspNonce);
  }
  style.textContent = `
    .tf-tables-surface{--tf-tables-bg:#f5f7fb;--tf-tables-panel:#ffffff;--tf-tables-border:#d7dde7;--tf-tables-muted:#526173;--tf-tables-text:#142033;--tf-tables-accent:#1f6feb;--tf-tables-accent-soft:#e8f0ff;--tf-tables-warning:#7a4d06;--tf-tables-warning-bg:#fff5df;--tf-tables-error:#8f1d2c;--tf-tables-error-bg:#fff0f2;display:flex;flex-direction:column;width:100%;height:100%;min-height:320px;background:var(--tf-tables-bg);color:var(--tf-tables-text);font:13px/1.4 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    .tf-tables-surface *{box-sizing:border-box}
    .tf-tables-surface button,.tf-tables-surface select,.tf-tables-surface input{font:inherit}
    .tf-tables-loading,.tf-tables-failure{display:flex;align-items:center;justify-content:center;height:100%;padding:24px}
    .tf-tables-card{width:min(860px,100%);background:var(--tf-tables-panel);border:1px solid var(--tf-tables-border);border-radius:8px;padding:18px 20px;box-shadow:0 10px 24px rgba(16,24,40,.06)}
    .tf-tables-eyebrow{margin:0 0 6px;color:var(--tf-tables-muted);font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
    .tf-tables-card h3{margin:0 0 8px;font-size:18px;line-height:1.25}
    .tf-tables-card p{margin:0;color:var(--tf-tables-muted)}
    .tf-tables-list{margin:14px 0 0;padding-left:18px}
    .tf-tables-runtime{display:grid;grid-template-rows:auto minmax(0,1fr) auto;height:100%;min-height:0}
    .tf-tables-toolbar{display:flex;flex-wrap:wrap;gap:12px;padding:12px 14px;border-bottom:1px solid var(--tf-tables-border);background:rgba(255,255,255,.82);backdrop-filter:blur(6px)}
    .tf-tables-toolbar-group{display:flex;flex-wrap:wrap;align-items:flex-end;gap:8px;padding-right:12px;border-right:1px solid var(--tf-tables-border)}
    .tf-tables-toolbar-group:last-child{border-right:0;padding-right:0}
    .tf-tables-field{display:flex;flex-direction:column;gap:4px;min-width:112px}
    .tf-tables-field label{font-size:11px;font-weight:700;color:var(--tf-tables-muted);letter-spacing:.02em}
    .tf-tables-field select,.tf-tables-field input{height:32px;border:1px solid var(--tf-tables-border);border-radius:6px;background:#fff;color:var(--tf-tables-text);padding:0 10px}
    .tf-tables-actions{display:flex;flex-wrap:wrap;gap:8px}
    .tf-tables-btn{height:32px;border:1px solid var(--tf-tables-border);border-radius:6px;background:#fff;color:var(--tf-tables-text);padding:0 12px;cursor:pointer}
    .tf-tables-btn:hover:enabled{border-color:#b8c3d3;background:#f8fbff}
    .tf-tables-btn:disabled{cursor:not-allowed;opacity:.55}
    .tf-tables-btn--primary{border-color:rgba(31,111,235,.24);background:var(--tf-tables-accent-soft);color:var(--tf-tables-accent)}
    .tf-tables-body{min-height:0;padding:12px}
    .tf-tables-grid-shell{height:100%;min-height:280px;background:#fff;border:1px solid var(--tf-tables-border);border-radius:8px;overflow:hidden}
    .tf-tables-grid{width:100%;height:100%}
    .tf-tables-footer{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;padding:10px 14px;border-top:1px solid var(--tf-tables-border);background:rgba(255,255,255,.88)}
    .tf-tables-summary{display:flex;flex-wrap:wrap;gap:12px;color:var(--tf-tables-muted);font-size:12px}
    .tf-tables-diagnostics{display:flex;flex-wrap:wrap;gap:8px}
    .tf-tables-diagnostic{max-width:min(420px,100%);padding:6px 10px;border-radius:999px;border:1px solid transparent;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .tf-tables-diagnostic[data-severity="warning"]{background:var(--tf-tables-warning-bg);border-color:#f1d79a;color:var(--tf-tables-warning)}
    .tf-tables-diagnostic[data-severity="error"]{background:var(--tf-tables-error-bg);border-color:#efbac2;color:var(--tf-tables-error)}
    .tf-tables-diagnostic[data-severity="information"],.tf-tables-diagnostic[data-severity="info"]{background:#eef4ff;border-color:#c9dafc;color:#35589a}
    @media (max-width:960px){.tf-tables-runtime{grid-template-rows:auto minmax(0,1fr) auto}.tf-tables-toolbar{padding:10px}.tf-tables-toolbar-group{border-right:0;padding-right:0}}
  `;
  return style;
}

function createAgGridThemeStyleElement(documentRef, cssText) {
  const style = documentRef.createElement('style');
  style.dataset.textforgeTablesAgGridStyle = 'true';
  const cspNonce = readCspNonce(documentRef);
  if (cspNonce) {
    style.setAttribute('nonce', cspNonce);
  }
  style.textContent = cssText;
  return style;
}

function createGlideStyleElement(documentRef, cssText) {
  const style = documentRef.createElement('style');
  style.dataset.textforgeTablesGlideStyle = 'true';
  const cspNonce = readCspNonce(documentRef);
  if (cspNonce) {
    style.setAttribute('nonce', cspNonce);
  }
  style.textContent = cssText;
  return style;
}

export function ensureTablesPackageStyle(container) {
  const documentRef = container?.ownerDocument ?? globalThis.document;
  if (!documentRef?.head) {
    return () => {};
  }

  const existing = documentRef.head.querySelector('style[data-textforge-tables-style="true"]');
  if (existing) {
    return () => {};
  }

  const style = createStyleElement(documentRef);
  documentRef.head.appendChild(style);
  return () => {
    style.remove();
  };
}

export function ensureTablesAgGridThemeStyle(container, cssText) {
  const documentRef = container?.ownerDocument ?? globalThis.document;
  if (!documentRef?.head || !cssText) {
    return () => {};
  }

  const existing = documentRef.head.querySelector('style[data-textforge-tables-ag-grid-style="true"]');
  if (existing) {
    if (existing.textContent !== cssText) {
      existing.textContent = cssText;
    }
    return () => {};
  }

  const style = createAgGridThemeStyleElement(documentRef, cssText);
  documentRef.head.appendChild(style);
  return () => {
    style.remove();
  };
}

export function ensureTablesGlideStyle(container, cssText) {
  const documentRef = container?.ownerDocument ?? globalThis.document;
  if (!documentRef?.head || !cssText) {
    return () => {};
  }

  const existing = documentRef.head.querySelector('style[data-textforge-tables-glide-style="true"]');
  if (existing) {
    if (existing.textContent !== cssText) {
      existing.textContent = cssText;
    }
    return () => {};
  }

  const style = createGlideStyleElement(documentRef, cssText);
  documentRef.head.appendChild(style);
  return () => {
    style.remove();
  };
}

export function createTablesRuntimeMarkup(title, message = 'Loading table grid...') {
  return `
    <section class="tf-tables-surface tf-tables-loading" data-tf-tables-surface="loading">
      <div class="tf-tables-card">
        <p class="tf-tables-eyebrow">CSV / TSV Grid</p>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(message)}</p>
      </div>
    </section>
  `;
}

export function createTablesFailureHtml(title, diagnostics = [], options = {}) {
  const items = diagnostics.length > 0
    ? diagnostics.map((diagnostic) =>
      `<li>${escapeHtml(diagnostic.message ?? 'Table surface error.')}</li>`).join('')
    : `<li>${escapeHtml(options.fallbackMessage ?? 'The table grid could not open this resource.')}</li>`;
  return `
    <section class="tf-tables-surface tf-tables-failure" data-tf-tables-surface="failure">
      <div class="tf-tables-card">
        <p class="tf-tables-eyebrow">CSV / TSV Grid</p>
        <h3>${escapeHtml(title)}</h3>
        <ul class="tf-tables-list">${items}</ul>
      </div>
    </section>
  `;
}
