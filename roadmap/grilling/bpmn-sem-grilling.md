# WP-BPMN-SEM Grilling - BPMN Semantic Profile and Validation

## Latest status

**Status:** Round 1 complete.  
**Workpackage:** `WP-BPMN-SEM`.  
**Selected concern tested:** whether the supplied BPMN profile, Lua converter, BPMN XML example, and converted ITM example are enough to close the `WP-BPMN-SEM` definition gate without accidentally absorbing later visual, importer, or delta scope.

**Current conclusion:** `WP-BPMN-SEM` is now sufficiently defined for implementation as a narrow BPMN semantic MVP. The broader supplied source set is preserved under `docs/examples/bpmn/` and explicitly routed to later gates instead of being silently dropped or absorbed into the semantic slice.

## Index of grilling topics

1. MVP boundary versus the broader supplied process-diagram-lite profile
2. `SubProcess` treatment in the semantic MVP
3. Data and artifact split
4. `association` treatment in the semantic MVP
5. Lane and lane-set deferral
6. Gateway-family boundary
7. Lua converter landing
8. BPMN Diagram Interchange landing
9. Dedicated `WP-BPMN-DI-01` follow-on
10. Fixture strategy

## Workpackage purpose

`WP-BPMN-SEM` defines the first BPMN semantic profile TextForge will implement on top of the validated ITM/package foundation. It is intentionally smaller than full BPMN and must deliver a stable profile, validation path, activation mechanism, and focused fixtures before read-only BPMN visual consumption builds on top of it.

## Bundled reference inputs

The supplied reference assets are now preserved at:

- `docs/examples/bpmn/Training By Design.bpmn`
- `docs/examples/bpmn/training-by-design.lua-pipeline-reference.itm`
- `docs/examples/bpmn/bpmn-process-diagram-lite-profile.itm`
- `docs/examples/bpmn/bpmn-xml-to-itm.lua`

These files are broader than the accepted MVP and are routed to later gates where appropriate.

## Grilling log

### Topic 1 - MVP boundary versus the broader supplied process-diagram-lite profile

**Question asked:**  
Should the full supplied `bpmn_process_diagram_lite` profile become the `WP-BPMN-SEM` MVP boundary?

**Why it matters:**  
The supplied profile already includes broader process-diagram concerns such as groups, annotations, lanes, Diagram Interchange data, and a renderer-facing viewpoint pipeline. Accepting it wholesale would silently broaden `WP-BPMN-SEM` beyond the active roadmap intent.

**Recommended answer:**  
No. Keep `WP-BPMN-SEM` narrower than the full supplied profile and route the extra scope to explicit future gates.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

- `WP-BPMN-SEM` stays a semantic MVP rather than a broad process-diagram-lite slice.
- The supplied profile is preserved as a broader bundled reference source, not the authoritative MVP boundary as-is.
- Later workpackages must explicitly name where the extra scope lands.

### Topic 2 - `SubProcess` treatment in the semantic MVP

**Question asked:**  
Should `SubProcess` be included in the semantic MVP even though the initial roadmap shorthand only named Events, Tasks, Gateways, and Sequence Flows?

**Why it matters:**  
The supplied BPMN example uses subprocesses as a normal diagram primitive rather than as an edge case. Excluding them would make the bundled example less representative and distort the accepted fixture set.

**Recommended answer:**  
Include `SubProcess`, but only as a collapsed semantic flow-node type with basic attributes.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

- `WP-BPMN-SEM` includes `SubProcess` with `id`, `name`, and `triggeredByEvent`.
- Nested execution semantics, drill-in behavior, and expanded subprocess editing remain later work.

### Topic 3 - Data and artifact split

**Question asked:**  
Should data/artifact-heavy elements from the supplied profile land in the semantic MVP?

**Why it matters:**  
Including all artifacts would broaden the MVP substantially, while excluding all of them would leave the supplied example only partially relevant.

**Recommended answer:**  
Include `DataObjectReference` and `DataStoreReference`. Defer `Group`, `Category`, `CategoryValue`, and `TextAnnotation`.

**User decision:**  
Accepted, with the requirement that the first landing for the deferred set be explicit.

**Roadmap/spec/package implications:**

- `DataObjectReference` and `DataStoreReference` land in `WP-BPMN-SEM`.
- `Group`, `Category`, `CategoryValue`, and `TextAnnotation` first land in `WP-BPMN-VISUAL-B`.
- Diagram/fidelity consequences for those deferred elements remain later than the semantic MVP.

### Topic 4 - `association` treatment in the semantic MVP

**Question asked:**  
Should `association` be included once basic data references are included?

**Why it matters:**  
Without `association`, the included data references would exist but could not participate in the visible link structure used by the bundled example.

**Recommended answer:**  
Include `association` only as a basic declared relationship with structural validation.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

