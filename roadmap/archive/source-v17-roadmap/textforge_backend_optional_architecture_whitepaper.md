# TextForge Backend-Optional Architecture Update White Paper

**Status:** Draft architecture update proposal  
**Repository context:** TextForge `rewrite/v2-monorepo` roadmap  
**Earliest insertion point:** After Phase 4.1, which is treated as already implemented / closed  
**Date:** 2026-05-26

---

## 1. Purpose

This white paper records the architecture update converged during the backend, repository, service-folder, identity, AI, user-settings, and distribution-profile discussion.

The purpose is to preserve the reasoning and provide implementation-ready guidance for updating the TextForge roadmap without disturbing the already-established phase sequence.

The core conclusion is:

> TextForge should remain an offline-capable editor. Backend integration should be introduced later as an optional enterprise profile through clear provider contracts, not by making the frontend depend directly on GitLab, AI services, Microsoft identity, or any other enterprise system.

The proposed update introduces:

- a backend-neutral workspace/resource provider abstraction;
- a clean data-plane/control-plane server model;
- optional enterprise backend deployment;
- Microsoft Entra / Teams-aligned SSO;
- server-side private and group spaces;
- backend-mediated GitLab repository access;
- backend-mediated AI services;
- user editor settings;
- thin distribution wrappers for local, extension, and enterprise-container deployment.

---

## 2. Existing fixed point

The proposal assumes that the roadmap up to and including **Phase 4.1** is not reopened.

Phase 4.1 is treated as the stabilization seam that prepares for contribution registries. It already focuses on stabilizing diagnostics, command/action contracts, capability state, resolver seams, package public boundaries, resource facts, surface eligibility, and default contributions.

Therefore, this proposal does **not** insert any new work before Phase 4.1.

The first new roadmap insertion point is **after Phase 4.1**, starting with Phase 5.x sub-phases.

---

## 3. Design principles

### 3.1 Backend optionality

TextForge must continue to run without any backend.

This is not merely a convenience. It is a core security, portability, and accreditation property.

The offline profile should remain able to:

- run as a static web application or browser extension;
- store workspace data in browser-managed storage;
- import and export ZIP/folder archives;
- avoid arbitrary network access;
- avoid direct local filesystem access except manual user upload/download flows.

Backend integration must add capabilities without becoming a hard dependency.

### 3.2 One frontend contract, multiple providers

The frontend should not know whether a folder comes from:

- IndexedDB;
- a ZIP import;
- generated assets;
- a local service folder;
- a backend persistence server;
- GitLab behind the backend;
- private user storage;
- group storage;
- a package registry;
- a publication staging area.

The frontend should see a small, stable abstraction:

```text
list folder
read file
write file
move file
delete file
get metadata
get capabilities
get revision
submit changeset, where applicable
```

Everything else should be provider-specific or backend-specific.

### 3.3 Data plane and control plane

The backend should expose a clear split:

```text
Data plane:
  repositories, folders, files, package content, templates,
  service inputs/outputs, diagnostics, generated artifacts, audit exports

Control plane:
  SSO, permissions, job creation, job status, changesets,
  locks, publication approval, AI request mediation, audit enforcement
```

This avoids forcing all behavior into fake files while preserving the convenient file/folder abstraction for artifact-shaped work.

### 3.4 Server-side policy

TextForge settings and frontend capabilities must never grant permissions.

The backend is responsible for enforcing:

- authentication;
- authorization;
- group membership;
- repository visibility;
- path access;
- write rights;
- AI scope;
- publication permissions;
- audit requirements.

The frontend may hide or show commands, but it cannot override server policy.

### 3.5 Thin deployment wrappers

Local web app, browser extension, and enterprise backend deployment should all reuse the same frontend codebase.

They should differ only in packaging and capability activation, not in core editor behavior.

---

## 4. Architecture profiles and distribution variants

The architecture should distinguish **security/architecture profiles** from **distribution variants**.

### 4.1 Architecture profiles

There should be two main architecture profiles.

#### Local / offline profile

```text
TextForge frontend only
IndexedDB workspace
ZIP import/export
local pipeline execution
no backend requirement
no arbitrary network
manual upload/download boundary
```

