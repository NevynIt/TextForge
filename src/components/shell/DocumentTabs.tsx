import { X } from "lucide-preact";
import { DocumentBadge } from "../DocumentBadge";
import type { TextDocument } from "../../domain/types";

export function DocumentTabs({
  documents,
  activeDocumentId,
  draggedTabId,
  onSetDraggedTabId,
  onSwitchDocument,
  onReorderDocument,
  onCloseDocument,
  onOpenFiles,
  onNewDocument
}: {
  documents: TextDocument[];
  activeDocumentId: string | null;
  draggedTabId: string;
  onSetDraggedTabId: (id: string) => void;
  onSwitchDocument: (id: string) => void;
  onReorderDocument: (id: string, targetId?: string, position?: "before" | "after" | "end") => void;
  onCloseDocument: (id: string) => void;
  onOpenFiles: (files: FileList | null) => void;
  onNewDocument: () => void;
}) {
  return (
    <nav
      class="document-tabs"
      onDragOver={(event) => {
        if (event.dataTransfer?.types.includes("Files") || event.dataTransfer?.types.includes("application/x-textforge-document-id")) {
          event.preventDefault();
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        const transfer = event.dataTransfer;
        const tabId = transfer?.getData("application/x-textforge-document-id") || draggedTabId;
        if (tabId) {
          onReorderDocument(tabId, undefined, "end");
          onSetDraggedTabId("");
        } else if (transfer) {
          onOpenFiles(transfer.files);
        }
      }}
      onDblClick={(event) => {
        if (event.target === event.currentTarget) {
          onNewDocument();
        }
      }}
    >
      {documents.map((document) => (
        <button
          type="button"
          class={document.id === activeDocumentId ? "active" : ""}
          onClick={() => onSwitchDocument(document.id)}
          key={document.id}
          draggable
          onDragStart={(event) => {
            onSetDraggedTabId(document.id);
            event.dataTransfer?.setData("application/x-textforge-document-id", document.id);
            event.dataTransfer?.setData("text/plain", document.fileName);
            if (event.dataTransfer) {
              event.dataTransfer.effectAllowed = "move";
            }
          }}
          onDragOver={(event) => {
            if (event.dataTransfer?.types.includes("application/x-textforge-document-id")) {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }
          }}
          onDrop={(event) => {
            const sourceId = event.dataTransfer?.getData("application/x-textforge-document-id") || draggedTabId;
            if (!sourceId) {
              return;
            }
            event.preventDefault();
            event.stopPropagation();
            const rect = event.currentTarget.getBoundingClientRect();
            onReorderDocument(sourceId, document.id, event.clientX > rect.left + rect.width / 2 ? "after" : "before");
            onSetDraggedTabId("");
          }}
          onDragEnd={() => onSetDraggedTabId("")}
          title={`${document.id} - ${document.languageId} - v${document.version}`}
        >
          <DocumentBadge identity={document.identity} />
          <span>{document.dirty ? "* " : ""}{document.fileName}</span>
          <X
            size={14}
            onClick={(event) => {
              event.stopPropagation();
              onCloseDocument(document.id);
            }}
          />
        </button>
      ))}
    </nav>
  );
}
