> [!IMPORTANT]
> Archived governance reset input package. This package is non-authoritative after installation; active roadmap truth lives in oadmap/roadmap-state.yaml, oadmap/decisions/, templates, and generated views.

# Multi-agent implementation prompt — TextForge roadmap governance reset

## Mission

You are a multi-agent implementation harness operating on the TextForge repository. Your task is to migrate the existing `roadmap/` folder from a mixed phase/workpackage legacy structure into the agreed module / workpackage / release / ADR / RAPID / generated-view structure.

You must preserve content, decisions, traceability, and implementation state. Do not delete ambiguous information. Archive it.

## Input artifacts

Use the current repository roadmap folder as source material.

Use this governance package as the target design:

- `roadmap-governance-reset-package/decisions/ADR-0001-roadmap-governance-reset.md`
- `roadmap-governance-reset-package/decisions/ADR-0001-attachments/`
- `roadmap-governance-reset-package/templates/`
- `roadmap-governance-reset-package/schemas/roadmap-state.schema.json`
- `roadmap-governance-reset-package/examples/roadmap-state.example.yaml`
- `roadmap-governance-reset-package/examples/RAPID-start.md`

## Non-negotiable rules

1. `roadmap-state.yaml` is authoritative for IDs, status, dependencies, module/WP/release/ADR registry data.
2. Markdown files explain the registry.
3. ADRs record durable decisions.
4. RAPID records append-only events only.
5. Archive is historical and non-authoritative.
6. Phase terminology is historical only and must not appear in active planning fields except inside `archive_trace` or explicit historical notes.
7. Do not lose content. If unsure, archive and link.
8. Do not restart RAPID counters.
9. Continue RAPID counters from the current detected values:
   - `D-080` -> next `D-081`
   - `A-033` -> next `A-034`
   - `P-101` -> next `P-102`
   - `I-009` -> next `I-010`
   - `R-001` -> next `R-002`, if needed.
10. Generated views must be generated from `roadmap-state.yaml`, not manually maintained.

## Target folder structure

Create or converge toward:

```text
roadmap/
  README.md
  product-goal.md                 # optional if enough content exists
  roadmap-state.yaml
  RAPID.md

  modules/
    roadmap-governance.md
    workspace-resources.md
    repository.md
    itm.md
    markdown-itm.md
    visual-itm-renderers.md
    bpmn.md
    archimate.md
    tables.md
    sketch.md
    surfaces-ui.md
    backend-enterprise.md
    security-distribution.md
    knowledge-workspace.md

  workpackages/
    WP-....md
    templates/

  releases/
    R-ROADMAP-RESET.md
    R-LOCAL-AUTHORING-MVP.md
    R-VISUAL-MODELING-MVP.md
    R-BACKEND-PREVIEW.md
    R-ENTERPRISE-PROFILE.md

  decisions/
    ADR-0001-roadmap-governance-reset.md
    ADR-0001-attachments/

  validation/
    evidence/
    checklists/

  views/
    current-next.md
    status-dashboard.md
    module-matrix.md
    dependency-map-full.md
    dependency-map-next.md

  archive/
    rapid/
    phases/
    registers/
    grilling/
    generated-views/
    migration-snapshots/
```

## Suggested agent roles

### 1. Lead coordinator

Responsibilities:

- Own the cutover sequence.
- Ensure every agent follows the authority model.
- Maintain the migration checklist.
- Resolve conflicts between agents.
- Ensure final validation is complete.

Outputs:

- `roadmap/migration-cutover-checklist.md`
- final cutover summary

### 2. Archivist agent

Responsibilities:

- Copy the entire old roadmap into `archive/migration-snapshots/` before transformation.
- Move old RAPID from `roadmap/decisions/RAPID.md` to `roadmap/archive/rapid/RAPID-up-to-2026-06-05.md`.
- Add archive banners to archived files.
- Preserve raw grilling and legacy phase files under archive when they are no longer active.
- Do not rewrite archived content except for banners and replacement references.

Outputs:

- populated `roadmap/archive/`
- archive movements recorded for RAPID

### 3. Decision librarian agent

Responsibilities:

- Install `ADR-0001-roadmap-governance-reset.md` and attachments.
- Extract still-valid durable decisions from legacy roadmap/grilling material into ADRs only where needed.
- Avoid creating ADRs for minor template details unless they represent independently durable decisions.
- Mark superseded decisions explicitly.

Outputs:

- `roadmap/decisions/ADR-0001-roadmap-governance-reset.md`
- `roadmap/decisions/ADR-0001-attachments/`
- optional additional ADRs if truly necessary

### 4. State architect agent

Responsibilities:

- Build `roadmap-state.yaml`.
- Register all modules, WPs, releases, and ADRs.
- Normalize statuses to the agreed vocabulary.
- Preserve legacy origin only in `archive_trace`.
- Ensure all dependencies resolve.

Outputs:

- `roadmap/roadmap-state.yaml`
- optional validation report

