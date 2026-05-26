// src/diagnostics.ts
var ItmDiagnosticError = class extends Error {
  constructor(message, diagnostics, partialResult) {
    super(message);
    this.name = "ItmDiagnosticError";
    this.diagnostics = diagnostics;
    this.partialResult = partialResult;
  }
};
function hasErrorDiagnostics(diagnostics) {
  return (diagnostics ?? []).some((diagnostic) => diagnostic.severity === "error");
}
function throwOnErrorDiagnostics(diagnostics, message, partialResult) {
  const collectedDiagnostics = [...diagnostics ?? []];
  if (!hasErrorDiagnostics(collectedDiagnostics)) {
    return;
  }
  throw new ItmDiagnosticError(message, collectedDiagnostics, partialResult);
}

// src/resolve.ts
function mapByUid(items) {
  return new Map(items.map((item) => [item.uid, item]));
}
function mapByName(items) {
  return new Map(items.map((item) => [item.name, item]));
}
function mapByQualifiedId(items) {
  const entries = [];
  for (const item of items) {
    if (item.qualifiedId) {
      entries.push([item.qualifiedId, item]);
    }
  }
  return new Map(entries);
}
function resolveStyleRefs(styleUids, stylesByUid) {
  if (!styleUids) {
    return [];
  }
  return styleUids.map((uid) => stylesByUid.get(uid)).filter((style) => Boolean(style));
}
function resolveEntityTypes(entityTypes, stylesByUid) {
  if (!entityTypes) {
    return [];
  }
  const resolved = entityTypes.map((entityType) => ({
    ...entityType,
    superTypes: [],
    defaultStyles: resolveStyleRefs(entityType.defaultStyleUids, stylesByUid)
  }));
  const byName = mapByName(resolved);
  for (const entityType of resolved) {
    entityType.superTypes = (entityTypes.find((candidate) => candidate.uid === entityType.uid)?.superTypeRefs ?? []).map((name) => byName.get(name)).filter((value) => Boolean(value));
  }
  return resolved;
}
function resolveRelationshipTypes(relationshipTypes, entityTypesByName, stylesByUid) {
  if (!relationshipTypes) {
    return [];
  }
  const resolved = relationshipTypes.map((relationshipType) => ({
    ...relationshipType,
    superTypes: [],
    sourceTypes: (relationshipType.sourceTypeRefs ?? []).map((name) => entityTypesByName.get(name)).filter((value) => Boolean(value)),
    targetTypes: (relationshipType.targetTypeRefs ?? []).map((name) => entityTypesByName.get(name)).filter((value) => Boolean(value)),
    inverseType: void 0,
    defaultStyles: resolveStyleRefs(relationshipType.defaultStyleUids, stylesByUid)
  }));
  const byName = mapByName(resolved);
  for (const relationshipType of resolved) {
    const source = relationshipTypes.find((candidate) => candidate.uid === relationshipType.uid);
    relationshipType.superTypes = (source?.superTypeRefs ?? []).map((name) => byName.get(name)).filter((value) => Boolean(value));
    relationshipType.inverseType = source?.inverseTypeRef ? byName.get(source.inverseTypeRef) : void 0;
  }
  return resolved;
}
function resolveViewpoints(viewpoints, stylesByUid) {
  if (!viewpoints) {
    return [];
  }
  return viewpoints.map((viewpoint) => ({
    ...viewpoint,
    styles: resolveStyleRefs(viewpoint.styleUids, stylesByUid)
  }));
}
function resolveViews(views, viewpointsByName) {
  if (!views) {
    return [];
  }
  return views.map((view) => ({
    ...view,
    viewpoint: viewpointsByName.get(view.viewpointRef)
  }));
}
function resolvePackages(packages, stylesByUid, validationRules) {
  if (!packages) {
    return [];
  }
  return packages.map((pkg) => {
    const entityTypes = resolveEntityTypes(pkg.entityTypes, stylesByUid);
    const entityTypesByName = mapByName(entityTypes);
    const relationshipTypes = resolveRelationshipTypes(pkg.relationshipTypes, entityTypesByName, stylesByUid);
    const viewpoints = resolveViewpoints(pkg.viewpoints, stylesByUid);
    return {
      ...pkg,
      entityTypes,
      relationshipTypes,
      validationRules: pkg.validationRules ? validationRules.filter((rule) => pkg.validationRules?.some((candidate) => candidate.uid === rule.uid)) : [],
      styles: pkg.styles ?? [],
      viewpoints
    };
  });
}
function resolveEntityRelations(entities, relationships, overlays) {
  const entitiesByUid = mapByUid(entities);
  const relationshipsByUid = mapByUid(relationships);
  const overlaysByUid = mapByUid(overlays);
  for (const entity of entities) {
    const source = entity;
    entity.parent = source.parentId ? entitiesByUid.get(source.parentId) : void 0;
    entity.children = (source.childIds ?? []).map((uid) => entitiesByUid.get(uid)).filter((value) => Boolean(value));
    entity.incoming = (source.incomingRelationshipIds ?? []).map((uid) => relationshipsByUid.get(uid)).filter((value) => Boolean(value));
    entity.outgoing = (source.outgoingRelationshipIds ?? []).map((uid) => relationshipsByUid.get(uid)).filter((value) => Boolean(value));
    entity.overlays = (source.overlayIds ?? []).map((uid) => overlaysByUid.get(uid)).filter((value) => Boolean(value));
  }
}
function resolveRelationships(relationships, entitiesByUid, overlaysByUid) {
  return relationships.map((relationship) => {
    const source = entitiesByUid.get(relationship.sourceId);
    if (!source) {
      return void 0;
    }
    return {
      ...relationship,
      source,
      target: relationship.targetId ? entitiesByUid.get(relationship.targetId) : void 0,
      overlays: (relationship.overlayIds ?? []).map((uid) => overlaysByUid.get(uid)).filter((value) => Boolean(value))
    };
  }).filter((relationship) => Boolean(relationship));
}
function resolveOverlays(overlays, entitiesByUid) {
  if (!overlays) {
    return [];
  }
  return overlays.map((overlay) => ({
    ...overlay,
    target: overlay.targetUid ? entitiesByUid.get(overlay.targetUid) : void 0,
    relationshipAdditions: []
  }));
}
function resolveIncludes(includes) {
  return (includes ?? []).map((include) => ({
    ...include,
    resolvedDocument: void 0
  }));
}
function resolvePackageUsages(packageUsages, packagesByUid) {
  return (packageUsages ?? []).map((packageUsage) => ({
    ...packageUsage,
    package: packageUsage.packageUid ? packagesByUid.get(packageUsage.packageUid) : void 0
  }));
}
function resolveDiagnostics(diagnostics, entitiesByUid, relationshipsByUid, validationRulesByUid, viewsByUid, viewpointsByUid, packagesByUid, document) {
  return (diagnostics ?? []).map((diagnostic) => ({
    ...diagnostic,
    entity: diagnostic.entityUid ? entitiesByUid.get(diagnostic.entityUid) : void 0,
    relationship: diagnostic.relationshipUid ? relationshipsByUid.get(diagnostic.relationshipUid) : void 0,
    directive: diagnostic.directiveName ? document.directives?.find((directive) => directive.name === diagnostic.directiveName) : void 0,
    rule: diagnostic.ruleUid ? validationRulesByUid.get(diagnostic.ruleUid) : void 0,
    view: diagnostic.viewUid ? viewsByUid.get(diagnostic.viewUid) : void 0,
    viewpoint: diagnostic.viewpointUid ? viewpointsByUid.get(diagnostic.viewpointUid) : void 0,
    namespace: diagnostic.namespacePrefix ? document.namespaces?.find((namespace) => namespace.prefix === diagnostic.namespacePrefix) : void 0,
    package: diagnostic.packageUid ? packagesByUid.get(diagnostic.packageUid) : void 0
  }));
}
function createDocumentIndexes(document) {
  const stylesByUid = mapByUid(document.styles ?? []);
  const entityTypes = resolveEntityTypes(document.entityTypes, stylesByUid);
  const entityTypesByName = mapByName(entityTypes);
  const relationshipTypes = resolveRelationshipTypes(document.relationshipTypes, entityTypesByName, stylesByUid);
  const viewpoints = resolveViewpoints(document.viewpoints, stylesByUid);
  const views = resolveViews(document.views, mapByName(viewpoints));
  const packages = resolvePackages(document.packages, stylesByUid, document.validationRules ?? []);
  return {
    entitiesByUid: /* @__PURE__ */ new Map(),
    entitiesByQualifiedId: /* @__PURE__ */ new Map(),
    relationshipsByUid: /* @__PURE__ */ new Map(),
    relationshipsByQualifiedId: /* @__PURE__ */ new Map(),
    namespacesByPrefix: new Map((document.namespaces ?? []).map((namespace) => [namespace.prefix, namespace])),
    viewpointsByName: mapByName(viewpoints),
    viewsByName: mapByName(views),
    entityTypesByName,
    relationshipTypesByName: mapByName(relationshipTypes),
    packagesByUid: mapByUid(packages)
  };
}
function resolveDocument(document) {
  const resolvedEntities = document.entities.map((entity) => ({
    ...entity,
    children: [],
    incoming: [],
    outgoing: [],
    overlays: []
  }));
  const entitiesByUid = mapByUid(resolvedEntities);
  const overlays = resolveOverlays(document.overlays, entitiesByUid);
  const overlaysByUid = mapByUid(overlays);
  const relationships = resolveRelationships(document.relationships, entitiesByUid, overlaysByUid);
  resolveEntityRelations(resolvedEntities, relationships, overlays);
  const styles = document.styles ?? [];
  const stylesByUid = mapByUid(styles);
  const entityTypes = resolveEntityTypes(document.entityTypes, stylesByUid);
  const entityTypesByName = mapByName(entityTypes);
  const relationshipTypes = resolveRelationshipTypes(document.relationshipTypes, entityTypesByName, stylesByUid);
  const viewpoints = resolveViewpoints(document.viewpoints, stylesByUid);
  const viewpointsByName = mapByName(viewpoints);
  const views = resolveViews(document.views, viewpointsByName);
  const viewByUid = mapByUid(views);
  const validationRules = document.validationRules ?? [];
  const validationRulesByUid = mapByUid(validationRules);
  const packages = resolvePackages(document.packages, stylesByUid, validationRules);
  const packagesByUid = mapByUid(packages);
  const packageUsages = resolvePackageUsages(document.packageUsages, packagesByUid);
  const includes = resolveIncludes(document.includes);
  const relationshipsByUid = mapByUid(relationships);
  const diagnostics = resolveDiagnostics(
    document.diagnostics,
    entitiesByUid,
    relationshipsByUid,
    validationRulesByUid,
    viewByUid,
    mapByUid(viewpoints),
    packagesByUid,
    document
  );
  const indexes = {
    entitiesByUid,
    entitiesByQualifiedId: mapByQualifiedId(resolvedEntities),
    relationshipsByUid,
    relationshipsByQualifiedId: mapByQualifiedId(relationships),
    namespacesByPrefix: new Map((document.namespaces ?? []).map((namespace) => [namespace.prefix, namespace])),
    viewpointsByName,
    viewsByName: mapByName(views),
    entityTypesByName,
    relationshipTypesByName: mapByName(relationshipTypes),
    packagesByUid
  };
  return {
    ...document,
    entities: resolvedEntities,
    relationships,
    entityTypes: entityTypes.length > 0 ? entityTypes : void 0,
    relationshipTypes: relationshipTypes.length > 0 ? relationshipTypes : void 0,
    viewpoints: viewpoints.length > 0 ? viewpoints : void 0,
    views: views.length > 0 ? views : void 0,
    includes: includes.length > 0 ? includes : void 0,
    packages: packages.length > 0 ? packages : void 0,
    packageUsages: packageUsages.length > 0 ? packageUsages : void 0,
    overlays: overlays.length > 0 ? overlays : void 0,
    diagnostics: diagnostics.length > 0 ? diagnostics : void 0,
    indexes
  };
}
function getEntityByUid(document, uid) {
  return document.indexes.entitiesByUid.get(uid);
}
function getRelationshipByUid(document, uid) {
  return document.indexes.relationshipsByUid.get(uid);
}
function isResolvedDocument(value) {
  return "indexes" in value;
}