- `association` lands in `WP-BPMN-SEM` as a basic typed relationship.
- Richer interpretation for groups, annotations, and diagram-fidelity behavior remains deferred to later BPMN visual work.

### Topic 5 - Lane and lane-set deferral

**Question asked:**  
Should `LaneSet`, `Lane`, and `laneContains` be included in the semantic MVP?

**Why it matters:**  
The supplied profile explicitly warns that geometry-based lane membership can be inferential. That is a poor fit for a narrow semantic MVP.

**Recommended answer:**  
Defer `LaneSet`, `Lane`, and `laneContains`.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

- Lanes first land in `WP-BPMN-VISUAL-B`.
- Importer-side preservation before that point is reference material only, not MVP-semantic support.

### Topic 6 - Gateway-family boundary

**Question asked:**  
Does "Gateways" in the MVP mean all gateway families or only `ExclusiveGateway`?

**Why it matters:**  
Broad gateway-family support would quickly pull in advanced branch/join semantics and undermine the MVP boundary.

**Recommended answer:**  
Limit the gateway family to `ExclusiveGateway` only.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

- `WP-BPMN-SEM` gateway scope is `ExclusiveGateway` only.
- `ParallelGateway`, `InclusiveGateway`, `EventBasedGateway`, and other gateway families are deferred to a later BPMN semantic expansion rather than BPMN viewer work.

### Topic 7 - Lua converter landing

**Question asked:**  
Where should the supplied `bpmn-xml-to-itm.lua` converter land?

**Why it matters:**  
The converter is transformation/import logic, not just semantic-profile definition. Leaving it unclassified would reopen the same scope argument later.

**Recommended answer:**  
Route it to `WP-VITM-TRANSLATORS` as BPMN-related translator/import utility work. Preserve it as a bundled app-side reference asset without making JS/TS implementation part of the current semantic slice.

**User decision:**  
Accepted, with the instruction to bundle it in the app and not add any JS/TS work now.

**Roadmap/spec/package implications:**

- `WP-BPMN-SEM` does not require shipping the Lua converter.
- `WP-VITM-TRANSLATORS` should reference the bundled Lua converter as a preserved input.
- The converter remains available in the seeded docs/examples bundle through `docs/examples/bpmn/`.

### Topic 8 - BPMN Diagram Interchange landing

**Question asked:**  
Where should BPMN DI bounds/routes/label geometry land?

**Why it matters:**  
The supplied converted ITM fixture already carries Diagram Interchange data. If no workpackage claims it, later BPMN work will have to rediscover that routing decision.

**Recommended answer:**  
Do not hide BPMN DI inside `WP-BPMN-VISUAL-B` prose and do not force it under the later generic view-delta contract. Add a dedicated read-only BPMN DI bridge workpackage.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

- BPMN DI extraction/read-only fidelity becomes explicit future scope rather than an unnamed concern.
- Generic normalized delta semantics remain later under `WP-VITM-VDELTA-01`.

### Topic 9 - Dedicated `WP-BPMN-DI-01` follow-on

**Question asked:**  
Should the roadmap add a dedicated `WP-BPMN-DI-01` between `WP-BPMN-VISUAL-A` and `WP-BPMN-VISUAL-B`?

**Why it matters:**  
Without a dedicated bridge, either `WP-BPMN-VISUAL-B` becomes overloaded or BPMN read-only fidelity is blocked on the later generic delta framework.

**Recommended answer:**  
Yes. Add `WP-BPMN-DI-01` for read-only BPMN Diagram Interchange extraction/fidelity.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

- The BPMN visual chain becomes `WP-BPMN-SEM -> WP-BPMN-VISUAL-A -> WP-BPMN-DI-01 -> WP-BPMN-VISUAL-B`.
- `WP-BPMN-DI-01` remains read-only and fidelity-focused.
- `WP-VITM-VDELTA-01` stays later and generic rather than becoming a hidden BPMN blocker.

### Topic 10 - Fixture strategy

**Question asked:**  
What fixture set should be required to close `WP-BPMN-SEM`?

**Why it matters:**  
The large bundled example is useful, but it is too broad to serve as the only semantic MVP acceptance fixture.

**Recommended answer:**  
Require small canonical acceptance fixtures plus preserve the bundled broad example as extended reference evidence.

**User decision:**  
Accepted.

**Roadmap/spec/package implications:**

- `WP-BPMN-SEM` acceptance requires:
  - one minimal linear BPMN fixture;
  - one minimal exclusive-gateway BPMN fixture.
- The bundled `Training By Design` BPMN/XML and converted ITM assets remain extended reference fixtures linked to later gates.

## Accepted MVP boundary

The accepted `WP-BPMN-SEM` MVP includes:

- `Process`
- `StartEvent`
- `EndEvent`
- `Task`
- `SubProcess` as collapsed flow-node semantics only
- `ExclusiveGateway`
- `SequenceFlow`
- `association` as basic declared relationship semantics only
- `DataObjectReference`
- `DataStoreReference`
- basic attributes
- basic validation
- package/profile activation through the existing package/capability mechanism
- focused fixtures

