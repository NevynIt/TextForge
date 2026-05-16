import type { TreeNode } from "../domain/types";
import { sourceRange } from "./source";

export function extractMarkdownHeadingTree(text: string): TreeNode[] {
  const roots: TreeNode[] = [];
  const stack: Array<{ level: number; node: TreeNode }> = [];
  let offset = 0;
  const lines = text.split(/\r?\n/);

  lines.forEach((line, index) => {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (match) {
      const level = match[1].length;
      const node: TreeNode = {
        id: `heading-${index + 1}`,
        label: match[2],
        type: `h${level}`,
        children: [],
        sourceRange: sourceRange(text, offset, offset + line.length)
      };
      while (stack.length && stack[stack.length - 1].level >= level) {
        stack.pop();
      }
      if (stack.length) {
        stack[stack.length - 1].node.children.push(node);
      } else {
        roots.push(node);
      }
      stack.push({ level, node });
    }
    offset += line.length + 1;
  });

  return roots.length
    ? roots
    : [
        {
          id: "heading-empty",
          label: "No headings",
          type: "empty",
          children: []
        }
      ];
}
