# Changelog

What changed for players, newest first. Each release is cut with the checklist
in `docs/release/RELEASING.md`; the measured detail behind every fix is in
`docs/FINDINGS.md`.

## Unreleased — first public release candidate

The game as it stands after the roadmap's engineering phases
(`docs/ROADMAP.md`, Phases 0–7). Version 0.1.0 until the owner tags a release.

### Playing
- One simulated year at Nexora Group in three modes (Guided, CISO, High
  pressure) and four starting situations, with an annual review that reads
  the year in eight bands and no score.
- **Share this year** on the review sends its headline, each dimension's band
  and a link that opens the same year for whoever receives it. Links of the
  form `/?seed=…&mode=…&situation=…` open the start screen on that year.
- **Print or save as PDF** sets the review out as a document.
- Export a campaign from **Your year** at any point in the year, not only at
  its end.
- Optional sound, off until turned on.

### Reliability
- Each campaign keeps the save before its latest; a damaged save opens from
  that one and says so. A broken state is never written over a good save.
- A screen that fails to draw no longer blanks the page.
- Dates everywhere, including the review and the messages, instead of day
  numbers.

### Access
- Every screen is checked against WCAG 2.2 A/AA in both themes, at 320px and
  up, on every change. Following a dependency in the organisation view moves
  focus to where it lands and keeps a trail back. Reduced motion stops all
  animation. See `/accessibility`.

### Presentation
- One line-icon set, sentence-case labels, a key on the dependency map, a
  year strip, ratings on the board paper's agenda, and motion only where
  something arrives.

### For facilitators and authors
- `/?playtest` records a session on the player's device for a playtest;
  `pnpm session` reads one or many logs. The kit is in `docs/playtest-kit/`.
- A facilitator's pack for teaching with the game (`docs/educator/`), with
  characterised seeds from `pnpm cohort`.
- Content packs can be validated, sized and voice-checked with
  `pnpm validate:content --pack`; the schema is published in `docs/content/`.
