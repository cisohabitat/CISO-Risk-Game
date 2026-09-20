# Findings

The ledger behind `CLAUDE.md`. Every entry here was found with one of the
harnesses listed there and closed the same way: what was observed, how it was
measured, what changed, and how the change was checked — usually by putting the
defect back and watching a named test fail.

Two things this file is for. First, so a session that meets a symptom can see
whether it has been met before, and how. Second, so the project's record of its
own mistakes is kept where it costs nothing to keep: it was split out of
`CLAUDE.md` when that file reached 1,100 lines and every session was reading
the whole of it. The rules, the harnesses and the open weaknesses are what a
session needs; this is what it consults.

Note how often a finding turned out to be in the harness rather than the game.
Check what the simulated player actually did before concluding the game is at
fault.

### Fixed

- **A fresh pass over the repository, not trusting the record — including
  this file.** Played a year by hand, sampled the file's own "mutation-checked"
  claims by re-running the mutations, and read the docs against the code.
  Four things, in order of weight.

  **A decision that lapsed was never told to the player.** Found on the second
  stop of a hand-played year: the CEO's "three risks" was at one day left, the
  clock advanced, and at the next stop it had simply gone. The engine had
  recorded a lapse — `resolveByDefault` wrote a history line and applied the
  default's effects — and sent nothing to the inbox, the channel every other
  consequence arrives through. Between day 6 and day 18 the inbox carried seven
  messages and not one of them said the organisation had answered the CEO with
  "talk in general terms" on the player's behalf. The only trace was in the
  Briefing's four-item "Recently" list, which had rolled off. The player learned
  what was chosen for them on 31 December, when the review counted it against
  them. A lapse now sends an urgent message from Nexora Group naming the option
  taken, linked to the decision. `tests/engine/lapse.test.ts`; mutation-checked
  by removing the message.

  **One of the file's "mutation-checked" claims was false.** Sampled four:
  toast pointer-events, the board-paper card on the Briefing and the
  red-herring exclusion each failed their named test when re-mutated, as
  claimed. The unaffordable pattern offer did not: with `disabled={noAttention}`
  changed to `disabled={false}` — the exact defect it exists to catch — the
  end-to-end test stayed green, because its only assertion sat inside
  `if (week.startsWith('0'))`, which on its seed never ran. A test that passes
  with the defect present guards nothing. The contract is now held by
  `tests/ui/pattern-notice.test.tsx`, which arranges zero attention directly and
  asserts both branches every run (mutation-checked); the end-to-end test skips
  loudly, naming why, rather than passing quietly — which is why the suite's
  skip count rose from 3 to 8 across the five local viewports.

  **`pnpm play` read a sixth of what the game was saying.** On day 44 of the
  hand-played year nine patterns were on offer and the harness printed one;
  it printed no history at all, so the lapse above was invisible to the one
  harness whose job is to read what the game says. It now prints every
  pattern with a count, every lapse since the last stop, and a warning under
  any decision at one day left — the trap the first lapse fell into.

  **`docs/ARCHITECTURE.md` said "ten dials".** There are eleven since
  `showsDecisionCoaching`, and it is neither a world dial nor a player dial —
  it is a presentation dial, which the document now says.

  The measured weakness about this file's own length is filed above, ranked
  last, as a recommendation rather than a change.

