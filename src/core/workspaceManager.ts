import type { TextDocument } from "../domain/types";
import { createId } from "./id";

export class WorkspaceManager {
  private records = new Map<string, TextDocument>();
  private order: string[] = [];
  private activeDocumentId: string | null = null;

  openDocument(input: Partial<TextDocument> & Pick<TextDocument, "text" | "languageId">): TextDocument {
    const now = new Date().toISOString();
    const document: TextDocument = {
      id: input.id || createId("doc"),
      fileName: input.fileName || "untitled.txt",
      languageId: input.languageId || "text.plain",
      text: input.text || "",
      version: input.version || 1,
      dirty: input.dirty ?? false,
      createdAt: input.createdAt || now,
      updatedAt: input.updatedAt || now
    };
    this.records.set(document.id, document);
    this.order.push(document.id);
    this.activeDocumentId = document.id;
    this.recomputeDuplicateNames();
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
    this.recomputeDuplicateNames();
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
      this.records.set(document.id, document);
      this.order.push(document.id);
    }
    this.activeDocumentId = activeDocumentId && this.records.has(activeDocumentId) ? activeDocumentId : this.order[0] || null;
    this.recomputeDuplicateNames();
  }

  snapshot(): { documents: TextDocument[]; activeDocumentId: string | null } {
    return {
      documents: this.listDocuments(),
      activeDocumentId: this.activeDocumentId
    };
  }

  private recomputeDuplicateNames(): void {
    const counts = new Map<string, number>();
    for (const id of this.order) {
      const document = this.records.get(id);
      if (!document) {
        continue;
      }
      const baseName = document.fileName.replace(/\s+\(\d+\)(\.[^.]+)?$/, "$1") || "untitled.txt";
      const next = (counts.get(baseName) || 0) + 1;
      counts.set(baseName, next);
      this.records.set(id, {
        ...document,
        fileName: next === 1 ? baseName : withDuplicateSuffix(baseName, next)
      });
    }
  }
}

function withDuplicateSuffix(fileName: string, index: number): string {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0) {
    return `${fileName} (${index})`;
  }
  return `${fileName.slice(0, dot)} (${index})${fileName.slice(dot)}`;
}
