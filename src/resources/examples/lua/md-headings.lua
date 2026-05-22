return {
  id = "markdown-headings-to-json",
  name = "Markdown headings to JSON",
  category = "Lua Transform",
  input = "text.markdown",
  output = "text.json",
  run = function(input)
    local headings = input:parse_markdown()
    return input:emit_json(headings)
  end
}
