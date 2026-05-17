import type { LanguageDefinition } from "../domain/types";

export class LanguageRegistry {
  private languages = new Map<string, LanguageDefinition>();
  private aliases = new Map<string, string>();

  register(language: LanguageDefinition): void {
    const normalized: LanguageDefinition = {
      ...language,
      extensions: (language.extensions || []).map((extension) =>
        extension.startsWith(".") ? extension.toLowerCase() : `.${extension.toLowerCase()}`
      ),
      aliases: language.aliases || []
    };
    this.languages.set(normalized.id, normalized);
    for (const alias of normalized.aliases || []) {
      this.aliases.set(alias, normalized.id);
    }
  }

  get(id: string): LanguageDefinition | undefined {
    return this.languages.get(this.canonical(id));
  }

  canonical(id: string): string {
    return this.aliases.get(id) || id;
  }

  list(): LanguageDefinition[] {
    return Array.from(this.languages.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  inferFromFileName(fileName: string): string {
    const lower = fileName.toLowerCase();
    const dot = lower.lastIndexOf(".");
    const extension = dot >= 0 ? lower.slice(dot) : "";
    for (const language of this.languages.values()) {
      if ((language.extensions || []).includes(extension)) {
        return language.id;
      }
    }
    return "text.plain";
  }

  ancestors(id: string): string[] {
    const result: string[] = [];
    let current = this.get(id);
    while (current?.parentId) {
      result.push(current.parentId);
      current = this.get(current.parentId);
    }
    return result;
  }

  matches(accepted: string | string[], actual: string): boolean {
    const options = Array.isArray(accepted) ? accepted : [accepted];
    if (options.includes("*")) {
      return true;
    }
    const canonicalActual = this.canonical(actual);
    return options.some((candidate) => {
      const canonicalCandidate = this.canonical(candidate);
      return canonicalCandidate === canonicalActual || this.ancestors(canonicalActual).includes(canonicalCandidate);
    });
  }
}

export function registerBaseLanguages(registry: LanguageRegistry): void {
  [
    {
      id: "text.plain",
      name: "Plain Text",
      parentId: "text",
      extensions: [".txt", ".text", ".log"],
      mediaType: "text/plain",
      aliases: ["plain-text"]
    },
    {
      id: "text.markdown",
      name: "Markdown",
      parentId: "text",
      extensions: [".md", ".markdown"],
      mediaType: "text/markdown"
    },
    {
      id: "text.indented-tree",
      name: "Indented Tree Text",
      parentId: "text",
      extensions: [".itt"],
      mediaType: "text/plain"
    },
    {
      id: "text.json",
      name: "JSON",
      parentId: "text",
      extensions: [".json"],
      mediaType: "application/json"
    },
    {
      id: "text.javascript",
      name: "JavaScript",
      parentId: "text",
      extensions: [".js", ".mjs", ".cjs", ".jsx"],
      mediaType: "text/javascript",
      aliases: ["javascript", "js"]
    },
    {
      id: "text.python",
      name: "Python",
      parentId: "text",
      extensions: [".py", ".pyw"],
      mediaType: "text/x-python",
      aliases: ["python", "py"]
    },
    {
      id: "text.lua",
      name: "Lua",
      parentId: "text",
      extensions: [".lua"],
      mediaType: "text/x-lua",
      aliases: ["lua"]
    },
    {
      id: "text.xml",
      name: "XML",
      parentId: "text",
      extensions: [".xml"],
      mediaType: "application/xml"
    },
    {
      id: "text.csv",
      name: "Delimited Text",
      parentId: "text",
      extensions: [".csv", ".tsv", ".tab"],
      mediaType: "text/csv"
    },
    {
      id: "text.mermaid",
      name: "Mermaid",
      parentId: "text",
      extensions: [".mmd", ".mermaid"],
      mediaType: "text/plain"
    },
    {
      id: "text.graphviz-dot",
      name: "Graphviz DOT",
      parentId: "text",
      extensions: [".dot", ".gv"],
      mediaType: "text/vnd.graphviz"
    }
  ].forEach((language) => registry.register(language));
}
