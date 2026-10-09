# CISO: First Year — working notes

A single-player cyber risk strategy game. The player inherits Nexora Group as
its new CISO and plays one simulated year. Static client application: the whole
simulation runs in the browser and there is no server component.

## Working agreements

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
| `pnpm ladder transcript ciso [seed] [situation]` | Everything one year says, in full — messages, decisions, the close |
| `pnpm tsx scripts/efficacy.ts 150` | Does each programme reduce what it is meant to? |
| `pnpm guide:shots` | Regenerates the pictures in `docs/PLAYER_GUIDE.md` |
| `pnpm tsx scripts/prepare-campaign.ts <seed> <stop>` | A save the engine played to a point (`pattern`, `board`, `incident`, `year-end`, `day:N`), which browser tests load instead of clicking through months |
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
Further simulation is now more likely to make the game worse than better unless
a human playtest asks for it. `docs/PLAYTEST.md` covers what a session is for and
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

- **Almost nobody has played this.** Five playtest reports in
  `docs/playtests/` are an AI driving a browser. The owner has played one year
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

- **Third-party is still the weakest programme, by the owner's choice.** Over
  150 seeds second-half incidents read identity 0.51, detection 0.54,
  segmentation 0.60, cloud 0.65, third-party 0.65 against 0.73 idle; recovery
  acts on consequence (worst 0.33 to 0.23), not on count. Third-party's effect
  on its own routes is larger, but attackers it turns away try elsewhere. The
  owner chose to leave that as the lesson rather than strengthen it.

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

- **Objectives missed does not read as difficulty, and should not be read
  that way.** The ladder's business row is confounded by how much the player
  builds: guided affords 2.7 programmes against high pressure's 1.3, and a
  programme costs delivery, so guided misses about as many objectives as high
  pressure does. Per programme started the ladder is monotone — 0.78 / 0.82 /
  1.67 across the modes — and `pnpm ladder sweep` prints both. Read the per
  programme figure, or compare modes at equal build.

- **Incidents do not move the board.** Board confidence changes through the
  papers, a missed paper and authored decisions; an incident, however bad,
  does not touch it directly. The ladder reads board 0.79 in every mode while
  incidents run 0.60 / 0.80 / 1.13. That keeps the board judging what it is
  told rather than luck, which may be the lesson; whether it feels right after
  a first ransomware year is in `docs/PLAYTEST.md`.

- **The campaign content now loads on demand, not with the first screen.**
  The first screen waits on 184.1 kB against a 185 kB limit (it was 258.2
  against 260), and content no longer adds to it. The campaign chunk has its
  own budget, 90 kB with about 15 kB to spare, and is fetched while the start
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