This is the baseline profile and should remain fully supported.

#### Enterprise backend profile

```text
TextForge frontend served by backend
one approved backend origin
SSO
server-side permissions
private and group folders
backend persistence
GitLab adapter behind the server
backend service folders
backend-mediated AI
audit and governance
```

This is the enterprise profile. It should be introduced only after the frontend contracts exist.

### 4.2 Distribution variants

The distribution variants should remain thin wrappers over the same baseline.

```text
Local Static Distribution
  static SPA build
  no backend

Local Browser Extension Distribution
  same static build
  enterprise-admin deployable
  locked permissions/CSP
  no special extension-only logic unless unavoidable

Enterprise Container Distribution
  Node.js server
  serves the frontend
  exposes backend API
  exposes schema/version manifest
  integrates SSO and backend capabilities
```

A later PWA or local packaged-app variant may be considered only if there is clear demand.

---

## 5. Why the backend should serve the app

In the enterprise backend profile, the backend server should also serve the TextForge frontend.

This gives a clean deployment unit:

```text
one container
one origin
one CSP/security header policy
one app/API version pair
one schema contract set
one SSO boundary
one audited deployment artifact
```

This avoids version skew between an independently deployed frontend and backend. It also simplifies accreditation because the enterprise deployment can be assessed as one bounded application.

The backend should expose a manifest such as:

```json
{
  "appVersion": "x.y.z",
  "apiVersion": "x.y.z",
  "schemaVersion": "x.y.z",
  "enabledProfile": "enterprise-backend",
  "capabilities": [
    "persistence",
    "privateSpaces",
    "groupSpaces",
    "gitlab",
    "serviceFolders",
    "ai"
  ]
}
```

The local/offline build should still remain separately buildable and runnable.

---

## 6. Node.js container recommendation

A Node.js / TypeScript backend is recommended for the enterprise container.

Reasons:

- the frontend is already TypeScript-oriented;
- schemas, DTOs, diagnostics, manifest parsing, and validation contracts can be shared;
- ITM/Markdown/pipeline logic can be reused where appropriate;
- a single monorepo can build both frontend-safe and backend-only packages;
- container deployment is portable and enterprise-friendly.

The enterprise server should be deployable as a container that:

- serves the compiled frontend;
- exposes `/api/*`;
- exposes `/schemas/*`;
- exposes `/health`;
- integrates SSO;
- enforces permissions;
- connects to GitLab through a backend adapter;
- mediates AI access;
- exposes service folders;
- records audit evidence.

---

## 7. Core resource abstraction

The most important new abstraction is:

```text
Resource = content + path + provider + revision + capabilities + provenance
```

A resource is not merely a file path. It carries the metadata needed to support:

- offline storage;
- backend storage;
- conflict detection;
- capabilities;
- generated artifacts;
- service outputs;
- private/group ownership;
- future collaboration.

A minimal descriptor should include:

```text
ResourceDescriptor
  path
  providerId
  resourceId
  representation
  mimeType
  languageId
  revision
  capabilities
  provenance
  ownerKind
  ownerId
  diagnostics
```

Provider operations should include:

```text
ResourceProvider
  list(path)
  read(path)
  write(path, content, options)
  move(sourcePath, targetPath)
  delete(path)
  stat(path)
  capabilities(path)
```

For backend-backed resources, writes should preferably operate through changesets rather than direct overwrites.

---

## 8. Changesets and revisions

Changesets are the bridge between local editing and backend persistence.

A changeset should describe:

```text
Changeset
  baseRevision
  added
  modified
  deleted
  moved
  diagnostics
  userIntent
  targetWorkspace
```

This allows the backend to map TextForge edits to:

- plain saved files;
- Git commits;
- branches;
- merge requests;
- review submissions;
- publication requests;
- audited changes.

TextForge should not need to know whether a changeset becomes a Git commit, a GitLab merge request, a database update, or a staged publication package.

---

## 9. Repository abstraction

The `%repository` directive should be treated as a logical reference, not a protocol-specific URL.

Example:

```itm
%repository shared org-reference-models
%include shared:profiles/bpmn.itm
```

