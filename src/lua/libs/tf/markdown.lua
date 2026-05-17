local M = {}

function M.parse(input)
  return input:parse_markdown()
end

function M.headings_to_tree(markdown_model)
  return markdown_model
end

return M
