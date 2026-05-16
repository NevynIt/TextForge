import type { DocumentIdentity, TextDocument } from "../domain/types";
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
      identity: input.identity || createDocumentIdentity(input.id || ""),
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
        identity: document.identity || createDocumentIdentity(document.id)
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

const identityPalette = [
  "#3a6ea5",
  "#7b8f3a",
  "#b26b2e",
  "#8f5c8a",
  "#2f8f83",
  "#9a514e",
  "#5967b1",
  "#8a6b2f",
  "#49775d",
  "#6d5a9c"
];

export function createDocumentIdentity(seed: string): DocumentIdentity {
  const source = seed || createId("identity");
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }
  const first = String.fromCharCode(65 + (hash % 26));
  const second = ((Math.floor(hash / 26) % 9) + 1).toString();
  return {
    color: identityPalette[hash % identityPalette.length],
    badgeLabel: `${first}${second}`,
    badgeKind: "generated"
  };
}
