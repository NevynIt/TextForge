import type { WorkspaceFile, WorkspaceImportFile } from "./workspaceTypes";

const TEXT_MEDIA_PREFIXES = ["text/", "application/json", "application/xml"];

export async function fileListToWorkspaceImports(files: FileList, inferLanguage: (fileName: string) => string): Promise<WorkspaceImportFile[]> {
  const imports: WorkspaceImportFile[] = [];
  for (const file of Array.from(files)) {
    imports.push(await fileToWorkspaceImport(file, inferLanguage));
  }
  return imports;
}

export async function fileToWorkspaceImport(file: File, inferLanguage: (fileName: string) => string): Promise<WorkspaceImportFile> {
  if (looksLikeTextFile(file)) {
    return {
      path: file.name,
      fileKind: "text",
      languageId: inferLanguage(file.name),
      mediaType: file.type || undefined,
      text: await file.text(),
      origin: "uploaded"
    };
  }
  return {
    path: file.name,
    fileKind: "binary",
    mediaType: file.type || "application/octet-stream",
    blob: file,
    origin: "uploaded"
  };
}

export function downloadWorkspaceFile(file: WorkspaceFile): void {
  if (file.fileKind === "text") {
    downloadBlob(file.name, new Blob([file.text || ""], { type: file.mediaType || "text/plain" }));
    return;
  }
  if (file.blob) {
    downloadBlob(file.name, file.blob);
  }
}

export function downloadBlob(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function looksLikeTextFile(file: File): boolean {
  if (file.type && TEXT_MEDIA_PREFIXES.some((prefix) => file.type.startsWith(prefix))) {
    return true;
  }
  const lower = file.name.toLowerCase();
  return [
    ".txt", ".md", ".markdown", ".itm", ".lua", ".json", ".xml", ".bpmn", ".csv", ".tsv", ".tab", ".mmd", ".mermaid", ".dot", ".gv", ".py", ".js", ".ts", ".html"
  ].some((extension) => lower.endsWith(extension));
}