### 5. Module migration agent

Responsibilities:

- Convert package-guide / cluster / phase-shaped content into stable module pages.
- Define each module's purpose, owns/does-not-own boundaries, public contracts, dependencies, WPs, current state, target state, ADR links, and validation approach.
- Remove active phase language.

Outputs:

- `roadmap/modules/*.md`

### 6. Workpackage migration agent

Responsibilities:

- Convert existing WP content into one WP file per active/candidate workpackage.
- Split oversized mixed WPs where needed.
- Preserve legacy origin through `archive_trace`.
- Define outcome, scope, non-goals, package impact, interfaces/contracts changed, validation criteria, evidence required, and open decisions.
- Keep established WP IDs where widely referenced.

Outputs:

- `roadmap/workpackages/WP-*.md`
- updated workpackage template under `roadmap/workpackages/templates/`

### 7. Release planning agent

Responsibilities:

- Create release envelopes as delivery cuts, not phases.
- Define included/excluded WPs, dependency gates, acceptance criteria, validation evidence, risks, release notes draft, and open decisions.

Outputs:

- `roadmap/releases/*.md`

### 8. View generation agent

Responsibilities:

- Generate views from `roadmap-state.yaml`.
- Do not invent status or dependencies outside the state file.
- Produce:
  - `views/current-next.md`
  - `views/status-dashboard.md`
  - `views/module-matrix.md`
  - `views/dependency-map-full.md`
  - `views/dependency-map-next.md`

Outputs:

- generated views
- optional generator script updates

### 9. Validation agent

Responsibilities:

- Check no active content was lost.
- Check every old active WP is migrated or archived with trace.
- Check every active decision is in ADR or intentionally archived.
- Check all dependencies resolve.
- Check no active roadmap field uses phase terminology except `archive_trace`.
- Check every file referenced by `roadmap-state.yaml` exists or is explicitly planned.
- Produce evidence file for the migration.

Outputs:

- `roadmap/validation/evidence/WP-ROADMAP-CLEANUP.md`
- validation defects list, if any

## Execution sequence

### Step 0 — Preflight

- Read this package.
- Read the existing `roadmap/` folder.
- Confirm current RAPID location and latest counters.
- Do not modify files before taking a migration snapshot.

### Step 1 — Freeze and archive

- Create `roadmap/archive/migration-snapshots/roadmap-before-governance-reset-2026-06-05/`.
- Copy the existing roadmap contents into that snapshot.
- Move the old RAPID log to `roadmap/archive/rapid/RAPID-up-to-2026-06-05.md`.
- Add archive banners.

### Step 2 — Install governance decision

- Create `roadmap/decisions/ADR-0001-roadmap-governance-reset.md`.
- Create `roadmap/decisions/ADR-0001-attachments/`.
- Copy the attachments from this package.

### Step 3 — Create active RAPID

- Create `roadmap/RAPID.md`.
- Start with:
  - `D-081` for the governance cutover decision.
  - `A-034` for archiving old RAPID and starting the new root RAPID.
  - `P-102` for cutover initiation/progress.

### Step 4 — Create target skeleton

- Create or normalize the target folders.
- Move old active files to the proper active folder or archive location.
- Keep templates in active template locations.

### Step 5 — Build `roadmap-state.yaml`

- Inventory modules, WPs, releases, and ADRs.
- Normalize status and dependencies.
- Add `archive_trace` references for migrated historical material.

### Step 6 — Migrate content

- Build module pages.
- Build WP pages.
- Build release envelopes.
- Keep module pages stable and high-level.
- Keep WP pages executable.
- Keep release pages as delivery cuts.

### Step 7 — Generate views

- Generate current/next, status dashboard, module matrix, full dependency map, and next dependency map.
- Clearly mark them as generated.

### Step 8 — Validate

- Run the validation checklist.
- Fix broken links and unresolved references.
- Produce migration evidence.

### Step 9 — Finalize

- Update root README.
- Add a final RAPID progress entry if the cutover completes.
- Leave any uncertain content archived, not deleted.

## Acceptance criteria

The migration is successful only if:

- `roadmap-state.yaml` exists and is usable as the active registry.
- Active roadmap files use module/workpackage/release/ADR terminology.
- The old RAPID log is archived.
- The new root RAPID exists and continues ID counters.
- `ADR-0001` exists and records the governance reset.
- Main templates exist.
- Generated views exist.
- Archive contains the historical material.
- Every old active WP is either migrated, split, or traceably archived.
- Every old durable decision is either represented in ADRs or traceably archived.
- No active status/dependency truth is duplicated outside `roadmap-state.yaml`.

## Output summary required from the harness

At the end, report:

1. Files created.
2. Files moved to archive.
3. Files modified.
4. WPs migrated.
5. Modules created.
6. Releases created.
7. ADRs created.
8. Views generated.
9. Validation failures, if any.
10. Known limitations or unresolved migration questions.
