# Owner-supplied 15-run matrix on baf4cf9 (pass 10) — 25 November 2026

Fifteen fresh-seed campaigns on `baf4cf9`: 3 difficulties × 4 situations,
Surprise me on CISO and High pressure, and a replay of run 07. Who played is
not supplied. Notes and screenshots are on the owner's computer
(`/workspace/ciso-playtest-v10/`) and were not available to this session.

Confirmed:
- No lapses, impossible dates or self-resuming clock.
- The replay matched through week 52, and the session log holds one game.
- Every business security check ran and reported in 14 of 14 runs (MJ-03).
- Concealment is scored: weak in runs 10 and 12, developing in 03 and 05
  (MJ-07).
- Greyed enquiries name what holds the team (MJ-18).
- Refunds and the £400k pay down unbudgeted spend (MJ-11).
- Cost-cutters are now the worst persona on objectives (3.0), against the
  best on 80611b8.

## What was checked and done (24 November)

Fixed:
- **MJ-06: risks in board papers still reviewed as "nothing you did went near
  it" (runs 13 and 14).** Papers store topics as `risk:<id>`. The 23 November
  credit compared bare ids, so it never matched, and its test used the wrong
  form too. Raising a risk was already credited: a probe that raised the
  non-production risk on `meridian-34379` removed it from the review's miss.
  Handling an incident on a risk's own route (responding or briefing) now
  counts too. In run 14 the logistics compromise was the year's first
  incident.
- **MJ-20: the board paper let a raised risk be left out as optional, then
  opened "A material risk the board has not heard about" (run 13).** That
  decision counted every unreported risk. It now counts only what the paper
  treats as required: residual or consequence high, or accepted
  (`materialScenario`, shared by both).
- **MJ-19: "Stop something" unnamed, and the wrong team cheered (6 of 6
  runs).** The option now says what it will stop ("Stops Identity and
  privileged access uplift, paused"). "Most pressed" was resolved for each
  effect, so once the stop relieved one team, the morale lift went to
  whichever team was most pressed after it. It is now fixed once per batch.
- **MJ-11: debt rose in the ledger between paydowns with no line saying why
  (run 11).** Each emergency commitment beyond the allocation is now a ledger
  line. The close's narrative says what is owed and that next year's plan
  starts by paying it back.
- **MJ-15, in part.**
  - "N attacks gave up at a control that held" now says when none was seen
    at the time. This is the hidden record revealed at the year end, not
    something the player was shown.
  - The garbled "Recorded cost of … : Followed up: …" line now reads
    '"Fix it quietly" on "Card data…" came back later: on 13 December, …',
    in date order (MN-19). The follow-up mail it cites is real: it is
    delivered when the delayed consequence lands.
- **MJ-08, text:** "None of it was friction you imposed" no longer appears
  beside delay from held checks. Where checks held, it says the delay came
  from security work that was not done.
- **MN-27:** "Security support is recorded" was set by any decision that moved
  delivery on, including connecting Kestrel on schedule. It now reads "A
  decision of yours moved this objective on."
- **CS-15:** an objective shows 100% only once achieved. One waiting at 99% for
  its check says "Delivery is ready and waits for it".
- **CS-14:** the review says "missed", as the card does, not "failed".
- **CS-16:** an empty paper with topics available says to choose from the
  agenda, not to raise risks first.
- **MN-32:** "Lead with the risks you raised" needs an open risk in the
  register.
- **MN-31:** the Guided description and "How a week works" still promised
  weekly holds, and Skip ahead "up to seven days". Both ended on 17 November.
  The text now says what Skip ahead does.

Checked, not defects:
- **"They published a sample on 11 March" (run 10).** An urgent message from
  the General Counsel delivers it, as on 80611b8.
- **Programme execution solid with 0 of 4 finished (run 11).** The dimension
  credits delivered progress (90 / 90 / 67 / 10%) and says so.
- **MN-35, "Review business dates" does nothing (run 02).** It scrolls to the
  tracker directly below it and focuses it, so on a tall screen nothing
  visibly moves. Not changed.

The owner's earlier choices, unchanged:
- **MJ-01:** at most two "After the incident" reflections a year.
- **MJ-02:** Skip ahead has no jump cap and no mail stops.

Owner calls, not changed:
- **MJ-04:** SOC warnings as stops.
- **MJ-09:** board replies by paper content.
- **MJ-10:** headline variety.
- **MJ-12:** the £400k.
- **MJ-16:** the cause on each delay, and progress moving backwards.
- **MJ-17:** card-data decision timing (1 run).
- **MJ-21:** difficulty and incident floor.
- **MJ-08, scoring:** Resilience strong on zero spend, and an unspent-budget
  line.
- The remaining minor and cosmetic items.

Tests: `tests/engine/pass10-fixes.test.ts`.
