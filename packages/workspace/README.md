# @textforge/workspace

Workspace state, persistence, ZIP import/export, and resource identity metadata for TextForge.

Phase 3.4 extends workspace metadata with deterministic placement-based resource badges. The current badge space uses `8 × 8 × 8 × 5 = 2560` base combinations across shape, accent, mark, and placement, while preserving the existing variant-based collision repair flow and badge diagnostics surface.
