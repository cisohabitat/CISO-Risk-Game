# Owner-supplied 15-run matrix on 4653160 — 20 November 2026

Fifteen fresh-seed campaigns on `4653160` (3 difficulties × 4 situations,
Surprise me on CISO and High pressure, and a replay of run 7). Who played,
and whether by hand or by an agent, is not supplied. Notes and screenshots
are on the owner's computer (`/workspace/ciso-playtest-v6/`) and were not
available to the session that recorded this.

Confirmed fixed since `f364f2e`:
- no lapses in any run;
- "After the incident" follows a second incident;
- the comparison table works;
- no duplicated board responses;
- budget rises explained;
- the session log holds one campaign.

## What was checked and done (20 November)

Fixed:
- **Duplicate review lines (runs 5, 6): fixed for incidents.** Over 120
  harness years, the only repeated review line was the communication
  dimension's "The board heard about the … elsewhere" when two incidents
  were of one kind. Each line now carries the incident's date. Run 6 had no
  incident, so its duplicate is not explained by this. Without its
  screenshot it is open.
- **"Stop something" paused Ransomware silently (run 14): fixed.** A letter
  said so, but the decision receipt did not. The receipt now names any
  programme a choice paused or enquiry it pulled back
  (`tests/engine/stop-something.test.ts`).
- **The material-items warning was easy to miss (run 13): fixed.** The first
  submit scrolled a warning into the paper. A line beside the submit button
  now says how many material items are missing.
- **The "fifth less" cut had no visible effect (run 4): text fixed.** It is
  applied to next year's allocation (`BUDGET_AFTER` in `next-year.ts`). The
  options now say next year's allocation starts smaller and this year's
  budget is unchanged.
- **The quarter-close freeze lasted eight weeks (run 9): fixed.** It could be
  drawn on any day of a quarter. It now arises only in a quarter's last
  three weeks; the random draw is still made every day
  (`tests/engine/quarter-freeze.test.ts`).

Not reproduced:
- **Skip ahead ran past newly opened decisions.** Over 1,262 skips in 45
  harness years, no decision was opened during a skip without the skip
  stopping for it. Run 15's incident began on 19 November as an unconfirmed
  signal, and the skip stopped when it escalated on the 22nd.
- **Identity's start dated 18 January (run 7).** Starting Identity on day 11
  and Ransomware on day 18 gives the review timeline exactly those days.
- **0/6 attention against the Briefing (run 4).** Both read the same value.
- **The first click after submitting a paper did nothing (run 15).** The
  dialog unmounts on close with no exit animation. The likeliest cause is
  the material-items warning, now beside the button.

By design, or for the owner:
- **Seed replay diverges.** A seed reproduces a year for the same choices on
  the same days (checked 17 November). Since Skip runs to the next event,
  players act on different days more often, so replays part earlier.
- **Skip ahead past an open board paper; long jumps to 31 December.** Skip
  stops when a paper opens and again in its final week, as chosen on
  17 November.
- **"Commit to this" greyed out.** The footer already says the decision
  needs a reason, with a "Go to reasons" button.
- **Surprise me shows no budget.** It says the budget depends on the
  situation, which the budget would reveal.
- **Identity finished with "Legacy applications cannot federate" open (run
  15).** Completion closes open constraints, and the delivery letter says so.
- **Warehouse acceptance renews three times.** This is the 90-day renewal.
- **"Submit by 1 July".** The game's quarters are 91 days from 1 January, so
  Q2 ends on 1 July. The Briefing names the Q2 committee.
- **Rare incidents, cost-cutters at 5/5 on Guided and CISO, unspent budget,
  repeated accurate headlines, 107–146 unread at year end.** Balance and
  volume questions for a human playtest.
