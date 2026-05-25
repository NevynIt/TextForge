# Phase 5 Grilling — Contribution registries and package composition

## Latest status

**Status:** Round 1 complete.  
**Phase:** 5.  
**Phase title:** Contribution registries and package composition.  
**Selected concern tested:** whether the implementing agent has enough architectural intent to implement Phase 5 without guessing, and whether any major design issue is about to be introduced.

**Current conclusion:** Phase 5 is implementable, but only if it is tightened around a canonical contribution/capability model, a document-scoped capability resolver, deterministic resolution, explicit diagnostics, and fixture-driven validation. The main risk is not package composition itself; it is accidentally creating parallel local registries or global “everything active” lookup behavior that later phases would have to undo.

## Index of grilling topics

1. Canonical contribution manifest and capability schema
2. Package and contribution status model
3. Bundled static package composition boundary
4. Local names, derived canonical IDs, and pipeline reference rules
5. Capabilities separated from contributions
6. Document capability context
7. Capability activation defaults
8. Deterministic resolution order
9. Pure resolver function
10. `%require` as activation/check only
11. Markdown fenced-block handler contract
12. Diagnostic source identity
13. Package inspector/status UI
14. Golden fixture validation
15. Intermediate value reopening through active capabilities

---

## Phase purpose

Phase 5 turns the Phase 3.3 command substrate and Phase 4 provisional Markdown/diagram dispatch into a broader contribution-pack system.

It should allow bundled TextForge packages to declare capabilities and contributions through manifests, while the application shell composes those packages without owning feature logic. It should also replace provisional Markdown fenced-block dispatch with capability-aware block-handler registration and add `%require` diagnostics, while keeping includes, repositories, remote package loading, and ITM publication out of scope for this phase.

---

## Grilling log

### Topic 1 — Canonical contribution manifest and capability schema

**Question asked:**  
Should Phase 5 define a single canonical `ContributionManifest` / capability schema in `@textforge/core`, and require every Phase 5 package to register through that schema?

**Why it matters:**  
Without one canonical schema, `markdown`, `pipeline`, `surfaces`, and `ui` may each create local registries. That would make Phase 5 work superficially but undermine later package composition.

**Recommended answer:**  
Yes. `@textforge/core` should own the canonical contribution-pack contract.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

- `@textforge/core` owns `ContributionManifest`, package identity, dependency declarations, capability declarations, contribution descriptors, and registry composition rules.
- `@textforge/surfaces`, `@textforge/pipeline`, and `@textforge/markdown` consume manifest contributions instead of inventing package-local plugin formats.
- `%require` diagnostics resolve against the same capability registry used by surfaces and pipelines.

---

### Topic 2 — Package and contribution status model

**Question asked:**  
Should Phase 5 treat package dependency/capability failures as a first-class package status model with visible UI and diagnostics?

**Why it matters:**  
Missing dependencies, disabled packages, incompatible versions, duplicate contribution names, conflicts, and failed initialization must be visible and testable.

**Recommended answer:**  
Yes. Define a first-class status model, such as:

```ts
type ContributionStatus =
  | "available"
  | "disabled"
  | "missingDependency"
  | "incompatibleVersion"
  | "conflict"
  | "failedToInitialize";
```

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

- `@textforge/core` defines package/contribution status and failure reasons.
- `@textforge/ui` exposes status feedback.
- `@textforge/pipeline` and `@textforge/markdown` use the same diagnostics/status system.
- Optional package failures should not crash the workbench, but conflicting contributions should be blocked.

---

### Topic 3 — Bundled static package composition boundary

**Question asked:**  
Should Phase 5 explicitly limit package composition to bundled workspace packages only, not user-installed plugins or remote package loading?

**Why it matters:**  
Phase 5 should not accidentally become a plugin marketplace, remote loader, or runtime package installer.

**Recommended answer:**  
Yes. Phase 5 should be static composition of trusted bundled packages.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

- Contribution manifests are TypeScript/JavaScript exports from workspace packages already included in the build.
- The registry composes imported manifests; it does not fetch or install code.
- `%require` checks or activates available capabilities; it never triggers remote loading.
- Runtime plugin loading remains out of scope.

---

