# CISO: First Year, AI-driven phone playtest (novice persona)

**This is an AI-driven session, not a human playtest.** An AI agent played the
game through a browser driver while role-playing a persona. It does not count
toward the human playtest gate in `docs/PLAYTEST.md`, and nothing in it
establishes what a real person would feel, notice or learn. Treat every finding
as a hypothesis to check with people.

## Session and evidence boundary

> **Editor's note (build):** the driver served a copy of the build made from `dfa8554` before any of the day's changes, in a directory of its own, so the uncommitted work in the checkout was not in the game this session played. See `2026-10-09-ai-panel-synthesis.md`.

- Build: commit `dfa8554`, served locally through the panel browser driver. The
  working tree also held uncommitted changes when the session ran (content,
  app shell and scripts). The served build may include them.
- Persona: a primary-school teacher with no security or IT knowledge, sent the
  link by a friend. Plays on a phone in short bursts, skims long text, taps
  the most prominent button when unsure, and uses the glossary when a word
  stops them.
- Viewport: 393 x 852 (phone). About 97 screenshots, taken at least once on
  every new screen.
- Start URL: `/?playtest&seed=panel-phone`. Difficulty **Guided**, situation
  **The inherited mess**. The recording control stayed on for the whole year.
- Clock: title screen 15:24:45 UTC, "Begin your first day" 15:25:10, annual
  review reached 15:46:49, log exported 15:47:35. The session tool reports
  22.6 minutes of play. The early note timestamps for the first four minutes
  were estimated wrongly during play. The log below uses elapsed times
  calculated from measured `date` checkpoints and from the session log.
- Method: only the interface was used, as an accessibility tree and as
  screenshots. No source, content files, docs (apart from the format example)
  or saves were read. No reloads and no replays.
- How the persona played: mostly "Skip ahead" and "Decide", as the persona
  would. Hypothesis offers on the briefing were accepted with the prominent
  "Form the hypothesis" button. The Inbox was opened when the briefing showed
  something to read. Organisation, Risk, Programmes and Board were opened
  when something pointed there.
- AI limits: an AI reads every word of a 30-item list in a second and feels
  neither boredom nor fatigue. "Felt" statements below are the persona's
  plausible reactions, not measurements. Timing is not human reading time.
- Screenshots are in the session scratchpad,
  `/tmp/claude-0/-home-user-CISO-Risk-Game/bae69969-0045-50a0-80ec-1e83a012c8e2/scratchpad/panel/phone/shot-NNN.png`.
  They are written below as `shot-NNN`. That directory is temporary, so copy
  any you want to keep.

## Outcome

The annual review called the year **Credible first year** and led with
**"You built the capability, and the business paid for it in delivery."**

| Measure | Observed result |
| --- | --- |
| Decisions | 27, all answered by the player |
| Programmes | 3 started, 3 finished (identity, recovery, detection) |
| Enquiries | 3 commissioned, all on day 1, all came back thin |
| Board papers | 3 of 3 prepared |
| Hypotheses | 8 formed, all 8 still in Draft at year end |
| Business objectives | 2 achieved, 3 missed (platform launch 10d late, cloud migration 30d, Kestrel 55d) |
| Material incidents | 1: Customer data exposure, 14 to 30 May, elevated consequence |
| Risk understanding | developing |
| Prioritisation | strong |
| Resilience | strong |
| Cyber programme execution | strong |
| Business enablement | developing |
| Communication and escalation | strong |
| Team sustainability | weak ("SOC: burning out", "Engineering: burning out") |
| Material blind spots | weak (8 never discovered, 19 taken on trust) |
| Budget at year end | £170k left of £3m |

The persona would come away pleased with this. The reasoning rewards honesty,
and the follow-up messages repeatedly said their choices had worked. The two
weak rows (team sustainability and blind spots) both describe things the
briefing told this player were fine, or never asked them to look at.

## `pnpm session` summary

