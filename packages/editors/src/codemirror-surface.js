import { EditorSelection, EditorState, Prec } from '@codemirror/state';
import { codeFolding, foldGutter } from '@codemirror/language';
import { highlightSelectionMatches, search, searchKeymap } from '@codemirror/search';
import { crosshairCursor, EditorView, keymap, lineNumbers, rectangularSelection } from '@codemirror/view';
import {
  clampTextSelection,
  createTextEditorDocument,
  createTextEditorSelection,
  selectionToSourceRange,
} from './document.js';
import { createCodeMirrorBaselineExtensions, createCodeMirrorBaselineTheme } from './codemirror-baseline.js';
import { createCodeMirrorEditorCommandTarget, createCodeMirrorEditorKeymap } from './codemirror-commands.js';
import { createCodeMirrorLanguageExtension } from './language-modes.js';
import { createEditorSurfaceMarkup } from './surface-markup.js';
import { createTextEditorSurfaceModel } from './surface-model.js';
import { codeMirrorTextEditorSurfaceContribution } from './surface-contribution.js';

function createCodeMirrorSelection(selection, text) {
  const clamped = clampTextSelection(selection, text);
  return EditorSelection.range(clamped.anchor, clamped.head);
}

function getCodeMirrorCspNonce() {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const meta = document.querySelector('meta[name="textforge-csp-nonce"]');
  const nonce = meta?.getAttribute('content')?.trim();
  return nonce || undefined;
}

function isPrimaryPointerEvent(event) {
  return typeof event.button !== 'number' || event.button === 0;
}

export function selectCodeMirrorLineFromGutter(view, line, event) {
  if (!isPrimaryPointerEvent(event)) {
    return false;
  }

  event?.stopPropagation?.();
  const documentLine = view.state.doc.lineAt(line.from);
  const selectionTo = documentLine.to < view.state.doc.length ? documentLine.to + 1 : documentLine.to;
  view.dispatch({
    selection: EditorSelection.range(documentLine.from, selectionTo),
    scrollIntoView: true,
  });
  view.focus();
  return true;
}

