# CISO: First Year — working notes

A single-player cyber risk strategy game. The player inherits Nexora Group as
its new CISO and plays one simulated year. Static client application: the whole
simulation runs in the browser and there is no server component.

## Working agreements

- **Push straight to `main`.** Commit and push without asking. Keep the feature
  branch in sync when one is in play.
- Run `pnpm check` (typecheck, lint, content validation, unit tests) before
  pushing. `pnpm test:e2e:local` for anything touching the UI.
- Report what was actually measured. The harnesses below exist so claims about
  the game's behaviour can be checked rather than asserted.

## Rules the code holds to

These are enforced by lint or by tests, so breaking one fails the build.

- **Difficulty lives in one place.** `DIFFICULTY_PROFILES` in
  `src/game/engine/setup.ts` is the whole description of a mode. Nothing else
  may compare `state.difficulty` to a mode name; read the profile instead. A
  test scans every engine file.

- **The engine is pure.** Nothing under `src/game/` may import React, the DOM,
  storage or any SDK.
- **No `Math.random()` in simulation.** Every draw comes from the seeded RNG in
  `src/game/engine/rng.ts`, with the cursor in game state so a save reproduces
  its own future. A test scans every engine file.
- **One effect reducer.** Content and player actions describe change as data
  (`GameEffect`); `src/game/engine/effects.ts` is the only thing that applies
  it. Nothing else mutates canonical state.
- **Hidden truth stays hidden.** The graph the simulation reasons about is not
  the graph the player sees. Selectors expose discovered state only; an
  invariant fails if an undiscovered node reaches the UI.
- **Bands, not numbers.** Internal values are 0..1 and become words at the
  presentation boundary. No internal number is ever rendered as a score.
- **The tick order is a contract.** `src/game/engine/tick.ts` runs a fixed
  seventeen-step day, pinned by a test.
- **`vercel.json` rejects any property Vercel does not recognise**, including
  comment keys — adding one fails the deployment. Constraints belong in
  `tests/content/deployment.test.ts`, explanations in `docs/HOSTING.md`.

## Harnesses

| Command | Answers |
|---|---|
| `pnpm soak 1000` | Does it crash or break an invariant over many campaigns? |
| `pnpm coverage 60` | Which authored content does a player actually reach? |
| `pnpm tsx scripts/tune.ts 25` | Do different play styles produce different outcomes? |
| `pnpm screenshots` | What do the screens currently look like? |
| `pnpm playthrough` | One campaign played end to end, photographed as it goes |
| `pnpm play` | A year played by hand, a decision at a time — what does it *say*? |
| `pnpm build && pnpm size` | What does a first-time player download? |

None of them answer whether the game lands: that needs people, and
`docs/PLAYTEST.md` is how to ask them.

The end-to-end suite starts its own server from a fresh build every run and
refuses to reuse one already on the port. If it stops with "4173 is already
used", a previous run left a server behind: kill it rather than setting
`reuseExistingServer`, because a stale server can hide a real break as easily as
it can invent one.

## Where the project is

**The feature set is complete and the major systems are frozen.** The remaining
work is playtesting, tightening and rewriting unclear text — not new mechanics.
Further simulation is now more likely to make the game worse than better unless
a human playtest asks for it. `docs/PLAYTEST.md` covers what a session is for and
what not to change on one player's word.

## Known weaknesses

Measured, not yet fixed. Ranked.

- **The year fades instead of building.** Measured over 12 campaigns of engaged
  play: decisions arrive 11.7, 4.7, 2.5 and 1.3 times per quarter, so Q4 carries
  roughly an eighth of Q1. The longest stretch with nothing to decide averages
  128 days and reaches 164 — nearly half the year. The inbox thins the same way:
  104 messages from 88 distinct subjects in the first half against 42 from 24 in
  the second, so H2 both says less and repeats itself twice as often. Played by
  hand, the back half of a campaign is a loop of four recycled threat-intel
  subjects. Confirmed not to be the harness: a player who varies their choices
  gets the same shape (11.7 / 4.7 / 2.5 / 1.3) as one who always takes the first
  option.

  Not fixed, deliberately. Every route to it is a system this project has
  frozen — authoring more late-year content, or reweighting the event draw —
  and the file's own rule is that further simulation now makes the game worse
  unless a playtest asks for it. A player who reports the second half dragging
  is the signal to act on; `docs/PLAYTEST.md` should ask about it.

