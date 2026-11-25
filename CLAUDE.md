# CISO: First Year — working notes

A single-player cyber risk strategy game. The player inherits Nexora Group as
its new CISO and plays one simulated year. Static client application: the whole
simulation runs in the browser and there is no server component.

## Working agreements

- Follow [AGENTS.md](AGENTS.md). Keep `AGENTS.md` and `README.md` updated in
  every change set. Before deployment, require `pnpm check` and the full
  `pnpm test:e2e` suite to pass for the exact revision being deployed. If tests
  fail or cannot run, leave deployment pending.

- **Push straight to `main`.** Commit and push without asking. Keep the feature
  branch in sync when one is in play.
- Run `pnpm check` (typecheck, lint, content validation, unit tests, build and
  size budget) before pushing. `pnpm test:e2e:local` for anything touching
  the UI.
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
- The next-year builder is imported on demand by the store; harnesses import
  it directly from `src/game/engine/next-year.ts`. Do not re-export it from the
  orchestrator: that makes it a static dependency of the opening screen.
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
| `pnpm soak 1000` | Does it crash or break an invariant over many campaigns? (`--years 2` plays each on into a second year) |
| `pnpm coverage 60` | Which authored content does a player actually reach? (`--years 2` counts what only a later year says) |
| `pnpm tsx scripts/tune.ts 25` | Do different play styles produce different outcomes? |
| `pnpm screenshots` | What do the screens currently look like? |
| `pnpm playthrough` | One campaign played end to end, photographed as it goes |
| `pnpm play` | A year played by hand, a decision at a time — what does it *say*? |
| `pnpm tsx scripts/playtest-driver.ts <port> <w>x<h> <dist> <out>` | A browser an AI playtester plays turn by turn, through the interface only (`docs/PLAYTEST.md`, "AI playtests") |
| `pnpm ladder sweep 15` | Does one philosophy produce three different years? |
| `pnpm ladder bands 8` | What do the risk rows actually read, and how often? |
| `pnpm ladder transcript ciso [seed] [situation]` | Everything one year says, in full — messages, decisions, the close (`--years 2` prints the second) |
| `pnpm tsx scripts/efficacy.ts 150` | Does each programme reduce what it is meant to? |
| `pnpm guide:shots` | Regenerates the pictures in `docs/PLAYER_GUIDE.md` |
| `pnpm tsx scripts/prepare-campaign.ts <seed> <stop>` | A save the engine played to a point (`pattern`, `board`, `incident`, `exploit`, `year-end`, `day:N`), which browser tests load instead of clicking through months |
| `pnpm build && pnpm size` | What does a first-time player download? |
| `pnpm validate:content --pack <file>` | Does a pack (Nexora by default) resolve, read in the voice, and fill a year? `pnpm content:bundle` writes Nexora as a pack to start from |
| `pnpm strings` | How much English would a translation replace, and where does it live? (`docs/LOCALISATION.md`) |
| `pnpm session <file> [more…]` | What did a playtester actually do, and when? Reads logs recorded with `/?playtest` (`docs/playtest-kit/`); several at once give the medians across them |
| `pnpm cohort 30 ciso class` | Which seed gives a class which year? (`docs/educator/FACILITATOR.md`) |

None of them answer whether the game lands: that needs people, and
`docs/PLAYTEST.md` is how to ask them.

The end-to-end suite starts its own server from a fresh build every run and
refuses to reuse one already on the port. If it stops with "4173 is already
used", a previous run left a server behind: kill it rather than setting
`reuseExistingServer`, because a stale server can hide a real break as easily as
it can invent one.

`pnpm check` ends with a build, so it rewrites `dist/` — the directory the
end-to-end suite is serving. Do not run the two at once; finish one first.

## Where the project is

**The feature set is complete and the major systems are frozen.** The remaining
work is playtesting, tightening and rewriting unclear text — not new mechanics.
On 17 November 2026 the owner chose two design changes from the decision
paper on six playtest rounds. First, Skip ahead runs to the next thing that
needs the player and names it, with no seven-day cap, weekly hold or mail
stop. Second, three first-year objectives carry a security gate
(`gate` on an objective in `people.json`, checked in tick step 4): the
platform launch, the Kestrel integration and the Nordic market. Each is
checked once on its day. If the condition holds, delivery gains a little;
if not, it costs 45 days. The same day the owner had incident response
decisions open in waves (`responseStages` on an incident family): ransomware
opens command and isolation at once, outside help two days later with the
first findings, and the ransom four days in with what recovery can do.
On 19 November 2026 the owner made the board incident-aware
(`src/game/incidents/board.ts`). Briefing it is now a choice between candour
and reassurance. The owner also accepted a design list:
- the review names briefings and security checks;
- one "After the incident" reflection per incident, at most two a year;
- emergency spend is labelled unbudgeted and reported to the CFO;
- check previews vary by difficulty;
- the board is slow to warm for a quarter after a material incident;
- one Year Two check, on the service desk assistant.
On 25 November 2026 the owner asked for the design list from eleven AI
playtest rounds to be fixed (`docs/playtests/2026-11-25-design-list.md`):
- SOC warnings and incident closures stop Skip ahead, and recent warnings sit
  on the Briefing with a way to commission a hunt;
