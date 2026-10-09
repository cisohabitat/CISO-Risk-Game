# Roadmap: from a finished MVP to a AAA year

What it would take for *CISO: First Year* to stand beside the best strategy
games in its class, set out in phases with a gate on each. Written against the
state of the repository on 9 October 2026 (167 commits, 405 unit and content
tests, 209 browser tests, five AI playtests, one human year).

This document is a plan, not a promise. Every phase names what it would
measure, because the working rule of this project is that a claim about the
game is checked by a harness or by a person, not asserted. Where a phase
depends on something only people can tell us, it says so, and it does not
start until they have.

## What "AAA" means here

Not a studio's budget. For a single-player browser strategy game made by a
small team, the bar is that a player who knows nothing about the subject can
sit down, be taught by the game itself, finish a year that felt like theirs,
want a second one, and tell someone else about it — on a phone, offline, with
a screen reader, in their own language — and that the team can see, from
evidence rather than hope, that this is happening. Concretely:

| Pillar | AAA means | Where the game is now |
|---|---|---|
| **Evidence** | Decisions about the design rest on players, not simulation | **D.** Five playtests are an AI driving a browser; one human has played one year. Nothing in `docs/PLAYTEST.md`'s open questions has an answer. |
| **Teaches itself** | A newcomer finishes Q1 without the guide and can say what they learned | **Unknown.** This is the question the playtests exist to ask. The lessons, glossary-at-point-of-confusion and `/guide` are in place. |
| **Systems** | A simulation that is honest, deterministic and never contradicts itself | **A.** Pure engine, seeded RNG, one effect reducer, hidden truth kept hidden, bands not numbers; soak 1000 clean; the review has been held to agreeing with itself by test. |
| **Content and writing** | Every line in the organisation's own voice; no two years the same | **B+.** One organisation (Nexora: 38 nodes, 52 edges, 13 controls), 38 decisions, 176 events, 18 enquiries, 6 programmes, 14 risks, 5 incident families, 8 attack paths, 4 starting situations. Q3 is the lightest quarter, June the thinnest month. |
| **Replay** | A second year, a second organisation, a reason to come back | **C+.** A finished year can lead to another; situations differ in budget, threat and one decision each; there is one organisation. |
| **Presentation** | A visual identity you would recognise, motion that explains, sound that is optional | **A−** on screens (five visual rounds, measured in `docs/FINDINGS.md`); no motion design, no sound, generic type pairing, monograms rather than people. |
| **Accessibility** | WCAG 2.2 AA verified with assistive-technology users, not just axe | **B+.** Axe clean on every screen, keyboard-complete, status regions announced; never tested with a screen-reader user. |
| **Localisation** | At least one language besides English, and the pipeline to add more | **None.** `en-GB`, strings inline, content authored in English JSON. |
| **Platform** | Installable, offline, resilient saves, fast on a cheap phone | **B.** Manifest only (no service worker, by design until iOS update behaviour is tested); IndexedDB saves with export after year end; 180.5 kB critical path against 185; Slow 3G measured. |
| **Live** | The team can see what players do and tune from it | **None.** No telemetry, no crash reporting, no release cadence beyond CI. |

The two weakest rows — evidence and localisation — are the ones no amount of
further building fixes. That is why Phase 0 is people, and why the roadmap is
ordered so that the expensive phases (a second organisation, sound, a second
language) are reached only once the cheap, decisive one has answered its
questions.

## Rules that hold through every phase

These are not up for trade in any phase. They are what makes the game the
game, and several are enforced by tests that scan the engine.

- The engine stays pure and deterministic: no React, DOM, storage or SDK under
  `src/game/`; every draw from the seeded RNG with the cursor in state.
- One effect reducer; content and actions describe change as data.
- Hidden truth stays hidden; selectors expose discovered state only.
- Bands, not numbers; no visible universal score, ever (plan §2.9).
- Static-first, free-tier hosting; nothing required online to play (plan §3.1,
  §32.8). Cloud sync and accounts stay optional if they arrive at all.
- `pnpm check` before every push; browser suite for anything touching the UI;
  a finding goes to `docs/FINDINGS.md` once it is closed, with how it was
  measured.
- **Mechanics do not change on a desk decision.** Until Phase 0 reports, the
  feature set is frozen (`CLAUDE.md`, "Where the project is"). A playtest asks;
  then a change is made, measured, and recorded.

---

## Phase 0 — Evidence (people, not simulation)