TextForge should not assume whether `shared` is backed by:

- IndexedDB;
- ZIP-imported package content;
- a backend virtual folder;
- GitLab;
- SharePoint;
- a package registry;
- a locked internal library.

The host/provider resolves the repository reference.

This aligns with the ITM direction, where repositories are named sources for reusable content and the host decides how repository references are resolved.

---

## 10. Service folders

Service folders are a useful pattern, but only for file-shaped work.

They should be used for:

- validation inputs and diagnostics outputs;
- rendering inputs and SVG/HTML/PDF outputs;
- import/export conversion;
- package caches;
- templates;
- publication staging and results;
- audit evidence exports;
- CI/report outputs.

Example:

```text
/services/validate/jobs/{jobId}/
  request.json
  input/
  output/
  status.json
  diagnostics.json
```

But service folders should not replace explicit control APIs for:

- authentication;
- authorization;
- job creation/cancellation;
- locks;
- approvals;
- changeset submission;
- live collaboration;
- AI request authorization;
- policy updates.

The rule should be:

```text
Data plane as folders/files.
Control plane as explicit operations.
```

---

## 11. Identity, private spaces, and group spaces

The backend should use enterprise SSO, aligned with Microsoft account / Microsoft Entra / Teams identity.

The frontend should receive identity and capability metadata from the backend, but it should not implement policy.

The backend should support:

- named users;
- groups;
- users belonging to multiple groups;
- private user folders;
- group folders;
- repository permissions;
- service permissions;
- AI permissions;
- audit identity.

Example workspace roots:

```text
/private/me/
/groups/{groupId}/
/repositories/
/packages/
/services/
/publication/
/audit/
```

A user should only see the roots and actions the backend authorizes.

Private and group spaces should first be defined as contracts, then implemented server-side after the backend exists.

---

## 12. Backend-mediated AI

AI should be introduced only after persistence, identity, permissions, and audit are in place.

The frontend should not call LLM providers directly.

The model should be:

```text
TextForge chat surface
  -> AI client package
  -> TextForge backend AI mediator
  -> approved LLM service
```

The backend mediator should enforce:

- user identity;
- document scope;
- group/repository permissions;
- allowed context windows;
- prompt policy;
- redaction rules;
- audit logging;
- model/provider routing;
- rate limits;
- tool permissions;
- approval requirements for edits.

Initial AI capability should be modest:

```text
read selected document
read selected folder context
answer questions
summarize
explain
suggest edits as patch text
```

Later AI capabilities can include:

```text
generate patches
apply patches after approval
fix diagnostics
run pipelines
generate ITM/Markdown fragments
refactor model folders
prepare changesets
assist publication
```

This gives a path from "talk with your docs" to Codex/Copilot-style document editing without compromising the security profile early.

---

## 13. User editor settings

As capabilities grow, menus and command surfaces will become busy. User editor settings should be added as a first-class frontend-safe capability.

Settings should cover:

- command visibility;
- menu placement;
- menu order;
- command palette priority;
- preferred visual styles;
- default document profiles;
- default enabled capabilities;
- default surfaces/layout;
- AI assistant preferences;
- workspace/repository defaults.

Settings must not grant permissions.

They should only personalize the presentation and defaults within the capabilities already allowed by the app profile and backend policy.

### 13.1 Settings precedence

A recommended cascade is:

```text
application defaults
  < package/profile defaults
  < organisation policy defaults
  < group defaults
  < user settings
  < workspace/document overrides
  < server hard permissions
```

Server hard permissions always win.

### 13.2 Command customization

Commands should declare metadata:

```text
command id
title
category
capability requirement
default menu location
default order
context predicates
```

User settings may define:

```text
hidden commands
pinned commands
menu order
quick actions
context menu sections
command palette priority
```

This allows the interface to scale without overwhelming users.

---

## 14. Package split

The package split should preserve security boundaries and keep backend-only dependencies out of frontend-safe packages.

### 14.1 Frontend-safe workspace and repository packages

```text
workspace-core
workspace-indexeddb
workspace-zip
workspace-services

repository-core
repository-itm
```