```
Campaign: seed panel-phone, guided, sit-inherited-mess
Played 22.6 min, reached day 364, finished the year

First decision:     day 1, 1.4 min in
First enquiry:      day 1, 3.1 min in
First programme:    day 19, 6 min in
First board paper:  day 91, 11.3 min in

Screens (minutes, visits):
  home            12.5  27
  inbox            3.7  20
  risk             2.3  4
  programmes       1.9  5
  board              1  3
  debrief          0.6  1
  organisation     0.5  1

Glossary opened: gls-residual, gls-assurance, (index)
Lessons dismissed: lesson-first-quarter, lesson-evidence
Clock stopped for: decision-deadline ×22, quarter-end ×3, incident ×2, year-end ×1
Skipped ahead: day 2, day 19, day 22, day 40, day 45, day 60, day 61, day 75, day 88, day 90, day 91, day 92, day 101, day 108, day 120, day 133, day 134, day 135, day 148, day 149, day 150, day 180, day 182, day 200, day 230, day 240, day 270, day 273, day 275, day 277, day 280, day 295, day 318, day 348, day 364

Actions taken:
  markRead                 50
  advance                  35
  resolveDecision          27
  createHypothesis         8
  startInvestigation       3
  startProgramme           3
  completeQuarterReview    3
  dismissTutorial          2
  openRisk                 2
  acceptRisk               1
  resolveProgrammeBlocker  1
  treatRisk                1
```

The log only counts glossary opens from the "?" and "Words:" buttons. The
glossary index opened from More counts once, as "(index)". The `risk` screen
got 4 visits in a year. `createHypothesis 8` against no promotions to a risk
scenario is the clearest trace of finding 1.

## Timestamped observation log

Elapsed time runs from "Begin your first day" at 15:25:10. Ranges are bounded
by measured checkpoints.

