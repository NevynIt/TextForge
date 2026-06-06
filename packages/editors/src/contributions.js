import { createCommand, createContributionManifest } from '@textforge/core';
import { editorCapabilities } from './capabilities.js';
import { listTextEditorLanguageModes } from './language-modes.js';
import { createTextEditorDocument } from './document.js';
import { createCodeMirrorTextEditorSurface } from './codemirror-surface.js';
import { codeMirrorTextEditorSurfaceContribution } from './surface-contribution.js';

codeMirrorTextEditorSurfaceContribution.open = function openTextEditorSurface(execution = {}) {
  const resource = execution.resource;
  const workspaceResource = execution.workspaceResource;
  if (!workspaceResource || workspaceResource.representation !== 'text') {
    return undefined;
  }

  const document = execution.getTextDocument?.()
    ?? createTextEditorDocument(
      resource,
      workspaceResource.text,
      {
        languageId: workspaceResource.languageId,
        readOnly: execution.readOnly ?? false,
      },
    );
  execution.setTextDocument?.(document);
  const surface = createCodeMirrorTextEditorSurface({
    document,
    diagnostics: execution.diagnostics ?? [],
    onUpdate(nextDocument) {
      execution.setTextDocument?.(nextDocument);
    },
    onChange(nextDocument) {
      const persistedDocument = execution.persistTextDocument?.(nextDocument) ?? nextDocument;
      execution.setTextDocument?.(persistedDocument);
      execution.markSessionCurrent?.();
    },
  });
  return {
    mountId: `${execution.session?.id ?? 'surface'}:${surface.model.languageMode.languageId}:${this.id}`,
    summary: surface.model.summary,
    detail: surface.model.languageLabel,
    readOnly: surface.model.readOnly,
    inspectorSections: [],
    controls: execution.createLanguageControl
      ? surface.model.readOnly
        ? []
        : [execution.createLanguageControl(workspaceResource, surface.model)]
      : [],
    surface,
  };
};

export { codeMirrorTextEditorSurfaceContribution };

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