### Topic 4 — Local names, derived canonical IDs, and pipeline reference rules

**Question asked:**  
Should contribution IDs be globally unique and namespaced by package, with conflicts producing blocking diagnostics?

**Recommended answer:**  
Use package-qualified canonical IDs internally, but do not force package authors or pipelines to always write them manually.

**User decision:**  
Accepted with modification.

**Decision captured:**  

- Packages declare local contribution names.
- The registry automatically derives canonical IDs from package identity plus local name.
- Pipelines may use short names when unambiguous in the active document context.
- Pipelines may use qualified names when a specific implementation is required.
- Short-name conflicts in the selected/active context must fail.
- Qualified names should be determined automatically by the registry, not manually duplicated by package authors.

**Roadmap/spec/package implications:**

- Add `ContributionLocalName`, `PackageId`, and derived `ContributionId` rules.
- Pipeline step resolution supports both short names and qualified references.
- No “last registered wins” behavior.
- Conflict diagnostics must explain which active capabilities/contributions created ambiguity.

---

### Topic 5 — Capabilities separated from contributions

**Question asked:**  
Should Phase 5 make capability names separate from implementation contribution names?

**Why it matters:**  
A capability says what the environment can do. A contribution is a specific implementation. `%require` should usually activate/check capabilities, not bind directly to one implementation.

**Recommended answer:**  
Yes. Capabilities and contributions must be separate.

**User decision:**  
Accepted with refinement.

**Decision captured:**

- Capabilities are distinct from contributions.
- One capability may be associated with multiple contributions.
- Markdown, ITM, pipeline engines, and other processors search pipeline steps and contributions only from capabilities active for the current document.
- Different implementations with the same short name may coexist globally.
- Short-name conflicts among selected/active capabilities must fail.
- Qualified contribution references remain available for deliberate implementation binding.

**Roadmap/spec/package implications:**

- `@textforge/core` defines distinct `CapabilityId`, contribution local name, and derived contribution ID concepts.
- `%require` activates/checks capabilities by default.
- Pipeline step lookup operates over contributions exposed by the document’s active capabilities.
- Validation must include multiple implementations for one capability.

---

### Topic 6 — Document capability context

**Question asked:**  
Should Phase 5 introduce an explicit document capability context computed from document type, front matter/directives, active package defaults, and `%require` declarations?

**Why it matters:**  
The previous decision requires a clear answer to “which capabilities are active for this document?”

**Recommended answer:**  
Yes. Define a `DocumentCapabilityContext` and make it the only lookup scope used by Markdown, ITM, pipelines, and surfaces.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

- `@textforge/core` or `@textforge/pipeline` defines the document-scoped active capability model.
- `@textforge/markdown` parses `%require` and feeds requirements into the resolver.
- `@textforge/pipeline` resolves step names through the active document context.
- `@textforge/surfaces` can expose surfaces based on document context.
- The global registry remains broad; document execution is narrowed by active capabilities.

---

### Topic 7 — Capability activation defaults

**Question asked:**  
Should Phase 5 define capability activation as explicit by default, rather than automatically enabling every bundled capability?

**Why it matters:**  
If all bundled capabilities are active everywhere, the document-scoped context becomes almost meaningless and conflicts become more likely.

**Recommended answer:**  
Yes, explicit by default, with conservative defaults.

**User decision:**  
Accepted with baseline defaults.

**Decision captured:**

Capabilities are globally available but document-scoped active. Activation is explicit by default, except for a small Markdown baseline set:

- base Markdown;
- Mermaid fenced blocks;
- math / KaTeX-style math blocks;
- Graphviz / DOT fenced blocks.

Everything else should require `%require`, document profile, workspace default profile, or another explicit activation path.

**Roadmap/spec/package implications:**

- Define a default Markdown capability profile.
- Inactive capabilities do not participate in short-name resolution.
- Mermaid, math, and Graphviz are active by default for Markdown documents.
- Conflicts among active default handlers must fail loudly.

---

### Topic 8 — Deterministic resolution order

**Question asked:**  
Should Phase 5 require deterministic capability resolution order, even when there is no conflict?

**Why it matters:**  
Diagnostics, UI ordering, fallback choices, and package inspector views must not depend on JavaScript import order or object enumeration accidents.

