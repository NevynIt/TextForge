export function cloneSourceRangePosition(position) {
  if (!position || typeof position !== 'object') {
    return undefined;
  }

  return {
    line: typeof position.line === 'number' ? position.line : undefined,
    column: typeof position.column === 'number' ? position.column : undefined,
    offset: typeof position.offset === 'number' ? position.offset : undefined,
  };
}

export function cloneSourceRange(range) {
  if (!range || typeof range !== 'object') {
    return undefined;
  }

  return {
    start: cloneSourceRangePosition(range.start),
    end: cloneSourceRangePosition(range.end),
    startLine: typeof range.startLine === 'number' ? range.startLine : undefined,
    startColumn: typeof range.startColumn === 'number' ? range.startColumn : undefined,
    endLine: typeof range.endLine === 'number' ? range.endLine : undefined,
    endColumn: typeof range.endColumn === 'number' ? range.endColumn : undefined,
  };
}

export function cloneStringArray(values) {
  return Array.isArray(values)
    ? values
      .map((value) => String(value ?? '').trim())
      .filter(Boolean)
    : [];
}

export function cloneScalarRecord(values) {
  if (!values || typeof values !== 'object' || Array.isArray(values)) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(values).filter(([, value]) =>
      typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'),
  );
}
