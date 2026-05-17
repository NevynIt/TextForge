local M = {}

function M.empty(columns, delimiter)
  return {
    kind = "model",
    modelType = "model.table",
    data = { columns = columns or {}, rows = {}, delimiter = delimiter or "," }
  }
end

function M.from_rows(columns, rows, delimiter)
  return {
    kind = "model",
    modelType = "model.table",
    data = { columns = columns or {}, rows = rows or {}, delimiter = delimiter or "," }
  }
end

function M.add_row(model, row)
  model.data.rows[#model.data.rows + 1] = row
  return row
end

return M
