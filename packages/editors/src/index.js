export function createTextEditorSelection(anchor, head = anchor) {
  return { anchor, head };
}

export function normalizeTextSelection(selection) {
  return {
    anchor: Math.max(0, selection.anchor),
    head: Math.max(0, selection.head),
  };
}

export function clampTextSelection(selection, text) {
  const max = text.length;
  return {
    anchor: Math.min(Math.max(0, selection.anchor), max),
    head: Math.min(Math.max(0, selection.head), max),
  };
}

export function sourceRangeToSelection(range) {
  return {
    anchor: range.start.offset ?? 0,
    head: range.end.offset ?? range.start.offset ?? 0,
  };
}

export function selectionToSourceRange(selection) {
  const start = Math.min(selection.anchor, selection.head);
  const end = Math.max(selection.anchor, selection.head);
  return {
    start: { line: 1, column: start + 1, offset: start },
    end: { line: 1, column: end + 1, offset: end },
  };
}

export function createTextEditorDocument(
  resource,
  text = '',
  options = {},
) {
  return {
    resource,
    text,
    version: options.version ?? 1,
    languageId: options.languageId,
    selection: options.selection,
    sourceRange: options.sourceRange,
    readOnly: options.readOnly,
  };
}

export function applyTextEdit(document, operation) {
  if (document.readOnly) {
    throw new Error(`Cannot edit read-only document: ${document.resource.resourceId}`);
  }

  const text = document.text;
  const nextText = (() => {
    switch (operation.kind) {
      case 'insert': {
        const offset = Math.min(Math.max(0, operation.offset), text.length);
        return `${text.slice(0, offset)}${operation.text}${text.slice(offset)}`;
      }
      case 'delete': {
        const start = Math.min(Math.max(0, operation.start), text.length);
        const end = Math.min(Math.max(start, operation.end), text.length);
        return `${text.slice(0, start)}${text.slice(end)}`;
      }
      case 'replace': {
        const start = Math.min(Math.max(0, operation.start), text.length);
        const end = Math.min(Math.max(start, operation.end), text.length);
        return `${text.slice(0, start)}${operation.text}${text.slice(end)}`;
      }
      default:
        return text;
    }
  })();

  return {
    ...document,
    text: nextText,
    version: document.version + 1,
    selection: clampTextSelection(document.selection ?? createTextEditorSelection(0), nextText),
  };
}

export function createTextEditorState(document, diagnostics = []) {
  return {
    document,
    diagnostics,
  };
}

export function createTextEditorNavigationTarget(resource, range) {
  return { resource, range };
}

export function createSourceRangeFromSelection(selection) {
  return selectionToSourceRange(selection);
}

export const codeMirrorTextEditorSurfaceContribution = {
  id: '@textforge/editors/code-mirror-text',
  label: 'Text editor',
  description: 'Generic source editor surface for plain text resources.',
  kind: 'text-editor',
  editable: true,
  sourceRangeAware: true,
  placements: ['main', 'popup', 'auxiliary'],
  resourceKinds: ['text'],
  openWithPriority: 100,
};

export const contributions = {
  id: '@textforge/editors',
  diagnostics: [],
  commands: [],
  surfaces: [codeMirrorTextEditorSurfaceContribution],
  pipelines: [],
};

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function normalizeLineEndings(text) {
  return text.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
}

function splitLines(text) {
  return normalizeLineEndings(text).split('\n');
}

function countLines(text) {
  return splitLines(text).length;
}

function formatSelectionLabel(selection, text) {
  const normalized = normalizeTextSelection(selection);
  const start = Math.min(normalized.anchor, normalized.head);
  const end = Math.max(normalized.anchor, normalized.head);
  const lines = splitLines(text);

  let line = 1;
  let column = start + 1;
  let cursor = 0;
  for (const currentLine of lines) {
    const nextCursor = cursor + currentLine.length;
    if (start <= nextCursor) {
      column = start - cursor + 1;
      break;
    }
    cursor = nextCursor + 1;
    line += 1;
  }

  const span = end - start;
  return `L${line}:C${column}${span > 0 ? `, ${span} selected` : ''}`;
}