- **The player guide described a screen that no longer existed, and the release
  gate was a list nobody checked.** Two pieces of debt, both created by the
  three passes above rather than found in them.

  **The guide had gone wrong, not just stale.** It told a new player to look for
  "the four bands across the top", which the visual pass had moved into a strip
  under a masthead; it quoted "You may have found a pattern", which is now
  `Pattern emerging`; it described unverified systems as carrying a badge, when
  they are drawn dashed and resolve as you check them; and it had no section at
  all for `Your year`, a screen with its own destination and keyboard shortcut.
  Nine of its ten screenshots predated the changes. The text is corrected and
  the pictures regenerated with `pnpm guide:shots`. **The board-paper capture
  failed again** — it is the one the spec's own comment says does not reliably
  reach its screen — and that image is left as it was, which is honest here
  because nothing in this pass touched the Board screen.

  **Six of the fourteen release-gate conditions are now asserted rather than
  remembered.** `docs/HOSTING.md` said CI covered five and "the remainder are
  checked before release", which in practice meant nobody checked them: they all
  hold by construction and would only break by accident. `tests/content/release-gate.test.ts`
  reads them off the source — no network primitive anywhere in `src/` (steps 7,
  8 and 14), no account (4), no store outside the browser (5), and no
  environment variable beyond Vite's build-time booleans (9). Mutation-checked
  three ways: adding an analytics `fetch`, a `VITE_API_KEY` read and a `signIn`
  each fail a named test.

  Worth stating plainly: the reason the Vercel Functions tab shows no
  invocations is not restraint, it is that the application has no way to make a
  request. That property is now held by a test, so an accidental analytics call
  fails `pnpm check` rather than turning up on a bill. Steps 12, 13 and 14's
  confirmation still need a deployment and a person; nothing in the repository
  can check those and no test pretends to.

- **The interface read as an enterprise dashboard rather than a command
  centre.** A visual review graded the game 8.5/10 — structure strong, identity
  and tension weak — and named five changes worth more than the other ten. All
  five were real when checked against the source, and one was worse than
  reported: the Briefing carried **16 bordered cards**, four of them the
  standing bands, so nothing on the screen looked more important than anything
  else.

  **The Briefing leads with what wants you.** A masthead (`CISO BRIEF · WEEK 14`
  / `NEXORA GROUP · INTERNAL`), then a headline counting what needs an answer,
  then the four standing readings as one unboxed strip rather than four cards of
  equal weight. Cards are now reserved for things that can be acted on. 16 → 14
  and the four that went were the ones competing hardest.

  **A collision is drawn as a race.** Two tracks on one scale: the business date
  as a tick, because a commitment can be stated, and the covering milestone as a
  **band**, because it is a projection off the rate the programme has actually
  managed. The review asked for "41 days" on the second track; the file's own
  rule is that a collision is "never a date the game cannot stand behind", and
  that rule is right — staffing, blockers and the player's next move all shift
  it. The band says *about here, and we are not sure*, the gap is shown as
  distance, and the verdict is written in words beside it.

  **Pattern emerging is no longer a card.** The moment something clicks was
  arriving in the same bordered box as everything else. It is ruled off top and
  bottom now, the proposition set in the display face, the evidence listed
  under "what led here" — an analyst's inference rather than a notification.

  **"Taken on trust" is visible, not just labelled.** An unverified system was a
  solid row with a badge on it, which reads like every other row. Unverified
  nodes are dashed and set back, in the list and in the graph, and resolve to
  solid as the player checks them. The graph was already dimming by
  *confidence*, which is a different thing — an inherited entry can arrive
  confident and wrong — so it now draws `verified` as well. On day one the whole
  estate is dashed, which is the truth and the point.

  **The annual review is a report.** Rules top and bottom, the organisation and
  "annual review" as a kicker, the headline centred in the display face with
  room around it, and the eight dimensions as a strip you read down rather than
  eight boxes competing for the eye.

  A sixth, from further down the same list: **a risk leads with the scenario,
  not the rating.** The badges sat above the title, so the most prominent thing
  on a risk was its colour — which is how players learn to optimise the colour
  instead of reading the risk.

  Cost 1.2 kB gzip (228.1 → 229.3 of a 240 kB critical path). Both themes pass
  axe on every screen. Rendering and looking caught two faults no test would
  have: the `?` buttons made two of the four standing labels taller, so their
  badges sat lower than the others, and the risk cards needed the order flipped
  to make the point above. The other nine recommendations — screen-by-screen
  visual dialects, milestone tracks on programmes, evidence-source headers,
  incident-mode subordination — are not done and are not recorded as weaknesses:
  they are a design direction, and the next one should start from a playtest
  rather than from another reading.

