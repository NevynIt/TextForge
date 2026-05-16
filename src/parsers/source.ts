import type { SourceRange } from "../domain/types";

export function sourceRange(text: string, from: number, to: number): SourceRange {
  const prefix = text.slice(0, from);
  const lines = prefix.split(/\r?\n/);
  return {
    from,
    to,
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