**Goal.** Replace "nobody has played this" with eight to twelve recorded human
sessions and a decision on each of the open questions in `docs/PLAYTEST.md`.

**Why first.** Everything after this is either cheap and obviously good
(fixing what people stumble on) or expensive and uncertain (a second
organisation, sound, a second language). Without sessions, the expensive
phases are guesses and the cheap one has no list.

**Deliverables.**
- A playtest cohort across the three personas the AI sessions have already
  stood in for: an experienced CISO, a newcomer to the role, and someone with
  no security knowledge at all. Three to four sessions each; at least
  two players finish a full year; at least two play on a phone.
- A session kit: the facilitator script in `docs/PLAYTEST.md` turned into a
  one-page protocol, a consent note, a timed observation sheet (where they
  stopped reading, what they opened first, when they first commissioned an
  enquiry, when they first felt lost), and the post-session questions the
  guide already lists. **Built** — `docs/playtest-kit/`.
- An opt-in **local** session log: the game records its own event stream
  (screen changes, decisions, commissions, pauses, lesson dismissals, with
  the seed and day) in the browser's storage and offers it as a JSON export
  at the end of the session. No server, no network; the player hands the file
  over. This is the only instrumentation Phase 0 needs and it is reused by
  Phase 6. **Built** — `/?playtest`, `pnpm session <file>`.
- One report per session in `docs/playtests/`, in the existing format, plus a
  single synthesis (template: `docs/playtest-kit/SYNTHESIS.md`): a ranked list of what people stumbled on, and an answer
  (or "still open, needs N more sessions") for each of the six questions
  under "Questions only people can settle".

**Measures.** Q1 completion rate without opening the guide; minutes to first
enquiry and first decision; whether the player can name the biggest risk and
why; whether the fourth quarter read as the year building; which mode new
players chose and whether the name matched what they got; the post-session
"what did you learn" answer, verbatim.

**Gate to Phase 1.** Synthesis written; at least two-thirds of the open
questions answered; a ranked stumble list. If the synthesis says the game does
not teach itself, Phase 1 grows and Phase 2 waits.

**Effort.** Two to four weeks of calendar time, mostly scheduling; about one
week of engineering for the session log and kit.

---

## Phase 1 — Teaches itself (onboarding, clarity, voice)

**Goal.** A newcomer finishes the first quarter unaided and can say what the
two scarce resources are and why the risk list is ordered the way it is.

**Deliverables.**
- Act on the Phase 0 stumble list, highest first. Expect this to be text and
  affordances rather than mechanics: where the first morning points, what the
  briefing's headline says when nothing is waiting, what a risk card's words
  mean, what "Commission" will cost before it is pressed. **Waiting on
  Phase 0** — there is no stumble list yet.
- A **voice guide** (`docs/VOICE.md`): the organisation's register, what the
  game never says (scores, "you should"), how executives and leaders differ
  in tone, how a consequence is phrased so it reads as the player's own choice
  coming back. Then a full text pass over every authored line — 38 decisions,
  176 events, 18 enquiries, the review's sentences — against it. The content
  tests that already forbid claims a condition does not check stay the gate.
  **Guide built** (`docs/VOICE.md`), with its mechanical half enforced on
  every authored string and lesson by `tests/content/voice.test.ts`: British
  spelling, no exclamation marks, no ids or day numbers in prose, and no
  praise, prescription, scores or hacker cliché in the game's own voice. The
  2,261 strings passed as written; the read-aloud half of the pass still
  needs a writer.
