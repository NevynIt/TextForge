-- TextForge Lua automation: BPMN XML -> ITM using bpmn_process_diagram_lite.
-- Place this file under /.textforge/automation/lua/bpmn-xml-to-itm.lua.
-- Input:  focused BPMN XML text resource
-- Output: ITM text resource with languageId "itm"

local function trim(value)
  return tostring(value or ""):gsub("^%s+", ""):gsub("%s+$", "")
end

local function starts_with(value, prefix)
  return string.sub(value, 1, #prefix) == prefix
end

local function local_name(qname)
  qname = tostring(qname or "")
  local _, pos = string.find(qname, ":")
  if pos then
    return string.sub(qname, pos + 1)
  end
  return qname
end

local function xml_unescape(value)
  return tostring(value or "")
    :gsub("&lt;", "<")
    :gsub("&gt;", ">")
    :gsub("&quot;", '"')
    :gsub("&apos;", "'")
    :gsub("&amp;", "&")
end

local function yaml_string(value)
  local text = tostring(value or "")
  text = text:gsub("\\", "\\\\")
  text = text:gsub('"', '\\"')
  text = text:gsub("\r\n", "\n"):gsub("\r", "\n"):gsub("\n", "\\n")
  return '"' .. text .. '"'
end

local function sanitize_itm_id(value)
  local id = tostring(value or "")
  id = id:gsub("[^A-Za-z0-9_-]", "_")
  if id == "" then
    id = "id_missing"
  end
  if not string.match(id, "^[A-Za-z]") then
    id = "id_" .. id
  end
  return id
end

local function parse_attrs(raw)
  local attrs = {}
  raw = tostring(raw or "")
  for key, val in string.gmatch(raw, "([%w_:%.-]+)%s*=%s*\"(.-)\"") do
    attrs[local_name(key)] = xml_unescape(val)
  end
  for key, val in string.gmatch(raw, "([%w_:%.-]+)%s*=%s*'(.-)'") do
    attrs[local_name(key)] = xml_unescape(val)
  end
  return attrs
end

local function parse_xml(xml)
  xml = tostring(xml or "")
  xml = xml:gsub("<%!%[CDATA%[(.-)%]%]>", function(text)
    return text
  end)
  xml = xml:gsub("<!%-%-.-%-%->", "")

  local root = { tag = "__root", qname = "__root", attrs = {}, children = {}, text = "" }
  local stack = { root }
  local pos = 1

  while true do
    local s, e, tag_text = string.find(xml, "<([^>]+)>", pos)
    if not s then
      local tail = string.sub(xml, pos)
      if tail ~= "" and #stack > 0 then
        stack[#stack].text = (stack[#stack].text or "") .. xml_unescape(tail)
      end
      break
    end

    local before = string.sub(xml, pos, s - 1)
    if before ~= "" and #stack > 0 then
      stack[#stack].text = (stack[#stack].text or "") .. xml_unescape(before)
    end

    local body = trim(tag_text)
    if starts_with(body, "?") or starts_with(body, "!") then
      -- processing instruction or declaration; ignore
    elseif starts_with(body, "/") then
      local closing_name = local_name(trim(string.sub(body, 2)))
      if #stack > 1 then
        -- Tolerant pop: examples are well-formed, but this keeps diagnostics simple.
        table.remove(stack)
      end
    else
      local self_closing = string.match(body, "/%s*$") ~= nil
      local normalized = body:gsub("/%s*$", "")
      local qname = string.match(normalized, "^%s*([%w_:%.-]+)") or "unknown"
      local node = {
        tag = local_name(qname),
        qname = qname,
        attrs = parse_attrs(normalized),
        children = {},
        text = "",
      }
      local parent = stack[#stack]
      parent.children[#parent.children + 1] = node
      if not self_closing then
        stack[#stack + 1] = node
      end
    end

    pos = e + 1
  end

  return root
end

local function first_child(node, tag)
  for _, child in ipairs(node.children or {}) do
    if child.tag == tag then
      return child
    end
  end
  return nil
end

local function children_of(node, tag)
  local result = {}
  for _, child in ipairs(node.children or {}) do
    if not tag or child.tag == tag then
      result[#result + 1] = child
    end
  end
  return result
end

local function descendants_of(node, tag, result)
  result = result or {}
  for _, child in ipairs(node.children or {}) do
    if not tag or child.tag == tag then
      result[#result + 1] = child
    end
    descendants_of(child, tag, result)
  end
  return result
end

local function child_text(node, tag)
  local child = first_child(node, tag)
  if not child then
    return ""
  end
  return trim(child.text or "")
end

local type_by_tag = {
  definitions = "bpmn::Definitions",
  process = "bpmn::Process",
  laneSet = "bpmn::LaneSet",
  lane = "bpmn::Lane",
  task = "bpmn::Task",
  subProcess = "bpmn::SubProcess",
  startEvent = "bpmn::StartEvent",
  endEvent = "bpmn::EndEvent",
  exclusiveGateway = "bpmn::ExclusiveGateway",
  dataObject = "bpmn::DataObject",
  dataObjectReference = "bpmn::DataObjectReference",
  dataStoreReference = "bpmn::DataStoreReference",
  group = "bpmn::Group",
  category = "bpmn::Category",
  categoryValue = "bpmn::CategoryValue",
  textAnnotation = "bpmn::TextAnnotation",
}

local supported_node_tags = {
  laneSet = true,
  lane = true,
  task = true,
  subProcess = true,
  startEvent = true,
  endEvent = true,
  exclusiveGateway = true,
  dataObject = true,
  dataObjectReference = true,
  dataStoreReference = true,
  group = true,
  category = true,
  categoryValue = true,
  textAnnotation = true,
}

local function label_for(node)
  local tag = node.tag
  local attrs = node.attrs or {}
  if attrs.name and attrs.name ~= "" then
    return attrs.name
  end
  if tag == "startEvent" then return "Start event" end
  if tag == "endEvent" then return "End event" end
  if tag == "dataObject" then return "Data object" end
  if tag == "group" then return "Group" end
  if tag == "category" then return "Category" end
  if tag == "categoryValue" then return attrs.value or "Category value" end
  if tag == "textAnnotation" then
    local text = child_text(node, "text")
    if text ~= "" then
      local preview = text
      if #preview > 70 then
        preview = string.sub(preview, 1, 70) .. "..."
      end
      return "Text annotation: " .. preview
    end
    return "Text annotation"
  end
  return string.upper(string.sub(tag, 1, 1)) .. string.sub(tag, 2)
end

local function append_pair(pairs, key, value)
  if value ~= nil and tostring(value) ~= "" then
    pairs[#pairs + 1] = { key = key, value = value }
  end
end

local function append_list_pair(pairs, key, values)
  if values and #values > 0 then
    pairs[#pairs + 1] = { key = key, values = values }
  end
end

local function write_pairs(lines, pairs, indent)
  if not pairs or #pairs == 0 then
    return
  end
  lines[#lines + 1] = indent .. "{"
  for _, pair in ipairs(pairs) do
    if pair.values then
      lines[#lines + 1] = indent .. "  " .. pair.key .. ":"
      for _, item in ipairs(pair.values) do
        lines[#lines + 1] = indent .. "    - " .. yaml_string(item)
      end
    else
      lines[#lines + 1] = indent .. "  " .. pair.key .. ": " .. yaml_string(pair.value)
    end
  end
  lines[#lines + 1] = indent .. "}"
end

local function attrs_for_node(node)
  local attrs = node.attrs or {}
  local pairs = {}
  append_pair(pairs, "id", attrs.id)
  append_pair(pairs, "name", attrs.name)
  append_pair(pairs, "isExecutable", attrs.isExecutable)
  append_pair(pairs, "triggeredByEvent", attrs.triggeredByEvent)
  append_pair(pairs, "targetNamespace", attrs.targetNamespace)
  append_pair(pairs, "exporter", attrs.exporter)
  append_pair(pairs, "exporterVersion", attrs.exporterVersion)
  append_pair(pairs, "dataObjectRef", attrs.dataObjectRef)
  append_pair(pairs, "categoryValueRef", attrs.categoryValueRef)
  append_pair(pairs, "value", attrs.value)

  if node.tag == "textAnnotation" then
    append_pair(pairs, "text", child_text(node, "text"))
  end

  if node.tag == "lane" then
    local refs = {}
    for _, ref_node in ipairs(children_of(node, "flowNodeRef")) do
      local ref = trim(ref_node.text or "")
      if ref ~= "" then refs[#refs + 1] = ref end
    end
    append_list_pair(pairs, "flowNodeRefs", refs)
  end

  return pairs
end

local function ensure_array(map, key)
  if not map[key] then
    map[key] = {}
  end
  return map[key]
end

local function add_relationship(relationships_by_source, source, rel_type, target, attrs)
  if not source or source == "" or not target or target == "" then
    return
  end
  local list = ensure_array(relationships_by_source, source)
  list[#list + 1] = {
    type = rel_type,
    target = target,
    attrs = attrs or {},
  }
end

local function build_id_map(definitions)
  local map = {}
  for _, node in ipairs(descendants_of(definitions)) do
    local id = node.attrs and node.attrs.id
    if id and id ~= "" then
      map[id] = sanitize_itm_id(id)
    end
  end
  return map
end

local function mapped_id(id_map, raw_id)
  return id_map[raw_id] or sanitize_itm_id(raw_id)
end

local function relationship_attr_pairs(rel)
  local attrs = rel.attrs or {}
  local pairs = {}
  append_pair(pairs, "id", attrs.id)
  append_pair(pairs, "name", attrs.name)
  append_pair(pairs, "sourceRef", attrs.sourceRef)
  append_pair(pairs, "targetRef", attrs.targetRef)
  return pairs
end

local function emit_relationships(lines, relationships_by_source, id_map, source_raw_id, indent)
  local rels = relationships_by_source[source_raw_id]
  if not rels then return end
  for _, rel in ipairs(rels) do
    lines[#lines + 1] = indent .. "@" .. rel.type .. ":" .. mapped_id(id_map, rel.target)
    write_pairs(lines, relationship_attr_pairs(rel), indent)
  end
end

local function collect_relationships(process, id_map)
  local relationships_by_source = {}

  for _, child in ipairs(children_of(process)) do
    local attrs = child.attrs or {}
    if child.tag == "sequenceFlow" then
      add_relationship(relationships_by_source, attrs.sourceRef, "bpmn::sequenceFlow", attrs.targetRef, {
        id = attrs.id,
        name = attrs.name,
        sourceRef = attrs.sourceRef,
        targetRef = attrs.targetRef,
      })
    elseif child.tag == "association" then
      add_relationship(relationships_by_source, attrs.sourceRef, "bpmn::association", attrs.targetRef, {
        id = attrs.id,
        sourceRef = attrs.sourceRef,
        targetRef = attrs.targetRef,
      })
    elseif child.tag == "dataObjectReference" and attrs.dataObjectRef then
      add_relationship(relationships_by_source, attrs.id, "bpmn::dataObjectRef", attrs.dataObjectRef, {
        id = (attrs.id or "") .. "_dataObjectRef",
        sourceRef = attrs.id,
        targetRef = attrs.dataObjectRef,
      })
    elseif child.tag == "group" and attrs.categoryValueRef then
      add_relationship(relationships_by_source, attrs.id, "bpmn::categoryValueRef", attrs.categoryValueRef, {
        id = (attrs.id or "") .. "_categoryValueRef",
        sourceRef = attrs.id,
        targetRef = attrs.categoryValueRef,
      })
    end
  end

  return relationships_by_source
end

local function emit_node(lines, node, id_map, relationships_by_source, indent)
  local attrs = node.attrs or {}
  local id = mapped_id(id_map, attrs.id or node.tag)
  local node_type = type_by_tag[node.tag]
  if not node_type then
    return
  end

  lines[#lines + 1] = indent .. "&" .. id .. " [" .. node_type .. "] " .. label_for(node)
  write_pairs(lines, attrs_for_node(node), indent)
  emit_relationships(lines, relationships_by_source, id_map, attrs.id, indent)
end

local function emit_process_children(lines, process, id_map, relationships_by_source, indent)
  for _, child in ipairs(children_of(process)) do
    if child.tag == "laneSet" then
      emit_node(lines, child, id_map, relationships_by_source, indent)
      for _, lane in ipairs(children_of(child, "lane")) do
        emit_node(lines, lane, id_map, relationships_by_source, indent .. "  ")
      end
    elseif child.tag == "category" then
      emit_node(lines, child, id_map, relationships_by_source, indent)
      for _, category_value in ipairs(children_of(child, "categoryValue")) do
        emit_node(lines, category_value, id_map, relationships_by_source, indent .. "  ")
      end
    elseif supported_node_tags[child.tag] then
      emit_node(lines, child, id_map, relationships_by_source, indent)
    end
  end
end

local function collect_di(definitions, id_map)
  local bounds = {}
  local routes = {}
  local label_bounds = {}

  for _, shape in ipairs(descendants_of(definitions, "BPMNShape")) do
    local element = shape.attrs and shape.attrs.bpmnElement
    local b = first_child(shape, "Bounds")
    if element and b and b.attrs then
      bounds[#bounds + 1] = {
        element = mapped_id(id_map, element),
        x = b.attrs.x,
        y = b.attrs.y,
        width = b.attrs.width,
        height = b.attrs.height,
      }
    end

    local label = first_child(shape, "BPMNLabel")
    local lb = label and first_child(label, "Bounds") or nil
    if element and lb and lb.attrs then
      label_bounds[#label_bounds + 1] = {
        element = mapped_id(id_map, element),
        x = lb.attrs.x,
        y = lb.attrs.y,
        width = lb.attrs.width,
        height = lb.attrs.height,
      }
    end
  end

  for _, edge in ipairs(descendants_of(definitions, "BPMNEdge")) do
    local element = edge.attrs and edge.attrs.bpmnElement
    local waypoints = {}
    for _, waypoint in ipairs(children_of(edge, "waypoint")) do
      if waypoint.attrs then
        waypoints[#waypoints + 1] = {
          x = waypoint.attrs.x,
          y = waypoint.attrs.y,
        }
      end
    end
    if element and #waypoints > 0 then
      routes[#routes + 1] = {
        relationship = mapped_id(id_map, element),
        waypoints = waypoints,
      }
    end

    local label = first_child(edge, "BPMNLabel")
    local lb = label and first_child(label, "Bounds") or nil
    if element and lb and lb.attrs then
      label_bounds[#label_bounds + 1] = {
        element = mapped_id(id_map, element),
        x = lb.attrs.x,
        y = lb.attrs.y,
        width = lb.attrs.width,
        height = lb.attrs.height,
      }
    end
  end

  return bounds, routes, label_bounds
end

local function write_di_view(lines, definitions, id_map)
  local bounds, routes, label_bounds = collect_di(definitions, id_map)
  if #bounds == 0 and #routes == 0 and #label_bounds == 0 then
    return
  end

  lines[#lines + 1] = ""
  lines[#lines + 1] = "%view imported_bpmn_diagram"
  lines[#lines + 1] = "{"
  lines[#lines + 1] = "  viewpoint: bpmn_process_diagram"
  lines[#lines + 1] = "  source: " .. yaml_string("BPMN DI")
  lines[#lines + 1] = "  deltas:"

  if #bounds > 0 then
    lines[#lines + 1] = "    bounds:"
    for _, item in ipairs(bounds) do
      lines[#lines + 1] = "      - element: " .. yaml_string(item.element)
      lines[#lines + 1] = "        x: " .. yaml_string(item.x)
      lines[#lines + 1] = "        y: " .. yaml_string(item.y)
      lines[#lines + 1] = "        width: " .. yaml_string(item.width)
      lines[#lines + 1] = "        height: " .. yaml_string(item.height)
    end
  end

  if #routes > 0 then
    lines[#lines + 1] = "    routes:"
    for _, item in ipairs(routes) do
      lines[#lines + 1] = "      - relationship: " .. yaml_string(item.relationship)
      lines[#lines + 1] = "        waypoints:"
      for _, waypoint in ipairs(item.waypoints) do
        lines[#lines + 1] = "          - { x: " .. yaml_string(waypoint.x) .. ", y: " .. yaml_string(waypoint.y) .. " }"
      end
    end
  end

  if #label_bounds > 0 then
    lines[#lines + 1] = "    labelBounds:"
    for _, item in ipairs(label_bounds) do
      lines[#lines + 1] = "      - element: " .. yaml_string(item.element)
      lines[#lines + 1] = "        x: " .. yaml_string(item.x)
      lines[#lines + 1] = "        y: " .. yaml_string(item.y)
      lines[#lines + 1] = "        width: " .. yaml_string(item.width)
      lines[#lines + 1] = "        height: " .. yaml_string(item.height)
    end
  end

  lines[#lines + 1] = "}"
end

local function bpmn_xml_to_itm(xml_text)
  local tree = parse_xml(xml_text)
  local definitions = first_child(tree, "definitions") or descendants_of(tree, "definitions")[1]
  if not definitions then
    error("No BPMN <definitions> element found.")
  end

  local process = first_child(definitions, "process") or descendants_of(definitions, "process")[1]
  if not process then
    error("No BPMN <process> element found.")
  end

  local id_map = build_id_map(definitions)
  local relationships_by_source = collect_relationships(process, id_map)
  local title = (process.attrs and process.attrs.name) or "Imported BPMN process"
  local definition_id = mapped_id(id_map, (definitions.attrs and definitions.attrs.id) or "Definitions_1")
  local process_id = mapped_id(id_map, (process.attrs and process.attrs.id) or "Process_1")

  local lines = {}
  lines[#lines + 1] = "%metadata"
  lines[#lines + 1] = "{"
  lines[#lines + 1] = "  title: " .. yaml_string(title)
  lines[#lines + 1] = "  version: " .. yaml_string("0.1.0")
  lines[#lines + 1] = "  profile: " .. yaml_string("bpmn_process_diagram_lite")
  lines[#lines + 1] = "  sourceFormat: " .. yaml_string("BPMN 2.0 XML")
  lines[#lines + 1] = "  generatedBy: " .. yaml_string("bpmn-xml-to-itm.lua")
  lines[#lines + 1] = "}"
  lines[#lines + 1] = ""
  lines[#lines + 1] = "%include bpmn-process-diagram-lite-profile.itm"
  lines[#lines + 1] = "%using bpmn_process_diagram_lite"
  lines[#lines + 1] = ""
  lines[#lines + 1] = "%namespace local https://example.org/textforge/bpmn/imported"
  lines[#lines + 1] = ""

  lines[#lines + 1] = "&" .. definition_id .. " [bpmn::Definitions] " .. title .. " definitions"
  write_pairs(lines, attrs_for_node(definitions), "")
  lines[#lines + 1] = ""
  lines[#lines + 1] = "  &" .. process_id .. " [bpmn::Process] " .. label_for(process)
  write_pairs(lines, attrs_for_node(process), "  ")
  lines[#lines + 1] = ""
  emit_process_children(lines, process, id_map, relationships_by_source, "    ")

  write_di_view(lines, definitions, id_map)

  return table.concat(lines, "\n") .. "\n"
end

return {
  id = "bpmn-xml-to-itm",
  name = "BPMN XML to ITM",
  category = "BPMN",
  description = "Transforms a BPMN XML text resource into ITM using the bpmn_process_diagram_lite profile.",
  input = { "text" },
  output = "text",
  run = function(input_value)
    local xml_text = input_value.text or input_value.value or ""
    if trim(xml_text) == "" then
      return input_value:diagnostic("error", "BPMN XML input is empty.")
    end
    local itm_text = bpmn_xml_to_itm(xml_text)
    return input_value:emit_text("itm", itm_text)
  end,
}
