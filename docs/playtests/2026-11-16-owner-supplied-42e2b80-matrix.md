# Owner-supplied 15-run matrix on 42e2b80 — 16 November 2026

A new matrix of fifteen campaigns with fresh seeds, played on `42e2b80`,
compared with the replay on `e2d4aaf`. Who played, and whether by hand or by
an agent, is not supplied. The report's summary is kept below, after what was
done.

## What was done (16 November)

- **Passive years meeting every objective after ransomware, and prepared ones
  punished to 1/5.** The organisation-wide diversion an incident causes is
  now scaled by how ready recovery was (1.5 minus recovery strength): an
  unrehearsed organisation loses about a fifth more days, a rehearsed one
  about a fifth fewer. On 25 CISO seeds, objectives met: idle 3.1 (was 3.3),
  two programmes at once 3.2, defensive 4.3, business-first 4.6. Ladder
  monotone (objectives missed 0.93 / 1.13 / 1.13, per programme 0.34 / 0.59 /
  0.89); 300-run soak clean. A passive year with no serious incident can still
  meet all five: the review is where that year is judged.
- **One headline for five different years.** The blind-spots line was tested
  before anything about incidents or quiet years. The year's story now comes
  first: a year closing mid-incident, an incident that held or did not, a
  quiet year that built capability; blind spots after, with their own quiet
  wording (`tests/engine/review-headlines.test.ts`).
- **Duplicated "Recorded cost".** A decision taken in two incidents claimed the
  same follow-ups twice; each follow-up now counts once (same test file,
  failing without the fix).
- **Skip past a newly opened paper outside Guided.** Skip holds once for a
  pending paper it has not stopped for, then runs; the final-week hold stays.
- **No starting budget before Begin.** The line above Begin adds the opening
  budget, from the mode's profile and the situation, once the campaign has
  arrived in the background.
- **"Compare options" only scrolled.** It now lays the options side by side in
  a table, cost and known effects; "Your reasons" stays for long papers.
- **Committee responses duplicated in history.** Not reproduced through a
  submission, a reload or a resume, on any screen. The engine has refused a
  second paper since `42e2b80`; the Board history now lists one row per
  quarter as the annual review counts them. Open until a screenshot shows
  the path.

Left as designed: the situation card does not set difficulty (separate
choices, both named above Begin with the budget); the acceptance renewal every
ninety days; the weekly hold at speed; no live score; risks raised before the
board hears them; inbox volume. Single-run reports not reproduced: Skip
advancing a day at a time during one incident's phase changes (each phase
change is news), "Review programme funding" showing no editor (run 14), and a
late budget rise not checked in the ledger (run 9).

## Supplied report (summary)

### 1. Summary

**Fixed or improved since `e2d4aaf`**
- **Silent lapses:** 0 decisions lapsed without a prompt across all 15 runs (423 decisions taken in total). On `e2d4aaf`, run 4 had 7 silent Skip-ahead lapses.
- **Guided board papers:** Skip ahead stopped for the Q1, Q2 and Q3 papers in all four Guided runs. On `e2d4aaf`, Guided run 3 jumped past quarter-end papers (Q1 only appeared at week 26).
- **Commit reason:** material decisions now say a reason is required, with an “AT LEAST ONE REASON” heading and, in several runs, a “Go to reasons” button. Commit stays disabled until a reason is picked, but the old no-hint state is gone.
- **Cost-cutter balance:** all four cost-cutters missed at least one objective (2/5, 4/5, 4/5, 2/5). On `e2d4aaf`, all four cost-cutters reached 5/5.
- **Skip ahead during an incident:** it now holds with an explicit reason when a response decision is waiting, and advances the incident once those decisions are answered. On `e2d4aaf`, Skip ahead could do nothing during an active incident.
- **Recovery confidence:** several runs recorded a plain-language tooltip (“Confidence that services can be restored. Programmes build capability; a recovery test checks it.”).

**Still open**
- Passive newbies can still reach 5/5 objectives with no programmes, including after ransomware in run 11.
- Expert over-investment can be very harsh (run 8: 1/5 after delivering both programmes and containing ransomware).
- “Compare options” and “Your reasons” only scroll the dialog.
- Picking a scenario card still does not set difficulty.
- The warehouse risk-acceptance renewal still returns three times (31 May, 29 Aug, 27 Nov) when an acceptance is in force.
- Committee responses are still sometimes duplicated in history (intermittent).
- No live score; the inbox ended at 94–191 unread; board papers still need risks raised before optional agenda topics are eligible.
- Time still re-pauses at each new week in Guided, and the same hold was also seen in CISO and High pressure.
- The setup screen did not show a starting budget before Begin in the CISO and High pressure runs that checked it.
- Skip ahead missed a board paper once in High pressure (run 9, Q1) and once in CISO (run 13, Q3). Nothing was missed, because the paper window was still open.
- The annual-review headline “A year spent acting on a picture you never verified.” was reused on five very different years.

**Top 3 recommendations**
1. **Retune objectives.** A passive year with no programmes should not routinely land 5/5, especially when a severe incident still leaves every objective intact (run 11). At the other end, check that a competent year that over-invests is not punished all the way to 1/5 (run 8).
2. **Clear the remaining recurring UI bugs:** Compare options / Your reasons only scrolling; the scenario card not setting difficulty; the risk-acceptance renewal repeating three times; intermittent duplicated committee responses; and Skip ahead occasionally jumping past a quarter-end board paper outside Guided (run 9 Q1, run 13 Q3).
3. **Make the annual-review headline follow the year actually played.** The same “picture you never verified” line was used for a calm 5/5 Guided year, a ransomware 2/5, a five-incident 2/5, and a Credible year that ended mid-ransomware.

---