### 14.2 User settings packages

```text
user-settings-core
user-settings-local
user-settings-ui
user-settings-server-sync
```

### 14.3 Backend persistence packages

```text
persistence-client
persistence-server-contract
persistence-server-reference
persistence-gitlab-adapter
```

### 14.4 Identity and private/group space packages

```text
identity-contract
identity-entra-server

private-spaces-contract
private-spaces-server
```

### 14.5 AI packages

```text
ai-contract
ai-client
ai-server-mediator
ai-chat-surface
```

### 14.6 Distribution packages

```text
app-distribution
server-app-host
enterprise-container
browser-extension-wrapper
local-static-build
```

The important dependency rule is:

```text
Frontend packages may depend on contracts.
Frontend packages must not depend on backend-only adapters.
Backend packages may depend on contracts and adapters.
Adapters must not leak into the app shell.
```

---

## 15. Suggested dependency direction

```text
apps/textforge-web
  -> workspace-core
  -> workspace-indexeddb
  -> workspace-zip
  -> workspace-services
  -> repository-core
  -> repository-itm
  -> user-settings-core
  -> user-settings-local
  -> user-settings-ui
  -> optional persistence-client
  -> optional ai-client
  -> optional ai-chat-surface

persistence-client
  -> workspace-core
  -> repository-core
  -> persistence-server-contract

persistence-server-reference
  -> persistence-server-contract
  -> identity-contract
  -> private-spaces-contract
  -> ai-contract
  -> persistence-gitlab-adapter

identity-entra-server
  -> identity-contract

private-spaces-server
  -> private-spaces-contract
  -> identity-contract

ai-server-mediator
  -> ai-contract
  -> identity-contract
  -> persistence-server-contract

server-app-host
  -> compiled frontend
  -> persistence-server-reference
```

---

## 16. Phased roadmap update

The following sequence assumes Phase 4.1 is complete and no earlier phase is changed.

### Phase 5.1 — Workspace and repository provider contracts

Introduce:

- `workspace-core`;
- `repository-core`;
- provider contracts;
- resource descriptor;
- capabilities;
- revisions;
- dirty state;
- changeset model;
- conflict diagnostics.

No backend.

Purpose:

- prepare for backend later;
- improve offline architecture now;
- unify resources, generated artifacts, local storage, and future providers.

### Phase 5.2 — Identity contract

Introduce:

- `identity-contract`;
- abstract user/group/permission concepts;
- capability claims;
- server-policy placeholder types.

No SSO implementation yet.

Purpose:

- allow packages to talk about identity and permissions without introducing a server.

### Phase 5.3 — User settings core and local storage

Introduce:

- `user-settings-core`;
- `user-settings-local`.

Support:

- menu visibility/order;
- default capabilities;
- visual preferences;
- default document profiles;
- command preference metadata.

No backend sync yet.

Purpose:

- deliver early UI value;
- manage expanding command surfaces;
- keep offline personalization.

### Phase 6.1 — Repository resolver integration

Introduce:

- `repository-itm`;
- ITM/TF-MD repository directive resolver integration;
- include resolution through provider abstraction;
- diagnostics for unresolved repositories/includes.

Still offline/local-first.

Purpose:

- connect `%repository` and `%include` to the provider model without GitLab or a backend.

### Phase 7.1 — Local service-folder convention

Introduce:

- `workspace-services`;
- local service folders for validation/render/export;
- file-shaped service input/output conventions.

Examples:

```text
/services/validate
/services/render
/services/export
/packages
/templates
```

Still local/offline.

Purpose:

- prepare server-backed services while delivering local pipeline usability.

### Phase 7.2 — User settings UI

Introduce:

- `user-settings-ui`.

Support:

- menu customization;
- command palette filtering;
- default profile selection;
- default capability activation;
- visual/layout preferences.

Purpose:

- keep UI usable as contributions expand.

### Phase 8.1 — Private and group space contracts

Introduce:

- `private-spaces-contract`.

Define:

- private user space;
- group space;
- multi-group membership;
- ownership metadata;
- permission metadata.

No real server enforcement yet.

Purpose:

- establish the model before backend implementation.