Add measured findings here rather than suspicions —
each entry below was found with one of the harnesses above and closed the same
way. Note how often the finding turned out to be in the harness: check what the
simulated player actually did before concluding the game is at fault.

### Fixed

- **Four things found by playing a third year permissively, on high pressure,
  and then looking at the gallery.** Two earlier passes both played carefully;
  this one waved things through, accepted risks formally and recorded
  assumptions against them, which reached parts of the game the careful route
  never touches.

  **"Supplier assurance questionnaire returned clean" was cited as grounds for
  alarm again.** The same sentence this file already records as fixed. The
  earlier fix was real but closed one instance: it relied on each template
  naming the contradicting tag in its own `contradictingTags`, and only 2 of
  14 templates name any, so the clean questionnaire still supported
  `hyp-logistics` and the claim that legacy is isolated still supported
  `hyp-detection-gap` — 817 offer-days across **20 of 20 campaigns**. The rule
  is structural now: a `contradicts-x` tag argues against `x` for every
  template that rests on `x`, whatever that template lists. One piece was also
  under-tagged and gained `contradicts-legacy`. Down to zero, with no offers
  lost. Mutation-checked.

  **The closing screen printed raw enum ids.** "Your architecture and grc
  functions are spent", "soc: burning out" — internal names in the last
  paragraph a player reads. `src/lib/formatting` holds two maps of these words
  and the engine cannot reach either, so `functionName` now lives beside
  `moraleLabel` in `src/game/team/capacity.ts`. A test walks three whole
  campaigns and fails if any line of the annual review contains `grc`, `soc`,
  `iam` or `incident-response`.

  **Hovering the rail made an item look like the page you were on.** Selected
  and hover were 3.5% of lightness and one font weight apart, with identical
  text colour — convincingly enough that the gallery's Board screenshot read as
  a navigation bug, and the bug was chased through three probes before the rail
  turned out to be right. The selected item now carries an accent bar, which
  hover cannot produce. The gallery was at fault too: Playwright leaves the
  pointer where it last clicked, so `pnpm screenshots` was photographing a
  hover state. It parks the pointer before every shot now.

  **A toast swallowed clicks meant for the page.** Three stack above the fold,
  over the Decide button, for 5.2 seconds; the body was `pointer-events-auto`,
  so a click aimed at the page hit the toast and did nothing. Only the dismiss
  control needs the pointer. Mutation-checked in the end-to-end suite.

- **The accessibility audit was racing a 220ms animation.** Screens and dialogs
  fade in from opacity 0, and both `toBeVisible()` and a click resolve on the
  first frame, so axe measured contrast against a half-transparent panel. The
  same commit gave 75 green tests on one run and a `color-contrast` violation
  on the next, reporting `#71767d on #eff2f5` for text that settles at 7.8:1 on
  white. A test that fails at random gets dismissed as flake, and would hide a
  real violation just as easily. The audit waits for `document.getAnimations()`
  to finish now, and is green three runs in a row at two viewports. The
  violation was a phantom: the settled colours were checked directly.

