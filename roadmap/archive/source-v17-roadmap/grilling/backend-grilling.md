# Backend-Optional Architecture Grilling

**Document path:** `roadmap/grilling/backend-grilling.md`  
**Session:** Backend-optional architecture whitepaper grilling  
**Source whitepaper:** `textforge_backend_optional_architecture_whitepaper.md`  
**Repository context:** `NevynIt/TextForge`, branch `rewrite/v2-monorepo`  
**Roadmap scope:** Integrate the backend-optional architecture proposal without rewriting the roadmap during grilling.  
**Status:** Round 1 completed; decisions recorded; roadmap not yet updated.

---

## Latest status

The backend-optional architecture proposal is accepted as a **cross-cutting roadmap extension**, not as a replacement for existing roadmap phases.

The update must preserve existing roadmap ordering, existing `X.Y` sub-phases, and already accepted Phase 5 contribution/capability work. Any new or touched `X.Y` phase must be made explicit as a proper roadmap entry with scope, dependencies, outputs, non-goals, packages, and validation checks.

The central accepted direction is:

> TextForge remains local/offline-first. Backend support is introduced later as an optional enterprise profile behind stable frontend-safe contracts, provider abstractions, explicit security invariants, and backend-enforced policy.

---

## Purpose of the changes

The backend-optional architecture change introduces a path for TextForge to support enterprise deployment without weakening the local/offline security model.

The change clarifies how TextForge can evolve from a local, browser-managed workspace into an optional enterprise-backed system with:

- provider-backed resources;
- revision-aware and changeset-based persistence;
- logical repository resolution;
- backend-served frontend deployment;
- server-side identity and policy;
- private and group spaces;
- backend-mediated GitLab access;
- backend-mediated AI;
- user settings;
- service folders;
- advisory locks;
- explicit security/accreditation invariants.

The purpose of this grilling round was to remove ambiguity before integrating the proposal into the roadmap.

---

## Index of grilling topics

| # | Topic | Decision status |
|---:|---|---|
| 1 | Relationship to existing Phase 5 | Accepted |
| 2 | Resource providers vs contribution/capability mechanisms | Accepted |
| 3 | Package split timing | Accepted with refinement |
| 4 | Provider allowlists per distribution/profile | Accepted |
| 5 | Service folders as data-plane only | Accepted |
| 6 | User settings before backend identity, never as permissions | Accepted |
| 7 | Neutral identity contract before Entra implementation | Accepted |
| 8 | GitLab fully backend-mediated | Accepted |
| 9 | AI read/suggest first, non-mutating initially | Accepted |
| 10 | One backend origin per enterprise app | Accepted |
| 11 | Backend writes through changesets | Accepted |
| 12 | Enterprise container before real backend services | Accepted |
| 13 | Local/offline mode forbids File System Access API | Accepted |
| 14 | Backend-optional security invariants | Accepted |
| 15 | Private/group spaces backend-only in implementation | Accepted with refinement |
| 16 | `%repository` format not over-constrained | Accepted with refinement |
| 17 | Repository diagnostics distinguish failure modes | Accepted |
| 18 | Preserve current roadmap numbering/order | Accepted with refinement |
| 19 | Backend `X.Y` phases as full roadmap rows | Accepted |
| 20 | Reuse existing resource facts model | Accepted |
| 21 | Changesets are multi-file units | Accepted |
| 22 | Changesets can include generated artifacts when explicit | Accepted |
| 23 | Soft collaboration before live editing | Accepted with refinement |
| 24 | File locks as advisory time-bound leases | Accepted with refinement |
| 25 | Browser extension as thin wrapper | Accepted |
| 26 | Backend manifest as capability source of truth | Accepted |
| 27 | Manifest compatibility fail-fast | Accepted |
| 28 | Optional capabilities affect UI/actions, not document semantics | Accepted |

---

## Round 1 decisions

