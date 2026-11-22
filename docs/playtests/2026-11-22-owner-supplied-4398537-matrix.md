# Owner-supplied 15-run matrix on 4398537 — 22 November 2026

Fifteen fresh-seed campaigns on `4398537` (3 difficulties × 4 situations,
Surprise me on CISO and High pressure, and a replay of run 7). Who played is
not supplied. Notes and screenshots are on the owner's computer
(`/workspace/ciso-playtest-v7/`) and were not available to this session.

Confirmed:
- **The seed replay reproduced the whole year:** all 33 decisions on the
  same dates, with the same incidents, papers, budget checkpoints and
  verdict, when choices and pacing matched. Resuming a save also reproduced
  the year.
- No lapses.
- "After the incident" follows second incidents.
- "Stop something" names what it paused.
- Programme start dates are right.
- No blocked first click after a paper.
- Skip stopped at most papers.
- No High pressure cost-cutter at 5/5.

## What was checked and done (22 November)

Fixed:
- **The rail badge ignored board papers, blocked programmes and collisions
  (9 runs): fixed.** One count, `wantsYouCount`, now serves both the
  Briefing masthead and the rail badge.
- **"by 34 Dec" (run 11): fixed.** A briefing deadline past the year end now
  reads "before the year closes".
- **The incident recap button opened the year timeline (run 8): fixed.** It
  now scrolls to the incident reconstruction on that screen.
- **"No incident reached the business this year" days before one did (run
  8): fixed.** It now says "so far this year".
- **Budget rises with no cause in the ledger (runs 1, 7, 14).** The three
  amounts are the cancelled licence (£60k) and the duplicate tool (£90k),
  whose letters name the money. The Briefing's ledger showed only the latest
  20 movements, so earlier ones could fall off; it now shows the year's.

`tests/ui/badge-and-dates.test.tsx` covers the badge and the date.

Explained, not changed:
- **"38 of 38 systems discovered" with no enquiries (runs 9, 12, 13).**
  Systems are discovered through the year's letters as well as enquiries.
  The Risk screen's mid-year count and the review's year-end count read the
  same function. The next review line says how much the player examined
  themselves.
- **"Non-production environment" in the review against "Build pipeline" on
  the Briefing (run 6).** These are two different risk scenarios with
  similar names: the review named the one nothing touched.
- **Skip ahead and papers or incidents.** Skip stops when a paper opens and
  in its final week, and for an incident's decisions. In run 10 the incident
  began on 4 August as an unconfirmed signal, and its first decision opened
  when it escalated, with the standard two days.
- **As before (17 and 20 November):** long jumps; two decisions open at
  once; the 90-day renewal; "Submit by 1 July" (91-day quarters); Surprise
  me's hidden budget; the cut applying to next year; the reasons link.

For the owner:
- **Programmes complete with blockers unresolved (runs 7, 9, 11, 15).**
  Reported in three rounds now. Completion closes open constraints by
  design, and the delivery letter says so. Holding completion until a
  budgeted blocker is cleared would change programme balance.
- **Cost-cutters at 5/5 on Guided and CISO, repeated (accurate) headlines,
  100–140 unread at year end:** balance and volume, for a human playtest.