- **Two things found by playing a second year, investigating this time.** The
  first pass answered decisions and never commissioned anything; this one
  commissioned work, formed patterns and raised risks, and the different route
  found different faults.

  A pattern was offered on the strength of a **misconfigured print server**.
  `ev-soc-noise-printers` is marked `noise: true` in the content and reads
  "Benign. Worth fixing, not worth a programme", and `patternSuggestions`
  counted it toward the two pieces an offer needs. Measured over 20 campaigns:
  308 offer-days cited a red herring, and in 160 of them — at least one in
  **every campaign** — the offer existed only because of it. Noise is now
  excluded from what supports a proposition, which is the same rule already
  applied to contradicting evidence. The template stays reachable: offers fell
  0.8% and offer-days 0.6%. Mutation-checked — putting the red herring back
  fails `tests/engine/presentation.test.ts` by name.

  **The board pack was empty for the player who had done the most.** A
  scenario counted as material only at residual >= 0.45, a number from the
  middle of the `elevated` band, so a player's own mitigation pushed the risks
  they had raised off their own agenda. Measured over 12 campaigns with 7 live
  scenarios each: **78% of board packs had nothing material and Q1 was empty in
  12 of 12** — worse than an idle player's 47%, and an empty pack scored full
  coverage and full board confidence. Plan §28.7 asks the player to "choose
  material topics", which needs something to choose between. Materiality is now
  read in bands: residual `elevated` or worse, **or** consequence `elevated` or
  worse (a severe-consequence risk you believe you control is exactly what a
  board needs to know you are relying on), **or** accepted (carried on the
  organisation's behalf). Empty packs went to 0% for both play styles, 2.0-2.5
  material items per pack for an engaged player against 1.3-2.3 for an idle
  one, and year-end board confidence was unmoved (0.55 idle, 0.64 to 0.65
  engaged).

  A third thing turned up while wiring the harness: `convertHypothesis` would
  **raise the same hypothesis twice**. The workspace hides the button once a
  hypothesis is raised, so the rule lived only in the component; called again it
  charged attention, wrote a duplicate note and a second history entry, and set
  `scenario.status = 'open'` over a risk the player had since **accepted**,
  discarding a recorded rationale in silence. The action refuses now, like every
  other branch of `applyAction`.

- **The annual review graded a player well and told them they had failed.**
  Found by playing a whole year one decision at a time and reading the closing
  screen: prioritisation read `STRONG — 3 decisions lapsed and the organisation
  chose for you`, and communication read `STRONG — the board listened, but never
  quite came to depend on you`. Each dimension's sentence was picked from its
  own thresholds, independently of the band printed beside it, so the verdict
  and the explanation could contradict each other — and the sentence is the part
  a player reads. Narratives are now led by the band, with the specifics as
  qualifiers after it. `tests/engine/presentation.test.ts` fails the build if a
  `strong` or `solid` dimension uses failure language.

  The playthrough itself is now a harness: `pnpm play` runs the campaign until
  something needs the player, prints the situation and stops, so a year can be
  played a decision at a time and the state survives between invocations. It is
  the only harness that reads what the game actually says.

- **Three things found by playing a year and looking at every screen.** None
  would have failed a test, and all three undercut the game's own argument.

  The Briefing told a brand-new player **"Organisation understood: 53%"** before
  they had checked anything — a rendered percentage on the main screen, claiming
  understanding nobody had earned, which is the exact mistake the verification
  model exists to teach. It now reads "Checked for yourself: none of it yet",
  in words, and rises as the player actually examines things.

  A pattern offer cited **"Supplier assurance questionnaire returned clean"**
  under *what suggests it*. That evidence is tagged both `supplier` and
  `contradicts-supplier` — it is about suppliers and argues the other way — and
  matching on the supporting tag alone made the game cite reassurance as
  grounds for alarm. Contradicting evidence is now excluded from the list.

  The annual review named **Engineering Workstations twice**, once as "never
  brought into view" and once as "taken on trust and never examined", which
  cannot both be true of the same system. "Taken on trust" now applies only to
  things the player knew were there, and the list caps at twelve rather than
  running to thirty lines nobody reads.

- **A collision said "talk to the business".** The date belongs to a person, and
  that is who has to be talked to, so the button names them: "Talk to Priya".

- **Three defects that only a screenshot could find.** `pnpm screenshots` had
  never been run against the new work, and it turned up things no test was
  looking at.

  The header showed **30 February**. Months were a uniform 30.33 days, so every
  date after January was wrong and some did not exist. It is a real calendar
  now, pinned by a test that walks all 365 days.

  The annual review called a team **strong** and "able to do this again next
  year" with its architecture function at zero morale, because the dimension
  averaged morale across functions — the same flat-average mistake that once
  hid team strain. It now leans on the worst function and caps the band when
  any function is spent: a team is as sustainable as the part of it closest to
  walking out. Measured over 24 campaigns, a burnt-out function read `solid` or
  `strong` in 11 of them and now reads so in none. Morale in the evidence lines
  is words rather than percentages, which the bands-not-numbers rule asked for
  all along.

  The incident command view was **quieter than the teaching note under it** and
  scrolled away with the page. It is sticky while an incident runs and carries
  a solid `INCIDENT ACTIVE` bar. Two Tailwind classes were silently doing
  nothing on the way there: the severe "soft" token is near-white in light
  mode, and `bg-[--token]` is Tailwind 3 syntax that v4 ignores.

  The gallery itself only ever photographed the calm state. It now captures the
  pattern offer, a collision and a live incident — the screens most likely to
  look wrong — and its default seed was one of the roughly quarter of campaigns
  that never has an incident at all.

- **Forming a hypothesis was filing, not discovery.** The mechanic was right and
  the interaction was not: the player opened a dialog, read a list of templates
  and matched them against evidence from memory, which turns the most
  interesting moment in the game — when something clicks — into paperwork. The
  game now says what it noticed. `patternSuggestions` offers a proposition the
  evidence in hand would support, names the evidence behind it, and stops there:
  forming it still costs attention and "Not this" is a real answer that sticks.

  The first version offered every supported template every day — fourteen on
  screen at once, on 95% of days. That is a backlog wearing an insight's
  clothes. A pattern is now offered only while the evidence that revealed it is
  recent, which halves the days one is waiting and makes the offer a moment the
  player can miss rather than a queue they must clear.

- **A collision named a problem and left the player to find the screen.** The
  card now carries ways into the decision — open the programme that is running
  late, see the risk already raised against the same dependencies, take it to
  the business — which is navigation into existing mechanics rather than a new
  one. A test checks the ids it navigates by resolve to real content.

  The incident command view gained the same treatment: containment and recovery
  now show as words beside the affected services, so the player can see where
  the response has got to without opening anything. They are 0..1 internally
  and are never rendered as numbers.

### Checked and left alone

- **The reasoning review read as congratulation.** Two hand-played years closed
  with six rationale lines and all six saying "nothing this year contradicted
  it", which looked like a section that never reckons with anything. It was the
  play, not the game. Contradiction reaches a rationale two ways — a risk the
  player formally **accepted** whose attack path later carried an incident, and
  an assumption recorded beside a choice that stopped holding — and only 7 of
  80 decision options record an assumption, all of them the permissive one
  (wave the launch through, leave the supplier alone, note the anomaly and
  watch). Measured over 12 campaigns per style: a permissive player is
  contradicted in 11 of 12 campaigns and 18 of 47 lines, a player who formally
  accepts what they raise in 12 of 12 and 26 of 48, and a careful player in 0
  of 12 — correctly, because nothing they relied on failed. Both playthroughs
  were careful. Nothing changed.

- **Message pacing.** Worth recording because the worry was reasonable and the
  measurement did not support acting on it. Over 20 campaigns and 1,040
  player-weeks: 175 messages a year, a median of 3 a week, 6 at the 90th
  percentile and 10 at the worst. 18% of weeks carry nothing or one thing, and
  the average campaign has an eleven-day stretch with no message at all. The
  priority mix is shaped rather than flat — 25% routine, 52% notable, 18%
  urgent, 6% critical — so an urgent thing still reads as urgent. Quiet periods
  exist; nothing was changed.

  The first measurement said the opposite (82% urgent, one message repeated
  2,808 times) and was wrong: inbox messages are prepended, and the probe
  counted new arrivals by position, so it re-counted the oldest message every
  day. Check the harness before believing a finding.

- **The end-to-end suite could pass against a build nobody made.** Playwright
  reused whatever was listening on port 4173, so a preview server left over from
  an earlier run kept answering after its `dist` had been deleted: seventy-five
  tests failed against nothing, and the failure looked like a regression in the
  app. It reuses nothing now and builds its own server each run. A stale server
  can hide a real break as easily as invent one.

  Checked by mutation rather than by reading: leaking undiscovered systems into
  the Organisation view fails the suite, and shipping an empty annual review
  fails it. One mutation was *not* caught — making the Save campaign button
  write nothing left the test green, because the game autosaves constantly and
  the resume step took whatever save was newest. The test now resumes the manual
  save specifically, and fails when that button does nothing.

  The hidden-truth rule was guarded end-to-end by one assertion that one named
  system is absent from one screen, which a leak of any other node would pass.
  `tests/engine/hidden-truth.test.ts` now checks every node and dependency the
  selectors emit, across whole campaigns.

- **An incident looked like ordinary management.** The simulation ran incidents
  well and the interface showed one as a line on the Home screen, so the
  organisation could be in crisis while the game still looked like a quiet
  Tuesday. There is now a command view above every screen while an incident
  runs: what the player has been told, what they have already decided, and what
  is waiting on them. It is assembled from their own inbox and their own
  choices — reading the attack path would put the hidden graph on screen, and a
  test checks every timeline entry against a message they were actually sent.

  Wiring it up found a dead field. `IncidentRuntime.decisionsTaken` was
  initialised at creation and nothing ever wrote to it, so no record of what was
  decided during a response existed anywhere. Choices taken while an incident is
  live are now recorded against it; the section appears in every campaign that
  has an incident, where it appeared in none before.

- **The three clocks never met on screen.** The business date, the programme
  that would cover it and the risks raised against it each lived on their own
  screen, leaving the player to notice for themselves that the control arrives
  after the launch. `collisions` joins them: an objective due soon, the
  programme whose next milestone would cover what it depends on, and whether
  that milestone lands first. Expressed as *covered*, *close*, *too late* or
  *not started*, never as a date the game cannot stand behind.

  Two things it deliberately does not do. It follows dependencies only through
  edges the player has discovered, so the collision becomes visible as they map
  the organisation rather than being handed to them. And it says nothing at all
  about an objective no programme could cover — "nothing covers this" every day
  for a year teaches people to stop reading. Measured over 24 campaigns: an
  engaged player meets a collision in 9, all of them *close* or *too late*; an
  idle one carries a *not started* warning about the platform launch from day 60.

- **The whole campaign was inside the app's JavaScript chunk.** 298 kB of
  content JSON sat in a 587 kB main chunk, and it grows with every authored
  event — the consequence callbacks added 23 kB without anybody noticing. The
  campaign is now its own chunk (94 kB gzip of app code against 152 kB before,
  with 56 kB of campaign beside it), so a content edit no longer invalidates
  cached app code, the two are fetched at once rather than one after the other,
  and the size of the content is visible in the build output. `pnpm size`
  checks every chunk against a budget and CI fails on a breach, because the
  cost of authoring should be a decision rather than a drift. The page also
  paints a static shell now instead of staying blank until React mounts.

  Zod was the other suspect and was not worth touching: building without the
  schema path saved 5.4 kB gzip.

- **Five of the eight mechanics the plan says to teach had no lesson.** Risk
  scenario, investigation, stakeholder influence, assumption and incident were
  all encountered with nothing explaining them, against the plan's "teach
  mechanics when first encountered" and the definition of done's "new player
  can start without reading external documentation". They have one now, in the
  same one-at-a-time dismissible note. A sixth problem surfaced while testing
  it: `lesson-hypothesis` also required no raised scenario, so a player who
  raised one before forming a hypothesis could never be taught what a
  hypothesis is for — the trigger now fires on forming one.

  Lessons live in `src/components/game/lessons.ts`, apart from the component,
  so a test can run their triggers against real campaigns. One test fails the
  build if a mechanic the plan names has no lesson; another plays four
  campaigns and fails if any lesson never becomes showable, because a note
  nobody can reach teaches nobody anything. Measured over 30 campaigns: eight
  of the nine reach the player in 100% of runs, and the incident lesson in 80%
  — the share of campaigns that have an incident to teach from.

- **High pressure was flatter than normal difficulty, not harder.** Good play
  bought 26% fewer incidents there against 37% on CISO, and over 100 seeds the
  defensive player came out *worse* than the passive one (1.96 incidents per
  run against 1.81). Two causes. The profile was not the whole story: the
  threat engine held its own hard-coded difficulty factor applied daily on top
  of the profile's multiplier, sector pressure held a third, and the event
  engine had its own copy of the noise numbers, leaving the profile's
  `noiseMultiplier` dead — so hard mode escalated threat three times over while
  claiming one. And the mode squeezed the player's levers (budget, capacity,
  attention, how fast work comes back) alongside the world's hostility, which
  cuts the very channels skill flows through.

  Every difficulty branch now reads the profile, which gained `threatTempo` and
  `sectorPressurePull` so the hidden dials are visible. High pressure keeps its
  harsher world — more threat, less inherited knowledge, more noise, less
  executive patience — and returns the player's levers to near normal. Good
  play now buys 31%, the defensive player beats the passive one (1.55 against
  1.63, and 20% clean years against 13%), and the ladder is monotonic: idle
  players take 0.57, 1.25 and 1.63 incidents a year across the three modes.

