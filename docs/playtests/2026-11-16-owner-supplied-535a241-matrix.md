# Owner-supplied 15-run matrix on 535a241 — 16 November 2026

Fifteen fresh-seed campaigns on `535a241` (run 15 replays run 7). Who played,
and whether by hand or by an agent, is not supplied. The report's summary is
kept below, after what was done.

## What was done (16 November)

- **A silent lapse of "The CEO wants your three risks" (run 10).** It was the
  only decision with a one-day window (incident decisions open with two,
  whatever their own figure): the clock stopped as it arrived, and a speed
  pressed then lost it the next morning without the usual "due tomorrow"
  stop. It now has two days, and a content test keeps every decision at two
  or more (`tests/content/decisions.test.ts`).
- **Board responses shown twice, "gone by the end" in run 11.** Submitting a
  paper put the committee's reply in the inbox and the same words in a
  notification over it. The notification now says the paper went in and the
  reply is in the inbox. With the engine's one-paper-per-quarter rule
  (`42e2b80`) and the Board history's one row per quarter (`535a241`), this is
  the last place the same reply could appear twice.
- **"Your reasons" read as broken.** It is a jump link to the reasons for a
  long paper, now named "Jump to your reasons".
- **"No attention left this week" read as an option label.** It is the reason
  an option cannot be taken, now "This takes attention, and none is left this
  week".

Measured and left, with the reason:

- **5/5 objectives beside a Difficult verdict (runs 4, 6, 10, 11, 13).** These
  are years in which no serious incident reached the business: the business
  met its plan and the review judges the security year. That split is the
  game's lesson ("The business got its year. The security programme did
  not."), and the headline that says it appeared in 8 of 15 runs because 8 of
  the 15 personas were newbies or cost-cutters, whose years it describes.
  Objectives fall when serious incidents land: run 1 met 3/5 after a
  destructive attack, run 5 3/5 after ransomware. A fourth retune in four
  rounds of agent playtests would be tuning to the probe; `docs/PLAYTEST.md`
  says not to change a system on that, so the balance waits for a person.
- **High pressure's security-first expert at 1/5 (run 9):** High pressure is
  meant to cost the builder (missed per programme 0.89 against 0.34 in
  Guided).
- **Q1 paper "presented in Q2", "Submit by 1 July":** correct; a quarter's
  paper reports that quarter and is presented in the next.
- **Single skips "covering 15 Nov–31 Dec" (runs 7, 13):** every Skip is capped
  at seven days; a clock left at speed covers the rest.
- **Weekly holds at speed, the 90-day acceptance renewal, inbox volume, the
  situation card leaving difficulty alone:** as designed, as before.
- **Not reproduced from one run each:** near-duplicate CEO memory lines (run
  13); identity funding "with dates" reserving no money (run 6) is that
  option's stated effect.

## Supplied report (summary)

### Fixed or improved since 42e2b80
- **Skip ahead and board papers:** Skip ahead stopped for every quarter-end board paper in all 15 runs, with the message "Skip held: the Q3 board paper is ready."
- **Passive newbies after a major incident:** they no longer get 5/5. Run 1 got 3/5 after a destructive attack.
- **Experts:** they're no longer punished on Guided or CISO (runs 7 and 8 were Credible at 5/5 and 4/5). High pressure is still harsh (run 9 got 1/5, see below).
- **Compare options:** it now expands an inline table and toggles to "Hide comparison" (runs 4, 7, 8 and 14).
- **Setup budget:** it shows for CISO and High pressure. Surprise me shows "the budget depends on the situation".
- **Duplicate recorded costs:** no recorded cost was listed twice in any annual review.
- **Seed replay:** all 28 decisions, the dates, the 4 Apr supplier disclosure, the verdict, the headline, 5/5 and all 8 scores matched run 7. The session log had 602 events from that campaign only.
- **Silent lapses:** zero in 14 of 15 runs.

### Still open
1. **Silent lapse (regression):** in run 10 (High pressure, cost-cutter), "The CEO wants your three risks" on 4 Jan lapsed with no prompt. It never appeared as an open decision after a skip. The tester didn't capture the due date or speed. Runs 11–14 played week 1 at 1x and saw no lapse.
2. **Objectives and verdict disagree:** 5/5 objectives with a "Difficult first year" verdict in runs 4, 6, 10, 11 and 13.
   - Passive newbies get 5/5 whenever no incident reaches the business.
   - Run 10's cost-cutter got 5/5 despite two incidents, with £2.5m unspent.
   - Run 12 kept £1.7m after three incidents.
   - The objectives don't appear to be hurt by incidents or underspending.
3. **Reused headline:** "The business got its year. The security programme did not." appeared in 8 of 15 runs (1, 3, 4, 5, 6, 11, 12 and 13), across very different years. The Risk understanding line "You spent the year acting on an inherited picture you never verified." also recurs.
4. **Duplicate board responses:** they appeared in runs 3, 5, 8, 10 and 15. Run 11 showed duplicates mid-run that were gone by the end, and the other runs were clean.
5. **Warehouse risk acceptance:** it renewed three times (about every 90 days) in runs 3, 5, 10, 11 and 12. This may be by design.
6. **Your reasons:** it still only scrolls the dialog to section 03.
7. **Scenario card and difficulty:** the card no longer overrides a difficulty you've already picked (runs 7 and 8). Several testers still had to set difficulty by hand after the card, which seems like the intended behaviour now.
8. **Weekly auto-pauses:** they still happen on CISO and High pressure. Skip ahead often advances only 1–7 days per click.
9. **Inbox:** it ends with 113–178 unread.
10. **Board paper timing:**
    - Run 7's Q1 paper only opened on 20 Jun, labelled "presented in Q2". The replay opened it on 4 Apr.
    - Run 13's Q1 paper opened on 14 Apr with "Submit by 1 July".
11. **Pacing gaps:** single skips covered 15 Nov–31 Dec (run 7) and 28 Oct–31 Dec (run 13), and Q3 in run 6 had one decision.
12. **High pressure balance:** the security-first expert in run 9 missed 4 objectives by 38–83 days and ended with 1/5. That may be intended, but it's steep.
13. **Smaller items:**
    - "No attention left this week" appeared as an option label (run 7).
    - The CEO memory has near-duplicate lines (run 13).
    - Identity funding "with dates" reserves no money (run 6).
