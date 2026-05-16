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
            target: { ...(diagnostic.target || {}), documentId: document.id }
          }))
        );
      } catch (error) {
        diagnostics.push({
          id: `${contribution.id}-runtime-error`,
          source: contribution.id,
          severity: "error",
          languageId: document.languageId,
          message: error instanceof Error ? error.message : String(error),
          target: { documentId: document.id }
        });
      }
    }
    return diagnostics;
  }
}
