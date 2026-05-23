import { normalizeImportPath } from "./workspacePaths";
import type { WorkspaceImportFile, WorkspaceFile } from "./workspaceTypes";
import { inferVisualMediaType } from "./mediaSupport";

interface ZipEntryPayload {
  path: string;
  bytes: Uint8Array;
  fileKind: "text" | "binary";
  mediaType?: string;
}

export async function exportWorkspaceFilesToZip(files: Array<Pick<WorkspaceFile, "path" | "fileKind" | "text" | "blob" | "mediaType">>, rootPath = "/"): Promise<Blob> {
  const payloads: ZipEntryPayload[] = [];
  for (const file of files) {
    if (file.fileKind === "text") {
      payloads.push({
        path: relativeZipPath(file.path, rootPath),
        bytes: encoder.encode(file.text || ""),
        fileKind: "text",
        mediaType: file.mediaType
      });
    } else if (file.blob) {
      payloads.push({
        path: relativeZipPath(file.path, rootPath),
        bytes: new Uint8Array(await file.blob.arrayBuffer()),
        fileKind: "binary",
        mediaType: file.mediaType
      });
    }
  }
  return createStoredZip(payloads);
}

export async function importZipToWorkspaceFiles(blob: Blob, inferLanguage: (fileName: string) => string): Promise<WorkspaceImportFile[]> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const entries = parseStoredZip(bytes);
  return entries.map((entry) => {
    const normalizedPath = normalizeImportPath(entry.path);
    if (looksLikeText(entry.path, entry.mediaType)) {
      return {
        path: normalizedPath,
        fileKind: "text",
        languageId: inferLanguage(normalizedPath),
        mediaType: entry.mediaType,
        text: decoder.decode(entry.bytes),
        origin: "zip-imported"
      } satisfies WorkspaceImportFile;
    }
    return {
      path: normalizedPath,
      fileKind: "binary",
      mediaType: inferVisualMediaType(normalizedPath, entry.mediaType) || entry.mediaType || "application/octet-stream",
      blob: new Blob([blobPart(entry.bytes)], { type: inferVisualMediaType(normalizedPath, entry.mediaType) || entry.mediaType || "application/octet-stream" }),
      origin: "zip-imported"
    } satisfies WorkspaceImportFile;
  });
}

function createStoredZip(entries: ZipEntryPayload[]): Blob {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const pathBytes = encoder.encode(entry.path);
    const crc = crc32(entry.bytes);
    const localHeader = new Uint8Array(30 + pathBytes.length);
    const localView = new DataView(localHeader.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, entry.bytes.length, true);
    localView.setUint32(22, entry.bytes.length, true);
    localView.setUint16(26, pathBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(pathBytes, 30);
    localParts.push(localHeader, entry.bytes);

    const centralHeader = new Uint8Array(46 + pathBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, entry.bytes.length, true);
    centralView.setUint32(24, entry.bytes.length, true);
    centralView.setUint16(28, pathBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    centralHeader.set(pathBytes, 46);
    centralParts.push(centralHeader);

    offset += localHeader.length + entry.bytes.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, endRecord].map(blobPart), { type: "application/zip" });
}

function parseStoredZip(bytes: Uint8Array): ZipEntryPayload[] {
  const results: ZipEntryPayload[] = [];
  let offset = 0;
  while (offset + 30 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset);
    const signature = view.getUint32(0, true);
    if (signature === 0x06054b50 || signature === 0x02014b50) {
      break;
    }
    if (signature !== 0x04034b50) {
      throw new Error("Unsupported ZIP structure.");
    }
    const compressionMethod = view.getUint16(8, true);
    const compressedSize = view.getUint32(18, true);
    const uncompressedSize = view.getUint32(22, true);
    const fileNameLength = view.getUint16(26, true);
    const extraLength = view.getUint16(28, true);
    const fileNameOffset = offset + 30;
    const dataOffset = fileNameOffset + fileNameLength + extraLength;
    const path = decoder.decode(bytes.slice(fileNameOffset, fileNameOffset + fileNameLength));
    const data = bytes.slice(dataOffset, dataOffset + compressedSize);
    if (compressionMethod !== 0) {
      throw new Error(`Unsupported ZIP compression method ${compressionMethod}.`);
    }
    if (!path.endsWith("/")) {
      results.push({
        path,
        bytes: data.slice(0, uncompressedSize),
        fileKind: "binary"
      });
    }
    offset = dataOffset + compressedSize;
  }
  return results;
}

function relativeZipPath(path: string, rootPath: string): string {
  const normalized = path.replaceAll("\\", "/");
  const root = rootPath === "/" ? "/" : rootPath.replaceAll("\\", "/");
  if (root === "/") {
    return normalized.replace(/^\//, "");
  }
  return normalized.replace(new RegExp(`^${escapeRegExp(root)}/?`), "");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function looksLikeText(path: string, mediaType?: string): boolean {
  if (mediaType && (mediaType.startsWith("text/") || mediaType === "application/json" || mediaType === "application/xml")) {
    return true;
  }
  const lower = path.toLowerCase();
  return [".txt", ".md", ".markdown", ".itm", ".lua", ".json", ".xml", ".bpmn", ".csv", ".tsv", ".tab", ".mmd", ".mermaid", ".dot", ".gv", ".py", ".js", ".ts", ".html"].some((extension) => lower.endsWith(extension));
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function blobPart(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.length);
  copy.set(bytes);
  return copy.buffer;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