### Q1 — Does this update reopen Phase 5, or extend after the accepted Phase 5 scope?

**Why it matters:**  
There is already accepted Phase 5 work around contribution/capability registries. The backend whitepaper must not silently replace it.

**Recommended answer:**  
Do not reopen or replace accepted Phase 5. Treat the backend whitepaper as a cross-cutting extension that builds on existing roadmap decisions.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

- Existing Phase 5 remains binding.
- Backend/resource-provider work must build on the Phase 5 contribution/capability foundation.
- The backend grilling record is cross-cutting, not a replacement for phase-specific grilling.
- Avoid creating a second registry mechanism parallel to Phase 5.

---

### Q2 — Should “resource provider” be a workspace abstraction, not a contribution/capability mechanism?

**Why it matters:**  
Without a clear boundary, TextForge could accidentally create two extension systems: one for executable contributions and one for resources.

**Recommended answer:**  
Yes. `ResourceProvider` is a workspace/storage/repository abstraction. It must not register commands, renderers, validators, transformers, pipelines, or UI contributions.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

- `workspace-core` or the existing workspace package owns `ResourceDescriptor`, `ResourceProvider`, dirty state, revisions, and changesets.
- `repository-core` owns logical repository resolution.
- Phase 5 contribution registries remain the only mechanism for editor/render/transform/validation capabilities.
- Resource capabilities describe factual permissions/affordances, not executable contributions.

---

### Q3 — Should the whitepaper’s package split create new packages immediately, or map onto existing roadmap packages first?

**Why it matters:**  
The whitepaper proposes finer package names, but the roadmap already has package structures. Immediate package explosion could create churn.

**Recommended answer:**  
Do not split everything immediately. Treat the package split as a planned dependency/security-boundary roadmap, implemented progressively.

**User decision:**  
Accepted with refinement: include the package split explicitly in the roadmap so it is a carefully planned decision, not a last-minute implementation choice.

**Roadmap/spec/package implications:**  

- The roadmap must show the intended package split explicitly.
- Initial implementation may keep logical slices inside existing packages.
- New packages should be created when they represent real dependency/security boundaries.
- Backend-only adapters must never leak into frontend-safe packages.
- Package split planning should be visible in the roadmap even if actual extraction is staged.

---

### Q4 — Should each distribution have an explicit provider allowlist?

**Why it matters:**  
A generic provider mechanism could otherwise weaken local/offline security by enabling arbitrary backend, GitLab, AI, or network providers.

**Recommended answer:**  
Yes. Each architecture profile/distribution variant should declare an explicit provider allowlist.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

- Local static: IndexedDB, ZIP import/export, generated assets, local service folders only.
- Browser extension: same as local static, with stricter CSP/permissions.
- Enterprise container: approved backend provider only.
- Backend server: GitLab, AI, Entra, private/group spaces, service execution as backend-side capabilities.
- Frontend must not dynamically discover arbitrary network providers.

---

### Q5 — Should service folders be data-plane only, with job creation/status kept as explicit APIs?

**Why it matters:**  
Service folders are useful for file-shaped inputs/outputs, but should not become fake command APIs.

**Recommended answer:**  
Yes. Use service folders for artifacts; keep control-plane operations explicit.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

- `workspace-services` defines service-folder layout only.
- Explicit APIs handle create job, cancel job, live status, changeset submission, locks, approvals, authorization, and AI request policy.
- Local service folders may simulate outputs but do not become the command system.
- Validation should reject language implying authentication, approvals, or AI policy are controlled by writing files.

---

### Q6 — Should user settings be introduced before backend identity, but never interpreted as permissions?

**Why it matters:**  
User settings are useful early for UI control, but could be confused with capability or permission grants.

**Recommended answer:**  
Yes. Settings are frontend personalization only; server policy and profile capabilities remain authoritative.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