**Recommended answer:**  
Yes. Use deterministic ordering, for example:

1. document-explicit capabilities;
2. document/profile capabilities;
3. workspace/app default capabilities;
4. core/base capabilities;
5. within each group, sort by canonical contribution ID.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

- Stable registry sorting.
- Deterministic diagnostics ordering.
- Deterministic package inspector and command/menu/surface ordering.
- Reordered imports must produce identical context output.

---

### Topic 9 — Pure resolver function

**Question asked:**  
Should Phase 5 require the app shell to build the active document capability context from a pure resolver function, with no package-specific conditionals in Markdown, pipeline, or surface code?

**Why it matters:**  
If each package computes active capabilities independently, `%require`, pipelines, and surfaces will drift.

**Recommended answer:**  
Yes. Define a pure resolver, conceptually:

```ts
resolveDocumentContributionContext({
  document,
  globalRegistry,
  workspaceDefaults,
  appDefaults,
  explicitRequirements,
});
```

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

- `@textforge/core` owns the resolver contract and fixtures.
- Markdown parses `%require` and passes requirements into the resolver.
- Pipeline resolves steps only through the returned context.
- Surfaces ask the context which contributions are active/compatible.
- Same document plus same registry must produce the same result regardless of import order.

---

### Topic 10 — `%require` as activation/check only

**Question asked:**  
Should Phase 5 define `%require` as a capability activation/check directive only, not as an include/import/fetch directive?

**Why it matters:**  
Includes, repositories, and richer composition are out of scope for Phase 5. `%require` must not become a loader.

**Recommended answer:**  
Yes. `%require` means:

```text
This document requires capability X to be active.
If X is available, activate it in the document context.
If X is unavailable, produce diagnostics.
Do not fetch, install, import, or load remote code.
```

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

- `@textforge/markdown` parses `%require` into capability requirements.
- `@textforge/core` resolves those requirements against bundled registered capabilities.
- `%include`, `%repository`, package fetching, and remote code loading remain out of Phase 5.
- Security validation confirms `%require` cannot trigger network/package loading.

---

### Topic 11 — Markdown fenced-block handler contract

**Question asked:**  
Should Phase 5 explicitly define the minimum Markdown fenced-block handler contract that contribution packages must implement?

**Why it matters:**  
Without a handler contract, Mermaid/Graphviz/math may work only through hardcoded conventions and be difficult to extend later.

**Recommended answer:**  
Yes. Define a minimal handler contract, for example:

```ts
type MarkdownBlockHandler = {
  localName: string;
  languages: string[];
  providedCapabilities: CapabilityId[];
  accepts(block, documentContext): boolean;
  render(block, documentContext): RenderResult | Diagnostic[];
};
```

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

- `@textforge/markdown` replaces hardcoded dispatch with contribution-driven handlers.
- Handler resolution is capability-scoped, deterministic, and diagnostic-producing.
- Unknown fenced blocks remain preserved as code, with diagnostics only where appropriate.
- Default Mermaid, DOT/Graphviz, and math handlers are bundled contributions.

---

### Topic 12 — Diagnostic source identity

**Question asked:**  
Should Phase 5 require every contribution to declare its diagnostic source identity and emit diagnostics in the shared TextForge diagnostic shape?

**Why it matters:**  
The UI must be able to tell whether a problem came from the registry, resolver, Markdown engine, pipeline step resolver, or a specific block handler.

**Recommended answer:**  
Yes. Diagnostic source identity should be stable and usually derived from the canonical contribution ID.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

- `@textforge/core` defines diagnostic source ID rules and shared metadata fields.
- Diagnostics may include package, contribution, capability, file/range, and suggested fix.
- `@textforge/ui` can group diagnostics by package/contribution.
- Missing capability, ambiguous short name, and unknown fenced block diagnostics must be source-identifiable.

---

### Topic 13 — Package inspector/status UI

**Question asked:**  
Should Phase 5 require a small package inspector/status UI, even if basic?

**Why it matters:**  
Diagnostics are reactive. The user/agent also needs to inspect global packages, active document capabilities, inactive capabilities, exposed contributions, and conflicts.

**Recommended answer:**  
Yes, minimal only.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

