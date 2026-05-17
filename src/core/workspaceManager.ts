import type { DocumentIdentity, TextDocument } from "../domain/types";
import { createId } from "./id";

export class WorkspaceManager {
  private records = new Map<string, TextDocument>();
  private order: string[] = [];
  private activeDocumentId: string | null = null;

  openDocument(input: Partial<TextDocument> & Pick<TextDocument, "text" | "languageId">): TextDocument {
    const now = new Date().toISOString();
    const id = input.id || createId("doc");
    const document: TextDocument = {
      id,
      fileName: input.fileName || "untitled.txt",
      languageId: input.languageId || "text.plain",
      text: input.text || "",
      version: input.version || 1,
      dirty: input.dirty ?? false,
      identity: normalizeDocumentIdentity(input.identity, id),
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
    for (const document of documents) {
      this.records.set(document.id, {
        ...document,
        identity: normalizeDocumentIdentity(document.identity, document.id)
      });
      this.order.push(document.id);
    }
    this.activeDocumentId = activeDocumentId && this.records.has(activeDocumentId) ? activeDocumentId : this.order[0] || null;
  }

  snapshot(): { documents: TextDocument[]; activeDocumentId: string | null } {
    return {
      documents: this.listDocuments(),
      activeDocumentId: this.activeDocumentId
    };
  }

}

const shapeCodes = ["C", "R", "W", "S"];
const shapeColorCodes = ["r", "g", "b", "y", "p", "c", "u", "w"];
const identityPalette = ["#e35757", "#5aa36f", "#4c78c8", "#d7a12f", "#8b67c7", "#4bb3b4", "#bfc4ca", "#ffffff"];

export function createDocumentIdentity(seed: string): DocumentIdentity {
  const source = seed || createId("identity");
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }
  const shapeCode = createShapeCode(hash);
  return {
    color: identityPalette[hash % identityPalette.length],
    badgeLabel: shapeCode,
    badgeKind: "shapez-one-layer",
    shapeCode
  };
}

function normalizeDocumentIdentity(identity: DocumentIdentity | undefined, seed: string): DocumentIdentity {
  if (identity?.shapeCode) {
    return identity;
  }
  const generated = createDocumentIdentity(seed);
  return {
    ...generated,
    color: identity?.color || generated.color,
    badgeKind: "shapez-one-layer"
  };
}

function createShapeCode(seed: number): string {
  let value = seed || 1;
  const quadrants: string[] = [];
  for (let index = 0; index < 4; index += 1) {
    value = Math.imul(value ^ (index + 17), 2654435761) >>> 0;
    const shape = shapeCodes[value % shapeCodes.length];
    value = Math.imul(value ^ (index + 29), 1597334677) >>> 0;
    const color = shapeColorCodes[value % shapeColorCodes.length];
    quadrants.push(`${shape}${color}`);
  }
  return quadrants.join("");
}
