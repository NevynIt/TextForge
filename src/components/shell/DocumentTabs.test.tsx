import { fireEvent, render } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import type { TextDocument } from "../../domain/types";
import { DocumentTabs } from "./DocumentTabs";

function createDocument(overrides: Partial<TextDocument> = {}): TextDocument {
  return {
    id: "doc-1",
    fileName: "readme.md",
    path: "/docs/readme.md",
    languageId: "text.markdown",
    text: "# Readme",
    version: 1,
    dirty: false,
    identity: {
      shapeCode: "CrRr",
      badgeLabel: "RM",
      color: "red"
    },
    createdAt: "2026-05-22T00:00:00.000Z",
    updatedAt: "2026-05-22T00:00:00.000Z",
    ...overrides
  };
}

describe("DocumentTabs", () => {
  it("forwards dropped files to the open handler when no tab reorder payload exists", () => {
    const onOpenFiles = vi.fn();
    const onReorderDocument = vi.fn();
    const files = [new File(["name,value\nA,1"], "sample.csv", { type: "text/csv" })] as unknown as FileList;
    const { container } = render(
      <DocumentTabs
        documents={[createDocument()]}
        activeDocumentId="doc-1"
        draggedTabId=""
        onSetDraggedTabId={vi.fn()}
        onSwitchDocument={vi.fn()}
        onReorderDocument={onReorderDocument}
        onCloseDocument={vi.fn()}
        onOpenFiles={onOpenFiles}
        onNewDocument={vi.fn()}
      />
    );

    fireEvent.drop(container.querySelector(".document-tabs")!, {
      dataTransfer: {
        files,
        types: ["Files"],
        getData: () => ""
      }
    });

    expect(onReorderDocument).not.toHaveBeenCalled();
    expect(onOpenFiles).toHaveBeenCalledWith(files);
  });
});
