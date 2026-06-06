export function createMarkdownSnippet(kind, options = {}) {
  switch (kind) {
    case 'image':
      return `\n![${options.alt ?? 'Diagram'}](${options.href ?? 'generated/example.svg'})\n`;
    case 'mermaid':
      return '\n```mermaid\nflowchart TD\n  A[Need] --> B[Capability]\n  B --> C[Roadmap]\n```\n';
    case 'graphviz':
      return '\n```graphviz\ndigraph G {\n  Start -> Review;\n  Review -> Done;\n}\n```\n';
    default:
      return '\n';
  }
}