- a year meeting one of five objectives or fewer is Difficult;
- Resilience above developing needs a recovery test, a restore or a finished
  programme;
- the post-incident £400k is once a year and costs a little board confidence;
- CISO and High pressure years have an incident by mid-year
  (`incidentFloorDay` in the profile, spread over the two months before by
  the seed);
- a priced blocker can be worked around for nothing, losing the programme's
  last stage;
- each objective delay records its cause.

Board-reply and headline variety remain writing work.
On 22 November 2026 the owner chose that a blocker with a price holds its
programme at 90%, short of its last milestone, until it is paid for
(`PAID_BLOCKER_HOLD` in `src/game/programmes/progression.ts`). Blockers
without a price still close when the programme completes.
On 30 October 2026 the owner's next-step instruction continues the supplied
CISO report with residual-risk appetite delegation: a board decision, recorded
statement, acceptance guidance and paper follow-through. It does not add insurer
purchasing, business-service tolerances or an exception approval workflow.
On 21 October 2026 the owner authorised one AI-accelerated exploit scenario.
It extends the existing checkout decision through authored conditions/effects,
shortens its response window and adds an access-restriction option and replies;
global threat speed, difficulty and incident generation remain unchanged.
On 18 October 2026 the owner authorised annual-rating safeguards and programme
relevance assessment, without changing simulation effects, difficulty or weights.
Further simulation is now more likely to make the game worse than better unless
a human playtest asks for it. The owner lifted the freeze once, on 9 October
2026, for two things from `docs/ROADMAP.md` Phase 2: a second year that
remembers the first (`src/game/engine/next-year.ts`), and threat variety. `docs/PLAYTEST.md` covers what a session is for and
what not to change on one player's word.

**`docs/ROADMAP.md` is the plan from here to a AAA year**, in eight phases
with a gate on each. The engineering that needs no people has been done in
every phase (October 2026) and each phase records what is built and what is
not started; the scorecard there has a before and after column. What remains
needs people — playtesters, assistive-technology users, an illustrator, a
translator — and Phase 0's gate, human playtesting, is still the one that
opens the rest. Release material is in `docs/release/` and `CHANGELOG.md`;
cutting a release follows `docs/release/RELEASING.md`.

## Known weaknesses

Measured, not yet fixed. Ranked. Everything that used to sit here about the
risk bands, executive patience, the noise dial and the board's standing has
been fixed and moved to `docs/FINDINGS.md`.

- **Almost nobody has played this.** Fourteen playtest reports in
  `docs/playtests/` are an AI driving a browser; the four of the 9 October
  panel and their synthesis list what was fixed from them and what needs
  people or authored content. The owner has played one year
  and it felt right, but a designer cannot say whether the game teaches itself.
  Whether somebody who does not know the subject finishes feeling they learned
  something is still open; `docs/PLAYTEST.md` is how to ask a person.

- **The third quarter is now the lightest, and June the thinnest month.**
  Four late-year decisions now follow up choices made earlier in the year —
  the Corvus renewal, the Kestrel quarantine, the audit follow-up and next
  year's priorities — each with its own replies. On one fixed policy over 30 CISO
  years, decisions read 12.6 / 4.8 / 3.2 / 4.8 a quarter (Q4 was 2.7), the
  inbox 48 / 42 / 28 / 32, and the longest stretch with nothing to decide 63
  days, max 75 (was 73, max 89). By month, a player answering everything
  sees 4.0 / 4.3 / 3.2 / 3.1 / 1.6 / **0.3** / 1.4 / 1.1 / 0.9 / 3.3 / 0.9 /
  0.2 decisions: the year's longest quiet stretch starts on day 150, between
  the budget request and the Kestrel join on day 200, in 9 of 30 years, and
  otherwise after the October cluster. The spine choices already have their
  follow-ups, so a June decision would be filler; left for a playtest to ask
  for. Whether the back half *feels* like the year building is the playtest
  question in `docs/PLAYTEST.md`.

