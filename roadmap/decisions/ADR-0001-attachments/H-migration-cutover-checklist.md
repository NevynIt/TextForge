# Attachment H — Migration / cutover checklist

## Purpose

Cut over from the historical phase-based roadmap to the new module / workpackage / release / ADR roadmap structure without losing content, decisions, traceability, or implementation state.

## Cutover decision

- [ ] ADR created for the roadmap governance reset.
- [ ] RAPID entry created for the cutover decision.
- [ ] Historical RAPID archived.
- [ ] New active RAPID started, continuing previous ID counters.
- [ ] `roadmap-state.yaml` declared authoritative for IDs, status, dependencies, and registry data.

## 1. Inventory old material

- [ ] List all existing roadmap files.
- [ ] Classify each as:
  - active content to migrate;
  - historical context to archive;
  - duplicate / superseded;
  - generated view;
  - raw grilling / discussion notes.
- [ ] Identify all old phase references.
- [ ] Identify all existing WPs.
- [ ] Identify all existing decisions.
- [ ] Identify all existing status claims.

## 2. Freeze and preserve

- [ ] Copy old roadmap into `archive/migration-snapshots/`.
- [ ] Move old RAPID into `archive/rapid/`.
- [ ] Add archive banner to archived files.
- [ ] Do not delete ambiguous content.
- [ ] Record archive movement in RAPID.

## 3. Establish new skeleton

- [ ] Create root `README.md`.
- [ ] Create new root `RAPID.md`.
- [ ] Create `roadmap-state.yaml`.
- [ ] Create folders:
  - `modules/`;
  - `workpackages/`;
  - `releases/`;
  - `decisions/`;
  - `views/`;
  - `validation/evidence/`;
  - `archive/`.
- [ ] Add templates.

## 4. Migrate decisions

- [ ] Extract durable decisions from old roadmap and grilling docs.
- [ ] Create ADRs only for decisions that still matter.
- [ ] Mark superseded decisions explicitly.
- [ ] Link ADRs to affected modules, WPs, and releases.
- [ ] Do not rewrite old decision history.

## 5. Migrate modules

- [ ] Create one module file for each stable product area.
- [ ] Define purpose, boundaries, contracts, dependencies, current state, and target state.
- [ ] Remove phase language from module files.
- [ ] Link each module to relevant WPs and ADRs.
- [ ] Register each module in `roadmap-state.yaml`.

## 6. Migrate workpackages

- [ ] Create one WP file per active or candidate workpackage.
- [ ] Preserve legacy origin only in `archive_trace`.
- [ ] Define scope, non-goals, dependencies, package impact, validation criteria, and evidence needs.
- [ ] Split WPs that are too large or mix unrelated modules.
- [ ] Register every WP in `roadmap-state.yaml`.
- [ ] Ensure every WP belongs to exactly one primary module.

## 7. Migrate releases

- [ ] Define release envelopes as delivery cuts, not phases.
- [ ] Add included and excluded WPs.
- [ ] Add dependency gates.
- [ ] Add release-level acceptance criteria.
- [ ] Register releases in `roadmap-state.yaml`.

## 8. Build canonical state

- [ ] Add all modules to `roadmap-state.yaml`.
- [ ] Add all WPs to `roadmap-state.yaml`.
- [ ] Add all releases to `roadmap-state.yaml`.
- [ ] Add all ADRs to `roadmap-state.yaml`.
- [ ] Validate IDs are unique.
- [ ] Validate all dependencies resolve.
- [ ] Validate all statuses use the agreed vocabulary.
- [ ] Validate no active field uses phase terminology except `archive_trace`.

## 9. Generate views

- [ ] Generate `views/current-next.md`.
- [ ] Generate `views/status-dashboard.md`.
- [ ] Generate `views/module-matrix.md`.
- [ ] Generate `views/dependency-map-full.md`.
- [ ] Generate `views/dependency-map-next.md`.
- [ ] Confirm generated views match `roadmap-state.yaml`.

## 10. Validation and reconciliation

- [ ] Check that every old active WP has a new WP, ADR, release entry, or archive trace.
- [ ] Check that every old decision is either migrated to ADR or intentionally archived.
- [ ] Check that every old status claim is either migrated or superseded.
- [ ] Check that every active dependency exists in the new dependency map.
- [ ] Check that no active roadmap file depends on archived content for current truth.

## 11. Go / no-go

Go only if:

- [ ] `roadmap-state.yaml` is complete enough to generate the main views.
- [ ] Active roadmap files no longer use phase terminology.
- [ ] Archive exists and is clearly non-authoritative.
- [ ] RAPID has recorded the cutover.
- [ ] ADR for roadmap governance reset is accepted.
- [ ] No active WP is lost.
- [ ] No active decision is lost.

## 12. After cutover

- [ ] Mark old roadmap files as archived.
- [ ] Update root README to point only to the new structure.
- [ ] Add a RAPID progress entry confirming the cutover.
- [ ] Add validation evidence for the migration.
- [ ] Use only the new structure for future roadmap changes.

## Rollback rule

If serious loss or inconsistency is found:

- restore from `archive/migration-snapshots/`;
- keep the new structure as draft;
- record the rollback in RAPID;
- fix the migration checklist before retrying.
