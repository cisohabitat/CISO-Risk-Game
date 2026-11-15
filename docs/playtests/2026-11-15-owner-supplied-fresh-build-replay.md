# Owner-supplied 15-run replay on a fresh build — 15 November 2026

The same fifteen seeds and personas as the 15-run matrix
(`2026-11-15-owner-supplied-fifteen-run-matrix.md`), played on build `e2d4aaf`.
Who played, and whether by hand or by an agent, is not supplied. The report's
summary and per-run results are kept below, after what was done.

## What was done (15 November)

Fixed, each with a test that fails without it where one could be written:

- **Board papers recorded twice.** The engine accepted a paper for any quarter,
  including one already submitted, so a second submission (a double press, or
  the omission warning's own button) recorded it again: the committee's reply
  twice in the inbox and in the Board history, and its attention spent twice.
  This is also the practitioner's "board submission messages appear twice",
  which did not reproduce through a single submission. Only the pending
  quarter is accepted now (`tests/engine/paper-once.test.ts`).
- **Silent lapses while skipping.** A held Skip said so only in a toast and a
  header chip; read as a dead button, the player switched to a speed and seven
  decisions lapsed (run 4). The chip is now a button: "A decision is waiting"
  opens the decision, the board-paper chip opens the paper. Opening the
  decision automatically on a held Skip was tried and dropped: it blocked the
  Risk screen's hold, where a player is meant to keep investigating, and came
  back on every Skip after "Not yet".
- **Cost-cutters meeting every objective after incidents reached the
  business.** A material incident now diverts the whole organisation: when
  the damage is counted, every objective in delivery loses 60 days per unit
  of consequence above 0.3 (0.5 costs 12 days, 0.9 costs 36). With it,
  programme drag fell from 0.15 to 0.08, because at 0.15 two programmes at
  once still met fewer objectives than an idle year. On 25 CISO seeds,
  objectives met: idle (middle options) 3.3, two programmes at once 3.2,
  defensive 4.3, business-first 4.6. Idle years have the worse incidents
  (worst consequence 0.48 against 0.36), so they now pay for them in the
  business. The ladder is monotone both on objectives missed (0.87 / 1.07 /
  1.13) and per programme (0.32 / 0.55 / 0.89); 300-run soak clean.
- **Commit greyed out with no reason given.** The footer now says the
  decision needs at least one reason.
- **"Compare options" and "Your reasons" doing nothing visible.** They show
  only when the paper scrolls, which is where they help.
- **Picking a situation did not set the difficulty.** They are separate
  choices; the line above Begin now reads "You will begin: CISO · The
  inherited mess", both together.
- **"Prepare it" on the Briefing opened the Board screen, not the paper.** It
  opens the paper, as the deadline strip already did.

Left as designed, with the reason:

- **Guided pausing every week:** Guided's weekly hold is the point of the mode.
- **Board papers in Guided not stopping Skip at quarter end:** they do, once,
  and hold Skip in the paper's final week; run 3's Q1 paper was submitted on
  25 June, inside its window.
- **No live score:** bands, not numbers, and a year judged at its end.
- **Board papers needing risks raised first:** the board hears what the CISO
  has raised.
- **Acceptance renewal three times:** "Ninety days, then this question again".
- **Inbox volume (100–200 unread):** needs authored content cut or merged.

## Supplied report (summary)

### Key findings

**Fixed since the first pass**
- **Seed replay:** the same seed plus the same choices now reproduces the whole year. Run 15 replayed run 7 (`corvus-70788`) and matched it on decisions, incident dates (17 Mar customer data exposure, 1 Aug ransomware), budget checkpoints and final result (Credible, 2/5). In the first pass, incidents diverged.
- **Surprise me:** reproducible from the seed. `vellum-56518` picked A tidy inheritance and `quarry-25288` picked After the breach, both matching the first pass. The pick is shown on the Briefing on day 1.
- **Record this session:** now unticked by default. The export (530 events) contains only that campaign's seed and ID, with no leak from other campaigns.
- **Annual review:** renders straight after Close year, with no hard reload needed in any of the 15 runs.
- **Board papers:** Q1–Q3 now appear in their own quarters (the first pass had Q3 surfacing at week 48 in some runs).
- **Budget ledger:** it now explains mid-year rises, such as a duplicate tool cancelled and £90k returned.
- **Second-half pacing:** much smoother in most runs, with Skip ahead holding at decisions and board papers.
- **Stuck Decide button:** the first-pass control that sometimes did nothing was not reproduced.

**Still open**
- **Balance:** every cost-cutter met 5/5 objectives again (runs 3, 5, 10, 12), and so did the newbie in run 6, despite ransomware and payment diversion reaching the business. Low security spend is punished only in the verdict wording, never in objectives. Builders scored 1–4/5.
- **Silent lapses (new):** in run 4, Skip ahead jumped past 7 decisions in the second half, and they lapsed with no Decide prompt. Skip ahead also did nothing during an active incident. This wasn't reproduced in later runs that checked after every skip, but it's worth fixing.
- **Board papers in Guided:** in run 3, Skip ahead didn't stop for quarter-end papers, so the Q1 paper only appeared at week 26.
- **Commit greyed out:** on material decisions, Commit is disabled until you pick a reason, with no hint why. Other decisions say reasons are optional.
- **No-op buttons:** "Compare options" and "Your reasons" show no visible change (run 5).
- **Scenario picker:** picking a scenario card doesn't set difficulty, so a run can start at the wrong level by accident.
- **Repeated decision:** the risk-acceptance renewal comes back three times for cost-cutters.
- **Repeated committee responses:** the history shows each committee response twice.
- **Other known issues:** there's still no live score, and the inbox reaches 100–200 unread. Board papers need risks raised first, and recovery confidence is still not explained.
- **Guided pause:** time re-pauses every week in Guided.

### Results by run

| # | Difficulty / scenario / persona | Seed | First pass | This pass |
|---|---|---|---|---|
| 1 | Guided / inherited mess / newbie | quarry-54020 | Mixed, 5/5 | Mixed, 5/5 |
| 2 | Guided / after the breach / expert | lattice-88945 | Mixed, 0/5 | Mixed, 1/5 |
| 3 | Guided / new money / cost-cutter | nexora-6181 | Difficult, 5/5 | Difficult, 5/5 |
| 4 | Guided / tidy / newbie | corvus-70940 | Mixed, 1/5 | Credible, 4/5 (7 silent lapses) |
| 5 | CISO / inherited mess / cost-cutter | lattice-69634 | Difficult, 5/5 | Difficult, 5/5 |
| 6 | CISO / after the breach / newbie | lattice-78816 | Mixed, 2/5 | Difficult, 5/5 |
| 7 | CISO / new money / expert | corvus-70788 | Mixed, 2/5 | Credible, 2/5 |
| 8 | CISO / tidy / expert | corvus-1814 | Credible, 3/5 | Mixed, 3/5 (capped by team) |
| 9 | High / inherited mess / expert | kestrel-60771 | Mixed, 2/5 | Mixed, 2/5 |
| 10 | High / after the breach / cost-cutter | kestrel-61053 | Difficult, 5/5 | Difficult, 5/5 |
| 11 | High / new money / newbie | nexora-17051 | Difficult, 1/5 | Mixed, 3/5 |
| 12 | High / tidy / cost-cutter | orbit-74151 | Difficult, 5/5 | Difficult, 5/5 |
| 13 | CISO / Surprise me (tidy) / newbie | vellum-56518 | Mixed, 3/5 | Credible, 4/5 |
| 14 | High / Surprise me (after the breach) / expert | quarry-25288 | Mixed, 3/5 | Mixed, 4/5 (capped by team) |
| 15 | CISO / replay of run 7 / expert | corvus-70788 | Credible, 2/5 | Credible, 2/5 (identical to run 7) |