- **Attackers turned away try elsewhere, and now there is more elsewhere.**
  This was third-party's weakness, kept as the lesson by the owner's choice.
  Since the threat variety it is every programme's, measured over 150 CISO
  seeds as second-half incidents against 0.77 idle:

  | Programme | Second-half incidents |
  |---|---|
  | Identity | 0.60 |
  | Detection | 0.68 |
  | Third-party | 0.71 |
  | Cloud | 0.74 |
  | Recovery | 0.85 |
  | Segmentation | 0.86 |

  On their own routes, each still cuts what it targets:
  - segmentation halves destructive attacks (0.11 to 0.05) and legacy
    outages;
  - detection cuts the backup route from 0.08 to 0.02;
  - cloud cuts platform tampering;
  - recovery acts on consequence (worst 0.35 to 0.28), not on count.

  Detection did most to lower the count before the variety (−30% of all
  incidents). Now it does −10%: disrupting a campaign sends the actor to one
  of fourteen routes rather than eight.

- **The threat variety made the intended mode busier.** Over 30 seeds the
  ladder's incidents went from 0.50 / 0.60 / 1.23 to 0.47 / 0.93 / 1.43
  (guided, CISO, high pressure). Guided and CISO now separate where they
  barely did. The risk rows read low more often, 15% of weekly rows against
  7%, and the board pack calls 17% of open risks material, against 27%. The
  three new scenarios start mostly below the others. Whether a CISO year
  with nearly one incident is the right weight is a playtest question.

- **Starting situations are new and light.** Four exist (the usual opening,
  after the breach, new money, a tidy inheritance). Over 100 CISO seeds each,
  a player building what the budget allows sees 0.83 / 0.90 / 0.69 / 0.68
  incidents and starts 2.0 / 2.3 / 2.6 / 1.7 programmes; ransomware is
  commonest after the breach (0.22 against 0.15–0.18). For a player who
  writes every board paper, board confidence ends 0.62–0.66 in all four,
  because the papers outweigh the start, so the difference lives in the
  budget, the threat, two messages and a decision of its own each (an
  extortion demand, a flagship purchase, a predecessor's figure that counted
  less than it seemed), the review's answer to the situation's question and a
  closing line on how its decision was answered. Whether that is enough to
  make a second year feel different is a playtest question.

- **A second year runs busier than a first.** A first year opens on a quiet
  spell: attacker interest starts at 0.20 and settles over the year towards
  how exposed Nexora looks, about 0.4–0.6 by December. A second year starts
  where the first left it. On the ladder's builder over 15 seeds, CISO
  incidents read 0.73 in the first year and 1.07 in the second, high pressure
  1.20 and 1.47; guided falls, 0.40 to 0.27. What the first year built still
  shows: over 30 CISO seeds, a second year after a strong first has 1.10
  incidents against 1.83 after an idle one. Whether the quiet opening of a
  first year should repeat is left for a playtest to ask.

- **Objectives missed does not read as difficulty, and should not be read
  that way.** The ladder's business row is confounded by how much the player
  builds: guided affords 2.7 programmes against high pressure's 1.3, and a
  programme costs delivery, so guided misses about as many objectives as high
  pressure does. Per programme started the ladder is monotone — 0.34 / 0.59 /
  0.89 across the modes from 16 November (0.78 / 0.82 / 1.67 before), and
  0.34 / 0.48 / 0.74 since the gates of 17 November — and
  `pnpm ladder sweep` prints both. Read the per programme figure, or compare
  modes at equal build. On 15 November the owner had each programme's drag on
  delivery cut from 0.25 to 0.08 of its friction (`PROGRAMME_DRAG` in
  `src/game/business/objectives.ts`): two programmes used the whole schedule
  margin, so builders met 0–3 of 5 objectives while cost-cutters met five.
  The same day a delay that arrived before there was progress to take it from
  became days owed (`delayOwedDays`): opposing the launch on day 22 had cost
  nothing. A material incident now diverts the whole organisation: every
  objective in delivery loses 60 days per unit of consequence above 0.3
  (`DIVERSION_DAYS` in `src/game/incidents/engine.ts`), scaled since 16
  November by how ready recovery was. Since 17 November three objectives
  carry security gates. Since 23 November an objective waits at 99% for its
  check (`GATE_HOLD`): idle delivery had finished all three before their
  dates, so the players the gates were for never met them. On 25 CISO seeds
  (`scripts/tune.ts`), objectives met now read:
  - business-first 3.0 (was 4.0), all five met in no year (was 36%);
  - defensive 3.3 (was 4.3). The harness connects Kestrel on schedule when
    it cannot afford the £120k quarantine, and fails that check;
  - middle-option idle 3.3 (unchanged);
  - two programmes at once 2.4 (was 3.3).

  A player who takes the launch conditions and the Kestrel quarantine meets
  all five in 18 / 13 / 9 of 25 years (guided, CISO, high pressure), about
  what an ungated year managed. Since the mid-year incident floor of
  25 November the ladder's objectives missed read 0.93 / 1.87 / 1.93 (were
  0.93 / 1.47 / 1.27), and missed per programme 0.40 / 1.04 / 1.81 (were
  0.40 / 0.81 / 1.19). A competent CISO player (launch conditions, Kestrel
  quarantine, identity programme, a recovery test, every paper briefed) met
  3.1 objectives and was never Difficult; with the floor and the objective
  cap they meet 2.6, and 6 of 25 years are Difficult. Each of those met 0 or
  1 objective after a severe incident, and 2 had their incident from the
  floor. Whether that weight is right is a playtest question.

