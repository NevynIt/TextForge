import { fireEvent, render } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { TopBar } from "./TopBar";

function createFileList(files: File[]): FileList {
  return {
    ...files,
    length: files.length,
    item: (index: number) => files[index] || null
  } as FileList;
}

describe("TopBar", () => {
  it("forwards selected files to the import handler", () => {
    const onOpenFiles = vi.fn();
    const { container } = render(
      <TopBar
        ready
        hasActiveDocument={false}
        hasDiagnosticsAttention={false}
        hasPluginAttention={false}
        hasTrace={false}
        sidebarVisible
        onNewDocument={vi.fn()}
        onOpenFiles={onOpenFiles}
        onImportZip={vi.fn()}
        onDownload={vi.fn()}
        onExportWorkspace={vi.fn()}
        onRunDiagnostics={vi.fn()}
        onOpenPluginManager={vi.fn()}
        onOpenTrace={vi.fn()}
        onOpenLuaConsole={vi.fn()}
        onOpenLuaScripts={vi.fn()}
        onToggleSidebar={vi.fn()}
      />
    );

    const input = container.querySelector('.file-button input[type="file"]') as HTMLInputElement | null;
    expect(input).toBeTruthy();
    const files = createFileList([new File(["# Notes"], "notes.md", { type: "text/markdown" })]);
    Object.defineProperty(input!, "files", { configurable: true, value: files });

    fireEvent.change(input!);

    expect(onOpenFiles).toHaveBeenCalledWith(files);
  });
});
