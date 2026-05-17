local M = {}

function M.open(value)
  if type(value) == "table" then
    value.openAsDocument = true
  end
  return value
end

return M
