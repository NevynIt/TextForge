import { json as jsonLanguage } from '@codemirror/lang-json';
import { markdown as markdownLanguage } from '@codemirror/lang-markdown';
import { xml as xmlLanguage } from '@codemirror/lang-xml';
import { yaml as yamlLanguage } from '@codemirror/lang-yaml';
import { StreamLanguage } from '@codemirror/language';
import { lua as luaMode } from '@codemirror/legacy-modes/mode/lua';
import {
  getLanguageDefinition,
  inferLanguageId,
  languageDefinitions,
} from '@textforge/core';
import { createItmCodeMirrorLanguageExtension } from '@textforge/itm';

const parserBackedLanguageFactories = {
  markdown: () => markdownLanguage(),
  itm: () => createItmCodeMirrorLanguageExtension(),
  lua: () => StreamLanguage.define(luaMode),
  json: () => jsonLanguage(),
  xml: () => xmlLanguage(),
  'bpmn-xml': () => xmlLanguage(),
  'archimate-exchange-xml': () => xmlLanguage(),
  svg: () => xmlLanguage(),
  yaml: () => yamlLanguage(),
};

const parserBackedLanguageIds = new Set(Object.keys(parserBackedLanguageFactories));

export function createCodeMirrorLanguageExtension(languageId) {
  const factory = languageId ? parserBackedLanguageFactories[languageId] : undefined;
  return typeof factory === 'function' ? factory() : undefined;
}

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
