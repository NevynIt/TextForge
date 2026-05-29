# Resource Identity Badges

Phase 3.4 keeps resource identity local, deterministic, and workspace-oriented.

## Base visual model

- Shapes: `circle`, `triangle`, `square`, `diamond`, `pentagon`, `hex`, `octagon`, `shield`
- Accents: `teal`, `amber`, `sky`, `coral`, `lime`, `slate`, `rose`, `cobalt`
- Marks: `dot`, `bar`, `split`, `ring`, `corner`, `stack`, `plus`, `slash`
- Placements: `center`, `top`, `right`, `bottom`, `left`

This yields `8 × 8 × 8 × 5 = 2560` base badge variants before collision-repair variant increments are considered.

## Core rules

- Badges identify resources by stable local metadata, not by remote assets or arbitrary icon picking.
- Badge assignment is deterministic from resource kind, language or MIME cues, and stable identity inputs, with deterministic collision repair when duplicates occur.
- Placement replaces the earlier rotation dimension. Mark placement must remain visibly distinct at compact sizes.
- Badges stay compact and readable across the workspace tree, tabs, active-resource header, and inspector.
- Important state such as open, dirty, protected, or diagnostics may be layered onto the badge or adjacent chrome, but the base identity remains stable.

## React icon policy

- `lucide-react` is the single React icon library for generic shell affordances in Phase 3.4.
- `@textforge/ui` owns the `lucide-react` dependency for folder/file/search/import/export/panel/warning/state controls unless a direct app import is unavoidable.
- Use named imports only. Do not dynamically load the whole icon set.
- Keep icon use generic and supportive. Resource identity should still come from deterministic badges first, not from arbitrary per-file icon taxonomies.

## Boundary rules

- Do not use remote images or remote icons for resource identity.
- Do not use user-provided images as badge or icon identity.
- Do not derive badge identity from unstable filesystem-derived identity, local handles, or privileged file APIs.
- Do not introduce File System Access API, directory handles, background sync, remote sync, or silent local-file probing to support badge behavior.
- Keep rendering CSP-safe through local CSS, text, inline SVG, and bundled React icons only.

## Persistence and repair

- Persist badge metadata with workspace resources where possible so reload and ZIP round-trip keep orientation stable.
- When imported or restored metadata collides, repair the duplicate deterministically and surface a local diagnostic so the user can understand why the visible badge changed.
