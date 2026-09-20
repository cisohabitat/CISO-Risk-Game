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

  Bounding it was tried and reverted. Drifting toward the profile value instead
  of past it makes the dial real all year — high pressure then sits under the
  threshold on 358 days of 364 — but because 0.45 falls between CISO's 0.50 and
  high pressure's 0.38, only high pressure pays, permanently: over 40 seeds
  objectives missed went 1.38 → 2.40 (+74%) while incidents fell 1.65 → 1.43.
  That buys difficulty by punishing the business rather than the security
  posture, which is not what the dial is for, and it needs the 0.45 threshold
  revisited alongside it. Two coupled numbers and a 74% swing in one mode is a
  playtest question, not a desk decision.

  **Those two figures are now stale and the experiment needs re-running before
  anyone acts on them.** They were taken before the budget gate, which moved
  objectives missed on high pressure in the ladder from 1.50 to 1.30 — the
  baseline the +74% was measured against has itself moved. The shape of the
  finding stands; the size of it is unverified.

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

  **Independently re-raised by a source review**, which argued that a freeze
  meant to prevent unnecessary expansion should not block a documented
  weakness, and proposed the right shape for it: the last quarter should ask
  *what organisation have I created, and what must I now change?* — a nearly
  finished programme facing its adoption choice, a temporary acceptance due for
  renewal on assumptions that have since moved, a service that outgrew the
  resilience design it was given, pressure to cut next year's budget after a
  quiet one. That is late-year decisions arising from the player's own
  position rather than from the draw, and it is the most promising route
  anybody has put forward. It is still authored content on a frozen campaign,
  and the review that proposed it was explicit that it had not played the game.
  The trigger remains a player, not a reading.

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
