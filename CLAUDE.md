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

## Known weaknesses

Measured, not yet fixed. Ranked.

Nothing ranked at present. Add measured findings here rather than suspicions —
each entry below was found with one of the harnesses above and closed the same
way. Note how often the finding turned out to be in the harness: check what the
simulated player actually did before concluding the game is at fault.

### Fixed

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

Then `docs/ARCHITECTURE.md` (how it is built), `docs/CONTENT.md` (authoring) and
`docs/HOSTING.md` (the release gate).