// src/parse.ts
import { parse as parseYaml } from "yaml";
var KNOWN_DIRECTIVES = /* @__PURE__ */ new Set([
  "metadata",
  "include",
  "namespace",
  "entitytype",
  "relationshiptype",
  "style",
  "viewpoint",
  "view",
  "package",
  "using",
  "repository",
  "require",
  "rule"
]);
var PIPELINE_OPERATIONS = /* @__PURE__ */ new Set([
  "select",
  "includeEdges",
  "exclude",
  "validate",
  "transform",
  "layout",
  "render",
  "export",
  "plugin"
]);
function normalizeLeadingWhitespace(input) {
  const match = input.match(/^[\t ]*/u);
  const leading = match?.[0] ?? "";
  const normalizedLeading = leading.replace(/\t/gu, "  ");
  const remainder = input.slice(leading.length);
  return {
    normalized: `${normalizedLeading}${remainder}`,
    indent: normalizedLeading.length
  };
}
function toSourceRange(lineNumber, raw) {
  return {
    startLine: lineNumber,
    startColumn: 1,
    endLine: lineNumber,
    endColumn: raw.length + 1
  };
}
function toSourceRangeSpan(startLine, startColumn, endLine, endColumn) {
  return {
    startLine,
    startColumn,
    endLine,
    endColumn
  };
}
function sanitizeUidSegment(value) {
  return value.replace(/[^A-Za-z0-9:_-]+/gu, "_");
}
function asRecord(value) {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return void 0;
  }
  return value;
}
function toItmValue(value) {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => toItmValue(item));
  }
  if (typeof value === "object") {
    const result = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = toItmValue(entry);
    }
    return result;
  }
  return String(value);
}
function splitQualifiedName(name) {
  const parts = name.split("::");
  if (parts.length > 1) {
    return {
      ...parts[0] ? { namespacePrefix: parts[0] } : {},
      localName: parts.slice(1).join("::")
    };
  }
  return { localName: name };
}
function isValidIdentifierSegment(value) {
  return /^[A-Za-z_][A-Za-z0-9_-]*$/u.test(value);
}
function validateEntityId(value) {
  if (value === void 0) {
    return void 0;
  }
  if (value.length === 0) {
    return "Ampersand id marker has no identifier.";
  }
  const parts = value.split("::");
  if (parts.some((part) => part.length === 0)) {
    return "Entity id contains an empty namespace or local identifier segment.";
  }
  if (parts.every((part) => isValidIdentifierSegment(part))) {
    return void 0;
  }
  if (/^[0-9]/u.test(parts[parts.length - 1] ?? "")) {
    return "Entity id starts with a digit.";
  }
  return "Entity id contains invalid characters.";
}
function qualifyName(name, defaultNamespace) {
  if (name.includes("::") || !defaultNamespace) {
    return name;
  }
  return `${defaultNamespace}::${name}`;
}
function extractInlineAttributeBlock(input) {
  const trimmed = input.trimEnd();
  const firstRelationshipTokenStart = trimmed.search(/(?:^|\s)@/u);
  for (let start = 0; start < trimmed.length; start += 1) {
    if (trimmed[start] !== "{" || start === 0 || !/\s/u.test(trimmed[start - 1] ?? "")) {
      continue;
    }
    if (firstRelationshipTokenStart >= 0 && start > firstRelationshipTokenStart) {
      break;
    }
    let depth = 0;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escaped = false;
    for (let end = start; end < trimmed.length; end += 1) {
      const current = trimmed[end];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (inDoubleQuote) {
        if (current === "\\") {
          escaped = true;
        } else if (current === '"') {
          inDoubleQuote = false;
        }
        continue;
      }
      if (inSingleQuote) {
        if (current === "'") {
          inSingleQuote = false;
        }
        continue;
      }
      if (current === '"') {
        inDoubleQuote = true;
        continue;
      }
      if (current === "'") {
        inSingleQuote = true;
        continue;
      }
      if (current === "{") {
        depth += 1;
        continue;
      }
      if (current !== "}") {
        continue;
      }
      depth -= 1;
      if (depth !== 0) {
        continue;
      }
      const before = trimmed.slice(0, start).trimEnd();
      const after = trimmed.slice(end + 1).trim();
      if (after.length > 0 && !after.split(/\s+/u).every((token) => token.startsWith("@"))) {
        break;
      }
      return {
        content: [before, after].filter(Boolean).join(" "),
        blockText: trimmed.slice(start, end + 1)
      };
    }
  }
  return { content: trimmed };
}
function splitRelationshipToken(token) {
  const raw = token.startsWith("@") ? token.slice(1) : token;
  for (let index = 0; index < raw.length; index += 1) {
    const current = raw[index];
    const previous = raw[index - 1];
    const next = raw[index + 1];
    if (current === ":" && previous !== ":" && next !== ":") {
      return {
        raw,
        typeRef: raw.slice(0, index),
        targetRef: raw.slice(index + 1)
      };
    }
  }
  return {
    raw,
    targetRef: raw
  };
}
function parseScalarString(value) {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return void 0;
}
function parseStringArray(value) {
  if (!Array.isArray(value)) {
    return void 0;
  }
  return value.map((entry) => parseScalarString(entry)).filter((entry) => Boolean(entry));
}
function parseViewpointParameters(value) {
  const parameters = [];
  if (Array.isArray(value)) {
    for (const entry of value) {
      const record = asRecord(entry);
      if (!record) {
        continue;
      }
      const name = parseScalarString(record.name);
      const type = parseScalarString(record.type);
      if (!name || !type) {
        continue;
      }
      const description = parseScalarString(record.description);
      parameters.push({
        name,
        type,
        ...record.defaultValue !== void 0 ? { defaultValue: record.defaultValue } : {},
        ...typeof record.required === "boolean" ? { required: record.required } : {},
        ...description ? { description } : {},
        ...Array.isArray(record.values) ? { values: record.values } : {}
      });
    }
    return parameters.length > 0 ? parameters : void 0;
  }
  const recordValue = asRecord(value);
  if (!recordValue) {
    return void 0;
  }
  for (const [name, entry] of Object.entries(recordValue)) {
    const record = asRecord(entry);
    if (!record) {
      continue;
    }
    const type = parseScalarString(record.type);
    if (!type) {
      continue;
    }
    const description = parseScalarString(record.description);
    parameters.push({
      name,
      type,
      ...(record.defaultValue ?? record.default) !== void 0 ? { defaultValue: record.defaultValue ?? record.default } : {},
      ...typeof record.required === "boolean" ? { required: record.required } : {},
      ...description ? { description } : {},
      ...Array.isArray(record.values) ? { values: record.values } : {}
    });
  }
  return parameters.length > 0 ? parameters : void 0;
}
function inferGeneratedAssetKind(pathOrUri) {
  if (!pathOrUri) {
    return "text";
  }
  const normalized = pathOrUri.toLowerCase();
  if (normalized.endsWith(".svg")) {
    return "svg";
  }
  if (normalized.endsWith(".png")) {
    return "png";
  }
  if (normalized.endsWith(".html") || normalized.endsWith(".htm")) {
    return "html";
  }
  if (normalized.endsWith(".json")) {
    return "json";
  }
  if (normalized.endsWith(".xml")) {
    return "xml";
  }
  return "text";
}
function parseGeneratedAssets(value) {
  if (!Array.isArray(value)) {
    return void 0;
  }
  const assets = [];
  for (const entry of value) {
    const record = asRecord(entry);
    if (!record) {
      continue;
    }
    const path = parseScalarString(record.path);
    const uri = parseScalarString(record.uri);
    const kind = parseScalarString(record.kind);
    const hash = parseScalarString(record.hash);
    const contentHash = parseScalarString(record.contentHash);
    assets.push({
      kind: kind ?? inferGeneratedAssetKind(path ?? uri),
      ...path ? { path } : {},
      ...uri ? { uri } : {},
      ...hash ? { hash } : {},
      ...contentHash ? { contentHash } : {}
    });
  }
  return assets.length > 0 ? assets : void 0;
}
function parseViewTarget(record) {
  const node = parseScalarString(record.node);
  if (node) {
    return { targetKind: "entity", targetRef: node };
  }
  const relationship = parseScalarString(record.relationship);
  if (relationship) {
    return { targetKind: "relationship", targetRef: relationship };
  }
  return void 0;
}
function parseViewDeltas(value) {
  const record = asRecord(value);
  if (!record) {
    return {};
  }
  const deltas = [];
  for (const entry of Array.isArray(record.hidden) ? record.hidden : []) {
    const item = asRecord(entry);
    const target = item ? parseViewTarget(item) : void 0;
    if (!target) {
      continue;
    }
    deltas.push({
      kind: "hidden",
      targetKind: target.targetKind,
      targetRef: target.targetRef,
      hidden: true
    });
  }
  for (const entry of Array.isArray(record.hiddenRelationships) ? record.hiddenRelationships : []) {
    const item = asRecord(entry);
    const relationship = item ? parseScalarString(item.relationship) : parseScalarString(entry);
    if (!relationship) {
      continue;
    }
    deltas.push({
      kind: "hidden",
      targetKind: "relationship",
      targetRef: relationship,
      hidden: true
    });
  }
  for (const entry of Array.isArray(record.collapsed) ? record.collapsed : []) {
    const item = asRecord(entry);
    const target = item ? parseViewTarget(item) : void 0;
    if (!target || target.targetKind !== "entity") {
      continue;
    }
    deltas.push({
      kind: "expanded-collapsed",
      targetRef: target.targetRef,
      expanded: false
    });
  }
  for (const entry of Array.isArray(record.expanded) ? record.expanded : []) {
    const item = asRecord(entry);
    const target = item ? parseViewTarget(item) : void 0;
    if (!target || target.targetKind !== "entity") {
      continue;
    }
    deltas.push({
      kind: "expanded-collapsed",
      targetRef: target.targetRef,
      expanded: true
    });
  }
  for (const entry of Array.isArray(record.moved) ? record.moved : []) {
    const item = asRecord(entry);
    const target = item ? parseViewTarget(item) : void 0;
    if (!target) {
      continue;
    }
    deltas.push({
      kind: "moved",
      targetKind: target.targetKind,
      targetRef: target.targetRef,
      ...typeof item?.dx === "number" ? { dx: item.dx } : {},
      ...typeof item?.dy === "number" ? { dy: item.dy } : {},
      ...typeof item?.x === "number" ? { x: item.x } : {},
      ...typeof item?.y === "number" ? { y: item.y } : {}
    });
  }
  for (const entry of Array.isArray(record.pinned) ? record.pinned : []) {
    const item = asRecord(entry);
    const target = item ? parseViewTarget(item) : void 0;
    if (!target || typeof item?.x !== "number" || typeof item?.y !== "number") {
      continue;
    }
    deltas.push({
      kind: "pinned",
      targetKind: target.targetKind,
      targetRef: target.targetRef,
      x: item.x,
      y: item.y
    });
  }
  for (const entry of Array.isArray(record.styleOverrides) ? record.styleOverrides : []) {
    const item = asRecord(entry);
    const selector = item ? parseScalarString(item.selector) : void 0;
    const style = item ? createAttributeBag(item.style) : void 0;
    if (!selector || !style) {
      continue;
    }
    deltas.push({
      kind: "style-override",
      selector: { raw: selector },
      style
    });
  }
  for (const entry of Array.isArray(record.labelOverrides) ? record.labelOverrides : []) {
    const item = asRecord(entry);
    const target = item ? parseViewTarget(item) : void 0;
    const label = item ? parseScalarString(item.label) : void 0;
    if (!target || !label) {
      continue;
    }
    deltas.push({
      kind: "label-override",
      targetKind: target.targetKind,
      targetRef: target.targetRef,
      label
    });
  }
  const notes = parseStringArray(record.notes);
  const generatedAssets = parseGeneratedAssets(record.generatedAssets);
  return {
    ...deltas.length > 0 ? { deltas } : {},
    ...notes ? { notes } : {},
    ...generatedAssets ? { generatedAssets } : {}
  };
}
function extractEmbeddedBlocks(text) {
  const blocks = [];
  const pattern = /```([^\n]*)\n([\s\S]*?)```/gu;
  for (const match of text.matchAll(pattern)) {
    const language = match[1] ?? "";
    const content = match[2] ?? "";
    blocks.push({
      language: language.trim(),
      content
    });
  }
  return blocks;
}
function collectBlock(lines, startIndex) {
  const collected = [];
  let endIndex = startIndex;
  let closed = false;
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    collected.push(line);
    endIndex = index;
    if (line.trim() === "}") {
      closed = true;
      break;
    }
  }
  const rawText = collected.join("\n");
  if (!closed) {
    return {
      rawText,
      endIndex,
      closed: false,
      parseError: "Block has no closing brace."
    };
  }
  const parseYamlValue = (input) => {
    try {
      return {
        rawText,
        endIndex,
        closed: true,
        value: toItmValue(parseYaml(input))
      };
    } catch (error) {
      return {
        rawText,
        endIndex,
        closed: true,
        parseError: error instanceof Error ? error.message : String(error)
      };
    }
  };
  if (collected.length === 1) {
    return parseYamlValue(rawText);
  }
  const inner = collected.slice(1, -1).join("\n");
  if (inner.trim().length === 0) {
    return {
      rawText,
      endIndex,
      closed: true,
      value: {}
    };
  }
  return parseYamlValue(inner);
}
var SelectorParser = class {
  constructor(text) {
    this.index = 0;
    this.text = text;
  }
  parse() {
    this.index = 0;
    this.errorMessage = void 0;
    this.parseExpression();
    if (this.errorMessage) {
      return { end: this.index, error: this.errorMessage };
    }
    this.skipWhitespace();
    return { end: this.index };
  }
  parseExpression() {
    this.parseOr();
  }
  parseOr() {
    this.parseXor();
    while (!this.errorMessage && this.matchWord("OR")) {
      this.parseXor();
    }
  }
  parseXor() {
    this.parseAnd();
    while (!this.errorMessage && this.matchWord("XOR")) {
      this.parseAnd();
    }
  }
  parseAnd() {
    this.parseUnary();
    while (!this.errorMessage && this.matchWord("AND")) {
      this.parseUnary();
    }
  }
  parseUnary() {
    this.skipWhitespace();
    if (this.matchWord("NOT")) {
      this.parseUnary();
      return;
    }
    this.parsePrimary();
  }
  parsePrimary() {
    this.skipWhitespace();
    const current = this.peek();
    if (!current) {
      this.error("Missing selector.");
      return;
    }
    if (current === "(") {
      this.index += 1;
      this.parseExpression();
      this.skipWhitespace();
      if (this.peek() !== ")") {
        this.error("Unterminated grouped selector.");
        return;
      }
      this.index += 1;
      return;
    }
    if (current === "[") {
      this.parseBracketAtom();
      return;
    }
    if (current === "*") {
      this.index += 1;
      return;
    }
    if (current === "{") {
      this.parseAttributeAtom();
      return;
    }
    if (current === "#") {
      this.parsePrefixedAtom("#", "tag selector.");
      return;
    }
    if (current === "&") {
      this.parsePrefixedAtom("&", "entity selector.");
      return;
    }
    if (current === "@") {
      this.parseRelationshipSelector();
      return;
    }
    if (current === "=" && this.text[this.index + 1] === ">") {
      this.index += 2;
      return;
    }
    if (current === "~" && this.text[this.index + 1] === ">") {
      this.index += 2;
      return;
    }
    if (current === "-" && this.text[this.index + 1] === ">") {
      this.index += 2;
      if (this.peek() === "[") {
        this.parseBracketAtom();
      }
      return;
    }
    if (this.isIdentifierStart(current)) {
      const start = this.index;
      const name = this.readIdentifier();
      this.skipWhitespace();
      if (this.peek() === "(") {
        this.index += 1;
        this.skipWhitespace();
        if (this.peek() === ")") {
          this.error("Selector function has no arguments.");
          return;
        }
        while (!this.errorMessage) {
          this.parseExpression();
          this.skipWhitespace();
          if (this.peek() === ",") {
            this.index += 1;
            this.skipWhitespace();
            continue;
          }
          if (this.peek() === ")") {
            this.index += 1;
            return;
          }
          this.error("Unterminated selector function.");
          return;
        }
        return;
      }
      this.index = start;
    }
    this.error("Malformed selector.");
  }
  parseBracketAtom() {
    const start = this.index;
    this.index += 1;
    let depth = 1;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escaped = false;
    while (this.index < this.text.length) {
      const current = this.text[this.index];
      if (escaped) {
        escaped = false;
        this.index += 1;
        continue;
      }
      if (inDoubleQuote) {
        if (current === "\\") {
          escaped = true;
        } else if (current === '"') {
          inDoubleQuote = false;
        }
        this.index += 1;
        continue;
      }
      if (inSingleQuote) {
        if (current === "'") {
          inSingleQuote = false;
        }
        this.index += 1;
        continue;
      }
      if (current === '"') {
        inDoubleQuote = true;
        this.index += 1;
        continue;
      }
      if (current === "'") {
        inSingleQuote = true;
        this.index += 1;
        continue;
      }
      if (current === "[") {
        depth += 1;
        this.index += 1;
        continue;
      }
      if (current === "]") {
        depth -= 1;
        this.index += 1;
        if (depth === 0) {
          const inner = this.text.slice(start + 1, this.index - 1).trim();
          if (!inner) {
            this.index = start;
            this.error("Malformed selector.");
            return;
          }
          return;
        }
        continue;
      }
      this.index += 1;
    }
    this.index = start;
    this.error("Unterminated bracket selector.");
  }
  parseAttributeAtom() {
    const start = this.index;
    this.index += 1;
    let depth = 1;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let escaped = false;
    let content = "";
    while (this.index < this.text.length) {
      const current = this.text[this.index];
      if (escaped) {
        escaped = false;
        content += current;
        this.index += 1;
        continue;
      }
      if (inDoubleQuote) {
        if (current === "\\") {
          escaped = true;
        } else if (current === '"') {
          inDoubleQuote = false;
        }
        content += current;
        this.index += 1;
        continue;
      }
      if (inSingleQuote) {
        if (current === "'") {
          inSingleQuote = false;
        }
        content += current;
        this.index += 1;
        continue;
      }
      if (current === '"') {
        inDoubleQuote = true;
        content += current;
        this.index += 1;
        continue;
      }
      if (current === "'") {
        inSingleQuote = true;
        content += current;
        this.index += 1;
        continue;
      }
      if (current === "{") {
        depth += 1;
        content += current;
        this.index += 1;
        continue;
      }
      if (current === "}") {
        depth -= 1;
        if (depth === 0) {
          const equalIndex = findSelectorAttributeSeparator(content);
          if (equalIndex < 0) {
            this.index = start;
            this.error("Malformed selector.");
            return;
          }
          const key = content.slice(0, equalIndex).trim();
          const value = content.slice(equalIndex + 1).trim();
          if (!key || !value) {
            this.index = start;
            this.error("Malformed selector.");
            return;
          }
          this.index += 1;
          return;
        }
        content += current;
        this.index += 1;
        continue;
      }
      content += current;
      this.index += 1;
    }
    this.index = start;
    this.error("Unterminated attribute selector.");
  }
  parsePrefixedAtom(prefix, label) {
    const start = this.index;
    this.index += 1;
    const consumed = this.readSelectorAtomTail();
    if (!consumed) {
      this.index = start;
      this.error(`Malformed ${label}`);
    }
  }
  parseRelationshipSelector() {
    const start = this.index;
    this.index += 1;
    const consumed = this.readSelectorAtomTail();
    if (!consumed) {
      this.index = start;
      this.error("Malformed relationship selector.");
    }
  }
  readSelectorAtomTail() {
    const start = this.index;
    while (this.index < this.text.length) {
      const current = this.text[this.index];
      if (!current) {
        break;
      }
      if (/\s/u.test(current) || current === "(" || current === ")" || current === "[" || current === "]" || current === "{" || current === "}" || current === ",") {
        break;
      }
      this.index += 1;
    }
    return this.index > start;
  }
  readIdentifier() {
    const start = this.index;
    this.index += 1;
    while (this.index < this.text.length && /[A-Za-z0-9_-]/u.test(this.text[this.index] ?? "")) {
      this.index += 1;
    }
    return this.text.slice(start, this.index);
  }
  isIdentifierStart(char) {
    return Boolean(char && /[A-Za-z_]/u.test(char));
  }
  matchWord(word) {
    this.skipWhitespace();
    const end = this.index + word.length;
    if (this.text.slice(this.index, end).toUpperCase() !== word) {
      return false;
    }
    const previous = this.text[this.index - 1] ?? "";
    const next = this.text[end] ?? "";
    if (isSelectorWordChar(previous) || isSelectorWordChar(next)) {
      return false;
    }
    this.index = end;
    this.skipWhitespace();
    return true;
  }
  skipWhitespace() {
    while (this.index < this.text.length && /\s/u.test(this.text[this.index] ?? "")) {
      this.index += 1;
    }
  }
  peek() {
    return this.text[this.index];
  }
  error(message) {
    if (!this.errorMessage) {
      this.errorMessage = message;
    }
  }
};
function isSelectorWordChar(char) {
  return Boolean(char && /[A-Za-z0-9_-]/u.test(char));
}
function findSelectorAttributeSeparator(content) {
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;
  for (let index = 0; index < content.length; index += 1) {
    const current = content[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (inDoubleQuote) {
      if (current === "\\") {
        escaped = true;
      } else if (current === '"') {
        inDoubleQuote = false;
      }
      continue;
    }
    if (inSingleQuote) {
      if (current === "'") {
        inSingleQuote = false;
      }
      continue;
    }
    if (current === '"') {
      inDoubleQuote = true;
      continue;
    }
    if (current === "'") {
      inSingleQuote = true;
      continue;
    }
    if (current === "=") {
      return index;
    }
  }
  return -1;
}
function extractInlineBlock(text, startIndex) {
  const collected = [];
  let depth = 0;
  let closed = false;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaped = false;
  for (let index = startIndex; index < text.length; index += 1) {
    const current = text[index];
    if (!current) {
      break;
    }
    collected.push(current);
    if (escaped) {
      escaped = false;
      continue;
    }
    if (inDoubleQuote) {
      if (current === "\\") {
        escaped = true;
      } else if (current === '"') {
        inDoubleQuote = false;
      }
      continue;
    }
    if (inSingleQuote) {
      if (current === "'") {
        inSingleQuote = false;
      }
      continue;
    }
    if (current === '"') {
      inDoubleQuote = true;
      continue;
    }
    if (current === "'") {
      inSingleQuote = true;
      continue;
    }
    if (current === "{") {
      depth += 1;
      continue;
    }
    if (current === "}") {
      depth -= 1;
      if (depth === 0) {
        closed = true;
        const rawText = collected.join("");
        const inner = rawText.slice(1, -1).trim();
        if (inner.length === 0) {
          return {
            rawText,
            endIndex: startIndex + collected.length - 1,
            closed: true,
            value: {}
          };
        }
        try {
          return {
            rawText,
            endIndex: startIndex + collected.length - 1,
            closed: true,
            value: toItmValue(parseYaml(inner))
          };
        } catch (error) {
          return {
            rawText,
            endIndex: startIndex + collected.length - 1,
            closed: true,
            parseError: error instanceof Error ? error.message : String(error)
          };
        }
      }
    }
  }
  return {
    rawText: collected.join(""),
    endIndex: startIndex + collected.length - 1,
    closed: false,
    parseError: "Block has no closing brace."
  };
}
function parseStyleDirectiveHeader(line, lineNumber) {
  const prefixMatch = /^(\s*)%style(?:\s+(.*))?$/u.exec(line);
  if (!prefixMatch) {
    return { error: "Invalid style directive syntax.", errorRange: toSourceRange(lineNumber, line) };
  }
  const leading = prefixMatch[1] ?? "";
  const remainder = prefixMatch[2] ?? "";
  const selectorStartColumn = leading.length + "%style".length + 1;
  const selectorInput = remainder.trimStart();
  const selectorIndent = remainder.length - selectorInput.length;
  let selectorColumn = selectorStartColumn + selectorIndent;
  if (selectorInput.length === 0) {
    return { error: "Missing selector.", errorRange: toSourceRangeSpan(lineNumber, selectorStartColumn, lineNumber, line.length + 1) };
  }
  let parseInput = selectorInput;
  let quotedRest = "";
  let quotedSelector = false;
  if (parseInput.startsWith('"') || parseInput.startsWith("'")) {
    quotedSelector = true;
    const quote = parseInput[0];
    let closingIndex = -1;
    let escaped = false;
    for (let index = 1; index < parseInput.length; index += 1) {
      const current = parseInput[index];
      if (!current) {
        break;
      }
      if (escaped) {
        escaped = false;
        continue;
      }
      if (quote === '"' && current === "\\") {
        escaped = true;
        continue;
      }
      if (current === quote) {
        closingIndex = index;
        break;
      }
    }
    if (closingIndex < 0) {
      return { error: "Malformed selector.", errorRange: toSourceRangeSpan(lineNumber, selectorColumn, lineNumber, line.length + 1) };
    }
    const inner = parseInput.slice(1, closingIndex);
    quotedRest = parseInput.slice(closingIndex + 1).trimStart();
    parseInput = inner;
    selectorColumn += 1;
  }
  const selectorParser = new SelectorParser(parseInput);
  const selectorResult = selectorParser.parse();
  if (selectorResult.error) {
    return {
      error: "Malformed selector.",
      errorRange: toSourceRangeSpan(lineNumber, selectorColumn, lineNumber, selectorColumn + Math.max(1, selectorResult.end))
    };
  }
  const selectorText = parseInput.slice(0, selectorResult.end).trim();
  const selectorSource = toSourceRangeSpan(lineNumber, selectorColumn, lineNumber, selectorColumn + selectorText.length);
  const rest = quotedSelector ? quotedRest : parseInput.slice(selectorResult.end).trimStart();
  if (quotedSelector) {
    const selectorTail = parseInput.slice(selectorResult.end).trim();
    if (selectorTail.length > 0) {
      return {
        error: "Malformed selector.",
        errorRange: toSourceRangeSpan(lineNumber, selectorColumn + selectorResult.end, lineNumber, line.length + 1)
      };
    }
  }
  const bodyStartOffset = quotedSelector ? selectorInput.length - quotedRest.length : parseInput.length - rest.length;
  if (rest.length > 0) {
    if (!rest.startsWith("{")) {
      return {
        error: "Malformed selector.",
        errorRange: toSourceRangeSpan(lineNumber, selectorColumn + selectorResult.end, lineNumber, line.length + 1)
      };
    }
    const body = extractInlineBlock(selectorInput, bodyStartOffset);
    if (!body.closed) {
      return {
        error: "Style block has invalid syntax.",
        errorRange: toSourceRangeSpan(lineNumber, selectorColumn + bodyStartOffset, lineNumber, line.length + 1)
      };
    }
    const trailing = selectorInput.slice(bodyStartOffset + body.rawText.length).trim();
    if (trailing.length > 0) {
      return {
        error: "Style block has invalid syntax.",
        errorRange: toSourceRangeSpan(lineNumber, selectorColumn + bodyStartOffset + body.rawText.length, lineNumber, line.length + 1)
      };
    }
    return {
      header: {
        selectorText,
        selectorStartColumn: selectorColumn,
        selectorSource,
        bodyText: body.rawText,
        bodySource: toSourceRangeSpan(lineNumber, selectorColumn + bodyStartOffset, lineNumber, selectorColumn + bodyStartOffset + body.rawText.length),
        bodyValue: body.value,
        bodyParseError: body.parseError,
        bodyClosed: body.closed
      }
    };
  }
  return {
    header: {
      selectorText,
      selectorStartColumn: selectorColumn,
      selectorSource,
      bodyText: void 0,
      bodySource: void 0,
      bodyValue: void 0,
      bodyParseError: void 0,
      bodyClosed: void 0
    }
  };
}
function parseInlineYamlValue(text) {
  try {
    return {
      value: toItmValue(parseYaml(text))
    };
  } catch (error) {
    return {
      parseError: error instanceof Error ? error.message : String(error)
    };
  }
}
function createAttributeBag(value) {
  const record = asRecord(value);
  if (!record) {
    return void 0;
  }
  return { values: record };
}
function createPipeline(stepsValue, uidPrefix) {
  if (!Array.isArray(stepsValue)) {
    return { steps: [] };
  }
  const steps = [];
  for (const [index, entry] of stepsValue.entries()) {
    if (typeof entry === "string") {
      steps.push({
        uid: `${uidPrefix}:step:${index + 1}`,
        operation: "plugin",
        provider: entry,
        arguments: {}
      });
      continue;
    }
    const record = asRecord(entry);
    if (!record) {
      continue;
    }
    const [key, value] = Object.entries(record)[0] ?? [];
    if (!key) {
      continue;
    }
    const operation = PIPELINE_OPERATIONS.has(key) ? key : "plugin";
    const argumentsValue = asRecord(value) ? value : value === void 0 ? {} : { value };
    steps.push({
      uid: `${uidPrefix}:step:${index + 1}`,
      operation,
      ...operation === "plugin" ? { provider: key } : {},
      arguments: argumentsValue
    });
  }
  return { steps };
}
function createRelationshipUid(sourceUid, typeRef, targetRef, index) {
  return `relationship:${sanitizeUidSegment(sourceUid)}:${sanitizeUidSegment(typeRef)}:${sanitizeUidSegment(targetRef)}:${index}`;
}
function pushDiagnostic(document, severity, message, lineNumber, raw, range) {
  const diagnostic = {
    uid: `diagnostic:${document.diagnostics?.length ?? 0}:${lineNumber}`,
    source: "itm.parser",
    severity,
    message,
    range: range ?? toSourceRange(lineNumber, raw)
  };
  document.diagnostics?.push(diagnostic);
}
function pruneEmptyCollections(document) {
  const result = { ...document };
  for (const key of [
    "namespaces",
    "entityTypes",
    "relationshipTypes",
    "selectors",
    "validationRules",
    "pluginRequirements",
    "styles",
    "viewpoints",
    "views",
    "includes",
    "packages",
    "packageUsages",
    "repositories",
    "overlays",
    "directives",
    "diagnostics"
  ]) {
    if ((result[key] ?? []).length === 0) {
      delete result[key];
    }
  }
  if (!result.metadata) {
    delete result.metadata;
  }
  return result;
}
function withRangeFile(range, file) {
  if (!range || !file || range.file) {
    return range;
  }
  return {
    ...range,
    file
  };
}
function annotateDocumentWithUri(document, uri) {
  if (!uri) {
    return;
  }
  document.uri = document.uri ?? uri;
  if (document.metadata) {
    const metadataSource = withRangeFile(document.metadata.source, uri);
    if (metadataSource) {
      document.metadata.source = metadataSource;
    }
  }
  for (const entity of document.entities) {
    const entityRange = withRangeFile(entity.sourceRange, uri);
    if (entityRange) {
      entity.sourceRange = entityRange;
    }
    if (entity.description) {
      const descriptionSource = withRangeFile(entity.description.source, uri);
      if (descriptionSource) {
        entity.description.source = descriptionSource;
      }
      for (const block of entity.description.embeddedBlocks ?? []) {
        const blockSource = withRangeFile(block.source, uri);
        if (blockSource) {
          block.source = blockSource;
        }
      }
    }
  }
  for (const relationship of document.relationships) {
    const relationshipRange = withRangeFile(relationship.sourceRange, uri);
    if (relationshipRange) {
      relationship.sourceRange = relationshipRange;
    }
  }
  for (const namespace of document.namespaces ?? []) {
    const namespaceSource = withRangeFile(namespace.source, uri);
    if (namespaceSource) {
      namespace.source = namespaceSource;
    }
  }
  for (const entityType of document.entityTypes ?? []) {
    const entityTypeRange = withRangeFile(entityType.sourceRange, uri);
    if (entityTypeRange) {
      entityType.sourceRange = entityTypeRange;
    }
  }
  for (const relationshipType of document.relationshipTypes ?? []) {
    const relationshipTypeRange = withRangeFile(relationshipType.sourceRange, uri);
    if (relationshipTypeRange) {
      relationshipType.sourceRange = relationshipTypeRange;
    }
  }
  for (const rule of document.validationRules ?? []) {
    const ruleRange = withRangeFile(rule.sourceRange, uri);
    if (ruleRange) {
      rule.sourceRange = ruleRange;
    }
    const selectorSource = withRangeFile(rule.selector.source, uri);
    if (selectorSource) {
      rule.selector.source = selectorSource;
    }
    for (const step of rule.pipeline.steps) {
      const stepSource = withRangeFile(step.source, uri);
      if (stepSource) {
        step.source = stepSource;
      }
    }
  }
  for (const style of document.styles ?? []) {
    const styleRange = withRangeFile(style.sourceRange, uri);
    if (styleRange) {
      style.sourceRange = styleRange;
    }
    const styleSelectorSource = withRangeFile(style.selector.source, uri);
    if (styleSelectorSource) {
      style.selector.source = styleSelectorSource;
    }
  }
  for (const viewpoint of document.viewpoints ?? []) {
    const viewpointRange = withRangeFile(viewpoint.sourceRange, uri);
    if (viewpointRange) {
      viewpoint.sourceRange = viewpointRange;
    }
    for (const step of viewpoint.pipeline.steps) {
      const stepSource = withRangeFile(step.source, uri);
      if (stepSource) {
        step.source = stepSource;
      }
    }
  }
  for (const view of document.views ?? []) {
    const viewRange = withRangeFile(view.sourceRange, uri);
    if (viewRange) {
      view.sourceRange = viewRange;
    }
  }
  for (const include of document.includes ?? []) {
    const includeSource = withRangeFile(include.source, uri);
    if (includeSource) {
      include.source = includeSource;
    }
  }
  for (const pkg of document.packages ?? []) {
    const packageRange = withRangeFile(pkg.sourceRange, uri);
    if (packageRange) {
      pkg.sourceRange = packageRange;
    }
  }
  for (const usage of document.packageUsages ?? []) {
    const usageSource = withRangeFile(usage.source, uri);
    if (usageSource) {
      usage.source = usageSource;
    }
  }
  for (const repository of document.repositories ?? []) {
    const repositorySource = withRangeFile(repository.source, uri);
    if (repositorySource) {
      repository.source = repositorySource;
    }
  }
  for (const overlay of document.overlays ?? []) {
    const overlayRange = withRangeFile(overlay.sourceRange, uri);
    if (overlayRange) {
      overlay.sourceRange = overlayRange;
    }
    for (const relationship of overlay.relationshipAdditions ?? []) {
      const relationshipRange = withRangeFile(relationship.sourceRange, uri);
      if (relationshipRange) {
        relationship.sourceRange = relationshipRange;
      }
    }
  }
  for (const directive of document.directives ?? []) {
    const directiveSource = withRangeFile(directive.source, uri);
    if (directiveSource) {
      directive.source = directiveSource;
    }
    const directiveSelectorSource = withRangeFile(directive.selectorSource, uri);
    if (directiveSelectorSource) {
      directive.selectorSource = directiveSelectorSource;
    }
    const directiveBodySource = withRangeFile(directive.bodySource, uri);
    if (directiveBodySource) {
      directive.bodySource = directiveBodySource;
    }
  }
  for (const diagnostic of document.diagnostics ?? []) {
    diagnostic.file = diagnostic.file ?? uri;
    diagnostic.uri = diagnostic.uri ?? uri;
    const diagnosticRange = withRangeFile(diagnostic.range, uri);
    if (diagnosticRange) {
      diagnostic.range = diagnosticRange;
    }
  }
}
function parseItmResult(text, options = {}) {
  const lines = text.replace(/\r\n?/gu, "\n").split("\n");
  const document = {
    format: "itm",
    modelVersion: "1.0.0",
    ...options.uri ? { uri: options.uri } : {},
    entities: [],
    relationships: [],
    namespaces: [],
    entityTypes: [],
    relationshipTypes: [],
    selectors: [],
    validationRules: [],
    pluginRequirements: [],
    styles: [],
    viewpoints: [],
    views: [],
    includes: [],
    packages: [],
    packageUsages: [],
    repositories: [],
    overlays: [],
    directives: [],
    diagnostics: []
  };
  const entityStack = [];
  let currentEntity;
  let currentOverlay;
  let defaultNamespace = options.defaultNamespace;
  let entityCounter = 0;
  let relationshipCounter = 0;
  const addDirective = (directive) => {
    document.directives?.push(directive);
  };
  const createRelationship2 = (sourceEntity, reference, lineNumber, raw, attributes) => {
    relationshipCounter += 1;
    const targetRef = qualifyName(reference.targetRef, defaultNamespace);
    const typeRef = reference.typeRef ?? document.metadata?.defaultRelationshipType ?? "related_to";
    const relationshipId = parseScalarString(attributes?.values.id);
    const uid = relationshipId ? `relationship:${sanitizeUidSegment(qualifyName(relationshipId, defaultNamespace))}` : createRelationshipUid(sourceEntity.uid, typeRef, targetRef, relationshipCounter);
    const relationship = {
      uid,
      kind: "relationship",
      ...relationshipId ? { id: relationshipId } : {},
      sourceRange: toSourceRange(lineNumber, raw),
      sourceId: sourceEntity.uid,
      ...sourceEntity.qualifiedId ? { sourceRef: sourceEntity.qualifiedId } : {},
      targetRef,
      typeRef,
      relationshipKind: "explicit",
      implicit: false,
      virtual: false,
      sourceSyntax: raw.trimStart().startsWith("@") ? "relationship-block" : "inline-relationship",
      ...attributes ? { attributes } : {}
    };
    document.relationships.push(relationship);
    return relationship;
  };
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index] ?? "";
    const { normalized, indent } = normalizeLeadingWhitespace(raw);
    const trimmed = normalized.trim();
    const lineNumber = index + 1;
    if (trimmed.length === 0) {
      continue;
    }
    if (indent % 2 !== 0) {
      pushDiagnostic(document, "error", "Indentation must be a multiple of two spaces.", lineNumber, raw);
    }
    const state = {
      lineNumber,
      raw,
      normalized,
      indent,
      trimmed
    };
    if (trimmed.startsWith("%")) {
      const match = trimmed.match(/^%(\S+)(?:\s+(.*))?$/u);
      if (!match) {
        pushDiagnostic(document, "error", "Invalid directive syntax.", lineNumber, raw);
        continue;
      }
      const name = match[1] ?? "";
      const argumentText = match[2];
      if (name === "style") {
        const header = parseStyleDirectiveHeader(raw, lineNumber);
        if (header.error) {
          pushDiagnostic(document, "error", header.error, lineNumber, raw, header.errorRange);
          if (lines[index + 1]?.trim() === "{") {
            const block = collectBlock(lines, index + 1);
            index = block.endIndex;
          }
          continue;
        }
        const selectorText = header.header?.selectorText ?? "";
        const selectorSource = header.header?.selectorSource;
        if (!selectorSource) {
          pushDiagnostic(document, "error", "Malformed selector.", lineNumber, raw);
          continue;
        }
        let bodyValue = header.header?.bodyValue;
        let bodySource = header.header?.bodySource;
        let rawText2 = raw;
        if (header.header?.bodyParseError) {
          pushDiagnostic(document, "error", `style block is not valid YAML: ${header.header.bodyParseError}`, lineNumber, raw, bodySource ?? selectorSource);
          continue;
        }
        if (bodyValue === void 0) {
          const nextLine = lines[index + 1];
          if (nextLine?.trim() === "{") {
            const block = collectBlock(lines, index + 1);
            rawText2 = `${raw}
${block.rawText}`;
            index = block.endIndex;
            if (!block.closed) {
              pushDiagnostic(document, "error", "Unterminated style body.", lineNumber, raw, toSourceRangeSpan(lineNumber + 1, 1, block.endIndex + 1, (lines[block.endIndex] ?? "").length + 1));
              continue;
            }
            if (block.parseError) {
              pushDiagnostic(document, "error", `style block is not valid YAML: ${block.parseError}`, lineNumber, raw, toSourceRangeSpan(lineNumber + 1, 1, block.endIndex + 1, (lines[block.endIndex] ?? "").length + 1));
              continue;
            }
            bodyValue = block.value;
            bodySource = toSourceRangeSpan(lineNumber + 1, 1, block.endIndex + 1, (lines[block.endIndex] ?? "").length + 1);
          } else {
            pushDiagnostic(document, "error", "Missing style body.", lineNumber, raw, selectorSource);
            continue;
          }
        }
        const directiveSource = bodySource ? toSourceRangeSpan(lineNumber, 1, bodySource.endLine, bodySource.endColumn) : toSourceRange(lineNumber, raw);
        const directive2 = {
          name,
          argumentText: selectorText,
          rawText: rawText2,
          known: true,
          handled: true,
          source: directiveSource
        };
        directive2.selectorSource = selectorSource;
        if (bodyValue !== void 0) {
          directive2.body = bodyValue;
        }
        if (bodySource !== void 0) {
          directive2.bodySource = bodySource;
        }
        addDirective(directive2);
        const styleRule = {
          uid: `style:${document.styles?.length ?? 0}:${sanitizeUidSegment(selectorText.trim())}`,
          kind: "style-rule",
          selector: { raw: selectorText.trim() },
          style: createAttributeBag(bodyValue) ?? { values: {} },
          origin: "document",
          priority: (document.styles?.length ?? 0) + 1,
          sourceRange: directiveSource
        };
        styleRule.selector.source = selectorSource;
        document.styles?.push(styleRule);
        currentEntity = void 0;
        currentOverlay = void 0;
        continue;
      }
      let body;
      let rawText = raw;
      if (lines[index + 1]?.trim() === "{") {
        const block = collectBlock(lines, index + 1);
        rawText = `${raw}
${block.rawText}`;
        index = block.endIndex;
        if (!block.closed) {
          pushDiagnostic(document, "error", `${name} block has no closing brace.`, lineNumber, raw);
          continue;
        }
        if (block.parseError) {
          pushDiagnostic(document, "error", `${name} block is not valid YAML: ${block.parseError}`, lineNumber, raw);
          continue;
        }
        body = block.value;
      }
      const directive = {
        name,
        ...argumentText ? { argumentText } : {},
        ...body !== void 0 ? { body } : {},
        rawText,
        known: KNOWN_DIRECTIVES.has(name),
        handled: KNOWN_DIRECTIVES.has(name),
        source: toSourceRange(lineNumber, raw)
      };
      addDirective(directive);
      if (name === "metadata") {
        const record = asRecord(body);
        if (record) {
          const title = parseScalarString(record.title);
          const version = parseScalarString(record.version);
          const description = parseScalarString(record.description);
          const author = parseScalarString(record.author);
          const owner = parseScalarString(record.owner);
          const metadataDefaultNamespace = parseScalarString(record.defaultNamespace);
          const defaultRelationshipType = parseScalarString(record.defaultRelationshipType);
          const defaultLanguageOrProfile = parseScalarString(record.defaultLanguageOrProfile);
          const created = parseScalarString(record.created);
          const updated = parseScalarString(record.updated);
          const intendedRenderingMode = parseScalarString(record.intendedRenderingMode);
          const intendedRenderingModes = parseStringArray(record.intendedRenderingModes);
          const validationMode = parseScalarString(record.validationMode);
          const metadata = {
            ...title ? { title } : {},
            ...version ? { version } : {},
            ...description ? { description } : {},
            ...author ? { author } : {},
            ...owner ? { owner } : {},
            ...metadataDefaultNamespace ? { defaultNamespace: metadataDefaultNamespace } : {},
            ...defaultRelationshipType ? { defaultRelationshipType } : {},
            ...defaultLanguageOrProfile ? { defaultLanguageOrProfile } : {},
            ...created ? { created } : {},
            ...updated ? { updated } : {},
            ...intendedRenderingMode ? { intendedRenderingMode } : {},
            ...intendedRenderingModes ? { intendedRenderingModes } : {},
            ...validationMode ? { validationMode } : {},
            values: record,
            source: toSourceRange(lineNumber, raw)
          };
          document.metadata = metadata;
          defaultNamespace = metadata.defaultNamespace ?? defaultNamespace;
        }
      } else if (name === "include" && argumentText) {
        const include = {
          target: argumentText.trim(),
          status: "unresolved",
          source: toSourceRange(lineNumber, raw)
        };
        document.includes?.push(include);
      } else if (name === "namespace" && argumentText) {
        const [prefix, uri] = argumentText.trim().split(/\s+/u, 2);
        if (prefix && uri) {
          const namespace = {
            prefix,
            uri,
            source: toSourceRange(lineNumber, raw)
          };
          document.namespaces?.push(namespace);
        }
      } else if (name === "entitytype" && argumentText) {
        const record = asRecord(body) ?? {};
        const entityTypeName = argumentText.trim();
        const entityTypeDescription = parseScalarString(record.description);
        const requiredAttributes = parseStringArray(record.requiredAttributes);
        const optionalAttributes = parseStringArray(record.optionalAttributes);
        const superTypeRefs = parseStringArray(record.extends) ?? parseStringArray(record.superTypeRefs);
        const attributes = createAttributeBag(record);
        const entityType = {
          uid: `entity-type:${sanitizeUidSegment(entityTypeName)}`,
          kind: "entity-type",
          name: entityTypeName,
          ...entityTypeDescription ? { description: entityTypeDescription } : {},
          ...requiredAttributes ? { requiredAttributes } : {},
          ...optionalAttributes ? { optionalAttributes } : {},
          ...superTypeRefs ? { superTypeRefs } : {},
          ...attributes ? { attributes } : {},
          sourceRange: toSourceRange(lineNumber, raw)
        };
        document.entityTypes?.push(entityType);
      } else if (name === "relationshiptype" && argumentText) {
        const record = asRecord(body) ?? {};
        const relationshipTypeName = argumentText.trim();
        const relationshipTypeDescription = parseScalarString(record.description);
        const superTypeRefs = parseStringArray(record.extends) ?? parseStringArray(record.superTypeRefs);
        const sourceTypeRefs = parseStringArray(record.sourceTypes);
        const targetTypeRefs = parseStringArray(record.targetTypes);
        const inverseTypeRef = parseScalarString(record.inverseType);
        const requiredAttributes = parseStringArray(record.requiredAttributes);
        const optionalAttributes = parseStringArray(record.optionalAttributes);
        const attributes = createAttributeBag(record);
        const relationshipType = {
          uid: `relationship-type:${sanitizeUidSegment(relationshipTypeName)}`,
          kind: "relationship-type",
          name: relationshipTypeName,
          ...relationshipTypeDescription ? { description: relationshipTypeDescription } : {},
          ...superTypeRefs ? { superTypeRefs } : {},
          ...sourceTypeRefs ? { sourceTypeRefs } : {},
          ...targetTypeRefs ? { targetTypeRefs } : {},
          ...inverseTypeRef ? { inverseTypeRef } : {},
          ...requiredAttributes ? { requiredAttributes } : {},
          ...optionalAttributes ? { optionalAttributes } : {},
          ...attributes ? { attributes } : {},
          sourceRange: toSourceRange(lineNumber, raw)
        };
        document.relationshipTypes?.push(relationshipType);
      } else if (name === "viewpoint" && argumentText) {
        const record = asRecord(body) ?? {};
        const viewpointDescription = parseScalarString(record.description);
        const viewpointTitle = parseScalarString(record.title);
        const parameters = parseViewpointParameters(record.parameters);
        const viewpoint = {
          uid: `viewpoint:${sanitizeUidSegment(argumentText.trim())}`,
          kind: "viewpoint",
          name: argumentText.trim(),
          ...viewpointDescription ? { description: viewpointDescription } : {},
          ...viewpointTitle ? { title: viewpointTitle } : {},
          pipeline: createPipeline(record.pipeline, `viewpoint:${sanitizeUidSegment(argumentText.trim())}`),
          ...parameters ? { parameters } : {},
          supportsVisualEditing: record.supportsVisualEditing === true,
          sourceRange: toSourceRange(lineNumber, raw)
        };
        document.viewpoints?.push(viewpoint);
      } else if (name === "view" && argumentText) {
        const record = asRecord(body) ?? {};
        const viewTitle = parseScalarString(record.title);
        const parameters = asRecord(record.parameters);
        const parsedViewBody = parseViewDeltas(record.deltas);
        const generatedAssets = parseGeneratedAssets(record.generatedAssets) ?? parsedViewBody.generatedAssets;
        const notes = parseStringArray(record.notes) ?? parsedViewBody.notes;
        const view = {
          uid: `view:${sanitizeUidSegment(argumentText.trim())}`,
          kind: "view",
          name: argumentText.trim(),
          ...viewTitle ? { title: viewTitle } : {},
          viewpointRef: parseScalarString(record.viewpoint) ?? parseScalarString(record.viewpointRef) ?? "",
          ...parameters ? { parameters } : {},
          ...parsedViewBody.deltas ? { deltas: parsedViewBody.deltas } : {},
          ...generatedAssets ? { generatedAssets } : {},
          ...notes ? { notes } : {},
          sourceRange: toSourceRange(lineNumber, raw)
        };
        document.views?.push(view);
      } else if (name === "repository" && argumentText) {
        const [repositoryName, location] = argumentText.trim().split(/\s+/u, 2);
        if (repositoryName && location) {
          document.repositories?.push({
            name: repositoryName,
            location,
            allowed: true,
            source: toSourceRange(lineNumber, raw)
          });
        }
      } else if (name === "require" && argumentText) {
        const [requirementName, versionRange] = argumentText.trim().split(/\s+/u, 2);
        if (!requirementName) {
          continue;
        }
        const requirement = {
          name: requirementName,
          ...versionRange ? { versionRange } : {},
          resolved: false,
          source: toSourceRange(lineNumber, raw)
        };
        document.pluginRequirements?.push(requirement);
      } else if (name === "rule" && argumentText) {
        const record = asRecord(body) ?? {};
        const ruleMessage = parseScalarString(record.message);
        const rule = {
          uid: `rule:${sanitizeUidSegment(argumentText.trim())}`,
          kind: "validation-rule",
          name: argumentText.trim(),
          selector: {
            raw: parseScalarString(record.select) ?? "*"
          },
          pipeline: createPipeline(record.pipeline, `rule:${sanitizeUidSegment(argumentText.trim())}`),
          severity: parseScalarString(record.severity) ?? "warning",
          ...ruleMessage ? { message: ruleMessage } : {},
          enabled: record.enabled !== false,
          sourceRange: toSourceRange(lineNumber, raw)
        };
        document.validationRules?.push(rule);
      } else if (name === "package" && argumentText) {
        const packageDescription = parseScalarString(asRecord(body)?.description);
        document.packages?.push({
          uid: `package:${sanitizeUidSegment(argumentText.trim())}`,
          kind: "package",
          name: argumentText.trim(),
          ...packageDescription ? { description: packageDescription } : {},
          sourceRange: toSourceRange(lineNumber, raw)
        });
      } else if (name === "using" && argumentText) {
        document.packageUsages?.push({
          packageRef: argumentText.trim(),
          scope: "all",
          source: toSourceRange(lineNumber, raw)
        });
      }
      currentEntity = void 0;
      currentOverlay = void 0;
      continue;
    }
    if (trimmed.startsWith("|")) {
      if (!currentEntity && !currentOverlay) {
        pushDiagnostic(document, options.strict ? "error" : "warning", "Description line without a preceding entity.", lineNumber, raw);
        continue;
      }
      const descriptionLines = [];
      let endIndex = index;
      for (let descriptionIndex = index; descriptionIndex < lines.length; descriptionIndex += 1) {
        const candidate = lines[descriptionIndex] ?? "";
        const normalizedCandidate = normalizeLeadingWhitespace(candidate).normalized.trimStart();
        if (!normalizedCandidate.startsWith("|")) {
          break;
        }
        descriptionLines.push(normalizedCandidate.slice(1).replace(/^ /u, ""));
        endIndex = descriptionIndex;
      }
      const textValue = descriptionLines.join("\n");
      const embeddedBlocks = extractEmbeddedBlocks(textValue).map((block) => ({
        language: block.language,
        content: block.content
      }));
      if (currentEntity) {
        currentEntity.description = {
          format: "markdown",
          text: textValue,
          embeddedBlocks,
          source: toSourceRange(lineNumber, raw)
        };
      }
      if (currentOverlay) {
        currentOverlay.descriptionPatch = {
          operation: "replace",
          text: textValue
        };
      }
      index = endIndex;
      continue;
    }
    if (trimmed.startsWith("@")) {
      if (!currentEntity && !currentOverlay) {
        pushDiagnostic(document, options.strict ? "error" : "warning", "Relationship line without a preceding entity.", lineNumber, raw);
        continue;
      }
      const reference = splitRelationshipToken(trimmed);
      let relationshipAttributes;
      if (lines[index + 1]?.trim() === "{") {
        const block = collectBlock(lines, index + 1);
        if (!block.closed) {
          pushDiagnostic(document, options.strict ? "error" : "warning", "Relationship attribute block has no closing brace.", lineNumber, raw);
          index = block.endIndex;
          continue;
        }
        if (block.parseError) {
          pushDiagnostic(document, options.strict ? "error" : "warning", `Relationship attribute block is not valid YAML: ${block.parseError}`, lineNumber, raw);
          index = block.endIndex;
          continue;
        }
        relationshipAttributes = createAttributeBag(block.value);
        index = block.endIndex;
      }
      if (currentEntity) {
        createRelationship2(currentEntity, reference, lineNumber, raw, relationshipAttributes);
      }
      if (currentOverlay) {
        relationshipCounter += 1;
        const targetRef = qualifyName(reference.targetRef, defaultNamespace);
        const typeRef = reference.typeRef ?? document.metadata?.defaultRelationshipType ?? "related_to";
        const relationshipId = parseScalarString(relationshipAttributes?.values.id);
        currentOverlay.relationshipAdditions = currentOverlay.relationshipAdditions ?? [];
        currentOverlay.relationshipAdditions.push({
          uid: relationshipId ? `relationship:${sanitizeUidSegment(qualifyName(relationshipId, defaultNamespace))}` : createRelationshipUid(currentOverlay.uid, typeRef, targetRef, relationshipCounter),
          kind: "relationship",
          ...relationshipId ? { id: relationshipId } : {},
          sourceRange: toSourceRange(lineNumber, raw),
          sourceId: currentOverlay.uid,
          sourceRef: currentOverlay.targetRef,
          targetRef,
          typeRef,
          relationshipKind: "explicit",
          implicit: false,
          virtual: false,
          sourceSyntax: "relationship-block",
          ...relationshipAttributes ? { attributes: relationshipAttributes } : {}
        });
      }
      continue;
    }
    if (trimmed === "{") {
      const block = collectBlock(lines, index);
      if (!block.closed) {
        pushDiagnostic(document, options.strict ? "error" : "warning", "Attribute block has no closing brace.", lineNumber, raw);
        index = block.endIndex;
        continue;
      }
      if (block.parseError) {
        pushDiagnostic(document, options.strict ? "error" : "warning", `Attribute block is not valid YAML: ${block.parseError}`, lineNumber, raw);
        index = block.endIndex;
        continue;
      }
      const bag = createAttributeBag(block.value);
      if (currentEntity && bag) {
        currentEntity.attributes = bag;
      } else if (currentOverlay && bag) {
        currentOverlay.attributePatches = Object.entries(bag.values).map(([key, value]) => ({
          key,
          value,
          operation: "set"
        }));
      } else {
        pushDiagnostic(document, options.strict ? "error" : "warning", "Attribute block without a preceding entity, relationship, or directive.", lineNumber, raw);
      }
      index = block.endIndex;
      continue;
    }
    const { content, blockText } = extractInlineAttributeBlock(trimmed);
    let remaining = content;
    let parsedId;
    let parsedTypeRef;
    if (remaining.startsWith("&")) {
      const match = remaining.match(/^&([^\s]*)\s*(.*)$/u);
      parsedId = match?.[1];
      remaining = match?.[2] ?? remaining;
      const idValidationError = validateEntityId(parsedId);
      if (idValidationError) {
        pushDiagnostic(document, options.strict ? "error" : "warning", idValidationError, lineNumber, raw);
      }
    }
    const isOverlay = remaining.startsWith("!overlay");
    if (isOverlay) {
      remaining = remaining.replace(/^!overlay\b\s*/u, "");
    }
    if (remaining.startsWith("[")) {
      const match = remaining.match(/^\[([^\]]+)\]\s*(.*)$/u);
      parsedTypeRef = match?.[1];
      remaining = match?.[2] ?? remaining;
    }
    const tokens = remaining.split(/\s+/u).filter(Boolean);
    const labelTokens = [];
    const tags = [];
    const inlineRelationships = [];
    for (const token of tokens) {
      if (token.startsWith("@")) {
        inlineRelationships.push(splitRelationshipToken(token));
      } else if (/^#[A-Za-z][A-Za-z0-9_-]*$/u.test(token)) {
        tags.push(token.slice(1));
      } else {
        labelTokens.push(token);
      }
    }
    if (labelTokens.length === 0 && !isOverlay) {
      pushDiagnostic(document, options.strict ? "error" : "warning", "Entity line does not contain a label.", lineNumber, raw);
      continue;
    }
    const qualifiedId = parsedId ? qualifyName(parsedId, defaultNamespace) : void 0;
    const splitId = parsedId ? splitQualifiedName(parsedId) : void 0;
    if (isOverlay && qualifiedId) {
      const overlay = {
        uid: `overlay:${sanitizeUidSegment(qualifiedId)}:${document.overlays?.length ?? 0}`,
        kind: "overlay",
        targetKind: "entity",
        targetRef: qualifiedId,
        ...labelTokens.length > 0 ? { replacementLabel: labelTokens.join(" ") } : {},
        ...parsedTypeRef ? { replacementTypeRef: parsedTypeRef } : {},
        relationshipAdditions: [],
        policy: "merge",
        sourceRange: toSourceRange(lineNumber, raw)
      };
      if (blockText) {
        const inlineYaml = parseInlineYamlValue(blockText);
        const bag = createAttributeBag(inlineYaml.value);
        if (inlineYaml.parseError) {
          pushDiagnostic(document, options.strict ? "error" : "warning", `Inline attribute block is not valid YAML: ${inlineYaml.parseError}`, lineNumber, raw);
        }
        if (bag) {
          overlay.attributePatches = Object.entries(bag.values).map(([key, value]) => ({
            key,
            value,
            operation: "set"
          }));
        }
      }
      if (lines[index + 1]?.trim() === "{") {
        const block = collectBlock(lines, index + 1);
        if (!block.closed) {
          pushDiagnostic(document, options.strict ? "error" : "warning", "Attribute block has no closing brace.", lineNumber, raw);
          index = block.endIndex;
          document.overlays?.push(overlay);
          currentEntity = void 0;
          currentOverlay = overlay;
          continue;
        }
        if (block.parseError) {
          pushDiagnostic(document, options.strict ? "error" : "warning", `Attribute block is not valid YAML: ${block.parseError}`, lineNumber, raw);
          index = block.endIndex;
          document.overlays?.push(overlay);
          currentEntity = void 0;
          currentOverlay = overlay;
          continue;
        }
        const bag = createAttributeBag(block.value);
        if (bag) {
          overlay.attributePatches = Object.entries(bag.values).map(([key, value]) => ({
            key,
            value,
            operation: "set"
          }));
        }
        index = block.endIndex;
      }
      document.overlays?.push(overlay);
      currentEntity = void 0;
      currentOverlay = overlay;
      continue;
    }
    entityCounter += 1;
    const entity = {
      uid: qualifiedId ? `entity:${sanitizeUidSegment(qualifiedId)}` : `entity:anonymous:${entityCounter}`,
      kind: "entity",
      ...splitId?.localName ? { id: splitId.localName } : {},
      ...qualifiedId ? { qualifiedId } : {},
      ...splitId?.namespacePrefix ?? defaultNamespace ? { namespacePrefix: splitId?.namespacePrefix ?? defaultNamespace } : {},
      ...splitId?.localName ? { localId: splitId.localName } : {},
      label: labelTokens.join(" "),
      rawLabel: remaining,
      ...parsedTypeRef ? { typeRef: parsedTypeRef } : {},
      tags,
      childIds: [],
      incomingRelationshipIds: [],
      outgoingRelationshipIds: [],
      overlayIds: [],
      depth: 0,
      rank: document.entities.length,
      sourceRange: toSourceRange(lineNumber, raw)
    };
    if (blockText) {
      const inlineYaml = parseInlineYamlValue(blockText);
      const bag = createAttributeBag(inlineYaml.value);
      if (inlineYaml.parseError) {
        pushDiagnostic(document, options.strict ? "error" : "warning", `Inline attribute block is not valid YAML: ${inlineYaml.parseError}`, lineNumber, raw);
      }
      if (bag) {
        entity.attributes = bag;
      }
    }
    if (lines[index + 1]?.trim() === "{") {
      const block = collectBlock(lines, index + 1);
      if (!block.closed) {
        pushDiagnostic(document, options.strict ? "error" : "warning", "Attribute block has no closing brace.", lineNumber, raw);
        index = block.endIndex;
      } else if (block.parseError) {
        pushDiagnostic(document, options.strict ? "error" : "warning", `Attribute block is not valid YAML: ${block.parseError}`, lineNumber, raw);
        index = block.endIndex;
      } else {
        const bag = createAttributeBag(block.value);
        if (bag) {
          entity.attributes = bag;
        }
        index = block.endIndex;
      }
    }
    while (entityStack.length > 0 && (entityStack[entityStack.length - 1]?.indent ?? -1) >= state.indent) {
      entityStack.pop();
    }
    const parent = entityStack[entityStack.length - 1]?.entity;
    const previousIndent = entityStack[entityStack.length - 1]?.indent ?? 0;
    if (parent && state.indent > previousIndent + 2) {
      pushDiagnostic(document, options.strict ? "error" : "warning", "Indentation jumped by more than one level.", lineNumber, raw);
    }
    if (!parent && state.indent > 0) {
      pushDiagnostic(document, options.strict ? "error" : "warning", "Indented entity without a parent entity.", lineNumber, raw);
    }
    if (parent) {
      entity.parentId = parent.uid;
      entity.depth = (parent.depth ?? 0) + 1;
      parent.childIds?.push(entity.uid);
    }
    document.entities.push(entity);
    entityStack.push({ indent: state.indent, entity });
    currentEntity = entity;
    currentOverlay = void 0;
    let inlineAttributes;
    if (blockText) {
      inlineAttributes = entity.attributes;
    }
    for (const reference of inlineRelationships) {
      const relationship = createRelationship2(entity, reference, lineNumber, raw, inlineRelationships.length === 1 ? inlineAttributes : void 0);
      entity.outgoingRelationshipIds?.push(relationship.uid);
    }
  }
  const entityByQualifiedId = /* @__PURE__ */ new Map();
  const entityByUnqualifiedId = /* @__PURE__ */ new Map();
  for (const entity of document.entities) {
    if (entity.qualifiedId) {
      if (entityByQualifiedId.has(entity.qualifiedId)) {
        pushDiagnostic(document, options.strict ? "error" : "warning", `Duplicate entity id '${entity.qualifiedId}'.`, entity.sourceRange?.startLine ?? 1, "");
      }
      entityByQualifiedId.set(entity.qualifiedId, entity);
    }
    if (entity.id) {
      entityByUnqualifiedId.set(entity.id, entity);
    }
  }
  for (const relationship of document.relationships) {
    const targetEntity = relationship.targetRef ? entityByQualifiedId.get(relationship.targetRef) ?? entityByUnqualifiedId.get(splitQualifiedName(relationship.targetRef).localName) : void 0;
    if (targetEntity) {
      relationship.targetId = targetEntity.uid;
      targetEntity.incomingRelationshipIds?.push(relationship.uid);
    } else if (relationship.targetRef) {
      const targetNamespace = splitQualifiedName(relationship.targetRef).namespacePrefix;
      const isExternalReference = Boolean(targetNamespace && targetNamespace !== defaultNamespace);
      const canBeResolvedLater = isExternalReference || (document.includes?.length ?? 0) > 0;
      const severity = canBeResolvedLater ? "warning" : options.strict ? "error" : "warning";
      pushDiagnostic(
        document,
        severity,
        `Unresolved relationship target '${relationship.targetRef}'.`,
        relationship.sourceRange?.startLine ?? 1,
        ""
      );
    }
  }
  if (options.generateImplicitRelationships !== false) {
    for (const entity of document.entities) {
      if (!entity.parentId) {
        continue;
      }
      relationshipCounter += 1;
      const containment = {
        uid: createRelationshipUid(entity.parentId, "contains", entity.uid, relationshipCounter),
        kind: "relationship",
        sourceId: entity.parentId,
        targetId: entity.uid,
        typeRef: "contains",
        relationshipKind: "containment",
        implicit: true,
        virtual: false,
        sourceSyntax: "generated"
      };
      document.relationships.push(containment);
      entity.incomingRelationshipIds?.push(containment.uid);
      const parent = document.entities.find((candidate) => candidate.uid === entity.parentId);
      parent?.outgoingRelationshipIds?.push(containment.uid);
    }
    const groups = /* @__PURE__ */ new Map();
    for (const entity of document.entities) {
      const groupKey = entity.parentId ?? "__root__";
      const group = groups.get(groupKey);
      if (group) {
        group.push(entity);
      } else {
        groups.set(groupKey, [entity]);
      }
    }
    for (const siblings of groups.values()) {
      siblings.sort((left, right) => (left.rank ?? 0) - (right.rank ?? 0));
      for (let index = 0; index < siblings.length - 1; index += 1) {
        const source = siblings[index];
        const target = siblings[index + 1];
        if (!source || !target) {
          continue;
        }
        relationshipCounter += 1;
        const ordering = {
          uid: createRelationshipUid(source.uid, "followed_by", target.uid, relationshipCounter),
          kind: "relationship",
          sourceId: source.uid,
          targetId: target.uid,
          typeRef: "followed_by",
          relationshipKind: "ordering",
          implicit: true,
          virtual: true,
          sourceSyntax: "generated"
        };
        document.relationships.push(ordering);
        source.outgoingRelationshipIds?.push(ordering.uid);
        target.incomingRelationshipIds?.push(ordering.uid);
      }
    }
  }
  document.roots = document.entities.filter((entity) => !entity.parentId).map((entity) => entity.uid);
  const parsedDocument = pruneEmptyCollections(document);
  annotateDocumentWithUri(parsedDocument, options.uri);
  return {
    value: parsedDocument,
    diagnostics: parsedDocument.diagnostics ?? []
  };
}
function parseItm(text, options = {}) {
  const result = parseItmResult(text, options);
  throwOnErrorDiagnostics(result.diagnostics, "ITM parsing failed due to error diagnostics.", result.value);
  return result.value;
}
function parseDocument(text, options = {}) {
  return parseItm(text, options);
}
function parseDocumentResult(text, options = {}) {
  return parseItmResult(text, options);
}

