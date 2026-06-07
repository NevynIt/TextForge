-- TextForge Lua automation: EA Dashboard Django fixture JSON -> ITM.
-- Place this file under /.textforge/automation/lua/ea-dashboard-json-to-itm.lua.
-- Input:  EA Dashboard JSON fixture export text
-- Output: ITM text using ea-dashboard-profile.itm

local json_null = {}

local function trim(value)
  return tostring(value or ""):gsub("^%s+", ""):gsub("%s+$", "")
end

local function is_null(value)
  return value == json_null
end

local function json_error(message, pos)
  error(message .. " at byte " .. tostring(pos or "?"))
end

local function parse_json(text)
  text = tostring(text or "")
  local pos = 1
  local len = #text

  local function peek()
    return string.sub(text, pos, pos)
  end

  local function skip_ws()
    while pos <= len do
      local c = peek()
      if c == " " or c == "\n" or c == "\r" or c == "\t" then
        pos = pos + 1
      else
        break
      end
    end
  end

  local parse_value

  local function parse_string()
    if peek() ~= '"' then json_error("Expected JSON string", pos) end
    pos = pos + 1
    local out = {}
    while pos <= len do
      local c = peek()
      if c == '"' then
        pos = pos + 1
        return table.concat(out)
      end
      if c == "\\" then
        pos = pos + 1
        local esc = peek()
        if esc == '"' or esc == "\\" or esc == "/" then
          out[#out + 1] = esc
          pos = pos + 1
        elseif esc == "b" then
          out[#out + 1] = "\b"
          pos = pos + 1
        elseif esc == "f" then
          out[#out + 1] = "\f"
          pos = pos + 1
        elseif esc == "n" then
          out[#out + 1] = "\n"
          pos = pos + 1
        elseif esc == "r" then
          out[#out + 1] = "\r"
          pos = pos + 1
        elseif esc == "t" then
          out[#out + 1] = "\t"
          pos = pos + 1
        elseif esc == "u" then
          local hex = string.sub(text, pos + 1, pos + 4)
          if not string.match(hex, "^[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]$") then
            json_error("Invalid JSON unicode escape", pos)
          end
          local code = tonumber(hex, 16)
          out[#out + 1] = code and utf8.char(code) or "?"
          pos = pos + 5
        else
          json_error("Invalid JSON escape", pos)
        end
      else
        out[#out + 1] = c
        pos = pos + 1
      end
    end
    json_error("Unterminated JSON string", pos)
  end

  local function parse_number()
    local start_pos = pos
    while pos <= len and string.match(peek(), "[0-9eE%+%-%.]") do
      pos = pos + 1
    end
    local raw = string.sub(text, start_pos, pos - 1)
    local value = tonumber(raw)
    if value == nil then json_error("Invalid JSON number", start_pos) end
    return value
  end

  local function parse_array()
    pos = pos + 1
    skip_ws()
    local out = {}
    if peek() == "]" then
      pos = pos + 1
      return out
    end
    while true do
      out[#out + 1] = parse_value()
      skip_ws()
      local c = peek()
      if c == "]" then
        pos = pos + 1
        return out
      end
      if c ~= "," then json_error("Expected ',' or ']'", pos) end
      pos = pos + 1
      skip_ws()
    end
  end

  local function parse_object()
    pos = pos + 1
    skip_ws()
    local out = {}
    if peek() == "}" then
      pos = pos + 1
      return out
    end
    while true do
      skip_ws()
      local key = parse_string()
      skip_ws()
      if peek() ~= ":" then json_error("Expected ':'", pos) end
      pos = pos + 1
      out[key] = parse_value()
      skip_ws()
      local c = peek()
      if c == "}" then
        pos = pos + 1
        return out
      end
      if c ~= "," then json_error("Expected ',' or '}'", pos) end
      pos = pos + 1
      skip_ws()
    end
  end

  function parse_value()
    skip_ws()
    local c = peek()
    if c == '"' then return parse_string() end
    if c == "{" then return parse_object() end
    if c == "[" then return parse_array() end
    if c == "-" or string.match(c, "%d") then return parse_number() end
    if string.sub(text, pos, pos + 3) == "true" then
      pos = pos + 4
      return true
    end
    if string.sub(text, pos, pos + 4) == "false" then
      pos = pos + 5
      return false
    end
    if string.sub(text, pos, pos + 3) == "null" then
      pos = pos + 4
      return json_null
    end
    json_error("Unexpected JSON token", pos)
  end

  local result = parse_value()
  skip_ws()
  if pos <= len then json_error("Unexpected trailing JSON", pos) end
  return result
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

local function json_scalar(value)
  if is_null(value) or value == nil then return "null" end
  local value_type = type(value)
  if value_type == "string" then return json_quote(value) end
  if value_type == "number" then return tostring(value) end
  if value_type == "boolean" then return value and "true" or "false" end
  error("Unsupported scalar value type: " .. value_type)
end

local function clean_label(value)
  local label = tostring(value or "")
  label = label:gsub("\r\n", " "):gsub("\r", " "):gsub("\n", " ")
  label = trim(label)
  if label == "" then return "Unnamed record" end
  return label
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

local specs = {
  ["architecture.securitydomain"] = {
    short = "securitydomain",
    type_ref = "ead::SecurityDomain",
    label = "name",
    scalars = array("name", "abbreviation", "level", "color"),
    relations = array(),
  },
  ["architecture.domain"] = {
    short = "domain",
    type_ref = "ead::Domain",
    label = "name",
    scalars = array("name", "description"),
    relations = array({ field = "security_domain", target = "architecture.securitydomain", many = false }),
  },
  ["architecture.capability"] = {
    short = "capability",
    type_ref = "ead::Capability",
    label = "name",
    scalars = array("name", "description"),
    relations = array(
      { field = "domain", target = "architecture.domain", many = false },
      { field = "security_domain", target = "architecture.securitydomain", many = false }
    ),
  },
  ["architecture.system"] = {
    short = "system",
    type_ref = "ead::System",
    label = "name",
    scalars = array("name", "description", "technology_stack", "api_version", "network_zone"),
    relations = array(
      { field = "capabilities", target = "architecture.capability", many = true },
      { field = "security_domain", target = "architecture.securitydomain", many = false }
    ),
  },
  ["architecture.service"] = {
    short = "service",
    type_ref = "ead::Service",
    label = "name",
    scalars = array("name", "description", "port", "protocol", "bandwidth"),
    relations = array(
      { field = "system", target = "architecture.system", many = false },
      { field = "consumed_by", target = "architecture.system", many = true },
      { field = "security_domain", target = "architecture.securitydomain", many = false }
    ),
  },
  ["architecture.dataentity"] = {
    short = "dataentity",
    type_ref = "ead::DataEntity",
    label = "name",
    scalars = array("name", "description"),
    relations = array(
      { field = "system", target = "architecture.system", many = false },
      { field = "security_domain", target = "architecture.securitydomain", many = false }
    ),
  },
  ["architecture.datacenter"] = {
    short = "datacenter",
    type_ref = "ead::Datacenter",
    label = "name",
    scalars = array("name", "location"),
    relations = array({ field = "security_domain", target = "architecture.securitydomain", many = false }),
  },
  ["architecture.rack"] = {
    short = "rack",
    type_ref = "ead::Rack",
    label = "name",
    scalars = array("name", "row", "column"),
    relations = array(
      { field = "datacenter", target = "architecture.datacenter", many = false },
      { field = "security_domain", target = "architecture.securitydomain", many = false }
    ),
  },
  ["architecture.server"] = {
    short = "server",
    type_ref = "ead::Server",
    label = "hostname",
    scalars = array("hostname", "u_position", "u_size", "ip_address", "os", "cpu_cores", "ram_gb", "mac_address", "subnet", "switch_port", "role"),
    relations = array(
      { field = "datacenter", target = "architecture.datacenter", many = false },
      { field = "systems", target = "architecture.system", many = true },
      { field = "rack", target = "architecture.rack", many = false },
      { field = "security_domain", target = "architecture.securitydomain", many = false }
    ),
  },
  ["architecture.cloudresource"] = {
    short = "cloudresource",
    type_ref = "ead::CloudResource",
    label = "name",
    scalars = array("name", "provider", "resource_type"),
    relations = array(
      { field = "systems", target = "architecture.system", many = true },
      { field = "security_domain", target = "architecture.securitydomain", many = false }
    ),
  },
  ["architecture.database"] = {
    short = "database",
    type_ref = "ead::Database",
    label = "name",
    scalars = array("name", "engine", "port", "connection_pool", "max_connections"),
    relations = array(
      { field = "system", target = "architecture.system", many = false },
      { field = "server", target = "architecture.server", many = false },
      { field = "cloud_resource", target = "architecture.cloudresource", many = false },
      { field = "security_domain", target = "architecture.securitydomain", many = false }
    ),
  },
  ["architecture.project"] = {
    short = "project",
    type_ref = "ead::Project",
    label = "name",
    scalars = array("name", "status", "description", "start_date", "end_date", "planned_start_date", "planned_end_date", "completion_percentage"),
    relations = array(
      { field = "dependencies", target = "architecture.project", many = true },
      { field = "domains", target = "architecture.domain", many = true },
      { field = "capabilities", target = "architecture.capability", many = true },
      { field = "systems", target = "architecture.system", many = true },
      { field = "services", target = "architecture.service", many = true },
      { field = "servers", target = "architecture.server", many = true },
      { field = "cloud_resources", target = "architecture.cloudresource", many = true },
      { field = "security_domain", target = "architecture.securitydomain", many = false }
    ),
  },
  ["architecture.strategicgoal"] = {
    short = "strategicgoal",
    type_ref = "ead::StrategicGoal",
    label = "name",
    scalars = array("name", "description"),
    relations = array(
      { field = "capabilities", target = "architecture.capability", many = true },
      { field = "projects", target = "architecture.project", many = true },
      { field = "security_domain", target = "architecture.securitydomain", many = false }
    ),
  },
  ["architecture.valuestream"] = {
    short = "valuestream",
    type_ref = "ead::ValueStream",
    label = "name",
    scalars = array("name", "description"),
    relations = array(
      { field = "strategic_goals", target = "architecture.strategicgoal", many = true },
      { field = "security_domain", target = "architecture.securitydomain", many = false }
    ),
  },
  ["architecture.businessunit"] = {
    short = "businessunit",
    type_ref = "ead::BusinessUnit",
    label = "name",
    scalars = array("name", "description"),
    relations = array(
      { field = "value_streams", target = "architecture.valuestream", many = true },
      { field = "systems", target = "architecture.system", many = true },
      { field = "security_domain", target = "architecture.securitydomain", many = false }
    ),
  },
  ["architecture.businessprocess"] = {
    short = "businessprocess",
    type_ref = "ead::BusinessProcess",
    label = "name",
    scalars = array("name", "description"),
    relations = array(
      { field = "value_stream", target = "architecture.valuestream", many = false },
      { field = "business_unit", target = "architecture.businessunit", many = false },
      { field = "systems", target = "architecture.system", many = true },
      { field = "security_domain", target = "architecture.securitydomain", many = false }
    ),
  },
}

local function node_id(model, pk)
  local spec = specs[model]
  if not spec then
    error("Unsupported EA Dashboard model: " .. tostring(model))
  end
  return "ead_" .. spec.short .. "_" .. tostring(pk)
end

local function append_attributes(lines, record, spec, order)
  local fields = record.fields or {}
  lines[#lines + 1] = "{"
  lines[#lines + 1] = "  sourceModel: " .. json_quote(record.model)
  lines[#lines + 1] = "  sourcePk: " .. json_scalar(record.pk)
  lines[#lines + 1] = "  sourceOrder: " .. tostring(order)
  for _, field in ipairs(spec.scalars or {}) do
    local value = fields[field]
    if value ~= nil then
      lines[#lines + 1] = "  " .. field .. ": " .. json_scalar(value)
    end
  end
  lines[#lines + 1] = "}"
end

local function append_relationships(lines, record, spec)
  local fields = record.fields or {}
  for _, relation in ipairs(spec.relations or {}) do
    local value = fields[relation.field]
    if value ~= nil and not is_null(value) then
      if relation.many then
        for _, target_pk in ipairs(value) do
          if target_pk ~= nil and not is_null(target_pk) then
            lines[#lines + 1] = "@ead::" .. relation.field .. ":" .. node_id(relation.target, target_pk)
          end
        end
      else
        lines[#lines + 1] = "@ead::" .. relation.field .. ":" .. node_id(relation.target, value)
      end
    end
  end
end

local function fixture_to_itm(records)
  if type(records) ~= "table" then
    error("EA Dashboard JSON input must be a fixture array.")
  end

  local lines = {}
  lines[#lines + 1] = "%metadata"
  lines[#lines + 1] = "{"
  lines[#lines + 1] = "  title: \"EA Dashboard architecture import\""
  lines[#lines + 1] = "  version: \"0.1.0\""
  lines[#lines + 1] = "  profile: \"itm.ea.dashboard\""
  lines[#lines + 1] = "  sourceFormat: \"Django fixture JSON\""
  lines[#lines + 1] = "  generatedBy: \"ea-dashboard-json-to-itm.lua\""
  lines[#lines + 1] = "  recordCount: " .. tostring(#records)
  lines[#lines + 1] = "}"
  lines[#lines + 1] = ""
  lines[#lines + 1] = "%require itm.core ^0.1.0"
  lines[#lines + 1] = "%require itm.validation ^0.1.0"
  lines[#lines + 1] = "%require itm.relationship-identity ^0.1.0"
  lines[#lines + 1] = "%require itm.graph-model ^0.1.0"
  lines[#lines + 1] = "%require itm.viewpoint ^0.1.0"
  lines[#lines + 1] = "%require itm.roundtrip.meta ^0.1.0"
  lines[#lines + 1] = "%require ead.translator.lua ^0.1.0"
  lines[#lines + 1] = ""
  lines[#lines + 1] = "%include ea-dashboard-profile.itm"
  lines[#lines + 1] = "%using ea_dashboard_profile"
  lines[#lines + 1] = ""
  lines[#lines + 1] = "%namespace ead https://example.org/textforge/ea-dashboard"
  lines[#lines + 1] = ""

  for index, record in ipairs(records) do
    local spec = specs[record.model]
    if not spec then
      error("Unsupported EA Dashboard model: " .. tostring(record.model))
    end
    local fields = record.fields or {}
    local label = clean_label(fields[spec.label] or fields.name or fields.hostname or (record.model .. " " .. tostring(record.pk)))
    lines[#lines + 1] = "&" .. node_id(record.model, record.pk) .. " [" .. spec.type_ref .. "] " .. label
    append_attributes(lines, record, spec, index)
    append_relationships(lines, record, spec)
    lines[#lines + 1] = ""
  end

  return table.concat(lines, "\n")
end

local function ea_dashboard_json_to_itm(input_text)
  local records = parse_json(input_text)
  return fixture_to_itm(records) .. "\n"
end

return {
  id = "ea-dashboard-json-to-itm",
  name = "EA Dashboard JSON to ITM",
  category = "Enterprise Architecture",
  description = "Transforms EA Dashboard Django fixture JSON into ITM using ea-dashboard-profile.itm.",
  input = { "text", "json" },
  output = "text",
  run = function(input_value)
    local text = input_value.text or input_value.value or ""
    if trim(text) == "" then
      return input_value:diagnostic("error", "EA Dashboard JSON input is empty.")
    end
    local itm_text = ea_dashboard_json_to_itm(text)
    return input_value:emit_text("itm", itm_text)
  end,
}
