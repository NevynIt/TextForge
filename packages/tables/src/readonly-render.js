import { escapeHtml } from './contracts.js';

export function renderReadonlyTableModel(model) {
  const columns = [...(model?.columns ?? [])].sort((left, right) => left.index - right.index);
  const headerCells = model?.metadata?.resolvedHeaderMode === 'header'
    ? `<thead><tr>${columns.map((column) =>
      `<th scope="col">${escapeHtml(column.label)}</th>`).join('')}</tr></thead>`
    : '';
  const bodyRows = (model?.rows ?? []).map((row) =>
    `<tr>${columns.map((column) =>
      `<td>${escapeHtml(row.values?.[column.field] ?? '')}</td>`).join('')}</tr>`).join('');

  return `<table data-format="${escapeHtml(model?.metadata?.format ?? 'csv')}">${headerCells}<tbody>${bodyRows}</tbody></table>`;
}
