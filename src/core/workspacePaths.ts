const CONTROL_CHARS = /[\0-\x1f\x7f]/;
const WINDOWS_ABSOLUTE = /^[a-zA-Z]:[\\/]/;
const UNC_PATH = /^[\\/]{2}/;

export function normalizeWorkspacePath(path: string): string {
  return normalizePath(path, { allowRelative: false, rejectOsAbsolute: false });
}

export function normalizeImportPath(path: string): string {
  return normalizePath(path, { allowRelative: true, rejectOsAbsolute: true });
}

export function joinWorkspacePath(base: string, relative: string): string {
  const left = normalizeWorkspacePath(base);
  const normalizedRelative = String(relative || "").replaceAll("\\", "/");
  if (!normalizedRelative.trim() || normalizedRelative.trim() === ".") {
    return left;
  }
  if (normalizedRelative.startsWith("/")) {
    throw new Error("Import paths must be relative.");
  }
  const segments = left.split("/").filter(Boolean);
  for (const rawSegment of normalizedRelative.split("/")) {
    const segment = rawSegment.trim();
    if (!segment || segment === ".") {
      continue;
    }
    if (segment === "..") {
      if (!segments.length) {
        throw new Error("Path cannot escape the workspace root.");
      }
      segments.pop();
      continue;
    }
    const validity = validateEntryName(segment);
    if (!validity.ok) {
      throw new Error(validity.message);
    }
    segments.push(segment);
  }
  return segments.length ? `/${segments.join("/")}` : "/";
}

export function parentPath(path: string): string {
  const normalized = normalizeWorkspacePath(path);
  if (normalized === "/") {
    return "/";
  }
  const parts = normalized.split("/").filter(Boolean);
  parts.pop();
  return parts.length ? `/${parts.join("/")}` : "/";
}

export function baseName(path: string): string {
  const normalized = normalizeWorkspacePath(path);
  if (normalized === "/") {
    return "";
  }
  return normalized.split("/").filter(Boolean).at(-1) || "";
}

export function isPathInside(parent: string, child: string): boolean {
  const normalizedParent = normalizeWorkspacePath(parent);
  const normalizedChild = normalizeWorkspacePath(child);
  return normalizedParent === "/"
    ? normalizedChild.startsWith("/")
    : normalizedChild === normalizedParent || normalizedChild.startsWith(`${normalizedParent}/`);
}

export function resolveRelativePath(baseFilePath: string, target: string): string {
  const baseFolder = parentPath(baseFilePath);
  return target.startsWith("/") ? normalizeWorkspacePath(target) : joinWorkspacePath(baseFolder, target);
}

export function validateEntryName(name: string): { ok: true } | { ok: false; message: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, message: "Name cannot be empty." };
  }
  if (trimmed === "." || trimmed === "..") {
    return { ok: false, message: "Reserved relative path segments are not allowed." };
  }
  if (trimmed.includes("/") || trimmed.includes("\\")) {
    return { ok: false, message: "Folder separators are not allowed in names." };
  }
  if (CONTROL_CHARS.test(trimmed)) {
    return { ok: false, message: "Control characters are not allowed." };
  }
  return { ok: true };
}

function normalizePath(
  value: string,
  options: { allowRelative: boolean; rejectOsAbsolute: boolean }
): string {
  const input = String(value || "").replaceAll("\\", "/");
  if (!input.trim()) {
    return options.allowRelative ? "." : "/";
  }
  if (CONTROL_CHARS.test(input)) {
    throw new Error("Path contains control characters.");
  }
  if (options.rejectOsAbsolute && (WINDOWS_ABSOLUTE.test(value) || WINDOWS_ABSOLUTE.test(input) || UNC_PATH.test(value) || UNC_PATH.test(input))) {
    throw new Error("Absolute OS paths are not allowed.");
  }

  const isAbsolute = input.startsWith("/");
  if (!options.allowRelative && !isAbsolute) {
    throw new Error("Workspace paths must be absolute.");
  }
  if (options.allowRelative && isAbsolute) {
    throw new Error("Import paths must be relative.");
  }

  const segments: string[] = [];
  for (const rawSegment of input.split("/")) {
    const segment = rawSegment.trim();
    if (!segment || segment === ".") {
      continue;
    }
    if (segment === "..") {
      if (!segments.length) {
        throw new Error("Path cannot escape the workspace root.");
      }
      segments.pop();
      continue;
    }
    const nameState = validateEntryName(segment);
    if (!nameState.ok) {
      throw new Error(nameState.message);
    }
    segments.push(segment);
  }

  if (options.allowRelative) {
    return segments.join("/") || ".";
  }
  return segments.length ? `/${segments.join("/")}` : "/";
}
