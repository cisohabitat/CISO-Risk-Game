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

1. **Assumptions can be recorded when already false.** Four of ten are false on
   day 1, so they invalidate on the next tick and the mechanic reads as noise
   rather than "the world changed". Fires ~10× per run. The player should not
   simply be told which are false — their belief differs from the truth, and
   discovering that is the point — so this is about timing and framing.
2. **Team capacity is close to inert.** Commissioning everything legal every day
   for a year peaks at 0.81 strain (never "overloaded") and morale *rises*,
   because recovery outpaces decline. `dec-team-overload` and
   `evt-org-morale-low` are unreachable as a result.
3. **Control drift is uniform and severe.** Every control loses 0.11–0.25
   coverage over an idle year; IR readiness falls to 0.05. Worth retuning per
   control rather than a flat rate.
4. **The annual review headline ignores the dimensions.** Three very different
   strategies produced the same closing line, though the dimensions underneath
   differed correctly.

## Further reading

**`docs/IMPLEMENTATION_PLAN.md` is the original build specification**, committed
verbatim. It is the source of truth for what this game is meant to be: the
product principles, the core loop, the content budget, the difficulty design,
the release gate and the definition of done. Section numbers referenced in code
comments (plan §13, plan §39, and so on) point into it. Read it before changing
a system, and update it if the architecture genuinely moves.

Then `docs/ARCHITECTURE.md` (how it is built), `docs/CONTENT.md` (authoring) and
`docs/HOSTING.md` (the release gate).
