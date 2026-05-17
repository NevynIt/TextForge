local M = {}

function M.parse(input)
  return input:parse_itt()
end

function M.emit(input, model)
  return input:emit_itt(model)
end

return M