// src/compose.ts
var DUPLICATE_ENTITY_MESSAGE_PREFIX = "Duplicate entity id '";
var UNRESOLVED_TARGET_MESSAGE_PREFIX = "Unresolved relationship target '";
var OVERLAY_TARGET_MESSAGE_PREFIX = "Overlay target '";
function cloneValue(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}
function createDiagnostic(document, message, severity = "error", extras = {}) {
  return {
    uid: `diagnostic:${document.diagnostics?.length ?? 0}:compose`,
    source: "itm.compose",
    severity,
    message,
    ...document.uri ? { file: document.uri, uri: document.uri } : {},
    ...extras
  };
}
function addDiagnostic(document, message, severity = "error", extras = {}) {
  const diagnostics = sanitizeExistingDiagnostics(document);
  diagnostics.push(createDiagnostic(document, message, severity, extras));
  document.diagnostics = diagnostics;
}
function sanitizeExistingDiagnostics(document) {
  return (document.diagnostics ?? []).filter(
    (diagnostic) => !diagnostic.message.startsWith(DUPLICATE_ENTITY_MESSAGE_PREFIX) && !diagnostic.message.startsWith(UNRESOLVED_TARGET_MESSAGE_PREFIX) && !diagnostic.message.startsWith(OVERLAY_TARGET_MESSAGE_PREFIX)
  );
}
function createSourceProviderFromIncludeProviders(providers) {
  if (providers.length === 0) {
    return void 0;
  }
  return {
    async read(request) {
      for (const provider of providers) {
        const loaded = await provider.load(request.target, {
          include: request.include,
          sourceDocument: request.sourceDocument,
          resolvedTarget: request.target
        });
        if (loaded) {
          return loaded;
        }
      }
      return void 0;
    }
  };
}
function looksLikeUrl(value) {
  return /^[A-Za-z][A-Za-z0-9+.-]*:\/\//u.test(value);
}
function looksLikeWindowsPath(value) {
  return /^[A-Za-z]:[\\/]/u.test(value);
}
function ensureTrailingSlash(value) {
  return /[\\/]$/u.test(value) ? value : `${value}/`;
}
function joinLocator(base, suffix) {
  const normalizedSuffix = suffix.replace(/^[/\\]+/u, "");
  if (looksLikeUrl(base)) {
    return new URL(normalizedSuffix, ensureTrailingSlash(base)).toString();
  }
  return `${base.replace(/[\\/]+$/u, "")}/${normalizedSuffix}`;
}
function resolveRepositoryTarget(target, repositories) {
  const match = target.match(/^([A-Za-z][A-Za-z0-9_-]*):(.*)$/u);
  if (!match || looksLikeUrl(target) || looksLikeWindowsPath(target)) {
    return target;
  }
  const repositoryName = match[1] ?? "";
  const repositoryPath = match[2] ?? "";
  const repository = repositories?.find((candidate) => candidate.name === repositoryName);
  if (!repository) {
    return target;
  }
  return joinLocator(repository.location, repositoryPath);
}
function mergeCollections(...values) {
  const merged = values.flatMap((value) => value ?? []);
  return merged.length > 0 ? merged : void 0;
}
function mergeDocuments(root, included) {
  const clones = [cloneValue(root), ...included.map((document) => cloneValue(document))];
  const [base, ...rest] = clones;
  if (!base) {
    return cloneValue(root);
  }
  const namespaces = mergeCollections(base.namespaces, ...rest.map((document) => document.namespaces));
  const entityTypes = mergeCollections(base.entityTypes, ...rest.map((document) => document.entityTypes));
  const relationshipTypes = mergeCollections(base.relationshipTypes, ...rest.map((document) => document.relationshipTypes));
  const selectors = mergeCollections(base.selectors, ...rest.map((document) => document.selectors));
  const validationRules = mergeCollections(base.validationRules, ...rest.map((document) => document.validationRules));
  const pluginRequirements = mergeCollections(base.pluginRequirements, ...rest.map((document) => document.pluginRequirements));
  const styles = mergeCollections(base.styles, ...rest.map((document) => document.styles));
  const viewpoints = mergeCollections(base.viewpoints, ...rest.map((document) => document.viewpoints));
  const views = mergeCollections(base.views, ...rest.map((document) => document.views));
  const includes = mergeCollections(base.includes, ...rest.map((document) => document.includes));
  const packages = mergeCollections(base.packages, ...rest.map((document) => document.packages));
  const packageUsages = mergeCollections(base.packageUsages, ...rest.map((document) => document.packageUsages));
  const repositories = mergeCollections(base.repositories, ...rest.map((document) => document.repositories));
  const overlays = mergeCollections(base.overlays, ...rest.map((document) => document.overlays));
  const directives = mergeCollections(base.directives, ...rest.map((document) => document.directives));
  const diagnostics = mergeCollections(base.diagnostics, ...rest.map((document) => document.diagnostics));
  return {
    ...base,
    entities: clones.flatMap((document) => document.entities),
    relationships: clones.flatMap((document) => document.relationships),
    ...namespaces ? { namespaces } : {},
    ...entityTypes ? { entityTypes } : {},
    ...relationshipTypes ? { relationshipTypes } : {},
    ...selectors ? { selectors } : {},
    ...validationRules ? { validationRules } : {},
    ...pluginRequirements ? { pluginRequirements } : {},
    ...styles ? { styles } : {},
    ...viewpoints ? { viewpoints } : {},
    ...views ? { views } : {},
    ...includes ? { includes } : {},
    ...packages ? { packages } : {},
    ...packageUsages ? { packageUsages } : {},
    ...repositories ? { repositories } : {},
    ...overlays ? { overlays } : {},
    ...directives ? { directives } : {},
    ...diagnostics ? { diagnostics } : {}
  };
}
function asRecord2(value) {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return void 0;
  }
  return value;
}
function splitQualifiedName2(name) {
  const parts = name.split("::");
  return { localName: parts[parts.length - 1] ?? name };
}
function resolveEntityReference(reference, entitiesByQualifiedId, entitiesByLocalId) {
  if (!reference) {
    return void 0;
  }
  return entitiesByQualifiedId.get(reference) ?? entitiesByLocalId.get(splitQualifiedName2(reference).localName);
}
function resolveRelationshipReference(reference, relationshipsByUid, relationshipsById) {
  if (!reference) {
    return void 0;
  }
  return relationshipsByUid.get(reference) ?? relationshipsById.get(reference);
}
function appendValue(existing, incoming) {
  if (incoming === void 0) {
    return existing;
  }
  if (existing === void 0) {
    return Array.isArray(incoming) ? [...incoming] : [incoming];
  }
  const existingArray = Array.isArray(existing) ? [...existing] : [existing];
  const incomingArray = Array.isArray(incoming) ? incoming : [incoming];
  return [...existingArray, ...incomingArray];
}
function mergeRecordValues(existing, incoming) {
  const existingRecord = asRecord2(existing);
  const incomingRecord = asRecord2(incoming);
  if (!existingRecord || !incomingRecord) {
    return incoming ?? existing;
  }
  return {
    ...existingRecord,
    ...incomingRecord
  };
}
function applyAttributePatches(bag, overlay) {
  if (!overlay.attributePatches || overlay.attributePatches.length === 0) {
    return bag;
  }
  const result = bag ? cloneValue(bag) : { values: {} };
  for (const patch of overlay.attributePatches) {
    if (patch.operation === "delete") {
      delete result.values[patch.key];
      continue;
    }
    if (patch.operation === "append") {
      const appendedValue = appendValue(result.values[patch.key], patch.value);
      if (appendedValue !== void 0) {
        result.values[patch.key] = appendedValue;
      }
      continue;
    }
    if (patch.operation === "merge") {
      const mergedValue = mergeRecordValues(result.values[patch.key], patch.value);
      if (mergedValue !== void 0) {
        result.values[patch.key] = mergedValue;
      }
      continue;
    }
    if (patch.value !== void 0) {
      result.values[patch.key] = patch.value;
    }
  }
  return result;
}
function applyDescriptionPatch(description, overlay) {
  if (!overlay.descriptionPatch) {
    return description;
  }
  if (overlay.descriptionPatch.operation === "append" && description) {
    return {
      ...description,
      text: `${description.text}
${overlay.descriptionPatch.text}`
    };
  }
  return {
    format: "markdown",
    text: overlay.descriptionPatch.text
  };
}
function applyOverlays(document) {
  const composed = cloneValue(document);
  const diagnostics = sanitizeExistingDiagnostics(composed);
  const entitiesByQualifiedId = /* @__PURE__ */ new Map();
  const entitiesByLocalId = /* @__PURE__ */ new Map();
  for (const entity of composed.entities) {
    if (entity.qualifiedId) {
      entitiesByQualifiedId.set(entity.qualifiedId, entity);
    }
    if (entity.id) {
      entitiesByLocalId.set(entity.id, entity);
    }
  }
  const addedRelationships = [];
  for (const overlay of composed.overlays ?? []) {
    const targetEntity = overlay.targetKind === "entity" ? resolveEntityReference(overlay.targetRef, entitiesByQualifiedId, entitiesByLocalId) : void 0;
    if (!targetEntity) {
      diagnostics.push(createDiagnostic(composed, `Overlay target '${overlay.targetRef}' was not found.`));
      continue;
    }
    overlay.targetUid = targetEntity.uid;
    targetEntity.overlayIds = [...targetEntity.overlayIds ?? [], overlay.uid];
    if (overlay.replacementLabel !== void 0) {
      targetEntity.label = overlay.replacementLabel;
    }
    if (overlay.replacementTypeRef !== void 0) {
      targetEntity.typeRef = overlay.replacementTypeRef;
    }
    const patchedAttributes = applyAttributePatches(targetEntity.attributes, overlay);
    if (patchedAttributes) {
      targetEntity.attributes = patchedAttributes;
    } else {
      delete targetEntity.attributes;
    }
    const patchedDescription = applyDescriptionPatch(targetEntity.description, overlay);
    if (patchedDescription) {
      targetEntity.description = patchedDescription;
    } else {
      delete targetEntity.description;
    }
    for (const addition of overlay.relationshipAdditions ?? []) {
      addedRelationships.push({
        ...addition,
        sourceId: targetEntity.uid,
        ...targetEntity.qualifiedId ? { sourceRef: targetEntity.qualifiedId } : {},
        overlayIds: [...addition.overlayIds ?? [], overlay.uid]
      });
    }
  }
  composed.relationships = [...composed.relationships, ...addedRelationships];
  if (diagnostics.length > 0) {
    composed.diagnostics = diagnostics;
  } else {
    delete composed.diagnostics;
  }
  return composed;
}
function resolveViewDeltaTargets(document) {
  const entitiesByQualifiedId = /* @__PURE__ */ new Map();
  const entitiesByLocalId = /* @__PURE__ */ new Map();
  const relationshipsByUid = /* @__PURE__ */ new Map();
  const relationshipsById = /* @__PURE__ */ new Map();
  for (const entity of document.entities) {
    if (entity.qualifiedId) {
      entitiesByQualifiedId.set(entity.qualifiedId, entity);
    }
    if (entity.id) {
      entitiesByLocalId.set(entity.id, entity);
    }
  }
  for (const relationship of document.relationships) {
    relationshipsByUid.set(relationship.uid, relationship);
    if (relationship.id) {
      relationshipsById.set(relationship.id, relationship);
    }
  }
  for (const view of document.views ?? []) {
    for (const delta of view.deltas ?? []) {
      if (!("targetRef" in delta) || !delta.targetRef) {
        continue;
      }
      if ("targetKind" in delta && delta.targetKind === "relationship") {
        const targetUid2 = resolveRelationshipReference(delta.targetRef, relationshipsByUid, relationshipsById)?.uid;
        if (targetUid2) {
          delta.targetUid = targetUid2;
        }
        continue;
      }
      const targetUid = resolveEntityReference(delta.targetRef, entitiesByQualifiedId, entitiesByLocalId)?.uid;
      if (targetUid) {
        delta.targetUid = targetUid;
      }
    }
  }
}
function rebuildReferences(document) {
  const composed = cloneValue(document);
  const diagnostics = sanitizeExistingDiagnostics(composed);
  const entitiesByUid = /* @__PURE__ */ new Map();
  const entitiesByQualifiedId = /* @__PURE__ */ new Map();
  const entitiesByLocalId = /* @__PURE__ */ new Map();
  for (const entity of composed.entities) {
    entity.incomingRelationshipIds = [];
    entity.outgoingRelationshipIds = [];
    entitiesByUid.set(entity.uid, entity);
    if (entity.qualifiedId) {
      if (entitiesByQualifiedId.has(entity.qualifiedId)) {
        diagnostics.push(createDiagnostic(composed, `Duplicate entity id '${entity.qualifiedId}'.`));
      }
      entitiesByQualifiedId.set(entity.qualifiedId, entity);
    }
    if (entity.id) {
      entitiesByLocalId.set(entity.id, entity);
    }
  }
  for (const relationship of composed.relationships) {
    const source = entitiesByUid.get(relationship.sourceId) ?? resolveEntityReference(relationship.sourceRef, entitiesByQualifiedId, entitiesByLocalId);
    if (source) {
      relationship.sourceId = source.uid;
      if (source.qualifiedId) {
        relationship.sourceRef = source.qualifiedId;
      } else {
        delete relationship.sourceRef;
      }
      source.outgoingRelationshipIds?.push(relationship.uid);
    }
    if (relationship.targetRef) {
      const target = resolveEntityReference(relationship.targetRef, entitiesByQualifiedId, entitiesByLocalId);
      if (target) {
        relationship.targetId = target.uid;
      } else {
        delete relationship.targetId;
        diagnostics.push(createDiagnostic(composed, `Unresolved relationship target '${relationship.targetRef}'.`));
      }
    }
    const targetEntity = relationship.targetId ? entitiesByUid.get(relationship.targetId) : void 0;
    targetEntity?.incomingRelationshipIds?.push(relationship.uid);
  }
  composed.roots = composed.entities.filter((entity) => !entity.parentId).map((entity) => entity.uid);
  if (diagnostics.length > 0) {
    composed.diagnostics = diagnostics;
  } else {
    delete composed.diagnostics;
  }
  resolveViewDeltaTargets(composed);
  return composed;
}
async function loadIncludeDocument(include, sourceDocument, options, includeStack) {
  const resolvedTarget = resolveRepositoryTarget(include.target, sourceDocument.repositories);
  const sourceProvider = options.sourceProvider ?? createSourceProviderFromIncludeProviders(options.includeProviders ?? []);
  if (!sourceProvider) {
    return {
      include: {
        ...include,
        status: "unresolved"
      }
    };
  }
  let loaded;
  try {
    loaded = await sourceProvider.read({
      include,
      sourceDocument,
      ...sourceDocument.uri ? { fromUri: sourceDocument.uri } : {},
      rawTarget: include.target,
      target: resolvedTarget,
      includeStack
    });
  } catch (error) {
    return {
      include: {
        ...include,
        status: "blocked"
      },
      error
    };
  }
  if (!loaded) {
    return {
      include: {
        ...include,
        status: "missing"
      }
    };
  }
  return {
    include: {
      ...include,
      status: "resolved"
    },
    document: parseDocument(loaded.text, {
      ...options.parseOptions ?? {},
      ...loaded.uri ? { uri: loaded.uri } : {}
    })
  };
}
async function expandIncludes(document, options, stack = []) {
  const maxIncludeDepth = options.maxIncludeDepth ?? 16;
  const currentDocument = cloneValue(document);
  if (stack.length >= maxIncludeDepth) {
    currentDocument.diagnostics = [
      ...sanitizeExistingDiagnostics(currentDocument),
      createDiagnostic(currentDocument, `Include depth exceeded the configured limit of ${maxIncludeDepth}.`, "error", {
        directiveName: "include"
      })
    ];
    return currentDocument;
  }
  const expandedDocuments = [];
  const updatedIncludes = [];
  for (const include of currentDocument.includes ?? []) {
    const resolvedTarget = resolveRepositoryTarget(include.target, currentDocument.repositories);
    if (stack.includes(resolvedTarget)) {
      updatedIncludes.push({
        ...include,
        status: "circular"
      });
      addDiagnostic(currentDocument, `Circular include detected for '${include.target}'.`, "error", {
        directiveName: "include",
        includeTarget: include.target,
        includeStack: [...stack, resolvedTarget],
        ...include.source ? { range: include.source } : {}
      });
      continue;
    }
    if (stack.length + 1 > maxIncludeDepth) {
      updatedIncludes.push({
        ...include,
        status: "blocked"
      });
      addDiagnostic(currentDocument, `Include depth exceeded the configured limit of ${maxIncludeDepth}.`, "error", {
        directiveName: "include",
        includeTarget: include.target,
        includeStack: [...stack, resolvedTarget],
        ...include.source ? { range: include.source } : {}
      });
      continue;
    }
    const loaded = await loadIncludeDocument(include, currentDocument, options, stack);
    updatedIncludes.push(loaded.include);
    if (!loaded.document) {
      if (loaded.include.status === "missing") {
        addDiagnostic(currentDocument, `Include '${include.target}' could not be resolved.`, "error", {
          directiveName: "include",
          includeTarget: include.target,
          includeStack: [...stack, resolvedTarget],
          ...include.source ? { range: include.source } : {}
        });
      } else if (loaded.include.status === "blocked") {
        addDiagnostic(currentDocument, `Include '${include.target}' failed because the source provider raised an error.`, "error", {
          directiveName: "include",
          includeTarget: include.target,
          includeStack: [...stack, resolvedTarget],
          code: loaded.error instanceof Error ? loaded.error.message : String(loaded.error),
          ...include.source ? { range: include.source } : {}
        });
      }
      continue;
    }
    expandedDocuments.push(await expandIncludes(loaded.document, options, [...stack, resolvedTarget]));
  }
  if (updatedIncludes.length > 0) {
    currentDocument.includes = updatedIncludes;
  }
  return mergeDocuments(currentDocument, expandedDocuments);
}
async function composeDocument(document, options = {}) {
  const baseDocument = options.uri && !document.uri ? {
    ...cloneValue(document),
    uri: options.uri
  } : cloneValue(document);
  const expanded = await expandIncludes(baseDocument, options);
  const withOverlays = applyOverlays(expanded);
  return rebuildReferences(withOverlays);
}
async function composeText(text, options = {}) {
  const document = parseDocument(text, {
    ...options.parseOptions ?? {},
    ...options.uri ? { uri: options.uri } : {}
  });
  return composeDocument(document, options);
}
async function composeDocumentResult(document, options = {}) {
  const value = await composeDocument(document, options);
  return {
    value,
    diagnostics: value.diagnostics ?? []
  };
}
async function parseEffectiveDocument(text, options = {}, parsed) {
  const initial = parsed ?? parseDocumentResult(text, options);
  const value = await composeDocument(initial.value, {
    ...options.uri ? { uri: options.uri } : {},
    parseOptions: options,
    ...options.sourceProvider ? { sourceProvider: options.sourceProvider } : {},
    ...typeof options.maxIncludeDepth === "number" ? { maxIncludeDepth: options.maxIncludeDepth } : {}
  });
  return {
    value,
    diagnostics: value.diagnostics ?? []
  };
}
async function parseDocumentResultAsync(text, options = {}) {
  return parseEffectiveDocument(text, options);
}
function createBaseUrlIncludeProvider(baseUrl, options = {}) {
  const fetchText = options.fetchText ?? (async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch include '${url}' (${response.status}).`);
    }
    return response.text();
  });
  return {
    name: "base-url",
    async load(target) {
      const absoluteTarget = looksLikeUrl(target) ? target : new URL(target, ensureTrailingSlash(baseUrl)).toString();
      if (!/^https?:\/\//u.test(absoluteTarget)) {
        return void 0;
      }
      return {
        text: await fetchText(absoluteTarget),
        uri: absoluteTarget
      };
    }
  };
}
function createBaseUrlSourceProvider(baseUrl, options = {}) {
  return createSourceProviderFromIncludeProviders([createBaseUrlIncludeProvider(baseUrl, options)]);
}

// src/factories.ts
function createAttributeBag2(values = {}) {
  return { values };
}
function createEntity(entity) {
  return {
    kind: "entity",
    ...entity
  };
}
function createRelationship(relationship) {
  return {
    kind: "relationship",
    ...relationship
  };
}
function createDocument(document = {}) {
  return {
    format: "itm",
    modelVersion: document.modelVersion ?? "1.0.0",
    ...document,
    entities: document.entities ?? [],
    relationships: document.relationships ?? []
  };
}

// src/builder.ts
function cloneValue2(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}
function sanitizeUidSegment2(value) {
  return value.trim().replace(/[^a-zA-Z0-9:_-]+/g, "_").replace(/^_+|_+$/g, "") || "anonymous";
}
function splitQualifiedName3(name) {
  const parts = name.split("::");
  if (parts.length > 1) {
    const localId = parts.pop() ?? name;
    const namespacePrefix = parts.join("::");
    return {
      ...namespacePrefix ? { namespacePrefix } : {},
      localId
    };
  }
  return { localId: name };
}
function toAttributeBag(attributes) {
  if (!attributes) {
    return void 0;
  }
  if ("values" in attributes) {
    return cloneValue2(attributes);
  }
  return createAttributeBag2(cloneValue2(attributes));
}
function toDescription(description) {
  if (!description) {
    return void 0;
  }
  if (typeof description === "string") {
    return {
      format: "markdown",
      text: description
    };
  }
  return cloneValue2(description);
}
function qualifyId(localId, namespacePrefix) {
  if (!localId) {
    return void 0;
  }
  return namespacePrefix ? `${namespacePrefix}::${localId}` : localId;
}
function moveItem(items, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || fromIndex >= items.length) {
    return;
  }
  const [item] = items.splice(fromIndex, 1);
  if (item === void 0) {
    return;
  }
  items.splice(Math.max(0, Math.min(items.length, toIndex)), 0, item);
}
function setOptional(target, key, value) {
  if (value === void 0) {
    delete target[key];
    return;
  }
  target[key] = value;
}
var ItmDocumentBuilder = class _ItmDocumentBuilder {
  constructor(document = {}) {
    this.document = createDocument(cloneValue2(document));
    this.normalize();
  }
  static fromDocument(document) {
    return new _ItmDocumentBuilder(document);
  }
  setMetadata(metadata) {
    if (metadata) {
      this.document.metadata = cloneValue2(metadata);
    } else {
      delete this.document.metadata;
    }
    this.normalize();
    return this;
  }
  upsertNamespace(namespace) {
    const namespaces = [...this.document.namespaces ?? []];
    const index = namespaces.findIndex((entry) => entry.prefix === namespace.prefix);
    if (index >= 0) {
      namespaces[index] = cloneValue2(namespace);
    } else {
      namespaces.push(cloneValue2(namespace));
    }
    this.document.namespaces = namespaces;
    return this;
  }
  findEntity(reference) {
    return this.findEntityInternal(reference);
  }
  findRelationship(reference) {
    return this.document.relationships.find(
      (relationship) => relationship.uid === reference || relationship.id === reference || relationship.targetRef === reference
    );
  }
  findViewpoint(reference) {
    return (this.document.viewpoints ?? []).find(
      (viewpoint) => viewpoint.uid === reference || viewpoint.name === reference
    );
  }
  findView(reference) {
    return (this.document.views ?? []).find(
      (view) => view.uid === reference || view.name === reference
    );
  }
  findOverlay(reference) {
    return (this.document.overlays ?? []).find(
      (overlay) => overlay.uid === reference || overlay.targetRef === reference
    );
  }
  findEntityType(reference) {
    return (this.document.entityTypes ?? []).find(
      (entityType) => entityType.uid === reference || entityType.name === reference
    );
  }
  findRelationshipType(reference) {
    return (this.document.relationshipTypes ?? []).find(
      (relationshipType) => relationshipType.uid === reference || relationshipType.name === reference
    );
  }
  findStyleRule(reference) {
    return (this.document.styles ?? []).find(
      (style) => style.uid === reference || style.selector.raw === reference
    );
  }
  findValidationRule(reference) {
    return (this.document.validationRules ?? []).find(
      (rule) => rule.uid === reference || rule.name === reference
    );
  }
  findRepository(reference) {
    return (this.document.repositories ?? []).find(
      (repository) => repository.name === reference
    );
  }
  findInclude(reference) {
    return (this.document.includes ?? []).find((include) => include.target === reference);
  }
  findPluginRequirement(reference) {
    return (this.document.pluginRequirements ?? []).find((requirement) => requirement.name === reference);
  }
  findPackage(reference) {
    return (this.document.packages ?? []).find(
      (pkg) => pkg.uid === reference || pkg.name === reference
    );
  }
  findPackageUsage(reference) {
    return (this.document.packageUsages ?? []).find((usage) => usage.packageRef === reference);
  }
  addEntity(draft) {
    const { namespacePrefix, localId, id, qualifiedId } = this.resolveEntityNames(draft);
    const attributes = toAttributeBag(draft.attributes);
    const description = toDescription(draft.description);
    const entity = {
      uid: draft.uid ?? this.createEntityUid(qualifiedId),
      kind: "entity",
      ...id ? { id } : {},
      ...qualifiedId ? { qualifiedId } : {},
      ...namespacePrefix ? { namespacePrefix } : {},
      ...localId ? { localId } : {},
      label: draft.label,
      ...draft.typeRef ? { typeRef: draft.typeRef } : {},
      ...draft.tags ? { tags: [...draft.tags] } : {},
      ...attributes ? { attributes } : {},
      ...description ? { description } : {},
      ...draft.parent ? { parentId: this.requireEntity(draft.parent).uid } : {},
      ...draft.rank !== void 0 ? { rank: draft.rank } : {}
    };
    this.document.entities.push(entity);
    this.normalize();
    return this.requireEntity(entity.uid);
  }
  renameEntity(reference, changes) {
    const entity = this.requireEntity(reference);
    const renameInput = {
      ...changes.id ?? entity.id ? { id: changes.id ?? entity.id } : {},
      ...changes.id ?? entity.localId ? { localId: changes.id ?? entity.localId } : {},
      ...changes.namespacePrefix ?? entity.namespacePrefix ? { namespacePrefix: changes.namespacePrefix ?? entity.namespacePrefix } : {},
      ...changes.qualifiedId ? { qualifiedId: changes.qualifiedId } : changes.id === void 0 && changes.namespacePrefix === void 0 && entity.qualifiedId ? { qualifiedId: entity.qualifiedId } : {}
    };
    const { namespacePrefix, localId, id, qualifiedId } = this.resolveEntityNames(renameInput);
    if (id) {
      entity.id = id;
    } else {
      delete entity.id;
    }
    if (localId) {
      entity.localId = localId;
    } else {
      delete entity.localId;
    }
    if (namespacePrefix) {
      entity.namespacePrefix = namespacePrefix;
    } else {
      delete entity.namespacePrefix;
    }
    if (qualifiedId) {
      entity.qualifiedId = qualifiedId;
    } else {
      delete entity.qualifiedId;
    }
    entity.label = changes.label ?? entity.label;
    if (changes.typeRef !== void 0) {
      entity.typeRef = changes.typeRef;
    }
    this.normalize();
    return this.requireEntity(entity.uid);
  }
  moveEntity(reference, move) {
    const entity = this.requireEntity(reference);
    const parentUid = move.parent ? this.requireEntity(move.parent).uid : void 0;
    if (parentUid && this.isDescendant(parentUid, entity.uid)) {
      throw new Error(`Cannot move entity '${entity.uid}' beneath one of its descendants.`);
    }
    if (parentUid) {
      entity.parentId = parentUid;
    } else {
      delete entity.parentId;
    }
    if (move.index !== void 0) {
      const currentIndex = this.document.entities.findIndex((candidate) => candidate.uid === entity.uid);
      const siblingIndexes = this.document.entities.map((candidate, index) => ({ candidate, index })).filter(({ candidate }) => candidate.uid !== entity.uid && candidate.parentId === parentUid).map(({ index }) => index);
      const targetIndex = siblingIndexes[move.index] ?? this.document.entities.length - 1;
      moveItem(this.document.entities, currentIndex, targetIndex);
    }
    this.normalize();
    return this.requireEntity(entity.uid);
  }
  removeEntity(reference) {
    const entity = this.findEntityInternal(reference);
    if (!entity) {
      return void 0;
    }
    const removedIds = /* @__PURE__ */ new Set([entity.uid]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const candidate of this.document.entities) {
        if (candidate.parentId && removedIds.has(candidate.parentId) && !removedIds.has(candidate.uid)) {
          removedIds.add(candidate.uid);
          changed = true;
        }
      }
    }
    this.document.entities = this.document.entities.filter((candidate) => !removedIds.has(candidate.uid));
    this.document.relationships = this.document.relationships.filter(
      (relationship) => !removedIds.has(relationship.sourceId) && (!relationship.targetId || !removedIds.has(relationship.targetId))
    );
    this.normalize();
    return entity;
  }
  addRelationship(draft) {
    const source = this.requireEntity(draft.source);
    const targetEntity = draft.target ? this.findEntityInternal(draft.target) : void 0;
    const targetRef = draft.targetRef ?? targetEntity?.qualifiedId ?? targetEntity?.id;
    const attributes = toAttributeBag(draft.attributes);
    const relationship = {
      uid: draft.uid ?? this.createRelationshipUid(source.uid, draft.typeRef ?? this.defaultRelationshipType(), targetRef ?? targetEntity?.uid),
      kind: "relationship",
      ...draft.id ? { id: draft.id } : {},
      sourceId: source.uid,
      ...source.qualifiedId ? { sourceRef: source.qualifiedId } : {},
      ...targetEntity ? { targetId: targetEntity.uid } : {},
      ...targetRef ? { targetRef } : {},
      typeRef: draft.typeRef ?? this.defaultRelationshipType(),
      relationshipKind: "explicit",
      ...attributes ? { attributes } : {},
      ...draft.sourceSyntax ? { sourceSyntax: draft.sourceSyntax } : {}
    };
    this.document.relationships.push(relationship);
    this.normalize();
    return this.requireRelationship(relationship.uid);
  }
  updateRelationship(reference, changes) {
    const relationship = this.requireRelationship(reference);
    if (changes.id !== void 0) {
      relationship.id = changes.id;
    }
    if (changes.typeRef !== void 0) {
      relationship.typeRef = changes.typeRef;
    }
    if (changes.target !== void 0) {
      const targetEntity = this.requireEntity(changes.target);
      relationship.targetId = targetEntity.uid;
      const targetRef = targetEntity.qualifiedId ?? targetEntity.id;
      if (targetRef) {
        relationship.targetRef = targetRef;
      } else {
        delete relationship.targetRef;
      }
    } else if (changes.targetRef !== void 0) {
      relationship.targetRef = changes.targetRef;
      const targetEntity = this.findEntityInternal(changes.targetRef);
      if (targetEntity) {
        relationship.targetId = targetEntity.uid;
      } else {
        delete relationship.targetId;
      }
    }
    if (changes.attributes !== void 0) {
      const attributes = toAttributeBag(changes.attributes);
      if (attributes) {
        relationship.attributes = attributes;
      } else {
        delete relationship.attributes;
      }
    }
    if (changes.sourceSyntax !== void 0) {
      relationship.sourceSyntax = changes.sourceSyntax;
    }
    this.normalize();
    return this.requireRelationship(relationship.uid);
  }
  removeRelationship(reference) {
    const predicate = typeof reference === "function" ? reference : (relationship) => relationship.uid === reference || relationship.id === reference;
    const before = this.document.relationships.length;
    this.document.relationships = this.document.relationships.filter(
      (relationship) => relationship.relationshipKind !== "explicit" || !predicate(relationship)
    );
    this.normalize();
    return before - this.document.relationships.length;
  }
  addViewpoint(draft) {
    const viewpoint = {
      uid: draft.uid ?? `viewpoint:${sanitizeUidSegment2(draft.name)}`,
      kind: "viewpoint",
      name: draft.name,
      ...draft.title ? { title: draft.title } : {},
      ...draft.description ? { description: draft.description } : {},
      pipeline: this.normalizePipeline(draft.pipeline, `viewpoint:${sanitizeUidSegment2(draft.name)}`),
      ...draft.parameters ? { parameters: cloneValue2(draft.parameters) } : {},
      supportsVisualEditing: draft.supportsVisualEditing ?? false
    };
    this.document.viewpoints = [...this.document.viewpoints ?? [], viewpoint];
    this.normalize();
    return this.requireViewpoint(viewpoint.uid);
  }
  updateViewpoint(reference, changes) {
    const viewpoint = this.requireViewpoint(reference);
    setOptional(viewpoint, "title", changes.title ?? viewpoint.title);
    setOptional(viewpoint, "description", changes.description ?? viewpoint.description);
    if (changes.pipeline !== void 0) {
      viewpoint.pipeline = this.normalizePipeline(changes.pipeline, viewpoint.uid);
    }
    if (changes.parameters !== void 0) {
      setOptional(viewpoint, "parameters", cloneValue2(changes.parameters));
    }
    if (changes.supportsVisualEditing !== void 0) {
      viewpoint.supportsVisualEditing = changes.supportsVisualEditing;
    }
    this.normalize();
    return this.requireViewpoint(viewpoint.uid);
  }
  removeViewpoint(reference) {
    const viewpoint = this.findViewpoint(reference);
    if (!viewpoint) {
      return void 0;
    }
    this.document.viewpoints = (this.document.viewpoints ?? []).filter((candidate) => candidate.uid !== viewpoint.uid);
    if ((this.document.viewpoints?.length ?? 0) === 0) {
      delete this.document.viewpoints;
    }
    return viewpoint;
  }
  addView(draft) {
    this.requireViewpoint(draft.viewpoint);
    const view = {
      uid: draft.uid ?? `view:${sanitizeUidSegment2(draft.name)}`,
      kind: "view",
      name: draft.name,
      ...draft.title ? { title: draft.title } : {},
      viewpointRef: draft.viewpoint,
      ...draft.parameters ? { parameters: cloneValue2(draft.parameters) } : {},
      ...draft.deltas ? { deltas: cloneValue2(draft.deltas) } : {},
      ...draft.generatedAssets ? { generatedAssets: cloneValue2(draft.generatedAssets) } : {},
      ...draft.notes ? { notes: [...draft.notes] } : {}
    };
    this.document.views = [...this.document.views ?? [], view];
    this.normalize();
    return this.requireView(view.uid);
  }
  updateView(reference, changes) {
    const view = this.requireView(reference);
    setOptional(view, "title", changes.title ?? view.title);
    if (changes.viewpoint !== void 0) {
      view.viewpointRef = this.requireViewpoint(changes.viewpoint).name;
    }
    if (changes.parameters !== void 0) {
      setOptional(view, "parameters", cloneValue2(changes.parameters));
    }
    if (changes.deltas !== void 0) {
      setOptional(view, "deltas", cloneValue2(changes.deltas));
    }
    if (changes.generatedAssets !== void 0) {
      setOptional(view, "generatedAssets", cloneValue2(changes.generatedAssets));
    }
    if (changes.notes !== void 0) {
      setOptional(view, "notes", [...changes.notes]);
    }
    this.normalize();
    return this.requireView(view.uid);
  }
  removeView(reference) {
    const view = this.findView(reference);
    if (!view) {
      return void 0;
    }
    this.document.views = (this.document.views ?? []).filter((candidate) => candidate.uid !== view.uid);
    if ((this.document.views?.length ?? 0) === 0) {
      delete this.document.views;
    }
    return view;
  }
  addOverlay(draft) {
    const overlay = this.createOverlay(draft);
    this.document.overlays = [...this.document.overlays ?? [], overlay];
    this.normalize();
    return this.requireOverlay(overlay.uid);
  }
  updateOverlay(reference, changes) {
    const overlay = this.requireOverlay(reference);
    setOptional(overlay, "replacementLabel", changes.replacementLabel ?? overlay.replacementLabel);
    setOptional(overlay, "replacementTypeRef", changes.replacementTypeRef ?? overlay.replacementTypeRef);
    if (changes.attributes !== void 0) {
      setOptional(overlay, "attributePatches", this.toAttributePatches(changes.attributes));
    }
    if (changes.description !== void 0) {
      setOptional(
        overlay,
        "descriptionPatch",
        changes.description === null ? void 0 : { operation: "replace", text: changes.description }
      );
    }
    if (changes.relationshipAdditions !== void 0) {
      setOptional(overlay, "relationshipAdditions", this.normalizeOverlayRelationshipAdditions(overlay, changes.relationshipAdditions));
    }
    if (changes.policy !== void 0) {
      overlay.policy = changes.policy;
    }
    this.normalize();
    return this.requireOverlay(overlay.uid);
  }
  removeOverlay(reference) {
    const overlay = this.findOverlay(reference);
    if (!overlay) {
      return void 0;
    }
    this.document.overlays = (this.document.overlays ?? []).filter((candidate) => candidate.uid !== overlay.uid);
    if ((this.document.overlays?.length ?? 0) === 0) {
      delete this.document.overlays;
    }
    this.normalize();
    return overlay;
  }
  addEntityType(draft) {
    const entityType = {
      uid: draft.uid ?? `entity-type:${sanitizeUidSegment2(draft.name)}`,
      kind: "entity-type",
      name: draft.name,
      ...draft.description ? { description: draft.description } : {},
      ...draft.requiredAttributes ? { requiredAttributes: [...draft.requiredAttributes] } : {},
      ...draft.optionalAttributes ? { optionalAttributes: [...draft.optionalAttributes] } : {},
      ...draft.superTypeRefs ? { superTypeRefs: [...draft.superTypeRefs] } : {}
    };
    this.document.entityTypes = [...this.document.entityTypes ?? [], entityType];
    this.normalize();
    return this.requireEntityType(entityType.uid);
  }
  updateEntityType(reference, changes) {
    const entityType = this.requireEntityType(reference);
    setOptional(entityType, "description", changes.description ?? entityType.description);
    if (changes.requiredAttributes !== void 0) {
      setOptional(entityType, "requiredAttributes", [...changes.requiredAttributes]);
    }
    if (changes.optionalAttributes !== void 0) {
      setOptional(entityType, "optionalAttributes", [...changes.optionalAttributes]);
    }
    if (changes.superTypeRefs !== void 0) {
      setOptional(entityType, "superTypeRefs", [...changes.superTypeRefs]);
    }
    this.normalize();
    return this.requireEntityType(entityType.uid);
  }
  removeEntityType(reference) {
    const entityType = this.findEntityType(reference);
    if (!entityType) {
      return void 0;
    }
    this.document.entityTypes = (this.document.entityTypes ?? []).filter((candidate) => candidate.uid !== entityType.uid);
    if ((this.document.entityTypes?.length ?? 0) === 0) {
      delete this.document.entityTypes;
    }
    return entityType;
  }
  addRelationshipType(draft) {
    const relationshipType = {
      uid: draft.uid ?? `relationship-type:${sanitizeUidSegment2(draft.name)}`,
      kind: "relationship-type",
      name: draft.name,
      ...draft.description ? { description: draft.description } : {},
      ...draft.superTypeRefs ? { superTypeRefs: [...draft.superTypeRefs] } : {},
      ...draft.sourceTypeRefs ? { sourceTypeRefs: [...draft.sourceTypeRefs] } : {},
      ...draft.targetTypeRefs ? { targetTypeRefs: [...draft.targetTypeRefs] } : {},
      ...draft.inverseTypeRef ? { inverseTypeRef: draft.inverseTypeRef } : {},
      ...draft.requiredAttributes ? { requiredAttributes: [...draft.requiredAttributes] } : {},
      ...draft.optionalAttributes ? { optionalAttributes: [...draft.optionalAttributes] } : {}
    };
    this.document.relationshipTypes = [...this.document.relationshipTypes ?? [], relationshipType];
    this.normalize();
    return this.requireRelationshipType(relationshipType.uid);
  }
  updateRelationshipType(reference, changes) {
    const relationshipType = this.requireRelationshipType(reference);
    setOptional(relationshipType, "description", changes.description ?? relationshipType.description);
    if (changes.superTypeRefs !== void 0) {
      setOptional(relationshipType, "superTypeRefs", [...changes.superTypeRefs]);
    }
    if (changes.sourceTypeRefs !== void 0) {
      setOptional(relationshipType, "sourceTypeRefs", [...changes.sourceTypeRefs]);
    }
    if (changes.targetTypeRefs !== void 0) {
      setOptional(relationshipType, "targetTypeRefs", [...changes.targetTypeRefs]);
    }
    setOptional(relationshipType, "inverseTypeRef", changes.inverseTypeRef ?? relationshipType.inverseTypeRef);
    if (changes.requiredAttributes !== void 0) {
      setOptional(relationshipType, "requiredAttributes", [...changes.requiredAttributes]);
    }
    if (changes.optionalAttributes !== void 0) {
      setOptional(relationshipType, "optionalAttributes", [...changes.optionalAttributes]);
    }
    this.normalize();
    return this.requireRelationshipType(relationshipType.uid);
  }
  removeRelationshipType(reference) {
    const relationshipType = this.findRelationshipType(reference);
    if (!relationshipType) {
      return void 0;
    }
    this.document.relationshipTypes = (this.document.relationshipTypes ?? []).filter((candidate) => candidate.uid !== relationshipType.uid);
    if ((this.document.relationshipTypes?.length ?? 0) === 0) {
      delete this.document.relationshipTypes;
    }
    return relationshipType;
  }
  addStyleRule(draft) {
    const style = toAttributeBag(draft.style) ?? { values: {} };
    const styleRule = {
      uid: draft.uid ?? `style:${this.document.styles?.length ?? 0}:${sanitizeUidSegment2(draft.selector)}`,
      kind: "style-rule",
      selector: { raw: draft.selector },
      style,
      origin: draft.origin ?? "document",
      priority: draft.priority ?? (this.document.styles?.length ?? 0) + 1
    };
    this.document.styles = [...this.document.styles ?? [], styleRule];
    this.normalize();
    return this.requireStyleRule(styleRule.uid);
  }
  updateStyleRule(reference, changes) {
    const styleRule = this.requireStyleRule(reference);
    if (changes.selector !== void 0) {
      styleRule.selector = { raw: changes.selector };
    }
    if (changes.style !== void 0) {
      styleRule.style = toAttributeBag(changes.style) ?? { values: {} };
    }
    if (changes.origin !== void 0) {
      styleRule.origin = changes.origin;
    }
    if (changes.priority !== void 0) {
      styleRule.priority = changes.priority;
    }
    this.normalize();
    return this.requireStyleRule(styleRule.uid);
  }
  removeStyleRule(reference) {
    const styleRule = this.findStyleRule(reference);
    if (!styleRule) {
      return void 0;
    }
    this.document.styles = (this.document.styles ?? []).filter((candidate) => candidate.uid !== styleRule.uid);
    if ((this.document.styles?.length ?? 0) === 0) {
      delete this.document.styles;
    }
    return styleRule;
  }
  addValidationRule(draft) {
    const rule = {
      uid: draft.uid ?? `rule:${sanitizeUidSegment2(draft.name)}`,
      kind: "validation-rule",
      name: draft.name,
      selector: { raw: draft.selector },
      pipeline: this.normalizePipeline(draft.pipeline, `rule:${sanitizeUidSegment2(draft.name)}`),
      severity: draft.severity ?? "warning",
      ...draft.message ? { message: draft.message } : {},
      enabled: draft.enabled ?? true
    };
    this.document.validationRules = [...this.document.validationRules ?? [], rule];
    this.normalize();
    return this.requireValidationRule(rule.uid);
  }
  updateValidationRule(reference, changes) {
    const rule = this.requireValidationRule(reference);
    if (changes.selector !== void 0) {
      rule.selector = { raw: changes.selector };
    }
    if (changes.pipeline !== void 0) {
      rule.pipeline = this.normalizePipeline(changes.pipeline, rule.uid);
    }
    if (changes.severity !== void 0) {
      rule.severity = changes.severity;
    }
    setOptional(rule, "message", changes.message ?? rule.message);
    if (changes.enabled !== void 0) {
      rule.enabled = changes.enabled;
    }
    this.normalize();
    return this.requireValidationRule(rule.uid);
  }
  removeValidationRule(reference) {
    const rule = this.findValidationRule(reference);
    if (!rule) {
      return void 0;
    }
    this.document.validationRules = (this.document.validationRules ?? []).filter((candidate) => candidate.uid !== rule.uid);
    if ((this.document.validationRules?.length ?? 0) === 0) {
      delete this.document.validationRules;
    }
    return rule;
  }
  addRepository(draft) {
    const repository = {
      name: draft.name,
      location: draft.location,
      allowed: true
    };
    this.document.repositories = [...this.document.repositories ?? [], repository];
    return this.findRepository(draft.name);
  }
  updateRepository(reference, changes) {
    const repository = this.requireRepository(reference);
    if (changes.location !== void 0) {
      repository.location = changes.location;
    }
    return repository;
  }
  removeRepository(reference) {
    const repository = this.findRepository(reference);
    if (!repository) {
      return void 0;
    }
    this.document.repositories = (this.document.repositories ?? []).filter((candidate) => candidate.name !== repository.name);
    if ((this.document.repositories?.length ?? 0) === 0) {
      delete this.document.repositories;
    }
    return repository;
  }
  addInclude(draft) {
    const include = {
      target: draft.target,
      status: "unresolved"
    };
    this.document.includes = [...this.document.includes ?? [], include];
    return this.findInclude(draft.target);
  }
  removeInclude(reference) {
    const include = this.findInclude(reference);
    if (!include) {
      return void 0;
    }
    this.document.includes = (this.document.includes ?? []).filter((candidate) => candidate.target !== include.target);
    if ((this.document.includes?.length ?? 0) === 0) {
      delete this.document.includes;
    }
    return include;
  }
  addPluginRequirement(draft) {
    const requirement = {
      name: draft.name,
      ...draft.versionRange ? { versionRange: draft.versionRange } : {},
      resolved: false
    };
    this.document.pluginRequirements = [...this.document.pluginRequirements ?? [], requirement];
    return this.findPluginRequirement(draft.name);
  }
  updatePluginRequirement(reference, changes) {
    const requirement = this.requirePluginRequirement(reference);
    setOptional(requirement, "versionRange", changes.versionRange ?? requirement.versionRange);
    return requirement;
  }
  removePluginRequirement(reference) {
    const requirement = this.findPluginRequirement(reference);
    if (!requirement) {
      return void 0;
    }
    this.document.pluginRequirements = (this.document.pluginRequirements ?? []).filter((candidate) => candidate.name !== requirement.name);
    if ((this.document.pluginRequirements?.length ?? 0) === 0) {
      delete this.document.pluginRequirements;
    }
    return requirement;
  }
  addPackage(draft) {
    const pkg = {
      uid: draft.uid ?? `package:${sanitizeUidSegment2(draft.name)}`,
      kind: "package",
      name: draft.name,
      ...draft.description ? { description: draft.description } : {}
    };
    this.document.packages = [...this.document.packages ?? [], pkg];
    return this.requirePackage(pkg.uid);
  }
  updatePackage(reference, changes) {
    const pkg = this.requirePackage(reference);
    setOptional(pkg, "description", changes.description ?? pkg.description);
    return pkg;
  }
  removePackage(reference) {
    const pkg = this.findPackage(reference);
    if (!pkg) {
      return void 0;
    }
    this.document.packages = (this.document.packages ?? []).filter((candidate) => candidate.uid !== pkg.uid);
    if ((this.document.packages?.length ?? 0) === 0) {
      delete this.document.packages;
    }
    return pkg;
  }
  addPackageUsage(draft) {
    const usage = {
      packageRef: draft.packageRef,
      scope: "all"
    };
    this.document.packageUsages = [...this.document.packageUsages ?? [], usage];
    return this.findPackageUsage(draft.packageRef);
  }
  removePackageUsage(reference) {
    const usage = this.findPackageUsage(reference);
    if (!usage) {
      return void 0;
    }
    this.document.packageUsages = (this.document.packageUsages ?? []).filter((candidate) => candidate.packageRef !== usage.packageRef);
    if ((this.document.packageUsages?.length ?? 0) === 0) {
      delete this.document.packageUsages;
    }
    return usage;
  }
  toDocument() {
    this.normalize();
    return cloneValue2(this.document);
  }
  defaultNamespace() {
    return this.document.metadata?.defaultNamespace;
  }
  defaultRelationshipType() {
    return this.document.metadata?.defaultRelationshipType ?? "related_to";
  }
  normalize() {
    this.document = createDocument(this.document);
    if (this.document.entityTypes) {
      this.document.entityTypes = this.document.entityTypes.map((entityType) => ({
        ...entityType,
        uid: entityType.uid || `entity-type:${sanitizeUidSegment2(entityType.name)}`,
        kind: "entity-type"
      }));
    }
    if (this.document.relationshipTypes) {
      this.document.relationshipTypes = this.document.relationshipTypes.map((relationshipType) => ({
        ...relationshipType,
        uid: relationshipType.uid || `relationship-type:${sanitizeUidSegment2(relationshipType.name)}`,
        kind: "relationship-type"
      }));
    }
    if (this.document.styles) {
      this.document.styles = this.document.styles.map((style, index) => ({
        ...style,
        uid: style.uid || `style:${index}:${sanitizeUidSegment2(style.selector.raw)}`,
        kind: "style-rule",
        selector: { raw: style.selector.raw },
        style: style.style ?? { values: {} },
        origin: style.origin ?? "document",
        priority: style.priority ?? index + 1
      }));
    }
    if (this.document.validationRules) {
      this.document.validationRules = this.document.validationRules.map((rule) => ({
        ...rule,
        uid: rule.uid || `rule:${sanitizeUidSegment2(rule.name)}`,
        kind: "validation-rule",
        selector: { raw: rule.selector.raw },
        pipeline: this.normalizePipeline(rule.pipeline, rule.uid || `rule:${sanitizeUidSegment2(rule.name)}`),
        severity: rule.severity ?? "warning",
        enabled: rule.enabled !== false
      }));
    }
    if (this.document.repositories) {
      this.document.repositories = this.document.repositories.map((repository) => ({
        ...repository,
        allowed: repository.allowed !== false
      }));
    }
    if (this.document.includes) {
      this.document.includes = this.document.includes.map((include) => ({
        ...include,
        status: include.status ?? "unresolved"
      }));
    }
    if (this.document.pluginRequirements) {
      this.document.pluginRequirements = this.document.pluginRequirements.map((requirement) => ({
        ...requirement,
        resolved: requirement.resolved ?? false
      }));
    }
    if (this.document.packages) {
      this.document.packages = this.document.packages.map((pkg) => ({
        ...pkg,
        uid: pkg.uid || `package:${sanitizeUidSegment2(pkg.name)}`,
        kind: "package"
      }));
    }
    if (this.document.packageUsages) {
      this.document.packageUsages = this.document.packageUsages.map((usage) => ({
        ...usage,
        scope: usage.scope ?? "all"
      }));
    }
    if (this.document.viewpoints) {
      this.document.viewpoints = this.document.viewpoints.map((viewpoint) => ({
        ...viewpoint,
        uid: viewpoint.uid || `viewpoint:${sanitizeUidSegment2(viewpoint.name)}`,
        kind: "viewpoint",
        pipeline: this.normalizePipeline(viewpoint.pipeline, viewpoint.uid || `viewpoint:${sanitizeUidSegment2(viewpoint.name)}`),
        supportsVisualEditing: viewpoint.supportsVisualEditing
      }));
    }
    if (this.document.views) {
      this.document.views = this.document.views.map((view) => ({
        ...view,
        uid: view.uid || `view:${sanitizeUidSegment2(view.name)}`,
        kind: "view"
      }));
    }
    if (this.document.overlays) {
      this.document.overlays = this.document.overlays.map((overlay, index) => {
        const target = overlay.targetUid ? this.findEntityInternal(overlay.targetUid)?.qualifiedId ?? overlay.targetRef : overlay.targetRef;
        const relationshipAdditions = overlay.relationshipAdditions ? this.normalizeExistingOverlayRelationshipAdditions({ uid: overlay.uid || `overlay:${sanitizeUidSegment2(target)}:${index}`, targetRef: target }, overlay.relationshipAdditions) : void 0;
        return {
          ...overlay,
          uid: overlay.uid || `overlay:${sanitizeUidSegment2(target)}:${index}`,
          kind: "overlay",
          targetKind: overlay.targetKind,
          targetRef: target,
          policy: overlay.policy ?? "merge",
          ...relationshipAdditions ? { relationshipAdditions } : {}
        };
      });
    }
    this.document.entities = this.document.entities.map((entity, index) => {
      const names = this.resolveEntityNames(entity);
      return {
        ...entity,
        kind: "entity",
        uid: entity.uid || this.createEntityUid(names.qualifiedId, index + 1),
        ...names.id ? { id: names.id } : {},
        ...names.localId ? { localId: names.localId } : {},
        ...names.namespacePrefix ? { namespacePrefix: names.namespacePrefix } : {},
        ...names.qualifiedId ? { qualifiedId: names.qualifiedId } : {},
        childIds: [],
        incomingRelationshipIds: [],
        outgoingRelationshipIds: [],
        overlayIds: [],
        rank: index,
        depth: 0
      };
    });
    const entityByUid = new Map(this.document.entities.map((entity) => [entity.uid, entity]));
    const groups = /* @__PURE__ */ new Map();
    for (const entity of this.document.entities) {
      if (entity.parentId && !entityByUid.has(entity.parentId)) {
        delete entity.parentId;
      }
      const siblings = groups.get(entity.parentId);
      if (siblings) {
        siblings.push(entity);
      } else {
        groups.set(entity.parentId, [entity]);
      }
    }
    for (const root of groups.get(void 0) ?? []) {
      this.assignDepths(root, entityByUid, /* @__PURE__ */ new Set());
    }
    this.document.roots = (groups.get(void 0) ?? []).map((entity) => entity.uid);
    const explicitRelationships = this.document.relationships.filter((relationship) => relationship.relationshipKind === "explicit" || relationship.relationshipKind === void 0).map((relationship, index) => this.normalizeExplicitRelationship(relationship, entityByUid, index + 1));
    for (const relationship of explicitRelationships) {
      const source = entityByUid.get(relationship.sourceId);
      if (source) {
        source.outgoingRelationshipIds?.push(relationship.uid);
      }
      const target = relationship.targetId ? entityByUid.get(relationship.targetId) : void 0;
      if (target) {
        target.incomingRelationshipIds?.push(relationship.uid);
      }
    }
    const implicitRelationships = [];
    for (const entity of this.document.entities) {
      if (!entity.parentId) {
        continue;
      }
      const parent = entityByUid.get(entity.parentId);
      if (!parent) {
        continue;
      }
      parent.childIds?.push(entity.uid);
      const containment = this.createImplicitRelationship(parent.uid, entity.uid, "contains", "containment", false);
      parent.outgoingRelationshipIds?.push(containment.uid);
      entity.incomingRelationshipIds?.push(containment.uid);
      implicitRelationships.push(containment);
    }
    for (const siblings of groups.values()) {
      for (let index = 0; index < siblings.length - 1; index += 1) {
        const source = siblings[index];
        const target = siblings[index + 1];
        if (!source || !target) {
          continue;
        }
        const ordering = this.createImplicitRelationship(source.uid, target.uid, "followed_by", "ordering", true);
        source.outgoingRelationshipIds?.push(ordering.uid);
        target.incomingRelationshipIds?.push(ordering.uid);
        implicitRelationships.push(ordering);
      }
    }
    for (const overlay of this.document.overlays ?? []) {
      this.attachOverlay(overlay, entityByUid, explicitRelationships);
    }
    this.document.relationships = [...explicitRelationships, ...implicitRelationships];
    delete this.document.diagnostics;
  }
  normalizePipeline(pipeline, uidPrefix) {
    if (!pipeline) {
      return { steps: [] };
    }
    if ("steps" in pipeline) {
      return {
        steps: pipeline.steps.map((step, index) => ({
          ...cloneValue2(step),
          uid: step.uid || `${uidPrefix}:step:${index + 1}`
        }))
      };
    }
    return {
      steps: pipeline.map((step, index) => {
        if (typeof step === "string") {
          return {
            uid: `${uidPrefix}:step:${index + 1}`,
            operation: "plugin",
            provider: step,
            arguments: {}
          };
        }
        return {
          uid: step.uid || `${uidPrefix}:step:${index + 1}`,
          operation: step.operation ?? "plugin",
          ...step.provider ? { provider: step.provider } : {},
          arguments: cloneValue2(step.arguments ?? {})
        };
      })
    };
  }
  toAttributePatches(attributes) {
    const bag = toAttributeBag(attributes);
    if (!bag) {
      return void 0;
    }
    return Object.entries(bag.values).map(([key, value]) => ({
      key,
      value,
      operation: "set"
    }));
  }
  createOverlay(draft) {
    const target = this.resolveOverlayTarget(draft.target, draft.targetKind ?? "entity");
    const uid = draft.uid ?? `overlay:${sanitizeUidSegment2(target.targetRef)}:${this.document.overlays?.length ?? 0}`;
    const attributePatches = this.toAttributePatches(draft.attributes);
    const relationshipAdditions = draft.relationshipAdditions ? this.normalizeOverlayRelationshipAdditions({ targetRef: target.targetRef, uid }, draft.relationshipAdditions) : void 0;
    return {
      uid,
      kind: "overlay",
      targetKind: target.targetKind,
      ...target.targetUid ? { targetUid: target.targetUid } : {},
      targetRef: target.targetRef,
      ...draft.replacementLabel ? { replacementLabel: draft.replacementLabel } : {},
      ...draft.replacementTypeRef ? { replacementTypeRef: draft.replacementTypeRef } : {},
      ...attributePatches ? { attributePatches } : {},
      ...draft.description ? { descriptionPatch: { operation: "replace", text: draft.description } } : {},
      ...relationshipAdditions ? { relationshipAdditions } : {},
      policy: draft.policy ?? "merge"
    };
  }
  resolveOverlayTarget(reference, targetKind) {
    if (targetKind === "relationship") {
      const relationship = this.requireRelationship(reference);
      return {
        targetKind,
        targetUid: relationship.uid,
        targetRef: relationship.id ?? relationship.uid
      };
    }
    const entity = this.requireEntity(reference);
    return {
      targetKind,
      targetUid: entity.uid,
      targetRef: entity.qualifiedId ?? entity.id ?? entity.uid
    };
  }
  normalizeOverlayRelationshipAdditions(overlay, additions) {
    if (additions.length === 0) {
      return void 0;
    }
    return additions.map((addition, index) => {
      const targetEntity = addition.target ? this.findEntityInternal(addition.target) : void 0;
      const targetRef = addition.targetRef ?? targetEntity?.qualifiedId ?? targetEntity?.id;
      const attributes = toAttributeBag(addition.attributes);
      return {
        uid: addition.uid ?? this.createRelationshipUid(overlay.uid, addition.typeRef ?? this.defaultRelationshipType(), targetRef ?? targetEntity?.uid, index + 1),
        kind: "relationship",
        ...addition.id ? { id: addition.id } : {},
        sourceId: overlay.uid,
        sourceRef: overlay.targetRef,
        ...targetEntity ? { targetId: targetEntity.uid } : {},
        ...targetRef ? { targetRef } : {},
        typeRef: addition.typeRef ?? this.defaultRelationshipType(),
        relationshipKind: "explicit",
        implicit: false,
        virtual: false,
        sourceSyntax: addition.sourceSyntax ?? "relationship-block",
        ...attributes ? { attributes } : {}
      };
    });
  }
  normalizeExistingOverlayRelationshipAdditions(overlay, additions) {
    if (additions.length === 0) {
      return void 0;
    }
    return additions.map((addition, index) => ({
      ...cloneValue2(addition),
      uid: addition.uid || this.createRelationshipUid(overlay.uid, addition.typeRef, addition.targetRef ?? addition.targetId, index + 1),
      kind: "relationship",
      sourceId: overlay.uid,
      sourceRef: overlay.targetRef,
      relationshipKind: "explicit",
      implicit: false,
      virtual: false,
      sourceSyntax: addition.sourceSyntax ?? "relationship-block"
    }));
  }
  assignDepths(entity, entityByUid, visiting) {
    if (visiting.has(entity.uid)) {
      throw new Error(`Cycle detected in entity hierarchy at '${entity.uid}'.`);
    }
    visiting.add(entity.uid);
    entity.depth = entity.parentId ? (entityByUid.get(entity.parentId)?.depth ?? 0) + 1 : 0;
    for (const child of this.document.entities.filter((candidate) => candidate.parentId === entity.uid)) {
      this.assignDepths(child, entityByUid, visiting);
    }
    visiting.delete(entity.uid);
  }
  attachOverlay(overlay, entityByUid, explicitRelationships) {
    if (overlay.targetKind === "entity") {
      const target2 = overlay.targetUid ? entityByUid.get(overlay.targetUid) : this.findEntityInternal(overlay.targetRef);
      target2?.overlayIds?.push(overlay.uid);
      return;
    }
    const target = overlay.targetUid ? explicitRelationships.find((relationship) => relationship.uid === overlay.targetUid) : explicitRelationships.find((relationship) => relationship.id === overlay.targetRef || relationship.uid === overlay.targetRef);
    target?.overlayIds?.push(overlay.uid);
  }
  normalizeExplicitRelationship(relationship, entityByUid, sequence) {
    const source = entityByUid.get(relationship.sourceId) ?? (relationship.sourceRef ? this.findEntityInternal(relationship.sourceRef) : void 0);
    const target = relationship.targetId ? entityByUid.get(relationship.targetId) : relationship.targetRef ? this.findEntityInternal(relationship.targetRef) : void 0;
    const typeRef = relationship.typeRef || this.defaultRelationshipType();
    const targetRef = target?.qualifiedId ?? target?.id ?? relationship.targetRef;
    if (!source) {
      throw new Error(`Relationship '${relationship.uid}' references unknown source '${relationship.sourceId}'.`);
    }
    return {
      ...relationship,
      uid: relationship.uid || this.createRelationshipUid(source.uid, typeRef, targetRef ?? relationship.targetId, sequence),
      kind: "relationship",
      sourceId: source.uid,
      ...source.qualifiedId ? { sourceRef: source.qualifiedId } : {},
      ...target ? { targetId: target.uid } : {},
      ...targetRef ? { targetRef } : {},
      typeRef,
      relationshipKind: "explicit"
    };
  }
  createImplicitRelationship(sourceId, targetId, typeRef, relationshipKind, virtual) {
    return {
      uid: `relationship:${relationshipKind}:${sanitizeUidSegment2(sourceId)}:${sanitizeUidSegment2(targetId)}`,
      kind: "relationship",
      sourceId,
      targetId,
      typeRef,
      relationshipKind,
      implicit: true,
      virtual,
      sourceSyntax: "generated"
    };
  }
  createEntityUid(qualifiedId, sequence = this.document.entities.length + 1) {
    return qualifiedId ? `entity:${sanitizeUidSegment2(qualifiedId)}` : `entity:anonymous:${sequence}`;
  }
  createRelationshipUid(sourceId, typeRef, target, sequence = this.document.relationships.length + 1) {
    return `relationship:${sanitizeUidSegment2(sourceId)}:${sanitizeUidSegment2(typeRef)}:${sanitizeUidSegment2(target ?? String(sequence))}:${sequence}`;
  }
  resolveEntityNames(input) {
    if (input.qualifiedId) {
      const parts = splitQualifiedName3(input.qualifiedId);
      return {
        id: parts.localId,
        localId: parts.localId,
        ...parts.namespacePrefix ? { namespacePrefix: parts.namespacePrefix } : {},
        qualifiedId: input.qualifiedId
      };
    }
    const localId = input.localId ?? input.id;
    const namespacePrefix = input.namespacePrefix ?? this.defaultNamespace();
    const qualifiedId = qualifyId(localId, namespacePrefix);
    return {
      ...localId ? { id: localId, localId } : {},
      ...namespacePrefix ? { namespacePrefix } : {},
      ...qualifiedId ? { qualifiedId } : {}
    };
  }
  requireEntity(reference) {
    const entity = this.findEntityInternal(reference);
    if (!entity) {
      throw new Error(`Entity '${reference}' was not found.`);
    }
    return entity;
  }
  requireViewpoint(reference) {
    const viewpoint = this.findViewpoint(reference);
    if (!viewpoint) {
      throw new Error(`Viewpoint '${reference}' was not found.`);
    }
    return viewpoint;
  }
  requireView(reference) {
    const view = this.findView(reference);
    if (!view) {
      throw new Error(`View '${reference}' was not found.`);
    }
    return view;
  }
  requireOverlay(reference) {
    const overlay = this.findOverlay(reference);
    if (!overlay) {
      throw new Error(`Overlay '${reference}' was not found.`);
    }
    return overlay;
  }
  requireEntityType(reference) {
    const entityType = this.findEntityType(reference);
    if (!entityType) {
      throw new Error(`Entity type '${reference}' was not found.`);
    }
    return entityType;
  }
  requireRelationshipType(reference) {
    const relationshipType = this.findRelationshipType(reference);
    if (!relationshipType) {
      throw new Error(`Relationship type '${reference}' was not found.`);
    }
    return relationshipType;
  }
  requireStyleRule(reference) {
    const styleRule = this.findStyleRule(reference);
    if (!styleRule) {
      throw new Error(`Style rule '${reference}' was not found.`);
    }
    return styleRule;
  }
  requireValidationRule(reference) {
    const rule = this.findValidationRule(reference);
    if (!rule) {
      throw new Error(`Validation rule '${reference}' was not found.`);
    }
    return rule;
  }
  requireRepository(reference) {
    const repository = this.findRepository(reference);
    if (!repository) {
      throw new Error(`Repository '${reference}' was not found.`);
    }
    return repository;
  }
  requirePluginRequirement(reference) {
    const requirement = this.findPluginRequirement(reference);
    if (!requirement) {
      throw new Error(`Plugin requirement '${reference}' was not found.`);
    }
    return requirement;
  }
  requirePackage(reference) {
    const pkg = this.findPackage(reference);
    if (!pkg) {
      throw new Error(`Package '${reference}' was not found.`);
    }
    return pkg;
  }
  findEntityInternal(reference) {
    return this.document.entities.find(
      (entity) => entity.uid === reference || entity.qualifiedId === reference || entity.id === reference
    );
  }
  requireRelationship(reference) {
    const relationship = this.document.relationships.find(
      (candidate) => candidate.uid === reference || candidate.id === reference
    );
    if (!relationship) {
      throw new Error(`Relationship '${reference}' was not found.`);
    }
    return relationship;
  }
  isDescendant(reference, ancestorUid) {
    let current = this.findEntityInternal(reference);
    while (current?.parentId) {
      if (current.parentId === ancestorUid) {
        return true;
      }
      current = this.findEntityInternal(current.parentId);
    }
    return false;
  }
};

// src/serialize.ts
import { stringify as stringifyYaml } from "yaml";
function pushDiagnostic2(diagnostics, severity, message, range, entityUid, relationshipUid) {
  diagnostics.push({
    uid: `diagnostic:serializer:${diagnostics.length + 1}`,
    source: "itm.serializer",
    severity,
    message,
    ...range ? { range } : {},
    ...entityUid ? { entityUid } : {},
    ...relationshipUid ? { relationshipUid } : {}
  });
}
function sortBySource(items) {
  return [...items].sort((left, right) => {
    const leftOrder = left.sourceRange?.startLine ?? left.source?.startLine ?? left.rank ?? left.priority ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.sourceRange?.startLine ?? right.source?.startLine ?? right.rank ?? right.priority ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
}
function toYamlValue(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => toYamlValue(entry));
  }
  if (value && typeof value === "object") {
    const result = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = toYamlValue(entry);
    }
    return result;
  }
  return value;
}
function indentLines(text, indentLevel) {
  const prefix = " ".repeat(indentLevel);
  return text.split("\n").map((line) => line.length > 0 ? `${prefix}${line}` : line).join("\n");
}
function formatBlock(value, indentLevel = 0) {
  const yaml = stringifyYaml(value, {
    indent: 2,
    lineWidth: 0,
    minContentWidth: 0
  }).trimEnd();
  if (!yaml) {
    return indentLines("{\n}", indentLevel);
  }
  return indentLines(`{
${indentLines(yaml, 2)}
}`, indentLevel);
}
function attributeValuesWithoutKeys(attributes, excludedKeys) {
  const values = attributes?.values;
  if (!values) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(values).filter(([key]) => !excludedKeys.includes(key)).map(([key, value]) => [key, toYamlValue(value)])
  );
}
function metadataToRecord(metadata) {
  const base = metadata.values ? Object.fromEntries(Object.entries(metadata.values).map(([key, value]) => [key, toYamlValue(value)])) : {};
  for (const [key, value] of Object.entries({
    title: metadata.title,
    version: metadata.version,
    description: metadata.description,
    author: metadata.author,
    owner: metadata.owner,
    defaultNamespace: metadata.defaultNamespace,
    defaultRelationshipType: metadata.defaultRelationshipType,
    defaultLanguageOrProfile: metadata.defaultLanguageOrProfile,
    created: metadata.created,
    updated: metadata.updated,
    intendedRenderingMode: metadata.intendedRenderingMode,
    intendedRenderingModes: metadata.intendedRenderingModes,
    validationMode: metadata.validationMode
  })) {
    if (value !== void 0) {
      base[key] = value;
    }
  }
  return base;
}
function buildEntityIndexes(document) {
  const entitiesByUid = /* @__PURE__ */ new Map();
  const entitiesByRef = /* @__PURE__ */ new Map();
  for (const entity of document.entities) {
    entitiesByUid.set(entity.uid, entity);
    if (entity.qualifiedId) {
      entitiesByRef.set(entity.qualifiedId, entity);
    }
    if (entity.id) {
      entitiesByRef.set(entity.id, entity);
    }
  }
  return { entitiesByUid, entitiesByRef };
}
function formatReference(entity) {
  return entity?.qualifiedId ?? entity?.id;
}
function formatRelationshipReference(relationship, entitiesByUid, diagnostics) {
  const targetRef = relationship.targetRef ?? (relationship.targetId ? formatReference(entitiesByUid.get(relationship.targetId)) : void 0);
  if (!targetRef) {
    pushDiagnostic2(
      diagnostics,
      "error",
      `Relationship '${relationship.uid}' does not have a serializable target reference.`,
      relationship.sourceRange,
      void 0,
      relationship.uid
    );
    return void 0;
  }
  if (relationship.typeRef === "related_to") {
    return `@${targetRef}`;
  }
  return `@${relationship.typeRef}:${targetRef}`;
}
function formatDescriptionLines(text, indentLevel) {
  return text.split("\n").map((line) => `${" ".repeat(indentLevel)}|${line.length > 0 ? ` ${line}` : ""}`);
}
function formatAttributeBag(attributes, indentLevel) {
  if (!attributes) {
    return [];
  }
  return [formatBlock(toYamlValue(attributes.values), indentLevel)];
}
function attributesFromPatches(attributePatches, diagnostics, range) {
  if (!attributePatches || attributePatches.length === 0) {
    return void 0;
  }
  const values = {};
  for (const patch of attributePatches) {
    if (patch.operation !== "set") {
      pushDiagnostic2(diagnostics, "error", `Overlay patch operation '${patch.operation}' is not serializable to ITM text.`, range);
      continue;
    }
    if (patch.value === void 0) {
      pushDiagnostic2(diagnostics, "error", `Overlay patch '${patch.key}' is missing a value.`, range);
      continue;
    }
    values[patch.key] = patch.value;
  }
  return Object.keys(values).length > 0 ? { values } : void 0;
}
function pipelineToYaml(pipeline) {
  return pipeline.steps.map((step) => {
    if (step.operation === "plugin") {
      if (step.provider && Object.keys(step.arguments).length === 0) {
        return step.provider;
      }
      return {
        [step.provider ?? "plugin"]: toYamlValue(step.arguments)
      };
    }
    const keys = Object.keys(step.arguments);
    if (keys.length === 0) {
      return {
        [step.operation]: true
      };
    }
    if (keys.length === 1 && keys[0] === "value") {
      const stepValue = step.arguments.value;
      return {
        [step.operation]: stepValue === void 0 ? true : toYamlValue(stepValue)
      };
    }
    return {
      [step.operation]: toYamlValue(step.arguments)
    };
  });
}
function parametersToYaml(parameters) {
  if (!parameters || parameters.length === 0) {
    return void 0;
  }
  const result = {};
  for (const parameter of parameters) {
    result[parameter.name] = {
      type: parameter.type,
      ...parameter.defaultValue !== void 0 ? { default: toYamlValue(parameter.defaultValue) } : {},
      ...parameter.required !== void 0 ? { required: parameter.required } : {},
      ...parameter.description ? { description: parameter.description } : {},
      ...parameter.values ? { values: parameter.values.map((value) => toYamlValue(value)) } : {}
    };
  }
  return result;
}
function generatedAssetsToYaml(generatedAssets) {
  if (!generatedAssets || generatedAssets.length === 0) {
    return void 0;
  }
  return generatedAssets.map((asset) => ({
    kind: asset.kind,
    ...asset.path ? { path: asset.path } : {},
    ...asset.uri ? { uri: asset.uri } : {},
    ...asset.hash ? { hash: asset.hash } : {},
    ...asset.contentHash ? { contentHash: asset.contentHash } : {}
  }));
}
function viewDeltasToYaml(deltas, diagnostics, view) {
  if (!deltas || deltas.length === 0) {
    return void 0;
  }
  const hidden = [];
  const collapsed = [];
  const expanded = [];
  const moved = [];
  const pinned = [];
  const styleOverrides = [];
  const labelOverrides = [];
  for (const delta of deltas) {
    if (delta.kind === "hidden") {
      hidden.push({
        ...delta.targetKind === "entity" ? { node: delta.targetRef ?? delta.targetUid } : { relationship: delta.targetRef ?? delta.targetUid }
      });
    } else if (delta.kind === "expanded-collapsed") {
      (delta.expanded ? expanded : collapsed).push({
        node: delta.targetRef ?? delta.targetUid
      });
    } else if (delta.kind === "moved") {
      moved.push({
        ...delta.targetKind === "entity" ? { node: delta.targetRef ?? delta.targetUid } : { relationship: delta.targetRef ?? delta.targetUid },
        ...delta.dx !== void 0 ? { dx: delta.dx } : {},
        ...delta.dy !== void 0 ? { dy: delta.dy } : {},
        ...delta.x !== void 0 ? { x: delta.x } : {},
        ...delta.y !== void 0 ? { y: delta.y } : {}
      });
    } else if (delta.kind === "pinned") {
      pinned.push({
        ...delta.targetKind === "entity" ? { node: delta.targetRef ?? delta.targetUid } : { relationship: delta.targetRef ?? delta.targetUid },
        x: delta.x,
        y: delta.y
      });
    } else if (delta.kind === "style-override") {
      styleOverrides.push({
        selector: delta.selector.raw,
        style: toYamlValue(delta.style.values)
      });
    } else if (delta.kind === "label-override") {
      labelOverrides.push({
        ...delta.targetKind === "entity" ? { node: delta.targetRef ?? delta.targetUid } : { relationship: delta.targetRef ?? delta.targetUid },
        label: delta.label
      });
    } else {
      pushDiagnostic2(diagnostics, "error", `Unsupported view delta in view '${view.name}'.`, view.sourceRange);
    }
  }
  const pruned = Object.fromEntries(
    Object.entries({ hidden, collapsed, expanded, moved, pinned, styleOverrides, labelOverrides }).filter(([, entries]) => entries.length > 0)
  );
  return Object.keys(pruned).length > 0 ? pruned : void 0;
}
function validateDocumentForSerialization(document, diagnostics) {
  const seenQualifiedIds = /* @__PURE__ */ new Set();
  const { entitiesByUid } = buildEntityIndexes(document);
  for (const entity of document.entities) {
    if (entity.qualifiedId) {
      if (seenQualifiedIds.has(entity.qualifiedId)) {
        pushDiagnostic2(diagnostics, "error", `Duplicate entity id '${entity.qualifiedId}'.`, entity.sourceRange, entity.uid);
      }
      seenQualifiedIds.add(entity.qualifiedId);
    }
    if (entity.parentId && !entitiesByUid.has(entity.parentId)) {
      pushDiagnostic2(diagnostics, "error", `Entity '${entity.uid}' references missing parent '${entity.parentId}'.`, entity.sourceRange, entity.uid);
    }
  }
  for (const relationship of document.relationships) {
    if (relationship.relationshipKind !== "explicit") {
      continue;
    }
    if (!entitiesByUid.has(relationship.sourceId)) {
      pushDiagnostic2(diagnostics, "error", `Relationship '${relationship.uid}' references missing source '${relationship.sourceId}'.`, relationship.sourceRange, void 0, relationship.uid);
    }
    if (!relationship.targetRef && !relationship.targetId) {
      pushDiagnostic2(diagnostics, "error", `Relationship '${relationship.uid}' is missing a target.`, relationship.sourceRange, void 0, relationship.uid);
    }
    if (relationship.targetId && !entitiesByUid.has(relationship.targetId)) {
      pushDiagnostic2(diagnostics, "error", `Relationship '${relationship.uid}' references missing target '${relationship.targetId}'.`, relationship.sourceRange, void 0, relationship.uid);
    }
  }
  for (const overlay of document.overlays ?? []) {
    if (overlay.policy !== "merge") {
      pushDiagnostic2(diagnostics, "error", `Overlay '${overlay.uid}' uses unsupported serialization policy '${overlay.policy}'.`, overlay.sourceRange);
    }
    if (overlay.descriptionPatch && overlay.descriptionPatch.operation !== "replace") {
      pushDiagnostic2(diagnostics, "error", `Overlay '${overlay.uid}' uses unsupported description patch operation '${overlay.descriptionPatch.operation}'.`, overlay.sourceRange);
    }
  }
  for (const view of document.views ?? []) {
    if (!view.viewpointRef) {
      pushDiagnostic2(diagnostics, "error", `View '${view.name}' is missing a viewpoint reference.`, view.sourceRange);
    }
  }
}
function serializeRelationshipBlocks(relationships, indentLevel, entitiesByUid, diagnostics) {
  const lines = [];
  for (const relationship of relationships) {
    const token = formatRelationshipReference(relationship, entitiesByUid, diagnostics);
    if (!token) {
      continue;
    }
    lines.push(`${" ".repeat(indentLevel)}${token}`);
    lines.push(...formatAttributeBag(relationship.attributes, indentLevel));
  }
  return lines;
}
function serializeEntities(document, diagnostics) {
  const { entitiesByUid } = buildEntityIndexes(document);
  const childrenByParent = /* @__PURE__ */ new Map();
  const explicitRelationshipsBySource = /* @__PURE__ */ new Map();
  for (const entity of document.entities) {
    const bucket = childrenByParent.get(entity.parentId);
    if (bucket) {
      bucket.push(entity);
    } else {
      childrenByParent.set(entity.parentId, [entity]);
    }
  }
  for (const relationship of document.relationships.filter((entry) => entry.relationshipKind === "explicit")) {
    const bucket = explicitRelationshipsBySource.get(relationship.sourceId);
    if (bucket) {
      bucket.push(relationship);
    } else {
      explicitRelationshipsBySource.set(relationship.sourceId, [relationship]);
    }
  }
  for (const bucket of childrenByParent.values()) {
    bucket.sort((left, right) => (left.rank ?? 0) - (right.rank ?? 0));
  }
  for (const bucket of explicitRelationshipsBySource.values()) {
    bucket.sort((left, right) => (left.sourceRange?.startLine ?? 0) - (right.sourceRange?.startLine ?? 0));
  }
  const emitted = /* @__PURE__ */ new Set();
  const lines = [];
  const visit = (entity, indentLevel, stack) => {
    if (stack.has(entity.uid)) {
      pushDiagnostic2(diagnostics, "error", `Cycle detected while serializing hierarchy at entity '${entity.uid}'.`, entity.sourceRange, entity.uid);
      return;
    }
    emitted.add(entity.uid);
    stack.add(entity.uid);
    const relationships = explicitRelationshipsBySource.get(entity.uid) ?? [];
    const inlineRelationships = relationships.filter(
      (relationship) => !relationship.attributes && relationship.sourceSyntax !== "relationship-block"
    );
    const blockRelationships = relationships.filter(
      (relationship) => relationship.attributes || relationship.sourceSyntax === "relationship-block"
    );
    const inlineRelationshipTokens = inlineRelationships.map((relationship) => formatRelationshipReference(relationship, entitiesByUid, diagnostics)).filter((value) => Boolean(value));
    const lineParts = [];
    const entityRef = formatReference(entity);
    if (entityRef) {
      lineParts.push(`&${entityRef}`);
    }
    if (entity.typeRef) {
      lineParts.push(`[${entity.typeRef}]`);
    }
    lineParts.push(entity.label);
    for (const tag of entity.tags ?? []) {
      lineParts.push(`#${tag}`);
    }
    lineParts.push(...inlineRelationshipTokens);
    lines.push(`${" ".repeat(indentLevel)}${lineParts.join(" ")}`);
    if (entity.description) {
      lines.push(...formatDescriptionLines(entity.description.text, indentLevel));
    }
    lines.push(...formatAttributeBag(entity.attributes, indentLevel));
    lines.push(...serializeRelationshipBlocks(blockRelationships, indentLevel, entitiesByUid, diagnostics));
    for (const child of childrenByParent.get(entity.uid) ?? []) {
      visit(child, indentLevel + 2, stack);
    }
    stack.delete(entity.uid);
  };
  for (const root of childrenByParent.get(void 0) ?? []) {
    visit(root, 0, /* @__PURE__ */ new Set());
  }
  for (const entity of document.entities) {
    if (!emitted.has(entity.uid)) {
      visit(entity, 0, /* @__PURE__ */ new Set());
    }
  }
  return lines;
}
function serializeOverlays(document, diagnostics) {
  const { entitiesByUid } = buildEntityIndexes(document);
  const lines = [];
  for (const overlay of sortBySource(document.overlays ?? [])) {
    const lineParts = [`&${overlay.targetRef}`, "!overlay"];
    if (overlay.replacementTypeRef) {
      lineParts.push(`[${overlay.replacementTypeRef}]`);
    }
    if (overlay.replacementLabel) {
      lineParts.push(overlay.replacementLabel);
    }
    lines.push(lineParts.join(" "));
    if (overlay.descriptionPatch?.text) {
      lines.push(...formatDescriptionLines(overlay.descriptionPatch.text, 0));
    }
    lines.push(...formatAttributeBag(attributesFromPatches(overlay.attributePatches, diagnostics, overlay.sourceRange), 0));
    if (overlay.relationshipAdditions && overlay.relationshipAdditions.length > 0) {
      lines.push(...serializeRelationshipBlocks(overlay.relationshipAdditions, 0, entitiesByUid, diagnostics));
    }
  }
  return lines;
}
function serializeDocumentResult(document, options = {}) {
  const diagnostics = [];
  validateDocumentForSerialization(document, diagnostics);
  const sections = [];
  if (document.metadata) {
    sections.push(`%metadata
${formatBlock(metadataToRecord(document.metadata))}`);
  }
  for (const namespace of sortBySource(document.namespaces ?? [])) {
    sections.push(`%namespace ${namespace.prefix} ${namespace.uri}`);
  }
  for (const repository of sortBySource(document.repositories ?? [])) {
    sections.push(`%repository ${repository.name} ${repository.location}`);
  }
  for (const include of sortBySource(document.includes ?? [])) {
    sections.push(`%include ${include.target}`);
  }
  for (const requirement of sortBySource(document.pluginRequirements ?? [])) {
    sections.push(`%require ${requirement.name}${requirement.versionRange ? ` ${requirement.versionRange}` : ""}`);
  }
  for (const entityType of sortBySource(document.entityTypes ?? [])) {
    const body = {
      ...attributeValuesWithoutKeys(entityType.attributes, ["description", "requiredAttributes", "optionalAttributes", "extends", "superTypeRefs"]),
      ...entityType.description ? { description: entityType.description } : {},
      ...entityType.requiredAttributes ? { requiredAttributes: entityType.requiredAttributes } : {},
      ...entityType.optionalAttributes ? { optionalAttributes: entityType.optionalAttributes } : {},
      ...entityType.superTypeRefs ? { extends: entityType.superTypeRefs } : {}
    };
    sections.push(`%entitytype ${entityType.name}${Object.keys(body).length > 0 ? `
${formatBlock(body)}` : ""}`);
  }
  for (const relationshipType of sortBySource(document.relationshipTypes ?? [])) {
    const body = {
      ...attributeValuesWithoutKeys(relationshipType.attributes, ["description", "extends", "superTypeRefs", "sourceTypes", "targetTypes", "inverseType", "requiredAttributes", "optionalAttributes"]),
      ...relationshipType.description ? { description: relationshipType.description } : {},
      ...relationshipType.superTypeRefs ? { extends: relationshipType.superTypeRefs } : {},
      ...relationshipType.sourceTypeRefs ? { sourceTypes: relationshipType.sourceTypeRefs } : {},
      ...relationshipType.targetTypeRefs ? { targetTypes: relationshipType.targetTypeRefs } : {},
      ...relationshipType.inverseTypeRef ? { inverseType: relationshipType.inverseTypeRef } : {},
      ...relationshipType.requiredAttributes ? { requiredAttributes: relationshipType.requiredAttributes } : {},
      ...relationshipType.optionalAttributes ? { optionalAttributes: relationshipType.optionalAttributes } : {}
    };
    sections.push(`%relationshiptype ${relationshipType.name}${Object.keys(body).length > 0 ? `
${formatBlock(body)}` : ""}`);
  }
  for (const style of sortBySource(document.styles ?? [])) {
    sections.push(`%style ${style.selector.raw}
${formatBlock(toYamlValue(style.style.values))}`);
  }
  for (const rule of sortBySource(document.validationRules ?? [])) {
    sections.push(
      `%rule ${rule.name}
${formatBlock({
        select: rule.selector.raw,
        pipeline: pipelineToYaml(rule.pipeline),
        severity: rule.severity,
        ...rule.message ? { message: rule.message } : {},
        ...rule.enabled === false ? { enabled: false } : {}
      })}`
    );
  }
  for (const viewpoint of sortBySource(document.viewpoints ?? [])) {
    const parameters = parametersToYaml(viewpoint.parameters);
    sections.push(
      `%viewpoint ${viewpoint.name}
${formatBlock({
        ...viewpoint.title ? { title: viewpoint.title } : {},
        ...viewpoint.description ? { description: viewpoint.description } : {},
        ...parameters ? { parameters } : {},
        pipeline: pipelineToYaml(viewpoint.pipeline),
        ...viewpoint.supportsVisualEditing ? { supportsVisualEditing: true } : {}
      })}`
    );
  }
  for (const view of sortBySource(document.views ?? [])) {
    const deltas = viewDeltasToYaml(view.deltas, diagnostics, view);
    const generatedAssets = generatedAssetsToYaml(view.generatedAssets);
    sections.push(
      `%view ${view.name}
${formatBlock({
        ...view.title ? { title: view.title } : {},
        viewpoint: view.viewpointRef,
        ...view.parameters ? { parameters: toYamlValue(view.parameters) } : {},
        ...deltas ? { deltas } : {},
        ...view.notes ? { notes: view.notes } : {},
        ...generatedAssets ? { generatedAssets } : {}
      })}`
    );
  }
  for (const pkg of sortBySource(document.packages ?? [])) {
    const body = {
      ...pkg.description ? { description: pkg.description } : {},
      ...pkg.version ? { version: pkg.version } : {}
    };
    sections.push(`%package ${pkg.name}${Object.keys(body).length > 0 ? `
${formatBlock(body)}` : ""}`);
  }
  for (const usage of sortBySource(document.packageUsages ?? [])) {
    sections.push(`%using ${usage.packageRef}`);
  }
  for (const directive of sortBySource((document.directives ?? []).filter((entry) => !entry.known || !entry.handled))) {
    sections.push(directive.rawText);
  }
  const entityLines = serializeEntities(document, diagnostics);
  if (entityLines.length > 0) {
    sections.push(entityLines.join("\n"));
  }
  const overlayLines = serializeOverlays(document, diagnostics);
  if (overlayLines.length > 0) {
    sections.push(overlayLines.join("\n"));
  }
  const lineEnding = options.lineEnding === "crlf" ? "\r\n" : "\n";
  const text = sections.filter((section) => section.trim().length > 0).join(`${lineEnding}${lineEnding}`);
  return {
    value: text,
    diagnostics
  };
}
function serializeDocument(document, options = {}) {
  const result = serializeDocumentResult(document, options);
  throwOnErrorDiagnostics(result.diagnostics, "ITM serialization failed due to error diagnostics.", result.value);
  return result.value;
}
function serializeItm(document, options = {}) {
  return serializeDocument(document, options);
}