- **The organisation did not remember what the player chose.** Twenty-six of
  the twenty-eight flags a decision option can set were written and never read
  by anything: the machinery for consequences existed and no content used it,
  so the plan's "the organisation appears to remember past decisions" was not
  true. Every one of those choices now has a callback that refers back to it,
  in the voice of somebody who was there — the four weeks you asked the CEO
  for, the launch you waved through, the provider access you left alone, the
  update you waited six weeks for. A content test fails the build on a flag
  that is set and never read.

  Two measurement lessons came out of it. Authored as ordinary pool events, the
  twenty-six callbacks diluted the weighted daily draw enough to cost engaged
  players real outcomes (defensive clean years 37% to 30% over 100 seeds), so
  events can now be `scheduledOnly` and are scheduled by the choice that causes
  them; balance returned to baseline. And the coverage harness took the same
  decision option in every campaign, so half of them looked unreachable until
  it was made to vary its choices per campaign. Every authored event and
  decision is now reached: 123/123 and 26/26.

- **The debrief counted rationales without reckoning with them.** It reported
  how many decisions carried a recorded reason, which says nothing about
  whether the reasoning was any good. The annual review now joins each
  rationale to what followed it — a risk carried as "within tolerance" that
  reached the business anyway, an assurance assumption recorded beside a choice
  that later turned out not to hold — and puts it to the player in their own
  words. See `reasoningReview` in `src/game/debrief/review.ts`.

