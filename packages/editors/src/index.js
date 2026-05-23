import { EditorSelection, EditorState } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';

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

function offsetToSourcePosition(text, offset) {
  const normalizedText = normalizeLineEndings(text);
  const clampedOffset = Math.min(Math.max(0, offset), normalizedText.length);
  if (normalizedText.length === 0 && offset > 0) {
    return {
      line: 1,
      column: offset + 1,
      offset,
    };
  }

  let line = 1;
  let lineStart = 0;

  for (let index = 0; index < clampedOffset; index += 1) {
    if (normalizedText[index] === '\n') {
      line += 1;
      lineStart = index + 1;
    }
  }

  return {
    line,
    column: clampedOffset - lineStart + 1,
    offset: clampedOffset,
  };
}

export function selectionToSourceRange(selection, text = '') {
  const start = Math.min(selection.anchor, selection.head);
  const end = Math.max(selection.anchor, selection.head);
  return {
    start: offsetToSourcePosition(text, start),
    end: offsetToSourcePosition(text, end),
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
  const position = offsetToSourcePosition(text, start);
  const span = end - start;
  return `L${position.line}:C${position.column}${span > 0 ? `, ${span} selected` : ''}`;
}

function createEditorSurfaceMarkup(model) {
  const diagnosticsCount = model.diagnostics.length;
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

export function createTextEditorSurfaceModel(document, diagnostics = []) {
  const title = document.resource.path ?? document.resource.resourceId;
  const selection = document.selection ?? createTextEditorSelection(0);
  const text = normalizeLineEndings(document.text);
  const range = document.sourceRange ?? selectionToSourceRange(selection, text);
  const state = document.readOnly ? 'read-only' : 'editable';
  const languageLabel = document.languageId ?? document.resource.languageId ?? 'plain text';

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
    engine: 'codemirror-6',
  };
}

function createCodeMirrorSelection(selection, text) {
  const clamped = clampTextSelection(selection, text);
  return EditorSelection.range(clamped.anchor, clamped.head);
}

function createCodeMirrorExtensions({ model, diagnostics, handleUpdate }) {
  return [
    lineNumbers(),
    EditorState.readOnly.of(model.readOnly),
    EditorView.editable.of(!model.readOnly),
    EditorView.lineWrapping,
    EditorView.domEventHandlers({
      blur() {
        return false;
      },
    }),
    EditorView.updateListener.of(handleUpdate),
    EditorView.theme({
      '&': {
        minHeight: '100%',
        width: '100%',
        backgroundColor: 'rgba(2, 6, 23, 0.7)',
        color: '#e2e8f0',
        border: '1px solid rgba(148, 163, 184, 0.14)',
        borderRadius: '14px',
        overflow: 'hidden',
      },
      '&.cm-focused': {
        outline: '2px solid rgba(72, 182, 168, 0.48)',
        outlineOffset: '2px',
      },
      '.cm-scroller': {
        fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
        lineHeight: '1.6',
        minHeight: '280px',
      },
      '.cm-content': {
        padding: '16px',
      },
      '.cm-line': {
        padding: '0',
      },
      '.cm-gutters': {
        backgroundColor: 'rgba(2, 6, 23, 0.56)',
        color: '#94a3b8',
        borderRight: '1px solid rgba(148, 163, 184, 0.14)',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        padding: '0 10px',
      },
    }),
  ];
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

      const editorHost = container.querySelector('[data-codemirror-host]');
      const selectionLabel = container.querySelector('.editor-frame__diagnostics span:last-child');
      const diagnosticsLabel = container.querySelector('.editor-frame__diagnostics span:first-child');
      const rangeLabel = container.querySelector('.editor-frame__footer span:first-child');
      const characterLabel = container.querySelector('.editor-frame__footer span:last-child');
      if (!editorHost || !selectionLabel || !diagnosticsLabel || !rangeLabel || !characterLabel) {
        return () => {};
      }

      const update = typeof handlers.onChange === 'function' ? handlers.onChange : onChange;
      let currentDocument = baseDocument;

      const syncSurfaceState = (viewUpdate) => {
        const text = viewUpdate.state.doc.toString();
        const mainSelection = viewUpdate.state.selection.main;
        const nextSelection = createTextEditorSelection(mainSelection.anchor, mainSelection.head);
        const nextModel = createTextEditorSurfaceModel({
          ...currentDocument,
          text,
          selection: nextSelection,
          sourceRange: selectionToSourceRange(nextSelection, text),
        }, diagnostics);

        selectionLabel.textContent = nextModel.selectionLabel;
        diagnosticsLabel.textContent = `${diagnostics.length} diagnostics`;
        rangeLabel.textContent = `Range ${nextModel.range.start.line}:${nextModel.range.start.column} to ${nextModel.range.end.line}:${nextModel.range.end.column}`;
        characterLabel.textContent = `${nextModel.characterCount} characters`;
        currentDocument = {
          ...currentDocument,
          text: nextModel.text,
          version: viewUpdate.docChanged ? currentDocument.version + 1 : currentDocument.version,
          selection: nextSelection,
          sourceRange: selectionToSourceRange(nextSelection, text),
        };

        return currentDocument;
      };

      const handleUpdate = (viewUpdate) => {
        if (!viewUpdate.docChanged && !viewUpdate.selectionSet) {
          return;
        }

        const nextDocument = syncSurfaceState(viewUpdate);
        if (viewUpdate.docChanged && typeof update === 'function') {
          update(nextDocument);
        }
      };

      const state = EditorState.create({
        doc: model.text,
        selection: createCodeMirrorSelection(model.selection, model.text),
        extensions: createCodeMirrorExtensions({ model, diagnostics, handleUpdate }),
      });

      const view = new EditorView({
        state,
        parent: editorHost,
      });
      editorHost.dataset.editorEngine = 'codemirror-6';
      editorHost.textforgeCodeMirrorView = view;
      return () => {
        view.destroy();
      };
    },
  };
}
