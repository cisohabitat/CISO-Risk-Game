# CISO: First Year

A single-player cyber risk strategy game. You inherit Nexora Group as its new
Chief Information Security Officer and get one simulated year: 6,283 critical
vulnerabilities, a risk register nobody trusts, four transformation programmes,
a managed service provider with more privileged access than anyone documented,
and a CEO who wants three answers in twenty-three minutes.

**▶ Play it: [ciso-risk-game.vercel.app](https://ciso-risk-game.vercel.app)**

No account, no sign-in, nothing to install. The whole simulation runs in your
browser and your campaign saves to the device you played it on. New to it?
[`docs/PLAYER_GUIDE.md`](docs/PLAYER_GUIDE.md) assumes you know nothing about
the game or the subject.

The design test applied to every feature is the one from the specification:

> **Am I managing cyber risk, or merely answering cybersecurity questions?**

There is no quiz, no compliance checklist, and no universal "cyber score". You
discover what matters, form and test hypotheses, prioritise scarce attention,
influence people you do not control, build capability over months, and live with
delayed consequences.

## Running it

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

Other commands:

| Command | What it does |
|---|---|
| `pnpm build` | Typecheck and produce the static `dist/` app |
| `pnpm preview` | Serve the production build locally |
| `pnpm test` | Engine, content and UI unit tests (Vitest) |
| `pnpm test:soak` | Seeded soak campaigns only |
| `pnpm validate:content` | Schema and referential validation of the campaign |
| `pnpm test:e2e` | Playwright across desktop, tablet, phone and 320px |
| `pnpm test:e2e:local` | The same without WebKit, for machines that cannot fetch it |
| `BASE_URL=… pnpm test:e2e:live` | Run the suite against a deployed URL |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript |
| `pnpm check` | Everything short of end-to-end, ending with a build and the size budget. It rewrites `dist/`, so do not run it while the browser suite is serving that directory |
| `pnpm build && pnpm size` | What a first-time player downloads, chunk by chunk, against the budget |
| `pnpm soak 1000` | 1,000 headless campaigns, checking for crashes and invariant failures |
| `pnpm coverage 60` | Which authored content a player actually reaches, and which mechanics ever fire |
| `pnpm screenshots` | Capture the screens for visual review |
| `pnpm tsx scripts/tune.ts 25` | Balance harness across policies and seeds |

## How it is put together

```
Responsive UI  (React screens, mobile / tablet / desktop presentations)
      |
Application layer  (Zustand store, IndexedDB persistence, selectors)
      |
Game orchestrator  (src/game/engine/orchestrator.ts — the only entry point)
      |
Pure TypeScript engine  (risk · threats · events · programmes · incidents · team)
      |
Game state  (one serialisable object) ─── IndexedDB save on device
```

Rules the code holds to, and tests enforce:

- **The engine is pure.** Nothing under `src/game/` imports React, the DOM,
  storage or any SDK. ESLint fails the build if it does.
- **No `Math.random()` in simulation.** Every draw comes from the seeded RNG in
  `src/game/engine/rng.ts`, with the cursor stored in game state, so a save
  reproduces its own future exactly.
- **One effect reducer.** Content and player actions describe change as data
  (`GameEffect`); `src/game/engine/effects.ts` is the only thing that applies it.
- **Hidden truth stays hidden.** The organisation graph the simulation reasons
  about is not the graph the player sees. Selectors only ever expose discovered
  state, and an invariant test fails if an undiscovered node reaches the UI.
- **Bands, not numbers.** Internal values are 0..1; the UI renders "Elevated",
  "Stretched", "Limited". Risk state never depends on colour alone.
- **The tick order is a contract.** `src/game/engine/tick.ts` runs a fixed
  seventeen-step day, covered by a test that fails if it is reordered.

The original build specification is committed verbatim at
[`docs/IMPLEMENTATION_PLAN.md`](docs/IMPLEMENTATION_PLAN.md) — it is what the
code comments mean when they cite "plan §13". Alongside it:
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md),
[`docs/CONTENT.md`](docs/CONTENT.md), [`docs/HOSTING.md`](docs/HOSTING.md).

## Campaign content

Everything about Nexora is data under `src/content/nexora/`, validated by Zod
schemas and a referential integrity pass:

| | |
|---|---:|
| Organisation nodes / dependencies | 38 / 52 |
| Business services / objectives | 5 / 5 |
| Executives / cyber leaders | 8 / 4 |
| Security controls | 13 |
| Cyber programmes | 6 |
| Threat actors / attack paths / incident families | 3 / 8 / 5 |
| Evidence items (including deliberate noise) | 48 |
| Hypothesis templates / risk scenarios | 14 / 14 |
| Lines of enquiry | 18 |
| Decisions / decision options | 26 / 80 |
| Events | 123 |

`pnpm validate:content` checks for missing ids, duplicate ids, impossible event
conditions, unreachable decisions, invalid effect targets and dependency cycles.

## How it behaves

1,000 automated campaigns across all three difficulties and all four starting
situations (`pnpm soak 1000`, under a minute):

```
  crashes            0
  invariant failures 0
  incidents per run  1.05
  years with none    34%
  years with 4+      1%
```

A year is neither a procession of disasters nor a year in which nothing happens,
and stronger controls measurably reduce both the number of incidents and what
they cost — without ever guaranteeing a clean year. Both properties are asserted
in `tests/engine/soak.test.ts`.

## Replayability

Every campaign has a visible seed. The seed fixes which awkward dependencies
exist in this Nexora (a managed service provider with standing domain admin, a
routable path from the legacy estate into production, a peering link nobody
remembers creating), how good the controls actually are behind the assurance
paperwork, what the executives are like, where the vacancies fall, and how the
threat environment behaves. Share a seed to compare two people playing the same
organisation.

A year also begins in one of four situations — the usual inherited mess, after
a breach, new money with short patience, or a tidy inheritance — or one drawn
from the seed. Each changes the budget and the threat, sends its own messages,
asks one decision the others never see, and is answered in the annual review.
The review ends with a way into another year, and the start screen keeps every
year played.

## Hosting

The production build is a static application: no server rendering, no API
routes, no cron, no database, no runtime secret. It deploys to Vercel Hobby (or
any static host) and the whole campaign runs in the browser with saves in
IndexedDB. See [`docs/HOSTING.md`](docs/HOSTING.md), including the release gate.

Live at **<https://ciso-risk-game.vercel.app>**. The release gate's last step
runs the end-to-end suite against that deployment rather than a local build,
because SPA rewrites, headers, caching and asset paths are only exercised by the
real thing:

```bash
BASE_URL=https://ciso-risk-game.vercel.app pnpm test:e2e:live
```

Vercel Hobby is for personal, non-commercial use. A commercial or organisational
deployment needs an appropriate paid plan.

WebKit coverage runs in CI (`pnpm exec playwright install webkit`). Sandboxes
that cannot download it should use `pnpm test:e2e:local`.

## Accessibility

Targets WCAG 2.2 AA: keyboard navigable throughout, semantic landmarks, visible
focus, 44px touch targets, 16px body input text, no hover-only information,
motion that respects `prefers-reduced-motion`, textual equivalents for the
dependency graph, and risk state that never depends on colour perception.

An automated axe-core audit runs as part of the end-to-end suite
(`tests/e2e/accessibility.spec.ts`): every screen, in both themes, at desktop and
320px, with zero WCAG 2 A/AA violations. It is not a substitute for manual
testing with a screen reader, which has not been done.

## Licence

The code and campaign content in this repository are provided for the purposes
of the project they were written for. Nexora Group, its people and its incidents
are fictional.
