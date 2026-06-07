export declare function ensureTablesPackageStyle(container: {
  ownerDocument?: Document;
}): () => void;
export declare function createTablesRuntimeMarkup(title: string, message?: string): string;
export declare function createTablesFailureHtml(
  title: string,
  diagnostics?: ReadonlyArray<{ readonly message?: string }>,
  options?: { readonly fallbackMessage?: string },
): string;
