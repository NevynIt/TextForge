export function createTimestampFactory() {
  return () => new Date().toISOString();
}

export function createTraceLogger(enabled) {
  const startedAt = typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
  let counter = 0;

  return (label, details = {}) => {
    if (!enabled) {
      return;
    }

    counter += 1;
    const current = typeof performance !== 'undefined' && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
    const elapsedMs = Math.round((current - startedAt) * 100) / 100;
    const entry = {
      index: counter,
      elapsedMs,
      label,
      details,
    };
    if (typeof globalThis === 'object' && globalThis) {
      const traceEntries = Array.isArray(globalThis.__textforgePreviewTrace)
        ? globalThis.__textforgePreviewTrace
        : [];
      traceEntries.push(entry);
      globalThis.__textforgePreviewTrace = traceEntries;
    }
    if (typeof document !== 'undefined' && document?.body?.dataset) {
      const tail = String(document.body.dataset.textforgePreviewTraceTail ?? '')
        .split('|')
        .filter(Boolean)
        .slice(-11);
      tail.push(label);
      document.body.dataset.textforgePreviewTraceLast = label;
      document.body.dataset.textforgePreviewTraceCount = String(counter);
      document.body.dataset.textforgePreviewTraceElapsed = String(elapsedMs);
      document.body.dataset.textforgePreviewTraceTail = tail.join('|');
    }
    console.log(`[preview-trace #${counter} +${elapsedMs}ms] ${label}`, details);
  };
}
