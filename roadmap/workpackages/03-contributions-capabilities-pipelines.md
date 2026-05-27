# 03 — Contributions, Capabilities, and Pipelines

This cluster holds the executable extension/composition model.

## Workpackages

| WP | Title | Role |
|---|---|---|
| WP-05A | Contribution manifest and registry model | Canonical package contribution descriptions. |
| WP-05B | Capability activation and resolver context | Active document capability set and conflict diagnostics. |
| WP-05C | Pipeline/contribution execution integration | Canonical execution and intermediate-value routing. |
| WP-05D | Minimal package/capability inspector | Optional diagnostics-oriented shell visibility over package and capability state. |
| WP-LUA | Lua automation | Optional sandboxed automation behind capabilities. |
| WP-LUA-POWER-SESSION | Lua self-escalation session and one-click recovery | Candidate follow-on for session-scoped elevated host-object access, explicit console state, and fast recovery. |
| WP-PIPELINE-EDITOR | Pipeline/diagram editor surfaces | Optional visual authoring for pipelines. |

## Capability rules

- Capabilities and contributions are distinct.
- One capability may enable multiple contributions.
- Pipelines can use short names when unambiguous within active capabilities.
- Qualified names are determined by backend/package resolution, not manually supplied by users.
- Conflicting short names in active capabilities must fail with diagnostics.
- Mermaid, math, and Graphviz remain active by default unless superseded by profile/settings policy.

## Non-goals

- Do not introduce remote or dynamic package execution through `%require`.
- Do not turn resource providers into contribution registries.
- Do not bypass package public APIs from the app shell.
