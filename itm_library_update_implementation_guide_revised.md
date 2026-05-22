# ITM Library Update Implementation Guide

## Purpose

This guide is for an implementation agent updating `NevynIt/ITM`, the `@textforge/itm` library consumed by TextForge.

The objective is to make ITM the single source of truth for parsing, include handling, composition according to existing ITM directives, diagnostics, and core model behavior.

Do **not** introduce a parallel URL-style resolver-chain model or new composition-helper abstraction unless it directly implements existing ITM format semantics. The rework should build on the directive mechanisms already present in ITM: `%include`, `%repository`, `%package`, `%using`, and `%require`.

## Decisions to implement

1. ITM remains a standalone npm package.
2. ITM include handling belongs inside the ITM library.
3. Host applications such as TextForge may provide source-access services to ITM, but those services must be shaped around ITM repository/include/package semantics, not around a new generic resolver-chain abstraction.
4. Diagnostics for missing, blocked, circular, or conflicting includes should come from the ITM library.
5. The ITM library should expose clear public APIs for parsing one document and for producing the effective document/model when ITM directives require composition.

---

## Work package 1 — Confirm package version and release target

### Current state

The ITM package is already named `@textforge/itm` and currently declares version `0.3.0`.

### Required changes

1. Keep package name:

```json
"name": "@textforge/itm"
```

2. Keep or update version as appropriate:

```json
"version": "0.3.0"
```

3. Ensure the package exports all public APIs needed by TextForge:

```ts
export * from "./model";
export * from "./diagnostics";
export * from "./resolved";
export * from "./resolve";
export * from "./compose";
export * from "./builder";
export * from "./factories";
export * from "./parse";
export * from "./serialize";
export * from "./extensions";
export * from "./archimate";
export * from "./bpmn";
export * from "./std";
```

4. If include/composition behavior changes are breaking, consider publishing as `0.4.0`; otherwise keep `0.3.x`.

### Acceptance criteria

- `npm run build` succeeds.
- `npm run test` succeeds.
- TextForge can import the required public ITM APIs from `@textforge/itm`.

---

## Work package 2 — Extend parse/effective-document options without inventing a new resolver model

### Current parse options

The parser already has `ParseItmOptions` with fields such as `uri`, `generateImplicitRelationships`, `defaultNamespace`, and `strict`.

### Required changes

Extend the options only as needed to let the ITM library process existing ITM directives:

```ts
export interface ParseItmOptions {
  uri?: string;
  generateImplicitRelationships?: boolean;
  defaultNamespace?: string;
  strict?: boolean;
  maxIncludeDepth?: number;

  // Optional host access point, if needed, but it must serve ITM's
  // %repository / %include / %package / %using semantics.
  sourceProvider?: ItmSourceProvider;
}
```

The name `ItmSourceProvider` is only a suggested name. The important design constraint is that the API must not become a parallel generic resolver-chain system. It should support ITM concepts such as repository declarations, include targets, packages, using scopes, and requirements.

If parsing remains synchronous today, introduce async variants rather than forcing all existing callers to become async.

Recommended shape:

```ts
export function parseDocumentResult(
  text: string,
  options?: ParseItmOptions
): ItmProcessingResult<ItmDocument>;

export async function parseDocumentResultAsync(
  text: string,
  options?: ParseItmOptions
): Promise<ItmProcessingResult<ItmDocument>>;
```

If a separate effective-document API is introduced, it should be named around ITM semantics rather than generic composition helpers, for example:

```ts
export async function parseEffectiveDocument(
  text: string,
  options?: ParseItmOptions
): Promise<ItmProcessingResult<ItmDocument>>;
```

### Acceptance criteria

- Existing synchronous parser behavior remains available or migration is clearly documented.
- New async path can process `%include` and related source/package directives.
- TextForge can call the include-aware/effective-document path.
- Include-related diagnostics are included in the returned processing result.
- No generic chain of URL-scheme resolvers is introduced.

---

## Work package 3 — Implement include handling and effective document construction inside ITM

### Target behavior

When an ITM document contains `%include`, the ITM library should:

1. Parse the root document.
2. Identify `%include` directives.
3. Interpret include targets in the context of existing ITM semantics, including `%repository` declarations if present.
4. Use the host source-access service only to fetch material that the ITM library has decided is required.
5. Parse included documents.
6. Construct the effective document/model according to ITM semantics.
7. Track source ranges and source URIs.
8. Detect missing includes.
9. Detect circular includes.
10. Enforce max include depth.
11. Return a single effective `ItmDocument` plus diagnostics.

### Existing ITM directives to respect

The implementation must align with the existing directive model:

- `%include` brings another ITM document into the effective document/model.
- `%repository` declares where external material can come from.
- `%package` defines reusable packages/profiles.
- `%using` applies packages/profiles and scopes.
- `%require` declares required capabilities, packages, or plugins.

Do not bypass these with a separate resolver-chain model.

### Required diagnostics

Add or reuse diagnostics for:

- missing include;
- circular include;
- blocked include;
- maximum include depth exceeded;
- duplicate IDs after effective-document construction;
- include parse errors;
- source-provider runtime errors;
- repository/package/using/require conflicts, if applicable.

Example diagnostic:

```ts
{
  source: "@textforge/itm",
  severity: "error",
  message: "Include './common.itm' could not be resolved.",
  directiveName: "include",
  range: includeDirective.source
}
```

### Circular include behavior

Use normalized source identity.

Example:

```text
root.itm -> common.itm -> root.itm
```

This should emit a circular include diagnostic and avoid infinite recursion.

### Acceptance criteria

- Missing include returns a diagnostic.
- Circular include returns a diagnostic.
- Source-provider exception returns a diagnostic, not an uncaught exception.
- Max include depth is enforced.
- Included entities are present in the effective document according to intended semantics.
- Source URI/range metadata remains available.
- `%repository`, `%package`, `%using`, and `%require` behavior is not contradicted by the implementation.

---

## Work package 4 — Clarify include and directive semantics

### Questions to encode in tests/docs

The implementation should make these behaviors explicit:

1. Are included documents merged into the root namespace, or do they retain their own document identity?
2. Are `%metadata` blocks from includes preserved, ignored, or attached under include metadata?
3. How are duplicate local IDs handled?
4. How are default namespaces applied across included documents?
5. Are includes transitive?
6. Can includes include packages/profiles only, model content only, or both?
7. Are include targets resolved relative to the including document URI?
8. How do `%repository` declarations affect include/package lookup?
9. How do `%using` scopes affect what is imported from a package/profile?
10. What diagnostics are emitted for unsatisfied `%require` directives?

### Recommended defaults

- Includes are transitive.
- Targets are resolved relative to the including document URI unless ITM repository semantics say otherwise.
- Each included document is parsed with its own URI.
- Diagnostics should identify the source URI.
- Duplicate IDs should produce diagnostics.
- Namespace qualification should prevent accidental collisions where possible.
- Effective-document construction should preserve enough provenance for viewers/editors to map back to source.

### Acceptance criteria

- Include semantics are documented.
- Repository/package/using/require semantics are documented enough for TextForge integration.
- Tests cover relative resolution, transitive includes, duplicate IDs, and at least one repository/package/using case if those features are in scope.

---

## Work package 5 — Update diagnostics model if needed

### Required capabilities

Diagnostics should be able to point to:

- source URI/file;
- include directive;
- repository declaration;
- package/profile;
- using directive;
- requirement directive;
- entity;
- relationship;
- validation rule;
- source-access/runtime issue.

The existing model already has source ranges and diagnostic linkages. Extend only if needed.

Potential additions:

```ts
includeTarget?: string;
includeStack?: string[];
uri?: string;
repositoryRef?: string;
packageRef?: string;
usingScope?: string;
requirementRef?: string;
```

### Acceptance criteria

- Include and directive diagnostics are usable by TextForge without TextForge-specific translation.
- Source range includes enough data for editor navigation.
- Diagnostics are serializable.

---

## Work package 6 — Tests

Add tests for include and effective-document behavior.

### Required test cases