- `user-settings-core` and local settings can arrive before SSO.
- `identity-contract` remains separate.
- `user-settings-server-sync` comes later and syncs preferences only.
- Settings may hide/show commands, order menus, pin actions, select default profiles, and set layout preferences.
- Settings must never grant repository access, write rights, AI rights, publication approval, group membership, or backend service access.

---

### Q7 — Should identity be introduced as a neutral contract before Microsoft Entra exists?

**Why it matters:**  
The architecture needs identity concepts early, but should not wire itself directly to Entra before backend phases.

**Recommended answer:**  
Yes. Add an `identity-contract` first, backend-neutral and implementation-free.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

- Early packages may reference current user, groups, capability claims, policy decision metadata, and permission diagnostics.
- The identity contract itself does not grant permissions.
- `identity-entra-server` appears later as one backend implementation.
- Frontend uses identity metadata for visibility/diagnostics only; backend remains authoritative.

---

### Q8 — Should GitLab remain completely backend-mediated, with no GitLab concepts in normal frontend workflows?

**Why it matters:**  
If GitLab concepts leak into the frontend, TextForge becomes a GitLab client rather than a provider-neutral editor.

**Recommended answer:**  
Yes. Frontend workflows remain repository/resource/changeset-based. GitLab project, branch, commit, merge request, token, repository URL, and GitLab permissions remain backend-only.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

- `persistence-gitlab-adapter` stays backend-only.
- `%repository` remains provider-resolved.
- Changeset submission maps to Git commit/MR only inside the backend.
- Frontend package dependencies must not include GitLab SDKs or GitLab-specific credentials.

---

### Q9 — Should AI be “read/suggest first,” with patch application deferred?

**Why it matters:**  
AI has high security and mutation risk. It should only arrive after identity, permissions, persistence, and audit foundations.

**Recommended answer:**  
Yes. Initial AI is non-mutating: ask, summarize, explain, and suggest patch text.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

- `ai-client` and `ai-chat-surface` must not mutate workspace resources initially.
- Patch text can be proposed but not applied.
- Patch application requires explicit user approval and changeset integration later.
- Phase validation should reject silent AI file modification.

---

### Q10 — Should enterprise mode support only one backend origin per running app?

**Why it matters:**  
The enterprise accreditation claim depends on the frontend communicating only with one approved backend origin.

**Recommended answer:**  
Yes. Enterprise TextForge has one active backend origin per app session/deployment.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

- Enterprise container spec defines one app/API origin.
- Manifest declares capabilities and provider roots.
- Resource providers are registered from the approved backend manifest, not user-entered URLs.
- Federation, if needed, belongs behind the backend.

---

### Q11 — Should backend-backed writes always go through changesets, not direct overwrites?

**Why it matters:**  
Changesets bridge local editing and backend persistence, and can map to saves, commits, review submissions, publication requests, and audit records.

**Recommended answer:**  
Yes. Backend-backed normal writes should use changesets with base revisions.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

- `ResourceProvider.write()` remains valid for local flows.
- Backend provider writes become `submitChangeset()`.
- Conflict diagnostics are mandatory for stale base revisions.
- GitLab, publication, review, audit, and later AI edits all map from the same changeset model.

---

### Q12 — Should enterprise container work be introduced before real backend services?

**Why it matters:**  
The deployment boundary should be proven before adding persistence, SSO, GitLab, AI, and server-side spaces.

**Recommended answer:**  
Yes. Add an early enterprise container phase that proves one container, one origin, frontend serving, `/api` skeleton, `/schemas`, `/health`, and manifest/version alignment.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

- `server-app-host` and `enterprise-container` appear before full persistence.
- The first enterprise build may be mostly empty but proves boundary, CSP, manifest, and version alignment.
- Later backend services attach behind that same boundary.
- Local/offline builds remain separately buildable.

---

### Q13 — Should local/offline mode explicitly forbid File System Access API and directory handles?

**Why it matters:**  
“Local workspace” could be misread as live OS folder access unless explicitly constrained.

