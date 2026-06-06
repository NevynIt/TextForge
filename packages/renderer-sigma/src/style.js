function readStyleValue(style, key) {
  const value = style?.[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
}

export function chooseNodeColor(node) {
  return readStyleValue(node.style, 'background-color')
    ?? readStyleValue(node.style, 'fill')
    ?? readStyleValue(node.style, 'color')
    ?? '#2563eb';
}

export function chooseEdgeColor(edge) {
  return readStyleValue(edge.style, 'line-color')
    ?? readStyleValue(edge.style, 'stroke')
    ?? readStyleValue(edge.style, 'color')
    ?? '#64748b';
}

export function chooseEdgeWidth(edge) {
  const width = Number.parseFloat(readStyleValue(edge.style, 'width') ?? readStyleValue(edge.style, 'stroke-width') ?? '');
  return Number.isFinite(width) && width > 0 ? width : 1.7;
}

export function chooseNodeSize(node) {
  const height = Number.parseFloat(readStyleValue(node.style, 'height') ?? '');
  const width = Number.parseFloat(readStyleValue(node.style, 'width') ?? '');
  const size = Math.max(
    Number.isFinite(height) ? height : 0,
    Number.isFinite(width) ? width : 0,
  );
  return size > 0 ? Math.min(Math.max(size, 3), 20) : 8;
}