- **The prioritisation dimension was binary.** It scored `weak` or `strong` and
  nothing between: the lapse term forgave anything under half a year's
  decisions, and the rationale term was constant because the game requires a
  rationale where it matters. It now composes three things multiplicatively
  rather than averaging them — whether the player decided at all, whether they
  decided while there was still time to act, and whether they recorded why —
  because a weighted sum let a perfect rationale record carry somebody who let
  four decisions in ten go by default. Answering everything promptly reads
  `strong`, everything at the wire `solid`, ignoring a third `developing`, and
  ignoring a third *and* answering the rest late `weak`. Fixed a double
  penalty on the way: the decisions log records lapses too, and they carry no
  rationale by definition, so the old rationale share charged a player twice
  for the same lapse.

- **`dec-programme-tradeoff` was reachable all along.** It fires when the
  identity and segmentation programmes are live together, which the coverage
  harness never arranged: it started programmes in content order one every
  forty days, so segmentation began around day 200, long after identity had
  finished. A player who runs both meets the event in 13 of 20 campaigns. The
  harness now starts the contending pair together in a quarter of its runs, and
  **every authored event and decision is now reached** — 97/97 and 26/26.

- **Discovery was not earned.** The blind-spots dimension scored `strong` in
  25 of 25 campaigns, including for a player who did nothing all year: the
  inherited register starts most of the estate "discovered", and passing
  mentions in events reveal the rest, so by day 365 an idle campaign had seen
  every node. Entities now record whether the player established them
  themselves — investigations and assessments set `verified`, inheritance and
  hearsay do not — and the review scores the share of what was reachable that
  was actually examined. An idle year now reads `weak` (0 of 30), a frantic one
  `developing` (13-15 of 30, because over-commissioning returns thin work that
  reveals little) and a measured one `solid` to `strong` (21-25 of 30). Risk
  understanding moved with it, and the overall band spans Difficult to Credible
  where it previously read Credible for almost everyone. The distinction is
  visible on the Organisation screen — an unverified system is badged "Taken on
  trust" and the inspector says so in words — because the review should not
  penalise a player for something the game never showed them. See
  `unexaminedMaterial` in `src/game/knowledge/discovery.ts`.

