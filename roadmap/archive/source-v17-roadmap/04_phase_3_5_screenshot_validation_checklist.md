# Phase 3.5 Screenshot-Based UI Validation Checklist

This checklist exists because Phase 3.4 made the workbench substantially more readable, but the latest screenshot still shows shell-level usability problems that are easy to miss in unit tests: wasted horizontal real estate, awkward scrollbars, duplicate document identity, fixed side panels, and popup content behaving like side-panel content.

Use screenshots as validation evidence, not as a replacement for component tests. Capture before/after screenshots at normal desktop sizes and review them against the checks below.

## Required screenshots

Capture at least these states at 1440×900 and, where practical, 1920×1080:

1. workspace tree visible, inspector visible, one Markdown document active;
2. workspace tree collapsed, inspector visible;
3. utility area open;
4. at least one popup surface open;
5. left and right side panels resized to reasonable narrow and wide positions.

Store screenshots in the implementation branch or PR evidence if the repo has a convention for test artifacts. If not, record the screenshot filenames and reviewer notes in `roadmap/RAPID.md`.

## Failure patterns to reject

Reject the implementation if screenshots show any of the following obvious issues:

- a page-level horizontal scrollbar at normal desktop widths;
- a horizontal scrollbar spanning the whole app shell or crossing the status bar;
- nested horizontal scrollbars caused by shell layout rather than by explicit editor/content overflow;
- a collapsed side panel still reserving a large empty strip;
- an isolated resource-summary island consuming central horizontal space while the editor is squeezed;
- the active document name repeated more than three times in the visible shell;
- duplicate top-level buttons that perform the same conceptual action or compete with the command palette;
- popup sessions rendered only as side-panel content rather than as actual app popups/overlays;
- side panels with fixed widths that trap the editor into an unnecessarily narrow center area;
- labels or badges clipped without tooltip/ellipsis behavior;
- inspector cards repeating the same path, language, and surface metadata adjacent to each other.

## Positive checks

The after screenshots should show:

- the editor/main surface as the dominant visual region;
- left and right panels resizable within sensible minimum and maximum widths;
- collapsed panels releasing real workspace area;
- popup sessions as floating overlays with clear close/focus behavior;
- a clear distinction between app header, document tabs, editor chrome, inspector, utility/debug area, and status bar;
- active document identity visible but not noisy;
- no more than two or three visible instances of the active file name;
- Shapez-style resource badges used for orientation, not decorative clutter;
- command palette/menu affordances replacing low-frequency top-bar buttons;
- all scrollbars visually belonging to the panel or content area they scroll.

## Suggested manual review rubric

| Check | Pass condition |
|---|---|
| Global overflow | `document.documentElement.scrollWidth <= window.innerWidth + 1` at the target viewport. |
| Main surface dominance | With both side panels visible, the main surface remains the largest region and is not reduced to a narrow column. |
| Duplicate identity | The active resource title/path appears at most three times in the visible shell. |
| Popup behavior | Popup content appears in a bounded overlay/popup host, not only inside the right inspector or utility side panel. |
| Panel resizing | Dragging resize handles changes panel widths smoothly within bounds and does not create shell overflow. |
| Collapsed panels | Collapsed panels become a narrow rail or disappear; they do not leave a large blank body. |
| Scrollbar discipline | Horizontal scrollbars appear only inside content that genuinely needs horizontal scrolling, such as editor code content. |
| Inspector focus | The inspector explains the active resource/surface without repeating the same title/path/state in multiple adjacent cards. |

## Relationship to Phase 13

Phase 3.5 is not Phase 13. It improves popup behavior, side-panel sizing, and shell chrome hygiene for the existing workbench. Phase 13 remains responsible for advanced tab groups, tab movement, pinned/tab-state semantics, deeper session persistence, and later layout systems.