- **The year was eight paragraphs of prose and no picture.** The annual review
  described a campaign the player had just spent a year in without ever showing
  it to them, and it only existed on 31 December. `Your year, day by day` is the
  same year as one 364-day strip — decisions taken and lapsed, programmes
  running and finished, enquiries, board papers, assumptions that stopped
  holding, incidents — in `src/components/debrief/YearTimeline.tsx`, derived by
  `yearTimeline` from state the player already saw. It reads no hidden state: an
  incident contributes its family name and its day, never its attack path.

  **Identity is the lane, not the colour.** Six rows, six labels, six icons.
  Take the colour away entirely — print it, or read it with any colour-vision
  deficiency — and the figure still works, which is the rule the rest of the app
  already holds to. Marks are 3px ticks rather than icon bubbles, because an
  icon at 11px repeated twenty-one times is not an icon; it lives once on the
  lane label where it can be read. Every mark is also a sentence with its day in
  "Read the year as a list", which is what a screen reader gets and what anybody
  gets on a phone where 364 days will not fit.

  **The palette was computed, not chosen.** Three chart hues, validated rather
  than eyeballed: green 150, accent 250, magenta 340 pass the lightness band,
  chroma floor, colour-vision separation and contrast checks in both themes.
  Violet 300 was the first choice and **failed against the accent at ΔE 2.3 for
  deutan vision**, which is why programmes are magenta. Ink was in the first set
  too and does not belong in a categorical palette at all — it is a text colour.
  Dark is chosen, not flipped: chart marks want L 0.48-0.67 against that
  surface, where the band tokens sit at 0.72-0.79 because they are also label
  text. Both themes pass axe with the list open; the audit did not cover this
  screen before, because nothing navigated to it.

  **Two things turned up while building it.** The debrief had no route into it:
  the only way in was a banner shown once the year was over, so the screen's own
  "your year is not finished yet — write it up now" branch was unreachable, and
  a player could never close the year early though the screen offered to. It is
  a destination now (`Y`), and the timeline renders mid-campaign, which is the
  point of it — you can see the shape of your year while there is still year
  left to change. And drawn honestly it shows the fourth quarter thinning out,
  which is a measured weakness this file already carries: that is a reason to
  have built it, not to soften it.

  The whole feature costs **2.6 kB gzip** (225.5 → 228.1 kB of a 240 kB critical
  path), which is why the icons are seven hand-drawn inline SVGs and not a
  library. Checked by rendering it and looking: two layout faults no test would
  have caught — lane summaries truncating to "11 decisions, all yo…" and the
  quarter axis vanishing at 320px, leaving a mark three-quarters along a row
  saying nothing about when it happened.

