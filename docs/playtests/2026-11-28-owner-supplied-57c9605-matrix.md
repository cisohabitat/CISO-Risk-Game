# Owner-supplied 15-run matrix on 57c9605 (pass 14) — 28 November 2026

Fifteen fresh-seed campaigns on `57c9605` (0.1.0-rc.6): 3 difficulties × 4
situations, Surprise me on CISO and High pressure, and a replay of run 07.
Who played is not supplied. Notes and screenshots are on the owner's computer
and were not available to this session.

Confirmed by the report:
- every incident had its reflection, 0–1 days after closing (22 of 22);
- the systems line is honest, and paid block fixes confirm;
- the warehouse is no longer blamed for attacks elsewhere;
- the post-incident money is scaled, netted and once a year;
- no Skip ahead ran past 21 days;
- concealment drew Communication weak, and all four cost-cutters were
  Difficult;
- the replay matched through week 52.

## What was checked and done (28 November)

Fixed:
- **MJ-32: an option recorded an assumption the player had already
  disproved, and it "failed" the next day.** The isolation rule fails only
  once the legacy route is discovered, so a next-day failure meant the
  player had found the route before choosing.
  - The option now says "What you have already found contradicts this", with
    the reason.
  - If chosen, the assumption is recorded as contradicted on the day, with no
    stop and no surprise ("You had already found this when you relied on
    it").
- **MJ-30: failed assumptions became required board items.** They are
  offered, not required.
- **MJ-31: the free overload relief did not relieve, and debriefs blamed
  it.**
  - It now adds 1.25 days a week to the stretched function for two months
    (Buy capacity adds 1.5), with morale for the team and its lead.
  - The hygiene drift it causes comes a week later as a stated
    consequence ("Patching and log review fall two months behind, and
    vulnerability exposure rises"), so it is not cited as what hurt.
  - A choice made twice is cited once (CS-28).
- **MJ-16: delays blamed on choices whose card did not mention them.**
  Every option that delays an objective now says so on its card
  ("Cost reduction programme waits 20 days").
- **MJ-10: "Tested, and it did not hold" over a Credible year.** A Credible
  or Exceptional year with weak resilience reads "Tested, and it cost
  something, but the year held together."
- **MJ-07: "you absorbed the misdirected payment rather than report it"
  beside a paper that reported it.** A decision about an incident a paper
  then reported is not counted as kept quiet.
- **MJ-08: three missed papers left Communication solid.** A paper missed
  at its deadline counts as empty.
- **MJ-15: "no targeted hunt could be commissioned at any warning" in a year
  with three hunts.** It now says no hunt was running while the intrusion
  was under way, and none could be added when its warnings came.
- **MN-54: a recovery test that came back thin counted as an exercise.** It
  is listed as "attempted, and inconclusive" and gives no credit.
- **MJ-06 / MN-09: "a material risk the board has not heard about" named a
  risk the player had raised under another title.** It now adds "(which you
  raised as …)".
- **MJ-04: urgent threat mail passed inside long runs.** It stops the clock.
- **MJ-09: the same reply three quarters running.** A second and third
  paper without a recommendation draw different replies, and the board asks
  once how an unfunded programme will be paid for, then says it is still
  waiting.
- **MN-01: debt paid down with no source named.** The ledger line names it.
- **MN-51: programme funding defaulted to everything left.** It keeps a
  fifth of what is left (never below the minimum), and says what the
  commitment leaves for the rest of the year.
- **CS-29:** recruiting costs £120k in the vacancy decision and on the Team
  screen alike (`HIRE_COST`).

Checked, not defects, or owner calls:
- **MJ-31, the rest.** Over 25 CISO years an expert-like player (two
  programmes, an enquiry a month, the free relief each time) now reads
  Credible 5 / Mixed 19 / Difficult 1, against 0 / 24 / 1. Team is still
  weak in 20 of 25 (was 25): engineering and identity end the year at
  nothing because morale recovers at 0.0012 a day only below half load, and
  recovery being slower than decline is the stated design
  (`nextFunctionMorale`). Whether to change that, or to let recruiting
  count, is the owner's call.
- **MJ-06, MJ-15 remainder:** risks found at year end are already named as
  such and do not enter a score. The "attack gave up" lines already say
  when the year end is the first the player hears of them.
- **MJ-21:** Guided may still have no incident (owner, 25 November).
- **MJ-33:** a missing briefing option in one run, not reproduced in the
  other eleven with incidents.
- **CS-01:** the Q1 paper is due on day 181, which is 1 July; quarters are
  91 days.
- **MN-53, MN-05, MN-06, MN-08, MN-52:** not reproduced here or not
  changed this round.

## Measured

- `pnpm ladder sweep 15`: unchanged (incidents 0.60 / 1.40 / 2.13,
  objectives missed 0.60 / 1.60 / 1.53).
- Soak: 300 years and 60 two-year campaigns, 0 crashes, 0 invariant
  failures. Coverage: 94% of events, 100% of decisions.

Tests: `tests/engine/pass14-fixes.test.ts`.
