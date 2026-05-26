import {
  ItmDiagnosticError,
  ItmDocumentBuilder,
  composeDocument,
  composeDocumentResult,
  composeText,
  createAttributeBag,
  createBaseUrlIncludeProvider,
  createBaseUrlSourceProvider,
  createCanonicalGraph,
  createDocument,
  createDocumentIndexes,
  createEntity,
  createRelationship,
  createStdIncludeProvider,
  createTypeHierarchy,
  expandEntityTypeSelection,
  expandRelationshipTypeSelection,
  exportArchiMateExchange,
  exportArchiMateExchangeResult,
  exportBpmnXml,
  exportBpmnXmlResult,
  getEntityByUid,
  getRelationshipByUid,
  getStableRelationshipId,
  hasErrorDiagnostics,
  importArchiMateExchange,
  importArchiMateExchangeAsItm,
  importArchiMateExchangeAsItmResult,
  importArchiMateExchangeResult,
  importBpmnXml,
  importBpmnXmlAsItm,
  importBpmnXmlAsItmResult,
  importBpmnXmlResult,
  isEntityOfType,
  isRelationshipOfType,
  isResolvedDocument,
  listStdAssets,
  loadStdAsset,
  parseDocument,
  parseDocumentResult,
  parseDocumentResultAsync,
  parseEffectiveDocument,
  parseItm,
  parseItmResult,
  readStdAsset,
  resolveDocument,
  serializeDocument,
  serializeDocumentResult,
  serializeItm,
  throwOnErrorDiagnostics,
  validateArchiMateExchangeReadiness,
  validateArchiMateRules,
  validateBpmnExportReadiness,
  validateBpmnRules
} from "./chunk-754ESDHV.js";

// src/compose-node.ts
function createLocalFileIncludeProvider(options = {}) {
  return {
    name: "local-file",
    async load(target, context) {
      if (/^[A-Za-z][A-Za-z0-9+.-]*:\/\//u.test(target) && !/^file:\/\//u.test(target)) {
        return void 0;
      }
      const [{ dirname, isAbsolute, resolve }, { fileURLToPath }, fs] = await Promise.all([
        import("path"),
        import("url"),
        import("fs/promises")
      ]);
      const readText = options.readText ?? ((path) => fs.readFile(path, "utf8"));
      let resolvedPath;
      if (target.startsWith("file://")) {
        resolvedPath = fileURLToPath(target);
      } else if (isAbsolute(target)) {
        resolvedPath = target;
      } else if (context.sourceDocument.uri?.startsWith("file://")) {
        resolvedPath = resolve(dirname(fileURLToPath(context.sourceDocument.uri)), target);
      } else if (context.sourceDocument.uri && isAbsolute(context.sourceDocument.uri)) {
        resolvedPath = resolve(dirname(context.sourceDocument.uri), target);
      } else if (options.baseDirectory) {
        resolvedPath = resolve(options.baseDirectory, target);
      }
      if (!resolvedPath) {
        return void 0;
      }
      try {
        return {
          text: await readText(resolvedPath),
          uri: resolvedPath
        };
      } catch {
        return void 0;
      }
    }
  };
}
function createFileSystemSourceProvider(options = {}) {
  return {
    async read(request) {
      const [{ dirname, extname, isAbsolute, normalize, relative, resolve, sep }, { fileURLToPath }, fs] = await Promise.all([
        import("path"),
        import("url"),
        import("fs/promises")
      ]);
      const readText = options.readText ?? ((path) => fs.readFile(path, "utf8"));
      const target = request.target;
      if (/^[A-Za-z][A-Za-z0-9+.-]*:\/\//u.test(target) && !/^file:\/\//u.test(target)) {
        return void 0;
      }
      let resolvedPath;
      if (target.startsWith("file://")) {
        resolvedPath = fileURLToPath(target);
      } else if (isAbsolute(target)) {
        resolvedPath = target;
      } else if (request.fromUri?.startsWith("file://")) {
        resolvedPath = resolve(dirname(fileURLToPath(request.fromUri)), target);
      } else if (request.fromUri && isAbsolute(request.fromUri)) {
        resolvedPath = resolve(dirname(request.fromUri), target);
      } else if (options.rootDir) {
        resolvedPath = resolve(options.rootDir, target);
      }
      if (!resolvedPath) {
        return void 0;
      }
      const normalizedPath = normalize(resolvedPath);
      if (options.rootDir) {
        const normalizedRoot = normalize(resolve(options.rootDir));
        const relativePath = relative(normalizedRoot, normalizedPath);
        if (relativePath === ".." || relativePath.startsWith(`..${sep}`) || relativePath.includes(`${sep}..${sep}`)) {
          return void 0;
        }
      }
      if (options.allowedExtensions && options.allowedExtensions.length > 0 && !options.allowedExtensions.includes(extname(normalizedPath))) {
        return void 0;
      }
      try {
        return {
          text: await readText(normalizedPath),
          uri: normalizedPath
        };
      } catch {
        return void 0;
      }
    }
  };
}
export {
  ItmDiagnosticError,
  ItmDocumentBuilder,
  composeDocument,
  composeDocumentResult,
  composeText,
  createAttributeBag,
  createBaseUrlIncludeProvider,
  createBaseUrlSourceProvider,
  createCanonicalGraph,
  createDocument,
  createDocumentIndexes,
  createEntity,
  createFileSystemSourceProvider,
  createLocalFileIncludeProvider,
  createRelationship,
  createStdIncludeProvider,
  createTypeHierarchy,
  expandEntityTypeSelection,
  expandRelationshipTypeSelection,
  exportArchiMateExchange,
  exportArchiMateExchangeResult,
  exportBpmnXml,
  exportBpmnXmlResult,
  getEntityByUid,
  getRelationshipByUid,
  getStableRelationshipId,
  hasErrorDiagnostics,
  importArchiMateExchange,
  importArchiMateExchangeAsItm,
  importArchiMateExchangeAsItmResult,
  importArchiMateExchangeResult,
  importBpmnXml,
  importBpmnXmlAsItm,
  importBpmnXmlAsItmResult,
  importBpmnXmlResult,
  isEntityOfType,
  isRelationshipOfType,
  isResolvedDocument,
  listStdAssets,
  loadStdAsset,
  parseDocument,
  parseDocumentResult,
  parseDocumentResultAsync,
  parseEffectiveDocument,
  parseItm,
  parseItmResult,
  readStdAsset,
  resolveDocument,
  serializeDocument,
  serializeDocumentResult,
  serializeItm,
  throwOnErrorDiagnostics,
  validateArchiMateExchangeReadiness,
  validateArchiMateRules,
  validateBpmnExportReadiness,
  validateBpmnRules
};