| Elapsed | Game point | Observation and immediate interpretation |
| --- | --- | --- |
| −00:25 | Start screen | First screen is title, intro and the three pillars (shot-001). The difficulty choice, situation and "Begin your first day" sit about two and a half screens down (shot-004). "Guided … plainer explanations of the mechanics" was the reason to pick it. "The inherited mess" was already selected. |
| 00:00 | Day 1, 2 Jan | The briefing opened **scrolled to the bottom**, keeping the start screen's scroll position (shot-005). The first thing seen was "No programme has started", not "1 thing needs your attention." |
| 00:00–04:00 | Day 1 | Tapped "?" on Residual exposure (shot-007). The definition uses "controls", which the glossary never defines. Opened "Where do you start?" (shot-008). The "Words: Assurance" link opened the glossary over the decision and Escape returned to it cleanly (shot-009, shot-011). Chose "Start with your own leadership team", because a teacher starts with colleagues. |
| 00:00–04:00 | Day 1 | The tip said to check three things using "the enquiries", but nothing on the briefing links to them. Looked in Inbox (opened mid-scroll, shot-014), More (shot-015) and Organisation (shot-016). Tapping Nexora Pay on Organisation appeared to do nothing, because the detail rendered below all 32 cards (shot-017 compared with shot-018). Found enquiries under Risk > Investigate, a tab off the right edge of the tab row (shot-019, shot-020). |
| 00:00–04:00 | Day 1 | Commissioned three enquiries: a business service review, a threat hunt and a recovery test. Each dialog preselected Callum Reid with "Has room for this." (shot-021). The progress card read "Your architecture lead is working through the service owners one by one. Led by Callum Reid." (shot-022), but Callum is Head of Security Engineering. The threat hunt still had a Commission button after it was commissioned. |
| 00:00–04:00 | Day 1 | Programmes showed "Out of attention this week" on all six (shot-024). Nothing had said that starting a programme costs attention, or that three enquiries would use up the week. |
| 04:00 | Day 2 | CEO's three risks: gave them with confidence levels. Skip ahead then went **3 Jan → 20 Jan**, so the whole of week 2's attention was never offered. |
| 04:46 | Day 19 | All three enquiries came back thin: "Targeted threat hunt came back thin — Callum Reid had too much else on, and the picture is incomplete." Fenella's warning "Everyone here is already committed…" is dated 3 Jan, the day *after* the commissions. Felt cheated by the "Has room for this." label. |
| 05:06–05:47 | Day 19 | Recruited properly. Tapped "Form the hypothesis" twice (toast: "Hypothesis recorded.", shot-032). Nothing said what happens next. Started Ransomware resilience and Identity uplift. Only the start dialog says "two units of your attention" (shot-034). |
| 06:17–06:36 | Day 22 | Platform launch: the commit button read **"Record why first"** and was disabled, though the earlier "Why?" had been marked "(optional)" (shot-037). The note under the options gives the answer away: "Supporting with conditions is usually more effective than opposing outright." |
| 06:51–07:22 | Day 40 | Headline "7 things need your attention." showed one decision and one pattern (shot-039). Forced an emergency patch, because the glossary entry for "Patch, exploit" made this obvious. Inbox > Unread showed "Nothing here" straight after opening the Inbox, which had a new-message dot (shot-041). |
| 07:53–08:49 | Day 45 | Tapped a "Due for reassessment" risk. The text says "accept it for a stated period, or link it to the programme", but the buttons are "Open formally" and "Accept for now". "Open formally" toasted "Risk scenario opened." while "Next review: Due now" stayed (shot-045). "Accept for now" opened 12 reasons and 10 assumption checkboxes (shot-046), which overwhelmed the persona. |
| 09:01–09:49 | Days 60–75 | Funded a manual fallback for the warehouse, "like a paper register when the computers are down". Supplier access went to a break-glass path ("break-glass" has no Words link there). Pen test included the legacy estate ("penetration test" and "assumed-breach" are not in the glossary). |
| 10:30–11:06 | Days 90–91 | Refused executive exceptions. Board screen "They remember" lists were a delight: "You told her what you did not yet know." (shot-056). Q1 board paper: **one** risk eligible, the one "opened formally" by chance. "4 risks are emerging and not on the agenda: the board hears about risks you have raised, and an emerging one is raised from the Risk screen." (shot-055). |
| 11:23–13:24 | Days 92–120 | Good follow-ups: "Where you started", and the CEO's "She remembered what you said you did not know". Weak ones: "The HR provider has confirmed the scope of its incident." and "The legacy estate was in scope, and it shows." Started Detection. Renewed the SOC with a rewritten scope. |
| 13:36–15:35 | Days 133–149 | **Incident.** A red banner, "Customer data exposure · Escalating", next to "No decision is open" (shot-062). "Open the response log" led to an inbox line, "Customer data exposure escalated to the CISO." The persona felt helpless and asked whether they should press something. The decisions arrived the next day (shot-064). Closure said "How the actor got in is for the year-end reconstruction." |
| 15:58 | Day 150 | Finance cut: the amounts now reconcile, with an explicit line: "Only £130k is left uncommitted, so that is all this gives". Gave £110k. Chose "Present what happened honestly", without knowing what had happened. |
| 16:14 | Day 180 | Skip ahead went **31 May → 30 Jun**: nothing in June. "The fallback you paid for … I thought you should know that the money did something." The persona felt clever. |
| 16:33–16:57 | Day 182 | The Q2 board paper offered "Ransomware resilience and recovery is off track", the first the player had heard of it. Programmes showed "Blocked: No maintenance window for restore testing". "Negotiate a window with the COO" cleared it. |
| 17:13–18:12 | Days 200–230 | Refused the Kestrel join (quarantine disabled, "Not enough budget remains this year"). The Inbox showed the identity programme had been blocked since 30 Jul ("Legacy applications cannot federate"). The fix, "Fund a compatibility shim (£120k)", looked tappable at £20k and replied "There is not enough budget to clear that blocker." (shot-075). |
| 18:27–18:40 | Days 240–270 | Enforced identity controls: "it was the right call and I would not have made it without you." Budget went from £20k to £80k with no explanation the persona saw. "Came back to you" had shown the same May and June items since June. |
| 19:17–20:16 | Days 273–277 | On the third board paper reading "raised from the Risk screen", finally tried it. Selecting a risk card again put its detail off-screen (shot-081). "Link to Detection…" then produced "A material risk the board has not heard about" two days later. Good cause and effect, found very late. |
| 20:01–21:22 | Days 275–348 | Q4 follow-ups paid off: "The restore came back in three and a half, the runbook held", "management's account matched what they found", Corvus signed with the terms in, and "Three questions, not three answers". Budget rose again to £170k, unexplained. |
| 21:39 | Day 364 | Annual review (shot-087 to shot-095). After it, the Hypotheses tab showed all 8 formed hypotheses as "Draft" with "Raise as a risk scenario" buttons (shot-096). One was "Partner identities start inside the staff boundary", formed 14 May, the same path the incident reconstruction describes. |

## Findings, ranked by severity

### 1. High. "Form the hypothesis" looks like the end of the job, but the hypothesis is left as a draft

