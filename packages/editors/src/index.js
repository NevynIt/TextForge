import { EditorSelection, EditorState } from '@codemirror/state';
import { json as jsonLanguage } from '@codemirror/lang-json';
import { markdown as markdownLanguage } from '@codemirror/lang-markdown';
import { xml as xmlLanguage } from '@codemirror/lang-xml';
import { yaml as yamlLanguage } from '@codemirror/lang-yaml';
import { HighlightStyle, StreamLanguage, syntaxHighlighting } from '@codemirror/language';
import { lua as luaMode } from '@codemirror/legacy-modes/mode/lua';
import { tags } from '@lezer/highlight';
import { EditorView, lineNumbers } from '@codemirror/view';
import {
  createCapability,
  createCommand,
  createContributionManifest,
  getLanguageDefinition,
  inferLanguageId,
  languageDefinitions,
} from '@textforge/core';

export const editorCapabilities = [
  createCapability('@textforge/editors/capability/source', {
    description: 'Open text-backed workspace resources in the CodeMirror source editor.',
    defaultActive: true,
    scope: 'document',
  }),
  createCapability('@textforge/editors/capability/language-mode', {
    description: 'Switch the language mode for text-backed workspace resources.',
    defaultActive: true,
    scope: 'document',
  }),
];

const parserBackedLanguageFactories = {
  markdown: () => markdownLanguage(),
  lua: () => StreamLanguage.define(luaMode),
  json: () => jsonLanguage(),
  xml: () => xmlLanguage(),
  'bpmn-xml': () => xmlLanguage(),
  'archimate-exchange-xml': () => xmlLanguage(),
  svg: () => xmlLanguage(),
  yaml: () => yamlLanguage(),
};

const parserBackedLanguageIds = new Set(Object.keys(parserBackedLanguageFactories));

const textForgeHighlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.operatorKeyword, tags.modifier], color: '#67e8f9' },
  { tag: [tags.atom, tags.bool, tags.number], color: '#f4b860' },
  { tag: [tags.string, tags.special(tags.string), tags.regexp, tags.url], color: '#86efac' },
  { tag: [tags.propertyName, tags.attributeName], color: '#93c5fd' },
  { tag: [tags.typeName, tags.className, tags.tagName, tags.labelName, tags.namespace], color: '#5eead4' },
  { tag: [tags.comment, tags.quote, tags.meta], color: '#94a3b8', fontStyle: 'italic' },
  { tag: tags.heading, color: '#f4b860', fontWeight: '700' },
  { tag: [tags.bracket, tags.punctuation, tags.separator], color: '#cbd5e1' },
  { tag: tags.link, color: '#93c5fd', textDecoration: 'underline' },
  { tag: tags.strong, fontWeight: '700' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.invalid, color: '#fca5a5', textDecoration: 'underline wavy' },
]);

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
  localName: 'source',
  capabilities: ['@textforge/editors/capability/source'],
  defaultActive: true,
  editable: true,
  sourceRangeAware: true,
  languageIds: languageDefinitions.map((definition) => definition.id),
  placements: ['main', 'popup', 'auxiliary'],
  resourceRepresentations: ['text'],
  openWithPriority: 100,
};

export function createEditorCommandContributions(languageModes = listTextEditorLanguageModes()) {
  return languageModes.map((mode) =>
    createCommand(`editor.set-language:${mode.languageId}`, `Set language: ${mode.label}`, {
      category: 'editor',
      capabilities: ['@textforge/editors/capability/language-mode'],
      description: mode.parserBacked
        ? `Set the selected text resource to ${mode.label} using the parser-backed source editor mode.`
        : `Set the selected text resource to ${mode.label}; this format remains metadata-only in Phase 3.3.`,
      keywords: ['editor', 'language', 'mode', mode.languageId, mode.label],
      menu: { id: 'editor', label: 'Editor', groupOrder: 30, order: 10 },
      when: {
        workspaceReady: true,
        selectionRequired: true,
        selectionKinds: ['resource'],
        selectionRepresentations: ['text'],
      },
    }),
  );
}

export function createEditorContributionManifest(languageModes = listTextEditorLanguageModes()) {
  return createContributionManifest('@textforge/editors', {
    capabilities: editorCapabilities,
    commands: createEditorCommandContributions(languageModes),
    surfaces: [codeMirrorTextEditorSurfaceContribution],
  });
}

export const contributions = createEditorContributionManifest();

export function createTextEditorLanguageModeConfig(languageId, resource) {
  const resolvedLanguageId = getLanguageDefinition(languageId)
    ? languageId
    : inferLanguageId({
      path: resource?.path,
      mimeType: resource?.mimeType,
      fallback: 'plaintext',
    });
  const definition = getLanguageDefinition(resolvedLanguageId) ?? getLanguageDefinition('plaintext');
  return {
    languageId: definition.id,
    label: definition.label,
    mimeTypes: definition.mimeTypes,
    extensions: definition.extensions,
    parserBacked: parserBackedLanguageIds.has(definition.id),
    sourceEditor: true,
  };
}

export function listTextEditorLanguageModes() {
  return languageDefinitions.map((definition) => createTextEditorLanguageModeConfig(definition.id));
}

export function resolveTextEditorLanguageMode(document) {
  return createTextEditorLanguageModeConfig(document.languageId ?? document.resource.languageId, document.resource);
}

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

export function createTextEditorSurfaceModel(document, diagnostics = []) {
  const title = document.resource.path ?? document.resource.resourceId;
  const selection = document.selection ?? createTextEditorSelection(0);
  const text = normalizeLineEndings(document.text);
  const range = document.sourceRange ?? selectionToSourceRange(selection, text);
  const state = document.readOnly ? 'read-only' : 'editable';
  const languageMode = resolveTextEditorLanguageMode(document);
  const languageLabel = languageMode.label;

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
    languageMode,
  };
}

function createCodeMirrorSelection(selection, text) {
  const clamped = clampTextSelection(selection, text);
  return EditorSelection.range(clamped.anchor, clamped.head);
}

function createCodeMirrorLanguageExtension(languageId) {
  const factory = languageId ? parserBackedLanguageFactories[languageId] : undefined;
  return typeof factory === 'function' ? factory() : undefined;
}

function createCodeMirrorExtensions({ model, diagnostics, handleUpdate }) {
  const languageExtension = createCodeMirrorLanguageExtension(model.languageMode.languageId);
  return [
    lineNumbers(),
    ...(languageExtension ? [languageExtension] : []),
    syntaxHighlighting(textForgeHighlightStyle),
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

export function createCodeMirrorTextEditorSurface({ document, diagnostics = [], onChange, onUpdate } = {}) {
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