- Decide the mode names on evidence ("Guided" versus "Supported" is an open
  question; do not rename on one person's word). **Waiting on Phase 0.**
- Resolve the June gap *only if* players said the back half felt like more
  of the same: one decision arising from the player's own position in early
  summer, authored like the four late-year follow-ups, measured with
  `pnpm coverage 60` and the per-month decision counts in `CLAUDE.md`.
  **Waiting on Phase 0.**
- First-session flow on a phone: the start screen, the first decision dialog
  and the first briefing at 320 px, reviewed with the same rigour as desktop
  (`pnpm screenshots` already photographs both). **Done:** the gallery now
  photographs the start screen and every screen at 320 px; the header, which
  had wrapped to three rows (162 px) there, is two (121 px), held by
  `tests/e2e/first-session.spec.ts`.

**Measures.** Re-run Phase 0's protocol with four fresh newcomers after the
pass; Q1 unaided completion should move, and the stumble list should be
different. `pnpm ladder transcript` read end to end once per mode for voice
consistency. Guide test still green (`tests/content/guide.test.ts`).

**Gate to Phase 2.** Four fresh newcomers finish Q1 unaided; the voice pass
is complete and recorded in `docs/FINDINGS.md`.

**Effort.** Four to six weeks; needs a writer or an author willing to read
every line, and four more playtesters.

---

## Phase 2 — Depth and replay

**Goal.** A second year is a different year, and there is a second
organisation to be CISO of.

**Deliverables.**
- **Content pipeline first.** The campaign is JSON validated by schema at
  load; before writing a second one, make authoring tractable: a content
  linter that runs the existing claim-vs-condition checks and the coverage
  harness on any pack, a `docs/CONTENT.md` walkthrough that a new author can
  follow to add a decision end to end, and a reference-resolution check (every
  `nodeId`, `controlId`, `stakeholderId` resolves). Measure by having
  somebody who did not build the game add one decision from the docs alone.
  **Built:** `pnpm validate:content`, `pnpm coverage` and `pnpm soak` take
  `--pack file.json`; validation applies the voice rules and reports the
  pack against the content budget; `pnpm content:bundle` writes Nexora as a
  pack to start from; `docs/content/campaign.schema.json` is the published
  schema (`pnpm content:schema`, held current by test); `docs/CONTENT.md`
  has the walkthrough, "Starting a second campaign". References were
  already checked. The measure — somebody else following it — is still open.
  The Nexora-specific content tests (claims against conditions, repeats,
  decisions) still read Nexora only; they move to the pack when a second
  one exists to run them on.
- **A second organisation.** A different sector so the lessons differ — a
  regional hospital group or a water utility both put safety and regulators
  where Nexora puts payments and growth. Same engine, new pack: 30–40 nodes,
  10–14 risks, 5–6 incident families, 30+ decisions, 150+ events, its own
  executives and situations. Sized by the MVP content budget (plan §4.3),
  which Nexora shows is enough for a year. **Not started:** waits on Phase 0
  and a content author.
- **Year Two that remembers.** A finished year already leads to another;
  make the second year start from the first's estate, controls, relationships
  and open acceptances, with the review's "next year's priorities" decision
  honoured as the board's expectation. Measured with the ladder: a Year Two
  after a strong Year One should read differently from one after a weak
  one, in the same way the three modes already do. **Not started:** a
  mechanic change, so it waits on a playtest asking for it.
- **Threat variety.** Incident families 5 → 8, attack paths 8 → 14, a third
  actor with a different objective (disruption rather than money). Measured
  with `scripts/efficacy.ts` so each programme still reduces what it is meant
  to, and `pnpm ladder bands` so the risk rows do not all read the same.
  **Not started:** the threat engine is frozen until a playtest asks.
- **Situations with weight**, if Phase 0 said they felt light: each starting
  situation gets a second decision of its own and one executive whose
  standing starts somewhere other than neutral.

**Measures.** `pnpm soak 1000` clean on both packs; `pnpm coverage 60` shows
at least 85% of authored content reachable; `pnpm tsx scripts/tune.ts 25`
shows play styles still diverge; a Year Two ladder sweep. Two playtesters who
finished Nexora play the second organisation and are asked which lesson was
new.

**Gate to Phase 3.** Second pack passes every harness the first does; three
players have played a Year Two.

**Effort.** Ten to fourteen weeks; the longest phase, most of it authoring.

---

## Phase 3 — Presentation

**Goal.** A visual identity the game is recognised by, motion that explains
the clock and the arrival of consequence, and sound that is off until wanted.

**Deliverables.**
- **Identity.** A commissioned type pairing (display and text) replacing the
  system stack; a restrained illustration style for the eight executives and
  four leaders, replacing monograms — faces change how "Marianne will
  remember" lands; a mark for the game itself. Dark mode designed, not
  derived. **Not started:** needs an illustrator and a type designer, and
  the first screen has 3.5 kB of its budget left; fonts and portraits will
  need the budget revised on purpose.
- **Motion with a purpose.** The day advancing, a message arriving, a
  decision's deadline closing, the incident bar appearing: each gets one
  deliberate transition, all honouring `prefers-reduced-motion`. No
  decoration that does not carry information. **Built:** an incident
  arrives, the unread count pops when mail comes, a new decision rises into
  the list, and the year strip fills; all still under reduced motion
  (`tests/e2e/presentation.spec.ts`).
- **Documents as documents.** The board paper rendered as the paper the
  committee would hold; the annual review exportable as a PDF a player could
  show their own board; the inbox message as a memo with letterhead. The
  game's conceit is that you are reading your organisation's paperwork — the
  screens should look like it. **Review built:** **Print or save as PDF**
  sets the annual review on white without the shell, in light colours from
  either theme, rows kept whole across pages (`tests/e2e/print.spec.ts`
  checks the PDF runs to several pages). The board paper and the memo
  letterhead are not started.
- **Sound, optional.** A small palette: the clock, a message, the incident
  bar, the quarter closing, the review. Off by default, muted on first run, a
  single toggle in the header. Never the only channel for information.
  **Built:** synthesised cues (no audio files) for mail, a decision falling
  due, an incident, a quarter closing and the year's end; off until turned
  on, from the rail or More rather than the header, which has no room on a
  phone; loaded only when on.
- **Loading and empty states** given the same care as the screens: the
  campaign chunk fetch, "Drawing the dependency map…", the first morning
  before anything has come back.

**Measures.** `pnpm screenshots` and `pnpm guide:shots` re-reviewed on every
change; axe still clean; the size budget revised *on purpose* with the
reason in `docs/HOSTING.md` (fonts and illustration will cost; Slow 3G
start-screen time re-measured and the trade stated); Lighthouse performance
and accessibility both above 90 on a throttled profile.

**Gate to Phase 4.** Identity shipped on every screen; two playtesters asked
unprompted what they thought of how it looks.

**Effort.** Six to ten weeks; needs an illustrator and, for sound, a designer
for about a week.

---

## Phase 4 — Accessibility and localisation

**Goal.** Verified with assistive-technology users, and playable in a second
language.

**Deliverables.**
- **WCAG 2.2 AA audit by people.** Two sessions with screen-reader users
  (NVDA on Windows, VoiceOver on iOS), one with a keyboard-only user, one
  with a player using 200% text scaling. Fix what they find; record each in
  `docs/FINDINGS.md`. The organisation graph needs an equivalent that is not
  "use the list" but a navigable dependency walk.
- **Reduced motion and colour independence** proven, not assumed: every
  band already carries a glyph; check it on a deuteranopia simulation and
  in the board paper's new badges.
- **String extraction.** Every UI string into a message catalogue; every
  authored content string keyed so a pack can carry a second locale file.
  Dates, money and plurals through `Intl`. A pseudo-locale build in CI that
  fails if a hard-coded English string reaches a screen.
- **One real second language** as proof of the pipeline, chosen by where the
  audience is (the guide, the content and the UI together — the content is
  the large part, about 3,000 authored sentences for Nexora). A native-speaking
  reviewer plays a quarter.

**Measures.** AT session reports; pseudo-locale CI gate green; the second
language passes the same content tests as English.

**Gate to Phase 5.** AT findings closed; one language shipped end to end.

**Effort.** Six to eight weeks plus translation.

---

## Phase 5 — Robustness and platform

**Goal.** Installable, offline, with saves that survive anything, fast on a
cheap phone.

**Deliverables.**
- **Service worker with tested updates.** The plan deferred this until update
  behaviour was tested on iOS (§32.12); test it: a Playwright profile that
  installs, goes offline, resumes a saved year, and then takes an update
  without losing the campaign. The existing "page reloads once to pick up the
  new version" behaviour becomes the update prompt.
- **Save integrity.** Versioned save migrations with a test per version;
  corruption detection with recovery to the last good autosave; export and
  import at any time, not only after year end; an "every save must reproduce
  its own future" determinism test on real exported saves.
- **Low-end performance.** A budget on a Moto G-class Android profile: start
  screen under 4 s on Fast 3G, a day tick under 16 ms, the graph under 2 s to
  first paint. Measured in CI, not by hand.
- **Client-side crash capture**, opt-in, to a local log the player can export
  — the same channel as the Phase 0 session log.
- **Optional cloud sync** (plan Phase 8) only if Phase 0 or Phase 6 shows
  players losing campaigns across devices. If built: a backend with row-level
  security, sync on checkpoints, local always authoritative, nothing required
  to play.

**Measures.** Offline-resume and update Playwright tests green on desktop,
Android and iOS profiles; save round-trip soak; the performance budget in CI.

**Gate to Phase 6.** Install → offline → resume → update works on iOS Safari
without a lost campaign.

**Effort.** Four to six weeks.

---

## Phase 6 — Live: telemetry, tuning and the people who play it

**Goal.** The team can see what players do and tune from it, and players have
reasons to come back and bring others.

**Deliverables.**
- **Opt-in aggregate telemetry.** The Phase 0 session log, with consent,
  sent as anonymous aggregates (no identifiers, no free text): mode chosen,
  quarter reached, decisions taken, enquiries commissioned, incidents met,
  review band. A dashboard answering the questions the harnesses answer today
  but for real players: where years stop, which decisions are never taken,
  whether Q3 is still quiet.
- **A tuning cadence.** Monthly: read the dashboard, pick one finding,
  change it, measure with the harness that fits, record it in
  `docs/FINDINGS.md`. The same discipline the project has used from a desk,
  fed by people.
- **A shareable year.** The annual review as a card the player can share — a
  headline, a band per dimension, the seed — without a score, because there
  is no score. A "play this seed" link so two people can compare years.
- **Educator mode.** The audience includes people teaching this: a
  facilitator's pack with a cohort of fixed seeds, a debrief question set per
  quarter, and a classroom start page. The `/guide` plugin is the publishing
  path. Measured by one course running it.
- **Content packs as a format.** The second organisation proved the pipeline;
  publish the pack schema and the linter so others can author one. Packs load
  from a URL or a file; the game stays static.

**Measures.** Telemetry consent rate; Year Two start rate; seed-link usage;
one educator cohort's completion rate.

**Gate to Phase 7.** Three months of dashboard data; one educator cohort.

**Effort.** Four to six weeks of engineering, then ongoing.

---

## Phase 7 — Release

**Goal.** A launch that matches the product: a landing page, a trailer, a
press kit, a support path, and the definition of done below met.

**Deliverables.** A landing page at the root that is not the start screen
(the start screen stays one click away); a 90-second trailer cut from the
photographed playthrough; a press kit with the identity assets; an
accessibility statement; a support address and a known-issues page generated
from `docs/FINDINGS.md`'s open section; a release cadence (monthly, with
notes); listing on a games storefront that accepts browser titles.