- **The harnesses were measuring a player who pressed one button.** Every
  offline loop commissioned the first investigation that would start, which is
  always the same repeatable threat hunt near the top of the content file — one
  run reached 6 of 18 investigations and repeated one of them 90 times — and
  none of them ever went to the board, which made the communication dimension
  look impossible to pass. They now work down the list least-commissioned first
  and prepare the quarterly board pack. Content reach rose to 99% of events,
  and a player who does the board reviews reaches `strong` communication. See
  `scripts/play-helpers.ts`.

- **The annual review headline ignored the dimensions** — it keyed on incident
  count alone, so three very different strategies closed on the same line while
  the dimensions underneath differed correctly. `chooseHeadline` now reads the
  shape of the year: the tensions between dimensions first (business delivered
  at the cost of the programme, capability built on a team that is finished, an
  organisation understood but never changed), then severe single-dimension
  verdicts, then the weakest dimension by name. The blind-spots dimension is
  also scored proportionally now, against how much there was to find, so a large
  estate is not penalised for being large. Twelve runs across three seeds and
  four play styles produce five distinct closing lines where they produced one.
  See `chooseHeadline` in `src/game/debrief/review.ts`.

- **Control drift was uniform and severe** — every control lost coverage at a
  flat rate toward zero, taking IR readiness to 0.05 over an idle year. Drift
  now has three shapes matching why a control actually decays, and runs toward
  a floor set as a share of the best level ever reached, so built capability
  persists and a programme raises the floor as well as the value. An idle year
  now leaves IR readiness deployed but unexercised rather than gone. See
  `applyDrift` in `src/game/controls/effectiveness.ts`.

