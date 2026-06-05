-- TextForge Lua automation: EA Dashboard ITM -> Django fixture JSON.
-- Place this file under /.textforge/automation/lua/ea-dashboard-itm-to-json.lua.
-- Input:  ITM generated with ea-dashboard-profile.itm
-- Output: EA Dashboard Django fixture JSON text

local json_null = {}

local function trim(value)
  return tostring(value or ""):gsub("^%s+", ""):gsub("%s+$", "")
end

local function starts_with(value, prefix)
  return string.sub(tostring(value or ""), 1, #prefix) == prefix
end

local function is_null(value)
  return value == json_null
end

local function array(...)
  return { ... }
end

local model_order = array(
  "architecture.securitydomain",
  "architecture.domain",
  "architecture.capability",
  "architecture.system",
  "architecture.service",
  "architecture.dataentity",
  "architecture.datacenter",
  "architecture.rack",
  "architecture.server",
  "architecture.cloudresource",
  "architecture.database",
  "architecture.project",
  "architecture.strategicgoal",
  "architecture.valuestream",
  "architecture.businessunit",
  "architecture.businessprocess"
)

local model_rank = {}
for index, model in ipairs(model_order) do
  model_rank[model] = index
end

local specs = {
  ["architecture.securitydomain"] = {
    fields = array("name", "abbreviation", "level", "color"),
    scalars = array("name", "abbreviation", "level", "color"),
    relations = array(),
  },
  ["architecture.domain"] = {
    fields = array("name", "description", "security_domain"),
    scalars = array("name", "description"),
    relations = array({ field = "security_domain", many = false }),
  },
  ["architecture.capability"] = {
    fields = array("domain", "name", "description", "security_domain"),
    scalars = array("name", "description"),
    relations = array(
      { field = "domain", many = false },
      { field = "security_domain", many = false }
    ),
  },
  ["architecture.system"] = {
    fields = array("name", "description", "security_domain", "technology_stack", "api_version", "network_zone", "capabilities"),
    scalars = array("name", "description", "technology_stack", "api_version", "network_zone"),
    relations = array(
      { field = "capabilities", many = true },
      { field = "security_domain", many = false }
    ),
  },
  ["architecture.service"] = {
    fields = array("name", "description", "system", "security_domain", "port", "protocol", "bandwidth", "consumed_by"),
    scalars = array("name", "description", "port", "protocol", "bandwidth"),
    relations = array(
      { field = "system", many = false },
      { field = "consumed_by", many = true },
      { field = "security_domain", many = false }
    ),
  },
  ["architecture.dataentity"] = {
    fields = array("name", "description", "system", "security_domain"),
    scalars = array("name", "description"),
    relations = array(
      { field = "system", many = false },
      { field = "security_domain", many = false }
    ),
  },
  ["architecture.datacenter"] = {
    fields = array("name", "location", "security_domain"),
    scalars = array("name", "location"),
    relations = array({ field = "security_domain", many = false }),
  },
  ["architecture.rack"] = {
    fields = array("datacenter", "name", "row", "column", "security_domain"),
    scalars = array("name", "row", "column"),
    relations = array(
      { field = "datacenter", many = false },
      { field = "security_domain", many = false }
    ),
  },
  ["architecture.server"] = {
    fields = array("hostname", "datacenter", "rack", "u_position", "u_size", "ip_address", "os", "cpu_cores", "ram_gb", "security_domain", "mac_address", "subnet", "switch_port", "role", "systems"),
    scalars = array("hostname", "u_position", "u_size", "ip_address", "os", "cpu_cores", "ram_gb", "mac_address", "subnet", "switch_port", "role"),
    relations = array(
      { field = "datacenter", many = false },
      { field = "systems", many = true },
      { field = "rack", many = false },
      { field = "security_domain", many = false }
    ),
  },
  ["architecture.cloudresource"] = {
    fields = array("name", "provider", "resource_type", "security_domain", "systems"),
    scalars = array("name", "provider", "resource_type"),
    relations = array(
      { field = "systems", many = true },
      { field = "security_domain", many = false }
    ),
  },
  ["architecture.database"] = {
    fields = array("name", "engine", "system", "server", "cloud_resource", "security_domain", "port", "connection_pool", "max_connections"),
    scalars = array("name", "engine", "port", "connection_pool", "max_connections"),
    relations = array(
      { field = "system", many = false },
      { field = "server", many = false },
      { field = "cloud_resource", many = false },
      { field = "security_domain", many = false }
    ),
  },
  ["architecture.project"] = {
    fields = array("name", "status", "description", "start_date", "end_date", "planned_start_date", "planned_end_date", "completion_percentage", "security_domain", "dependencies", "domains", "capabilities", "systems", "services", "servers", "cloud_resources"),
    scalars = array("name", "status", "description", "start_date", "end_date", "planned_start_date", "planned_end_date", "completion_percentage"),
    relations = array(
      { field = "dependencies", many = true },
      { field = "domains", many = true },
      { field = "capabilities", many = true },
      { field = "systems", many = true },
      { field = "services", many = true },
      { field = "servers", many = true },
      { field = "cloud_resources", many = true },
      { field = "security_domain", many = false }
    ),
  },
  ["architecture.strategicgoal"] = {
    fields = array("name", "description", "security_domain", "capabilities", "projects"),
    scalars = array("name", "description"),
    relations = array(
      { field = "capabilities", many = true },
      { field = "projects", many = true },
      { field = "security_domain", many = false }
    ),
  },
  ["architecture.valuestream"] = {
    fields = array("name", "description", "security_domain", "strategic_goals"),
    scalars = array("name", "description"),
    relations = array(
      { field = "strategic_goals", many = true },
      { field = "security_domain", many = false }
    ),
  },
  ["architecture.businessunit"] = {
    fields = array("name", "description", "security_domain", "value_streams", "systems"),
    scalars = array("name", "description"),
    relations = array(
      { field = "value_streams", many = true },
      { field = "systems", many = true },
      { field = "security_domain", many = false }
    ),
  },
  ["architecture.businessprocess"] = {
    fields = array("name", "description", "value_stream", "business_unit", "security_domain", "systems"),
    scalars = array("name", "description"),
    relations = array(
      { field = "value_stream", many = false },
      { field = "business_unit", many = false },
      { field = "systems", many = true },
      { field = "security_domain", many = false }
    ),
  },
}

local function relation_spec_by_field(spec, field)
  for _, relation in ipairs(spec.relations or {}) do
    if relation.field == field then return relation end
  end
  return nil
end

local function scalar_field_set(spec)
  local set = {}
  for _, field in ipairs(spec.scalars or {}) do
    set[field] = true
  end
  return set
end

local function json_quote(value)
  local text = tostring(value or "")
  text = text:gsub("\\", "\\\\")
  text = text:gsub('"', '\\"')
  text = text:gsub("\b", "\\b")
  text = text:gsub("\f", "\\f")
  text = text:gsub("\n", "\\n")
  text = text:gsub("\r", "\\r")
  text = text:gsub("\t", "\\t")
  return '"' .. text .. '"'
end

local function is_array_table(value)
  if type(value) ~= "table" or is_null(value) then return false end
  local count = 0
  local max_index = 0
  for key, _ in pairs(value) do
    if type(key) ~= "number" or key < 1 or key % 1 ~= 0 then
      return false
    end
    count = count + 1
    if key > max_index then max_index = key end
  end
  return count == max_index
end

local function json_encode(value)
  if value == nil or is_null(value) then return "null" end
  local value_type = type(value)
  if value_type == "string" then return json_quote(value) end
  if value_type == "number" then return tostring(value) end
  if value_type == "boolean" then return value and "true" or "false" end
  if value_type == "table" then
    local parts = {}
    if is_array_table(value) then
      for index = 1, #value do
        parts[#parts + 1] = json_encode(value[index])
      end
      return "[" .. table.concat(parts, ", ") .. "]"
    end
    local keys = {}
    for key, _ in pairs(value) do keys[#keys + 1] = key end
    table.sort(keys, function(left, right) return tostring(left) < tostring(right) end)
    for _, key in ipairs(keys) do
      parts[#parts + 1] = json_quote(key) .. ": " .. json_encode(value[key])
    end
    return "{" .. table.concat(parts, ", ") .. "}"
  end
  error("Unsupported JSON value type: " .. value_type)
end

local function parse_json_string(raw)
  local pos = 2
  local out = {}
  while pos <= #raw do
    local c = string.sub(raw, pos, pos)
    if c == '"' then
      return table.concat(out)
    end
    if c == "\\" then
      pos = pos + 1
      local esc = string.sub(raw, pos, pos)
      if esc == '"' or esc == "\\" or esc == "/" then
        out[#out + 1] = esc
      elseif esc == "b" then
        out[#out + 1] = "\b"
      elseif esc == "f" then
        out[#out + 1] = "\f"
      elseif esc == "n" then
        out[#out + 1] = "\n"
      elseif esc == "r" then
        out[#out + 1] = "\r"
      elseif esc == "t" then
        out[#out + 1] = "\t"
      elseif esc == "u" then
        local hex = string.sub(raw, pos + 1, pos + 4)
        local code = tonumber(hex, 16)
        out[#out + 1] = code and utf8.char(code) or "?"
        pos = pos + 4
      else
        out[#out + 1] = esc
      end
    else
      out[#out + 1] = c
    end
    pos = pos + 1
  end
  return table.concat(out)
end

local function parse_scalar(raw)
  raw = trim(raw)
  if raw == "null" or raw == "~" then return json_null end
  if raw == "true" then return true end
  if raw == "false" then return false end
  if starts_with(raw, '"') then return parse_json_string(raw) end
  local number_value = tonumber(raw)
  if number_value ~= nil then return number_value end
  return raw
end

local function parse_itm(text)
  local nodes = {}
  local nodes_by_id = {}
  local current_node = nil
  local pending = nil
  local mode = nil
  local mode_target = nil

  for raw_line in tostring(text or ""):gmatch("([^\n]*)\n?") do
    if raw_line == "" and mode == nil then
      pending = nil
    end
    local line = raw_line:gsub("\r$", "")
    local stripped = trim(line)

    if stripped == "" then
      -- ignore
    elseif starts_with(stripped, "%") then
      pending = nil
      current_node = nil
      mode = nil
      mode_target = nil
    elseif stripped == "{" and pending then
      mode = pending.kind
      mode_target = pending.target
    elseif stripped == "}" then
      mode = nil
      mode_target = nil
      pending = nil
    elseif mode == "node" and mode_target then
      local key, value = string.match(stripped, "^([A-Za-z_][A-Za-z0-9_:%-]*)%s*:%s*(.*)$")
      if key then
        mode_target.attrs[key] = parse_scalar(value)
      end
    elseif mode == "relationship" and mode_target then
      local key, value = string.match(stripped, "^([A-Za-z_][A-Za-z0-9_:%-]*)%s*:%s*(.*)$")
      if key then
        mode_target.attrs[key] = parse_scalar(value)
      end
    else
      local id, type_ref, label = string.match(line, "^%s*&([A-Za-z_][A-Za-z0-9_:%-]*)%s+%[([^%]]+)%]%s*(.*)$")
      if id then
        current_node = {
          id = id,
          type_ref = type_ref,
          label = trim(label),
          attrs = {},
          relationships = {},
        }
        nodes[#nodes + 1] = current_node
        nodes_by_id[id] = current_node
        pending = { kind = "node", target = current_node }
      else
        local rel_type, target = string.match(stripped, "^@([A-Za-z_][A-Za-z0-9_%-]*::[A-Za-z_][A-Za-z0-9_%-]*):([A-Za-z_][A-Za-z0-9_:%-]*)")
        if rel_type and target and current_node then
          local relationship = {
            type_ref = rel_type,
            target = target,
            attrs = {},
          }
          current_node.relationships[#current_node.relationships + 1] = relationship
          pending = { kind = "relationship", target = relationship }
        else
          pending = nil
        end
      end
    end
  end

  return nodes, nodes_by_id
end

local function pk_from_target(target, nodes_by_id)
  local target_node = nodes_by_id[target]
  if target_node and target_node.attrs.sourcePk ~= nil and not is_null(target_node.attrs.sourcePk) then
    return target_node.attrs.sourcePk
  end
  local raw = string.match(tostring(target or ""), "_([^_]+)$")
  local number_value = tonumber(raw)
  return number_value or raw
end

local function field_from_relationship_type(type_ref)
  return string.match(type_ref or "", "^ead::(.+)$")
end

local function node_to_fixture_record(node, nodes_by_id)
  local model = node.attrs.sourceModel
  local spec = specs[model]
  if not spec then return nil end

  local scalar_fields = scalar_field_set(spec)
  local fields = {}

  for _, field in ipairs(spec.fields) do
    local relation = relation_spec_by_field(spec, field)
    if relation then
      fields[field] = relation.many and {} or json_null
    elseif scalar_fields[field] then
      local value = node.attrs[field]
      fields[field] = value == nil and json_null or value
    end
  end

  for _, relationship in ipairs(node.relationships or {}) do
    local field = field_from_relationship_type(relationship.type_ref)
    local relation = relation_spec_by_field(spec, field)
    if relation then
      local pk = pk_from_target(relationship.target, nodes_by_id)
      if relation.many then
        fields[field][#fields[field] + 1] = pk
      else
        fields[field] = pk
      end
    end
  end

  return {
    model = model,
    pk = node.attrs.sourcePk,
    sourceOrder = tonumber(node.attrs.sourceOrder),
    fields = fields,
  }
end

local function fixture_records_to_json(records)
  table.sort(records, function(left, right)
    if left.sourceOrder and right.sourceOrder and left.sourceOrder ~= right.sourceOrder then
      return left.sourceOrder < right.sourceOrder
    end
    local left_rank = model_rank[left.model] or 999
    local right_rank = model_rank[right.model] or 999
    if left_rank ~= right_rank then return left_rank < right_rank end
    return tostring(left.pk) < tostring(right.pk)
  end)

  local lines = {}
  lines[#lines + 1] = "["
  for index, record in ipairs(records) do
    local spec = specs[record.model]
    local comma_record = index < #records and "," or ""
    lines[#lines + 1] = "  {"
    lines[#lines + 1] = "    \"model\": " .. json_quote(record.model) .. ","
    lines[#lines + 1] = "    \"pk\": " .. json_encode(record.pk) .. ","
    lines[#lines + 1] = "    \"fields\": {"
    for field_index, field in ipairs(spec.fields) do
      local comma = field_index < #spec.fields and "," or ""
      lines[#lines + 1] = "      " .. json_quote(field) .. ": " .. json_encode(record.fields[field]) .. comma
    end
    lines[#lines + 1] = "    }"
    lines[#lines + 1] = "  }" .. comma_record
  end
  lines[#lines + 1] = "]"
  return table.concat(lines, "\n")
end

local function itm_to_fixture_json(itm_text)
  local nodes, nodes_by_id = parse_itm(itm_text)
  local records = {}
  for _, node in ipairs(nodes) do
    local record = node_to_fixture_record(node, nodes_by_id)
    if record then
      records[#records + 1] = record
    end
  end
  if #records == 0 then
    error("No EA Dashboard ITM records with sourceModel/sourcePk attributes were found.")
  end
  return fixture_records_to_json(records) .. "\n"
end

return {
  id = "ea-dashboard-itm-to-json",
  name = "EA Dashboard ITM to JSON",
  category = "Enterprise Architecture",
  description = "Transforms ITM using ea-dashboard-profile.itm back into EA Dashboard Django fixture JSON.",
  input = { "text" },
  output = "text",
  run = function(input_value)
    local text = input_value.text or input_value.value or ""
    if trim(text) == "" then
      return input_value:diagnostic("error", "EA Dashboard ITM input is empty.")
    end
    local json_text = itm_to_fixture_json(text)
    return input_value:emit_text("json", json_text)
  end,
}