function createEditorSurfaceMarkup(model) {
  const diagnosticsCount = model.diagnostics.length;
  const lineNumbers = Array.from({ length: model.lineCount }, (_, index) => `<span>${index + 1}</span>`).join('');
  return `
    <section class="editor-frame editor-frame--${model.state}">
      <header class="editor-frame__header">
        <div>
          <span class="editor-frame__eyebrow">Text editor</span>
          <h4>${escapeHtml(model.title)}</h4>
        </div>
        <div class="editor-frame__meta">
          <span>${escapeHtml(model.languageLabel)}</span>
          <span>${model.state}</span>
        </div>
      </header>
      <div class="editor-frame__body">
        <aside class="editor-frame__gutter" aria-hidden="true">${lineNumbers}</aside>
        <div
          class="editor-frame__surface"
          data-editor-input
          contenteditable="${model.readOnly ? 'false' : 'plaintext-only'}"
          role="textbox"
          aria-label="${escapeHtml(model.title)}"
          aria-multiline="true"
          spellcheck="false"
          tabindex="0"
        >${escapeHtml(model.text)}</div>
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

function getTextOffset(root, node, offset) {
  if (!root || !node) {
    return 0;
  }

  const doc = root.ownerDocument ?? globalThis.document;
  if (!doc || typeof doc.createTreeWalker !== 'function') {
    return 0;
  }

  const textNodes = [];
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    textNodes.push(current);
    current = walker.nextNode();
  }

  let position = 0;
  for (const textNode of textNodes) {
    if (textNode === node) {
      return position + Math.min(offset, textNode.data.length);
    }

    position += textNode.data.length;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const child = node.childNodes?.[offset] ?? null;
    if (child) {
      return position + getTextOffset(root, child, 0);
    }
  }

  return position;
}

function getSelectionFromEditor(editor) {
  const ownerDocument = editor.ownerDocument;
  if (!ownerDocument || typeof ownerDocument.getSelection !== 'function') {
    return createTextEditorSelection(0);
  }

  const selection = ownerDocument.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return createTextEditorSelection(0);
  }

  const range = selection.getRangeAt(0);
  if (!editor.contains(range.startContainer) || !editor.contains(range.endContainer)) {
    return createTextEditorSelection(0);
  }

  const anchor = getTextOffset(editor, range.startContainer, range.startOffset);
  const head = getTextOffset(editor, range.endContainer, range.endOffset);
  return createTextEditorSelection(anchor, head);
}

export function createTextEditorSurfaceModel(document, diagnostics = []) {
  const title = document.resource.path ?? document.resource.resourceId;
  const selection = document.selection ?? createTextEditorSelection(0);
  const range = document.sourceRange ?? selectionToSourceRange(selection);
  const state = document.readOnly ? 'read-only' : 'editable';
  const languageLabel = document.languageId ?? document.resource.languageId ?? 'plain text';
  const text = normalizeLineEndings(document.text);

  return {
    id: `text-editor:${document.resource.resourceId}`,
    title,
    summary: `${state} text surface for ${languageLabel}.`,
    state,
    languageLabel,
    selection,
    selectionLabel: formatSelectionLabel(selection, text),
    range,
    diagnostics,
    text,
    lineCount: countLines(text),
    characterCount: text.length,
    readOnly: Boolean(document.readOnly),
  };
}

export function createCodeMirrorTextEditorSurface({ document, diagnostics = [], onChange } = {}) {
  const baseDocument = document ?? createTextEditorDocument(
    { resourceId: 'text-editor-document', kind: 'text' },
    '',
  );
  const model = createTextEditorSurfaceModel(baseDocument, diagnostics);

  return {
    id: model.id,
    contribution: codeMirrorTextEditorSurfaceContribution,
    document: baseDocument,
    diagnostics,
    model,
    mount(container, handlers = {}) {
      container.innerHTML = createEditorSurfaceMarkup(model);

      const editor = container.querySelector('[data-editor-input]');
      const gutter = container.querySelector('.editor-frame__gutter');
      const selectionLabel = container.querySelector('.editor-frame__diagnostics span:last-child');
      const diagnosticsLabel = container.querySelector('.editor-frame__diagnostics span:first-child');
      const rangeLabel = container.querySelector('.editor-frame__footer span:first-child');
      const characterLabel = container.querySelector('.editor-frame__footer span:last-child');
      if (!editor || !gutter || !selectionLabel || !diagnosticsLabel || !rangeLabel || !characterLabel) {
        return () => {};
      }

      const update = typeof handlers.onChange === 'function' ? handlers.onChange : onChange;
      let currentDocument = baseDocument;

      const refreshSurfaceState = () => {
        const text = normalizeLineEndings(editor.textContent ?? '');
        const nextSelection = getSelectionFromEditor(editor);
        const nextModel = createTextEditorSurfaceModel({
          ...currentDocument,
          text,
          selection: nextSelection,
          sourceRange: selectionToSourceRange(nextSelection),
        }, diagnostics);

        gutter.innerHTML = Array.from({ length: nextModel.lineCount }, (_, index) => `<span>${index + 1}</span>`).join('');
        selectionLabel.textContent = nextModel.selectionLabel;
        diagnosticsLabel.textContent = `${diagnostics.length} diagnostics`;
        rangeLabel.textContent = `Range ${nextModel.range.start.line}:${nextModel.range.start.column} to ${nextModel.range.end.line}:${nextModel.range.end.column}`;
        characterLabel.textContent = `${nextModel.characterCount} characters`;
        currentDocument = {
          ...currentDocument,
          text: nextModel.text,
          version: currentDocument.version + 1,
          selection: nextSelection,
          sourceRange: selectionToSourceRange(nextSelection),
        };

        return currentDocument;
      };

      const onInput = () => {
        if (currentDocument.readOnly) {
          return;
        }

        const nextDocument = refreshSurfaceState();
        if (typeof update === 'function') {
          update(nextDocument);
        }
      };

      const onSelectionChange = () => {
        const selection = getSelectionFromEditor(editor);
        const nextModel = createTextEditorSurfaceModel({
          ...currentDocument,
          selection,
          sourceRange: selectionToSourceRange(selection),
        }, diagnostics);
        selectionLabel.textContent = nextModel.selectionLabel;
        rangeLabel.textContent = `Range ${nextModel.range.start.line}:${nextModel.range.start.column} to ${nextModel.range.end.line}:${nextModel.range.end.column}`;
      };

      editor.addEventListener('input', onInput);
      editor.addEventListener('keyup', onSelectionChange);
      editor.addEventListener('mouseup', onSelectionChange);
      editor.addEventListener('blur', onSelectionChange);

      const ownerDocument = editor.ownerDocument;
      if (ownerDocument && typeof ownerDocument.addEventListener === 'function') {
        const handleSelectionChange = () => {
          if (!editor.isConnected) {
            return;
          }

          const selection = ownerDocument.getSelection?.();
          if (!selection || selection.rangeCount === 0) {
            return;
          }

          if (!editor.contains(selection.anchorNode) && !editor.contains(selection.focusNode)) {
            return;
          }

          onSelectionChange();
        };

        ownerDocument.addEventListener('selectionchange', handleSelectionChange);
        return () => {
          editor.removeEventListener('input', onInput);
          editor.removeEventListener('keyup', onSelectionChange);
          editor.removeEventListener('mouseup', onSelectionChange);
          editor.removeEventListener('blur', onSelectionChange);
          ownerDocument.removeEventListener('selectionchange', handleSelectionChange);
        };
      }

      return () => {
        editor.removeEventListener('input', onInput);
        editor.removeEventListener('keyup', onSelectionChange);
        editor.removeEventListener('mouseup', onSelectionChange);
        editor.removeEventListener('blur', onSelectionChange);
      };
    },
  };
}