- **Prioritisation measured decision discipline, not prioritisation.** The
  dimension scored whether the player decided at all, decided in time, and
  recorded why — none of which establish that scarce attention and money went
  to what mattered. Measured: a player who answered every decision promptly and
  committed to **nothing of their own read `strong` on 20 of 20 seeds**. That
  is the gap the whole review was pointed at — succeed by judgement, or by
  learning the assessment rules — and it was the last one open.

  It now reads where the effort went. `src/game/debrief/prioritisation.ts`
  takes the commitments that cost budget, attention and the team's capacity —
  programmes started, enquiries commissioned — and scores how close to the
  biggest risk in the organisation the average one was.

  Four things it deliberately is not. **Not coverage**, which is the
  blind-spots dimension: a player who commits to one thing and picks the right
  one scores full marks, because "pick one programme and finish it" is what the
  player guide tells them to do. **Not judged against the year-end picture**,
  because a programme that worked lowers its scenario's residual and scoring
  the end state reads success as having worked on something that did not
  matter — the same trap that once emptied the board pack for the player who
  had done the most. `risks.initialMateriality` snapshots the true residual of
  every authored scenario on day one, per seed, so the biggest risks differ
  between campaigns rather than being a fixed answer to learn. **Not judged
  against what nothing could reach.** And **not charged against work that was
  not about a risk** — a team review is real effort and addresses no scenario,
  so it is ignored rather than counted as a bad aim.

  Measured over 20 campaigns per style on CISO:

  | | allocation | band |
  |---|---|---|
  | Did nothing | 0.00 | weak 20/20 |
  | Answered everything, built nothing | 0.00 | **developing 20/20** |
  | Built the two least material programmes | 0.54 | solid 19/20 |
  | Commissioned all eighteen enquiries | 0.64 | solid 20/20 |
  | Built the two most material programmes | 1.00 | strong 20/20 |

  The declared philosophy from `pnpm ladder` — investigate selectively, build
  one programme at a time, answer everything, take every board paper — reads
  `strong` on 19-20 of 20 across all three modes, so the dimension is winnable
  by playing well rather than by playing to it. The simulation is untouched:
  soak 1.20 / 28% / 3% and the ladder identical, because this reads state at
  year end plus one snapshot at setup.

  **Three attempts were wrong before this one, and measuring caught each.**
  Matching an enquiry to a scenario through whole attack paths counts a mean of
  **6.0 of the 14 scenarios per enquiry, and up to all 14** — the paths cross
  the estate — so three enquiries scored a perfect year. The raw ratio never
  approaches zero even for the worst available choices, so passing it through
  unshaped put a player who deliberately chased the smallest risks in the top
  band on **19 of 20 seeds**; it is normalised against the worst set of choices
  the campaign itself offered. And passed through flat, an undirected year sat
  exactly on the `strong` boundary and fell either side of it by seed, which
  reads as noise to a player.

  **The timeliness term was dead and is gone.** The old rule wanted a third of
  the decision window still unspent and charged everything else as late, which
  marks a player down for the thing the game keeps asking them to do — find
  something out before committing. Softening it to catch only the wire made it
  inert: measured over 20 campaigns of a player who waits for the deadline every
  time, a decision resolved on or after its deadline day happened **0.0 times a
  campaign in 0 of 20**, because the deadline lapses the decision before it can
  be answered. There is no "late" in this game — you answer or the organisation
  answers for you — and `decidedTerm` already says which. Removed rather than
  shipped as a row that describes nothing, which is the `noiseMultiplier`
  lesson.

  A save written before the snapshot existed cannot have its first day
  recovered, so it is assessed from where it stands — approximate, and much
  closer than scoring a year of good choices at zero for a missing yardstick.
  Mutation-checked three ways; the test that pinned the old contract
  (`prompt` → `strong`) was rewritten rather than made to pass.