- **Team capacity was close to inert** because only investigations ever
  committed capacity — programmes declared a demand but never occupied anyone,
  so "delegated work competes with programme delivery" was untrue. Committed
  capacity is now derived each tick from running assignments *and* live
  programmes, strain reads from the most pressed function rather than an
  average that hid it, and morale declines faster than it recovers. A player who
  commits to everything reaches overload and loses morale; a restrained one
  stays sustainable. `dec-team-overload` and `evt-org-morale-low` now fire, and
  delegated work returning late or thin roughly doubled. See
  `src/game/team/capacity.ts`.

- **Assumptions recorded when already false** used to invalidate on the next
  tick, so the game announced "the world changed" about something it had always
  known to be untrue. Assumptions now record whether they held when made, and a
  never-true one stays quiet until the player's knowledge catches up — the
  relevant control is assessed or dependency discovered — at which point it is
  worded as a failure of assurance rather than of change. An investigative
  player now meets them ~29 days after recording; an incurious one never does,
  and the annual review names them as things relied on all year and never
  tested. See `src/game/assumptions/validation.ts`.

## Further reading

**`docs/IMPLEMENTATION_PLAN.md` is the original build specification**, committed
verbatim. It is the source of truth for what this game is meant to be: the
product principles, the core loop, the content budget, the difficulty design,
the release gate and the definition of done. Section numbers referenced in code
comments (plan §13, plan §39, and so on) point into it. Read it before changing
a system, and update it if the architecture genuinely moves.

Then `docs/ARCHITECTURE.md` (how it is built), `docs/CONTENT.md` (authoring),
`docs/HOSTING.md` (the release gate) and `docs/PLAYTEST.md` (the question the
harnesses cannot answer).
