# 08 — Distribution, Security, and Accreditation

This cluster captures distribution profiles, security invariants, and release evidence.

## Distribution profiles

| Profile | Allowed provider posture |
|---|---|
| Local static | IndexedDB, ZIP/folder import/export, generated assets, local service folders only. |
| Browser extension wrapper | Same frontend, stricter CSP/permissions, no separate product behavior. |
| Enterprise container | One approved backend origin, manifest-driven capabilities, server-served frontend/API. |
| Backend server | Approved backend-only adapters for GitLab, AI, SSO, services, private/group spaces, audit. |

## Recurring release gate

`WP-RELEASE-GATE` is recurring. It should run at selected delivery milestones, not only at the end of the whole backlog.

A release gate should check:

- local/offline security claims;
- package boundary integrity;
- provider allowlists;
- CSP/remote asset constraints;
- backend manifest/version compatibility when backend is in scope;
- adapter leakage into frontend packages;
- AI non-mutating-first behavior when AI is in scope;
- explicit evidence for selected workpackages.

## Preserved validation

Phase 3.5 UI screenshot validation assets are under `validation/ui/`.

Security/package guidance is under:

- `package-guides/security-profile.md`
- `package-guides/backend-optional.md`
- `specs/architecture/backend-optional-architecture.md`
