const port = Number(process.argv[2] ?? 9222);
const targetUrl = process.argv[3] ?? 'http://127.0.0.1:4174';

const pages = await fetch(`http://127.0.0.1:${port}/json`).then((response) => response.json());
const page = pages.find((candidate) => candidate.url.includes(targetUrl)) ?? pages[0];
if (!page?.webSocketDebuggerUrl) {
  throw new Error(`No debuggable browser page found for ${targetUrl}`);
}

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let nextId = 1;

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
});

await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

function send(method, params = {}) {
  const id = nextId;
  nextId += 1;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => pending.set(id, resolve));
}

await send('Runtime.enable');
await send('Page.enable');
await send('Page.bringToFront');

const expression = `(() => {
  const svgTab = [...document.querySelectorAll('.tab')].find((node) => node.textContent.includes('system.svg'));
  svgTab?.click();
  const assetViewer = document.querySelector('.asset-viewer--svg');
  const assetMedia = document.querySelector('.asset-viewer__media');
  const assetDownload = document.querySelector('[data-download-link]');
  const assetOpenWith = document.querySelector('#surface-openwith')?.textContent ?? '';
  const notesTab = [...document.querySelectorAll('.tab')].find((node) => node.textContent.includes('notes.md'));
  notesTab?.click();
  const host = document.querySelector('[data-codemirror-host]');
  const editor = document.querySelector('.cm-editor');
  const content = document.querySelector('.cm-content');
  const before = content?.textContent ?? '';
  const view = host?.textforgeCodeMirrorView;
  view?.dispatch({ changes: { from: view.state.doc.length, insert: '\\nCDP validation line' } });
  const after = document.querySelector('.cm-content')?.textContent ?? '';
  return {
    hasHost: Boolean(host),
    engine: host?.dataset.editorEngine ?? null,
    hasEditor: Boolean(editor),
    hasContent: Boolean(content),
    viewAttached: Boolean(view),
    hasSvgAssetViewer: Boolean(assetViewer),
    hasAssetMedia: Boolean(assetMedia),
    assetDownloadBound: assetDownload?.getAttribute('href')?.startsWith('blob:') ?? false,
    assetOpenWith,
    beforeLength: before.length,
    afterIncludesValidation: after.includes('CDP validation line'),
    characterLabel: [...document.querySelectorAll('.editor-frame__footer span')].map((node) => node.textContent).join(' | '),
  };
})()`;

const response = await send('Runtime.evaluate', {
  expression,
  returnByValue: true,
  awaitPromise: true,
});
socket.close();

const result = response.result?.result?.value;
if (!result) {
  throw new Error(`CDP evaluation failed: ${JSON.stringify(response)}`);
}

if (
  !result.hasHost ||
  result.engine !== 'codemirror-6' ||
  !result.hasEditor ||
  !result.hasContent ||
  !result.viewAttached ||
  !result.hasSvgAssetViewer ||
  !result.hasAssetMedia ||
  !result.assetDownloadBound ||
  result.assetOpenWith !== 'SVG viewer' ||
  !result.afterIncludesValidation
) {
  throw new Error(`Surface validation failed: ${JSON.stringify(result)}`);
}

console.info(JSON.stringify(result, null, 2));