**Recommended answer:**  
Yes. Local/offline TextForge uses IndexedDB, manual upload, manual ZIP/folder upload, and manual download/export. It forbids File System Access API, persistent directory handles, silent local reads/writes, and background folder sync.

**User decision:**  
Accepted with note: this should already be in the roadmap, but it is good to say again.

**Roadmap/spec/package implications:**  

- Local provider contracts describe app-managed storage, not OS filesystem access.
- ZIP/folder import/export remains the user-mediated boundary.
- Accreditation claims remain simple.
- Any future native/local-packaged app would require a separate security profile.

---

### Q14 — Should the backend roadmap add explicit “security invariants” that every later phase must preserve?

**Why it matters:**  
The backend proposal depends on several non-negotiable security/accreditation claims.

**Recommended answer:**  
Yes. Add a backend-optional invariant block.

**User decision:**  
Accepted.

**Accepted invariants:**  

1. Local/offline mode remains fully supported.
2. Local/offline mode has no silent local filesystem access.
3. Local/offline mode has no arbitrary network providers.
4. Enterprise mode uses one approved backend origin.
5. Backend-only adapters never leak into frontend-safe packages.
6. Settings personalize UI only; they do not grant permissions.
7. Backend-backed writes use revisions/changesets.
8. AI is backend-mediated and non-mutating at first.

**Roadmap/spec/package implications:**  

- Add the invariant block once near the backend architecture section.
- Reference it from affected phases instead of repeating it everywhere.
- Validation checks should confirm each affected phase preserves the invariants.

---

### Q15 — Should private/group spaces be backend-only at implementation time, even if their contracts appear earlier?

**Why it matters:**  
Browser storage cannot enforce enterprise identity, group membership, or access control.

**Recommended answer:**  
Yes. Define the model early, but implement real private/group spaces only in the backend profile.

**User decision:**  
Accepted with refinement: do not show private/group spaces too early in the UI.

**Roadmap/spec/package implications:**  

- `private-spaces-contract` can appear before backend implementation.
- `/private/me/` and `/groups/{groupId}/` become real only after SSO and server-side policy.
- Local mode may treat these as metadata or simulated test roots only.
- UI must not expose private/group roots until backend identity and enforcement exist.
- Do not claim enterprise-grade privacy/group enforcement before backend policy exists.

---

### Q16 — Should `%repository` remain a logical name, not a concrete URL?

**Why it matters:**  
Repository references need to remain portable across local, ZIP, backend, GitLab, package registry, SharePoint, and enterprise contexts.

**Initial recommended answer:**  
Treat repository references as logical aliases.

**User decision/refinement:**  
Do not constrain the format too much too early. The logical alias could be a URL. Give the reference to the backend/provider, which decides what to do with it.

**Final accepted decision:**  

- `%repository` may carry a logical name, URL, URI, or provider hint.
- The frontend treats it as a declaration/reference.
- The active provider/backend decides whether it is allowed, how it resolves, and what it maps to.
- Local/offline builds must not use it as arbitrary network fetch.
- Enterprise builds may pass it to the approved backend, which enforces policy.

**Roadmap/spec/package implications:**  

- ITM/TF-MD specs should not require `%repository` to be a fetchable URL or forbid URL-like references.
- Resolver behavior belongs to the active provider/backend.
- Frontend does not directly fetch arbitrary repository URLs.
- Repository resolution must produce diagnostics.

---

### Q17 — Should repository resolution produce distinct diagnostics for “unresolved” vs “unauthorized”?

**Why it matters:**  
A missing alias is different from a known repository the user is not allowed to access.

**Recommended answer:**  
Yes. Distinguish at least: unresolved, unsupported reference, unauthorized, unavailable, conflicting alias, and version/capability mismatch.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