- Screens: Briefing pattern card, Risk > Hypotheses, Board paper.
- Quotes: the briefing button **"Form the hypothesis"** produces the toast
  **"Hypothesis recorded."** and nothing more (shot-032). Each board paper
  then said **"4 risks are emerging and not on the agenda: the board hears
  about risks you have raised, and an emerging one is raised from the Risk
  screen."** (shot-055). At year end the Hypotheses tab showed 8 cards marked
  **"Draft"**, each with a **"Raise as a risk scenario"** button (shot-096).
- Effect: the persona formed 8 hypotheses and promoted none. The board saw
  one or two items all year. One draft, "Partner identities start inside the
  staff boundary", matched the incident path step for step: "Reused partner
  credentials succeed against the extranet … The partner identity turns out
  to sit in the same directory as staff". The game's central lesson ran
  through this player's hands without them noticing.
- Wording adds to it: the board paper says "raised", the risk detail button
  says "Open formally", the hypothesis button says "Raise as a risk
  scenario", and the review text says "accept it … or link it". This player
  could not tell these were related.
- Suggest testing: after "Form the hypothesis", say plainly that it is a
  draft and where it is promoted, or offer the promotion in the same place.
  Use one verb.

### 2. High. The delegation dialog said a lead "Has room for this." three times, and all three jobs came back thin because he had too much on

- Screen: the Commission dialog on Risk > Investigate (shot-021), then the
  Inbox.
- Quotes: Callum Reid was **preselected** with **"Has room for this."** on
  each of three commissions. All three returned, e.g. **"Targeted threat hunt
  came back thin — Callum Reid had too much else on, and the picture is
  incomplete."** Fenella's warning, **"Everyone here is already committed. If
  you give us more, something else stops, or it comes back thinner than you
  wanted."**, is dated 3 January, the day after.
- The same contradiction ran through the year. The Team capacity chip said
  "committed" while the card underneath said **"Your functions have room to
  take on work."** (shot-043). The review then rated **Team sustainability:
  weak — "SOC: burning out", "Engineering: burning out"**.
- Suggest testing: update the delegate's availability line as work is
  assigned in the same week. Do not preselect someone the next assignment
  would overload. Show the warning before the first commission.

### 3. High (phone layout). Tapping a card on Organisation or Risk shows the detail below the whole list, so nothing visible happens

- Screens: Organisation (shot-017 compared with shot-018) and Risk scenarios
  (shot-081).
- Observation: tapping "Nexora Pay" only added a blue border. The detail
  ("This is what you were handed, not what you have checked…") rendered after
  all 32 system cards. On Risk, tapping "Material intrusion goes unnoticed"
  did the same. Coming in from a briefing link once scrolled to the detail
  correctly (shot-044), so the behaviour is inconsistent.
- The persona would conclude that the cards are not tappable. That cuts off
  the Organisation map and risk review, which are the screens the review
  later grades ("Material blind spots: weak").
- Smaller, on the same screen: the Organisation toggle shows **"Graph"**
  pressed while a card list is displayed. The detail chip reads **"critical
  criticality"** (shot-018). "Taken on trust" is in each card's accessible
  name but not visible as text.

### 4. Medium. The first quarter's instruction points at enquiries that are hard to reach on a phone

- Screens: Briefing tip, Risk tab row.
- Quote: **"The enquiries are grouped by those questions, and each says which
  of your risks it speaks to."** Nothing on the briefing links there. The
  enquiries live under Risk > **Investigate**, and that tab, with
  **Assumptions**, sits off the right edge of a horizontally scrolling tab
  row with no scroll cue (shot-019). The persona found it by elimination
  after trying Inbox, More and Organisation. The log puts the first enquiry
  at 3.1 minutes, a long time to an AI and probably longer to a person.