- **The board hears about incidents, but recovers by year end.** Since
  19 November (`src/game/incidents/board.ts`):
  - an incident the board is not briefed on within three days costs 0.06
    when it hears elsewhere;
  - a material one (consequence 0.3 or more) costs 0.06–0.20 when it
    closes, at 0.6 times that if an earlier paper raised a risk on its
    route;
  - a briefing in time earns back 0.02.

  For a player who writes every paper and briefs, over 30 seeds a mode,
  the year-end board reads 0.475 / 0.481 / 0.464 after a material incident
  against 0.519 / 0.560 / 0.541 without (guided, CISO, high pressure).
  The ladder still reads 0.78 in every mode, and this is the game working
  rather than a dial failing. The ladder handles incidents well: it briefs
  candidly, answers the response and covers the incident in its next paper.
  Its CISO years with a material incident end at a mean of 0.795, against
  0.768 without. A well-handled incident builds standing; a badly handled
  one costs it. Since 19 November the board warms at a quarter of the usual
  pace for 91 days after a material incident closes. Whether a ransomware
  year now feels heard is a playtest question.

- **The campaign content now loads on demand, not with the first screen.**
  The code/CSS/font critical path is 209.7 kB against a 221 kB limit (`pnpm size`, 14 November; it was 192.7 kB on 25 October, and the Briefing panels added since are most of the rise) including
  the self-hosted display font (the first portrait pass was 184.1 kB against
  185 for JS/CSS; the annual review loads with the review screen), and
  content no longer adds to it. The approved title screen additionally fetches
  one decorative scene: 119.2 KiB desktop or 75.7 KiB phone, with complete
  rendering budgets of 350/320 KiB enforced by `pnpm size`. Including the
  background campaign prefetch, visit budgets are 450/410 KiB.
  The campaign chunk has its own budget, 92 kB. It reached 91.2 kB; on
  28 October Year Two's events and decisions became a download of their own
  (8.3 kB, fetched when a second year begins), and the campaign was 84.6 kB; on
  14 November it is 86.9 kB.
  It is fetched while the start
  screen is up. The start screen appears about a fifth sooner (Slow 3G 9.4 s
  to 7.7 s). The cost is one round trip for somebody who presses Begin
  within a few seconds on a very slow link: 2.8 s of waiting a second after
  the screen appears on Slow 3G, none after five; on Fast 3G none after one.
  The button says it is opening while it waits. Measured in `docs/FINDINGS.md`.

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
re-photographed rather than left to go quietly stale. The build publishes it at
`/guide` (`scripts/guide/`), linked quietly from the start screen and beside
the glossary, and `tests/content/guide.test.ts` fails if it quotes interface
text the game no longer uses. Ask a playtester to leave it until after their
session — whether the game teaches itself is one of the things under test.

Then `docs/ARCHITECTURE.md` (how it is built), `docs/CONTENT.md` (authoring),
`docs/VOICE.md` (how the game speaks; `tests/content/voice.test.ts` enforces
its mechanical rules on every authored string),
`docs/HOSTING.md` (the release gate), `docs/PLAYTEST.md` (the question the
harnesses cannot answer), `docs/FINDINGS.md` (everything found so far, and
how each was closed) and `docs/ROADMAP.md` (the phased plan to AAA, and the
scorecard of where each pillar stands).
