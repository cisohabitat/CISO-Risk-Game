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

## Status reviewed 29 October 2026

This review checks repository sources and recorded findings, not a new playtest,
performance run or release verification. The 9 October column below is historical;
the current column describes implementation separately from human validation.
Owners below are proposed roles, **unassigned**, not staffing commitments. All
remaining-work rows were reviewed on 29 October 2026. Estimates are planning
ranges for unfinished work only; person-weeks exclude recruitment, procurement,
translation turnaround and waiting at the existing phase gates. Re-estimate after
the pilot; these ranges are not measured delivery forecasts.

| Phase / remaining work | Status | Proposed owner (unassigned) | Remaining effort | Evidence / acceptance reference |
|---|---|---|---|---|
| 0: five-player focused review | Protocol ready; no participants/results recorded | Research lead | 1–2 person-weeks; 2–4 calendar weeks to recruit/run | [Focused review](playtest-kit/FOCUSED_REVIEW.md) |
| 0: independent 8–12-player pilot and synthesis | Outstanding; focused round does not complete this gate | Research lead | 1–2 person-weeks; 2–4 calendar weeks, subject to recruitment | [Protocol](playtest-kit/PROTOCOL.md), [synthesis template](playtest-kit/SYNTHESIS.md) |
| 1: observed clarity fixes, voice read-through, fresh-newcomer retest | Implementation foundations built; fixes depend on pilot findings; human voice review open | Engineer + writer + research lead | Provisional 2–4 person-weeks, then four fresh-newcomer sessions | [Phase 1 gate](#phase-1--teaches-itself-onboarding-clarity-voice), [voice guide](VOICE.md) |
| 2: independent author trial and pack-wide claim checks | Pipeline built; external author trial and generalised Nexora checks remain | Content author + engineer | 1–2 person-weeks before/alongside second-pack authoring | [Authoring walkthrough](CONTENT.md), [pack loader](../scripts/content/pack.ts) |
| 2: second organisation | Not started; evidence-gated | Content author + engineer | Provisional 8–12 person-weeks, including pack validation | [Phase 2 scope/gate](#phase-2--depth-and-replay) |
| 2: Year Two human validation; stronger starting situations if needed | Year Two and threat variety built; perceived differences unvalidated | Research lead + content author | 0.5–1 person-week for three Year Two sessions/synthesis; situation changes unestimated until findings | [Year Two builder](../src/game/engine/next-year.ts), [playtest questions](PLAYTEST.md) |
| 3: art/type review, optional commissioning and sound review | Identity, motion, layouts and cues built; human review open | Art director + sound designer + research lead | 1–2 person-weeks for review/refinement; optional commissions quoted separately | [Art catalogue](../src/assets/art/README.md), [presentation tests](../tests/e2e/presentation.spec.ts) |
| 3: human listening review | 34 exact-transcript clips built; listening review pending | Audio reviewer + research lead | 0.5–1 person-week | [Voice review](VOICE_REVIEW.md), [manifest](../src/assets/voice/manifest.json) |
| 3: throttled performance/accessibility measurement | Automated checks exist; required Lighthouse result not established by this review | Engineer | 0.5–1 person-week, fixes scoped from results | [Phase 3 measures](#phase-3--presentation), [hosting gates](HOSTING.md) |
| 4: assistive-technology, keyboard, large-text and physical-device sessions | Dependency walk built; sessions outstanding | Accessibility specialist + research lead | 1–2 person-weeks plus recruitment; remediation estimated from findings | [Accessibility statement](release/ACCESSIBILITY.md), [focused device review](playtest-kit/FOCUSED_REVIEW.md) |
| 4: colour-vision simulation | Text/glyph review recorded; requested simulation remains open | Accessibility specialist | 0.25–0.5 person-week | [Phase 4 checks](#phase-4--accessibility-and-localisation) |
| 4: string extraction, Intl and pseudo-locale CI | Inventory/planning only | Engineer | Provisional 3–5 person-weeks | [Localisation plan](LOCALISATION.md) |
| 4: one second language and native-speaker playthrough | Not started; language/reviewer not selected | Translator + native reviewer + engineer | Translation quote needed after refreshed word inventory; 1–2 engineering person-weeks for integration/QA | [Localisation plan](LOCALISATION.md), [Phase 4 gate](#phase-4--accessibility-and-localisation) |
| 5: offline installation/update and physical iOS verification | Service worker not started; saves/recovery already built | Engineer + device tester | Provisional 3–5 person-weeks, including update/recovery tests | [Phase 5 acceptance](#phase-5--robustness-and-platform), [browser configuration](../playwright.config.ts) |
| 5: network/graph performance measurement | CPU checks built; throttled network CI and graph first-paint measurement open | Engineer | 1–2 person-weeks | [Performance scope](#phase-5--robustness-and-platform), [size gate](../scripts/size-budget.ts) |
| 5: optional cloud sync | Conditional; no demonstrated need recorded here | Engineer | Unestimated until cross-device loss evidence and scope exist | [Phase 5 condition](#phase-5--robustness-and-platform) |
| 6: consented aggregate telemetry/dashboard and tuning | Local logs/analyser and cadence written; collection endpoint absent | Engineer + research lead | Provisional 3–4 person-weeks; then ongoing monthly review and three months of data for existing gate | [Session analyser](../scripts/session.ts), [tuning protocol](PLAYTEST.md) |
| 6: educator cohort/classroom entry | Facilitator pack built; course not run; classroom entry remains to assess | Educator + engineer | 1–2 person-weeks plus course scheduling | [Facilitator pack](educator/FACILITATOR.md) |
| 6: in-game external pack loading | Schema/linter built; runtime loading waits for second pack | Engineer | Provisional 1–2 person-weeks after second-pack validation | [Pack schema](content/campaign.schema.json), [Phase 6 scope](#phase-6--live-telemetry-tuning-and-the-people-who-play-it) |
| 7: trailer, press kit, tagged release and optional storefront | About/accessibility/release guidance built; remaining launch assets unassembled | Release owner + video editor | Provisional 2–3 person-weeks; storefront publication remains owner decision | [Release checklist](release/RELEASING.md), [trailer shot list](release/TRAILER.md), [store copy](release/STORE.md) |

The estimates above supersede the original whole-phase effort figures for
remaining-work planning; those figures below remain historical scope estimates.
Conditional work is not a commitment. Shareable-year and seed-link features are
already implemented; they need usage evidence rather than another build.

## Newcomer feedback received 29 October 2026

An [owner-supplied newcomer report](playtests/2026-10-29-owner-supplied-newcomer.md)
reached Week 37 on Guided / The inherited mess in about 35 minutes, including
4× speed; it did not reach the ending or test mobile. Build, seed, participant
independence and session recording are unknown. Preserve it as one reported
session with source triage, separately from the independent pilot and focused
recruitment slots. It does not close a gate or upgrade a grade.

The report supports prioritising understandable progress expectations, a first
step in Risk, jargon at point of use and access to dismissed lessons. A progress
explanation should use the existing eight assessment dimensions and public
records; it must not introduce a universal score or a mid-year annual grade.
Raising a scenario enables board eligibility; it does not put it on the submitted
agenda automatically. Retest that distinction explicitly.

First reproduce the reported SOC deadline lapse, attention mismatch, rationale
label and cost visibility on an identified build. Current source already covers
some of these paths, which is not proof of what this player saw. Review persistent
receipts and within-band confidence wording as presentation concerns. Mail
consolidation, new stakeholder replies and pacing changes still need specific,
repeated observations. Preserve the named reactions, delayed evidence and quarter
collision explanation this player valued. Full triage and retest tasks are in
the linked report.

### Implementation follow-through, 29 October

The newcomer pass adds Briefing assessment guidance, a foldable evidence-first
Risk guide, revisitable lessons, game-term word links, missing glossary terms,
explicit free/paid enquiry quotes, cross-screen impending-deadline notices,
current-versus-weekly attention wording, within-band confidence reactions and
receipt expiry when time advances. It preserves engine deadlines, defaults,
assessment rules and simulation balance. Attention and required-rationale
regressions are checked against the current code; the supplied played-build
mismatches remain unreproduced. Human retests and pilot gates remain open.

## CISO feedback received 29 October 2026

A separate [owner-supplied CISO report](playtests/2026-10-29-owner-supplied-ciso.md)
finished a year with a Credible assessment and four of five business objectives.
Build/seed and protocol metadata were not supplied. Late defaulted choices,
including next year's budget, must be excluded from claims about intended
strategy. This is a reported full-year experience, not a completed independent
pilot slot or permission to add mechanics.

Source review prioritises two concrete gaps: a “funded” audit commitment that
neither reserves budget nor starts a programme, and board papers omitted from the
global decision-deadline notice. Reproduce scenario/agenda identity, submission
counts, Skip ahead and notification discrepancies against an identified save.
Clarify weekly attention, conditional durations and qualitative relationship
changes before changing balance. Recovery/prioritisation grades do not imply that
all identity/cloud risks were treated.

Insurance and risk-appetite correspondence, intelligence advisories, an
IR-readiness review and ransom negotiation already exist. Check reachability,
noticeability and depth before adding duplicates. The readiness review is not
proof of a fully implemented tabletop exercise; its assessment credit needs
comparison with authored findings. New insurer, appetite-policy and operational
metrics mechanics remain separate proposals. The report's triage table records
source evidence, limits and retest tasks. Human gates and grades remain open.

## Product-manager feedback received 29 October 2026

The [owner-supplied product-manager report](playtests/2026-10-29-owner-supplied-product-manager.md)
describes two completed campaigns: a passive CISO / inherited-mess run and an
active Guided / after-breach run. Different modes, situations and unknown seeds
prevent a controlled strategy comparison. They are two runs by one reported
participant, not two independent participants; protocol/build metadata and mobile
observations are absent.

Prioritise reproducing the reported clock/default hazard even though incident
and new authored-decision pause flags already exist. Inspect UI callbacks,
queued advances and resume behaviour. Material board items are labelled Required
but can be omitted without a pre-submission guard; make that consequence explicit
before acceptance. Reconcile paper records and repair singular grammar.

Separate node/dependency discovery, deliberate/default decisions and offered/
submitted/missed board papers in the review. The reported 18 deliberate choices
plus nine defaults can correctly produce 27 history entries; 38 known systems
can coexist with hidden dependencies. These are clarity hypotheses until a save
establishes an arithmetic defect. Repeated exposure and recovery performance are
also different claims; calibrate any assessment change separately.

Retest the weekly loop, attention refresh, reason requirements, opening context
and artwork fallbacks. Treat the offer to make a Page as quoted feedback, not
permission to create or share one. The triage record preserves source evidence
and retest tasks; human gates and grades remain open.

## Combined-report implementation follow-through, 30 October 2026

The current pass implements clock callback/modal/visibility guards, board deadline
warnings and a pre-deadline pause, an explicit material-omission guard, named
emerging/previous agenda distinctions, audit promise quotes and persistent
follow-through, and a conditional unfunded-promise consequence for new choices.
It reconciles review record counts and labels, explains attention/reason/base
programme duration/trust movement, surfaces existing governance correspondence,
and fixes decorative-art failure fallbacks and starting-situation context.
[Findings](FINDINGS.md) records actual checks. Stored assessments and dimension
weights are unchanged. The new conditional audit consequence is the only scoped
authored balance change; broad evasive-option, burnout and strategy claims still
need controlled evidence. New insurer/appetite-policy/tabletop/metrics mechanics
remain proposals. No independent-pilot or physical-device gate is closed here.

### Next-step appetite slice, 30 October

The owner's “ok next” continues the report backlog with board appetite. The
existing voiced letter remains intact and schedules a discussion; Moderate and
Elevated residual delegation choices record a statement, and deferral remains
possible. Board and risk acceptance show that statement, unassessed acceptances
and accepted exceptions. Paper feedback names exceptions using the existing
omission consequence, without an additional penalty or automatic approval.
A thirty-day review reads the current acceptance register; earlier statements
survive through Year Two history. This implements residual delegation only.
Aggregate exposure, service-specific tolerances, exception approvals, insurance,
full tabletop and operational-response metrics remain separate scope. Educator
seed examples were remeasured rather than assumed stable under added content.
Human validation and roadmap grades remain open.

### Newcomer retest follow-through, 30 October

A further [owner-supplied retest](playtests/2026-10-30-owner-supplied-newcomer-retest.md)
reports improved raised-risk persistence, commissioning explanations and deadline
visibility, while leaving Q3 lapse behaviour untested. Its build/seed/protocol
remain unknown. The follow-through records checkpoint outcomes, fixes percentage
rounding and counter meanings, exposes all counted work, clarifies capacity and
wellbeing, retains enquiry reports and action confirmations, and adds budget
activity and quiet-week notes from recorded facts. Supported earlier route
choices are named in reconstruction; repeated responses/reasons receive context.
No annual weights, incident rates, budget amounts or morale bonuses change.
The reported budget sequence and missing January report still lack an identified
save; old outcomes/transactions are not reconstructed. Human gates and grades
remain open. [Findings](FINDINGS.md) records verification and limits.

### Product-manager retest follow-through, 30 October

The [30 October product-manager retest](playtests/2026-10-30-owner-supplied-product-manager-retest.md)
adds action/weekly holds at high speed, continuous paper alerts, material defaults,
agenda-range guidance and quarter-specific approval. Reporting/preparation/
submission dates and Q4 annual closure are now explained. Reviews share system
and dependency counts with live views, state partial objective delivery and use
full programme names. These are clarity/clock fixes, not a new fourth paper or
changed balance/ratings. Declared paired probes remain separate from the supplied
run's unverified burnout and budget sequence; independent gates stay open.

### Newcomer completion follow-through, 30 October

The [newcomer completion account](playtests/2026-10-30-owner-supplied-newcomer-completion.md)
is one session with corrected newbie attribution, not an independent CISO pilot.
Its next slice protects existing decisions from Skip, opens week-one assessment
guidance and nudges stretched teams. A Guided starter menu, contextual terms,
quoted risk-raising cost and actual meeting/funding feedback address reading
load without a live grader or balance change. Reported late objectives and
physical-device/learning outcomes remain unverified without identified evidence.

### CISO closing retest follow-through, 30 October

The [supplied closing account](playtests/2026-10-30-owner-supplied-ciso-closing-retest.md)
has no identified build/seed/mode and does not establish independent pilot evidence.
Implementation separates optional hypotheses from attention, unread from total
mail, and raised-register membership from agenda eligibility. Actual blocker
and budget receipts explain slow completion without a separate fix; a played
year offers December updates before review navigation. Fractional workload and
zero-capacity pressure are visible; no burnout retuning is claimed.
[Objective probes](OBJECTIVE_REVIEW.md) show choice responsiveness and correct a
displayed deadline error without changing delivery or grading. Independent
learning/fairness gates remain open; this does not close the Phase 0 pilot.

### Five-run CISO follow-through, 30 October

The [five supplied campaigns](playtests/2026-10-30-owner-supplied-five-run-ciso-review.md)
confound strategy, scenario and difficulty. The [engineering review](FIVE_RUN_REVIEW.md)
separates that report from matched probes. Implementation holds the played final
day before explicit closure, adds visible business commitments, fixes idle strain
and vacancy pressure, and makes weak business enablement a critical ceiling in
new reviews. Reference mail and recent Briefing cards are distinct from current
work. No difficulty-profile tuning is inferred from the five runs; independent
human-learning/fairness gates remain open.

### Guided four-scenario follow-through, 31 October

The [supplied account](playtests/2026-10-31-owner-supplied-guided-four-scenarios.md)
includes three morning runs and an earlier night; builds/seeds and independence
remain unknown. UI pacing now shares one skip boundary and Guided weekly hold.
Delivery/exploration prompts, visible setup/build metadata, week-one receipts
and agenda/refusal explanations improve discoverability. Start/reload failures
were not reproduced on current source. No scenario balance or grade changes are
inferred; independent learning and perceived-difficulty gates remain open.

## 20 October review follow-through

The owner authorised the B-and-below review roadmap: clarity, mobile reading,
pacing and replay, in that order. This pass addresses the implementation work
without changing simulation balance or adding authored filler:

| Priority | Implemented | Still needs evidence |
|---|---|---|
| Clarity | Focused shortcuts to decision options/reasons, available attention, corrected footer copy, enquiry/result and board-submission guidance | Four of five newcomers complete the opening and commission an enquiry unaided, then explain the trade-off |
| Mobile reading | Reach older Inbox messages beyond the initial 60, focus the newly revealed batch, preserve reachable retained selections | Physical iPhone/iPad scrolling, large-text and keyboard checks; browser emulation is not device validation |
| Pacing | Follow-ups view exposes recorded results/consequences and incident updates alongside read messages | Full-year human observations of skipped mail, quiet weeks and repetition before consolidating or adding content |
| Replay | Separate continuing Nexora from a fresh first year; explain fixed-setup strategy comparisons and different starting seeds | Returning players identify meaningful differences; deeper authored reactions and another organisation remain evidence-gated |

The independent 8–12-player pilot remains outstanding; the supplied newcomer report does not complete it. Use the existing
`docs/playtest-kit/` protocol and session recording; do not upgrade grades or
claim engagement/learning gains from browser checks alone.

The owner accepted the next recommendations: investigate stakeholder
follow-through first if human observations support it, then routine mail, quiet
periods and replay differences. The smaller
[five-player focused review](playtest-kit/FOCUSED_REVIEW.md) is ready to run with
neutral prompts, physical-device slots and two optional paired replays. It is
preparation for human sessions, not completed evidence or a replacement for the
broader pilot. Content changes follow the findings table and its retest tasks.

The [content-flow audit](CONTENT_FLOW_AUDIT.md) provides concrete engine
evidence across 24 campaign years and 24 deterministic replays. It fixes replies
lost at the year boundary and clarifies existing work on the Briefing. Repeated
mail and long decision-arrival gaps are recorded as human-test candidates;
different branch/review records are not evidence of engagement.

The owner subsequently authorised the B+-and-below fixes. The next implementation
pass adds full-filter Inbox search without reading transient results, consistent
return labels in the message reader, plain-language hypothesis guidance and
paused-delivery guidance. Annual judgements beyond the latest 14 are now
reachable, and a direct link opens the original first-year seed/mode/situation
in fresh campaign options. These improve retrieval and comparison without
suppressing recurring reports, changing simulation timing or adding mechanics.
The priority is now physical-device usability, clarity, stakeholder follow-through,
pacing, then replay. The five-player observation targets and independent pilot
remain unmet until actual sessions provide evidence; grades remain provisional.

## What "AAA" means here

On 21 October 2026 the owner authorised a focused AI-accelerated threat addition.
The existing checkout exploit now asks for a response within two days, preserves
its earlier option IDs, adds restricted access and answers each choice. It uses
existing control, exposure, capacity and delivery effects; incidents still follow
the simulation. This is a scoped content addition, not evidence that pacing or
replay grades have improved. Human review should ask whether players distinguish
faster exploit development from proof of compromise and understand the cost of
carrying exposure until a planned patch window.

Not a studio's budget. For a single-player browser strategy game made by a
small team, the bar is that a player who knows nothing about the subject can
sit down, be taught by the game itself, finish a year that felt like theirs,
want a second one, and tell someone else about it — on a phone, offline, with
a screen reader, in their own language — and that the team can see, from
evidence rather than hope, that this is happening. Concretely:

| Pillar | AAA means | 9 October 2026, before | 29 October 2026 source review (human gates remain open) |
|---|---|---|---|
| **Evidence** | Decisions about the design rest on players, not simulation | **D.** Five playtests are an AI driving a browser; one human has played one year. Nothing in `docs/PLAYTEST.md`'s open questions has an answer. | **D.** Kit built (session log, protocol, synthesis); one owner-supplied unfinished newcomer report received on 29 October, with build and independence unknown. Independent pilot and synthesis remain outstanding. |
| **Teaches itself** | A newcomer finishes Q1 without the guide and can say what they learned | **Unknown.** This is the question the playtests exist to ask. The lessons, glossary-at-point-of-confusion and `/guide` are in place. | **Unknown.** A voice guide holds every string; the 320px first session is fixed; whether it teaches still needs people. |
| **Systems** | A simulation that is honest, deterministic and never contradicts itself | **A.** Pure engine, seeded RNG, one effect reducer, hidden truth kept hidden, bands not numbers; soak 1000 clean; the review has been held to agreeing with itself by test. | **A.** Saves now carry a backup and are checked against the invariants before they are written. |
| **Content and writing** | Every line in the organisation's own voice; no two years the same | **B+.** One organisation (Nexora: 38 nodes, 52 edges, 13 controls), 38 decisions, 176 events, 18 enquiries, 6 programmes, 14 risks, 5 incident families, 8 attack paths, 4 starting situations. Q3 is the lightest quarter, June the thinnest month. | **B+.** The content passed the voice rules as written; four actors, 8 incident families, 14 attack paths, 17 risks, 50 decisions, 227 events, and a second year of its own; still one organisation; Q3 and June unchanged. |
| **Replay** | A second year, a second organisation, a reason to come back | **C+.** A finished year can lead to another; situations differ in budget, threat and one decision each; there is one organisation. | **B.** Seed links and a shareable year give a reason to compare and come back; a second year remembers the first, and reads differently after a strong year than after an idle one. Still one organisation. |
| **Presentation** | A visual identity you would recognise, motion that explains, sound that is optional | **A−** on screens (five visual rounds, measured in `docs/FINDINGS.md`); no motion design, no sound, generic type pairing, monograms rather than people. | **A−.** Arrival motion, optional sound, an editorial review, twelve larger portraits, a Nexora mark, self-hosted display typography, distinct document layouts, incident scenes and illustrated empty states; human art review remains open. |
| **Accessibility** | WCAG 2.2 AA verified with assistive-technology users, not just axe | **B+.** Axe clean on every screen, keyboard-complete, status regions announced; never tested with a screen-reader user. | **B+.** A keyboard walk of the dependency map and a public statement; still never tested with assistive-technology users. |
| **Localisation** | At least one language besides English, and the pipeline to add more | **None.** `en-GB`, strings inline, content authored in English JSON. | **D.** Sized (`pnpm strings`: about 30,000 words) and planned (`docs/LOCALISATION.md`); nothing translated. |
| **Platform** | Installable, offline, resilient saves, fast on a cheap phone | **B.** Manifest only (no service worker, by design until iOS update behaviour is tested); IndexedDB saves with export after year end; 180.5 kB critical path against 185; Slow 3G measured. | **B+.** Backup and recovery, a per-screen error boundary, mid-year export, a CPU budget in CI; no offline play. The current code/CSS/font limit is 221 KiB; the recorded Inbox split measured 192.6 KiB, not remeasured in this review ([finding](FINDINGS.md)). |
| **Live** | The team can see what players do and tune from it | **None.** No telemetry, no crash reporting, no release cadence beyond CI. | **D.** Crash capture to a local log, `pnpm session` across many logs and a monthly cadence; no telemetry, no release yet. |

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

**Original whole-phase estimate (not remaining effort).** Two to four weeks of calendar time, mostly scheduling; about one
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

**Original whole-phase estimate (not remaining effort).** Four to six weeks; needs a writer or an author willing to read
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
  one, in the same way the three modes already do. **Built** (9 October
  2026, at the owner's request, ahead of a playtest asking for it):
  - "Begin your second year" on the review starts the next year from the
    finished one (`src/game/engine/next-year.ts`).
  - Carried over: the estate, controls, programmes, relationships, the team
    and open acceptances.
  - The budget follows the autumn decision.
  - Thirty-five messages and seven decisions answer last year through
    `lastYear.*` conditions, including the board's priorities, adopted in
    January and checked at half-time.
  - `pnpm ladder`, `pnpm soak` and `pnpm coverage` take `--years 2`.

  Measured over 30 CISO seeds with the same second year after each kind of
  first: board standing 0.66 against 0.33 on the first morning, incidents
  1.10 against 1.83, objectives missed 0.07 against 2.13
  (`docs/FINDINGS.md`). Whether a second year *feels* different is still a
  playtest question.
- **Threat variety.** Incident families 5 → 8, attack paths 8 → 14, a third
  actor with a different objective (disruption rather than money). Measured
  with `scripts/efficacy.ts` so each programme still reduces what it is meant
  to, and `pnpm ladder bands` so the risk rows do not all read the same.
  **Built** (9 October 2026, at the owner's request), as content: the engine
  did not change.
  - **A disruption actor.** Black Tern wants the outage seen rather than
    paid.
  - **Six more routes (8 → 14).** Through the remote access appliance to
    the warehouses; through the build pipeline to the checkout; through a
    finance mailbox, and through the HR provider, to payments; through a
    forgotten service account to the backups; and through Kestrel to the
    deal room.
  - **Three more families (5 → 8).** Destructive attack, payment diversion
    and platform tampering.
  - **Three risks to raise.** Each has its own hypothesis and evidence.
  - **Four response decisions.** Restore or rebuild; recall a payment; what
    customers are told; and a ransom note put to the board, which the
    ransomware family now carries.

  Coverage over 60 campaigns walks all 14 routes, all 4 actors and all 8
  families. Soak is clean over 1000 campaigns, and over 300 two-year
  campaigns. Efficacy: every programme still cuts what it targets on its own
  routes, and attackers turned away find more routes than before. The
  ladder's CISO incidents rose from 0.60 to 0.93 (`CLAUDE.md`, "Known
  weaknesses").
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

**Original whole-phase estimate (not remaining effort).** Ten to fourteen weeks; the longest phase, most of it authoring.

---

## Phase 3 — Presentation

**Goal.** A visual identity the game is recognised by, motion that explains
the clock and the arrival of consequence, and sound that is off until wanted.

**Deliverables.**
- **Identity.** A commissioned type pairing (display and text) replacing the
  system stack; a restrained illustration style for the eight executives and
  four leaders, replacing monograms — faces change how "Marianne will
  remember" lands; a mark for the game itself. Dark mode designed, not
  derived. **Partly built:** twelve AI-generated editorial portraits now replace
  monograms on Board and Team, with the sender's portrait in named messages.
  A geometric Nexora mark appears at arrival, in the rail and on correspondence.
  The shared 80,460-byte WebP atlas loads lazily; names and initials fallbacks
  remain text. See `src/assets/art/README.md`. The commissioned type pairing
  and human art review are still open. The editorial pass adds self-hosted
  Newsreader with system sans-serif body text, larger directory portraits,
  committee papers, an editorial annual review, correspondence layouts, compact
  routine records, illustrated empty states and four restrained incident scenes.
  Its current code/CSS/font budget is 221 KiB including the display font; the approved
  illustrated title screen adds one responsive scene with rendering budgets of
  350 KiB desktop and 320 KiB phone (450/410 KiB including campaign prefetch). Portraits and
  incident scenes remain separate lazy image downloads. A custom commissioned
  typeface is still optional future work.
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
  checks the PDF runs to several pages). **Editorial layouts built:** committee
  mastheads and dated management papers, a correspondence reader with ruled
  message rows, an annual-review cover and readable narrative column, and a
  response journal drawn from the incident's actual dated messages. Decorative
  incident scenes are omitted from print and the review cover prints white.
- **Sound, optional.** A small palette: the clock, a message, the incident
  bar, the quarter closing, the review. Off by default, muted on first run, a
  single toggle in the header. Never the only channel for information.
  **Built:** synthesised cues (no audio files) for mail, a decision falling
  due, an incident, a quarter closing and the year's end; off until turned
  on, from the rail or More rather than the header, which has no room on a
  phone; loaded only when on.
- **Loading and empty states** given the same care as the screens: the
  campaign chunk fetch, "Drawing the dependency map…", the first morning
  before anything has come back. **Empty states built:** small thematic vector
  vignettes for research, correspondence, people and maps, with explanations
  and contextual next actions. No additional image download.

**Measures.** `pnpm screenshots` and `pnpm guide:shots` re-reviewed on every
change; axe still clean; the size budget revised *on purpose* with the
reason in `docs/HOSTING.md` (fonts and illustration will cost; Slow 3G
start-screen time re-measured and the trade stated); Lighthouse performance
and accessibility both above 90 on a throttled profile.

**Gate to Phase 4.** Identity shipped on every screen; two playtesters asked
unprompted what they thought of how it looks.

**Original whole-phase estimate (not remaining effort).** Six to ten weeks; needs an illustrator and, for sound, a designer
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
  "use the list" but a navigable dependency walk. **Walk built:** following
  a dependency in the inspector moves focus to the system it arrives at (a
  screen reader announces it), and a trail of the route walked offers each
  step back; picking from the list or graph starts a new walk. The sessions
  with people are not started.
- **Reduced motion and colour independence** proven, not assumed: every
  band already carries a glyph; check it on a deuteranopia simulation and
  in the board paper's new badges. **Checked by reading:** every band badge
  carries a word and a height glyph (▁▃▅▆█), graph cards print their type,
  and the timeline's lanes are labelled; no badge depends on hue.
- **String extraction.** Every UI string into a message catalogue; every
  authored content string keyed so a pack can carry a second locale file.
  Dates, money and plurals through `Intl`. A pseudo-locale build in CI that
  fails if a hard-coded English string reaches a screen. **Measured, not
  built:** `pnpm strings` counts about 30,000 words — 80% content, 13%
  engine sentences, 7% screens — and `docs/LOCALISATION.md` sets out the
  order of work. A translation of content is a translated pack through the
  Phase 2 pipeline. The save list's time, which used the browser's locale,
  now uses the interface's.
- **One real second language** as proof of the pipeline, chosen by where the
  audience is (the guide, the content and the UI together — the content is
  the large part, about 3,000 authored sentences for Nexora). A native-speaking
  reviewer plays a quarter.

**Measures.** AT session reports; pseudo-locale CI gate green; the second
language passes the same content tests as English.

**Gate to Phase 5.** AT findings closed; one language shipped end to end.

**Original whole-phase estimate (not remaining effort).** Six to eight weeks plus translation.

---

## Phase 5 — Robustness and platform

**Goal.** Installable, offline, with saves that survive anything, fast on a
cheap phone.

**Deliverables.**
- **Service worker with tested updates.** The plan deferred this until update
  behaviour was tested on iOS (§32.12); test it: a Playwright profile that
  installs, goes offline, resumes a saved year, and then takes an update
  without losing the campaign. The existing "page reloads once to pick up the
  new version" behaviour becomes the update prompt. **Not started:** physical iOS Safari installation/update validation remains
  outstanding. The maintained browser suite includes desktop WebKit as well as
  Chromium; neither desktop WebKit nor device emulation establishes physical
  iOS installation/update behaviour. The plan defers aggressive caching until
  that behaviour is tested.
- **Save integrity.** Versioned save migrations with a test per version;
  corruption detection with recovery to the last good autosave; export and
  import at any time, not only after year end; an "every save must reproduce
  its own future" determinism test on real exported saves. **Built:** each
  write that moves the year on keeps the previous save as a backup; a save
  that will not open, or opens failing the engine's invariants, opens from
  the backup and says so; the store refuses to write a state that fails the
  invariants, tells the player once, and keeps the save they have; export is
  offered from **Your year** at any point, not only after the review. The
  migrations and the resume-from-save determinism tests already existed.
- **Low-end performance.** A budget on a Moto G-class Android profile: start
  screen under 4 s on Fast 3G, a day tick under 16 ms, the graph under 2 s to
  first paint. Measured in CI, not by hand. **Built, for the CPU:** a day
  costs 0.17 ms in the engine (budget 2 ms); under a 4× slower CPU the start
  screen is ready in about 650 ms (budget 3 s) and a thirty-day skip draws in
  80–520 ms (median budget 600 ms). The network leg is not throttled in CI —
  the local server does not compress — so `pnpm size` and the Slow 3G figures
  stand for it. The graph's first paint is not yet measured.
- **Client-side crash capture**, opt-in, to a local log the player can export
  — the same channel as the Phase 0 session log. **Built:** refused saves,
  recoveries, screens that fail to draw and uncaught errors go to one local
  channel, which the playtest log records. A screen that throws no longer
  blanks the page: it shows what happened and a way to another screen.
- **Optional cloud sync** (plan Phase 8) only if Phase 0 or Phase 6 shows
  players losing campaigns across devices. If built: a backend with row-level
  security, sync on checkpoints, local always authoritative, nothing required
  to play.

**Measures.** Offline-resume and update Playwright tests green on desktop,
Android and iOS profiles; save round-trip soak; the performance budget in CI.

**Gate to Phase 6.** Install → offline → resume → update works on iOS Safari
without a lost campaign.

**Original whole-phase estimate (not remaining effort).** Four to six weeks.

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
  whether Q3 is still quiet. **Not started:** it needs a collection endpoint
  the static game does not have, and consent copy. Until then `pnpm session`
  reads many playtest logs at once and prints the same measures across them.
- **A tuning cadence.** Monthly: read the dashboard, pick one finding,
  change it, measure with the harness that fits, record it in
  `docs/FINDINGS.md`. The same discipline the project has used from a desk,
  fed by people. **Written:** "Tuning from what players do" in
  `docs/PLAYTEST.md`, on the session logs.
- **A shareable year.** The annual review as a card the player can share — a
  headline, a band per dimension, the seed — without a score, because there
  is no score. A "play this seed" link so two people can compare years.
- **Educator mode.** The audience includes people teaching this: a
  facilitator's pack with a cohort of fixed seeds, a debrief question set per
  quarter, and a classroom start page. The `/guide` plugin is the publishing
  path. Measured by one course running it. **Written:**
  `docs/educator/FACILITATOR.md` — a ninety-minute session, questions for
  each quarter and after the review, and a cohort of seeds characterised by
  `pnpm cohort` under an engaged and an idle policy, the idle facts pinned by
  `tests/engine/cohort.test.ts`. The course is not run.
- **Content packs as a format.** The second organisation proved the pipeline;
  publish the pack schema and the linter so others can author one. Packs load
  from a URL or a file; the game stays static. **Not started:** the schema
  and the linter are published (Phase 2), but there is no second pack to
  load; loading one in the game waits until there is.

**Measures.** Telemetry consent rate; Year Two start rate; seed-link usage;
one educator cohort's completion rate.

**Gate to Phase 7.** Three months of dashboard data; one educator cohort.

**Original whole-phase estimate (not remaining effort).** Four to six weeks of engineering, then ongoing.

---

## Phase 7 — Release

**Goal.** A launch that matches the product: a landing page, a trailer, a
press kit, a support path, and the definition of done below met.

**Deliverables.** A landing page at the root that is not the start screen
(the start screen stays one click away) — **changed:** the root stays the
start screen, because the plan puts a player in the game within sixty
seconds (§6); `/about` is the page to send people to, built from
`docs/release/ABOUT.md` with a fact sheet, screenshots and known
limitations, and linked from the start screen's foot; a 90-second trailer cut from the
photographed playthrough (**shot list written**, `docs/release/TRAILER.md`;
not cut); a press kit with the identity assets (**the About page and
`docs/release/STORE.md` serve for now**; the in-game identity exists but a
separate press kit has not been assembled); an
accessibility statement (**published at `/accessibility`**, saying what is
checked and what is not); a support address and a known-issues page generated
from `docs/FINDINGS.md`'s open section (**the repository's issue tracker,
which is public, and Known limitations on `/about`**, written by hand); a release cadence (monthly, with
notes — **`CHANGELOG.md` and `docs/release/RELEASING.md`**; no version
tagged); listing on a games storefront that accepts browser titles (**copy
written**; publishing it is the owner's call).

**Definition of AAA-done.** Every row of the table at the top at A or A−,
with the evidence row's grade earned by at least thirty recorded human
sessions across two organisations and two languages.

**Original whole-phase estimate (not remaining effort).** Three to four weeks.

---

## Sequencing and effort

This is the original whole-phase sequence and sizing, retained for context.
It includes work now implemented and must not be read as today's remaining
schedule. Use the dated remaining-work table above; the phase gates are unchanged.

| Phase | Original weeks | Needs people | Starts when |
|---|---|---|---|
| 0 Evidence | 2–4 | 8–12 playtesters | Now |
| 1 Teaches itself | 4–6 | a writer, 4 playtesters | Phase 0 synthesis |
| 2 Depth and replay | 10–14 | a content author | Phase 1 gate |
| 3 Presentation | 6–10 | illustrator, sound designer | Phase 2 gate (identity work can start during Phase 2) |
| 4 Accessibility and localisation | 6–8 | AT testers, a translator | Phase 3 gate (string extraction can start during Phase 3) |
| 5 Robustness and platform | 4–6 | — | Phase 4 gate (can run alongside Phase 4) |
| 6 Live | 4–6, then ongoing | an educator | Phase 5 gate |
| 7 Release | 3–4 | — | Phase 6 gate |

The original serial estimate was nine to twelve months for one engineer and
one author with specialists brought in for their weeks. It is not a new estimate
from 29 October; completed engineering must not be counted again. Phases 3–5 overlap well; Phases
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