The UI should expose at least:

- package status;
- provided capabilities;
- active capabilities for the current document;
- contributions exposed by active capabilities;
- conflicts, missing requirements, and diagnostics.

No package installation, marketplace, remote loading, or editable package configuration is required.

---

### Topic 14 — Golden fixture validation

**Question asked:**  
Should Phase 5 require golden fixture packages/documents as the main validation mechanism?

**Why it matters:**  
This is architectural plumbing; it can look functional while being internally wrong.

**Recommended answer:**  
Yes. Use compact fixture packages and documents to validate the resolver, registry, Markdown handlers, pipeline step resolution, diagnostics, and package inspector read model.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

Required fixtures should cover:

- available but inactive capability;
- `%require` activates available capability;
- `%require` missing capability creates diagnostic;
- two inactive contributions with same short name do not fail;
- two active contributions with same short name do fail;
- qualified pipeline reference resolves a specific implementation;
- disabled package removes contributions from document context;
- package inspector read model is deterministic.

---

### Topic 15 — Intermediate value reopening

**Question asked:**  
Should Phase 5 define intermediate value reopening as a capability-scoped operation, not just a generic “open output” action?

**Why it matters:**  
Pipeline intermediates may be Mermaid source, SVG, graph model, JSON, resolved Markdown, diagnostic traces, or other values. They should reopen through the best compatible active surface, not through an ad-hoc text dump.

**Recommended answer:**  
Yes. Reopen intermediate values through the resolved document contribution context.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

- `@textforge/pipeline` intermediate values must carry representation metadata.
- `@textforge/surfaces` exposes compatible surfaces through active capabilities.
- `@textforge/ui` uses normal open-with/status behavior for intermediates.
- If no active surface can open an intermediate, fall back to safe text/JSON where possible and emit a diagnostic.

---

## Unresolved questions

No blocking unresolved questions remain from this grilling round.

Non-blocking details to settle during implementation/spec editing:

1. Exact TypeScript names for `DocumentCapabilityContext`, `ContributionManifest`, `CapabilityId`, and resolver result types.
2. Exact syntax for qualified pipeline references.
3. Whether `%require` supports version ranges in Phase 5 or only preserves a version field for later.
4. Whether the package inspector appears as a panel, diagnostics drawer section, command result view, or inspector tab.
5. Exact default Markdown capability IDs for base Markdown, Mermaid, math, and Graphviz.

---

## Roadmap/spec/package implications summary

### `@textforge/core`

Add or clarify:

- canonical contribution manifest schema;
- package identity;
- capability identity;
- contribution local names;
- derived canonical contribution IDs;
- contribution status model;
- dependency/capability resolution;
- document-scoped contribution/capability resolver;
- deterministic ordering;
- shared diagnostic source identity rules;
- UI-friendly registry/context read model.

### `@textforge/pipeline`

Add or clarify:

- pipeline step loading from active document capabilities;
- short-name and qualified-name resolution;
- conflict diagnostics;
- intermediate value representation metadata;
- intermediate reopening through active surfaces;
- fixture coverage for short-name ambiguity and qualified binding.

### `@textforge/markdown`

Add or clarify:

- `%require` parsing as capability activation/check only;
- default active Markdown capability profile;
- replacement of provisional fenced-block dispatcher with capability-aware block handlers;
- minimum Markdown block handler contract;
- diagnostics for missing processors/renderers/profiles/block handlers;
- unknown fenced block preservation.

### `@textforge/surfaces`

Add or clarify:

- package-provided surface registration;
- active-context surface compatibility;
- surface selection for pipeline intermediate reopening;
- fallback behavior when no active surface can open a value.

### `@textforge/ui`

Add or clarify:

- minimal package/capability inspector;
- package/contribution status display;
- grouped diagnostics by package/contribution/capability;
- deterministic ordering in UI views.

### `@textforge/security-profile`

Add or clarify:

- `%require` cannot fetch, install, import, or load remote code;
- package composition is bundled/static in Phase 5;
- no new filesystem, network, or external package-loading behavior.

---

