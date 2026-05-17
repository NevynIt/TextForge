local M = {}

function M.trim(value)
  return tostring(value or ""):match("^%s*(.-)%s*$")
end

function M.slug(value)
  local text = M.trim(value):lower():gsub("[^%w]+", "-"):gsub("^%-+", ""):gsub("%-+$", "")
  if text == "" then
    return "item"
  end
  return text
end

return M
