# ADR-0016 - Provider-neutral workspace synchronization events

## Status

Proposed

## Date

2026-06-08

## Context

TextForge stores the browser-managed workspace through `@textforge/workspace`. The current browser persistence provider uses IndexedDB through Dexie.

A user may open the same TextForge app in multiple live pages or tabs under the same browser origin. Those pages can share the same persisted IndexedDB workspace state, but IndexedDB does not provide normal application-level events for resource changes. Without an application-level notification layer, one page can save, rename, move, delete, import, or otherwise update workspace resources while another page continues to show stale state until a reload or manual refresh.

The immediate browser-local mechanism for same-origin live notification is `BroadcastChannel`, combined with revision checks and reloads from IndexedDB. However, TextForge must not expose IndexedDB-specific behavior, browser channel names, or page-instance identifiers as workbench-level contracts. Future persistence providers may be backed by the File System Access API, a local service folder, a backend API, Git/provider-backed storage, SharePoint-backed storage, service-worker mediation, or other mechanisms.

The durable decision is therefore to introduce provider-neutral workspace domain events above persistence providers, while keeping provider-specific notification and missed-change detection below the workspace abstraction.

## Decision

TextForge will expose provider-neutral workspace synchronization events through the workspace abstraction.

The workbench, surfaces, markdown preview logic, and future resource consumers must subscribe to abstract workspace-domain events. They must not subscribe directly to provider-specific mechanisms such as `BroadcastChannel`.

The persistence provider owns provider-specific change detection and provider-specific notification. For the current IndexedDB/Dexie provider, any `BroadcastChannel` usage, page-instance filtering, browser channel naming, and focus/resume missed-message checks stay inside the IndexedDB provider or its private browser adapter.

The intended layering is:

```text
Workbench / surfaces / markdown
  listens to provider-neutral workspace domain events

@textforge/workspace persistence service
  exposes provider-neutral event subscription and refresh APIs

Persistence provider
  owns provider-specific change detection and notification

IndexedDB/Dexie provider
  internally uses BroadcastChannel and focus/resume revision checks
```

The workbench must not know whether an external change was detected through `BroadcastChannel`, file-handle polling, a backend stream, Git fetch/pull, SharePoint polling, or a service-worker message.

The workspace abstraction should expose a small event contract similar to:

```ts
type WorkspaceDomainEvent =
  | ResourceContentChangedEvent
  | WorkspaceIndexChangedEvent;

type ResourceContentChangedEvent = {
  type: "resource-content-changed";
  origin: "local" | "external";
  resourceId: string;
  path: string;
  revision: string;
  updatedAt: string;
};

type WorkspaceIndexChangedEvent = {
  type: "workspace-index-changed";
  origin: "local" | "external";
  workspaceRevision: string;
  updatedAt: string;
};
```

The final implementation may adjust names to match repository conventions, but the public contract must remain provider-neutral.

Recommended metadata mapping:

- `entry.id`: stable resource identity;
- `entry.path`: current path;
- `entry.metadata.revision`: resource revision when present;
- `entry.metadata.updatedAt`: fallback resource revision;
- `workspace.getManifest().updatedAt`: workspace/index revision.

Use `resource-content-changed` for durable saves that update the content of an existing resource without changing workspace structure. Examples include `saveTextResource`, `saveBinaryResource`, and generated-resource updates where the existing resource keeps the same id, path, and representation.

Use `workspace-index-changed` for durable structural changes. Examples include create, upload, import, copy, rename, move, delete, replace-state, reset, and generated-resource exports that create, delete, or structurally replace entries.

Do not add public events for every structural action at this stage. Rename, move, delete, create, import, and reset should be inferred by reloading and diffing workspace snapshots.

A provider-neutral snapshot diff helper should compare folders and resources by stable `id`. It should detect created entries, deleted entries, moved or renamed entries, content revision changes, and bulk/import/reset style changes. This helper should stay small and pure; it is not a full changeset engine.

The workspace service should emit local domain events after local persistence succeeds and translate provider-specific external-change signals into `origin: "external"` domain events. Provider messages are notifications only. Consumers must reload persisted state before reconciliation.

