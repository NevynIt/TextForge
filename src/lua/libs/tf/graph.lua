local M = {}

function M.empty(directed)
  return { kind = "model", modelType = "model.graph", data = { nodes = {}, edges = {}, directed = directed ~= false } }
end

function M.add_node(graph, id, label, attrs)
  attrs = attrs or {}
  local node = { id = id, label = label or id }
  for key, value in pairs(attrs) do
    node[key] = value
  end
  graph.data.nodes[#graph.data.nodes + 1] = node
  return node
end

function M.add_edge(graph, source, target, label, attrs)
  attrs = attrs or {}
  local edge = { source = source, target = target, label = label }
  for key, value in pairs(attrs) do
    edge[key] = value
  end
  graph.data.edges[#graph.data.edges + 1] = edge
  return edge
end

return M
