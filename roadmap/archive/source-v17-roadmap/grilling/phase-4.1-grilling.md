# Phase 4.1 Grilling — Foundation Stabilization Before Contribution Registries

## Latest status

- **Status:** Proposed and accepted as a mandatory stabilization gate before Phase 5.
- **Created from grilling round:** 2026-05-25.
- **Scope:** Decisions discovered while grilling already-implemented phases up to Phase 4.
- **Current conclusion:** Do not move directly from Phase 4 to Phase 5. Insert Phase 4.1 to stabilize the foundation before contribution registries and package composition expand the architecture.
- **Append-friendly note:** Add new grilling rounds below the existing material. Do not rewrite earlier decisions unless a later section explicitly supersedes them.

## Phase number and title

**Phase 4.1 — Foundation Stabilization Before Contribution Registries**

## Short purpose of the phase

Phase 4.1 exists to convert accepted foundation corrections from the implemented Phase 0–4 work into concrete implementation contracts, validation gates, and package guidance before Phase 5 introduces contribution/capability-aware registration, `%require` diagnostics, and package composition.

The phase should not expand product scope. It should stabilize the architectural seams that Phase 5 will build on.

## Source context inspected

- `roadmap/RAPID.md`
- `roadmap/README.md`
- `roadmap/00_package_aware_roadmap.md`
- Existing project-format context for ITT/ITM, including diagnostics, packages, capabilities, styles, views, overlays, and processing model.

## Index of grilling topics

