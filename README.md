# CISO: First Year

A single-player cyber risk strategy game. You inherit Nexora Group as its new
Chief Information Security Officer and get one simulated year: 6,283 critical
vulnerabilities, a risk register nobody trusts, four transformation programmes,
a managed service provider with more privileged access than anyone documented,
and a CEO who wants three answers in twenty-three minutes.

**▶ Play it: [ciso-risk-game.vercel.app](https://ciso-risk-game.vercel.app)**

No account, no sign-in, nothing to install. The whole simulation runs in your
browser and your campaign saves to the device you played it on. New to it?
[`docs/PLAYER_GUIDE.md`](docs/PLAYER_GUIDE.md) assumes you know nothing about
the game or the subject.

Programme funding can start at half the quoted cost when money is tight, with
slower delivery. The engine and slider share that minimum; rejected starts,
acceleration and blocker resolutions preserve resources. Acceleration requires
its quoted quarter-cost allocation. Annual execution now credits delivered
progress, including unfinished work, rather than giving flat credit for starting.
Existing assessment safeguards and difficulty profiles remain in place.
Identity-enforcement and restore-window follow-ups can arise from day 210 when
80% of the relevant programme is delivered, bringing earned choices into Q3.

Run `pnpm --silent audit:balance 30` for paired strategy and difficulty probes.
The [balance review](docs/BALANCE_REVIEW.md) records the policies, before/after
results and remaining human validation. The £350k reserve is a probe policy;
it is not a protected budget or a guarantee about future costs.

Thirty selected Inbox messages offer **Play message** across all twelve recurring
characters. Priya, Nadia, Ruth, Fenella, Stefan and Callum join Marianne, Tomas,
Helen, Dev, Jo and Sir Alan. Coverage includes delivery pressure,
incident readiness, suspicious mailbox activity, acquisition and restore
outcomes, board expectations, procurement, legal questions, audit findings,
engineering concerns and the first-year review invitation.
Playback is optional and separate from sound effects.
The revised clips use the owner's approved CEO voice and explicit
sentence phrasing, varied pacing and short pauses throughout the catalogue.
Each speaker retains a consistent preset; the spoken words are unchanged.
The new board-chair clips are mastered to reduce their level difference from
the other speakers. The six added character profiles receive the same mastering
approach; all earlier eighteen recordings are retained. Four new profiles use
fixed blends of stock synthetic voices, recorded in the generation manifest.
Audio downloads and plays only when requested; native controls provide pause, seeking and
volume, with Replay message and Stop voice alongside. Leaving the reader stops
speech; hiding the tab pauses it. The full text always remains available.
Edited or mismatched correspondence does not play an outdated recording.
The [voice pilot notes](src/assets/voice/README.md) cover transcripts, offline
generation, attribution, asset budgets and the pending human listening review.
The [voice review](docs/VOICE_REVIEW.md) explains selection and remaining gaps.
The expanded recordings have a 3 MiB total allowance, downloaded only on request;
the 160 KiB per-clip and all first-visit budgets remain unchanged.

The design test applied to every feature is the one from the specification:

> **Am I managing cyber risk, or merely answering cybersecurity questions?**

There is no quiz, no compliance checklist, and no universal "cyber score". You
discover what matters, form and test hypotheses, prioritise scarce attention,
influence people you do not control, build capability over months, and live with
delayed consequences.

Secondary screens keep a compact incident summary and any response decisions
visible, with the factual response journal expandable. Briefing opens the full
journal. Sidebar utilities live under Help and settings so navigation has more
space. Team shows capacity and wellbeing separately; executive relationship
actions appear before expandable profile/history. Inbox uses tighter phone
spacing and shorter search guidance while retaining all filters and older mail.

During incidents, Inbox, Risk and Organisation retain usable independent
scroll panes even when response journals, decision receipts and guidance fill
the top of the screen. The page scrolls to make room rather than collapsing
the readers. Response journals and their message links use recorded incident
identity, so an earlier incident's review cannot announce a newer response as
closed. Older unlinked messages remain available in Inbox without guessed
attribution. Imported decisions with invalid incident references are rejected
before replacing or saving over the running campaign.

Skip ahead (also the right-arrow shortcut) now stops when new enquiry results,
follow-ups, programme milestones/completions, recorded SOC warnings or urgent
updates arrive. It identifies the update without opening or reading mail for
you, and unread backlogs do not prevent another skip. The ordinary timed clock
and threat model keep their existing rules. Milestone correspondence appears in
Briefing and Inbox under Programme delivery; this improves visibility of existing
work rather than adding more decisions. Human validation of pacing remains open.

Emerging concerns now explain that funding or linking treatment does not raise
a risk for the board. Examine and raise an appropriate concern in Risk, then
choose whether it belongs on the quarterly agenda. The Board screen preloads
after play begins to preserve the existing first-download size budget.

The checkout-framework threat explores AI-accelerated exploit development:
a fictional sector advisory reports working variants within hours, while the
normal patch window is eleven days away. You have two days to choose emergency
patching, restricted access, a temporary SOC watch or edge mitigation. Each
response has a recorded follow-up; watch reports reflect current logging
coverage, and delayed patching and capacity releases survive a year boundary.
The advisory does not prove an intrusion at Nexora. Existing controls and attack
paths determine incidents; there is no separate AI score or scripted breach.

The announced checkout patch window stays tied to the advisory even if you
answer later or let the decision lapse. Temporary capacity and exposure changes
return only the amount actually changed, retain unrelated later changes and
expire through the normal save/year-transition queue. Edge mitigation retires
when patching completes. Fixes apply to newly resolved choices; older saves'
already-queued effects retain their recorded amounts because their original
before-values were not saved.
The published campaign schema includes the new temporary-effect and timing
fields for authors of other campaign packs.

Development builds use Vite 8.3.5, which includes fixes for the launch-editor
advisories affecting Vite 8.3.0–8.3.2. Vitest and its coverage adapter use matching
5.0.3 releases, including fixes for unauthenticated mock registration and Windows
redirect-allowlist traversal in the mocker. These are development dependencies;
security auditing remains part of CI.

The title-screen footer shows the version and links to [release notes](https://ciso-risk-game.vercel.app/release-notes).
About lists the build's UTC timestamp and linked commit ID, and is also available
from the in-game rail or mobile menu in a separate tab. The version comes from
`package.json`, the notes from `CHANGELOG.md`; build provenance is generated
automatically. GitHub Releases holds named releases and downloadable static site
archives when a release is cut; ordinary pushes remain development builds.

The Briefing puts **Waiting on you** before the standing metrics, with the
earliest-due decision given more visual emphasis. The annual review opens with
the business outcome and highlights up to three recorded choices from the
beginning, middle and end of the year. These are a chronological sample, not
a score or a claim about which choices caused the outcome. The full timeline,
judgement log, sharing and printable review remain available.

Decision descriptions scroll with the paper while its title, Close button and
footer stay in view. This leaves more phone space for options and reasons.
Decision papers show the option count and available attention, with **Compare
options** and **Your reasons** shortcuts that move keyboard focus to the section.
Enquiry commissioning explains the cost, expected duration and where findings
arrive. Board papers explain the submission flow and distinguish recommendations
from actually starting a programme.
Phone incidents put containment and recovery side by side, with affected services
below them, bringing response controls closer without hiding any status.

Decision papers lead with the deadline, label budget and attention costs, and
mark the chosen option in words. The fixed footer repeats the selected option
and keeps rationale and commitment reachable on phones. The decision UI preloads
when play begins, with a loading dialog if needed. Incidents show current public
status, response choices, then the latest update; earlier history stays expandable.

Active programme status has a consistent position below its title and sponsor.
Phone risk tabs fade at edges with hidden tabs, matching the directional cue;
the fade never intercepts input. Inbox return and branding share one phone row,
leaving more room for the message while retaining the bottom return action.

Phone dates use a short month and week label, with full calendar context for
assistive technology. Risk badges omit words repeated in their field labels;
scroll cues point only toward hidden tabs. Inbox mastheads use less phone space.
Active programmes use a full-width desktop summary and delivery path, with
milestones stacked on smaller screens.

The phone header shows labelled budget and attention values beside the clock
controls. Risk tabs use one horizontal row below 768px, with a swipe cue and
arrow-key/Home/End navigation. The empty inspector explains what selecting a
scenario reveals. Programme groups use simpler dividers, and phone sender
blocks leave more room for message text while retaining full names and roles.

On phones, selecting an Inbox message moves to its reader; **Back to messages**
returns focus and position to the selected row. Returning to Inbox retains the
selected message. Unread membership remains stable while you read. Risk cards
align residual risk, confidence, owner and next review. Programme lists separate
Running, Paused, Blocked and Completed work, with controls retaining focus when
a row changes group. An at-risk badge alone does not mean delivery is blocked.

Inbox **Follow-ups** brings together recorded enquiry results, consequences,
acceptance updates, stopped work and incident reports, including read messages.
**Search messages** searches sender, subject and body across the entire selected
filter, including mail beyond the first page. Searching does not read results
automatically; choose a message to open it. The reader uses the same return
labels as the Briefing. Recurring correspondence stays available in full.
Search results keep a valid accessible reader target before a message is opened.

The Briefing explains that paused programmes make no delivery progress and
points to staffing and blockers before resuming. The annual review's **Show
earlier judgements** reveals records beyond the latest 14, with keyboard focus
on the first newly shown entry. **Replay this starting world (new tab)** opens
fresh campaign options with the same seed, mode and original opening situation;
export the original campaign for comparison. These changes do not establish
human engagement gains or physical iPhone/iPad scrolling validation.
Replay links preserve free-text campaign seeds, including spaces, non-English
characters and seeds longer than 64 characters; seed text is never treated as HTML.
It uses the same classification as the Briefing. **Show older messages** reveals
another batch beyond the initial 60 and focuses the first newly revealed row;
older selections remain reachable when returning to Inbox.

The annual review separates continuing with the organisation you built from
trying a different first year. Replay settings explain how to compare approaches:
keep the seed, opening situation and mode fixed, or choose a new seed for a
different starting world. These reading and replay changes do not alter balance,
create new situations or establish that pacing and learning have improved;
independent human and physical-device playtests are still required.

The next playtest round is ready in
[`docs/playtest-kit/FOCUSED_REVIEW.md`](docs/playtest-kit/FOCUSED_REVIEW.md): five
first-time players, stakeholder responses, repeated correspondence, quiet periods
and optional paired replays. It includes device coverage, neutral questions and
an evidence-to-change table. Participants and results remain outstanding; this
preparation does not establish that the game is more engaging.

The [content audit](docs/CONTENT_FLOW_AUDIT.md) is reproducible with
`pnpm audit:content-flow 6`: it traces scheduled replies, counts repeated
correspondence and compares two declared policies over matching seeds and two
years, with deterministic replays and daily invariant checks. These engine
probes do not establish that players notice or enjoy the differences.

Replies scheduled beyond December now keep their own required story flags when
the campaign continues. Delivery still checks current capability and suppression;
old budget choices are not restored into the new year's global flags. This
prevents a late commitment's reply from silently disappearing after annual reset.
Historical board-paper checks use the commitment's year, not January's empty list.
Older saves already missing those facts are not reconstructed by guessing.

Briefing programme summaries name their status and next outstanding milestone.
Enquiry names wrap and return dates are labelled approximately. The second-year
builder loads only when requested; duplicate clicks create one year, and a load
failure leaves the finished campaign open with its export action. The existing
first-visit size limits still apply.

Long correspondence, evidence and review text use consistent reading widths and
paragraph spacing. A short neutral highlight marks actual budget/attention or
recorded milestone changes. Loading a save does not replay it, and reduced-motion
preferences suppress it. These refinements change presentation only.

The working screens have distinct document styles: a morning Briefing,
correspondence in the Inbox, committee papers on Board and a response room for
incidents. Programme delivery paths distinguish completed milestones from the
next milestone, with paused/blocked status and intervention controls visible.
Important messages give known senders larger portraits, full names and roles;
unknown senders retain their original text.

A decorative office scene below the Briefing’s urgent work changes light with
the public quarter. The annual review pairs its recorded business outcome with
the same office at blue hour. These scenes do not encode success, risk or morale.
The 148.0 KiB atlas loads after play begins, within a separate 160 KiB limit;
all text and controls work if it fails, and printed reviews omit the artwork.

Active incidents put response decisions before the latest public update. Earlier
updates and recorded response choices expand on demand. Committing a decision
leaves a dismissible receipt of the chosen option and actual immediate budget,
attention and unfunded-commitment changes, newly added evidence, and links to new
messages. Later
consequences still arrive through the Inbox; the receipt does not predict them.
Played quarter boundaries add a Briefing recap of recorded choices, completed
programmes, the board paper and current outstanding work. These panels do not
pause time, change saves or reappear when loading a campaign. Programme
milestones and leadership notes expand separately from always-visible actions,
staffing and wellbeing. Optional feedback loading failures leave play available.

Decision papers separate the situation, options, costs, known effects and
reasons. Board papers group agenda evidence, recommendations and a live
submission summary. Inbox messages carry explicit type labels and icons.
The organisation map outlines the selected system and its directly connected
neighbours, with arrows pointing to dependencies. Direct neighbours are labelled
**Directly connected**, and the inspector shares the selected-system accent.
Map rows leave room for wrapped names and status labels. Team dossiers pair
workload and morale on phones, with track record beneath; function rows separate
capacity from wellbeing guidance. Team functions and programme
portfolios use quieter rows that stack on phones, keeping costs, staffing,
morale, blockers and actions visible.

The annual review has keyboard-accessible section links, labelled assessment
and quarter guides with a timeline marker key. Section links are omitted from
print. Board paper introductions scroll with the document; reporting period,
preparation date and submission deadline appear together above the agenda.

Annual assessments keep eight equally weighted dimensions, with rating
safeguards: any Weak dimension blocks Exceptional; Weak prioritisation or team
sustainability caps the result at Mixed; three Weak dimensions cap it at
Difficult. Exceptional also requires a completed recovery exercise/restore or
closed incidents with at least Solid resilience. Applied ceilings are explained
in the narrative. Programme execution retains delivery credit, while Strong
requires relevance in the upper half of the campaign's programme options,
using opening materiality and authored treatment links. Older saves without an
opening snapshot use the current picture, with that limitation stated. Stored
reviews keep their original assessment; new reviews use these rules.
Prioritisation and execution both exclude programmes completed in earlier years,
while retaining unfinished carry-over work. Recovery evidence and Exceptional
eligibility recognise test-tenancy restores in both the first and later years.
[Assessment rules and calibration](docs/ASSESSMENT.md) document the exact method.

Quarter recaps now explain what went well from recorded choices, programme
completions and board submissions, then name lapsed decisions and current public
workload, morale and blocker concerns. A practical next step opens the relevant
decision or workspace. Current concerns are dated, no hidden risk truth or interim
annual grade is exposed, and loading a save does not replay the recap.

At landscape widths (1024px and above), Inbox, Risk scenarios and Organisation
have independently scrolling list/map and detail panes. Browsing a list keeps the
reader in place; selecting another item returns its detail pane to the top.
Headers and filters remain reachable, and narrower layouts retain their existing
page scrolling and phone reader navigation. Map attribution uses the shared
minimum touch height and stays reachable inside its scroll pane. The panes have
separate frames and a wider gutter; Inbox gives the reader more room on tablets.
Messages, risks and systems share a consistent selection cue. Message subjects
lead the reading hierarchy, with quieter metadata and roomier phone spacing.
Tablet correspondence uses a compact letterhead and sender block; list sender
names can wrap to two lines. Organisation’s labelled System type dropdown keeps
filters compact. On stacked layouts, Back to risks / Back to systems restores
the selected row, and detail openings leave space beneath the fixed toolbar.

During gameplay, root overscroll controls and a targeted touch fallback suppress
accidental pull-to-refresh at the top of a page. Normal scrolling, dialog readers,
editing and pinch gestures remain available; the guard is removed on campaign
exit. Physical iPhone Chrome validation is still needed for browser-specific
refresh gestures.

## Security

Save imports are limited to 16 MiB and checked for unsafe properties, excessive
nesting and invalid numbers before migration. Engine checks and campaign identity
validation run before an import becomes active; rejected imports preserve the
current campaign and saved progress. Save exports can include your optional
notes, so share them deliberately.

The AI playtest driver binds only to 127.0.0.1, confines served files to the build
folder, and accepts bounded local JSON commands. CI uses read-only permissions,
immutable action revisions and a dependency audit. See [SECURITY.md](SECURITY.md)
for reporting and [the security review](docs/SECURITY_REVIEW.md) for scope and
verification. The code/CSS/font budget includes a 1 KiB allowance for this
validation boundary; complete-page download limits remain unchanged.

## Running it

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

Other commands:

| Command | What it does |
|---|---|
| `pnpm build` | Typecheck and produce the static `dist/` app |
| `pnpm preview` | Serve the production build locally |
| `pnpm test` | Engine, content and UI unit tests (Vitest) |
| `pnpm test:soak` | Seeded soak campaigns only |
| `pnpm validate:content` | Schema and referential validation of the campaign |
| `pnpm test:e2e` | Playwright across desktop, tablet, phone and 320px |
| `pnpm test:e2e:local` | The same without WebKit, for machines that cannot fetch it |
| `BASE_URL=… pnpm test:e2e:live` | Run the suite against a deployed URL |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript |
| `pnpm check` | Everything short of end-to-end, ending with a build and the size budget. It rewrites `dist/`, so do not run it while the browser suite is serving that directory |
| `pnpm build && pnpm size` | What a first-time player downloads, chunk by chunk, against the budget |
| `pnpm soak 1000` | 1,000 headless campaigns, checking for crashes and invariant failures |
| `pnpm coverage 60` | Which authored content a player actually reaches, and which mechanics ever fire |
| `pnpm screenshots` | Capture the screens for visual review |
| `pnpm tsx scripts/tune.ts 25` | Balance harness across policies and seeds |
| `pnpm tsx scripts/efficacy.ts 150` | Whether each programme reduces what it is meant to |
| `pnpm ladder sweep 15` | Whether one philosophy produces three different years across the modes |
| `pnpm ladder transcript ciso [seed] [situation]` | Everything one year says, in full: messages, decisions and the close |
| `pnpm play` | A year played by hand in the terminal, a decision at a time |
| `pnpm playthrough` | One campaign played end to end in a browser, photographed as it goes |
| `pnpm guide:shots` | Regenerate the pictures in `docs/PLAYER_GUIDE.md` from the running game |

## Contributor requirements

Keep [`AGENTS.md`](AGENTS.md) and this README updated in every change set.
Follow the repository instructions and keep documentation consistent with the
implementation and release workflow.

Save validation and writes run in request order, so a slow initial save cannot
overwrite a newer autosave after rapid actions. A failed write still reports
its error and permits subsequent saves.

Completed, verified changes are committed and pushed directly to `main` without
an additional confirmation, following the owner's standing instruction.

Before pushing, run `pnpm check`; UI changes also require
`pnpm test:e2e:local`. Before deploying, require both `pnpm check` and the full
`pnpm test:e2e` suite to pass for the exact revision being deployed. Run them
sequentially because both rebuild `dist/`. CI runs the full browser suite,
including WebKit; a local Chromium-only run does not replace that release gate.
If checks cannot run or fail, deployment stays pending.

Vercel runs `pnpm check` as its build command, blocking the hosted build on
typecheck, lint, content, unit test, build or size failures. Browser tests run
separately in CI: confirm both CI jobs pass before deploying or promoting.
After deployment, run `BASE_URL=<deployment-url> pnpm test:e2e:live` and complete
the release gate in [`docs/HOSTING.md`](docs/HOSTING.md).

## How it is put together

```
Responsive UI  (React screens, mobile / tablet / desktop presentations)
      |
Application layer  (Zustand store, IndexedDB persistence, selectors)
      |
Game orchestrator  (src/game/engine/orchestrator.ts — the only entry point)
      |
Pure TypeScript engine  (risk · threats · events · programmes · incidents · team)
      |
Game state  (one serialisable object) ─── IndexedDB save on device
```

Rules the code holds to, and tests enforce:

- **The engine is pure.** Nothing under `src/game/` imports React, the DOM,
  storage or any SDK. ESLint fails the build if it does.
- **No `Math.random()` in simulation.** Every draw comes from the seeded RNG in
  `src/game/engine/rng.ts`, with the cursor stored in game state, so a save
  reproduces its own future exactly.
- **One effect reducer.** Content and player actions describe change as data
  (`GameEffect`); `src/game/engine/effects.ts` is the only thing that applies it.
- **Hidden truth stays hidden.** The organisation graph the simulation reasons
  about is not the graph the player sees. Selectors only ever expose discovered
  state, and an invariant test fails if an undiscovered node reaches the UI.
- **Bands, not numbers.** Internal values are 0..1; the UI renders "Elevated",
  "Stretched", "Limited". Risk state never depends on colour alone.
- **The tick order is a contract.** `src/game/engine/tick.ts` runs a fixed
  seventeen-step day, covered by a test that fails if it is reordered.

The original build specification is committed verbatim at
[`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — it is what the
code comments mean when they cite "plan §13". Alongside it:
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md),
[`docs/CONTENT.md`](docs/CONTENT.md), [`docs/HOSTING.md`](docs/HOSTING.md).

## Campaign content

Everything about Nexora is data under `src/content/nexora/`, validated by Zod
schemas and a referential integrity pass:

| | |
|---|---:|
| Organisation nodes / dependencies | 38 / 52 |
| Business services / objectives | 5 / 5 |
| Executives / cyber leaders | 8 / 4 |
| Security controls | 13 |
| Cyber programmes | 6 |
| Threat actors / attack paths / incident families | 3 / 8 / 5 |
| Evidence items (including deliberate noise) | 48 |
| Hypothesis templates / risk scenarios | 14 / 14 |
| Lines of enquiry | 18 |
| Decisions / decision options | 26 / 80 |
| Events | 123 |

`pnpm validate:content` checks for missing ids, duplicate ids, impossible event
conditions, unreachable decisions, invalid effect targets and dependency cycles.

## How it behaves

1,000 automated campaigns across all three difficulties and all four starting
situations (`pnpm soak 1000`, under a minute):

```
  crashes            0
  invariant failures 0
  incidents per run  1.05
  years with none    34%
  years with 4+      1%
```

A year is neither a procession of disasters nor a year in which nothing happens,
and stronger controls measurably reduce both the number of incidents and what
they cost — without ever guaranteeing a clean year. Both properties are asserted
in `tests/engine/soak.test.ts`.

## Replayability

Every campaign has a visible seed. The seed fixes which awkward dependencies
exist in this Nexora (a managed service provider with standing domain admin, a
routable path from the legacy estate into production, a peering link nobody
remembers creating), how good the controls actually are behind the assurance
paperwork, what the executives are like, where the vacancies fall, and how the
threat environment behaves. Share a seed to compare two people playing the same
organisation.

A year also begins in one of four situations — the usual inherited mess, after
a breach, new money with short patience, or a tidy inheritance — or one drawn
from the seed. Each changes the budget and the threat, sends its own messages,
asks one decision the others never see, and is answered in the annual review.
The review ends with a way into another year, and the start screen keeps every
year played.

## Artwork

The start screen uses the approved Singapore office scene, with separate
desktop and phone compositions. **Begin your first year** starts immediately
using the current/default options; **Continue campaign** resumes the latest
save when one exists. **Campaign options** leads to difficulty, starting
situation, Replay settings and import; **Saved campaigns** leads to the recent
save list. These controls remain accessible HTML over a dark fallback, so an
unavailable image never prevents play. This replaces the original opening
layout without adding an extra splash step.

Only one title scene downloads per viewport: 119.2 KiB on desktop or 75.7 KiB
on phones below 640px. `pnpm size` separately enforces scene limits (135/90 KiB)
and rendering limits including code, CSS and fonts (350/320 KiB). The complete
visit also includes the background campaign prefetch, with limits of
450/410 KiB; this prefetch does not block the title screen's controls.
Portrait and incident artwork still loads only when its screen needs it.

Nexora has a geometric company mark and twelve AI-generated editorial portraits:
eight executives and four cyber leaders. Faces appear on Board and Team cards
and beside messages from named characters. Names and relationship labels remain
readable text; missing artwork falls back to initials.

The portraits share one 80,460-byte WebP atlas, loaded lazily when people appear.
It is not requested by the start screen. The company mark is inline SVG and
follows the light and dark theme. Artwork sources, character order and replacement
instructions are documented in [`src/assets/art/README.md`](src/assets/art/README.md).

The people directories use larger portraits. Board papers have a committee
masthead, Inbox messages use a correspondence layout, and the annual review
uses an editorial cover and reading column. Routine messages, assignments and
past board meetings use compact rows. Empty states have small vector vignettes
and contextual next actions.

Four restrained incident scenes appear with the response journal and incident
reconstructions. They are decorative; dates, decisions and response status stay
in text. Their shared 123,886-byte image loads only when shown.

Headings use self-hosted Newsreader Semibold (23,756 bytes, SIL Open Font
License); body copy keeps the system sans-serif stack. The first-visit budget
now counts fonts as well as JavaScript and CSS, with a 220 KiB limit. Font
sources and licensing are in [`src/assets/fonts/README.md`](src/assets/fonts/README.md).

Unread keeps its message list stable while you read it; select Unread again
to refresh the list. Opening one message leaves the rest unread. At year-end,
the empty decision panel points to the annual review instead of advancing time.

Closed incident reconstructions are available in **Your year** before the
annual review. New SOC signals retain exact provenance for dated links back to
their messages. Older saves and messages that aged out show an explicit
limitation. Control descriptions refer to the incident-debrief assessment,
not a recorded intrusion-time or per-route control snapshot.

The Briefing labels room for work as **Unallocated capacity**. Team separates
this from morale, lists current programme, delegated and unplanned commitments,
and explains whether current staffing and workload allow slow recovery. These
are conditional daily directions, not historical trends or guaranteed dates.

The desktop rail and mobile More menu separate workload capacity from wellbeing,
name every struggling function, and link to workload and recovery guidance.
During an active incident, an empty decision list directs keyboard focus back
to the response journal. Closed incident recaps include recorded choices and
exactly linked phase updates where retained, without changing Skip ahead pauses
or estimating outcomes for choices the player did not make.

Board papers identify the reporting quarter and the following presentation
quarter. An empty agenda explains its eligibility rules, keeps programme
recommendations available, and links to Risk. Low morale and completed checks
alone do not create an agenda item; eligibility and scoring are unchanged.

## Hosting

The production build is a static application: no server rendering, no API
routes, no cron, no database, no runtime secret. It deploys to Vercel Hobby (or
any static host) and the whole campaign runs in the browser with saves in
IndexedDB. See [`docs/HOSTING.md`](docs/HOSTING.md), including the release gate.

Live at **<https://ciso-risk-game.vercel.app>**. The release gate's last step
runs the end-to-end suite against that deployment rather than a local build,
because SPA rewrites, headers, caching and asset paths are only exercised by the
real thing:

```bash
BASE_URL=https://ciso-risk-game.vercel.app pnpm test:e2e:live
```

Vercel Hobby is for personal, non-commercial use. A commercial or organisational
deployment needs an appropriate paid plan.

WebKit coverage runs in CI (`pnpm exec playwright install webkit`). Sandboxes
that cannot download it should use `pnpm test:e2e:local`.

## Accessibility

Phone and tablet portrait layouts scroll the page naturally; desktop layouts
use a separate scrolling content pane. Scroll containment applies only to the
desktop pane so it cannot trap page scrolling on narrower screens.
Horizontal filter rows also pass vertical scroll input through to the page or
content pane.

At short desktop heights (768px and below), the whole navigation rail scrolls
so every destination and bottom control remains reachable, including when the
wellbeing summary lists every function. The browser suite checks vertical
scrolling, the final control on each main screen and scroll reset on navigation,
alongside horizontal overflow.
See the [scrolling review](docs/SCROLLING_REVIEW.md) for the viewport matrix,
populated states and review limits.

Targets WCAG 2.2 AA: keyboard navigable throughout, semantic landmarks, visible
focus, 44px touch targets, 16px body input text, no hover-only information,
motion that respects `prefers-reduced-motion`, textual equivalents for the
dependency graph, and risk state that never depends on colour perception.

An automated axe-core audit runs as part of the end-to-end suite
(`tests/e2e/accessibility.spec.ts`): every screen, in both themes, at desktop and
320px, with zero WCAG 2 A/AA violations. It is not a substitute for manual
testing with a screen reader, which has not been done.

## Licence

The code and campaign content in this repository are provided for the purposes
of the project they were written for. Nexora Group, its people and its incidents
are fictional.