// src/extensions.ts
function asResolvedDocument(document) {
  return isResolvedDocument(document) ? document : resolveDocument(document);
}
function localName(name) {
  const parts = name.split("::");
  return parts[parts.length - 1] ?? name;
}
function relationshipIdentitySegment(value) {
  const normalized = (value ?? "unknown").trim().replace(/[^A-Za-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "").toLowerCase();
  return normalized.length > 0 ? normalized : "unknown";
}
function collectAncestors(name, parentsByName, trail = /* @__PURE__ */ new Set()) {
  const directParents = parentsByName.get(name) ?? [];
  const collected = /* @__PURE__ */ new Set();
  for (const parent of directParents) {
    if (trail.has(parent)) {
      continue;
    }
    collected.add(parent);
    const nextTrail = new Set(trail);
    nextTrail.add(name);
    for (const ancestor of collectAncestors(parent, parentsByName, nextTrail)) {
      collected.add(ancestor);
    }
  }
  return [...collected];
}
function invertGraph(parentsByName) {
  const descendantsByName = /* @__PURE__ */ new Map();
  for (const [name, parents] of parentsByName.entries()) {
    if (!descendantsByName.has(name)) {
      descendantsByName.set(name, []);
    }
    for (const parent of parents) {
      const descendants = descendantsByName.get(parent) ?? [];
      descendants.push(name);
      descendantsByName.set(parent, descendants);
    }
  }
  return descendantsByName;
}
function collectDescendants(name, childrenByName, trail = /* @__PURE__ */ new Set()) {
  const directChildren = childrenByName.get(name) ?? [];
  const collected = /* @__PURE__ */ new Set();
  for (const child of directChildren) {
    if (trail.has(child)) {
      continue;
    }
    collected.add(child);
    const nextTrail = new Set(trail);
    nextTrail.add(name);
    for (const descendant of collectDescendants(child, childrenByName, nextTrail)) {
      collected.add(descendant);
    }
  }
  return [...collected];
}
function buildHierarchyMaps(typeNames, parentsByName) {
  const childrenByName = invertGraph(parentsByName);
  const ancestorsByName = /* @__PURE__ */ new Map();
  const descendantsByName = /* @__PURE__ */ new Map();
  for (const name of typeNames) {
    ancestorsByName.set(name, collectAncestors(name, parentsByName));
    descendantsByName.set(name, collectDescendants(name, childrenByName));
  }
  return { ancestorsByName, descendantsByName };
}
function entityReferenceId(entity) {
  return entity.id ?? entity.qualifiedId ?? entity.uid;
}
function targetRelationshipByReference(document, reference) {
  if (!reference) {
    return void 0;
  }
  return document.relationships.find(
    (relationship) => relationship.uid === reference || relationship.id === reference || getStableRelationshipId(relationship) === reference
  );
}
function createTypeHierarchy(document) {
  const resolved = asResolvedDocument(document);
  const entityTypes = resolved.entityTypes ?? [];
  const relationshipTypes = resolved.relationshipTypes ?? [];
  const entityParentsByName = new Map(entityTypes.map((type) => [type.name, type.superTypes.map((superType) => superType.name)]));
  const relationshipParentsByName = new Map(
    relationshipTypes.map((type) => [type.name, type.superTypes.map((superType) => superType.name)])
  );
  const entityMaps = buildHierarchyMaps(entityTypes.map((type) => type.name), entityParentsByName);
  const relationshipMaps = buildHierarchyMaps(relationshipTypes.map((type) => type.name), relationshipParentsByName);
  return {
    entityAncestorsByName: entityMaps.ancestorsByName,
    entityDescendantsByName: entityMaps.descendantsByName,
    relationshipAncestorsByName: relationshipMaps.ancestorsByName,
    relationshipDescendantsByName: relationshipMaps.descendantsByName
  };
}
function expandEntityTypeSelection(document, typeRefs, includeSubtypes = true) {
  const hierarchy = createTypeHierarchy(document);
  const expanded = /* @__PURE__ */ new Set();
  for (const typeRef of typeRefs) {
    expanded.add(typeRef);
    if (!includeSubtypes) {
      continue;
    }
    for (const descendant of hierarchy.entityDescendantsByName.get(typeRef) ?? []) {
      expanded.add(descendant);
    }
  }
  return [...expanded];
}
function expandRelationshipTypeSelection(document, typeRefs, includeSubtypes = true) {
  const hierarchy = createTypeHierarchy(document);
  const expanded = /* @__PURE__ */ new Set();
  for (const typeRef of typeRefs) {
    expanded.add(typeRef);
    if (!includeSubtypes) {
      continue;
    }
    for (const descendant of hierarchy.relationshipDescendantsByName.get(typeRef) ?? []) {
      expanded.add(descendant);
    }
  }
  return [...expanded];
}
function isEntityOfType(document, entity, typeRef, includeSubtypes = true) {
  if (!entity.typeRef) {
    return false;
  }
  if (entity.typeRef === typeRef) {
    return true;
  }
  if (!includeSubtypes) {
    return false;
  }
  const hierarchy = createTypeHierarchy(document);
  return (hierarchy.entityAncestorsByName.get(entity.typeRef) ?? []).includes(typeRef);
}
function isRelationshipOfType(document, relationship, typeRef, includeSubtypes = true) {
  if (relationship.typeRef === typeRef) {
    return true;
  }
  if (!includeSubtypes) {
    return false;
  }
  const hierarchy = createTypeHierarchy(document);
  return (hierarchy.relationshipAncestorsByName.get(relationship.typeRef) ?? []).includes(typeRef);
}
function getStableRelationshipId(relationship, sequence) {
  if (relationship.id) {
    return relationship.id;
  }
  const source = relationship.sourceRef ?? relationship.sourceId;
  const target = relationship.targetRef ?? relationship.targetId ?? (sequence !== void 0 ? `sequence_${sequence}` : "unresolved");
  return [
    "rel",
    relationshipIdentitySegment(source),
    relationshipIdentitySegment(localName(relationship.typeRef)),
    relationshipIdentitySegment(target)
  ].join("_");
}
function createCanonicalGraph(document, options = {}) {
  const resolved = asResolvedDocument(document);
  const includeImplicitRelationships = options.includeImplicitRelationships ?? false;
  const nodes = resolved.entities.map((entity) => ({
    id: entityReferenceId(entity),
    uid: entity.uid,
    ...entity.qualifiedId ? { qualifiedId: entity.qualifiedId } : {},
    label: entity.label,
    ...entity.typeRef ? { typeRef: entity.typeRef } : {},
    ...entity.description?.text ? { description: entity.description.text } : {},
    ...entity.parent ? { parentId: entityReferenceId(entity.parent) } : {},
    properties: { ...entity.attributes?.values ?? {} }
  }));
  const edges = resolved.relationships.filter((relationship) => includeImplicitRelationships || !relationship.implicit).map((relationship, index) => {
    const targetRelationship = targetRelationshipByReference(resolved, relationship.targetRef);
    return {
      id: getStableRelationshipId(relationship, index + 1),
      uid: relationship.uid,
      ...relationship.id ? { relationshipId: relationship.id } : {},
      sourceId: entityReferenceId(relationship.source),
      ...relationship.target ? { targetId: entityReferenceId(relationship.target) } : {},
      ...targetRelationship ? { targetRelationshipId: getStableRelationshipId(targetRelationship) } : {},
      ...relationship.targetRef ? { targetRef: relationship.targetRef } : {},
      typeRef: relationship.typeRef,
      relationshipKind: relationship.relationshipKind,
      implicit: relationship.implicit === true,
      properties: { ...relationship.attributes?.values ?? {} }
    };
  });
  const buildOrganization = (entity) => ({
    id: entityReferenceId(entity),
    label: entity.label,
    children: entity.children.map((child) => buildOrganization(child))
  });
  const organizations = resolved.entities.filter((entity) => !entity.parent).map((entity) => buildOrganization(entity));
  const viewpointsByName = new Map((resolved.viewpoints ?? []).map((viewpoint) => [viewpoint.name, viewpoint]));
  const views = (resolved.views ?? []).map((view) => ({
    id: view.uid,
    name: view.name,
    ...view.title ? { title: view.title } : {},
    viewpointRef: view.viewpointRef,
    ...viewpointsByName.get(view.viewpointRef) ? { viewpoint: viewpointsByName.get(view.viewpointRef) } : {},
    ...view.parameters ? { parameters: view.parameters } : {},
    ...view.notes ? { notes: [...view.notes] } : {}
  }));
  return {
    ...resolved.metadata ? { metadata: resolved.metadata } : {},
    nodes,
    edges,
    organizations,
    views,
    diagnostics: [...resolved.diagnostics ?? []]
  };
}

// src/archimate.ts
import { XMLBuilder, XMLParser } from "fast-xml-parser";
var ARCHIMATE_NAMESPACE_PREFIX = "archimate";
var ARCHIMATE_NAMESPACE_URI = "https://www.opengroup.org/archimate/3.2";
var ARCHIMATE_EXCHANGE_NAMESPACE = "http://www.opengroup.org/xsd/archimate/3.0/";
var XML_SCHEMA_INSTANCE_NAMESPACE = "http://www.w3.org/2001/XMLSchema-instance";
function addMatrixEntries(matrix, relationshipType, sourceTypes, targetTypes, targetKind = "entity") {
  for (const sourceType of sourceTypes) {
    for (const targetType of targetTypes) {
      matrix.push({ relationshipType, sourceType, targetType, targetKind });
    }
  }
}
function buildDefaultArchimateRelationshipMatrix() {
  const matrix = [];
  addMatrixEntries(matrix, "archimate::composition", ["archimate::Element"], ["archimate::Element"]);
  addMatrixEntries(matrix, "archimate::aggregation", ["archimate::Element"], ["archimate::Element"]);
  addMatrixEntries(
    matrix,
    "archimate::assignment",
    ["archimate::ActiveStructureElement"],
    ["archimate::BehaviorElement", "archimate::ActiveStructureElement"]
  );
  addMatrixEntries(matrix, "archimate::realization", ["archimate::ActiveStructureElement"], [
    "archimate::ActiveStructureElement",
    "archimate::BehaviorElement",
    "archimate::StrategyElement"
  ]);
  addMatrixEntries(matrix, "archimate::realization", ["archimate::BehaviorElement"], [
    "archimate::BehaviorElement",
    "archimate::CompositeElement",
    "archimate::StrategyElement"
  ]);
  addMatrixEntries(matrix, "archimate::realization", ["archimate::PassiveStructureElement"], [
    "archimate::PassiveStructureElement",
    "archimate::CompositeElement"
  ]);
  addMatrixEntries(matrix, "archimate::realization", ["archimate::CompositeElement"], ["archimate::CompositeElement"]);
  addMatrixEntries(matrix, "archimate::realization", ["archimate::MotivationElement"], ["archimate::MotivationElement"]);
  addMatrixEntries(matrix, "archimate::realization", ["archimate::StrategyElement"], ["archimate::StrategyElement"]);
  addMatrixEntries(matrix, "archimate::realization", ["archimate::ImplementationMigrationElement"], [
    "archimate::ImplementationMigrationElement"
  ]);
  addMatrixEntries(matrix, "archimate::serving", ["archimate::BehaviorElement"], [
    "archimate::BehaviorElement",
    "archimate::ActiveStructureElement"
  ]);
  addMatrixEntries(matrix, "archimate::access", ["archimate::BehaviorElement"], ["archimate::PassiveStructureElement"]);
  addMatrixEntries(matrix, "archimate::influence", ["archimate::Concept"], ["archimate::MotivationElement"]);
  addMatrixEntries(matrix, "archimate::triggering", ["archimate::BehaviorElement"], ["archimate::BehaviorElement"]);
  addMatrixEntries(matrix, "archimate::flow", ["archimate::BehaviorElement"], ["archimate::BehaviorElement"]);
  addMatrixEntries(matrix, "archimate::association", ["archimate::Concept"], ["archimate::Concept"]);
  addMatrixEntries(matrix, "archimate::association", ["archimate::Concept"], ["archimate::Relationship"], "relationship");
  addMatrixEntries(matrix, "archimate::specialization", ["archimate::Concept"], ["archimate::Concept"]);
  addMatrixEntries(matrix, "archimate::junction", ["archimate::Concept"], ["archimate::Concept"]);
  return matrix;
}
var DEFAULT_ARCHIMATE_RELATIONSHIP_MATRIX = buildDefaultArchimateRelationshipMatrix();
var RELATIONSHIP_EXPORT_TYPE_TO_TYPE_REF = {
  Composition: "archimate::composition",
  Aggregation: "archimate::aggregation",
  Assignment: "archimate::assignment",
  Realization: "archimate::realization",
  Serving: "archimate::serving",
  Access: "archimate::access",
  Influence: "archimate::influence",
  Triggering: "archimate::triggering",
  Flow: "archimate::flow",
  Association: "archimate::association",
  Specialization: "archimate::specialization",
  Junction: "archimate::junction"
};
function asResolvedDocument2(document) {
  return isResolvedDocument(document) ? document : resolveDocument(document);
}
function pushDiagnostic3(diagnostics, source, severity, message, extras = {}) {
  diagnostics.push({
    uid: `diagnostic:${source}:${diagnostics.length + 1}`,
    source,
    severity,
    message,
    ...extras
  });
}
function typeAttributes(type) {
  return type?.attributes?.values ?? {};
}
function stringAttribute(type, key) {
  const value = typeAttributes(type)[key];
  return typeof value === "string" ? value : void 0;
}
function localName2(name) {
  const parts = name.split("::");
  return parts[parts.length - 1] ?? name;
}
function sanitizeIdentifier(value) {
  const normalized = value.replace(/[^A-Za-z0-9_-]+/gu, "_").replace(/^_+|_+$/gu, "");
  return normalized.length > 0 ? normalized : "anonymous";
}
function primitiveValueToString(value) {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}
function readXmlText(value) {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object") {
    const record = value;
    const text = record["#text"] ?? record.text;
    return typeof text === "string" ? text : void 0;
  }
  return void 0;
}
function asArray(value) {
  if (value === void 0) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}
