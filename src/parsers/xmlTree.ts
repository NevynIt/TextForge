import type { Diagnostic, TreeNode } from "../domain/types";

export function parseXmlTree(text: string, languageId = "text.xml"): { nodes: TreeNode[]; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  const root: TreeNode = { id: "xml-document", label: "XML document", type: "document", children: [] };
  const stack: TreeNode[] = [root];
  const tokenPattern = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<\/?[A-Za-z_][\w:.-]*(?:\s+[^<>]*?)?\/?>|[^<]+/g;
  let match: RegExpExecArray | null;
  let counter = 0;

  while ((match = tokenPattern.exec(text))) {
    const token = match[0];
    if (!token.trim()) {
      continue;
    }
    if (token.startsWith("<!--")) {
      stack[stack.length - 1].children.push({ id: `xml-${counter++}`, label: "comment", type: "comment", children: [] });
      continue;
    }
    if (token.startsWith("<![CDATA[")) {
      stack[stack.length - 1].children.push({ id: `xml-${counter++}`, label: "CDATA", type: "cdata", children: [] });
      continue;
    }
    if (token.startsWith("<?")) {
      continue;
    }
    if (token.startsWith("</")) {
      const name = token.slice(2, -1).trim();
      const open = stack.pop();
      if (!open || open.label !== name) {
        diagnostics.push({
          source: "xml-parser",
          severity: "error",
          languageId,
          message: `Unexpected closing tag </${name}>.`
        });
      }
      continue;
    }
    if (token.startsWith("<")) {
      const selfClosing = token.endsWith("/>");
      const tagBody = token.slice(1, token.length - (selfClosing ? 2 : 1)).trim();
      const [name, ...attributeParts] = tagBody.split(/\s+/);
      const node: TreeNode = {
        id: `xml-${counter++}`,
        label: name,
        type: "element",
        attributes: parseAttributes(attributeParts.join(" ")),
        children: []
      };
      stack[stack.length - 1].children.push(node);
      if (!selfClosing) {
        stack.push(node);
      }
      continue;
    }
    stack[stack.length - 1].children.push({
      id: `xml-${counter++}`,
      label: token.trim(),
      type: "text",
      children: []
    });
  }

  if (stack.length > 1) {
    diagnostics.push({
      source: "xml-parser",
      severity: "error",
      languageId,
      message: `Unclosed tag <${stack[stack.length - 1].label}>.`
    });
  }

  return { nodes: root.children, diagnostics };
}

function parseAttributes(text: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const attrPattern = /([A-Za-z_:][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match: RegExpExecArray | null;
  while ((match = attrPattern.exec(text))) {
    attributes[match[1]] = match[2] ?? match[3] ?? "";
  }
  return attributes;
}
