# Owner-supplied 15-run matrix on 5033820 (pass 12) — 26 November 2026

Fifteen fresh-seed campaigns on `5033820`: 3 difficulties × 4 situations,
Surprise me on CISO and High pressure, and a replay of run 07. Who played is
not supplied. Notes and screenshots are on the owner's computer and were not
available to this session.

Confirmed:
- 0 lapses and no impossible dates; every review rendered first time.
- The replay matched all 113 steps through week 52.
- SOC warning cards stopped the clock in 12 of 14 runs.
- The review names emergency debt.
- The £400k comes once a year and costs confidence.
- The free workaround completes blocked programmes.
- Every CISO and High run had an incident.
- The longest jump fell from 69 to 50 days.

## What was checked and done (26 November)

Fixed:
- **MJ-27: Accelerate spent £175k in one click and could be pressed again.**
  The second press spent the money for nothing, since the pace is a flag.
  - Accelerating now takes two presses, and the first says what it will cost.
  - A programme is accelerated once; the engine refuses a second.
  - The button then reads "Accelerated".
- **MJ-25: the SOC card offered a hunt the player could not commission, and
  the review then said no hunt ran.**
  - `huntBlockedReason` (`src/game/threats/hunt.ts`) is the one answer, from
    budget and the SOC's capacity. The card disables its button with the same
    reason the Risk screen gives.
  - When a warning arrives, the tick records whether a hunt was possible. A
    campaign whose every warning came when none was possible reads "no
    targeted hunt could be commissioned at any warning", not as a hunt left
    untaken.
- **MJ-06: a risk raised from the register on 2 January was still "nothing
  you did went near it".** `openRisk` recorded no history entry, so only
  risks raised through a hypothesis were credited. It now records one.
- **MJ-28: Resilience strong, and "It held", after customer records left.**
  Resilience read downtime only. Data impact now counts as damage too.
- **MJ-24: 2 of 5 objectives rated Credible.** Two of five now caps the
  verdict at Mixed; one of five or none still caps it at Difficult.
- **MJ-16: "held; 45 days lost" read as the check passing.** It now reads
  "not cleared, because the work it asked about had not been done; delivery
  paused 45 days".
- **MN-41:** changing the lead no longer clears the "commission despite the
  workload" tick.
- **MN-47:** the close names a budget left more than half unspent.
- **CS-24:** a worked-around programme says "last stage dropped", and its
  journey says the stage was dropped rather than "Not recorded".
- **CS-25:** the SOC card says warnings leave it after four weeks and stay in
  the Inbox.

Checked, not defects, or owner calls:
- **MJ-01:** at most two reflections a year (19 November). The report again
  asks for one per incident.
- **MJ-02:** no jump cap (17 November). 4x is now the main source of long
  runs.
- **MN-01, the £90k and £60k credits.** These are authored events (a
  duplicate tool and an unused licence cancelled), not a fault. Whether they
  belong is a content call.
- **MJ-07 ("in hand" scored by outcome), MJ-09 / MJ-10 (writing), MJ-12
  (size and timing of the £400k), MJ-23 (only the bad option affordable),
  MJ-26 (overload with no affordable relief), MN-45 (candour costs
  confidence).** All are design.

## Measured

A competent player, over 25 years a mode. The player:
- takes the launch conditions and the Kestrel quarantine;
- starts identity on day 20;
- runs a recovery test;
- files and briefs every paper.

| Mode | Objectives | Verdicts before | Verdicts after |
|---|---|---|---|
| Guided | 4.8 | 24 Credible, 1 Mixed | unchanged |
| CISO | 2.6 | 8 Credible, 9 Mixed, 8 Difficult | 2 Credible, 15 Mixed, 8 Difficult |
| High pressure | 3.1 | 11 Credible, 8 Mixed, 6 Difficult | 6 Credible, 13 Mixed, 6 Difficult |

Resilience on CISO reads developing in 25 of 25 years, against 18 before.
The two-of-five cap meets a competent CISO player who now averages 2.6
objectives, a consequence of the incident floor and of delays that pause.

Tests: `tests/engine/pass12-fixes.test.ts`.
