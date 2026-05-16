import type { Diagnostic, LinterContribution, TextDocument } from "../domain/types";
import { PluginRegistry } from "./pluginRegistry";
import { RuntimeLoader } from "./runtimeLoader";

export class DiagnosticsService {
  constructor(
    private registry: PluginRegistry,
    private runtime: RuntimeLoader
  ) {}

  async run(document: TextDocument): Promise<Diagnostic[]> {
    const contributions = await this.registry.resolveLinters(document.languageId);
    const diagnostics: Diagnostic[] = [];
    for (const contribution of contributions) {
      if (contribution.kind !== "linter") {
        continue;
      }
      try {
        const linter = contribution as LinterContribution;
        const results = await linter.lint(document, { runtime: this.runtime });
        diagnostics.push(
          ...results.map((diagnostic, index) => ({
            ...diagnostic,
            id: diagnostic.id || `${linter.id}-${index}`,
            languageId: diagnostic.languageId || document.languageId,
            documentId: diagnostic.documentId || document.id,
            documentVersion: diagnostic.documentVersion || document.version,
            contributionId: diagnostic.contributionId || linter.id,
            from: diagnostic.from ?? diagnostic.range?.from,
            to: diagnostic.to ?? diagnostic.range?.to,
            line: diagnostic.line ?? diagnostic.range?.line,
            column: diagnostic.column ?? diagnostic.range?.column,
            target: { ...(diagnostic.target || {}), documentId: document.id }
          }))
        );
      } catch (error) {
        diagnostics.push({
          id: `${contribution.id}-runtime-error`,
          source: contribution.id,
          severity: "error",
          languageId: document.languageId,
          documentId: document.id,
          documentVersion: document.version,
          contributionId: contribution.id,
          message: error instanceof Error ? error.message : String(error),
          target: { documentId: document.id }
        });
      }
    }
    return diagnostics;
  }
}