- Repository resolver diagnostics become first-class.
- Local mode can report “not available in this profile.”
- Backend mode can report “known but unauthorized” without leaking unnecessary details.
- Package/include validation becomes clearer.

---

### Q18 — Should the new backend sequence keep the whitepaper numbering, or be renumbered to avoid collision with existing phases?

**Why it matters:**  
The whitepaper proposes numbered sub-phases, but the roadmap already has phase numbers and cross-references.

**Initial recommendation:**  
Keep sequence and intent, but allow renumbering during integration.

**User challenge:**  
Renumbering could imply reordering phases or removing `X.Y` phases. That would require a deeper review because phases already reference each other.

**Revised recommended answer:**  
Preserve existing numbering and ordering. Do not remove `X.Y` phases. Do not globally renumber. Add backend-related work only through carefully mapped insertions, with cross-reference checks before finalizing any new phase number.

**User decision:**  
Accepted, with requirement that updated roadmap be explicit in what `X.Y` phases entail.

**Roadmap/spec/package implications:**  

- Existing phase numbers remain stable.
- Existing `X.Y` phases remain.
- Whitepaper phase numbers are provisional proposal labels, not automatically authoritative.
- Integration must preserve cross-references unless a dedicated roadmap-wide renumbering review is explicitly approved.
- Any new or touched `X.Y` phase must be explicit in scope, dependencies, outputs, packages, and validation.

---

### Q19 — Should backend-related `X.Y` phases be defined as full roadmap rows, not just notes?

**Why it matters:**  
If backend work is added only as prose, implementation agents may miss it.

**Recommended answer:**  
Yes. Any backend-related `X.Y` phase should be a proper roadmap phase entry.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

Each backend-related `X.Y` phase must include:

- phase id;
- purpose;
- preconditions;
- packages created/updated;
- architecture/spec anchors;
- implementation scope;
- non-goals;
- validation checks;
- RAPID entries to append.

The package matrix and dependency activity diagram must be updated for any new phase.

---

### Q20 — Should resource descriptors reuse existing workspace/resource facts instead of inventing a parallel metadata model?

**Why it matters:**  
The whitepaper’s `ResourceDescriptor` overlaps with existing roadmap concepts around resource facts, representation, text/binary handling, surface eligibility, and workspace metadata.

**Recommended answer:**  
Yes. Extend the existing workspace/resource fact model rather than creating a second descriptor model.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

- `ResourceDescriptor` becomes the provider-aware evolution of existing resource facts.
- Add missing fields such as provider id, resource id, revision, capabilities, provenance, ownership, and diagnostics.
- Keep representation, MIME type, language, binary/text handling, and surface eligibility aligned with existing roadmap concepts.
- Avoid duplicate terminology with different meanings.

---

### Q21 — Should changesets be multi-file units, not single-file saves?

**Why it matters:**  
Backend persistence, Git commits, package edits, AI patches, publication staging, and service outputs may affect multiple files together.

**Recommended answer:**  
Yes. Treat changesets as multi-resource units.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

- A single-file save is a trivial changeset.
- Changesets include target workspace/provider, base revisions, added/modified/deleted/moved files, diagnostics, and user intent.
- GitLab adapter can map one changeset to one commit/MR.
- AI patch application later produces a changeset.
- Conflict diagnostics report stale revisions per affected resource.

---

### Q22 — Should changesets support generated artifacts, or only user-edited source files?

**Why it matters:**  
Generated previews, reports, publication outputs, diagnostics, and audit exports may be resources, but should not all be persisted by default.

**Recommended answer:**  
Yes. Changesets can include generated artifacts only when explicitly selected or produced by an approved workflow.

**User decision:**  
Accepted.

**Accepted categories:**  

- **Source resources:** normal user-authored files; saved by default.
- **Derived resources:** generated previews, SVG/HTML/PDF, reports, diagnostics; usually ephemeral.
- **Controlled generated resources:** publication outputs, audit evidence, package exports, approved service results; may be submitted in changesets when required.