**Definition of AAA-done.** Every row of the table at the top at A or A−,
with the evidence row's grade earned by at least thirty recorded human
sessions across two organisations and two languages.

**Effort.** Three to four weeks.

---

## Sequencing and effort

| Phase | Weeks | Needs people | Starts when |
|---|---|---|---|
| 0 Evidence | 2–4 | 8–12 playtesters | Now |
| 1 Teaches itself | 4–6 | a writer, 4 playtesters | Phase 0 synthesis |
| 2 Depth and replay | 10–14 | a content author | Phase 1 gate |
| 3 Presentation | 6–10 | illustrator, sound designer | Phase 2 gate (identity work can start during Phase 2) |
| 4 Accessibility and localisation | 6–8 | AT testers, a translator | Phase 3 gate (string extraction can start during Phase 3) |
| 5 Robustness and platform | 4–6 | — | Phase 4 gate (can run alongside Phase 4) |
| 6 Live | 4–6, then ongoing | an educator | Phase 5 gate |
| 7 Release | 3–4 | — | Phase 6 gate |

Serial, that is nine to twelve months for one engineer and one author with
the specialists brought in for their weeks. Phases 3–5 overlap well; Phases
0–2 do not, because each decides the next.

## What this roadmap deliberately does not do

- **It does not add mechanics on its own authority.** Every mechanic change
  above is conditional on a playtest finding, in keeping with the rule in
  `CLAUDE.md` that further simulation from a desk is more likely to make the
  game worse than better.
- **It does not add a score, a leaderboard or a win condition.** The game's
  thesis is that there is no universal cyber score; a shareable year carries
  bands and a headline, nothing to rank.
- **It does not add a server to play.** Telemetry and sync are opt-in and
  additive; the static, free-tier guarantee holds.
- **It does not mark decision effects as gains or costs.** Many are
  two-edged by design; the game does not tell the player which consequence is
  good (`docs/FINDINGS.md`, fourth visual round).

## How to use this document

Pick the phase whose gate is open — today that is Phase 0 — and work its
deliverables in order. When a phase closes, record what was measured against
its gate in `docs/FINDINGS.md`, update the scorecard at the top of this file,
and move the "Where the project is" paragraph in `CLAUDE.md`. A phase that
cannot meet its gate is not skipped; it is narrowed, and the reason is
written down here.
