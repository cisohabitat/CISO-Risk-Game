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
| `pnpm ladder bands 8` | What do the risk rows actually read, and how often? |
| `pnpm ladder transcript ciso [seed]` | Everything one year says, in full — messages, decisions, the close |
| `pnpm tsx scripts/efficacy.ts 150` | Does each programme reduce what it is meant to? |
| `pnpm guide:shots` | Regenerates the pictures in `docs/PLAYER_GUIDE.md` |
| `pnpm tsx scripts/prepare-campaign.ts <seed> <stop>` | A save the engine played to a point (`pattern`, `board`, `incident`, `year-end`, `day:N`), which browser tests load instead of clicking through months |
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

Measured, not yet fixed. Ranked. Everything that used to sit here about the
risk bands, executive patience and the noise dial has been fixed and moved to
`docs/FINDINGS.md`.

- **Nobody has played this.** Four playtest reports sit in `docs/playtests/`
  and every one of them is an AI driving a browser, which each says of itself.
  They are good at contradictions, stale copy and screens that do not explain
  themselves, and they found plenty. They cannot say whether the year builds,
  whether the annual review lands as uncomfortable rather than arbitrary, or
  whether somebody who does not know the subject finishes feeling they learned
  something. No harness answers this and no amount of further simulation will.
  `docs/PLAYTEST.md` is how to ask a person.

- **The last quarter is still the lightest, but less so.** Four late-year
  decisions now follow up choices made earlier in the year — the Corvus
  renewal, the Kestrel quarantine, the audit follow-up and next year's
  priorities — each with its own replies. On one fixed policy over 30 CISO
  years, decisions read 12.6 / 4.8 / 3.2 / 4.8 a quarter (Q4 was 2.7), the
  inbox 48 / 42 / 28 / 32, and the longest stretch with nothing to decide 63
  days, max 75 (was 73, max 89). Whether the back half now *feels* like the
  year building is the playtest question in `docs/PLAYTEST.md`.

- **Third-party is still the weakest programme.** Steps now hold (see
  `docs/FINDINGS.md`), and over 150 seeds every building programme except
  detection and recovery now cuts second-half incidents: identity 0.56,
  segmentation 0.65, cloud 0.67, third-party 0.69, against 0.75 idle.
  Third-party's effect on the routes it targets is larger — 0.36 to 0.28
  second-half incidents through the supplier routes, 200 seeds — but attackers
  it turns away try elsewhere, so the total moves about one standard error.
  Detection no longer shows in totals (its effect was also near noise before)
  and recovery acts on consequence (worst 0.33 to 0.24), not on count. Whether
  a smaller, honest effect reads as worth £520k is the playtest question in
  `docs/PLAYTEST.md`.

- **Objectives missed does not read as difficulty, and should not be read
  that way.** The ladder's business row is confounded by how much the player
  builds: guided affords 2.7 programmes against high pressure's 1.3, and a
  programme costs delivery, so guided misses about as many objectives as high
  pressure does. Per programme started the ladder is monotone — 0.78 / 0.82 /
  1.67 across the modes — and `pnpm ladder sweep` prints both. Read the per
  programme figure, or compare modes at equal build.

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
