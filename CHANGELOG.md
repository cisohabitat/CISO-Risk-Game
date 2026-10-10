# Changelog

What changed for players, newest first. Each release is cut with the checklist
in `docs/release/RELEASING.md`; the measured detail behind every fix is in
`docs/FINDINGS.md`.

## Unreleased — first public release candidate

The game as it stands after the roadmap's engineering phases
(`docs/ROADMAP.md`, Phases 0–7). Version 0.1.0 until the owner tags a release.

### Playing
- From a played year on seed harbour-87524:
  - Carrying the platform's recovery gap no longer records that backups
    recover within tolerance, the very thing the decision said was false.
  - The warning about a risk the board has not seen now waits until there
    is one, and names it.
  - Follow-up messages say what the test, the HR provider and the launch
    conditions actually came to.
  - An enquiry that traced a risk's route counts as having gone near it.
  - A risk already linked to its programme says so instead of offering the
    link again.
- **Meetings say what was said.** Listening goes through the person's own
  plan for the year, the systems it rests on and the worst risk you hold
  that reaches it. The note stays in the inbox.
- **Shortcut keys can be turned off**, beside Sound (WCAG 2.1.4).
- **Returned enquiries say what they reached:** the systems they mapped, the
  dependencies they traced, the controls they assessed, and what they
  confirmed.
- **More kinds of attack:**
  - an actor that wants an outage rather than a payment;
  - six new routes in;
  - three new kinds of incident (a wiped warehouse estate, a diverted
    payment, a tampered checkout);
  - a ransom demand that goes to the board with your recommendation.
- From the same panel:
  - The board's reading of each paper stays in the inbox.
  - Money that comes back says where it came from.
  - Attention costs show on the buttons that spend attention.
  - A hypothesis says it is a draft until it is raised.
  - Blocked programmes appear under "Waiting on you".
  - The commission dialog counts work already given to a lead.
  - The incident reconstruction counts the warnings an intrusion raised
    before it struck.
- **A second year that remembers the first.** "Begin your second year" on
  the review carries on at the same Nexora. Carried over:
  - the estate and what you found;
  - the controls and programmes;
  - the people and the team;
  - the risks you accepted.

  The budget is the one the autumn agreed. Seven new decisions and their
  replies answer last year's choices, the business has new plans, and the
  review compares the two years.
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
- From an AI playtest panel (`docs/playtests/2026-10-09-ai-panel-synthesis.md`):
  - Space, the arrow keys and the letter shortcuts no longer act from inside
    a dialog or a focused control. Space in a decision used to start the
    clock.
  - Focus moves to a new screen.
  - The dependency map names systems rather than ids.
  - Buttons say which item they act on.
  - "Record why first" can be reached and explains itself.
  - The funding slider reaches full funding.
  - On a phone, choosing a card takes you to its detail.
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
