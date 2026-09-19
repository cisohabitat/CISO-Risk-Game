# Architecture

## The layers, and why they are separated

```
              RESPONSIVE UI
    Mobile        Tablet        Desktop
        \           |            /
          APPLICATION LAYER            src/store, src/screens, src/components
                  |
          GAME ORCHESTRATOR            src/game/engine/orchestrator.ts
                  |
        PURE TYPESCRIPT ENGINE         src/game/**
        /      |        |      \
     Risk   Threat   Events   Programmes
                  |
              GAME STATE               one serialisable object
                  |
             IndexedDB save            src/store/persistence.ts
```

The engine is a pure function library over a serialisable state object. It never
imports React, browser globals, storage or a cloud SDK, and ESLint enforces this
(`eslint.config.js`, the `src/game/**` override). The store is an adapter: it
owns UI state, drives the clock and writes saves, but every change to canonical
state goes through `applyAction`.

## Determinism

`src/game/engine/rng.ts` is the only source of randomness. A draw is a pure
function of `(campaign seed, cursor)`; the cursor lives in `GameState.rngCursor`,
so a saved game reproduces its own future exactly. World generation uses derived
streams (`deriveRng(seed, 'world')`) so that adding a draw in one subsystem
cannot reshuffle another.

`Math.random()` is banned in simulation code by an ESLint rule and by a test that
scans every file under `src/game/`.

## The daily tick

One tick is one in-game day. `TICK_ORDER` in `src/game/engine/tick.ts` documents
the seventeen steps and a test fails if they are reordered, because subsystems
read each other's output within a day:

1. advance the date
2. refresh weekly resources and quarter boundaries
3. apply delayed effects that fall due
4. progress business objectives
5. progress cyber programmes
6. return delegated work
7. update team workload and morale
8. drift stakeholder relationships
9. evaluate assumption validity
10. move threat pressure
11. progress attack paths
12. progress incidents
13. evaluate conditional events
14. write inbox traffic
15. recompute derived risk
16. evaluate auto-pause triggers
17. record autosave checkpoints

The simulation only runs when a tick is requested. There is no animation loop.

## The effect system

Content and player actions never mutate state directly. They describe change as
a `GameEffect` — a constrained union in `src/game/types/effects.ts` — and
`applyEffects` is the single reducer. This keeps authored content safe, makes
every change auditable in tests, and stops ad hoc mutation creeping in.

Adding a new kind of change means adding a variant to the union, a case to the
reducer and a case to the Zod schema. The content validator then rejects any
authored effect whose target does not exist.

## Hidden truth versus player knowledge

`OrganisationState.nodes[id].exists` is the truth for this campaign; `discovered`
and `discoveryConfidence` are the player's understanding. Selectors
(`src/store/selectors.ts`) only ever emit discovered state, and an invariant
(`undiscoverable-node-shown`) fails if the two are ever confused.

The same split applies to controls: `ControlRuntime` holds the real coverage and
configuration, `believed` holds the player's assurance picture and the day it was
taken. Inherited beliefs start optimistic, so "we have MFA" is a statement about
procurement until somebody goes and tests it.

## Risk

There is no single risk formula. `src/game/risk/calculations.ts` composes small,
independently testable functions:

- `assessPathSteps` / `calculatePathViability` — per-step opportunity against the
  controls that actually cover that step
- `calculateThreatPressure` — actor interest, activity and sector pressure
- `calculateConsequence` / `calculateDependencyAmplifier` — business impact and
  concentration
- `calculateRecoveryModifier` — how much recovery capability blunts consequence
- `calculateUncertainty` — how much of the assessment rests on things the player
  has verified

Outputs are 0..1 internally and become bands at the presentation boundary
(`src/game/risk/bands.ts`). The UI never renders a raw simulation number.

## Threats and incidents

Three actors evaluate a small set of precomputed candidate attack paths rather
than searching the graph. Each day an active campaign attempts its current step;
controls change the odds, monitoring decides whether anyone notices, and a
capable SOC that sees activity can push the actor back out. Reaching the end of a
path creates an incident, whose severity is computed from the controls that were
in place at the time — not from a script.

Incidents run through phases (signal → escalation → containment → consequence →
recovery → debrief). The CISO makes executive decisions only. The reconstruction
is assembled from real world state and links to the decisions that preceded it,
without labelling any of them correct or incorrect.

## Difficulty

`DIFFICULTY_PROFILES` in `src/game/engine/setup.ts` is the entire description of
a mode (plan §44). Ten dials: what the player starts knowing, what they can
spend, who they have, how much attention they get, how fast work comes back, and
how hostile the world is. Nothing outside that file may compare
`state.difficulty` against a mode name — a test fails the build on it — because
a second copy of the numbers elsewhere is how this game once escalated threat
three times over while its profile claimed one multiplier.

The dials split in two, and the split is the design rule. The world dials
(`threatMultiplier` at setup, `threatTempo` daily, `sectorPressurePull`,
`noiseMultiplier`, `startingDiscovery`, `executiveTolerance`) get harsher as the
mode does. The player's dials (`budgetMultiplier`, `capacityMultiplier`,
`focusPerWeek`, `investigationSpeed`) stay close to normal, because they are the
channels through which skill pays: cutting them alongside a harsher world makes
a mode flatter rather than harder, which is measurably what happened before.

## Adding to the game

1. Read the plan section that covers the area.
2. Decide whether it is content or mechanics. Prefer content.
3. For mechanics: add the types, the pure function, the tests, then the effect
   variant, then the UI.
4. For content: add to `src/content/nexora/`, run `pnpm validate:content`.
5. Keep the engine free of UI concerns and the UI free of scenario logic.