- **Five things found by a source review of the assessment rules, and what
  measuring them actually showed.** A reviewer read the repository rather than
  playing it and raised five defects. All five were real in the source. Two of
  the fixes then had to be rebuilt after measurement contradicted the first
  attempt, and a third turned out to be broader than reported.

  **The budget floor concealed a shortfall instead of resolving it.** The floor
  on `budget.change` stopped the balance going negative, and that was all it
  did. Affordability was checked against `requirements.budget` — and **not one
  of the fifteen priced options declared it**, so the gate was dead for every
  decision in the game, not just the reported one. £320k of emergency response
  could be taken with £100k left: budget to zero, full containment and morale
  benefit applied, and the missing £220k recorded nowhere. A player who kept a
  contingency finished level with one who spent everything.

  Options now state a price once, as the negative `budget.change` the reducer
  applies, and the gate is derived from it — so it covers all fifteen and cannot
  drift from what is actually spent. `budgetTreatment` says how it is funded:
  `discretionary` (the default) is refused unless the year can pay, `imposed`
  is money taken from you and floors without becoming a debt, and `emergency`
  may exceed the allocation with the shortfall carried in
  `resources.unfundedCommitment` and named in the annual review. The price is on
  the card now instead of the word "Expensive". A content test fails the build
  if any decision's every option is discretionary and priced, because a
  decision nobody can afford would lapse into its default for the one reason the
  player can do least about; **0 of 26 are, today**.

  Measured over 40 seeds per mode: the simulation is unmoved (incidents
  0.50 / 0.95 / 1.70, programmes 2.8 / 1.9 / 1.2, board 0.61 / 0.62 / 0.63,
  soak 1.20 / 28% / 3% — all unchanged) and one row moves. Objectives missed
  went 1.88 / 1.65 / 1.50 → 1.88 / 1.13 / 1.30, and the cause is a single
  substitution a campaign: the player wants to quarantine the acquisition
  (£120k), cannot afford it, connects on schedule instead, and the business
  keeps its date while the exposure is carried. That is the trade-off the game
  exists to teach, and it used to be free. **Checked it was not lapsing**: the
  ladder retried one option daily until it timed out, which no player does —
  the dialog disables what they cannot afford and they pick from the rest. The
  harness falls back now, and the row did not move back, so the substitution is
  real. Mutation-checked, six ways.

  **A quiet year was automatically resilient.** `resilience` was
  `1 - worstConsequence * 0.8`, and with no incident the worst consequence
  defaults to zero, so every untested year reached the maximum — while the
  sentence beside it read "whether that was capability or fortune is worth
  asking". The verdict answered the prose's question, in the player's favour.
  Absence of an incident is an outcome, not evidence of capability. A tested
  year is still scored on how the organisation came through it; an untested one
  is scored on whether recovery was ever exercised — `inv-recovery-test` or
  `inv-ir-readiness` completed, and recovery controls the player established
  assurance over themselves rather than inheriting — and is capped below
  `strong`, because nothing demonstrated it.

  **The first version of that fix was wrong and measurement caught it.**
  Multiplying the exercise and capability terms put all three play styles in
  `developing` — a dial with no room to move, the same failure as
  `noiseMultiplier`. Adding them instead discriminates: over 20 quiet years on
  guided, an idle player reads `weak`, one who exercises recovery
  `developing`, and one who builds the ransomware programme *and* exercises it
  `solid` (10 of 12, mean recovery capability 0.13 → 0.33). Across the ladder
  `developing` went 2/9/17 → 4/12/20 of 40, still monotonic.

  **The reasoning review ignored chronology.** It built one set of incident
  paths for the whole year and asked whether an accepted risk shared one, with
  no day comparison — so an incident on day 40 could be cited as evidence
  against an acceptance made on day 120 through the same path, which may have
  been made *because* of that incident, after remediating it. Incidents are kept
  with their days now and only count against reasoning recorded before them.

  **Accepting a risk removed it from the player's own top concerns.**
  `topConcerns` filtered to `open`, `treated` and `emerging`, so a material risk
  disappeared from the Briefing precisely because the player took
  responsibility for it — teaching that acceptance is how you make something go
  away. Accepted risks stay and are badged "Accepted — carried"; only `closed`
  drops off. In the same selector, an unassessed scenario took
  `riskBand(residual ?? 0)` and rendered as **Low residual**, so "we have not
  looked at this" and "we looked, and it is fine" were the same row. It reads
  "Not yet assessed" now and sorts after the assessed rather than among the low.
  **Reachable in 12 of 12 campaigns** — a risk the player raises themselves is
  unassessed until they assess it — though the first probe said zero because it
  never raised one. Third harness fault this session.

  **Some decisions printed the preferred answer above the options.** Seven
  decisions carry a `teaches` note and it rendered in the dialog while the
  player was choosing: the platform launch reads "Supporting with conditions is
  usually more effective than opposing outright" above an option labelled
  "Support, with conditions". The game says that decision has no mechanically
  superior answer; the note gave it one. It is now the profile's
  `showsDecisionCoaching` — guided keeps it, CISO and high pressure give the
  same facts and let the debrief judge afterwards. One decision context named
  its answer too ("saying yes with conditions… usually lands better") and now
  states the trade-off without the verdict. The mechanics lessons in
  `lessons.ts` are untouched: those explain what a mechanic *is*, which every
  mode still needs.