function createCodeMirrorExtensions({ model, handleUpdate }) {
  const languageExtension = createCodeMirrorLanguageExtension(model.languageMode.languageId);
  const cspNonce = getCodeMirrorCspNonce();
  return [
    lineNumbers({
      domEventHandlers: {
        mousedown: selectCodeMirrorLineFromGutter,
      },
    }),
    foldGutter(),
    codeFolding(),
    search({
      top: true,
    }),
    highlightSelectionMatches(),
    rectangularSelection(),
    crosshairCursor(),
    ...createCodeMirrorBaselineExtensions(),
    ...(languageExtension ? [languageExtension] : []),
    EditorState.allowMultipleSelections.of(true),
    EditorState.readOnly.of(model.readOnly),
    EditorView.editable.of(!model.readOnly),
    ...(model.readOnly ? [EditorView.contentAttributes.of({ tabindex: '0', 'aria-readonly': 'true' })] : []),
    EditorView.lineWrapping,
    Prec.highest(keymap.of(createCodeMirrorEditorKeymap())),
    keymap.of(searchKeymap),
    EditorView.domEventHandlers({
      blur() {
        return false;
      },
    }),
    EditorView.updateListener.of(handleUpdate),
    ...(cspNonce ? [EditorView.cspNonce.of(cspNonce)] : []),
    createCodeMirrorBaselineTheme(),
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
        caretColor: '#3b82f6',
      },
      '.cm-panels': {
        backgroundColor: 'rgba(8, 15, 30, 0.94)',
        color: '#d9e4f2',
        borderBottom: '1px solid rgba(148, 163, 184, 0.14)',
      },
      '.cm-panels-top': {
        borderTopLeftRadius: '14px',
        borderTopRightRadius: '14px',
      },
      '.cm-search': {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 12px',
      },
      '.cm-search label': {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.82rem',
      },
      '.cm-search input, .cm-search button, .cm-search select, .cm-search .cm-button': {
        font: 'inherit',
      },
      '.cm-search input': {
        minHeight: '30px',
        padding: '0 10px',
        color: '#e2e8f0',
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        borderRadius: '10px',
      },
      '.cm-search button, .cm-search .cm-button': {
        appearance: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '30px',
        padding: '0 10px',
        color: '#d9e4f2',
        background: 'linear-gradient(180deg, rgba(27, 39, 58, 0.98), rgba(16, 24, 38, 0.98))',
        border: '1px solid rgba(109, 137, 183, 0.32)',
        borderRadius: '10px',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        cursor: 'pointer',
      },
      '.cm-search button:hover, .cm-search .cm-button:hover': {
        background: 'linear-gradient(180deg, rgba(33, 48, 70, 0.98), rgba(20, 29, 44, 0.98))',
      },
      '.cm-search button:disabled, .cm-search .cm-button:disabled': {
        cursor: 'default',
        opacity: '0.48',
      },
      '.cm-search .cm-button': {
        margin: 0,
      },
      '.cm-search [name=\"close\"]': {
        marginLeft: 'auto',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: '#f7f7f7',
      },
      '.cm-selectionBackground': {
        background: '#2563eb !important',
      },
      '.cm-searchMatch': {
        backgroundColor: 'rgba(250, 204, 21, 0.2)',
        outline: '1px solid rgba(250, 204, 21, 0.45)',
      },
      '.cm-searchMatch.cm-searchMatch-selected': {
        backgroundColor: 'rgba(250, 204, 21, 0.34)',
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

export function createCodeMirrorTextEditorSurface({
  document,
  diagnostics = [],
  onChange,
  onMountCommandTarget,
  onUpdate,
} = {}) {
  const baseDocument = document ?? createTextEditorDocument(
    { resourceId: 'text-editor-document', kind: 'resource', representation: 'text' },
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
      const handleStateUpdate = typeof handlers.onUpdate === 'function' ? handlers.onUpdate : onUpdate;
      let currentDocument = baseDocument;

      const syncViewState = (partialViewState = {}) => {
        currentDocument = {
          ...currentDocument,
          viewState: {
            ...(currentDocument.viewState ?? {}),
            ...partialViewState,
          },
        };
        if (typeof handleStateUpdate === 'function') {
          handleStateUpdate(currentDocument);
        }
      };

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
          viewState: currentDocument.viewState,
        };
        if (typeof handleStateUpdate === 'function') {
          handleStateUpdate(currentDocument);
        }

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
        extensions: createCodeMirrorExtensions({ model, handleUpdate }),
      });

      const view = new EditorView({
        state,
        parent: editorHost,
      });
      const disposeCommandTarget = typeof onMountCommandTarget === 'function'
        ? onMountCommandTarget(createCodeMirrorEditorCommandTarget(view))
        : undefined;
      const restoreScrollTop = currentDocument.viewState?.scrollTop;
      const restoreScrollLeft = currentDocument.viewState?.scrollLeft;
      if (typeof restoreScrollTop === 'number') {
        view.scrollDOM.scrollTop = restoreScrollTop;
      }
      if (typeof restoreScrollLeft === 'number') {
        view.scrollDOM.scrollLeft = restoreScrollLeft;
      }
      view.focus();
      const handleScroll = () => {
        syncViewState({
          scrollTop: view.scrollDOM.scrollTop,
          scrollLeft: view.scrollDOM.scrollLeft,
        });
      };
      const handleFocus = () => {
        syncViewState({ focused: true });
      };
      const handleBlur = () => {
        syncViewState({ focused: false });
      };
      view.scrollDOM.addEventListener('scroll', handleScroll, { passive: true });
      view.dom.addEventListener('focusin', handleFocus);
      view.dom.addEventListener('focusout', handleBlur);
      editorHost.dataset.editorEngine = 'codemirror-6';
      editorHost.textforgeCodeMirrorView = view;
      return () => {
        disposeCommandTarget?.();
        view.scrollDOM.removeEventListener('scroll', handleScroll);
        view.dom.removeEventListener('focusin', handleFocus);
        view.dom.removeEventListener('focusout', handleBlur);
        view.destroy();
      };
    },
  };
}