The workbench should consume only `WorkspaceDomainEvent`. For external resource-content changes, it should reload the latest persisted state through the workspace abstraction and reconcile the changed resource. For external workspace-index changes, it should capture the old snapshot, reload persisted state, capture the new snapshot, diff the snapshots, reconcile open sessions and active documents, and emit a controller update.

Dirty text documents must not be overwritten. Until a richer dirty-state contract exists, a text document is considered dirty when:

```text
activeTextDocuments.get(resourceId)?.text !== workspace.getEntry(resourceId)?.text
```

For an externally changed clean text document, the workbench may replace active document text and resource metadata from the latest persisted resource. For an externally changed dirty text document, the workbench must preserve the active document and mark the resource or session as externally changed, stale, or conflicted.

The existing overlay boundary must be preserved. Refreshing from persisted state must not persist bundled overlay resources as local workspace resources.

Markdown previews and rendered views should refresh when an externally changed resource is directly open or known to be a dependency. If explicit dependency tracking is not yet available, the first implementation may conservatively refresh currently open markdown previews on external content changes.

## Consequences

### Positive

- Cross-page workspace refresh can be implemented for the current IndexedDB provider without coupling the workbench to `BroadcastChannel`.
- Future persistence providers can surface changes through the same workspace-domain event contract.
- Structural events stay simple because detailed changes are inferred from workspace snapshot diffing.
- Dirty editors are protected from blind overwrite by external changes.
- Markdown refresh can start conservatively and improve later with explicit dependency tracking.

### Negative / trade-offs

- The IndexedDB implementation is more layered than directly wiring `BroadcastChannel` in the workbench.
- The first provider-neutral event contract may need refinement when backend, Git, SharePoint, or service-folder providers are introduced.
- Structural events are intentionally coarse; consumers must reload and diff snapshots.
- Conservative markdown preview refresh may do more work than strictly necessary until dependency tracking is explicit.
- A minimal stale/conflict marker may not provide a full user-facing conflict-resolution experience.

### Follow-up required

- Define the final exported workspace event subscription API in `@textforge/workspace`.
- Add provider-neutral domain event tests.
- Add IndexedDB-provider tests using fake IndexedDB and an injectable fake `BroadcastChannel` adapter.
- Add snapshot diff tests for create, delete, rename, move, content revision change, and bulk reset/import cases.
- Add workbench reconciliation tests for clean reload, dirty conflict preservation, deleted resources, moved/renamed resources, and markdown preview refresh.
- Add focus/resume missed-message detection inside the IndexedDB provider or private browser adapter.
- Keep browser UI tests out of the first implementation unless later evidence shows a specific UI regression that cannot be covered through Node-level tests.

## Implementation guidance

When implemented, the code should respect these placement rules:

```text
packages/workspace
  provider-neutral event types, subscription API, revision helpers, snapshot diff helpers, dirty-state helpers, persistence wrapper changes

packages/workspace/src/storage.js or a private storage helper
  IndexedDB/Dexie provider-specific BroadcastChannel and focus/resume handling

apps/textforge-web/src/workbench/controller/index.js
  provider-neutral domain-event subscription and resource/session/preview reconciliation only
```

The implementation should avoid:

- `BroadcastChannel` imports or channel-name constants in the workbench controller;
- IndexedDB-specific event contracts outside the IndexedDB provider;
- new Dexie schema changes unless strictly necessary;
- collaborative editing, CRDTs, service-worker sync, backend sync, or durable event logs;
- complex visual conflict resolution UI;
- large markdown dependency-graph work in the first implementation.

Validation should be Node-first:

- use `node:test` and `node:assert/strict`;
- keep pure helpers testable without DOM;
- use `fake-indexeddb/auto` where provider tests touch Dexie;
- inject a fake `BroadcastChannel` implementation for provider tests;
- avoid Playwright/Cypress/browser UI tests for the initial implementation.

## Applies to

- Modules: `MOD-WORKSPACE-RESOURCES`
- Workpackages: `WP-RES-02`, `WP-RES-03`
- Releases: `R-LOCAL-AUTHORING-MVP` candidate behavior when implementation is scheduled

## Supersedes / superseded by

- Supersedes: none
- Superseded by: none