## Risks and mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Parallel local registries | Later phases would have incompatible contribution systems. | Make `@textforge/core` own the canonical manifest and resolver. |
| Global “everything active” lookup | Document-scoped capability decisions would be meaningless. | Use explicit document capability context; inactive capabilities do not participate. |
| Silent conflict resolution | “Last one wins” creates fragile, non-debuggable behavior. | Short-name conflicts fail when active; qualified references are allowed. |
| `%require` becomes a loader | Scope/security risk and premature repository/plugin system. | Define `%require` as activation/check only. |
| Handler contracts remain implicit | Later fenced-block types become hardcoded exceptions. | Define minimum Markdown block handler interface. |
| Diagnostics lack provenance | Users cannot tell which package/contribution failed. | Stable diagnostic source identity per contribution. |
| UI hides architecture state | Agent/user cannot inspect active capabilities or failures. | Add minimal package inspector/status UI. |
| Tests miss architectural edge cases | Phase appears complete but resolver behavior is wrong. | Golden fixtures for active/inactive/conflict/qualified/missing cases. |
| Intermediate reopening bypasses surfaces | Pipeline UX becomes inconsistent and hardcoded. | Reopen through active capability/surface context. |

---

## Validation checks / definition of done

Phase 5 should not be considered complete unless all of the following are true:

1. **Canonical manifest:** every Phase 5 contribution is registered through the canonical core manifest shape.
2. **Static bundled scope:** all composed packages are bundled workspace packages; no runtime install or remote loading exists.
3. **Document context:** active capabilities are resolved per document through one pure resolver.
4. **Default Markdown context:** Markdown activates base Markdown, Mermaid, math, and Graphviz capabilities by default.
5. **Explicit activation:** non-default capabilities are inactive unless activated by `%require`, profile/default configuration, or equivalent explicit mechanism.
6. **Capability/contribution separation:** capabilities and contributions are modeled separately; one capability may expose multiple contributions.
7. **Short-name resolution:** short names work only when unambiguous inside the active document context.
8. **Qualified resolution:** qualified references bind to a specific implementation.
9. **Conflict handling:** active short-name conflicts produce blocking diagnostics; inactive conflicts do not fail.
10. **Deterministic output:** same registry and document produce identical resolver output regardless of package import order.
11. **Markdown handler contract:** fenced-block handlers use the contribution/capability-aware handler contract.
12. **`%require` diagnostics:** missing requirements produce source-identifiable diagnostics.
13. **No fetch behavior:** `%require` cannot fetch, install, import, or load remote code.
14. **Package inspector:** UI exposes package status, active capabilities, exposed contributions, and conflicts for the current document.
15. **Intermediate reopening:** pipeline intermediate values reopen through active compatible surfaces or safe fallback with diagnostics.
16. **Golden fixtures:** fixture packages/documents cover available inactive capability, activation, missing capability, inactive conflict, active conflict, qualified binding, disabled package, and inspector read-model determinism.
17. **RAPID update:** implementation decisions and deviations are appended to `roadmap/RAPID.md`.
18. **Package guide updates:** if implementation changes the plan, affected package guides are updated in the same commit.

---

## Follow-up changes to apply later

When the roadmap/spec/package files are revised, apply the following changes for Phase 5 only:

1. Add a subsection to the Phase 5 roadmap entry explaining global registry versus document-scoped active capability context.
2. Expand `@textforge/core` Phase 5 guidance with canonical manifests, statuses, IDs, resolver, diagnostics, and read model.
3. Expand `@textforge/pipeline` Phase 5 guidance with context-scoped step resolution and intermediate reopening.
4. Expand `@textforge/markdown` Phase 5 guidance with `%require` semantics, default active capabilities, and block handler contract.
5. Expand `@textforge/surfaces` Phase 5 guidance with active-context-compatible surface registration.
6. Expand `@textforge/ui` Phase 5 guidance with the minimal package inspector/status UI.
7. Add fixture requirements to Phase 5 definition of done.
8. Add a security note that Phase 5 package composition is static and bundled; `%require` cannot load code.
9. Keep `%include`, `%repository`, remote package loading, ITM publication, and runtime plugin installation explicitly out of Phase 5.
10. Add a RAPID entry recording the decisions from this grilling round.

---

## Append-friendly continuation area

Future grilling rounds for Phase 5 should append below this point.

### Round 2

_Not started._
