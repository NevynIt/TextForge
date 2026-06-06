function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function createFailureHtml(title, diagnostics) {
  const items = diagnostics.length > 0
    ? diagnostics.map((diagnostic) => `<li>${escapeHtml(diagnostic.message)}</li>`).join('')
    : '<li>EA Dashboard viewer could not resolve a local fixture model.</li>';
  return `
    <section class="tf-ea-viewer tf-ea-viewer--fallback" data-ea-viewer-fallback>
      <div class="tf-ea-fallback">
        <p class="tf-ea-eyebrow">Enterprise Architecture Viewer</p>
        <h3>${escapeHtml(title)}</h3>
        <ul>${items}</ul>
      </div>
    </section>
  `;
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
  style.dataset.textforgeEaViewerStyle = 'true';
  const cspNonce = readCspNonce(documentRef);
  if (cspNonce) {
    style.setAttribute('nonce', cspNonce);
  }
  style.textContent = `
    .tf-ea-viewer{--ea-bg:#040a16;--ea-panel:rgba(8,23,44,.9);--ea-border:rgba(59,130,246,.35);--ea-text:#f8fafc;--ea-muted:#94a3b8;--ea-blue:#3b82f6;--ea-green:#10b981;--ea-amber:#f59e0b;--ea-red:#ef4444;display:flex;flex-direction:column;width:100%;height:100%;min-height:520px;background:#040a16;color:var(--ea-text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;overflow:hidden}
    .tf-ea-viewer *{box-sizing:border-box}
    .tf-ea-viewer button,.tf-ea-viewer select,.tf-ea-viewer input{font:inherit}
    .tf-ea-viewer--fallback{align-items:center;justify-content:center;padding:24px}
    .tf-ea-fallback{width:min(680px,100%);padding:22px;border:1px solid var(--ea-border);border-radius:8px;background:var(--ea-panel)}
    .tf-ea-fallback h3{margin:4px 0 14px;font-size:1.1rem}
    .tf-ea-fallback ul{margin:0;padding-left:20px;color:var(--ea-muted)}
    .tf-ea-shell{display:grid;grid-template-columns:240px minmax(0,1fr) 320px;min-height:0;height:100%}
    .tf-ea-sidebar{border-right:1px solid var(--ea-border);background:rgba(8,23,44,.84);padding:18px 14px;display:flex;flex-direction:column;gap:14px;min-width:0}
    .tf-ea-brand{display:flex;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,.08)}
    .tf-ea-compass{width:34px;height:34px;border:1px solid #fff;border-radius:50%;display:grid;place-items:center;color:#fff;background:rgba(255,255,255,.08)}
    .tf-ea-brand-title{font-weight:700;font-size:.95rem}
    .tf-ea-nav{display:flex;flex-direction:column;gap:6px}
    .tf-ea-nav button,.tf-ea-btn{border:1px solid transparent;background:transparent;color:var(--ea-muted);border-radius:6px;padding:8px 10px;text-align:left;cursor:pointer}
    .tf-ea-nav button:hover,.tf-ea-btn:hover{background:rgba(255,255,255,.06);color:#fff}
    .tf-ea-nav button[aria-pressed=true],.tf-ea-btn--active{background:rgba(59,130,246,.16);border-color:rgba(59,130,246,.45);color:#fff}
    .tf-ea-stage{position:relative;min-width:0;min-height:0;overflow:hidden}
    .tf-ea-header{position:absolute;z-index:8;top:18px;left:18px;pointer-events:none;text-shadow:0 2px 10px rgba(0,0,0,.7)}
    .tf-ea-header h2{margin:0;font-size:1.15rem;letter-spacing:.02em}
    .tf-ea-header p{margin:4px 0 0;color:var(--ea-muted);font-size:.84rem}
    .tf-ea-flow{height:100%;width:100%;background:#040a16}
    .tf-ea-node-card{min-width:180px;max-width:260px;border:1px solid var(--ea-border);border-radius:8px;background:rgba(15,23,42,.88);box-shadow:0 8px 24px rgba(0,0,0,.34);padding:12px;color:#fff}
    .tf-ea-node-card__kind{font-size:.68rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#60a5fa}
    .tf-ea-node-card__title{font-size:.9rem;font-weight:700;margin-top:4px;line-height:1.2}
    .tf-ea-node-card__meta{font-size:.72rem;color:var(--ea-muted);margin-top:5px}
    .tf-ea-controls{border-left:1px solid var(--ea-border);background:rgba(8,23,44,.86);padding:18px;display:flex;flex-direction:column;gap:14px;min-width:0;overflow:auto}
    .tf-ea-panel{border:1px solid rgba(255,255,255,.08);border-radius:8px;background:rgba(255,255,255,.03);padding:12px}
    .tf-ea-panel h3{margin:0 0 8px;font-size:.78rem;text-transform:uppercase;letter-spacing:.08em;color:#60a5fa}
    .tf-ea-field{display:flex;flex-direction:column;gap:6px;margin-top:10px}
    .tf-ea-field label,.tf-ea-row-label{font-size:.74rem;font-weight:700;color:var(--ea-muted)}
    .tf-ea-field select{width:100%;border:1px solid rgba(59,130,246,.35);border-radius:6px;background:#040a16;color:#fff;padding:8px}
    .tf-ea-check{display:flex;gap:8px;align-items:center;color:#dbeafe;font-size:.82rem;margin-top:8px}
    .tf-ea-range-value{display:flex;justify-content:space-between;align-items:center;font-size:.78rem;color:#dbeafe}
    .tf-ea-range{width:100%;accent-color:var(--ea-blue)}
    .tf-ea-timeline{position:absolute;z-index:9;bottom:22px;left:50%;transform:translateX(-50%);width:min(600px,calc(100% - 40px));border:1px solid var(--ea-blue);border-radius:10px;background:rgba(8,23,44,.94);box-shadow:0 8px 32px rgba(0,0,0,.55);padding:14px 24px}
    .tf-ea-detail{position:absolute;z-index:8;left:18px;bottom:18px;width:min(360px,calc(100% - 36px));border:1px solid rgba(16,185,129,.35);border-radius:8px;background:rgba(8,23,44,.9);padding:12px;box-shadow:0 8px 28px rgba(0,0,0,.42)}
    .tf-ea-detail h3{margin:0 0 8px;font-size:.9rem}
    .tf-ea-detail dl{display:grid;grid-template-columns:100px minmax(0,1fr);gap:6px;margin:0;font-size:.78rem}
    .tf-ea-detail dt{color:var(--ea-muted);font-weight:700}
    .tf-ea-detail dd{margin:0;min-width:0;overflow-wrap:anywhere}
    .tf-ea-svg-view{height:100%;display:flex;align-items:center;justify-content:center;padding:86px 24px 24px}
    .tf-ea-svg-frame{width:min(900px,100%);height:min(620px,100%);border:1px solid var(--ea-border);border-radius:8px;background:rgba(15,23,42,.86);padding:20px;overflow:auto}
    .tf-ea-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;padding:86px 24px 24px;height:100%;overflow:auto}
    .tf-ea-list-card{border:1px solid var(--ea-border);border-radius:8px;background:rgba(15,23,42,.86);padding:14px;cursor:pointer}
    .tf-ea-list-card:hover{border-color:#60a5fa;background:rgba(30,41,59,.92)}
    .tf-ea-eyebrow{margin:0;color:#60a5fa;font-size:.72rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
    .tf-ea-flow .react-flow{direction:ltr;width:100%;height:100%;position:relative;overflow:hidden;z-index:0;background:#040a16}
    .tf-ea-flow .react-flow__renderer,.tf-ea-flow .react-flow__zoompane,.tf-ea-flow .react-flow__selectionpane{width:100%;height:100%;position:absolute;inset:0}
    .tf-ea-flow .react-flow__renderer{z-index:4}
    .tf-ea-flow .react-flow__pane{z-index:1;cursor:grab}
    .tf-ea-flow .react-flow__viewport{transform-origin:0 0;z-index:2;pointer-events:none}
    .tf-ea-flow .react-flow__container{position:absolute;width:100%;height:100%;top:0;left:0}
    .tf-ea-flow .react-flow__nodes{position:absolute;width:100%;height:100%;transform-origin:0 0;pointer-events:none}
    .tf-ea-flow .react-flow__node{position:absolute;user-select:none;pointer-events:all;transform-origin:0 0}
    .tf-ea-flow .react-flow__edges{position:absolute;width:100%;height:100%;overflow:visible;pointer-events:none}
    .tf-ea-flow .react-flow__edges svg{position:absolute;overflow:visible;pointer-events:none}
    .tf-ea-flow .react-flow__edge{pointer-events:visibleStroke}
    .tf-ea-flow .react-flow__edge-path{fill:none;stroke:#38bdf8;stroke-width:2.4;filter:drop-shadow(0 0 5px rgba(56,189,248,.45))}
    .tf-ea-flow .react-flow__edge.animated path{stroke-dasharray:5;animation:tfEaDashdraw .5s linear infinite}
    .tf-ea-flow .react-flow__edge.animated path.react-flow__edge-interaction{stroke-dasharray:none;animation:none}
    .tf-ea-flow .react-flow__edge-textwrapper{pointer-events:all}
    .tf-ea-flow .react-flow__edge-text{font-size:11px;fill:#e0f2fe;font-weight:700;pointer-events:none;user-select:none}
    .tf-ea-flow .react-flow__edge-textbg{fill:rgba(8,23,44,.9)}
    .tf-ea-edge-label{position:absolute;padding:4px 8px;border:1px solid #38bdf8;border-radius:4px;font-size:10px;font-weight:700;line-height:1;white-space:nowrap;pointer-events:all;box-shadow:0 4px 12px rgba(0,0,0,.55);transition:opacity .25s ease}
    .tf-ea-flow .react-flow__handle{position:absolute;pointer-events:none;min-width:5px;min-height:5px;background-color:#60a5fa}
    .tf-ea-flow .react-flow__handle-bottom{top:auto;left:50%;bottom:0;transform:translate(-50%,50%)}
    .tf-ea-flow .react-flow__handle-top{top:0;left:50%;transform:translate(-50%,-50%)}
    .tf-ea-flow .react-flow__handle-left{top:50%;left:0;transform:translate(-50%,-50%)}
    .tf-ea-flow .react-flow__handle-right{top:50%;right:0;transform:translate(50%,-50%)}
    .tf-ea-flow .react-flow__background{position:absolute;width:100%;height:100%;top:0;left:0}
    .tf-ea-flow .react-flow__controls{position:absolute;z-index:5;left:12px;bottom:12px;display:flex;flex-direction:column;box-shadow:0 8px 24px rgba(0,0,0,.3)}
    .tf-ea-flow .react-flow__controls button{width:28px;height:28px;border:0;border-bottom:1px solid rgba(255,255,255,.12);background:rgba(15,23,42,.9);color:#fff;display:grid;place-items:center;cursor:pointer}
    .tf-ea-flow .react-flow__controls button:hover{background:rgba(59,130,246,.35)}
    @keyframes tfEaDashdraw{from{stroke-dashoffset:10}}
    @media (max-width:1100px){.tf-ea-shell{grid-template-columns:190px minmax(0,1fr)}.tf-ea-controls{position:absolute;right:12px;top:80px;bottom:12px;width:min(320px,calc(100% - 24px));z-index:12;border:1px solid var(--ea-border);border-radius:8px}.tf-ea-sidebar{font-size:.85rem}}
  `;
  return style;
}

export function ensurePackageStyle(container) {
  const documentRef = container.ownerDocument ?? globalThis.document;
  if (!documentRef?.head) {
    return () => {};
  }
  const existing = documentRef.head.querySelector('style[data-textforge-ea-viewer-style="true"]');
  if (existing) {
    return () => {};
  }
  const style = createStyleElement(documentRef);
  documentRef.head.appendChild(style);
  return () => {
    style.remove();
  };
}