- The same "How this works" tip ("Evidence is not risk. What you have just
  received is an observation.") appeared on Inbox, Organisation and Risk
  before anything had been received.

### 5. Medium. Programme blockers never reached "Waiting on you"

- Screens: Briefing, Programmes, Inbox.
- The recovery programme's blocker, **"No maintenance window for restore
  testing"**, first came to light as a board paper agenda line,
  **"Ransomware resilience and recovery is off track"**. The identity blocker
  was in the Inbox: **"Blocker: Legacy applications cannot federate"**
  (30 Jul), then **"A programme has stalled … The Programmes screen says what
  that takes."** (8 Aug). Neither appeared in "Waiting on you", the only
  place this player looked.
- **"Fund a compatibility shim (£120k)"** looked enabled with £20k left and
  answered **"There is not enough budget to clear that blocker."**
  (shot-075). Decision options that cannot be afforded are disabled, with the
  reason shown ("Not enough budget remains this year (£120k)"), so these
  behave differently.

### 6. Medium. During and after the incident, the player is not told what happened

- Screens: Briefing incident card, Inbox (shot-062, shot-064).
- On the first day, **"Open the response log"** led to an inbox item reading
  only **"Customer data exposure escalated to the CISO."** Meanwhile "Waiting
  on you" said **"No decision is open"**. The decisions came the next day.
- The updates were one line each: **"The actor has been pushed out. The
  damage is now being counted."** and **"Services are restored. Time to
  reconstruct what happened."** The closure said **"How the actor got in is
  for the year-end reconstruction."** The persona chose "Present what
  happened honestly" with no idea what had happened.
- The year-end reconstruction is clear and good (shot-092). For a learner,
  though, the cause comes seven months after the event, and by then the
  link to the draft hypothesis from finding 1 has gone cold.

### 7. Medium. Attention rules show up only when a button is greyed out, and Skip ahead can consume a whole week

- Screens: Programmes (shot-024), the start dialog (shot-034) and Skip ahead.
- The start screen says **"Five actions a week"**. Guided showed "6/6
  attention", and the costs are scattered. Programmes cost "two units of your
  attention", stated only inside the start dialog. Board papers cost 2 with
  no notice. Enquiries show "Your attention 1/2". After three enquiries on
  day 1, every programme read **"Out of attention this week"**. Skip ahead
  then went 3 Jan → 20 Jan, so week 2 was never playable. Programmes started
  on day 19.

### 8. Low. The headline count and "Waiting on you" disagree

- Screen: Briefing.
- Quotes: **"7 things need your attention."** with one decision visible
  (shot-039). **"5 things need your attention."** above **"Nothing needs an
  answer from you right now."** (shot-049). The count seems to include the
  "Due for reassessment" links further down, which are never explained.

### 9. Low. Copy and state slips

- "Your architecture lead is working through the service owners one by one.
  Led by Callum Reid." Callum leads Engineering (shot-022).
- A commissioned enquiry stays in the list with an active "Commission"
  button.
- "There is no mechanically superior answer here." is designer language
  (shot-008).
- The "Recently" list reads "d19 Started Identity and privileged access
  uplift with 850k.", with no £ and a "d19" day code (shot-043).
- Reasons are "Why? (optional)" on some decisions and required on others
  ("Record why first", shot-037), with no sign of which until the button
  greys out. The reasons sit below the fold.
- The Inbox's Unread filter showed "Nothing here" immediately after opening
  an Inbox that had a new-message dot (shot-041). The log shows 50 markRead
  actions. Seen once. It may be that opening the Inbox marks items read.
- After Begin the briefing opened at the bottom (shot-005). Tab switches keep
  the previous screen's scroll offset (shot-014).
- The budget rose £20k → £80k (Q3) → £170k (December) with no explanation
  the persona saw. They wondered whether to spend it.
- "Came back to you" showed the same four May and June items from June to
  October.
- The review says **"Non-production environment as a route into production
  was among the largest risks you inherited, and nothing you did went near
  it"**. That scenario never appeared in this player's Risk list of five. It
  may be hidden by design, but to a novice it reads as blame for something
  they were never shown.

### 10. What worked (keep)

- Follow-ups that answer a choice by name landed every time: "She remembered
  what you said you did not know", "The fallback you paid for … the money did
  something", "Enforcement, three weeks on … I would not have made it without
  you", and "The restore came back in three and a half". These were the
  persona's best moments.
- The Board screen's "They remember" lines made the executives feel like
  people.
- Decision dialogs work on a phone. The sheet is readable, "Not yet" and
  "Commit to this" are pinned at the bottom, and "Words:" links open the
  glossary over the decision and return to it.
- The glossary's subject entries are well judged for a lay reader (see
  below).
