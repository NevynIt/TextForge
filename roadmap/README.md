# TextForge Roadmap V18

Roadmap V18 is the cleaned, workpackage-first roadmap for TextForge.

The structural change from V16/V17 is deliberate:

- Phases `-1` through `4.1` are preserved as foundation history.
- From `WP5` onward, planning is dependency-based rather than strictly linear.
- Legacy phase numbers are retained as traceability handles, not as the only scheduling mechanism.
- Optional provider-specific integrations, such as Microsoft Entra SSO, GitLab, AI providers, OIDC/SAML/Keycloak, SharePoint-like repositories, browser-extension packaging, and future app wrappers, are standalone adapter/profile workpackages.
- No V16/V17 content is deleted. It is either promoted into V18, moved into a clearer folder, or preserved under `archive/`.

## Start here

1. Read `AGENTS_START_HERE.md`.
2. Read `ROADMAP_V18.md`.
3. Read `decisions/RAPID.md`.
4. Use `workpackages/workpackage-register.md` as the canonical current planning source from WP5 onward.
5. Use `archive/source-v17-roadmap/` only for traceability back to the original V17 package.

## Folder map

| Folder/file | Purpose |
|---|---|
| `ROADMAP_V18.md` | Executive roadmap structure and operating rules. |
| `workpackages/` | Canonical WP5+ backlog, dependencies, status tracker, and cluster files. |
| `specs/architecture/` | Architecture whitepapers, package strategy, markdown profile, and reference index. |
| `package-guides/` | Package-level implementation guidance promoted from the old `packages/` folder. |
| `validation/` | Validation checklists and evidence assets. |
| `grilling/` | Grilling records that remain binding when relevant. |
| `decisions/RAPID.md` | Append-only decisions/actions/progress/issues log. |
| `archive/` | Preserved V16/V17 files and source roadmap package. |

## Current implementation posture

The former Phase 5 contribution/capability spine plus the minimal inspector are now validated:

```text
WP-05A Contribution manifest and registry model
  -> WP-05B Capability activation and resolver context
  -> WP-05C Pipeline/contribution execution integration
WP-05D Minimal package/capability inspector
```

The next ready option is `WP-RES-01` provider-aware resource descriptors. `WP-ID-01`, `WP-SET-01`, and `WP-ITM-02` are also startable under the current dependency posture now that `WP-ITM-01` and `WP-LUA` are validated. Dependency-satisfied candidates, including `WP-LUA-POWER-SESSION`, should also be shown as startable; actual execution order is chosen one slice at a time.

The backend path is enabled by contracts and fixtures, not by Entra SSO:

```text
WP-ID-01 Identity contract
  -> WP-ID-DEV Development identity fixture provider
  -> WP-POLICY-01 Provider-neutral server policy engine
  -> optional production SSO adapters later
```