**Roadmap/spec/package implications:**  

- Resource descriptors need provenance and generated/source classification.
- Changesets need an explicit inclusion reason for generated artifacts.
- Service-folder outputs do not automatically become persisted workspace changes.
- Publication/audit workflows can deliberately include generated outputs.

---

### Q23 — Should “soft collaboration” come before true live collaborative editing?

**Why it matters:**  
True live editing affects undo/redo, cursors, conflicts, offline behavior, audit, AI edits, and renderer updates.

**Recommended answer:**  
Yes. Use backend save with revisions, stale revision warnings, file locks/leases, compare/merge, review workflow, then later true live editing.

**User decision/refinement:**  
Accepted, but anything beyond file locks should be in later phases. Leave save with revisions and warnings early.

**Final accepted staging:**  

- **Early:** backend save with revisions, stale revision warnings, conflict diagnostics.
- **Soft collaboration phase:** file locks / leases only.
- **Later:** compare/merge, review workflows, presence/live cursors, CRDT/OT true live editing.

**Roadmap/spec/package implications:**  

- Do not introduce CRDT/OT/presence/live cursors early.
- Do not include compare/merge or review workflows in the early soft collaboration phase.
- Changesets and revisions prepare for future live editing without committing to it.

---

### Q24 — Should file locks be advisory leases, not hard permanent locks?

**Why it matters:**  
Hard locks can strand files if a browser closes, a session expires, or a user disappears.

**Recommended answer:**  
Yes. Use advisory, time-limited leases.

**User decision/refinement:**  
Accepted. Locks should be time-bound by default. If the user has not touched the document for a while, ask whether the lock is still needed. If the user logs out, assume the lock is no longer needed.

**Roadmap/spec/package implications:**  

- Locks belong in backend profile, not local-only mode.
- Leases require server identity and policy enforcement.
- Backend should release leases on logout/session expiry unless a policy exception exists.
- UI should prompt for lease renewal after configured inactivity.
- Revision checks remain mandatory even when locks exist.
- Reject indefinite client-only locks as a collaboration mechanism.

---

### Q25 — Should the browser extension remain a thin wrapper, not a separate product profile?

**Why it matters:**  
If the extension becomes a separate architecture path, it duplicates roadmap work.

**Recommended answer:**  
Yes. The browser extension is a thin distribution wrapper over the same frontend.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

- No separate feature roadmap for the extension.
- Extension validation focuses on packaging, permissions, CSP, and no unwanted network/file access.
- Core editor behavior remains shared with local static.
- Extension-only API use must be justified as packaging/security support, not product divergence.

---

### Q26 — Should the enterprise backend manifest be the source of truth for enabled backend capabilities?

**Why it matters:**  
The frontend needs to know whether persistence, private/group spaces, GitLab, AI, service jobs, locks, or settings sync are available without guessing from endpoints.

**Recommended answer:**  
Yes. Enterprise mode loads a backend manifest before enabling backend commands.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

Manifest should include:

- app version;
- API version;
- schema version;
- enabled profile;
- enabled providers;
- enabled capabilities;
- allowed roots;
- feature flags;
- policy hints.

The manifest informs UI and provider initialization. Permissions remain enforced by the backend.

---

### Q27 — Should manifest compatibility be fail-fast, not best-effort?

**Why it matters:**  
Incompatible frontend/backend/schema versions could corrupt resources or mislead users.

**Recommended answer:**  
Yes. Required manifest and version compatibility failures should be hard startup failures.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

Hard failures include:

- missing manifest;
- incompatible API version;
- incompatible schema version;
- unknown enabled profile.

Soft diagnostics include:

- optional capability unavailable;
- feature disabled by policy;
- provider temporarily unavailable.

The UI must not probe random endpoints to guess features.

---

### Q28 — Should optional backend capabilities degrade by hiding/disabling UI, not by changing document semantics?

