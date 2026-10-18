# Scrolling and viewport review

Review date: 16 October 2026. Production build, populated campaign on day 200,
plus prepared Board, active-incident and annual-review states.

## Confirmed defects and fixes

At 1366×480, listing all six struggling functions made the desktop rail's
navigation menu collapse to **0px**. The fixed-height rail reserved space for
the header and wellbeing summary before allocating space to the menu.
Horizontal-overflow checks alone did not catch the inaccessible destinations.

At desktop heights up to 768px, the rail now scrolls as one column. Its header,
menu and summary retain their natural height. In the reproduced case the menu
is 507px tall inside a 1,044px rail document with a 480px viewport; every
destination, Glossary and the bottom shortcut control can be reached. Restoring
the old flex rules reproduces the zero-height menu.

A new wheel-input regression then found a second defect on tablet portrait:
the main pane used `overflow-y: auto` and overscroll containment while growing
to its full content height. Wheel input over it left both the pane and page at
scroll position zero. Main-pane overflow and containment now apply only at the
desktop breakpoint. Narrower layouts use normal page scrolling. The regression
uses real wheel input on every main screen in both themes; programmatic
`scrollIntoView` alone did not expose this issue.
A separate 400px wheel gesture confirmed the old rules kept both positions at
zero and the fixed rules moved the page to 400px.

Horizontal filter rows had the same containment problem independently of the
main pane: a 200px vertical wheel gesture over Inbox filters at 320px left the
page at zero, then moved it to 200px after removing the vertical containment.
The shared filter control and Organisation type filters now contain only
horizontal overscroll. The screen regression sends vertical input over these
rows rather than avoiding them.

## Review coverage

Each viewport was checked in light and dark themes:

| Browser | Viewport | Purpose |
|---|---|---|
| Chromium | 1440×900 | Desktop |
| WebKit | 1280×800 | Safari engine |
| Chromium | 1366×480 | Short desktop, expanded wellbeing summary |
| Chromium | 834×1112 | Tablet portrait |
| Chromium | 1112×834 | Tablet landscape |
| Chromium | 393×852 | Phone |
| Chromium | 320×640 | Minimum supported width |
| Chromium | 568×320 | Short phone landscape |

The review covers the start screen and Replay settings; Guide, About and
Accessibility pages; all eight campaign destinations; Risk detail and all four
tabs; Organisation list, inspector and graph where available; More and Glossary;
Board-paper and decision dialogs; active incidents and the annual review.
Programme, risk-acceptance, investigation and hypothesis forms were also checked
at 1366×480, 568×320 and 320×640 in both themes.

The completed audit contains 402 screen checks and 24 additional form checks,
with no page or main-region horizontal overflow. The rail's fixed layout passed
the reachability checks. This initial audit preceded the wheel-input finding;
the permanent regressions and full browser suite verify the final layout.
The WebKit probe exception below was checked separately.

Checks measure page and main-region horizontal overflow and scroll each visible
control into view, checking clipping ancestors and whether another surface
covers its hit area. Sticky readers' final paragraphs are checked as well.
Graph nodes use a deliberately pannable canvas and are excluded from the
ordinary-control reachability probe. This review does not establish screen
reader usability or cover every possible campaign state.

A WebKit inline-link result on About was a probe timing artefact: a separate
Playwright scroll and keyboard-focus check placed the repository link inside
the viewport. No product change was needed for that result.

## Repeatable regressions

`tests/e2e/scrolling.spec.ts` checks vertical scrolling, the last enabled control
on every campaign destination, horizontal overflow, and scroll reset on
navigation in both themes across the six standard browser projects. It also
checks the short desktop rail with all six functions struggling in Chromium
and WebKit. The existing tall-dialog regression in `campaign.spec.ts` checks
dialog-body scrolling and footer reachability.

Run these against a fresh production build with:

```sh
pnpm test:e2e tests/e2e/scrolling.spec.ts --workers=2
```

The complete release gate remains `pnpm check`, followed sequentially by the
full `pnpm test:e2e` suite.

## Independent landscape panes

Inbox, Risk scenarios and Organisation now bound the two workspace columns at
1024px and above, with separate vertical scrolling and contained overscroll.
The shared main pane does not move when either column is scrolled. Detail
selection resets the reader only; narrow layouts and print retain document flow.
`scrolling.spec.ts` checks real wheel input at 1024px and 1366px in Chromium and
WebKit, sibling stability, scroll limits, detail reset and rotation to 834px.
These browser checks do not replace a physical iPad touch test.
