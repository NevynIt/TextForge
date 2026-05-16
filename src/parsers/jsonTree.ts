import type { TreeNode } from "../domain/types";

export function jsonToTree(value: unknown, label = "root", id = "json-root"): TreeNode {
  if (Array.isArray(value)) {
    return {
      id,
      label: `${label} [${value.length}]`,
      type: "array",
      children: value.map((item, index) => jsonToTree(item, String(index), `${id}-${index}`))
    };
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return {
      id,
      label: `${label} {${entries.length}}`,
      type: "object",
      children: entries.map(([key, child], index) => jsonToTree(child, key, `${id}-${index}-${sanitizeId(key)}`))
    };
  }
  return {
    id,
    label: `${label}: ${String(value)}`,
    type: value === null ? "null" : typeof value,
    children: []
  };
}

function sanitizeId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]+/g, "-") || "value";
}