The accepted `WP-BPMN-SEM` MVP excludes:

- `LaneSet`
- `Lane`
- `laneContains`
- `Group`
- `Category`
- `CategoryValue`
- `TextAnnotation`
- `DataObject`-level completeness beyond what the included reference links need
- broader gateway families
- BPMN DI geometry consumption/persistence
- Lua importer shipping requirements
- full BPMN completeness
- advanced execution semantics
- modeler/edit/write-back
- import/export loss handling beyond preserved reference assets

## Future-gate routing summary

| Source / scope | First planned landing |
|---|---|
| Narrow BPMN semantic MVP extracted from the supplied profile | `WP-BPMN-SEM` |
| `Training By Design.bpmn` raw BPMN XML | `WP-BPMN-VISUAL-A` fixture + later translator/import checks |
| `training-by-design.lua-pipeline-reference.itm` converted ITM reference | `WP-BPMN-SEM` extended reference + `WP-BPMN-VISUAL-B` |
| `bpmn-xml-to-itm.lua` | `WP-VITM-TRANSLATORS` |
| `Group`, `Category`, `CategoryValue`, `TextAnnotation` | `WP-BPMN-VISUAL-B` |
| `LaneSet`, `Lane`, `laneContains` | `WP-BPMN-VISUAL-B` |
| BPMN DI bounds/routes/label geometry | `WP-BPMN-DI-01` |
| Generic normalized delta contract for renderer-visible deviations | `WP-VITM-VDELTA-01` |
| Broader gateway families | Later BPMN semantic expansion after `WP-BPMN-SEM` |

## Unresolved questions

No blocking unresolved question remains for `WP-BPMN-SEM`.

Non-blocking later details:

1. Exact workpackage ID/name for the later broader BPMN semantic expansion if and when additional gateway families are admitted.
2. Exact initial translator direction chosen when `WP-VITM-TRANSLATORS` starts implementation work.

## Risks and mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Semantic MVP grows back toward the full supplied profile | The first BPMN slice would lose its narrow implementable boundary. | Keep the accepted MVP list explicit in roadmap/checklist files and route broader material to named later gates. |
| BPMN DI becomes invisible scope inside visual-target integration | Later implementation would have to rediscover a hidden dependency. | Add explicit `WP-BPMN-DI-01`. |
| The bundled Lua converter is mistaken for current shipping scope | Import work would leak into the semantic slice. | Preserve it as bundled reference input and route it to `WP-VITM-TRANSLATORS`. |
| Large reference fixtures replace minimal acceptance fixtures | Regressions in the true MVP subset would be harder to diagnose. | Require small canonical linear and exclusive-gateway fixtures for MVP acceptance. |
| Deferred artifact/lane scope is forgotten | The supplied broader example would only partially survive planning. | Link those elements to `WP-BPMN-VISUAL-B` and preserve the assets in `docs/examples/bpmn/`. |

## Validation checks / definition of done

`WP-BPMN-SEM` should not be considered sufficiently defined or complete unless all of the following stay true:

1. The semantic MVP boundary remains narrower than the full supplied process-diagram-lite profile.
2. `SubProcess` is included only as collapsed flow-node semantics.
3. Gateway scope remains `ExclusiveGateway` only.
4. `DataObjectReference`, `DataStoreReference`, `SequenceFlow`, and basic `association` support exist in the MVP.
5. Lanes, groups, categories, text annotations, and BPMN DI remain out of the MVP.
6. Package/profile activation uses the existing ITM capability/package path.
7. Validation diagnostics run through the existing ITM validation path.
8. Small canonical linear and exclusive-gateway fixtures exist.
9. The bundled `docs/examples/bpmn/` reference assets remain linked to the appropriate future gates.
10. BPMN DI has an explicit later read-only landing through `WP-BPMN-DI-01`.
11. Generic normalized delta semantics remain later under `WP-VITM-VDELTA-01`.
12. The Lua converter remains preserved without becoming a JS/TS requirement for the semantic MVP.

## Follow-up changes to apply later

When the roadmap/spec/package files are revised for implementation, apply the following:

1. Update the active BPMN chain everywhere to include `WP-BPMN-DI-01`.
2. Update `WP-BPMN-SEM` checklist/scope text to match the accepted MVP list.
3. Create a validation checklist for `WP-BPMN-DI-01`.
4. Route `docs/examples/bpmn/*` into the relevant workpackage notes and package guides.
5. Record the closed `WP-BPMN-SEM` definition gate and the new `WP-BPMN-DI-01` row in `RAPID.md`.
6. Keep broader gateway-family expansion as a later BPMN semantic follow-on rather than pulling it into BPMN viewer work.

## Append-friendly continuation area

Future grilling rounds for `WP-BPMN-SEM` should append below this point.

### Round 2

_Not started._
