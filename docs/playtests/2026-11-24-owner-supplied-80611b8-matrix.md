# Owner-supplied 15-run matrix on 80611b8 (pass 9) — 24 November 2026

Fifteen fresh-seed campaigns on `80611b8` (`v0.1.0-rc.2`): 3 difficulties ×
4 situations, Surprise me on CISO and High pressure, and a replay of run 07.
Who played is not supplied. Notes and screenshots are on the owner's computer
(`/workspace/ciso-playtest-v9/`) and were not available to this session.

Confirmed:
- No lapses, and no reloads before the review.
- The seed replay matched run 07 through week 52. The session log holds one
  campaign event.
- The 31 May option says it charges this year, and does.
- The sidebar shows unbudgeted spend.
- The board's reply names every chosen topic.
- Skip ahead holds for a waiting decision.

## What was checked and done (23 November)

Fixed:
- **MJ-03: a security check that never ran (5 runs, mostly cost-cutters).**
  Reproduced on `nexora-96288` (Guided, New money), played idle. Delivery
  with no programme drag finished:
  - the platform launch on day 127, before its check on day 130;
  - the Kestrel join on day 206, before its check on day 230;
  - the Nordic launch on day 230, before its check on day 235.

  A check runs only for an objective still in delivery, so none of the
  three ran. The players the gates were written for skipped them. An
  objective with a check still to come now delivers to 99% and waits for it
  (`GATE_HOLD` in `src/game/business/objectives.ts`).
- **MJ-13: one incident opened twice (run 12).** Two campaigns can reach the
  same kind of harm days apart. Over 80 years, choosing the last option each
  time, a second incident of the same kind opened while the first was running
  3 times. A breach of a kind already being handled now joins that response,
  and the count is 0 in 80 years.
- **MJ-14: overlapping incidents (run 09).** The command panel showed only
  the first open incident. The second had no board briefing buttons until the
  board had heard elsewhere. Each open incident now has its own panel
  (`incidentCommands`).
- **MJ-06: a risk raised, put in the Q2 paper and briefed, then reviewed as
  "nothing you did went near it" (run 11).** A risk in a submitted paper, or
  escalated to the board, now counts as gone near.
- **MJ-07: concealment always read "solid" (6 of 6 runs).** Each thing kept
  quiet, and each incident the board heard of elsewhere or was told was in
  hand when it was not, is a lapse:
  - one lapse caps communication at solid;
  - two cap it at developing;
  - three or more cap it at weak.
- **MJ-11: refunds did not reduce unbudgeted spend (runs 11 and 14).** Money
  that comes back pays the unbudgeted spend first, with a ledger line saying
  so. The review's prioritisation evidence already names an unpaid amount.
- **MJ-15, in part.**
  - The review said a briefing came "before it heard elsewhere" after a mail
    said the board heard through the auditors (run 05). It now says whether
    the briefing was inside the time the board expected.
  - "You checked 1 for yourself" sat beside "0 of 29 you examined" (run 13).
    It now reads "1 was independently checked during the year".
- **MJ-18: greyed enquiries with no route out (runs 07, 09 and 14).** The note
  names the team and the programme using it, and says pausing a programme
  frees it.
- **MN-01 and CS-05: rounding hid budget changes.** "£3.4m available (was
  £3.4m)" after a £60k refund. Money at £1m or more now shows two places when
  tenths would hide the amount (£3.46m, £2.38m).
- **CS-04:** the ledger's ".:" is gone.
- **CS-07:** "1 vacancies remain" and "raised 1 days before impact" are
  fixed.
- **MN-07: "Review incident recap" landed on the top of Your year (7 runs).**
  The year screen loads on demand, and one try at scrolling ran before the
  recap existed. It now tries for about a second.

Checked, not defects:
- **MJ-15, run 10: "They published a sample on 11 March".** This happened.
  `evt-con-extortion-published` fires after "refuse and say nothing". It is
  an urgent message from the General Counsel on the day, and costs board
  confidence and her trust. The tester missed it in the inbox. That is
  MJ-04's problem, not the review's.
- **MN-06: "23 open entries".** This is the predecessor's register as handed
  over, not the player's.
- **CS-12: "Your first year review" on 17 December.** It is the chief
  executive's notice that the year is nearly up.
- **MJ-19: "Stop something" pulled back the newest enquiry.** The option
  says it will.

The owner's earlier choices, unchanged:
- **MJ-01:** at most two "After the incident" reflections a year (19 November).
  With MJ-13 fixed, a duplicate no longer uses one.
- **MJ-02:** Skip ahead has no jump cap and no mail stops (17 November).

Owner calls, not changed:
- **MJ-04:** SOC warnings as Briefing stops or cards.
- **MJ-08:** a consequence for unspent budget. MJ-03 makes an idle year
  fail the checks it used to skip.
- **MJ-09:** board replies that vary with paper content, and a challenge to
  empty papers.
- **MJ-10:** a headline tied to the verdict.
- **MJ-12:** the £400k funding.
- **MJ-16:** the cause shown on each delay.
- **MJ-17:** the Nordic check can come before the card-data decision. That
  decision follows a merchant's question, which needs the card-data evidence.
  The check's preview names the question in advance, and DLP coverage also
  answers it.
- Minor items MN-02 to MN-05, MN-08 to MN-30 except those above, and CS-01,
  CS-02, CS-03, CS-06, CS-08 to CS-11.

## Measured

Gates now run for everyone, so the tuning harness moves (`pnpm tsx
scripts/tune.ts 25`, CISO; before → after):

| Policy | Gates met | Objectives | All five met |
|---|---|---|---|
| Passive | 51/54 → 70/75 | 3.3 → 3.3 | — |
| Defensive | 44/46 → 48/75 | 4.3 → 3.3 | 60% → 0% |
| Business-first | 18/38 → 24/75 | 4.0 → 3.0 | 36% → 0% |
| Balanced | 41/43 → 48/75 | 3.3 → 2.4 | — |

The harness falls back to "Connect on schedule" when a programme builder
cannot afford the £120k quarantine, and that fails the Kestrel check:
- defensive, balanced and relevant failed it 25 of 25 times;
- business-first takes the first option and fails both the launch and
  Kestrel checks.

A player who takes the launch conditions and the Kestrel quarantine, with
reasons, meets all five in 18/25 (Guided), 13/25 (CISO) and 9/25 (High
pressure) years. That is about where an ungated year was: 15, 12 and 6.

`pnpm ladder sweep 15`: objectives missed 0.93 / 1.47 / 1.20, per programme
0.40 / 0.81 / 1.13 (was 0.37 / 0.41 / 1.06). Incidents 0.73 / 0.87 / 1.20.

Other harnesses:
- **Soak:** 300 years and 100 two-year campaigns, with no crashes and no
  invariant failures.
- **Coverage:** `--years 2` reaches 95% of events and 100% of decisions.
- **Facilitator table:** `pnpm cohort 30 ciso class` changed, so
  `docs/educator/FACILITATOR.md` and `tests/engine/cohort.test.ts` were
  re-picked.

Tests: `tests/engine/pass9-fixes.test.ts`.
