import { Languages, Workflow } from "lucide-preact";
import type { LanguageDefinition, PipelineContribution, TextDocument } from "../../domain/types";
import { DocumentBadge } from "../DocumentBadge";
import type { CodeEditorCommand } from "../CodeEditor";

export function ActionBar({
  activeDocument,
  languages,
  pipelines,
  renamingDocumentId,
  renameDraft,
  onRenameDraftChange,
  onFinishRename,
  onCancelRename,
  onStartRename,
  onUpdateLanguage,
  onRunPipeline,
  onSetEditorCommand
}: {
  activeDocument?: TextDocument;
  languages: LanguageDefinition[];
  pipelines: PipelineContribution[];
  renamingDocumentId: string;
  renameDraft: string;
  onRenameDraftChange: (value: string) => void;
  onFinishRename: () => void;
  onCancelRename: () => void;
  onStartRename: (document: TextDocument) => void;
  onUpdateLanguage: (languageId: string) => void;
  onRunPipeline: (pipelineId: string) => void;
  onSetEditorCommand: (updater: (current: CodeEditorCommand | undefined) => CodeEditorCommand) => void;
}) {
  return (
    <section class="actionbar">
      {activeDocument ? (
        <div class="active-document-chip">
          <DocumentBadge identity={activeDocument.identity} />
          {renamingDocumentId === activeDocument.id ? (
            <input
              class="rename-input"
              value={renameDraft}
              autoFocus
              onInput={(event) => onRenameDraftChange(event.currentTarget.value)}
              onBlur={onFinishRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onFinishRename();
                } else if (event.key === "Escape") {
                  onCancelRename();
                }
              }}
            />
          ) : (
            <button type="button" class="document-title-button" title="Rename file" onClick={() => onStartRename(activeDocument)}>
              <strong>{activeDocument.fileName}</strong>
            </button>
          )}
        </div>
      ) : null}
      <label title="Language" aria-label="Language">
        <Languages size={16} />
        <select value={activeDocument?.languageId || "text.plain"} onChange={(event) => onUpdateLanguage(event.currentTarget.value)} disabled={!activeDocument}>
          {languages.map((language) => (
            <option value={language.id} key={language.id}>
              {language.name}
            </option>
          ))}
        </select>
      </label>
      <div class="pipeline-picker" title="Pipeline" aria-label="Pipeline">
        <Workflow size={16} />
        {pipelines.length === 1 ? (
          <button type="button" onClick={() => onRunPipeline(pipelines[0].id)} disabled={!activeDocument}>
            {pipelines[0].name}
          </button>
        ) : (
          <select value="" onChange={(event) => onRunPipeline(event.currentTarget.value)} disabled={!activeDocument || !pipelines.length}>
            <option value="">{pipelines.length ? "Choose action..." : "No actions"}</option>
            {pipelines.map((pipeline) => (
              <option value={pipeline.id} key={pipeline.id}>
                {pipeline.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {activeDocument && isIndentedTextLanguage(activeDocument.languageId) ? (
        <>
          <button
            type="button"
            title="Fold top directives"
            onClick={() => onSetEditorCommand((current) => ({ revision: (current?.revision || 0) + 1, action: "fold-leading-directives" }))}
          >
            Fold directives
          </button>
          <button
            type="button"
            title="Fold all ITM sections"
            onClick={() => onSetEditorCommand((current) => ({ revision: (current?.revision || 0) + 1, action: "fold-all" }))}
          >
            Fold all
          </button>
          <button
            type="button"
            title="Unfold all ITM sections"
            onClick={() => onSetEditorCommand((current) => ({ revision: (current?.revision || 0) + 1, action: "unfold-all" }))}
          >
            Unfold all
          </button>
        </>
      ) : null}
      <span class="document-status">
        {activeDocument ? `${activeDocument.languageId} - v${activeDocument.version} - ${activeDocument.dirty ? "dirty" : "clean"}` : "No document"}
      </span>
    </section>
  );
}

function isIndentedTextLanguage(languageId: string): boolean {
  return languageId === "text.itm" || languageId === "text.indented-tree";
}
