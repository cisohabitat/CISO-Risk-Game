# Owner-supplied CISO closing retest — 30 October 2026

The owner supplied this account in the conversation. Build, seed, difficulty,
scenario ID and participant independence were not supplied. The role label does
not establish difficulty or an independent CISO pilot. Keep reports, source
reproduction and controlled probes separate.

## Supplied account

> Bug check against earlier runs
>
> Fixed:
> - Commitment reviews now show an outcome. The 26 May identity review showed "Reviewed on 26 May" with the percentage delivered.
> - "Form the hypothesis" now confirms with a "Draft formed" card.
> - Commissioning now shows when to expect results.
> - Not seen this time: inconsistent budget figures between screens, and a programme shown as both delivered and "still running".
>
> Partly fixed:
> - Buying capacity now improves the wellbeing panel, but Engineering was back to burning out by April even though it was fully staffed.
> - The Team screen says morale is "declining" with 0 days committed.
>
> Still present:
> - Long quiet gaps, such as 15 Nov straight to 31 Dec.
> - The Inbox badge read 12 while there were 13 messages.
> - A raised risk didn't appear in the Q1 paper's "raised risks" section, even though the paper says they're listed below.
>
> New issues
> - Inflated attention count: suggested hypotheses push "things need your attention" up to 11 when only 1 real decision is waiting.
> - Silent blocker clearing: "Hold the line with the CIO" cleared Identity's blocker with no confirmation.
> - Contradictory Identity block: Identity was blocked by a £120k fix with only £105k left, then completed anyway in December with no explanation.
> - Unexplained budget jump: the budget went from £105k to £255k by year end with no explanation.
> - Misleading button: "Commit to this" actually opens a record-your-reason step.
> - Hidden December events: the last skip jumped straight to the review, and a "Credentials in circulation" alert popped up behind it, so December and the Corvus outcome were never shown.
>
> Top fixes
> - Check whether business objective outcomes really respond to the player's choices.
> - Leave suggested hypotheses out of the attention count.
> - Explain mid-year budget changes and how blockers get cleared.
> - Show December's events before the year-end review.

## Triage and limits

- Remove optional hypotheses from the attention headline; keep their separate
  lead count and the existing actionable categories. Inbox badges count unread
  mail while lists can include opened mail; a 13-message/12-unread regression
  preserves that distinction rather than making badges count all mail.
- Source morale rules recover at positive capacity, zero load and no vacancies.
  Fractional commitments no longer round to a misleading zero. Explain vacancy
  pressure and a zero-capacity outage separately. The exact Engineering case
  remains unverified without an identified campaign; no morale tuning is inferred.
- Open raised risks already qualify for agenda topics, while closed entries are
  excluded. Add an explicit register that includes both and names eligibility;
  do not force closed risks onto an agenda. The reported omission lacks a save.
- Blockers have authored progress multipliers: many slow delivery rather than
  stop it. Keep their rates, costs and completion rules. Manual clearing retains
  an actual receipt; completion records constraints closed with delivery without
  implying the separate fix was purchased.
- The content has £60k unused-licence and £90k duplicate-tool refunds. They can
  explain a £105k → £255k path, but do not attribute the reported run without a
  seed. Skip now stops on actual budget changes; expose the retained movement.
- Quiet skips report elapsed time, without filler events or safety claims. A
  played finish keeps December correspondence available in Inbox before explicit
  review navigation. Review generation/grades and the legal final date remain
  unchanged; old prepared finished saves keep their opening behavior.
- Commit is a single action, disabled until required reasons are present;
  the secondary reason-navigation control is separate.
- Objective probes and limitations are documented in `docs/OBJECTIVE_REVIEW.md`.
  Choices do affect progress and outcomes. The collision card had incorrectly
  moved the commitment by adding recorded delay, though the engine kept its
  original date. Fix that display and label recorded penalties without claiming
  an actual completion date or changing grading/balance.

Measured verification is recorded in [FINDINGS](../FINDINGS.md). Independent human,
physical-device and learning gates remain open.
