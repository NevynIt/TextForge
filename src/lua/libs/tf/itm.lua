local M = {}

function M.parse(input)
  return input:parse_itm()
end

function M.emit(input, model)
  return input:emit_itm(model)
end

return M