- **A consequence could take the budget below zero.** `spendBudget` refuses
  any player action that would overdraw, and `focus.change` and
  `capacity.change` both clamp at zero — `budget.change` was the one resource
  effect without a floor. Fifteen authored options carry a negative amount, the
  largest being external IR support at £320k, so a player who had committed to
  programmes and then met a costly consequence went overdrawn in silence and
  the Briefing read "£-70k of £2.4m". It floors at zero now: you spend what the
  year actually has. `budget-non-negative` joins `focus-non-negative` in the
  invariants, so a soak catches it coming back.

  Behaviourally neutral otherwise — over 40 seeds per mode the ladder is
  unchanged (incidents 0.50 / 0.95 / 1.68, programmes 2.8 / 1.9 / 1.2) and only
  the overdraft disappears. It never reached a player who merely answered
  decisions; it took building as well, which is why three passes of hand-played
  years missed it and the ambitious appetite in `pnpm ladder` found it.
  Mutation-checked.

- **"1 business objective were missed."** Found by playing the same year on all
  three difficulties: the closing screen builds that sentence from a count, and
  only the plural was written. The singular case is written out now, and
  `tests/engine/presentation.test.ts` checks both. Mutation-checked.

- **Five things found by playing a year in a browser rather than through the
  engine.** Three earlier passes drove the simulation directly; this one drove
  the actual interface — clicking, reading what was on the screen and taking
  what the game offered. The interface, not the simulation, is where every one
  of these lived.

  **A whole year could be played without ever being told the board paper was
  due.** The quarterly review appeared only on the Board screen. Played from
  the Briefing — where the game puts you, and where "Waiting on you" tells you
  what needs an answer — 364 days and 23 decisions went by and the four board
  papers were never mentioned; "Nothing is waiting on you. No decision needs an
  answer right now" was shown with one outstanding. The annual review then
  marked the year down: `Communication and escalation: developing — 0
  quarterly reviews prepared`, for a mechanic the game never surfaced. The
  Briefing now carries the due paper in "Waiting on you" with a way in, and the
  rail badges Board the way it already badges the Inbox. Mutation-checked.

  **The first three weeks told a new player they had already checked 41% of
  Nexora.** "Checked for yourself: a start" on day one, dropping to "none of it
  yet" on day 21 with no explanation. The wording was fixed before; the
  quantity was not. The inherited assurance picture is recorded at day -180 and
  `ASSURANCE_LIFE_DAYS` is 200, so for twenty days somebody else's assessment
  counted as the player's own examination — the exact mistake the verification
  model exists to teach, on the first screen of the game. Nodes and edges
  already drew this line with `verified`; controls now do too, on the basis
  that a negative day is before the player arrived.

  **The annual review still rendered the internal understanding score.** `66%
  of the estate was brought into view` — the same 0..1 aggregate taken off the
  Briefing for being a number where a band belongs — sitting directly above `0
  of 32 things you could have examined yourself, you did`, which reads as a
  contradiction. It is a count now: `37 of 38 systems were ever brought into
  view`.

  **A player who did nothing was credited with a trade-off.** Sixteen of
  eighteen decisions lapsed and the headline read "The business got its year.
  The security programme did not." A trade-off is something you make; the
  tension headlines now require that prioritisation did not fail, and an absent
  year closes on "The year was decided largely without you."

  **The main screen offered an action it would then refuse.** With the week
  spent, "Form the hypothesis" stayed live and a click produced a toast. The
  Investigations panel in the same codebase disables what you cannot afford and
  says why in place; the pattern card does both now. Mutation-checked in the
  end-to-end suite.

  One text change came out of reading the close: three incidents from the same
  family listed as three near-identical lines, which looks like a duplicate
  rather than the point. Repeats are grouped — "Customer data exposure on day
  88, and again on days 176 and 300 — the same weakness, still open".

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

