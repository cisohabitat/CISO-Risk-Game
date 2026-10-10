# CISO: First Year, a first year after the breach, on a tablet

**This is an AI-driven session, not a human playtest.** An AI agent played
one year through the browser driver at 768×1024, held upright. It played as a
charity's head of IT who has just been handed security: curious, and not a
specialist. It does not count toward Phase 0's human gate.

**Setup.**
- Build `552f7f3`, copied out of the checkout before play.
- Seed `tablet-31560`, CISO, "After the breach". No tester had played this
  mode and situation together, or this width.
- Driver on port 4412, `/?playtest`.
- Played 39.1 minutes to day 364 (`pnpm session`). It never used Skip ahead.
- The clock stopped for decisions 30 times, incidents 3, quarter ends 3 and
  blockers 2.

**Harness note.** At the start, the agent beside it sent one read, one
screenshot and one click to this browser through a shared helper script. The
click timed out and did nothing.

What was done with it is under **Acted on**.

---

## Report, as received

### Outcome

"Credible first year": "You built the capability, and the business paid for
it in delivery."
- 32 decisions, 17 enquiries.
- Two of two programmes delivered; three of three papers.
- One incident, customer platform tampering, from 8 February to 2 March.
- One of five objectives met.

### Findings, most severe first

1. **A risk review that cannot be done.** About 8 May, "Concentration of
   business services on one identity platform" read "Being treated · Review
   due". The panel says "A review is a decision about this risk: accept it
   for a stated period, or link it to the programme that treats it", then
   shows only "Linked to Identity and privileged access uplift." There was no
   button to press.
2. **Assumptions marked "Needs review" offer no action** from May to
   December. Two were plausibly contradicted during the year and never
   flagged: "The legacy estate remains isolated…" against "The firewall rule
   base says otherwise", and "The payment platform's exposure does not
   change materially" against "Payment volumes up 30%".
3. **Executives say a plan has no risk when the register has one.** On
   26 February Tomas said of Kestrel "Nothing on your register reaches it
   yet". "Acquisition integration imports unknown compromise" was on the
   register, owned by Tomas, still "Emerging".
4. **The resignation landed in the wrong function.** The decision was about
   engineering ("Ask them to push through"). Forty-five days later the SOC
   lost a day and gained a vacancy, and engineering stayed "Fully staffed".
5. **The board's idea of "material" is invisible and inconsistent.** What
   the Q1 paper missed was called material. Included in Q2, the same items
   "did not need its time". The paper composer never says what makes an item
   material.
6. **The recovery programme's blocker could not be cleared.** The only
   option, £150k, was disabled with £145k left. The programme crawled from
   49% to 89% and was "Delivered" with the blocker still listed. Stefan's
   reminder said "stuck again" of a blocker that had never cleared.
7. **The delegation dialog disagrees with the Team screen:** "Too stretched
   to do this well" beside "Workload: Has room".
8. **Incident warnings came with nothing to act on,** and how the incident
   happened was kept for the year-end reconstruction.
9. **Enquiry results say little:** "answered part of the question and
   raised others … and found nothing new"; threat hunts after a breach that
   never say whether anyone was found.
10. **Smaller contradictions:**
    - "She has a board meeting in three weeks" on 3 January; none came
      until April.
    - The hypothesis toast says "The board hears of it once you raise it as
      a risk scenario", then "a risk assessment the board has never seen"
      for one already raised.
    - "Last full restore test was 14 months ago" after a January test.
    - The incident panel lists unrelated decisions.
    - "recorded day 77".

### Repeated word for word

The meeting line "talks you through what is actually keeping them up at
night" for four people. Inbox repeats from "Credential campaign against
sector portals" to "Someone is thinking of leaving" (three times). "Answered
part of the question and raised others" on nearly every enquiry.

### Cost and feedback gaps

- **Attention costs not shown.** Listen, Brief and Press, and preparing the
  board paper, all spend attention, and none of those buttons says so.
- **Pressing an executive.** It "agrees to move", but never says to what.
- **Board recommendations** had no visible effect.
- **Missed objectives** were blamed on programmes, with no warning during
  the year that programmes slowed the business.
- **The budget** was £5k by May, and the year after felt like waiting.

### Tablet layout, 768×1024

1. **The header truncates whenever a status badge shows** ("8 Febru…",
   "£1.7m le…").
2. **The Organisation graph.** It rendered as a tiny cluster on a return
   visit, its labels overprint, and the inspector sits below the fold, so
   tapping a node seems to do nothing.
3. **The live-incident panel** takes about 540px at the top of every screen.
4. **A toast covered the blocker card.**
5. **"Write up the year now"** is a prominent button on Your year from day
   one.

### Q3 account and the review

> My year has been about rebuilding trust after last year's ransomware …
> My team has been stretched all year … The risk that worries me most is a
> supplier-led ransomware or destructive attack on the warehouses.

The review matched on honesty and the team. It differed on the year's
investment (identity rather than recovery), on the closing risk (the build
pipeline, the route the February incident took) and on the worry, which was
never tested.

### What was learned

Honesty compounds; inherited numbers are mostly noise; a thin answer is not a
clean answer; acceptances expire; supplier access belongs in the contract;
enforcement matters more than building. The glossary taught peering,
break-glass and immutable backup.

Where it got lost: what meetings and papers cost, why every lead was "too
stretched", how to review an assumption, what the board counts as material,
how to follow a warning that has no button, and how the February incident
happened, which was kept until December.

---

## Acted on

Fixed, each recorded in `docs/FINDINGS.md`:
- 1: confirming a link is the review;
- 2: assumptions can be reaffirmed;
- 3: meetings read the whole register;
- 4: the resignation lands where the pressure was;
- 5: the paper says what is material;
- 6: delivery clears blockers;
- 7: the dialog says why;
- 10: the board meeting date and the hypothesis toast;
- the attention costs on meetings and the paper;
- tablet layout 1, 2 (the detail) and 5.

Not fixed:
- 2: the two assumptions the tester thought contradicted. They are rule
  questions, not wording.
- 8 and 9: incidents and threat hunts need authored content.
- The live-incident panel's height.
- The graph's small labels.
- Repeated wordings.
