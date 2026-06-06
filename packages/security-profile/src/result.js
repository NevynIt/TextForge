export function createResult(checkId, kind, diagnostics, summary) {
  return {
    checkId,
    kind,
    passed: diagnostics.length === 0,
    severity: diagnostics.some((diagnostic) => diagnostic.severity === 'error')
      ? 'error'
      : diagnostics.some((diagnostic) => diagnostic.severity === 'warning')
        ? 'warning'
        : 'information',
    diagnostics,
    summary,
  };
}

export function createIssue(message, severity, resource) {
  return {
    severity,
    message,
    resource,
  };
}