1. [Local artifact as a hard invariant](#1-local-artifact-as-a-hard-invariant)
2. [Phase completion means value completion](#2-phase-completion-means-value-completion)
3. [Local artifact packaging contract](#3-local-artifact-packaging-contract)
4. [Resource identity versus viewer/editor eligibility](#4-resource-identity-versus-viewereditor-eligibility)
5. [Phase 4 TF-MD dispatcher remains provisional](#5-phase-4-tf-md-dispatcher-remains-provisional)
6. [Single command/action spine](#6-single-commandaction-spine)
7. [Package public API boundaries](#7-package-public-api-boundaries)
8. [Phase 4.1 as mandatory stabilization gate](#8-phase-41-as-mandatory-stabilization-gate)
9. [Shared diagnostic contract](#9-shared-diagnostic-contract)
10. [Built-ins as default contributions](#10-built-ins-as-default-contributions)
11. [Active capability scope](#11-active-capability-scope)
12. [No shell-owned feature logic](#12-no-shell-owned-feature-logic)
13. [Migration audit of implemented Phase 0–4 code](#13-migration-audit-of-implemented-phase-04-code)
14. [Context-menu integration audit](#14-context-menu-integration-audit)
15. [Record this grilling as Phase 4.1](#15-record-this-grilling-as-phase-41)
16. [Unresolved questions](#unresolved-questions)
17. [Roadmap/spec/package implications](#roadmapspecpackage-implications)
18. [Risks and mitigations](#risks-and-mitigations)
19. [Validation checks / definition of done](#validation-checks--definition-of-done)
20. [Follow-up changes to apply later](#follow-up-changes-to-apply-later)

---

## 1. Local artifact as a hard invariant

### Question asked

Should the direct local artifact still be treated as a hard product invariant?

### Why it matters

The roadmap history shows that direct local launchability was briefly weakened and later restored. Phase 5 and later package/contribution work must not accidentally introduce assumptions that only work with a development server, remote imports, CDN loading, or module-script behavior that breaks the local/extension-hosted path.

### Recommended answer

Yes. TextForge must support both:

- a browser-served development/runtime path; and
- a packaged local or extension-hosted runtime path.

The local/extension path must be validated as a first-class product target, not treated as a packaging afterthought.

The important goal is not `file://` as a technology fetish. The goal is manual local launch or extension-hosted local execution without server trust or remote fetch assumptions.

### User decision

**Accepted.**

### Implications

- Future phases must preserve the local/extension-hosted execution envelope.
- Package/contribution mechanisms must avoid hidden runtime assumptions that only work in a served module graph.
- Local artifact validation remains a required gate.

---

## 2. Phase completion means value completion

### Question asked

Should Phase 0–4 treat completion as value completion, not contract/skeleton completion?

### Why it matters

Earlier phase history showed the risk of claiming closure based on shell wiring, contracts, or facades while promised user-facing value was incomplete. Future phases must not build on phantom capabilities.

### Recommended answer

Yes. A phase is complete only when its promised user-facing or architectural value exists through package APIs, is integrated where relevant, and has milestone-scoped validation.

Contract-only or façade-only work may be logged as progress, but not as phase completion unless the roadmap explicitly defines the phase as contract-only.

### User decision

**Accepted.**

### Implications

- Phase closure must include completion evidence.
- Skeleton-only deliverables must be clearly labelled as such.
- Future phase packages must state whether a deliverable is contract-only, integrated, or user-visible.

---

## 3. Local artifact packaging contract

### Question asked

Should the local artifact rule be stricter than “works today”?

### Why it matters

If local launch is only treated as observed behavior, it can regress silently. The roadmap history already includes a module-script regression and a correction toward a source-owned classic bootstrap path.

### Recommended answer

Yes. The shipped local artifact must be produced through a source-owned packaging path that is explicitly validated. It may use Vite internally, but the final artifact must not depend on dev-server semantics, root-relative assets, remote/CDN imports, or module-script behavior that breaks direct local or extension-hosted execution.

### User decision

**Accepted.**

### Implications

- Add or preserve a named local artifact packaging contract.
- `check-dist` or equivalent remains mandatory.
- Local artifact checks must cover root-relative assets, remote imports, and module-script regressions.
- Preview/CDP validation is useful but not sufficient by itself for the shipped-local path.

---

## 4. Resource identity versus viewer/editor eligibility

### Question asked

Should resource identity be separated from file type and viewer choice before Phase 5 builds more routing on top?

### Why it matters

A hard text/binary partition can make SVG, Markdown, ITM, images, generated outputs, and imported assets difficult to route correctly. Viewer/editor eligibility should not be permanently determined by one import-time classification.

### Recommended answer

Yes. A workspace resource has stable identity and multiple content facts, but viewer/editor eligibility must be contribution-driven.

Text/binary is storage/import metadata, not an exclusive capability decision. Surface routing should be based on declared capability predicates over resource facts.

Useful resource facts include:

- stable resource id;
- path/name/extension;
- media type;
- detected text decodability;
- user-declared mode;
- byte backing;
- text backing;
- source language;
- current surface/view state;
- diagnostics from import or detection.

### User decision

**Accepted.**

### Implications

- SVG can be eligible for both source editing and visual viewing.
- Ambiguous imports become diagnostics or user choices, not permanent misclassification.
- Phase 5 contribution manifests should declare resource predicates rather than relying on shell file-type logic.

---

## 5. Phase 4 TF-MD dispatcher remains provisional

### Question asked

Should Phase 4’s TF-MD dispatcher remain explicitly provisional?

### Why it matters

Phase 4 introduced Markdown-compatible fenced-block dispatch as a baseline. Phase 5 is expected to replace provisional block dispatch with contribution/capability-aware registration. If Phase 4’s dispatcher becomes permanent shell logic, Phase 5 will inherit a competing mini-framework.

### Recommended answer

Yes. Phase 4’s TF-MD block dispatcher is a compatibility bridge, not the final contribution system.

Every built-in block handler should already look like a future contribution:

- declared identity;
- supported fence names;
- input/output type;
- diagnostics;
- render behavior;
- local-artifact compatibility;
- capability association.

### User decision

**Accepted.**

### Implications

- Phase 5 should absorb or wrap Phase 4 handlers into contribution manifests.
- Hardcoded Phase 4 dispatch tables become technical debt to remove or isolate.
- Adding a block type later should not require central shell routing changes.

---

## 6. Single command/action spine

### Question asked

Should Phase 0–4 explicitly prohibit a second command system?

### Why it matters

Shell commands, context menus, surface actions, Markdown handlers, pipeline steps, and package contributions all converge around invocable behavior. If they grow separately, TextForge will develop duplicate routing, diagnostics, enablement, and capability logic.

### Recommended answer

Yes. TextForge should have one command/action abstraction with multiple invocation contexts:

- toolbar;
- command palette;
- context menu;
- pipeline step;
- Markdown block handler;
- surface action;
- package contribution.

Identity, diagnostics, enablement, capability checks, and registration should be unified even if different action kinds have different payloads.

### User decision

**Accepted.**

### Implications

- Phase 4 provisional dispatch adapts into the single command/action spine.
- Phase 5 contribution manifests register actions/capabilities into one model.
- Context menus become a projection of action metadata, not a separate callback path.

---

## 7. Package public API boundaries

### Question asked

Should source-level package exports be treated as temporary, not as a stable package contract?

### Why it matters

Source-level exports were accepted as a bootstrap mechanism. If they become permanent, future packages may depend on source layout, TypeScript details, or runtime shims instead of stable public APIs.

### Recommended answer

Yes. Source-level exports and parallel JS/TS runtime entrypoints are allowed only as bootstrap compatibility mechanisms.

The stable contract is the package public API, not the source file layout. Before contribution packages multiply, each package should have a clear build/export policy and tests that import through public package entrypoints.

### User decision

**Accepted.**

The user also stated that this should be addressed through the new Phase 4.1 before moving to the next step.

### Implications

- Cross-package `src/` imports are technical debt unless explicitly temporary.
- Phase 5 package contributions should import through declared public package entrypoints.
- Consumer-style import tests should exist for relevant packages.

---

## 8. Phase 4.1 as mandatory stabilization gate

### Question asked

Should Phase 4.1 be a mandatory stabilization gate, not an optional cleanup phase?

### Why it matters

If Phase 4.1 is optional, Phase 5 may proceed while merely “keeping in mind” the accepted corrections. The corrections are structural and affect exactly the abstractions Phase 5 will expand.

### Recommended answer

Yes. Phase 4.1 should be a mandatory stabilization gate before Phase 5.

Its purpose is to convert accepted foundation corrections into implementation-ready contracts, tests, and roadmap guidance without expanding product scope.

### User decision

**Accepted.**

### Implications

- Add Phase 4.1 before Phase 5.
- Update roadmap current status so Phase 4.1 is next.
- Make Phase 5 dependent on Phase 4.1 closure.

---

## 9. Shared diagnostic contract

### Question asked

Should Phase 4.1 normalize diagnostics before Phase 5?

### Why it matters

Phase 5 will add `%require` handling, contribution registration, missing-capability messages, and pipeline resolution. Without a shared diagnostic contract, each package may invent its own error strings and severities.

### Recommended answer

Yes. Phase 4.1 should define and apply one shared diagnostic contract across parser, workspace, Markdown block dispatch, pipeline, renderer, package, local artifact validation, and surface routing paths.

Minimum diagnostic fields should include:

- source;
- severity;
- message;
- file/resource where applicable;
- range or location where applicable;
- node/relationship/directive/action/contribution where applicable;
- rule or pipeline step where applicable;
- machine-readable code where useful.

Severity should at least support:

- `error`;
- `warning`;
- `information`;
- `observation`.

### User decision

**Accepted.**

### Implications

- Phase 5 `%require` diagnostics must use the shared shape.
- Missing handler, invalid block, unsupported resource/surface, failed local artifact, and package import violations should produce structured diagnostics.

---

## 10. Built-ins as default contributions

### Question asked

Should Phase 4.1 explicitly classify built-ins as default contributions?

### Why it matters

If built-ins remain shell-known special cases, Phase 5 will create two worlds: privileged built-ins and manifest-driven package contributions. That undermines the package-aware architecture.

### Recommended answer

Yes. Built-in should mean “preinstalled and active by default,” not “outside the contribution system.”

This applies to:

- Markdown handlers;
- asset viewers;
- source editors;
- diagram renderers;
- JSON/YAML support;
- shell actions;
- context-menu actions.

### User decision

**Accepted.**

### Implications

- Phase 4.1 should define a minimal default-contribution manifest shape.
- Existing built-ins get stable contribution IDs.
- The shell discovers built-ins through registration, not bespoke imports.

---

## 11. Active capability scope

### Question asked

Should Phase 4.1 enforce active capability scope before implementing richer packages?

### Why it matters

Registering every contribution globally would make short-name conflicts and ambiguous routing difficult. A document/session should only search and invoke contributions belonging to active capabilities.

### Recommended answer

Yes. Distinguish available contributions from active capabilities.

A document/session may know many contributions exist, but routing, completion, pipelines, Markdown block handlers, rules, and renderers should only use contributions belonging to the capabilities active for the current document or workspace.

Short-name conflicts inside the active set must fail with diagnostics. Inactive conflicts are allowed.

Built-ins such as Mermaid, math, and Graphviz may be active by default.

### User decision

**Accepted.**

### Implications

- Package/contribution registry tracks states such as available, active, disabled, missing dependency, and failed.
- Short names are resolved automatically from the active set.
- Qualified names are implementation/internal resolution results, not normally user-provided package syntax unless needed for disambiguation.
- Phase 5 `%require` diagnostics can distinguish not installed, installed but inactive, and ambiguous active short name.

---

## 12. No shell-owned feature logic

### Question asked

Should Phase 4.1 explicitly freeze the “no shell-owned feature logic” rule?

### Why it matters

This is the common root of many risks. If the shell owns routing, Markdown handlers, viewer choice, commands, diagnostics, or package behavior, every new phase adds more special cases.

### Recommended answer

Yes. The app shell may own layout, composition, persistence wiring, and user interaction surfaces, but it must not own feature-specific logic.

Feature behavior belongs in packages and is exposed through contribution manifests, default contributions, capability activation, and shared command/action/diagnostic contracts.

### User decision

**Accepted.**

### Implications

- Shell special cases are removed or explicitly marked as temporary adapters.
- Phase 5 must not add new shell-owned handler tables.
- Package specs must state which contributions they expose and how the shell discovers them.

---

## 13. Migration audit of implemented Phase 0–4 code

### Question asked

Should Phase 4.1 include a migration audit of already-implemented Phase 0–4 code?

### Why it matters

The accepted rules are architectural and implementation-relevant. If Phase 4.1 only updates roadmap text, Phase 5 can still inherit hidden code debt.

### Recommended answer

Yes. Phase 4.1 should include a focused migration audit of implemented Phase 0–4 code, with fixes where small and explicit follow-up tasks where larger.

Audit for:

- shell-owned handler tables;
- direct `src/` cross-package imports;
- feature-specific routing in app code;
- local artifact assumptions;
- hard text/binary viewer partitioning;
- ad hoc diagnostic strings;
- duplicate command/action concepts;
- built-ins that are not registered like contributions.

### User decision

**Accepted.**

### Implications

- Phase 4.1 gets an implementation audit and migration checklist.
- Phase 5 cannot start until blocking audit findings are fixed or consciously deferred.
- Audit findings should be tied to packages, not left as vague architecture warnings.

---

## 14. Context-menu integration audit

### Original issue

A question was initially phrased as if context menus might be future work. The user corrected this, noting that context menus should already have been implemented in Phase 3.7.

### Revised question asked

Should Phase 4.1 verify that the Phase 3.7 context-menu implementation uses the same command/action spine?

### Why it matters

The risk is not whether context menus exist. The risk is whether they were implemented as a separate UI callback system. If so, Phase 5 package actions may create a second or third invocation model.

### Recommended answer

Yes. Phase 4.1 should audit the Phase 3.7 context-menu implementation and ensure it is backed by the shared command/action contract, not by shell-owned feature callbacks.

### User decision

**Accepted.**

### Implications

- Existing context-menu actions are confirmed as action-registry-backed or migrated.
- Future package contributions can add context actions without shell code changes.
- Context menus become a UI projection of the action registry.

---

## 15. Record this grilling as Phase 4.1

### Question asked

Should this grilling be recorded as a single pre-Phase-5 foundation document, rather than split artificially across Phases 0, 1, 2, 3.x, and 4?

### Why it matters

The grilling produced a cross-cutting conclusion: implemented foundation work up to Phase 4 needs a stabilization gate before Phase 5. Splitting this into several earlier phase documents would obscure the actionable outcome.

### Recommended answer

Yes. Record this grilling as:

```text
roadmap/grilling/phase-4.1-grilling.md
```

Title it:

```text
Phase 4.1 — Foundation Stabilization Before Contribution Registries
```

Explain that it covers decisions discovered while grilling already-implemented Phases 0–4.

### User decision

**Accepted.**

### Implications

- One focused grilling document is created for Phase 4.1.
- Earlier implemented phases remain historically preserved.
- No artificial per-phase documents are created unless a later grilling round targets a specific earlier phase.

---

## Unresolved questions

No blocking unresolved questions remain from this grilling round.

Potential details to settle during roadmap update:

1. Exact package-by-package deliverables for Phase 4.1.
2. Exact diagnostic TypeScript interface name and package owner.
3. Whether capability activation is stored per document, per workspace, per session, or all three.
4. Minimum default contribution manifest fields.
5. How much migration work must be completed in Phase 4.1 versus logged for later.
6. Whether Phase 4.1 should include a small automated structural check for shell coupling or rely on review checklists initially.

---

## Roadmap/spec/package implications

### Roadmap implications

- Insert Phase 4.1 before Phase 5.
- Make Phase 5 depend on Phase 4.1 closure.
- Update the current status block in `RAPID.md` to point to Phase 4.1 as the next recommended step.
- Add RAPID decision/progress rows append-only; do not rewrite historical entries.
- Keep Phase 4.1 focused on stabilization, not new user-facing feature expansion.

### Spec implications

Phase 4.1 should define or clarify:

- local artifact packaging contract;
- shared diagnostic contract;
- resource facts versus viewer/editor eligibility;
- contribution/default-contribution manifest minimum;
- active capability scope;
- command/action metadata contract;
- no shell-owned feature logic invariant;
- public package API boundary rule.

### Package implications

Likely affected packages:

- `@textforge/core`
  - shared diagnostic type;
  - command/action core contracts;
  - resource facts/capability predicates if placed centrally.
- `@textforge/workspace`
  - resource identity and content facts;
  - import/detection diagnostics.
- `@textforge/surfaces`
  - viewer/editor eligibility predicates;
  - open-with routing through contribution/capability rules.
- `@textforge/markdown`
  - provisional dispatcher isolation;
  - Markdown block handlers as default contributions.
- `@textforge/pipeline`
  - pipeline step registration through active capabilities;
  - diagnostics for missing/ambiguous steps.
- `@textforge/assets`
  - asset viewers as default contributions;
  - SVG dual eligibility.
- `@textforge/editors`
  - source editors as default contributions;
  - language support as capability-scoped contribution.
- `@textforge/diagrams`
  - Mermaid/Graphviz/SVG renderers as default contributions where applicable.
- `apps/textforge-web`
  - shell must consume contribution/action registries;
  - remove or mark temporary feature-owned routing;
  - preserve local artifact checks.

---

## Risks and mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Phase 4.1 becomes a broad redesign | Delays Phase 5 and expands scope | Keep Phase 4.1 limited to stabilization contracts, audits, and blocking migrations |
| Shell coupling remains hidden | Phase 5 builds on special cases | Add explicit audit checklist and blocking findings |
| Built-ins stay privileged | Contribution system becomes second-class | Register built-ins as default contributions |
| Diagnostics remain ad hoc | `%require` and package failures become inconsistent | Introduce shared diagnostic contract before Phase 5 |
| Capability activation is too complex too early | Stabilization becomes over-engineered | Define minimal active/available/disabled/missing/failed state model only |
| Local artifact validation regresses | Product invariant weakens silently | Keep deterministic local artifact checks in verification |
| Public API boundary remains porous | Packages depend on source layout | Add consumer-style import tests and flag `src/` cross-package imports |
| Context menus stay separate | Duplicates command/action model | Audit/migrate Phase 3.7 context-menu implementation onto shared action spine |
| Resource routing stays tied to text/binary | SVG and mixed resources remain awkward | Use resource facts plus surface capability predicates |

---

## Validation checks / definition of done

Phase 4.1 is done when all of the following are true:

1. **Roadmap insertion**
   - Phase 4.1 exists in the roadmap before Phase 5.
   - Phase 5 explicitly depends on Phase 4.1 closure.
   - RAPID current status points to Phase 4.1 as the next step.
   - RAPID updates are append-only.

2. **Local artifact contract**
   - A source-owned local artifact bootstrap path is documented.
   - Validation rejects root-relative built assets where relevant.
   - Validation rejects module-script regressions in the local artifact where relevant.
   - No remote/CDN imports are required by the shipped local artifact.

3. **Phase completion rule**
   - Roadmap language confirms phase closure requires promised value and validation evidence.
   - Phase 4.1 itself has concrete validation evidence.

4. **Resource identity and eligibility**
   - Workspace resources expose content facts separately from viewer/editor eligibility.
   - Surface routing uses predicates/capabilities rather than a hard text/binary partition.
   - SVG can be validated as both source-openable and visual-viewable where relevant.

5. **Diagnostic contract**
   - Shared diagnostic shape exists.
   - Parser/Markdown/resource/surface/pipeline/package errors use or adapt to it.
   - Missing handler and ambiguous capability cases produce structured diagnostics.

6. **Command/action spine**
   - Shared action metadata exists.
   - Toolbar/context menu/surface actions are backed by the same action model or explicitly adapted.
   - No second command/action registry is introduced.

7. **Default contributions**
   - Existing built-ins have stable contribution IDs.
   - Built-ins are registered as default contributions.
   - The shell discovers built-ins through registration or a documented temporary adapter.

8. **Active capability scope**
   - Registry distinguishes available and active capabilities/contributions.
   - Short-name conflicts inside the active set fail with diagnostics.
   - Inactive conflicts are permitted.

9. **Package API boundary**
   - Stable package public entrypoints are documented.
   - Cross-package `src/` imports are removed, blocked, or explicitly logged as temporary.
   - Consumer-style import tests exist where appropriate.

10. **Migration audit**
    - Audit checklist is completed against implemented Phase 0–4 code.
    - Blocking findings are fixed before Phase 5 or consciously deferred with RAPID entries.
    - Findings are tied to packages/files.

---

## Follow-up changes to apply later

1. Add `roadmap/grilling/phase-4.1-grilling.md`.
2. Add Phase 4.1 to `roadmap/00_package_aware_roadmap.md`.
3. Update relevant package guides for Phase 4.1 responsibilities.
4. Update `roadmap/RAPID.md` append-only with:
   - decision to insert Phase 4.1;
   - action to perform Phase 4.1 implementation audit;
   - current status pointing to Phase 4.1.
5. Add or update specs/contracts for:
   - diagnostics;
   - command/action spine;
   - resource facts and surface predicates;
   - default contribution manifest;
   - capability activation.
6. Add validation checks for:
   - local artifact packaging;
   - no shell-owned feature routing;
   - no duplicate command systems;
   - public package imports;
   - diagnostics shape;
   - active capability conflict handling.
7. Only after Phase 4.1 closure, proceed to Phase 5 contribution registries and package composition.

---

## Append log

### 2026-05-25 — Initial grilling round

Accepted decisions:

- Local artifact remains a hard invariant.
- Phase completion means value completion.
- Local artifact rule becomes an explicit packaging contract.
- Resource identity is separated from viewer/editor eligibility.
- Phase 4 TF-MD dispatcher remains provisional.
- TextForge uses one command/action spine.
- Source-level package exports are temporary bootstrap debt.
- Phase 4.1 is mandatory before Phase 5.
- Diagnostics normalization is part of Phase 4.1.
- Built-ins are default contributions.
- Active capability scope is established before richer packages.
- No shell-owned feature logic is a hard invariant.
- Phase 4.1 includes a migration audit of implemented Phase 0–4 code.
- Existing Phase 3.7 context menus must be audited against the command/action spine.
- This grilling is recorded as `roadmap/grilling/phase-4.1-grilling.md`.