- The finance cut now reconciles on screen ("Only £130k is left uncommitted,
  so that is all this gives").

## Words that stopped me

"Explained" means a glossary entry or inline explanation the persona could
reach from where the word appeared.

| Word or phrase | Where it stopped me | Explained? | Was it enough? |
| --- | --- | --- | --- |
| CISO | Start screen | Spelled out in the intro | Yes |
| Critical vulnerabilities | Start screen, first message | No | No. The first number in the game (6,283) is a word I can't look up |
| Risk register | Start screen, day 1 | No glossary entry. Fenella's message later explains it in passing | Partly, by day 5 |
| Backlog | Situation card, day 1 | No | Guessed from teaching ("marking backlog") |
| Residual exposure | Briefing, from "?" | Yes | No. "after the controls that actually operate" needs "control", which has no entry. "Bands, not numbers. The precision would be false." is for designers |
| Control | Everywhere | No entry (only "Control effectiveness") | No. The most used word in the game |
| Assurance | Day 1 decision | Yes | Yes: "A supplier questionnaire returned clean is a statement; a test is assurance." |
| Actor | Risk descriptions | No | Guessed "attacker", and was uneasy about it |
| Estate | Everywhere ("legacy estate", "the estate that matters most") | No | No. I thought of a housing estate |
| Credential | Top concerns | Yes | Yes |
| Workload identity | Top concerns | Yes ("Words:" link) | Did not open it. Skimmed |
| SOC, telemetry | Enquiry cards, programmes | Yes, both | Yes, once found. Not linked on the enquiry card where I met them |
| MFA, PAM, EDR | "Improves:" line on programmes | Yes, in the glossary | MFA yes ("a code on a phone"). The acronyms alone on the card meant nothing |
| Immutable backup | Ransomware programme | Yes | Yes |
| Threat hunt | Enquiry | Yes | Yes. "A clean hunt says the places you looked were clean" was a real lesson |
| Hypothesis | Briefing pattern card | Yes | The definition was fine. What to *do* with one was never explained (finding 1) |
| Break-glass | Supplier access decision | Yes, but no "Words:" link on that decision | Only because I'd scrolled past it earlier |
| Penetration test, assumed-breach | Pen test decision | No. The enquiry card says "Pay someone to walk the paths you suspect exist" | Partly |
| Tenancy, test tenancy | Organisation, restore decision | "Cloud tenancy" exists | Did not find it from the decision |
| Runbook | Restore decision | No | No |
| Federate, compatibility shim | Identity blocker | No | No. I could not tell what was blocked or why £120k would fix it |
| Due diligence | Kestrel decision | No | Guessed from everyday English |
| Exploit, patch | Day 40 decision | Yes | Yes, and it made the decision easy: "Once an exploit is published, the time to patch is measured in days." |
| Egress monitoring | Hypothesis card | Yes | Yes |
| Acquirer, card-acquiring bank | Card data decision | Yes ("Cardholder data, PCI DSS, acquirer") | Yes |

The glossary has about 50 entries in two sections, with no search and no A–Z
jump. On a phone the persona scrolled past it rather than through it.

## What it taught

In the persona's words, after one year:

- "You can't fix everything, so the job is choosing. There's never enough
  money or time, and if you spend your week on one thing you can't do
  another."
- "Be honest about what you don't know. The CEO and the board liked it when I
  said I wasn't sure, and they remembered it months later."
- "If you ask a busy person to do something, you get a rushed answer. A
  rushed check that finds nothing doesn't mean everything is fine." (Learned
  the hard way on day 19.)
- "Most break-ins come in through someone's password, often a supplier's,
  and a code on your phone (MFA) is the thing that stops a stolen password
  working on its own."
- "Backups are only worth anything if you've actually tried putting them
  back. You have to do the real fire drill, not a pretend one."
- "If a computer can't be fixed, plan how you'd manage without it, like a
  paper register when the system's down."
- "Rules have to apply to everyone. Exceptions for the bosses are how the
  rules stop meaning anything."
- "Security costs the business something. My year made three projects late."

What it did **not** teach this persona:

- How noticing a pattern becomes a risk the board hears about. The Draft
  step was invisible.
- That their team was burning out. The briefing said they had room.
- How the attacker got in, until the final screen.
- What "control", "estate" and "residual" mean. All three were used
  constantly and only guessed at.

## What this session does not settle

- Whether a human novice would find the Investigate tab, or tap a card and
  scroll. Two of the three High findings are about attention and discovery,
  which an AI simulates badly.
- Human timing. 22.6 minutes is an AI pace. A teacher in short bursts would
  take several sessions, and the save and resume path was not tested.
- Other seeds, situations, difficulties, assistive technology and landscape
  orientation.
- Balance. No change to tuning is suggested from one AI run.