1. Resolves a direct include from a host-provided source-access service.
2. Emits diagnostic for missing include.
3. Detects circular include.
4. Enforces max include depth.
5. Resolves relative paths against the including document URI, or against repository semantics where applicable.
6. Preserves source URI in source ranges or diagnostics.
7. Handles source-access exception as a diagnostic.
8. Constructs an effective document containing included entities and relationships.
9. Detects duplicate IDs after effective-document construction.
10. Handles transitive includes.
11. Covers `%repository` behavior if source lookup depends on repository declarations.
12. Covers `%package` / `%using` behavior if package import is in scope.
13. Covers `%require` diagnostics if requirements are in scope.

### Example test intent

```ts
const documents = new Map([
  ["root.itm", "%include common.itm\n&root Root"],
  ["common.itm", "&common Common"]
]);

const sourceProvider = {
  // Shape this around the actual ITM source-access contract,
  // not a generic URL-scheme resolver chain.
  read(request) {
    const uri = resolveRelative(request.fromUri, request.target);
    const text = documents.get(uri);
    return text ? { uri, text } : undefined;
  }
};

const result = await parseEffectiveDocument(documents.get("root.itm")!, {
  uri: "root.itm",
  sourceProvider
});

assert.equal(result.diagnostics.some(d => d.severity === "error"), false);
assert.ok(result.value.entities.some(e => e.id === "common"));
```

Use the actual test framework style already used in the repository.

### Acceptance criteria

- Tests fail before the implementation and pass after it.
- Tests do not depend on TextForge types.
- Circular, missing, relative, transitive, duplicate-ID, and source-provider-error cases are covered.

---

## Work package 7 — Documentation updates

Update:

- `README.md`, if present;
- `indented_text_model_format_description_updated.md`;
- examples using `%include`;
- package API docs.

### Required documentation content

Document:

1. Basic `%include` behavior.
2. `%repository` interaction with include/package lookup.
3. `%package` and `%using` behavior where relevant.
4. `%require` diagnostics where relevant.
5. Host source-access integration, without describing it as a URL-scheme resolver chain.
6. Missing/circular include diagnostics.
7. Relative path behavior.
8. Effective-document/provenance behavior.
9. Example in-memory host source provider.
10. Example local file-system provider in Node, if appropriate for `./node`.

### Acceptance criteria

- A TextForge developer can understand how to provide source access to the ITM library.
- A Node user can understand how to resolve includes from files.
- `%include` examples are executable in tests or examples.
- The docs do not introduce a second model that competes with `%repository`, `%package`, `%using`, or `%require`.

---

## Work package 8 — Optional Node file-system source provider

Because ITM exports `./node`, consider adding a Node file-system source provider there.

### Suggested API

```ts
export function createFileSystemSourceProvider(options?: {
  rootDir?: string;
  allowedExtensions?: string[];
}): ItmSourceProvider;
```

### Security note

The Node provider should avoid path traversal outside `rootDir` unless explicitly allowed.

### Acceptance criteria

- Browser build does not include Node file-system dependencies.
- Node export can serve local file includes according to ITM semantics.
- Tests cover path traversal blocking if implemented.

---

## Suggested implementation order

1. Confirm package/export target.
2. Define the minimal source-access contract needed by existing ITM directive semantics.
3. Extend parse/effective-document options.
4. Implement async include-aware/effective-document path.
5. Implement diagnostics for missing/circular/depth/source-access errors.
6. Clarify and test repository/package/using/require semantics where in scope.
7. Add include/effective-document tests.
8. Update docs and examples.
9. Export public APIs.
10. Optionally add Node file-system source provider.
11. Publish `@textforge/itm` version suitable for TextForge.

---

## Definition of done

The ITM library update is complete when:

- Include handling is implemented inside ITM.
- Host applications can provide source access without importing TextForge types.
- The implementation follows existing ITM directive semantics.
- No generic URL-scheme resolver-chain abstraction has been introduced.
- Missing/circular/blocked include cases emit ITM diagnostics.
- Effective-document construction is deterministic and documented.
- Public APIs are exported.
- Tests cover direct, missing, circular, relative, transitive, duplicate-ID, and source-access-error cases.
- TextForge can consume the released package through npm.
