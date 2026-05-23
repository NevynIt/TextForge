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

export function createTextEditorSurfaceModel(document, diagnostics = []) {
  const title = document.resource.path ?? document.resource.resourceId;
  const selection = document.selection ?? createTextEditorSelection(0);
  const range = document.sourceRange ?? selectionToSourceRange(selection);
  const state = document.readOnly ? 'read-only' : 'editable';
  const languageLabel = document.languageId ?? document.resource.languageId ?? 'plain text';

  return {
    id: `text-editor:${document.resource.resourceId}`,
    title,
    summary: `${state} text surface for ${languageLabel}.`,
    state,
    languageLabel,
    selection,
    range,
    diagnostics,
    text: document.text,
    previewHtml: `
      <section class="editor-frame">
        <header class="editor-frame__header">
          <div>
            <span class="editor-frame__eyebrow">Text editor</span>
            <h4>${escapeHtml(title)}</h4>
          </div>
          <div class="editor-frame__meta">
            <span>${escapeHtml(languageLabel)}</span>
            <span>${state}</span>
          </div>
        </header>
        <textarea
          class="editor-frame__textarea"
          data-editor-input
          spellcheck="false"
          aria-label="${escapeHtml(title)}"
        >${escapeHtml(document.text)}</textarea>
        <footer class="editor-frame__footer">
          <span>Range ${range.start.line}:${range.start.column} to ${range.end.line}:${range.end.column}</span>
          <span>${diagnostics.length} diagnostics</span>
        </footer>
      </section>
    `,
  };
}

export function createCodeMirrorTextEditorSurface({ document, diagnostics = [], onChange } = {}) {
  const model = createTextEditorSurfaceModel(document, diagnostics);
  return {
    id: model.id,
    contribution: codeMirrorTextEditorSurfaceContribution,
    document,
    diagnostics,
    model,
    html: model.previewHtml,
    bind(container, handlers = {}) {
      const editor = container.querySelector('[data-editor-input]');
      if (!editor) {
        return () => {};
      }

      const update = typeof handlers.onChange === 'function' ? handlers.onChange : onChange;
      if (typeof update !== 'function' || document.readOnly) {
        return () => {};
      }

      editor.addEventListener('input', () => {
        const nextDocument = applyTextEdit(document, {
          kind: 'replace',
          start: 0,
          end: document.text.length,
          text: editor.value,
        });
        update(nextDocument);
      });

      return () => {};
    },
  };
}
