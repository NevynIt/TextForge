import type { DocumentIdentity, TextDocument } from "../domain/types";
import { createId } from "./id";
import { createUniqueDocumentIdentity, documentIdentityForShapezCode, isValidShapezOneLayerCode } from "./shapezBadges";

export class WorkspaceManager {
  private records = new Map<string, TextDocument>();
  private order: string[] = [];
  private activeDocumentId: string | null = null;
  private openSequence = 0;

  openDocument(input: Partial<TextDocument> & Pick<TextDocument, "text" | "languageId">): TextDocument {
    const now = new Date().toISOString();
    const id = input.id || createId("doc");
    const fileName = input.fileName || "untitled.txt";
    const languageId = input.languageId || "text.plain";
    const existing = existingShapeCodes(this.records.values());
    const sequence = this.openSequence;
    this.openSequence += 1;
    const document: TextDocument = {
      id,
      fileName,
      languageId,
      text: input.text || "",
      version: input.version || 1,
      dirty: input.dirty ?? false,
      identity: normalizeDocumentIdentity(input.identity, documentIdentitySeed({ id, fileName, languageId }, sequence), existing),
      createdAt: input.createdAt || now,
      updatedAt: input.updatedAt || now
    };
    this.records.set(document.id, document);
    this.order.push(document.id);
    this.activeDocumentId = document.id;
    return document;
  }

  listDocuments(): TextDocument[] {
    return this.order.map((id) => this.records.get(id)).filter(Boolean) as TextDocument[];
  }

  getActiveDocument(): TextDocument | undefined {
    return this.activeDocumentId ? this.records.get(this.activeDocumentId) : undefined;
  }

  getActiveDocumentId(): string | null {
    return this.activeDocumentId;
  }

  getDocument(id: string): TextDocument | undefined {
    return this.records.get(id);
  }

  switchDocument(id: string): TextDocument | undefined {
    if (!this.records.has(id)) {
      return undefined;
    }
    this.activeDocumentId = id;
    return this.records.get(id);
  }

  closeDocument(id: string): TextDocument | undefined {
    const document = this.records.get(id);
    if (!document) {
      return undefined;
    }
    const index = this.order.indexOf(id);
    this.records.delete(id);
    this.order = this.order.filter((candidate) => candidate !== id);
    if (this.activeDocumentId === id) {
      this.activeDocumentId = this.order[index] || this.order[index - 1] || null;
    }
    return document;
  }

  updateText(id: string, text: string): TextDocument | undefined {
    const document = this.records.get(id);
    if (!document || document.text === text) {
      return document;
    }
    const updated = {
      ...document,
      text,
      version: document.version + 1,
      dirty: true,
      updatedAt: new Date().toISOString()
    };
    this.records.set(id, updated);
    return updated;
  }

  updateLanguage(id: string, languageId: string): TextDocument | undefined {
    const document = this.records.get(id);
    if (!document || document.languageId === languageId) {
      return document;
    }
    const updated = {
      ...document,
      languageId,
      version: document.version + 1,
      dirty: true,
      updatedAt: new Date().toISOString()
    };
    this.records.set(id, updated);
    return updated;
  }

  updateFileName(id: string, fileName: string): TextDocument | undefined {
    const document = this.records.get(id);
    const nextFileName = fileName.trim() || "untitled.txt";
    if (!document || document.fileName === nextFileName) {
      return document;
    }
    const updated = {
      ...document,
      fileName: nextFileName,
      version: document.version + 1,
      dirty: true,
      updatedAt: new Date().toISOString()
    };
    this.records.set(id, updated);
    return updated;
  }

  reorderDocument(id: string, targetId?: string, position: "before" | "after" | "end" = "before"): void {
    if (!this.records.has(id)) {
      return;
    }
    const nextOrder = this.order.filter((candidate) => candidate !== id);
    if (!targetId || position === "end") {
      nextOrder.push(id);
      this.order = nextOrder;
      return;
    }
    const targetIndex = nextOrder.indexOf(targetId);
    if (targetIndex < 0) {
      nextOrder.push(id);
      this.order = nextOrder;
      return;
    }
    nextOrder.splice(position === "after" ? targetIndex + 1 : targetIndex, 0, id);
    this.order = nextOrder;
  }

  markClean(id: string): void {
    const document = this.records.get(id);
    if (document) {
      this.records.set(id, { ...document, dirty: false });
    }
  }

  restore(documents: TextDocument[], activeDocumentId?: string): void {
    this.records.clear();
    this.order = [];
    const existing = new Set<string>();
    documents.forEach((document, index) => {
      this.records.set(document.id, {
        ...document,
        identity: normalizeDocumentIdentity(
          document.identity,
          documentIdentitySeed(
            {
              id: document.id,
              fileName: document.fileName || "untitled.txt",
              languageId: document.languageId || "text.plain"
            },
            index
          ),
          existing
        )
      });
      this.order.push(document.id);
    });
    this.openSequence = documents.length;
    this.activeDocumentId = activeDocumentId && this.records.has(activeDocumentId) ? activeDocumentId : this.order[0] || null;
  }

  snapshot(): { documents: TextDocument[]; activeDocumentId: string | null } {
    return {
      documents: this.listDocuments(),
      activeDocumentId: this.activeDocumentId
    };
  }

}

function normalizeDocumentIdentity(identity: DocumentIdentity | undefined, seed: string, existing: Set<string>): DocumentIdentity {
  const preferredCode = identity?.shapeCode || identity?.badgeLabel;
  if (isValidShapezOneLayerCode(preferredCode) && !existing.has(preferredCode)) {
    existing.add(preferredCode);
    return {
      ...identity,
      ...documentIdentityForShapezCode(preferredCode),
      badgeLabel: preferredCode,
      badgeKind: "shapez-one-layer",
      shapeCode: preferredCode
    };
  }
  return createUniqueDocumentIdentity(seed, existing, preferredCode);
}

function existingShapeCodes(documents: Iterable<TextDocument>): Set<string> {
  const existing = new Set<string>();
  for (const document of documents) {
    const code = document.identity?.shapeCode || document.identity?.badgeLabel;
    if (isValidShapezOneLayerCode(code)) {
      existing.add(code);
    }
  }
  return existing;
}

function documentIdentitySeed(
  document: { id: string; fileName: string; languageId: string },
  sequence: number
): string {
  return `${document.id}|${document.fileName}|${document.languageId}|${sequence}`;
}
