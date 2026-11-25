# Owner-supplied 15-run matrix on 73ad569 (pass 11, v0.1.0-rc.3) — 25 November 2026

Fifteen fresh-seed campaigns on `73ad569` (`v0.1.0-rc.3`): 3 difficulties × 4
situations, Surprise me on CISO and High pressure, and a replay of run 07.
Who played is not supplied. Notes and screenshots are on the owner's computer
and were not available to this session.

Confirmed:
- No impossible dates; every review rendered first time.
- The replay matched through week 52. Run 05 recovered from its autosave
  and replayed identically.
- Security checks stopped Skip in 14 of 14 runs.
- Stop something names its target (8 runs).
- Overspend is refused outside emergencies, and is labelled in the sidebar.
- Two overlapping incidents each kept their brief buttons (runs 11, 13, 14).

## What was checked and done (25 November)

Fixed:
- **MJ-04, in part: blamed for no hunt after commissioning one (runs 08, 09
  and 14).** The reconstruction counted only hunts started between the first
  warning and impact. Any hunt that ran while the intrusion was under way
  now counts, whenever it was commissioned.
- **MN-32: "A material risk the board has not heard about" after briefing
  the chair (run 02).** The check read `escalatedToBoard`, which nothing ever
  set. Escalating a risk to the board's chair now sets it, so the risk counts
  as heard. The 23 November review credit for escalated risks now works for
  the same reason.
- **MJ-20: the paper's "at most two optional updates" was advice the UI did
  not keep (run 14).** A third optional item could be ticked, and the board
  then asked for "fewer, sharper items". A third is now disabled, with a note
  to untick one to swap.
- **MJ-22, text:** a priced blocker that arrives after a programme passes 90%
  holds it where it is. The note said "cannot pass 90%" over 99%. It now says
  the programme cannot finish until the blocker is paid for.
- **MJ-23, wording: a default forced by an empty budget was blamed as a
  choice (run 14).** When every other option was priced out, the
  reconstruction says so.
- **MJ-15, run 03:** "you put the money into the programmes instead" with no
  programme started now says you started none.
- **CS-19:** "Budget cost £220k" on a cut capped at nothing now shows what it
  takes.
- **MJ-18 residue:** "Pausing a programme frees it" now says it frees the team
  and the money stays committed.

Checked, not defects or already owner calls:
- **MJ-12, the £400k granted twice.** It is an option of the "After the
  incident" decision. With your cap of two a year, it can come twice; its
  size and timing are your call.
- **MJ-07, "in hand" scored both ways.** That is the 19 November design: a
  reassurance that held is rewarded, and one that did not is marked as
  misleading.
- **MN-37, Skip silent with a decision open.** The engine returns "Skip held:
  … is waiting", and the store shows it as a toast. Not reproduced as silent.
- **"Came back later" items never seen (runs 03 and 11).** These are inbox
  mails delivered on the dates named.

Owner calls, not changed:
- MJ-01: the cap of two reflections, and their lateness.
- MJ-02: no jump cap.
- MJ-04: SOC warnings as stops.
- MJ-05 and MJ-06: discovery and blind-spot scoring.
- MJ-08 and MJ-24: verdict against business outcome.
- MJ-09 and MJ-10: board reply and headline variety.
- MJ-16: delay causes.
- MJ-17: card-data timing.
- MJ-21: difficulty and an incident floor.
- MJ-22: an affordable route out of a priced blocker.
- The remaining minor and cosmetic items.

Tests: `tests/engine/pass11-fixes.test.ts`.
