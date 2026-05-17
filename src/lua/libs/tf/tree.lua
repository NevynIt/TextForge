local M = {}

function M.walk(nodes, visitor)
  if nodes == nil then return end
  for _, node in ipairs(nodes) do
    visitor(node)
    if node.children then
      M.walk(node.children, visitor)
    end
  end
end

function M.map(nodes, mapper)
  local out = {}
  for index, node in ipairs(nodes or {}) do
    local copy = {}
    for key, value in pairs(node) do
      copy[key] = value
    end
    if node.children then
      copy.children = M.map(node.children, mapper)
    end
    out[index] = mapper(copy) or copy
  end
  return out
end

function M.flatten(nodes)
  local out = {}
  M.walk(nodes, function(node)
    out[#out + 1] = node
  end)
  return out
end

return M