### Phase 9.0 — Enterprise distribution profile

Introduce:

- `app-distribution`;
- `server-app-host`;
- enterprise container packaging concept.

The backend server begins to serve the frontend in enterprise profile.

Purpose:

- define the enterprise deployment unit before adding major backend services.

### Phase 9.1 — Backend API contract and optional frontend provider

Introduce:

- `persistence-client`;
- `persistence-server-contract`.

TextForge can optionally connect to one approved backend.

Still no mandatory backend dependency.

Purpose:

- make the backend visible to the frontend as another provider.

### Phase 9.2 — Reference persistence server

Introduce:

- `persistence-server-reference`.

Implement:

- data plane;
- control plane;
- provider endpoints;
- schema/version manifest;
- health endpoint;
- initial audit hooks.

Purpose:

- first real backend.

### Phase 9.3 — Enterprise SSO and server-side policy

Introduce:

- `identity-entra-server`.

Implement:

- Microsoft Entra / Teams-aligned SSO;
- session handling;
- server-side permissions;
- capability filtering.

Purpose:

- make enterprise identity real and authoritative.

### Phase 9.4 — Private and group spaces server

Introduce:

- `private-spaces-server`.

Implement:

- `/private/me/`;
- `/groups/{groupId}/`;
- server-enforced permissions;
- group membership resolution;
- audit metadata.

Purpose:

- provide high-value enterprise storage without GitLab complexity.

### Phase 9.5 — Roaming user settings

Introduce:

- `user-settings-server-sync`.

Implement:

- SSO-bound user settings sync;
- optional group/organisation defaults;
- backend settings storage;
- merge/precedence rules.

Purpose:

- make user preferences portable across devices and browser profiles.

### Phase 9.6 — GitLab adapter behind the persistence server

Introduce:

- `persistence-gitlab-adapter`.

Implement:

- GitLab repository mapping;
- branch/workspace mapping;
- changeset-to-commit mapping;
- optional merge request workflow;
- conflict diagnostics.

TextForge still sees folders/files/changesets, not GitLab APIs.

Purpose:

- integrate controlled GitLab without making TextForge a GitLab client.

### Phase 10.1 — Backend-backed service folders

Extend:

- server-backed `/services`;
- server-side validation/render/export jobs;
- backend package/template/publication/audit folders.

Purpose:

- allow heavy or controlled processing outside the browser.

### Phase 10.2 — Soft collaboration

Introduce:

- file locks or leases;
- stale revision warnings;
- remote-change detection;
- compare/merge support;
- review-state indicators.

Purpose:

- capture much of the collaboration value without true live editing complexity.

### Phase 11.1 — AI contract and backend mediator

Introduce:

- `ai-contract`;
- `ai-server-mediator`.

Implement:

- backend-mediated AI request model;
- document scope policy;
- audit;
- model/provider routing;
- redaction/prompt policy seams.

Purpose:

- safely introduce AI as an enterprise-governed backend service.

### Phase 11.2 — AI client and chat surface

Introduce:

- `ai-client`;
- `ai-chat-surface`.

Implement:

- simple conversational interface;
- selected document/folder context;
- explain/summarize/ask-about-docs;
- suggested edits as non-applied patch text.

Purpose:

- deliver "talk with your docs" before autonomous editing.

### Phase 11.3 — AI preference integration

Integrate AI with user settings:

- preferred assistant mode;
- default context scope;
- patch-vs-explain preference;
- per-profile AI behavior;
- disabled/hidden AI commands where not wanted.

Purpose:

- prevent AI capabilities from overwhelming users.

### Later — AI editing actions

Add:

- user-approved patch application;
- diagnostics fixing;
- pipeline-aware transformations;
- refactoring;
- changeset preparation.

### Much later — True live collaborative editing

Only after backend persistence, revisions, soft collaboration, audit, and user settings are stable.

This may require:

- CRDT or OT model;
- presence;
- live cursors;
- shared undo/redo strategy;
- low-latency sync;
- offline conflict behavior;
- deeper editor integration.

---

## 17. Why true live editing should be delayed

Live editing is attractive but deep.

It affects:

- document identity;
- edit operation representation;
- undo/redo;
- cursor state;
- conflict resolution;
- offline behavior;
- autosave semantics;
- locks;
- permissions;
- audit;
- AI editing interactions;
- rendering/update pipelines.

The roadmap should prepare for it by adding revision and changeset concepts early, but it should not implement true live editing until much later.

A safer progression is:

```text
single-user local editing
backend-backed save with revision checks
soft locks and stale warnings
manual compare/merge
review workflow
eventual true live edit
```

This maximizes early value while deferring the hardest technical risk.

---

## 18. Security and accreditation implications

The architecture supports two clean security claims.

### Local profile claim

```text
TextForge runs locally in the browser.
It does not require a backend.
It does not silently access or modify local files.
Files enter and leave through explicit user-mediated import/export.
Browser storage is application-managed.
```

### Enterprise backend profile claim

```text
TextForge communicates only with one approved backend origin.
The backend serves the app and exposes the API.
The backend enforces SSO, permissions, repository policy, service policy, AI policy, and audit.
The frontend does not directly access GitLab, LLM providers, arbitrary network endpoints, or local filesystem APIs.
```

This keeps the accreditation story explainable.

---

## 19. Implementation risks and mitigations

| Risk | Mitigation |
|---|---|
| Backend abstractions become too broad | Keep the provider API small and file/folder-centered. |
| Service folders become fake command files | Keep control-plane actions as explicit operations. |
| User settings become confused with permissions | Server hard permissions always win. |
| GitLab leaks into frontend | GitLab adapter remains backend-only. |
| AI becomes uncontrolled exfiltration path | AI is mediated by backend, scoped, audited, and policy-controlled. |
| Local profile degrades | Local static and extension builds remain first-class. |
| Too many packages increase complexity | Keep packages aligned to security and dependency boundaries. |
| Live collaboration derails roadmap | Defer true live edit; implement soft collaboration first. |
| Frontend/backend version skew | Enterprise backend serves the frontend and schema/version manifest. |

---

## 20. Recommended roadmap patch summary

The roadmap update should add the following new sub-phases after Phase 4.1:

```text
5.1  Workspace and repository provider contracts
5.2  Identity contract
5.3  User settings core and local storage

6.1  Repository resolver integration

7.1  Local service-folder convention
7.2  User settings UI

8.1  Private and group space contracts

9.0  Enterprise distribution profile
9.1  Backend API contract and optional frontend provider
9.2  Reference persistence server
9.3  Enterprise SSO and server-side policy
9.4  Private and group spaces server
9.5  Roaming user settings
9.6  GitLab adapter behind the persistence server

10.1 Backend-backed service folders
10.2 Soft collaboration

11.1 AI contract and backend mediator
11.2 AI client and chat surface
11.3 AI preference integration

Later
     AI editing actions
     advanced compare/merge
     true live collaborative editing
```

This sequence gives early value through local abstractions and user settings, introduces the backend only at Phase 9, and delays the difficult distributed collaboration and AI-editing concerns until the supporting foundations exist.

---

## 21. Final recommendation

Adopt the backend-optional architecture as a roadmap extension, not as a replacement of the current roadmap.

The decisive architectural move is not "add a backend." It is:

```text
Make resources provider-backed, revision-aware, capability-aware, and policy-aware.
```

Once that is in place, the same TextForge frontend can operate in:

- local static mode;
- browser extension mode;
- enterprise backend mode;
- GitLab-backed repository mode;
- private/group workspace mode;
- AI-assisted mode.

The backend should be introduced only after the contracts are stable, and it should appear to TextForge as one approved provider with clear data and control planes.

This preserves the original local-first security posture while enabling a much richer enterprise deployment path.

---

## References and context notes

- TextForge roadmap branch consulted: `NevynIt/TextForge`, branch `rewrite/v2-monorepo`.
- Current roadmap context places Phase 4.1 as the stabilization phase before contribution registries and Phase 5.
- ITM format context includes `%repository`, `%include`, package, resolver, plugin, validation, view, and repository concepts.
- Microsoft Entra / enterprise SSO is treated as the expected enterprise identity integration point.
