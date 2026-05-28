# TextForge Roadmap V19a

Roadmap V19a is the active, cleaned, workpackage-first roadmap for TextForge.

The main change from V18 is operational, not archival:

- The active roadmap is now the V19a workpackage/spec/grilling/checklist set.
- Already validated work is treated as frozen baseline rather than being reopened for new scope.
- `WP-ITM-VISUALS` remains the validated static projection/publication baseline.
- V19a selects ITM visual runtime recovery first, then the minimal BPMN visual consumption chain.
- The workspace still retains `roadmap/archive/` and `ROADMAP_V18.md` for traceability, but those historical files are not active implementation instructions.

## Start here

1. Read `AGENTS_START_HERE.md`.
2. Read `ROADMAP_V19A.md`.
3. Read `decisions/RAPID.md`.
4. Use `workpackages/workpackage-register.md` as the canonical current planning source.
5. Use the relevant workpackage cluster file under `workpackages/`.
6. Use relevant package guides and grilling records referenced by the selected workpackage.
7. Use `archive/` or `ROADMAP_V18.md` only for traceability, never as the active execution baseline.

## Folder map

| Folder/file | Purpose |
|---|---|
| `ROADMAP_V19A.md` | Executive roadmap structure and operating rules for the active baseline. |
| `workpackages/` | Canonical WP5+ backlog, dependencies, status tracker, cluster files, and generated dependency map. |
| `specs/architecture/` | Architecture whitepapers, profile/spec proposals, and reference material. |
| `package-guides/` | Package-level implementation guidance. |
| `validation/` | Validation checklists and evidence assets. |
| `grilling/` | Grilling records that remain binding when relevant. |
| `decisions/RAPID.md` | Append-only decisions/actions/progress/issues log and current operational pointer. |
| `archive/` | Preserved V16/V17/V18 traceability material retained locally but not used as the active roadmap. |

## Current implementation posture

Validated and frozen baseline:

```text
WP-05A -> WP-05B -> WP-05C
WP-05D
WP-RES-01
WP-REPO-01
WP-ITM-01
WP-ITM-02
WP-ITM-VISUALS
WP-LUA
WP-LUA-POWER-SESSION
```

V19a visual recovery path:

```text
WP-VITM-01
  -> WP-ITM-VTARGET-01
  -> WP-ITM-VRESOLVE-01
  -> WP-RENDER-CYTOSCAPE
  -> WP-RENDER-JSMIND
  -> WP-RENDER-SIGMA
```

Minimal BPMN visual consumption follow-on:

```text
WP-BPMN-SEM
  -> WP-BPMN-VISUAL-A
  -> WP-BPMN-VISUAL-B
```

`WP-VITM-TRANSLATORS`, `WP-MD-REPORT`, `WP-TABLES`, `WP-RES-02`, `WP-ID-01`, `WP-SET-01`, and `WP-ARCHIMATE-SEM` remain separately startable under the current dependency posture, but they are not on the selected main chain.

The backend path is enabled by contracts and fixtures, not by Entra SSO:

```text
WP-ID-01 Identity contract
  -> WP-ID-DEV Development identity fixture provider
  -> WP-POLICY-01 Provider-neutral server policy engine
  -> optional production SSO adapters later
```
