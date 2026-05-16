import type { Diagnostic, TableModel } from "../domain/types";

export function parseDelimited(text: string, delimiter: "," | "\t", languageId: string): TableModel {
  const rows: string[][] = [];
  const diagnostics: Diagnostic[] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
        continue;
      }
      if (char === '"') {
        quoted = false;
        continue;
      }
      field += char;
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === delimiter) {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += char;
  }
  row.push(field.replace(/\r$/, ""));
  if (row.length > 1 || row[0] !== "") {
    rows.push(row);
  }

  if (quoted) {
    diagnostics.push({
      source: "csv-parser",
      severity: "error",
      languageId,
      message: "Unclosed quoted field."
    });
  }

  const columns = rows[0] || [];
  rows.slice(1).forEach((candidate, index) => {
    if (candidate.length !== columns.length) {
      diagnostics.push({
        source: "csv-parser",
        severity: "warning",
        languageId,
        message: `Row ${index + 2} has ${candidate.length} fields; expected ${columns.length}.`
      });
    }
  });

  return {
    columns: columns.length ? columns : ["Column 1"],
    rows: rows.slice(1),
    delimiter,
    diagnostics
  };
}