**Why it matters:**  
Documents should not mean different things because AI, GitLab, locks, or backend services are unavailable.

**Recommended answer:**  
Yes. Missing optional capabilities affect available actions, not document semantics.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**  

- AI unavailable: hide/disable AI actions.
- GitLab unavailable: hide/disable submit-to-review workflow.
- Locks unavailable: rely on revision conflict diagnostics.
- Backend services unavailable: use local services or show unavailable diagnostics.
- Document parsing and semantics remain profile-independent.
- Capability unavailability produces diagnostics/UI state, not alternate parsing.

---

## Unresolved questions

No blocking unresolved decision remains from this grilling round.

The following items require implementation-time elaboration during roadmap integration, but do not require further grilling before creating the backend grilling record:

1. Exact final phase numbers for backend-related work.
2. Exact placement of each backend-related `X.Y` phase in the existing roadmap.
3. Exact package names where existing packages absorb logical slices before physical split.
4. Exact manifest schema/version compatibility rules.
5. Exact lease timeout values and inactivity threshold.
6. Exact repository diagnostic message taxonomy.
7. Exact settings precedence serialization format.
8. Exact changeset JSON schema.

These should be handled as follow-up roadmap/spec changes, not as open conceptual decisions.

---

## Roadmap/spec/package implications summary

### Roadmap implications

- Preserve current phase numbering and ordering.
- Preserve current `X.Y` phases.
- Do not collapse sub-phases into main phases.
- Treat whitepaper phase numbers as proposal labels only.
- Add backend-related work as explicit roadmap rows after checking existing references.
- Every new or touched `X.Y` phase must include scope, dependencies, outputs, non-goals, packages, and validation.
- Update RAPID log append-only.
- Update package matrix and dependency activity diagram.
- Add a backend-optional security invariant block.
- Explicitly state that Phase 5 contribution/capability decisions remain binding.

### Spec implications

- Extend existing resource facts into provider-aware descriptors.
- Define provider allowlists by profile/distribution.
- Define repository references as provider-resolved declarations, not direct frontend fetch instructions.
- Define distinct repository diagnostics.
- Define changesets as multi-resource units with base revisions.
- Define source/derived/controlled-generated resource categories.
- Define backend manifest and compatibility behavior.
- Define advisory, time-bound lease semantics.
- Keep document semantics independent from optional backend capability availability.

### Package implications

- Treat the package split as an explicit planned roadmap, implemented progressively.
- Avoid immediate package explosion unless dependency/security boundaries require it.
- Keep backend-only adapters out of frontend-safe packages.
- Keep GitLab, Entra, AI provider access, and backend persistence server code backend-only.
- Keep browser extension as a thin wrapper.
- Keep user settings separate from identity and permissions.
- Keep private/group implementation backend-only, even if contracts appear earlier.

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Backend work accidentally replaces accepted Phase 5 | State explicitly that Phase 5 remains binding and backend work builds on it. |
| Resource providers become a second contribution system | Define providers as workspace/storage/repository only; executable behavior remains under contribution/capability registries. |
| Package split creates churn too early | Plan split explicitly but implement progressively based on real dependency/security boundaries. |
| Local/offline security claim weakens | Add provider allowlists and explicitly forbid File System Access API/directory handles. |
| Service folders become fake APIs | Keep data plane as files/folders and control plane as explicit APIs. |
| Settings become confused with permissions | State that settings only personalize UI/defaults; backend policy always wins. |
| GitLab leaks into frontend | Keep GitLab adapter backend-only; frontend sees repositories/resources/changesets. |
| AI mutates files too early | Initial AI is read/suggest only; patch application requires later explicit approval/changeset support. |
| Enterprise frontend connects to arbitrary origins | Enforce one approved backend origin and manifest-based provider initialization. |
| Version mismatch causes corruption | Fail fast on missing/incompatible manifest, API version, or schema version. |
| Private/group spaces are misleading before backend | Do not expose them in UI until backend identity and policy enforcement exist. |
| Repository references become arbitrary frontend fetches | Let backend/provider resolve; local mode must not fetch arbitrary network URLs. |
| Soft collaboration expands too early | Keep early work to revisions, warnings, conflict diagnostics, and later file leases only. |
| Locks strand documents | Use advisory, time-bound leases; prompt on inactivity; release on logout/session expiry. |
| Optional backend capabilities change document meaning | Keep document semantics stable; hide/disable actions or show diagnostics instead. |