- **The ladder, played rather than reasoned.** One CISO philosophy — understand
  the business first, be candid about uncertainty, investigate selectively,
  build one programme at a time, take every board paper — declared up front and
  run identically on all three modes over 40 seeds each. `pnpm ladder`.

  Re-measured after the budget gate and the resilience rebuild, which moved
  three of these rows; the figures below are current.

  | | Guided | CISO | High Pressure |
  |---|---|---|---|
  | Programmes built | 2.8 | 1.9 | **1.2** |
  | Days wanting to build, no money | 72 | 166 | **225** |
  | Incidents a year | 0.50 | 0.95 | **1.70** |
  | Worst consequence | 0.17 | 0.31 | **0.48** |
  | Resilience `developing` | 4/40 | 12/40 | **20/40** |
  | Objectives missed | 1.88 | 1.13 | 1.30 |
  | Board confidence | 0.61 | 0.62 | 0.63 |

  Both halves of the ladder bind. The budget decides how much gets built —
  2.8 programmes against 1.2 for the same intent — and every mode ends the year
  spent to roughly zero, so the multiplier is the constraint rather than a
  number in a table. The threat side moves with it: incidents and worst
  consequence each roughly treble, and the resilience band inverts. On a shared
  seed the identical policy closed on "You built the capability on people who
  cannot do it again" on the first two modes and on "You built the capability,
  and the business paid for it in delivery" on high pressure. `Your team is
  past sustainable load` fires on CISO and high pressure and never on Guided.

  Objectives missed does not track the ladder (1.88 / 1.13 / 1.30) and that is
  correct, for two reasons pulling against each other. Live programmes impose
  `businessFriction`, so the mode that builds most disrupts most — which is why
  guided misses the most. And incidents cost the business too, which is why
  high pressure misses more than CISO despite building half as much. Business
  enablement measures the friction the player chose to impose plus the damage
  they failed to prevent, not the mode. Board confidence is flat at 0.61-0.63
  for a player who prepares every board paper.

  The CISO figure was 1.65 before the budget gate landed. The fall to 1.13 is
  one substitution a campaign — the acquisition quarantine the player can no
  longer afford — and is recorded under that entry.

  **An earlier version of this entry was wrong, and the harness was why.** The
  programme list held `prog-recovery`, which is not a real id, so
  `index.programme.get` returned undefined, the loop stopped advancing and
  every mode silently built exactly one programme. That produced "41% of the
  budget unspent on Guided" and the conclusion that the budget multipliers
  never bind — the opposite of what happens. The script throws on an unknown
  id now. Check what the simulated player actually did.

- **The pattern offer looked like a queue again.** Playing in the browser,
  forming one hypothesis immediately surfaced another, three times in a row on
  the same day, which looked like the backlog the recency window was meant to
  remove. Measured over 12 campaigns: an offer is on screen on **2% of days**,
  and on those days the median number waiting is **1** (mean 1.5, max 5).
  Forming one reveals another on about three days a campaign. The earlier
  figure that suggested otherwise came from a probe that never formed anything,
  so offers accumulated forever. Nothing changed.

- **Two resume entries that looked identical.** The start screen showed two
  autosaves of the same campaign, same day, same second, indistinguishable. It
  was an artifact of advancing the clock as fast as a script can: in ordinary
  play the rolling autosaves are seconds apart and legible. Nothing changed.

- **The rail, twice.** A screenshot of the Board screen showed Team
  highlighted, and the Organisation screen looked like its Inspector was
  covering the filter tabs. Both were misreadings — the first was the pointer's
  hover (since fixed), the second a tab strip that ends 12px before the
  Inspector begins. Measure the DOM before believing a screenshot.

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