function isArchimateConcept(document, entity) {
  return isEntityOfType(document, entity, "archimate::Concept", true);
}
function isArchimateElement(document, entity) {
  return isEntityOfType(document, entity, "archimate::Element", true);
}
function relationshipMatchesType(relationship, expectedType, hierarchy) {
  if (relationship.typeRef === expectedType) {
    return true;
  }
  return (hierarchy.relationshipAncestorsByName.get(relationship.typeRef) ?? []).includes(expectedType);
}
function entityMatchesType(entity, expectedType, hierarchy) {
  if (!entity.typeRef) {
    return false;
  }
  if (entity.typeRef === expectedType) {
    return true;
  }
  return (hierarchy.entityAncestorsByName.get(entity.typeRef) ?? []).includes(expectedType);
}
function resolveRelationshipTargetRelationship(document, relationship) {
  if (!relationship.targetRef) {
    return void 0;
  }
  return document.relationships.find(
    (candidate) => candidate.uid === relationship.targetRef || candidate.id === relationship.targetRef || getStableRelationshipId(candidate) === relationship.targetRef
  );
}
function relationshipExportType(type, relationship) {
  return stringAttribute(type, "exportType") ?? localName2(relationship.typeRef);
}
function entityExportType(type, entity) {
  return stringAttribute(type, "exportType") ?? localName2(entity.typeRef ?? "Concept");
}
function entityLayer(type) {
  return stringAttribute(type, "layer");
}
function entityAspect(type) {
  return stringAttribute(type, "aspect");
}
function areCompatibleSpecializationTypes(source, target, document, hierarchy) {
  if (!source.typeRef || !target.typeRef) {
    return false;
  }
  if (source.typeRef === target.typeRef) {
    return true;
  }
  const sourceAncestors = hierarchy.entityAncestorsByName.get(source.typeRef) ?? [];
  const targetAncestors = hierarchy.entityAncestorsByName.get(target.typeRef) ?? [];
  if (sourceAncestors.includes(target.typeRef) || targetAncestors.includes(source.typeRef)) {
    return true;
  }
  const sourceType = source.typeRef ? document.indexes.entityTypesByName.get(source.typeRef) : void 0;
  const targetType = target.typeRef ? document.indexes.entityTypesByName.get(target.typeRef) : void 0;
  return entityLayer(sourceType) === entityLayer(targetType) && entityAspect(sourceType) === entityAspect(targetType);
}
function allowsMatrixEntry(document, relationship, matrix, hierarchy) {
  const targetRelationship = resolveRelationshipTargetRelationship(document, relationship);
  const targetKind = targetRelationship ? "relationship" : "entity";
  return matrix.some((entry) => {
    if (entry.relationshipType !== relationship.typeRef) {
      return false;
    }
    if ((entry.targetKind ?? "entity") !== targetKind) {
      return false;
    }
    if (!entityMatchesType(relationship.source, entry.sourceType, hierarchy)) {
      return false;
    }
    if (targetRelationship) {
      return relationshipMatchesType(targetRelationship, entry.targetType, hierarchy);
    }
    if (!relationship.target) {
      return false;
    }
    return entityMatchesType(relationship.target, entry.targetType, hierarchy);
  });
}
function explicitArchimateRelationships(document) {
  return document.relationships.filter(
    (relationship) => relationship.relationshipKind === "explicit" && relationship.typeRef.startsWith("archimate::")
  );
}
function existingViewReferences(document) {
  const references = /* @__PURE__ */ new Set();
  for (const entity of document.entities) {
    references.add(entity.uid);
    if (entity.id) {
      references.add(entity.id);
    }
    if (entity.qualifiedId) {
      references.add(entity.qualifiedId);
    }
  }
  for (const relationship of document.relationships) {
    references.add(relationship.uid);
    if (relationship.id) {
      references.add(relationship.id);
    }
    references.add(getStableRelationshipId(relationship));
  }
  return references;
}
function viewDeltaReference(delta) {
  if ("targetRef" in delta && typeof delta.targetRef === "string") {
    return delta.targetRef;
  }
  if ("targetUid" in delta && typeof delta.targetUid === "string") {
    return delta.targetUid;
  }
  return void 0;
}
function baseArchimateDiagnostics(document, options = {}) {
  const diagnostics = [];
  const hierarchy = createTypeHierarchy(document);
  const matrix = options.matrix ?? DEFAULT_ARCHIMATE_RELATIONSHIP_MATRIX;
  for (const entity of document.entities) {
    if (!entity.typeRef || !entity.typeRef.startsWith("archimate::")) {
      continue;
    }
    if (!document.indexes.entityTypesByName.get(entity.typeRef)) {
      pushDiagnostic3(diagnostics, "archimate.rules", "error", `Unknown ArchiMate concept type '${entity.typeRef}'.`, {
        entityUid: entity.uid,
        code: "archimate.rules.requireKnownConceptType"
      });
    }
    if (isArchimateElement(document, entity) && !entity.id) {
      pushDiagnostic3(diagnostics, "archimate.rules", "error", "Every ArchiMate element must have a stable id.", {
        entityUid: entity.uid,
        code: "archimate.rules.requireId"
      });
    }
    if (isArchimateElement(document, entity) && entity.label.trim().length === 0) {
      pushDiagnostic3(diagnostics, "archimate.rules", "error", "Every ArchiMate element must have a non-empty label.", {
        entityUid: entity.uid,
        code: "archimate.rules.requireNonEmptyLabel"
      });
    }
    const provenanceKeys = ["prov::sourceFormat", "prov::sourceId", "prov::sourceFile"];
    const presentProvenanceKeys = provenanceKeys.filter((key) => entity.attributes?.values[key] !== void 0);
    if (presentProvenanceKeys.length > 0 && presentProvenanceKeys.length < provenanceKeys.length) {
      pushDiagnostic3(
        diagnostics,
        "archimate.rules",
        "warning",
        "Imported ArchiMate content should preserve prov::sourceFormat, prov::sourceId, and prov::sourceFile together.",
        {
          entityUid: entity.uid,
          code: "archimate.rules.requireProvenanceWhenImported"
        }
      );
    }
  }
  for (const relationship of explicitArchimateRelationships(document)) {
    const sourceEntity = relationship.source;
    const targetRelationship = resolveRelationshipTargetRelationship(document, relationship);
    if (!sourceEntity.id) {
      pushDiagnostic3(diagnostics, "archimate.rules", "error", "Every ArchiMate relationship source must have a stable id.", {
        relationshipUid: relationship.uid,
        entityUid: sourceEntity.uid,
        code: "archimate.rules.requireSourceId"
      });
    }
    if (!relationship.target && !targetRelationship) {
      pushDiagnostic3(diagnostics, "archimate.rules", "error", `Relationship target '${relationship.targetRef ?? ""}' could not be resolved.`, {
        relationshipUid: relationship.uid,
        code: "archimate.rules.requireTargetResolved"
      });
      continue;
    }
    if (!relationship.id) {
      pushDiagnostic3(
        diagnostics,
        "archimate.rules",
        "warning",
        "Relationship ids are recommended for exchange, diagnostics, and round-trip stability.",
        {
          relationshipUid: relationship.uid,
          code: "itm.relationship-identity.warnIfMissingRelationshipId"
        }
      );
    }
    if (!allowsMatrixEntry(document, relationship, matrix, hierarchy)) {
      pushDiagnostic3(
        diagnostics,
        "archimate.rules",
        "error",
        `Relationship '${relationship.typeRef}' is not allowed for source '${sourceEntity.typeRef ?? "unknown"}' and target '${relationship.target?.typeRef ?? targetRelationship?.typeRef ?? relationship.targetRef ?? "unknown"}'.`,
        {
          relationshipUid: relationship.uid,
          entityUid: sourceEntity.uid,
          code: "archimate.rules.validateRelationshipAllowed"
        }
      );
    }
    if (relationship.typeRef === "archimate::assignment") {
      const validAssignment = entityMatchesType(sourceEntity, "archimate::ActiveStructureElement", hierarchy) && (relationship.target && entityMatchesType(relationship.target, "archimate::BehaviorElement", hierarchy) || relationship.target && entityMatchesType(relationship.target, "archimate::ActiveStructureElement", hierarchy));
      if (!validAssignment) {
        pushDiagnostic3(diagnostics, "archimate.rules", "error", "Assignment direction is not valid for the source and target concept types.", {
          relationshipUid: relationship.uid,
          code: "archimate.rules.validateAssignmentDirection"
        });
      }
    }
    if (relationship.typeRef === "archimate::serving") {
      const validServing = entityMatchesType(sourceEntity, "archimate::BehaviorElement", hierarchy) && (relationship.target && entityMatchesType(relationship.target, "archimate::BehaviorElement", hierarchy) || relationship.target && entityMatchesType(relationship.target, "archimate::ActiveStructureElement", hierarchy));
      if (!validServing) {
        pushDiagnostic3(diagnostics, "archimate.rules", "warning", "Serving should run from a behavior or service provider to a consuming behavior or structure element.", {
          relationshipUid: relationship.uid,
          code: "archimate.rules.validateServingDirection"
        });
      }
    }
    if (relationship.typeRef === "archimate::access") {
      const accessType = relationship.attributes?.values.accessType;
      const allowed = ["read", "write", "readWrite", "access"];
      if (accessType !== void 0 && (typeof accessType !== "string" || !allowed.includes(accessType))) {
        pushDiagnostic3(diagnostics, "archimate.rules", "error", "Access relationships may only use accessType values read, write, readWrite, or access.", {
          relationshipUid: relationship.uid,
          code: "archimate.rules.accessType"
        });
      }
    }
    if (relationship.typeRef === "archimate::influence") {
      const strength = relationship.attributes?.values.strength;
      const allowed = ["++", "+", "0", "-", "--", "custom"];
      if (strength !== void 0 && (typeof strength !== "string" || !allowed.includes(strength))) {
        pushDiagnostic3(diagnostics, "archimate.rules", "error", "Influence relationships may only use standard strengths or custom.", {
          relationshipUid: relationship.uid,
          code: "archimate.rules.influenceStrength"
        });
      }
    }
    if (relationship.typeRef === "archimate::specialization") {
      if (!relationship.target || !areCompatibleSpecializationTypes(sourceEntity, relationship.target, document, hierarchy)) {
        pushDiagnostic3(diagnostics, "archimate.rules", "error", "Specialization must connect compatible concept types.", {
          relationshipUid: relationship.uid,
          code: "archimate.rules.validateSpecializationCompatibleTypes"
        });
      }
    }
    if (relationship.typeRef === "archimate::composition" || relationship.typeRef === "archimate::aggregation") {
      if (!relationship.target || !isArchimateElement(document, relationship.target)) {
        pushDiagnostic3(diagnostics, "archimate.rules", "warning", "Composition and aggregation should connect ArchiMate elements explicitly representing a whole-part structure.", {
          relationshipUid: relationship.uid,
          code: "archimate.rules.validateWholePartRelationship"
        });
      } else {
        const sourceType = sourceEntity.typeRef ? document.indexes.entityTypesByName.get(sourceEntity.typeRef) : void 0;
        const targetType = relationship.target.typeRef ? document.indexes.entityTypesByName.get(relationship.target.typeRef) : void 0;
        const crossLayer = entityLayer(sourceType) !== entityLayer(targetType);
        if (crossLayer && relationship.attributes?.values.rationale === void 0) {
          pushDiagnostic3(diagnostics, "archimate.rules", "warning", "Cross-layer whole-part relationships should carry a rationale attribute.", {
            relationshipUid: relationship.uid,
            code: "archimate.rules.warnCrossLayerWholePartWithoutRationale"
          });
        }
      }
    }
  }
  for (const relationship of document.relationships) {
    if (relationship.relationshipKind === "explicit" && !relationship.typeRef.startsWith("archimate::")) {
      if (isArchimateConcept(document, relationship.source) && relationship.target && isArchimateConcept(document, relationship.target)) {
        pushDiagnostic3(diagnostics, "archimate.rules", "warning", "Use explicit archimate:: relationship types between ArchiMate concepts.", {
          relationshipUid: relationship.uid,
          code: "archimate.rules.warnUntypedOutgoingEdgesToArchimateConcepts"
        });
      }
    }
    if (relationship.relationshipKind === "containment" && isArchimateConcept(document, relationship.source) && relationship.target && isArchimateConcept(document, relationship.target)) {
      pushDiagnostic3(diagnostics, "archimate.rules", "warning", "Indented hierarchy should be treated as organization, not an ArchiMate semantic composition, unless an explicit relationship is present.", {
        relationshipUid: relationship.uid,
        code: "archimate.rules.warnIfHierarchyWouldBeExportedAsSemanticRelationship"
      });
    }
    if (relationship.relationshipKind === "ordering" && isArchimateConcept(document, relationship.source) && relationship.target && isArchimateConcept(document, relationship.target)) {
      const hasExplicitFlow = document.relationships.some(
        (candidate) => candidate.relationshipKind === "explicit" && candidate.typeRef === "archimate::flow" && candidate.source.uid === relationship.source.uid && candidate.target?.uid === relationship.target?.uid
      );
      if (!hasExplicitFlow) {
        pushDiagnostic3(diagnostics, "archimate.rules", "observation", "Sibling ordering should not be exported as ArchiMate Flow unless an explicit archimate::flow relationship exists.", {
          relationshipUid: relationship.uid,
          code: "archimate.rules.warnIfOrderingWouldBeExportedAsFlow"
        });
      }
    }
  }
  for (const entity of document.entities) {
    if (!entity.typeRef || !entityMatchesType(entity, "archimate::Junction", hierarchy)) {
      continue;
    }
    const junctionKind = entity.attributes?.values.junctionKind;
    if (junctionKind !== "and" && junctionKind !== "or") {
      pushDiagnostic3(diagnostics, "archimate.rules", "error", "ArchiMate junctions must declare junctionKind as and or or.", {
        entityUid: entity.uid,
        code: "archimate.rules.junctionKind"
      });
    }
  }
  const validReferences = existingViewReferences(document);
  for (const view of document.views ?? []) {
    for (const delta of view.deltas ?? []) {
      const reference = viewDeltaReference(delta);
      if (!reference || validReferences.has(reference)) {
        continue;
      }
      pushDiagnostic3(diagnostics, "archimate.rules", "error", `View delta reference '${reference}' does not exist in the model.`, {
        viewUid: view.uid,
        code: "archimate.rules.validateViewDeltasReferenceExistingIds"
      });
    }
  }
  return diagnostics;
}
function validateArchiMateRules(document, options = {}) {
  return baseArchimateDiagnostics(asResolvedDocument2(document), options);
}
function validateArchiMateExchangeReadiness(document, options = {}) {
  const resolved = asResolvedDocument2(document);
  const diagnostics = baseArchimateDiagnostics(resolved, options);
  for (const entity of resolved.entities) {
    if (!isArchimateConcept(resolved, entity)) {
      continue;
    }
    const entityType = entity.typeRef ? resolved.indexes.entityTypesByName.get(entity.typeRef) : void 0;
    if (!entityType || !stringAttribute(entityType, "exportType")) {
      pushDiagnostic3(diagnostics, "archimate.exchange", "error", `Entity '${entity.id ?? entity.uid}' is missing an exportType-capable ArchiMate type definition.`, {
        entityUid: entity.uid,
        code: "archimate.exchange.validateExportReadiness"
      });
    }
  }
  for (const relationship of explicitArchimateRelationships(resolved)) {
    const relationshipType = resolved.indexes.relationshipTypesByName.get(relationship.typeRef);
    const targetRelationship = resolveRelationshipTargetRelationship(resolved, relationship);
    if (!relationshipType || !stringAttribute(relationshipType, "exportType")) {
      pushDiagnostic3(diagnostics, "archimate.exchange", "error", `Relationship '${relationship.typeRef}' is missing an exportType-capable definition.`, {
        relationshipUid: relationship.uid,
        code: "archimate.exchange.validateExportReadiness"
      });
    }
    if (!relationship.source.id || !relationship.target?.id && !targetRelationship && !relationship.targetRef) {
      pushDiagnostic3(diagnostics, "archimate.exchange", "error", "Exchange export requires stable source and target identifiers for relationships.", {
        relationshipUid: relationship.uid,
        code: "archimate.exchange.validateExportReadiness"
      });
    }
  }
  return diagnostics;
}
function propertyDefinitionId(key) {
  return `prop_${sanitizeIdentifier(key)}`;
}
function toPropertyDefinitions(properties, language) {
  return [...properties].sort().map((key) => ({
    "@_identifier": propertyDefinitionId(key),
    "@_type": "string",
    name: {
      "@_xml:lang": language,
      "#text": key
    }
  }));
}
function toPropertyEntries(properties, language) {
  return Object.entries(properties).map(([key, value]) => ({
    "@_propertyDefinitionRef": propertyDefinitionId(key),
    value: {
      "@_xml:lang": language,
      "#text": primitiveValueToString(value)
    }
  }));
}
function toOrganizationItems(organizations) {
  return organizations.map((organization) => ({
    "@_identifierRef": organization.id,
    label: organization.label,
    ...organization.children.length > 0 ? { item: toOrganizationItems(organization.children) } : {}
  }));
}
function exportArchiMateExchangeResult(document, options = {}) {
  const resolved = asResolvedDocument2(document);
  const diagnostics = validateArchiMateExchangeReadiness(resolved, options);
  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return { value: "", diagnostics };
  }
  const language = options.language ?? "en";
  const canonical = createCanonicalGraph(resolved, {
    includeImplicitRelationships: options.includeImplicitRelationships ?? false
  });
  const propertyNames = /* @__PURE__ */ new Set();
  const entityTypesByName = resolved.indexes.entityTypesByName;
  const relationshipTypesByName = resolved.indexes.relationshipTypesByName;
  for (const node of canonical.nodes) {
    for (const propertyName of Object.keys(node.properties)) {
      propertyNames.add(propertyName);
    }
  }
  for (const edge of canonical.edges) {
    for (const propertyName of Object.keys(edge.properties)) {
      propertyNames.add(propertyName);
    }
  }
  const modelIdentifier = options.modelIdentifier ?? sanitizeIdentifier(resolved.metadata?.title ?? "itm_archimate_model");
  const elements = canonical.nodes.map((node) => {
    const entity = resolved.entities.find((candidate) => candidate.uid === node.uid);
    const entityType = entity?.typeRef ? entityTypesByName.get(entity.typeRef) : void 0;
    return {
      "@_identifier": node.id,
      "@_xsi:type": entity && entity.typeRef ? entityExportType(entityType, entity) : "Concept",
      name: {
        "@_xml:lang": language,
        "#text": node.label
      },
      ...node.description ? {
        documentation: {
          "@_xml:lang": language,
          "#text": node.description
        }
      } : {},
      ...Object.keys(node.properties).length > 0 ? { properties: { property: toPropertyEntries(node.properties, language) } } : {}
    };
  });
  const relationships = canonical.edges.filter((edge) => edge.relationshipKind === "explicit").map((edge) => {
    const relationship = resolved.relationships.find((candidate) => candidate.uid === edge.uid);
    const relationshipType = relationship ? relationshipTypesByName.get(relationship.typeRef) : void 0;
    const targetIdentifier = edge.targetId ?? edge.targetRelationshipId ?? edge.targetRef;
    return {
      "@_identifier": edge.id,
      "@_xsi:type": relationship ? relationshipExportType(relationshipType, relationship) : localName2(edge.typeRef),
      "@_source": edge.sourceId,
      "@_target": targetIdentifier,
      ...Object.keys(edge.properties).length > 0 ? { properties: { property: toPropertyEntries(edge.properties, language) } } : {}
    };
  });
  const xmlObject = {
    model: {
      "@_xmlns": ARCHIMATE_EXCHANGE_NAMESPACE,
      "@_xmlns:xsi": XML_SCHEMA_INSTANCE_NAMESPACE,
      "@_identifier": modelIdentifier,
      name: {
        "@_xml:lang": language,
        "#text": resolved.metadata?.title ?? modelIdentifier
      },
      elements: {
        element: elements
      },
      ...relationships.length > 0 ? { relationships: { relationship: relationships } } : {},
      ...propertyNames.size > 0 ? { propertyDefinitions: { propertyDefinition: toPropertyDefinitions(propertyNames, language) } } : {},
      ...options.includeOrganizations === false || canonical.organizations.length === 0 ? {} : { organizations: { item: toOrganizationItems(canonical.organizations) } }
    }
  };
  const builder = new XMLBuilder({
    format: true,
    ignoreAttributes: false,
    suppressEmptyNode: true
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
${builder.build(xmlObject)}`;
  return {
    value: xml,
    diagnostics
  };
}
function exportArchiMateExchange(document, options = {}) {
  const result = exportArchiMateExchangeResult(document, options);
  throwOnErrorDiagnostics(result.diagnostics, "ArchiMate exchange export failed due to error diagnostics.", result.value);
  return result.value;
}
function parseImportedPropertyValue(value) {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (value === "null") {
    return null;
  }
  if (/^-?\d+(?:\.\d+)?$/u.test(value)) {
    return Number(value);
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
function collectImportedProperties(value, propertyDefinitions) {
  const properties = {};
  for (const property of asArray(value?.property)) {
    const definitionRef = property["@_propertyDefinitionRef"];
    const key = typeof definitionRef === "string" ? propertyDefinitions.get(definitionRef) : void 0;
    const propertyValue = readXmlText(property.value);
    if (!key || propertyValue === void 0) {
      continue;
    }
    properties[key] = parseImportedPropertyValue(propertyValue);
  }
  return properties;
}
function importArchiMateExchangeResult(xml, options = {}) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    parseTagValue: false,
    trimValues: false
  });
  const parsed = parser.parse(xml);
  const model = parsed.model;
  const diagnostics = [];
  const defaultNamespace = options.defaultNamespace ?? "local";
  const namespaceUri = options.namespaceUri ?? `https://example.org/${defaultNamespace}`;
  if (!model) {
    const empty = createDocument();
    pushDiagnostic3(diagnostics, "archimate.exchange", "error", "Exchange XML does not contain a model root element.", {
      code: "archimate.exchange.import"
    });
    return {
      value: empty,
      diagnostics
    };
  }
  const propertyDefinitions = /* @__PURE__ */ new Map();
  for (const definition of asArray(model.propertyDefinitions?.propertyDefinition)) {
    const identifier = definition["@_identifier"];
    const name = readXmlText(definition.name);
    if (typeof identifier === "string" && name) {
      propertyDefinitions.set(identifier, name);
    }
  }
  const entities = asArray(model.elements?.element);
  const relationships = asArray(model.relationships?.relationship);
  const entityByIdentifier = /* @__PURE__ */ new Map();
  const modelTitle = readXmlText(model.name);
  const document = createDocument({
    metadata: {
      ...modelTitle ? { title: modelTitle } : {},
      defaultNamespace,
      values: {
        ...typeof model["@_identifier"] === "string" ? { archimateExchangeModelId: model["@_identifier"] } : {}
      }
    },
    namespaces: [
      {
        prefix: ARCHIMATE_NAMESPACE_PREFIX,
        uri: ARCHIMATE_NAMESPACE_URI
      },
      {
        prefix: defaultNamespace,
        uri: namespaceUri
      }
    ].filter((namespace) => Boolean(namespace.uri)),
    entities: [],
    relationships: []
  });
  for (const element of entities) {
    const identifier = typeof element["@_identifier"] === "string" ? element["@_identifier"] : void 0;
    const exportType = typeof element["@_type"] === "string" ? element["@_type"] : void 0;
    if (!identifier) {
      continue;
    }
    const properties = collectImportedProperties(element.properties, propertyDefinitions);
    properties["prov::sourceFormat"] = "archimate-exchange";
    properties["prov::sourceId"] = identifier;
    const entity = createEntity({
      uid: `entity:${sanitizeIdentifier(identifier)}`,
      id: identifier,
      qualifiedId: `${defaultNamespace}::${identifier}`,
      namespacePrefix: defaultNamespace,
      localId: identifier,
      label: readXmlText(element.name) ?? identifier,
      ...exportType ? { typeRef: `archimate::${exportType}` } : {},
      ...Object.keys(properties).length > 0 ? { attributes: { values: properties } } : {},
      ...readXmlText(element.documentation) ? {
        description: {
          format: "markdown",
          text: readXmlText(element.documentation) ?? ""
        }
      } : {}
    });
    document.entities.push(entity);
    entityByIdentifier.set(identifier, entity);
  }
  for (const relationshipRecord of relationships) {
    const identifier = typeof relationshipRecord["@_identifier"] === "string" ? relationshipRecord["@_identifier"] : void 0;
    const sourceIdentifier = typeof relationshipRecord["@_source"] === "string" ? relationshipRecord["@_source"] : void 0;
    const targetIdentifier = typeof relationshipRecord["@_target"] === "string" ? relationshipRecord["@_target"] : void 0;
    const exportType = typeof relationshipRecord["@_type"] === "string" ? relationshipRecord["@_type"] : void 0;
    if (!identifier || !sourceIdentifier || !targetIdentifier) {
      continue;
    }
    const sourceEntity = entityByIdentifier.get(sourceIdentifier);
    if (!sourceEntity) {
      pushDiagnostic3(diagnostics, "archimate.exchange", "error", `Relationship '${identifier}' references unknown source '${sourceIdentifier}'.`, {
        code: "archimate.exchange.import"
      });
      continue;
    }
    const targetEntity = entityByIdentifier.get(targetIdentifier);
    const relationshipType = exportType ? RELATIONSHIP_EXPORT_TYPE_TO_TYPE_REF[exportType] ?? `archimate::${exportType}` : "archimate::association";
    const properties = collectImportedProperties(relationshipRecord.properties, propertyDefinitions);
    properties["prov::sourceFormat"] = "archimate-exchange";
    properties["prov::sourceId"] = identifier;
    document.relationships.push(
      createRelationship({
        uid: `relationship:${sanitizeIdentifier(identifier)}`,
        id: identifier,
        sourceId: sourceEntity.uid,
        ...sourceEntity.qualifiedId ? { sourceRef: sourceEntity.qualifiedId } : {},
        ...targetEntity ? {
          targetId: targetEntity.uid,
          ...targetEntity.qualifiedId ? { targetRef: targetEntity.qualifiedId } : {}
        } : { targetRef: targetIdentifier },
        typeRef: relationshipType,
        relationshipKind: "explicit",
        ...Object.keys(properties).length > 0 ? { attributes: { values: properties } } : {}
      })
    );
  }
  return {
    value: document,
    diagnostics
  };
}
function importArchiMateExchange(xml, options = {}) {
  const result = importArchiMateExchangeResult(xml, options);
  throwOnErrorDiagnostics(result.diagnostics, "ArchiMate exchange import failed due to error diagnostics.", result.value);
  return result.value;
}
function importArchiMateExchangeAsItmResult(xml, options = {}) {
  const imported = importArchiMateExchangeResult(xml, options);
  const serialized = serializeDocumentResult(imported.value, options);
  return {
    value: serialized.value,
    diagnostics: [...imported.diagnostics, ...serialized.diagnostics]
  };
}
function importArchiMateExchangeAsItm(xml, options = {}) {
  const result = importArchiMateExchangeAsItmResult(xml, options);
  throwOnErrorDiagnostics(result.diagnostics, "ArchiMate exchange to ITM conversion failed due to error diagnostics.", result.value);
  return result.value;
}

// src/bpmn.ts
import { XMLBuilder as XMLBuilder2, XMLParser as XMLParser2 } from "fast-xml-parser";
var BPMN_NAMESPACE_PREFIX = "bpmn";
var BPMN_NAMESPACE_URI = "https://www.omg.org/spec/BPMN/20100524/MODEL";
var BPMNDI_NAMESPACE_URI = "https://www.omg.org/spec/BPMN/20100524/DI";
var DC_NAMESPACE_URI = "https://www.omg.org/spec/DD/20100524/DC";
var DI_NAMESPACE_URI = "https://www.omg.org/spec/DD/20100524/DI";
var XML_SCHEMA_INSTANCE_NAMESPACE2 = "http://www.w3.org/2001/XMLSchema-instance";
var USER_FACING_BPMN_TYPES = [
  "bpmn::FlowNode",
  "bpmn::Participant",
  "bpmn::ConversationNode",
  "bpmn::DataObjectReference",
  "bpmn::DataStoreReference",
  "bpmn::Message"
];
var FLOW_SCOPE_TYPES = [
  "bpmn::Process",
  "bpmn::SubProcess",
  "bpmn::AdHocSubProcess",
  "bpmn::Transaction",
  "bpmn::Choreography",
  "bpmn::SubChoreography"
];
var EDGE_CONTAINER_TYPES = [
  "bpmn::Process",
  "bpmn::SubProcess",
  "bpmn::AdHocSubProcess",
  "bpmn::Transaction",
  "bpmn::Collaboration"
];
var ROOT_EXPORT_TYPES = /* @__PURE__ */ new Set([
  "process",
  "collaboration",
  "message",
  "error",
  "escalation",
  "signal",
  "itemDefinition",
  "dataStore"
]);
var BPMN_XML_ENTITY_TYPES = {
  process: "bpmn::Process",
  collaboration: "bpmn::Collaboration",
  participant: "bpmn::Participant",
  startEvent: "bpmn::StartEvent",
  intermediateCatchEvent: "bpmn::IntermediateCatchEvent",
  intermediateThrowEvent: "bpmn::IntermediateThrowEvent",
  endEvent: "bpmn::EndEvent",
  boundaryEvent: "bpmn::BoundaryEvent",
  task: "bpmn::Task",
  userTask: "bpmn::UserTask",
  serviceTask: "bpmn::ServiceTask",
  sendTask: "bpmn::SendTask",
  receiveTask: "bpmn::ReceiveTask",
  subProcess: "bpmn::SubProcess",
  callActivity: "bpmn::CallActivity",
  exclusiveGateway: "bpmn::ExclusiveGateway",
  inclusiveGateway: "bpmn::InclusiveGateway",
  parallelGateway: "bpmn::ParallelGateway",
  eventBasedGateway: "bpmn::EventBasedGateway",
  textAnnotation: "bpmn::TextAnnotation",
  association: "bpmn::Association",
  dataObject: "bpmn::DataObject",
  dataObjectReference: "bpmn::DataObjectReference",
  dataStore: "bpmn::DataStore",
  dataStoreReference: "bpmn::DataStoreReference",
  laneSet: "bpmn::LaneSet",
  lane: "bpmn::Lane",
  message: "bpmn::Message"
};
var BPMN_XML_RELATIONSHIP_TYPES = {
  sequenceFlow: "bpmn::sequenceFlow",
  messageFlow: "bpmn::messageFlow",
  association: "bpmn::association",
  dataInputAssociation: "bpmn::dataInputAssociation",
  dataOutputAssociation: "bpmn::dataOutputAssociation",
  conversationLink: "bpmn::conversationLink"
};
function asResolvedDocument3(document) {
  return isResolvedDocument(document) ? document : resolveDocument(document);
}
function pushDiagnostic4(diagnostics, source, severity, message, extras = {}) {
  diagnostics.push({
    uid: `diagnostic:${source}:${diagnostics.length + 1}`,
    source,
    severity,
    message,
    ...extras
  });
}
function typeAttributes2(type) {
  return type?.attributes?.values ?? {};
}
function stringAttribute2(type, key) {
  const value = typeAttributes2(type)[key];
  return typeof value === "string" ? value : void 0;
}
function localName3(name) {
  const parts = name.split("::");
  return parts[parts.length - 1] ?? name;
}
function sanitizeIdentifier2(value) {
  const normalized = value.replace(/[^A-Za-z0-9_.-]+/gu, "_").replace(/^_+|_+$/gu, "");
  return normalized.length > 0 ? normalized : "anonymous";
}
function primitiveValueToString2(value) {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}
function parseImportedPropertyValue2(value) {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (value === "null") {
    return null;
  }
  if (/^-?\d+(?:\.\d+)?$/u.test(value)) {
    return Number(value);
  }
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
function readXmlText2(value) {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object") {
    const record = value;
    const text = record["#text"] ?? record.text;
    return typeof text === "string" ? text : void 0;
  }
  return void 0;
}
function asArray2(value) {
  if (value === void 0) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}
function isBpmnEntity(document, entity, typeRef) {
  return isEntityOfType(document, entity, typeRef, true);
}
function entityMatchesType2(entity, expectedType, hierarchy) {
  if (!entity.typeRef) {
    return false;
  }
  if (entity.typeRef === expectedType) {
    return true;
  }
  return (hierarchy.entityAncestorsByName.get(entity.typeRef) ?? []).includes(expectedType);
}
function relationshipExportType2(type, relationship) {
  return stringAttribute2(type, "exportType") ?? localName3(relationship.typeRef);
}
function entityExportType2(type, entity) {
  return stringAttribute2(type, "exportType") ?? localName3(entity.typeRef ?? "BaseElement");
}
function entityReference(entity) {
  return entity.id ?? entity.qualifiedId ?? entity.uid;
}
function bpmnElementId(entity) {
  const attributeId = entity.attributes?.values.id;
  return typeof attributeId === "string" && attributeId.length > 0 ? attributeId : entity.id;
}
function bpmnElementReference(entity) {
  return bpmnElementId(entity) ?? entityReference(entity);
}
function stableRelationshipIdentifier(relationship, index) {
  return relationship.id ?? getStableRelationshipId(relationship, index);
}
function nearestAncestorOfType(document, entity, types) {
  let current = entity;
  while (current) {
    const candidate = current;
    if (candidate.typeRef && types.some((typeRef) => isEntityOfType(document, candidate, typeRef, true))) {
      return current;
    }
    current = current.parent;
  }
  return void 0;
}
function ancestorsInclusive(entity) {
  const ancestors = [];
  let current = entity;
  while (current) {
    ancestors.push(current);
    current = current.parent;
  }
  return ancestors;
}
function nearestSharedAncestor(document, source, target, types) {
  const targetAncestors = new Set(ancestorsInclusive(target).map((entity) => entity.uid));
  for (const ancestor of ancestorsInclusive(source)) {
    if (!targetAncestors.has(ancestor.uid)) {
      continue;
    }
    if (ancestor.typeRef && types.some((typeRef) => isEntityOfType(document, ancestor, typeRef, true))) {
      return ancestor;
    }
  }
  return void 0;
}
function flowScopeOf(document, entity) {
  return nearestAncestorOfType(document, entity, FLOW_SCOPE_TYPES);
}
function buildParticipantProcessMap(document) {
  const participantsByProcessUid = /* @__PURE__ */ new Map();
  for (const relationship of document.relationships) {
    if (relationship.typeRef !== "bpmn::participantProcessRef" || !relationship.target) {
      continue;
    }
    participantsByProcessUid.set(relationship.target.uid, relationship.source);
  }
  for (const participant of document.entities) {
    if (!participant.typeRef || !isEntityOfType(document, participant, "bpmn::Participant", true)) {
      continue;
    }
    const processRef = participant.attributes?.values.processRef;
    if (typeof processRef !== "string") {
      continue;
    }
    const process2 = document.entities.find(
      (candidate) => candidate.qualifiedId === processRef || candidate.id === processRef || candidate.uid === processRef
    );
    if (process2) {
      participantsByProcessUid.set(process2.uid, participant);
    }
  }
  return participantsByProcessUid;
}
function participantOf(document, entity, participantsByProcessUid) {
  const directParticipant = nearestAncestorOfType(document, entity, ["bpmn::Participant"]);
  if (directParticipant) {
    return directParticipant;
  }
  const scope = flowScopeOf(document, entity);
  return scope ? participantsByProcessUid.get(scope.uid) : void 0;
}
function eventDefinitionRelationships(event) {
  return event.outgoing.filter((relationship) => relationship.typeRef === "bpmn::eventDefinition" && Boolean(relationship.target));
}
function baseBpmnDiagnostics(document) {
  const diagnostics = [];
  const hierarchy = createTypeHierarchy(document);
  const participantsByProcessUid = buildParticipantProcessMap(document);
  for (const entity of document.entities) {
    if (!entity.typeRef || !entity.typeRef.startsWith("bpmn::")) {
      continue;
    }
    if (!document.indexes.entityTypesByName.get(entity.typeRef)) {
      pushDiagnostic4(diagnostics, "bpmn.rules", "error", `Unknown BPMN element type '${entity.typeRef}'.`, {
        entityUid: entity.uid,
        code: "bpmn.rules.requireKnownElementType"
      });
    }
    if (isBpmnEntity(document, entity, "bpmn::BaseElement") && !bpmnElementId(entity)) {
      pushDiagnostic4(diagnostics, "bpmn.rules", "error", "BPMN elements must have stable ids compatible with BPMN XML id usage.", {
        entityUid: entity.uid,
        code: "bpmn.rules.requireId"
      });
    }
    if (USER_FACING_BPMN_TYPES.some((typeRef) => isEntityOfType(document, entity, typeRef, true)) && entity.label.trim().length === 0) {
      pushDiagnostic4(diagnostics, "bpmn.rules", "warning", "User-facing BPMN elements should have readable labels/names.", {
        entityUid: entity.uid,
        code: "bpmn.rules.requireReadableLabel"
      });
    }
    if (isBpmnEntity(document, entity, "bpmn::BoundaryEvent")) {
      const attachedToRef = entity.attributes?.values.attachedToRef;
      const attached = typeof attachedToRef === "string" ? document.entities.find(
        (candidate) => candidate.qualifiedId === attachedToRef || candidate.id === attachedToRef || candidate.uid === attachedToRef
      ) : void 0;
      if (!attached || !isBpmnEntity(document, attached, "bpmn::Activity")) {
        pushDiagnostic4(diagnostics, "bpmn.rules", "error", "BoundaryEvent must attach to an Activity.", {
          entityUid: entity.uid,
          code: "bpmn.rules.requireAttachedToRefType"
        });
      }
    }
    if (isBpmnEntity(document, entity, "bpmn::CallActivity")) {
      const calledElementRef = entity.attributes?.values.calledElementRef;
      const explicitReference = entity.outgoing.find((relationship) => relationship.typeRef === "bpmn::calledElementRef");
      const target = explicitReference?.target ?? (typeof calledElementRef === "string" ? document.entities.find(
        (candidate) => candidate.qualifiedId === calledElementRef || candidate.id === calledElementRef || candidate.uid === calledElementRef
      ) : void 0);
      if (!target || !isBpmnEntity(document, target, "bpmn::CallableElement")) {
        pushDiagnostic4(diagnostics, "bpmn.rules", "error", "CallActivity must reference a callable BPMN element.", {
          entityUid: entity.uid,
          code: "bpmn.rules.requireCalledElementIsCallable"
        });
      }
    }
    if (isBpmnEntity(document, entity, "bpmn::DataObjectReference")) {
      const reference = entity.attributes?.values.dataObjectRef;
      const target = typeof reference === "string" ? document.entities.find(
        (candidate) => candidate.qualifiedId === reference || candidate.id === reference || candidate.uid === reference
      ) : void 0;
      if (!target || !isBpmnEntity(document, target, "bpmn::DataObject")) {
        pushDiagnostic4(diagnostics, "bpmn.rules", "error", "DataObjectReference must resolve to a compatible DataObject definition.", {
          entityUid: entity.uid,
          code: "bpmn.rules.validateReferencedDataElement"
        });
      }
    }
    if (isBpmnEntity(document, entity, "bpmn::DataStoreReference")) {
      const reference = entity.attributes?.values.dataStoreRef;
      const target = typeof reference === "string" ? document.entities.find(
        (candidate) => candidate.qualifiedId === reference || candidate.id === reference || candidate.uid === reference
      ) : void 0;
      if (!target || !isBpmnEntity(document, target, "bpmn::DataStore")) {
        pushDiagnostic4(diagnostics, "bpmn.rules", "error", "DataStoreReference must resolve to a compatible DataStore definition.", {
          entityUid: entity.uid,
          code: "bpmn.rules.validateReferencedDataElement"
        });
      }
    }
  }
  for (const relationship of document.relationships) {
    if (relationship.relationshipKind !== "explicit") {
      continue;
    }
    if (!relationship.typeRef.startsWith("bpmn::")) {
      pushDiagnostic4(diagnostics, "bpmn.rules", "error", "Strict BPMN profile mode requires explicit BPMN relationship types.", {
        relationshipUid: relationship.uid,
        code: "bpmn.rules.requireBpmnRelationshipTypeWhenInStrictMode"
      });
      continue;
    }
    const relationshipType = document.indexes.relationshipTypesByName.get(relationship.typeRef);
    if (!relationshipType) {
      pushDiagnostic4(diagnostics, "bpmn.rules", "error", `Unknown BPMN relationship type '${relationship.typeRef}'.`, {
        relationshipUid: relationship.uid,
        code: "bpmn.rules.requireKnownRelationshipType"
      });
      continue;
    }
    if (!relationship.target) {
      pushDiagnostic4(diagnostics, "bpmn.rules", "error", `BPMN relationship target '${relationship.targetRef ?? ""}' could not be resolved.`, {
        relationshipUid: relationship.uid,
        code: "bpmn.rules.requireResolvedTarget"
      });
      continue;
    }
    if (!relationship.id) {
      pushDiagnostic4(diagnostics, "bpmn.rules", "warning", "BPMN exported relationships should have stable ids; otherwise the exporter must derive deterministic ids.", {
        relationshipUid: relationship.uid,
        code: "bpmn.rules.warnIfRelationshipIdMissing"
      });
    }
    const sourceAllowed = relationshipType.sourceTypes.length === 0 || relationshipType.sourceTypes.some((type) => entityMatchesType2(relationship.source, type.name, hierarchy));
    const targetAllowed = relationshipType.targetTypes.length === 0 || relationshipType.targetTypes.some((type) => entityMatchesType2(relationship.target, type.name, hierarchy));
    if (!sourceAllowed || !targetAllowed) {
      pushDiagnostic4(
        diagnostics,
        "bpmn.rules",
        "error",
        `Relationship '${relationship.typeRef}' is not allowed for source '${relationship.source.typeRef ?? "unknown"}' and target '${relationship.target.typeRef ?? "unknown"}'.`,
        {
          relationshipUid: relationship.uid,
          code: "bpmn.rules.validateRelationshipAllowed"
        }
      );
    }
    if (relationship.typeRef === "bpmn::sequenceFlow") {
      const sourceScope = flowScopeOf(document, relationship.source);
      const targetScope = flowScopeOf(document, relationship.target);
      if (!sourceScope || !targetScope || sourceScope.uid !== targetScope.uid) {
        pushDiagnostic4(diagnostics, "bpmn.rules", "error", "BPMN sequenceFlow must connect FlowNodes in the same process/subprocess/choreography scope.", {
          relationshipUid: relationship.uid,
          code: "bpmn.rules.requireSameFlowScope"
        });
      }
      const sourceParticipant = participantOf(document, relationship.source, participantsByProcessUid);
      const targetParticipant = participantOf(document, relationship.target, participantsByProcessUid);
      if (sourceParticipant && targetParticipant && sourceParticipant.uid !== targetParticipant.uid) {
        pushDiagnostic4(diagnostics, "bpmn.rules", "error", "BPMN sequenceFlow must not cross participant boundaries.", {
          relationshipUid: relationship.uid,
          code: "bpmn.rules.rejectCrossParticipantSequenceFlow"
        });
      }
    }
    if (relationship.typeRef === "bpmn::messageFlow") {
      const hasCollaboration = document.entities.some(
        (candidate) => candidate.typeRef && isEntityOfType(document, candidate, "bpmn::Collaboration", true)
      );
      if (!hasCollaboration) {
        pushDiagnostic4(diagnostics, "bpmn.rules", "error", "BPMN messageFlow must belong to a collaboration context.", {
          relationshipUid: relationship.uid,
          code: "bpmn.rules.requireCollaborationContext"
        });
      }
      const sourceParticipant = participantOf(document, relationship.source, participantsByProcessUid);
      const targetParticipant = participantOf(document, relationship.target, participantsByProcessUid);
      if (sourceParticipant && targetParticipant && sourceParticipant.uid === targetParticipant.uid) {
        pushDiagnostic4(diagnostics, "bpmn.rules", "error", "BPMN messageFlow must connect interaction nodes across participants, not inside one participant.", {
          relationshipUid: relationship.uid,
          code: "bpmn.rules.rejectSameParticipantMessageFlow"
        });
      }
    }
  }
  for (const entity of document.entities) {
    if (isBpmnEntity(document, entity, "bpmn::StartEvent")) {
      const incomingSequenceFlows = entity.incoming.filter((relationship) => relationship.typeRef === "bpmn::sequenceFlow");
      if (incomingSequenceFlows.length > 0) {
        pushDiagnostic4(diagnostics, "bpmn.rules", "error", "BPMN StartEvent must not have incoming sequenceFlow.", {
          entityUid: entity.uid,
          code: "bpmn.rules.rejectIncomingSequenceFlow"
        });
      }
    }
    if (isBpmnEntity(document, entity, "bpmn::EndEvent")) {
      const outgoingSequenceFlows = entity.outgoing.filter((relationship) => relationship.typeRef === "bpmn::sequenceFlow");
      if (outgoingSequenceFlows.length > 0) {
        pushDiagnostic4(diagnostics, "bpmn.rules", "error", "BPMN EndEvent must not have outgoing sequenceFlow.", {
          entityUid: entity.uid,
          code: "bpmn.rules.rejectOutgoingSequenceFlow"
        });
      }
    }
    if (isBpmnEntity(document, entity, "bpmn::ExclusiveGateway") || isBpmnEntity(document, entity, "bpmn::InclusiveGateway")) {
      const outgoing = entity.outgoing.filter((relationship) => relationship.typeRef === "bpmn::sequenceFlow");
      const defaultFlow = entity.attributes?.values.default;
      if (outgoing.length > 1) {
        const withConditions = outgoing.filter((relationship) => relationship.attributes?.values.conditionExpression !== void 0);
        if (withConditions.length === 0 && defaultFlow === void 0) {
          pushDiagnostic4(diagnostics, "bpmn.rules", "warning", "Exclusive and Inclusive gateways with multiple outgoing flows should define conditions and, where appropriate, a default flow.", {
            entityUid: entity.uid,
            code: "bpmn.rules.warnIfMultipleOutgoingWithoutConditionsOrDefault"
          });
        }
      }
    }
    if (isBpmnEntity(document, entity, "bpmn::ParallelGateway")) {
      const outgoing = entity.outgoing.filter((relationship) => relationship.typeRef === "bpmn::sequenceFlow");
      if (outgoing.some((relationship) => relationship.attributes?.values.conditionExpression !== void 0)) {
        pushDiagnostic4(diagnostics, "bpmn.rules", "warning", "ParallelGateway outgoing flows should not use conditional expressions to encode decisions.", {
          entityUid: entity.uid,
          code: "bpmn.rules.warnIfOutgoingSequenceFlowsHaveConditions"
        });
      }
    }
  }
  return diagnostics;
}
function validateBpmnRules(document) {
  return baseBpmnDiagnostics(asResolvedDocument3(document));
}
function validateBpmnExportReadiness(document) {
  const resolved = asResolvedDocument3(document);
  const diagnostics = baseBpmnDiagnostics(resolved);
  for (const entity of resolved.entities) {
    if (!entity.typeRef || !entity.typeRef.startsWith("bpmn::")) {
      continue;
    }
    const entityType = resolved.indexes.entityTypesByName.get(entity.typeRef);
    if (!entityType || !stringAttribute2(entityType, "exportType")) {
      pushDiagnostic4(diagnostics, "bpmn.xml", "error", `Entity '${bpmnElementId(entity) ?? entity.uid}' is missing an exportType-capable BPMN type definition.`, {
        entityUid: entity.uid,
        code: "bpmn.xml.validateExportReadiness"
      });
    }
  }
  for (const relationship of resolved.relationships) {
    if (relationship.relationshipKind !== "explicit" || !relationship.typeRef.startsWith("bpmn::")) {
      continue;
    }
    const relationshipType = resolved.indexes.relationshipTypesByName.get(relationship.typeRef);
    if (!relationshipType || !stringAttribute2(relationshipType, "exportType")) {
      pushDiagnostic4(diagnostics, "bpmn.xml", "error", `Relationship '${relationship.typeRef}' is missing an exportType-capable BPMN definition.`, {
        relationshipUid: relationship.uid,
        code: "bpmn.xml.validateExportReadiness"
      });
    }
    if (!relationship.target) {
      pushDiagnostic4(diagnostics, "bpmn.xml", "error", "BPMN XML export requires stable source and target references for exported relationships.", {
        relationshipUid: relationship.uid,
        code: "bpmn.xml.validateExportReadiness"
      });
    }
  }
  return diagnostics;
}
function appendTaggedPayload(container, child) {
  const existing = container[child.tag];
  if (existing === void 0) {
    container[child.tag] = child.payload;
    return;
  }
  if (Array.isArray(existing)) {
    existing.push(child.payload);
    return;
  }
  container[child.tag] = [existing, child.payload];
}
function collectExportAttributes(entity, omitKeys) {
  const attributes = {};
  const omit = new Set(omitKeys);
  for (const [key, value] of Object.entries(entity.attributes?.values ?? {})) {
    if (omit.has(key) || key.startsWith("prov::") || key.startsWith("layout::") || key === "id" || key === "name") {
      continue;
    }
    if (Array.isArray(value) || value && typeof value === "object") {
      continue;
    }
    attributes[`@_${key}`] = primitiveValueToString2(value);
  }
  return attributes;
}
function exportDocumentation(entity) {
  if (!entity.description?.text) {
    return [];
  }
  return [
    {
      tag: "bpmn:documentation",
      payload: {
        "#text": entity.description.text
      }
    }
  ];
}
function exportEventDefinitionTargets(document, entity, entityTypesByName) {
  const results = [];
  for (const relationship of eventDefinitionRelationships(entity)) {
    const target = relationship.target;
    if (!target || !target.typeRef) {
      continue;
    }
    const targetType = entityTypesByName.get(target.typeRef);
    const exportType = entityExportType2(targetType, target);
    const payload = {
      "@_id": target.id ?? sanitizeIdentifier2(target.uid),
      ...collectExportAttributes(target, ["id"])
    };
    results.push({
      tag: `bpmn:${exportType}`,
      payload
    });
  }
  return results;
}
function exportRelationshipPayload(document, relationship, relationshipType, index) {
  if (!relationship.target) {
    return void 0;
  }
  const exportType = relationshipExportType2(relationshipType, relationship);
  if (exportType === "processRef" || exportType === "flowNodeRef" || exportType === "calledElementRef" || exportType === "eventDefinitionRef") {
    return void 0;
  }
  const payload = {
    "@_id": stableRelationshipIdentifier(relationship, index + 1),
    "@_sourceRef": bpmnElementReference(relationship.source),
    "@_targetRef": bpmnElementReference(relationship.target),
    ...collectExportAttributes(relationship.source, [])
  };
  delete payload["@_id"];
  const relationshipAttributes = relationship.attributes?.values ?? {};
  const serializedAttributes = {};
  for (const [key, value] of Object.entries(relationshipAttributes)) {
    if (key === "id" || key.startsWith("prov::") || key.startsWith("layout::")) {
      continue;
    }
    if (Array.isArray(value) || value && typeof value === "object") {
      continue;
    }
    serializedAttributes[`@_${key}`] = primitiveValueToString2(value);
  }
  return {
    tag: `bpmn:${exportType}`,
    payload: {
      "@_id": stableRelationshipIdentifier(relationship, index + 1),
      "@_sourceRef": bpmnElementReference(relationship.source),
      "@_targetRef": bpmnElementReference(relationship.target),
      ...serializedAttributes
    }
  };
}
function exportedProcessReference(participant) {
  const explicit = participant.outgoing.find((relationship) => relationship.typeRef === "bpmn::participantProcessRef" && relationship.target);
  if (explicit?.target) {
    return bpmnElementReference(explicit.target);
  }
  const attributeValue = participant.attributes?.values.processRef;
  return typeof attributeValue === "string" ? attributeValue : void 0;
}
function exportedCallActivityReference(entity) {
  const explicit = entity.outgoing.find((relationship) => relationship.typeRef === "bpmn::calledElementRef" && relationship.target);
  if (explicit?.target) {
    return bpmnElementReference(explicit.target);
  }
  const attributeValue = entity.attributes?.values.calledElementRef;
  return typeof attributeValue === "string" ? attributeValue : void 0;
}
function exportLaneMembershipRefs(lane) {
  return lane.outgoing.filter((relationship) => relationship.typeRef === "bpmn::laneMembership" && relationship.target).map((relationship) => bpmnElementReference(relationship.target));
}
function exportEntityPayload(document, entity, entityTypesByName, relationshipTypesByName) {
  if (!entity.typeRef) {
    return void 0;
  }
  const entityType = entityTypesByName.get(entity.typeRef);
  const exportType = entityExportType2(entityType, entity);
  if (!ROOT_EXPORT_TYPES.has(exportType) && !entity.parent && !isBpmnEntity(document, entity, "bpmn::Definitions")) {
    const rootEligible = isBpmnEntity(document, entity, "bpmn::FlowNode") || isBpmnEntity(document, entity, "bpmn::Artifact") || isBpmnEntity(document, entity, "bpmn::Lane") || isBpmnEntity(document, entity, "bpmn::LaneSet");
    if (rootEligible) {
      return void 0;
    }
  }
  const payload = {
    "@_id": bpmnElementId(entity) ?? sanitizeIdentifier2(entity.uid),
    ...entity.label.trim().length > 0 && exportType !== "textAnnotation" ? { "@_name": entity.label } : {},
    ...collectExportAttributes(entity, ["id", "name", "processRef", "calledElementRef"])
  };
  if (isBpmnEntity(document, entity, "bpmn::Participant")) {
    const processRef = exportedProcessReference(entity);
    if (processRef) {
      payload["@_processRef"] = processRef;
    }
  }
  if (isBpmnEntity(document, entity, "bpmn::CallActivity")) {
    const calledElementRef = exportedCallActivityReference(entity);
    if (calledElementRef) {
      payload["@_calledElement"] = calledElementRef;
    }
  }
  if (isBpmnEntity(document, entity, "bpmn::TextAnnotation")) {
    payload["bpmn:text"] = entity.description?.text ?? entity.label;
    delete payload["@_name"];
  }
  for (const documentation of exportDocumentation(entity)) {
    appendTaggedPayload(payload, documentation);
  }
  for (const child of entity.children) {
    const exportedChild = exportEntityPayload(document, child, entityTypesByName, relationshipTypesByName);
    if (exportedChild) {
      appendTaggedPayload(payload, exportedChild);
    }
  }
  for (const eventDefinition of exportEventDefinitionTargets(document, entity, entityTypesByName)) {
    appendTaggedPayload(payload, eventDefinition);
  }
  if (isBpmnEntity(document, entity, "bpmn::Lane")) {
    for (const reference of exportLaneMembershipRefs(entity)) {
      appendTaggedPayload(payload, {
        tag: "bpmn:flowNodeRef",
        payload: { "#text": reference }
      });
    }
  }
  if (isBpmnEntity(document, entity, "bpmn::Process") || isBpmnEntity(document, entity, "bpmn::SubProcess") || isBpmnEntity(document, entity, "bpmn::Collaboration")) {
    const relationships = document.relationships.filter((relationship) => {
      if (relationship.relationshipKind !== "explicit" || !relationship.target || relationship.typeRef === "bpmn::participantProcessRef" || relationship.typeRef === "bpmn::laneMembership" || relationship.typeRef === "bpmn::calledElementRef" || relationship.typeRef === "bpmn::eventDefinition") {
        return false;
      }
      if (relationship.typeRef === "bpmn::messageFlow") {
        return isBpmnEntity(document, entity, "bpmn::Collaboration") && nearestSharedAncestor(document, relationship.source, relationship.target, ["bpmn::Collaboration"])?.uid === entity.uid;
      }
      return nearestSharedAncestor(document, relationship.source, relationship.target, EDGE_CONTAINER_TYPES)?.uid === entity.uid;
    });
    relationships.forEach((relationship, index) => {
      const relationshipType = relationshipTypesByName.get(relationship.typeRef);
      const exportedRelationship = exportRelationshipPayload(document, relationship, relationshipType, index);
      if (exportedRelationship) {
        appendTaggedPayload(payload, exportedRelationship);
      }
    });
  }
  return {
    tag: `bpmn:${exportType}`,
    payload
  };
}
function exportBpmnXmlResult(document, options = {}) {
  const resolved = asResolvedDocument3(document);
  const diagnostics = validateBpmnExportReadiness(resolved);
  if (diagnostics.some((diagnostic) => diagnostic.severity === "error")) {
    return { value: "", diagnostics };
  }
  const entityTypesByName = resolved.indexes.entityTypesByName;
  const relationshipTypesByName = resolved.indexes.relationshipTypesByName;
  const definitionsEntity = resolved.entities.find((entity) => entity.typeRef && isEntityOfType(resolved, entity, "bpmn::Definitions", true));
  const definitionsId = options.definitionsId ?? definitionsEntity?.id ?? sanitizeIdentifier2(resolved.metadata?.title ?? "itm_bpmn_model");
  const targetNamespace = options.targetNamespace ?? (typeof definitionsEntity?.attributes?.values.targetNamespace === "string" ? definitionsEntity.attributes.values.targetNamespace : `https://example.org/${resolved.metadata?.defaultNamespace ?? "local"}`);
  const definitionsPayload = {
    "@_id": definitionsId,
    "@_targetNamespace": targetNamespace,
    ...resolved.metadata?.title ? { "@_name": resolved.metadata.title } : {},
    ...typeof definitionsEntity?.attributes?.values.exporter === "string" ? { "@_exporter": definitionsEntity.attributes.values.exporter } : {},
    ...typeof definitionsEntity?.attributes?.values.exporterVersion === "string" ? { "@_exporterVersion": definitionsEntity.attributes.values.exporterVersion } : {}
  };
  for (const entity of resolved.entities) {
    if (entity.parent || !entity.typeRef || isEntityOfType(resolved, entity, "bpmn::Definitions", true)) {
      continue;
    }
    const exportedEntity = exportEntityPayload(resolved, entity, entityTypesByName, relationshipTypesByName);
    if (exportedEntity) {
      appendTaggedPayload(definitionsPayload, exportedEntity);
    }
  }
  const builder = new XMLBuilder2({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    suppressEmptyNode: true,
    format: true,
    indentBy: "  "
  });
  const xmlObject = {
    "bpmn:definitions": {
      "@_xmlns:bpmn": BPMN_NAMESPACE_URI,
      "@_xmlns:bpmndi": BPMNDI_NAMESPACE_URI,
      "@_xmlns:dc": DC_NAMESPACE_URI,
      "@_xmlns:di": DI_NAMESPACE_URI,
      "@_xmlns:xsi": XML_SCHEMA_INSTANCE_NAMESPACE2,
      ...definitionsPayload
    }
  };
  return {
    value: `<?xml version="1.0" encoding="UTF-8"?>
${builder.build(xmlObject)}`,
    diagnostics
  };
}
function exportBpmnXml(document, options = {}) {
  const result = exportBpmnXmlResult(document, options);
  throwOnErrorDiagnostics(result.diagnostics, "BPMN XML export failed due to error diagnostics.", result.value);
  return result.value;
}
function importedProperties(record, omittedKeys) {
  const properties = {};
  const omitted = new Set(omittedKeys);
  for (const [key, value] of Object.entries(record)) {
    if (!key.startsWith("@_") || omitted.has(key)) {
      continue;
    }
    properties[key.slice(2)] = typeof value === "string" ? parseImportedPropertyValue2(value) : String(value);
  }
  return properties;
}
function createImportedEntity(defaultNamespace, typeRef, identifier, label, properties, parent, description) {
  return createEntity({
    uid: `entity:${sanitizeIdentifier2(identifier)}`,
    id: identifier,
    qualifiedId: `${defaultNamespace}::${identifier}`,
    namespacePrefix: defaultNamespace,
    localId: identifier,
    typeRef,
    label,
    ...Object.keys(properties).length > 0 ? { attributes: { values: properties } } : {},
    ...parent ? { parentId: parent.uid } : {},
    ...description ? {
      description: {
        format: "markdown",
        text: description
      }
    } : {}
  });
}
function parseImportedEntities(value, document, defaultNamespace, importedRelationships, parent) {
  for (const [tagName, rawChildren] of Object.entries(value)) {
    if (tagName.startsWith("@_") || tagName === "bpmn:documentation" || tagName === "documentation" || tagName === "bpmn:text" || tagName === "text") {
      continue;
    }
    const segments = tagName.split(":");
    const localTag = tagName.includes(":") ? segments[segments.length - 1] ?? tagName : tagName;
    const typeRef = BPMN_XML_ENTITY_TYPES[localTag];
    if (!typeRef) {
      if (BPMN_XML_RELATIONSHIP_TYPES[localTag]) {
        for (const record of asArray2(rawChildren)) {
          importedRelationships.push({
            tag: localTag,
            record
          });
        }
      }
      continue;
    }
    for (const record of asArray2(rawChildren)) {
      const identifier = typeof record["@_id"] === "string" ? record["@_id"] : sanitizeIdentifier2(`${localTag}_${document.entities.length + 1}`);
      const label = typeof record["@_name"] === "string" ? record["@_name"] : localTag === "textAnnotation" ? readXmlText2(record["text"] ?? record["bpmn:text"]) ?? identifier : identifier;
      const properties = importedProperties(record, ["@_id", "@_name"]);
      const documentation = readXmlText2(record["documentation"] ?? record["bpmn:documentation"]);
      if (localTag === "participant" && typeof record["@_processRef"] === "string") {
        properties.processRef = record["@_processRef"];
      }
      if (localTag === "callActivity" && typeof record["@_calledElement"] === "string") {
        properties.calledElementRef = record["@_calledElement"];
      }
      if (localTag === "boundaryEvent" && typeof record["@_attachedToRef"] === "string") {
        properties.attachedToRef = record["@_attachedToRef"];
      }
      if (localTag === "dataObjectReference" && typeof record["@_dataObjectRef"] === "string") {
        properties.dataObjectRef = record["@_dataObjectRef"];
      }
      if (localTag === "dataStoreReference" && typeof record["@_dataStoreRef"] === "string") {
        properties.dataStoreRef = record["@_dataStoreRef"];
      }
      const entity = createImportedEntity(defaultNamespace, typeRef, identifier, label, properties, parent, documentation);
      document.entities.push(entity);
      if (localTag === "participant" && typeof record["@_processRef"] === "string") {
        importedRelationships.push({
          tag: "participantProcessRef",
          record: {
            "@_id": `${identifier}_process_ref`,
            "@_sourceRef": identifier,
            "@_targetRef": record["@_processRef"]
          }
        });
      }
      if (localTag === "lane") {
        for (const reference of asArray2(record.flowNodeRef)) {
          if (typeof reference !== "string") {
            continue;
          }
          importedRelationships.push({
            tag: "laneMembership",
            record: {
              "@_id": `${identifier}_${sanitizeIdentifier2(reference)}_lane_membership`,
              "@_sourceRef": identifier,
              "@_targetRef": reference
            }
          });
        }
      }
      parseImportedEntities(record, document, defaultNamespace, importedRelationships, entity);
    }
  }
}
function importBpmnXmlResult(xml, options = {}) {
  const parser = new XMLParser2({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true,
    parseTagValue: false,
    trimValues: false
  });
  const parsed = parser.parse(xml);
  const definitions = parsed.definitions;
  const diagnostics = [];
  const defaultNamespace = options.defaultNamespace ?? "local";
  const namespaceUri = options.namespaceUri ?? `https://example.org/${defaultNamespace}`;
  if (!definitions) {
    const empty = createDocument();
    pushDiagnostic4(diagnostics, "bpmn.xml", "error", "BPMN XML does not contain a definitions root element.", {
      code: "bpmn.xml.import"
    });
    return {
      value: empty,
      diagnostics
    };
  }
  const document = createDocument({
    metadata: {
      ...typeof definitions["@_name"] === "string" ? { title: definitions["@_name"] } : {},
      defaultNamespace,
      values: {
        ...typeof definitions["@_id"] === "string" ? { bpmnDefinitionsId: definitions["@_id"] } : {},
        ...typeof definitions["@_targetNamespace"] === "string" ? { bpmnTargetNamespace: definitions["@_targetNamespace"] } : {}
      }
    },
    namespaces: [
      {
        prefix: BPMN_NAMESPACE_PREFIX,
        uri: BPMN_NAMESPACE_URI
      },
      {
        prefix: defaultNamespace,
        uri: namespaceUri
      }
    ],
    entities: [],
    relationships: []
  });
  const importedRelationships = [];
  parseImportedEntities(definitions, document, defaultNamespace, importedRelationships);
  const entitiesByIdentifier = /* @__PURE__ */ new Map();
  for (const entity of document.entities) {
    if (entity.id) {
      entitiesByIdentifier.set(entity.id, entity);
    }
    entitiesByIdentifier.set(entity.uid, entity);
    if (entity.qualifiedId) {
      entitiesByIdentifier.set(entity.qualifiedId, entity);
    }
  }
  importedRelationships.forEach(({ tag, record }, index) => {
    const typeRef = BPMN_XML_RELATIONSHIP_TYPES[tag] ?? (tag === "participantProcessRef" ? "bpmn::participantProcessRef" : tag === "laneMembership" ? "bpmn::laneMembership" : void 0);
    if (!typeRef) {
      return;
    }
    const identifier = typeof record["@_id"] === "string" ? record["@_id"] : `${tag}_${index + 1}`;
    const sourceReference = typeof record["@_sourceRef"] === "string" ? record["@_sourceRef"] : void 0;
    const targetReference = typeof record["@_targetRef"] === "string" ? record["@_targetRef"] : void 0;
    if (!sourceReference || !targetReference) {
      pushDiagnostic4(diagnostics, "bpmn.xml", "warning", `Skipped BPMN relationship '${identifier}' because sourceRef or targetRef is missing.`, {
        code: "bpmn.xml.import"
      });
      return;
    }
    const source = entitiesByIdentifier.get(sourceReference);
    const target = entitiesByIdentifier.get(targetReference);
    if (!source) {
      pushDiagnostic4(diagnostics, "bpmn.xml", "error", `Relationship '${identifier}' references unknown source '${sourceReference}'.`, {
        code: "bpmn.xml.import"
      });
      return;
    }
    const properties = importedProperties(record, ["@_id", "@_sourceRef", "@_targetRef"]);
    document.relationships.push(
      createRelationship({
        uid: `relationship:${sanitizeIdentifier2(identifier)}`,
        id: identifier,
        sourceId: source.uid,
        ...source.qualifiedId ? { sourceRef: source.qualifiedId } : {},
        ...target ? {
          targetId: target.uid,
          ...target.qualifiedId ? { targetRef: target.qualifiedId } : {}
        } : { targetRef: `${defaultNamespace}::${targetReference}` },
        typeRef,
        relationshipKind: "explicit",
        ...Object.keys(properties).length > 0 ? { attributes: { values: properties } } : {}
      })
    );
  });
  return {
    value: document,
    diagnostics
  };
}
function importBpmnXml(xml, options = {}) {
  const result = importBpmnXmlResult(xml, options);
  throwOnErrorDiagnostics(result.diagnostics, "BPMN XML import failed due to error diagnostics.", result.value);
  return result.value;
}
function importBpmnXmlAsItmResult(xml, options = {}) {
  const imported = importBpmnXmlResult(xml, options);
  const serialized = serializeDocumentResult(imported.value, options);
  return {
    value: serialized.value,
    diagnostics: [...imported.diagnostics, ...serialized.diagnostics]
  };
}
function importBpmnXmlAsItm(xml, options = {}) {
  const result = importBpmnXmlAsItmResult(xml, options);
  throwOnErrorDiagnostics(result.diagnostics, "BPMN XML to ITM conversion failed due to error diagnostics.", result.value);
  return result.value;
}

// src/std.ts
var STD_SCHEME_PREFIXES = ["std:", "std://"];
var STD_ASSETS = [
  {
    key: "profiles/archimate-basic-profile.itm",
    mediaType: "text/itm",
    relativePath: "examples/archimate/archimate-basic-profile.itm",
    aliases: [
      "archimate-basic-profile",
      "archimate/basic-profile",
      "profiles/archimate-basic-profile",
      "profiles/archimate-basic-profile.itm",
      "std:archimate-basic-profile",
      "std:archimate/basic-profile",
      "std:profiles/archimate-basic-profile",
      "std:profiles/archimate-basic-profile.itm",
      "std://archimate-basic-profile",
      "std://profiles/archimate-basic-profile",
      "std://profiles/archimate-basic-profile.itm"
    ]
  },
  {
    key: "profiles/bpmn20-basic-profile.itm",
    mediaType: "text/itm",
    relativePath: "examples/BPMN/bpmn20-basic-profile.itm",
    aliases: [
      "bpmn20-basic-profile",
      "bpmn/basic-profile",
      "profiles/bpmn20-basic-profile",
      "profiles/bpmn20-basic-profile.itm",
      "std:bpmn20-basic-profile",
      "std:bpmn/basic-profile",
      "std:profiles/bpmn20-basic-profile",
      "std:profiles/bpmn20-basic-profile.itm",
      "std://bpmn20-basic-profile",
      "std://profiles/bpmn20-basic-profile",
      "std://profiles/bpmn20-basic-profile.itm"
    ]
  }
];
var STD_ASSETS_BY_ALIAS = /* @__PURE__ */ new Map();
for (const asset of STD_ASSETS) {
  for (const alias of [asset.key, ...asset.aliases]) {
    STD_ASSETS_BY_ALIAS.set(normalizeStdAssetKey(alias), asset);
  }
}
function normalizeStdAssetKey(key) {
  let normalized = key.trim();
  for (const prefix of STD_SCHEME_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      normalized = normalized.slice(prefix.length);
      break;
    }
  }
  normalized = normalized.replace(/^\/+|^\.\/+|\/+$/gu, "");
  return normalized;
}
function toStdUri(key) {
  return `std://${normalizeStdAssetKey(key)}`;
}
function listStdAssets() {
  return STD_ASSETS.map((asset) => ({ ...asset, aliases: [...asset.aliases] }));
}
function readStdAsset(key) {
  const asset = STD_ASSETS_BY_ALIAS.get(normalizeStdAssetKey(key));
  if (!asset) {
    return void 0;
  }
  return {
    ...asset,
    aliases: [...asset.aliases]
  };
}
async function resolveStdAssetPaths(relativePath) {
  const [{ resolve, dirname }, { fileURLToPath }] = await Promise.all([
    import("path"),
    import("url")
  ]);
  const candidates = /* @__PURE__ */ new Set();
  if (typeof __filename === "string") {
    candidates.add(resolve(dirname(__filename), "..", relativePath));
  }
  try {
    const moduleUrl = (0, eval)("import.meta.url");
    if (typeof moduleUrl === "string" && moduleUrl.length > 0) {
      candidates.add(resolve(dirname(fileURLToPath(moduleUrl)), "..", relativePath));
    }
  } catch {
  }
  candidates.add(resolve(process.cwd(), relativePath));
  return [...candidates];
}
async function loadStdAsset(key) {
  const asset = readStdAsset(key);
  if (!asset) {
    return void 0;
  }
  const candidatePaths = await resolveStdAssetPaths(asset.relativePath);
  const { readFile } = await import("fs/promises");
  for (const candidatePath of candidatePaths) {
    try {
      const text = await readFile(candidatePath, "utf8");
      return {
        ...asset,
        text,
        uri: toStdUri(asset.key)
      };
    } catch {
    }
  }
  return void 0;
}
function createStdIncludeProvider() {
  return {
    name: "std",
    async load(target) {
      const asset = await loadStdAsset(target);
      if (!asset) {
        return void 0;
      }
      return {
        text: asset.text,
        uri: toStdUri(asset.key)
      };
    }
  };
}

