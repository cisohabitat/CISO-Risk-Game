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
| `pnpm ladder sweep 15` | Does one philosophy produce three different years? |
| `pnpm guide:shots` | Regenerates the pictures in `docs/PLAYER_GUIDE.md` |
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

- **Executive patience stops describing the mode after about week seven.**
  `executiveTolerance` seeds `operationalTolerance` at 0.62 / 0.50 / 0.38, and
  then `relationships.ts` drifts it up 0.0015 a day with no ceiling — +0.55
  over a year against a 0.24 spread between the modes. Measured: the objectives
  friction term, which bites below 0.45, fires on **0 days of 364 on guided and
  on CISO**, and on **46 on high pressure**; all three finish the year at or
  near maximum patience. "Less executive patience" is one of the four things
  high pressure is meant to keep, and it keeps it until about week seven.

  Bounding it was tried and reverted, and the experiment was re-run against
  the current build once the budget gate and the overload fix had moved the
  baseline. Drifting toward the profile value instead of past it makes the
  dial real all year — for an idle player the friction term then bites on
  0 / 57 / 350 days of 364 across the ladder, against 0 / 0 / 84 today — but
  because 0.45 falls between CISO's 0.50 and high pressure's 0.38, high
  pressure pays almost permanently. Over 40 seeds of the ladder policy:

  | | Guided | CISO | High Pressure |
  |---|---|---|---|
  | Objectives missed | 1.88 → 1.95 | 1.07 → 1.20 | 1.27 → **2.23 (+76%)** |
  | Incidents a year | 0.50 → 0.42 | 1.02 → 0.93 | 1.57 → 1.60 |

  That buys difficulty by punishing the business rather than the security
  posture, which is not what the dial is for, and it needs the 0.45 threshold
  revisited alongside it. The first measurement said +74% against an older
  baseline; the re-run says +76%, so the shape and the size both stand. Two
  coupled numbers and a 76% swing in one mode is a playtest question, not a
  desk decision.

- **Five risk bands, two ever used.** `riskBand` cuts residual at 0.16 /
  0.34 / 0.55 / 0.75, and the simulation's residuals for Nexora's estate sit
  between 0.11 and 0.31 on day one and move by hundredths. Measured over 20
  campaigns per mode and two play styles: **86% of the risk rows a player
  ever sees read `moderate`**, `elevated` appears in 4%, and `high` and
  `severe` never. The list is now ordered by assessment within a band, which
  is what separates the rows; but the words themselves say almost nothing,
  and the same thresholds feed materiality for the board pack, the collision
  verdicts and the debrief, so re-cutting them is a tuning pass with reach
  into all three. Not changed. A playtester who says the risks "all look the
  same" is the signal.

- **The noise dial cannot move.** A comparative review across the three modes
  worried that high pressure might get harder by filling the inbox rather than
  by being strategically harder, and graded the profile's `noiseMultiplier`
  (0.7 / 1.0 / 1.3) as part of the ladder. Measured over 40 campaigns per mode:
  **exactly 2.00 noise events fire in every campaign at every difficulty**,
  2.3% of the ~85 events a year, because two of the 123 authored events carry
  the tag and both are one-shot. Everything eligible fires anyway; the
  multiplier only shifts which day they land on. The row in the difficulty
  table describes something that does not happen.

  The worry it was raised against is answered, and the other way round. Over 20
  campaigns per mode an engaged player sees 150, 158 and 163 messages a year
  across the ladder — 9% end to end — with an identical repetition ratio
  (1.42 / 1.40 / 1.42) and a flat routine share (28% / 27% / 27%). What rises
  is material: critical messages 3% → 6% → 8%, decisions 18.5 → 20.5 → 21.5,
  incidents 0.5 → 1.2 → 1.6. High pressure is harder, not noisier.

  Not fixed, deliberately. The only route is authoring noise events, which
  would make the mode harder in exactly the cognitive way the review asked us
  not to, and the discrimination plan §44 is after is already carried by
  evidence — 4 of 48 marked `noise`, 2 more tagged `contradicts-` — which no
  difficulty dial touches. Recorded so nobody tunes or grades a dial with no
  room to move; `setup.ts` and `events/engine.ts` carry the same note.

- **The year no longer fades, and the last quarter is still the lightest.**
  Measured before any of it: decisions arrived 12.4 / 6.5 / 2.8 / 1.4 per
  quarter for an engaged player, the longest stretch with nothing to decide
  averaged 114 days, and the second half of the inbox was fourteen
  repeatables because the one-shot pool was spent by July. Two changes, at
  the owner's decision and against the freeze: five late-year decisions that
  arise from the player's own position, and a draw that paces calendar-only
  texture across the year in two tiers (signal early, colour spread). The
  same probes now read **12.3 / 7.2 / 3.9 / 2.8**, a longest stretch of
  **67 days**, and 49 / 53 / 33 / 34 messages a quarter from 77 / 123 / 94 /
  94 subjects. `docs/FINDINGS.md` has both entries and the ladder before and
  after.

  What remains: the fourth quarter carries just under a quarter of the
  first, and whether the back half now *feels* like the year building is the
  playtest question in `docs/PLAYTEST.md`. High pressure now misses more
  objectives (1.32 → 1.60) because colour events that carry executive
  patience land where objectives fall due, which is the executive patience
  weakness above wearing a new coat.

- **Decision-led play misses what its decisions caused.** From the first
  observed playtest (`docs/playtests/2026-09-20-ai-browser-session.md`, an
  AI-driven browser session, not a human): a player who followed the
  briefing and Skip ahead missed a thin enquiry result for a month, left a
  formed hypothesis unraised for two, and found the identity enforcement's
  successful follow-up only on a deliberate inbox review. Every one of those
  was in the inbox; none was in the briefing. Not changed on one session's
  word: the fix would be surfacing commissioned-work results and decision
  follow-ups on the briefing, which is a screen the visual pass deliberately
  kept to what needs an answer. A human who misses the same things is the
  signal.

Add measured findings here rather than suspicions. The ledger of what was
found, how it was measured and how it was closed — every fixed defect and every
suspicion that turned out to be the harness — lives in `docs/FINDINGS.md`, and a
new finding goes there once it is closed. Read it before deciding something is
broken: a good share of past findings turned out to be in the probe, not the
game, so check what the simulated player actually did first.

## Further reading

**`docs/IMPLEMENTATION_PLAN.md` is the original build specification**, committed
verbatim. It is the source of truth for what this game is meant to be: the
product principles, the core loop, the content budget, the difficulty design,
the release gate and the definition of done. Section numbers referenced in code
comments (plan §13, plan §39, and so on) point into it. Read it before changing
a system, and update it if the architecture genuinely moves.

`docs/PLAYER_GUIDE.md` is written for somebody who has never played and knows
nothing about the subject: what the screens are, what the two scarce resources
are, and what a sane first year looks like. Its screenshots come from the
running game via `pnpm guide:shots`, so a screen that changes can be
re-photographed rather than left to go quietly stale. Hand it to a playtester
only *after* their session — whether the game teaches itself is one of the
things under test.

Then `docs/ARCHITECTURE.md` (how it is built), `docs/CONTENT.md` (authoring),
`docs/HOSTING.md` (the release gate), `docs/PLAYTEST.md` (the question the
harnesses cannot answer) and `docs/FINDINGS.md` (everything found so far, and
how each was closed).
