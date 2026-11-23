# Owner-supplied 15-run matrix on 16fe0ee (pass 8) — 23 November 2026

Fifteen fresh-seed campaigns on `16fe0ee` (`v0.1.0-rc.1`): 3 difficulties ×
4 situations, Surprise me on CISO and High pressure, and a replay of run 07.
Who played is not supplied. Notes and screenshots are on the owner's computer
(`/workspace/ciso-playtest-v8/`) and were not available to this session.

Confirmed:
- No lapses.
- All years reached the review without a reload.
- The seed replay matched through week 52, and the session log holds one
  campaign event.
- Paid blockers hold programmes.
- The rail badge counts papers.
- Skip ahead stopped at every paper.
- No impossible dates.

## What was checked and done (23 November)

Fixed:
- **M-01: "this year's budget is unchanged" on an option that charges £110k
  (15 of 15 runs).** This was a regression from 20 November. The text added
  to the 28 October cut was matched into the 31 May "Finance asks for the
  cyber budget back" option, which does charge now. It reads "Half the cut,
  taken from this year's budget now". `tests/content/budget-wording.test.ts`
  now fails if an option that charges this year says this year is unchanged.
- **M-02, in part: security checks passed inside long skips (8 runs; run 03
  lost the Nordic market).** A business security check is now a stop
  (`objective-check`): "Stopped on 19 August: Kestrel: auditors…". The jump
  cap and stops for mail stay as chosen on 17 November.
- **M-04: headlines contradicting the verdict.** "Tested, and it held." now
  needs the business not to have paid for it:
  - when the business paid, it reads "It held under attack, and the business
    paid for it in delivery.";
  - on a weak risk picture, "It held, on a picture you never verified.".

  "A quiet year that bought the organisation real capability." is no longer
  given to a year whose resilience is weak.
- **M-06: "38 of 38 systems discovered" with no enquiries.** The line now
  reads "systems known by the year end, from correspondence and enquiries",
  beside the existing count of what the player examined themselves.
- **M-07: the review blamed risks the player never saw.** When the largest
  untouched risk never reached the register, the line says so: "A risk that
  never reached your register was among the largest you inherited: …".
- **M-08: emergency overspend hidden.** The sidebar shows "£110k unbudgeted,
  carried into next year" under the budget, and the phone header shows it in
  brackets. The review already lists it under business enablement.
- **M-11: concealment beside strong communication.** A decision that kept
  something from the board, a bank or a regulator now caps communication
  below strong, as hearing elsewhere does.
- **m-13: strong business enablement beside a missed objective.** A missed
  objective now caps the band at solid.
- **m-24: a stale "by 28 Jun" on 1 July, and a late briefing thanked as
  early.** Lateness is now judged by the date. The bar says the briefing is
  late, the reply says so, and the closing letter says it came later than
  expected.
- **M-03, in part: optional topics dropped from the board's reply.** The
  reply now ends "It also noted: …". c-08's "Q3.." double full stop is gone.

Tests: `tests/engine/review-headlines.test.ts`,
`review-new-behaviours.test.ts`, `board-incidents.test.ts`,
`objective-gates.test.ts` and `board-reply-echo.test.ts`.

Not reproduced, or by design:
- **M-12: "After the incident" missing for 3 of 15 incidents.** This is the
  cap of two a year chosen on 19 November. Run 11 had four incidents and
  received two reflections. Run 05's second incident closed on 31 December,
  with no year left.
- **M-16: the clock resuming by itself (run 07 only, not in the replay).**
  On desktop the Pause button only pauses. Space and the narrow-screen
  button toggle, and say so.
- **M-13: a block never clearing.** Blockers clear through their own
  resolution on the Programmes screen, not through other work; a paid one
  now holds at 90% until paid.

For the owner (balance and design):
- **M-02:** a cap on jump length.
- **M-05:** SOC warnings as stops or Briefing cards, since the review grades
  unhunted warnings.
- **M-09 / M-10:** High pressure not reading harder on objectives, and
  cost-cutters reaching 4–5 of 5. On 15 runs this is noisy; the tuning
  harness reads business-first 4.0 and defensive 4.3.
- **M-14:** the £400k post-incident funding.
- **M-15:** the predecessor's figure.
- **Minor items:** the inbox badge (unread updates) against all unread, the
  vacancy wording, and "23 open entries".