export {
  ItmDiagnosticError,
  hasErrorDiagnostics,
  throwOnErrorDiagnostics,
  createDocumentIndexes,
  resolveDocument,
  getEntityByUid,
  getRelationshipByUid,
  isResolvedDocument,
  parseItmResult,
  parseItm,
  parseDocument,
  parseDocumentResult,
  composeDocument,
  composeText,
  composeDocumentResult,
  parseEffectiveDocument,
  parseDocumentResultAsync,
  createBaseUrlIncludeProvider,
  createBaseUrlSourceProvider,
  createAttributeBag2 as createAttributeBag,
  createEntity,
  createRelationship,
  createDocument,
  ItmDocumentBuilder,
  serializeDocumentResult,
  serializeDocument,
  serializeItm,
  createTypeHierarchy,
  expandEntityTypeSelection,
  expandRelationshipTypeSelection,
  isEntityOfType,
  isRelationshipOfType,
  getStableRelationshipId,
  createCanonicalGraph,
  validateArchiMateRules,
  validateArchiMateExchangeReadiness,
  exportArchiMateExchangeResult,
  exportArchiMateExchange,
  importArchiMateExchangeResult,
  importArchiMateExchange,
  importArchiMateExchangeAsItmResult,
  importArchiMateExchangeAsItm,
  validateBpmnRules,
  validateBpmnExportReadiness,
  exportBpmnXmlResult,
  exportBpmnXml,
  importBpmnXmlResult,
  importBpmnXml,
  importBpmnXmlAsItmResult,
  importBpmnXmlAsItm,
  listStdAssets,
  readStdAsset,
  loadStdAsset,
  createStdIncludeProvider
};