---

## Validation checks / definition of done

The backend roadmap integration is complete when:

1. Existing roadmap phase order and numbering are preserved.
2. Existing `X.Y` phases remain and are not collapsed.
3. Any new/touched `X.Y` backend phase is a full roadmap row with purpose, preconditions, packages, scope, non-goals, outputs, and validation.
4. Phase 5 contribution/capability work is explicitly preserved.
5. Resource providers are scoped to workspace/storage/repository behavior.
6. The provider allowlist is defined for local static, browser extension, enterprise frontend, and backend server.
7. Local/offline mode explicitly forbids File System Access API, persistent directory handles, silent file reads/writes, and background folder sync.
8. Backend-optional security invariants are included once and referenced where needed.
9. Service folders are described as data-plane artifact folders only.
10. Control-plane actions remain explicit APIs.
11. User settings are separate from identity and permissions.
12. Identity contract appears before Entra implementation and remains backend-neutral.
13. Private/group spaces are not exposed in UI before backend identity and policy enforcement.
14. GitLab adapter remains backend-only.
15. Initial AI is read/suggest only and non-mutating.
16. Enterprise backend is one approved origin per app session/deployment.
17. Enterprise manifest exists and is validated fail-fast.
18. Backend-backed writes use multi-resource changesets with revisions.
19. Generated artifacts are only included in changesets when explicit or workflow-approved.
20. Early collaboration is limited to revisions, stale warnings, conflict diagnostics, and later time-bound leases.
21. Browser extension remains a thin wrapper over the same frontend.
22. Optional backend capability unavailability hides/disables actions or emits diagnostics, without changing document semantics.
23. Package matrix reflects planned package split without forcing premature extraction.
24. Dependency activity diagram is updated if new phases/packages are added.
25. RAPID log records the integration as append-only entries.

---

## Follow-up changes to apply later

When roadmap integration begins, apply the following:

1. Add this grilling record under `roadmap/grilling/backend-grilling.md`.
2. Add a roadmap pointer to this grilling record.
3. Add an append-only RAPID entry recording acceptance of the backend-optional integration principles.
4. Add the backend-optional security invariant block.
5. Map the whitepaper’s proposed backend sequence into the existing roadmap without renumbering existing phases.
6. Convert any new backend `X.Y` work into full phase rows.
7. Update package guidance with the planned package split and staged extraction rule.
8. Update workspace/resource specs to extend existing resource facts into provider-aware descriptors.
9. Add provider allowlists per profile/distribution.
10. Add changeset/revision guidance.
11. Add repository resolution and diagnostics guidance.
12. Add enterprise manifest guidance.
13. Add local/offline file access prohibition restatement.
14. Add service-folder data-plane/control-plane split.
15. Add user settings/permissions separation.
16. Add private/group UI gating guidance.
17. Add AI non-mutating-first guidance.
18. Add time-bound advisory lease guidance.
19. Update validation checks across affected phases.
20. Update dependency diagram and package matrix if phase/package structure changes.

---

## Append-friendly notes

Future grilling rounds should append below this section using the same structure:

```markdown
## Round N decisions

### QN — Question title

**Why it matters:**  
...

**Recommended answer:**  
...

**User decision:**  
...

**Roadmap/spec/package implications:**  
...
```

Earlier decisions should be preserved unless explicitly superseded.

