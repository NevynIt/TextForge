import type { ViewerResult, WorkspaceContributionContext } from "../domain/types";
import type { WorkspaceFile } from "./workspaceTypes";

const IMAGE_EXTENSIONS = new Map<string, string>([
  [".apng", "image/apng"],
  [".avif", "image/avif"],
  [".bmp", "image/bmp"],
  [".gif", "image/gif"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"]
]);

const PDF_EXTENSION = ".pdf";

export function inferVisualMediaType(path: string, mediaType?: string): string | undefined {
  const normalized = mediaType?.trim().toLowerCase();
  if (normalized) {
    return normalized;
  }
  const lowerPath = path.toLowerCase();
  for (const [extension, type] of IMAGE_EXTENSIONS) {
    if (lowerPath.endsWith(extension)) {
      return type;
    }
  }
  if (lowerPath.endsWith(PDF_EXTENSION)) {
    return "application/pdf";
  }
  return undefined;
}

export function isImageMediaType(mediaType?: string): mediaType is string {
  return Boolean(mediaType && mediaType.startsWith("image/"));
}

export function isPdfMediaType(mediaType?: string): mediaType is "application/pdf" {
  return mediaType === "application/pdf";
}

export function isVisualizableWorkspaceFile(file: WorkspaceFile): boolean {
  if (file.fileKind !== "binary" && !looksLikeTextSvg(file)) {
    return false;
  }
  const mediaType = inferVisualMediaType(file.path, file.mediaType);
  return isImageMediaType(mediaType) || isPdfMediaType(mediaType);
}

export function viewerResultForWorkspaceFile(file: WorkspaceFile): ViewerResult | undefined {
  const mediaType = inferVisualMediaType(file.path, file.mediaType);
  if (!mediaType) {
    return undefined;
  }
  const blob = workspaceFileToBlob(file, mediaType);
  if (!blob) {
    return undefined;
  }
  if (isImageMediaType(mediaType)) {
    return {
      kind: "media",
      title: file.name,
      mediaKind: "image",
      mediaType,
      blob
    };
  }
  if (isPdfMediaType(mediaType)) {
    return {
      kind: "media",
      title: file.name,
      mediaKind: "pdf",
      mediaType,
      blob
    };
  }
  return undefined;
}

export async function resolveMarkdownImageSource(
  workspace: WorkspaceContributionContext,
  target: string,
  baseFileId?: string
): Promise<{ url: string; mediaType: string; path: string } | undefined> {
  const trimmed = target.trim();
  if (!trimmed || isNonWorkspaceUrl(trimmed)) {
    return undefined;
  }
  const path = baseFileId ? workspace.resolvePath(baseFileId, trimmed) : trimmed;
  const entry = workspace.findByPath(path);
  if (!entry || entry.kind !== "file") {
    return undefined;
  }
  const mediaType = inferVisualMediaType(entry.path, entry.mediaType);
  if (!isImageMediaType(mediaType)) {
    return undefined;
  }

  const binary = workspace.readBinary(entry.id) ?? workspace.readBinary(entry.path);
  if (binary) {
    return {
      url: await blobToDataUrl(binary, mediaType),
      mediaType,
      path: entry.path
    };
  }

  const text = workspace.readText(entry.id, baseFileId ? { baseFileId } : undefined)
    ?? workspace.readText(entry.path, baseFileId ? { baseFileId } : undefined);
  if (typeof text === "string") {
    return {
      url: await blobToDataUrl(new Blob([text], { type: mediaType }), mediaType),
      mediaType,
      path: entry.path
    };
  }

  return undefined;
}

async function blobToDataUrl(blob: Blob, mediaType: string): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return `data:${mediaType};base64,${btoa(binary)}`;
}

function workspaceFileToBlob(file: WorkspaceFile, mediaType: string): Blob | undefined {
  if (file.fileKind === "binary") {
    return file.blob;
  }
  if (looksLikeTextSvg(file)) {
    return new Blob([file.text || ""], { type: mediaType });
  }
  return undefined;
}

function looksLikeTextSvg(file: WorkspaceFile): boolean {
  return file.fileKind === "text" && inferVisualMediaType(file.path, file.mediaType) === "image/svg+xml";
}

function isNonWorkspaceUrl(value: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value);
}