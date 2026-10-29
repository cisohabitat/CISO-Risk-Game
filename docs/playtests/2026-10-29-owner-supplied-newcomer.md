# Owner-supplied newcomer feedback — received 29 October 2026

Source: the owner supplied the report below in chat as “playtest from newbie”.
This is one reported session, not a newly observed or reproduced playthrough.
The session date, build, seed, browser, device, recording consent, assistance,
guide usage and participant independence are not supplied. “Newcomer” describes
the report; role experience is unknown. No save, screenshots or session log
accompany it. Do not assign this participant a focused-review recruitment slot
or count it as a completed independent pilot session without those details.

Reported setup: Guided, **The inherited mess**, approximately 35 minutes,
including 4× speed, stopped at Week 37 of 52. The ending and annual review were
not reached; mobile layout was not tested. This supplies useful clarity and
usability evidence, not completion, replay or learning-effectiveness evidence.

## Report as supplied

> I played to Week 37 of 52 on Guided difficulty with "The inherited mess" scenario (about 35 minutes, even at 4× speed), so I never reached an ending. The writing and tone pull you in, but as a newcomer I didn't know how to tell whether I was doing well.

### What worked for a newcomer

> After each choice, a "what changed" line tells you how a named person reacted, for example "You told her what you did not yet know." It feels like a job, not a quiz, and it taught me that honesty pays.
>
> After you commission an investigation, the evidence turns up in the Inbox days later. That gives a real sense of delay and discovery.
>
> The Week 13 "What is about to collide" card was the clearest lesson about a trade-off in the whole run.
>
> Each decision has "Known effects", plus a "Compare options" panel and a "Your reasons" section, which help.

### Where I got lost

> The game never says what winning looks like. The quarter summary only counts how many choices you made ("participation, not quality"), and the board gave one generic sentence back. By Week 37 I still had no sense of my score.
>
> There's too much unexplained jargon. The "?" chips cover some terms but miss a lot: residual risk, unallocated capacity, recovery confidence, risk scenarios, hypotheses and assumptions, uplift, segmentation, telemetry, peering link, assurance and "Accept for now".
>
> The Risk screen opens as a dense list with no first step. I only found out that "Raise as a risk scenario" means "put it on the board agenda" by trying it.
>
> The teaching tips are good, but one "Got it" click dismisses them and I couldn't find them again.
>
> A decision lapsed (the SOC contract renewal) while time kept running, and I got no warning until the quarter recap.
>
> The inbox hit 9+ items by Week 3, and the screen said "8 things need your attention". That's overwhelming early on.

### Bugs and inconsistencies

> After "Board confidence rose", the gauge still read "Neutral".
>
> Decisions showed "6 attention available" when I only had 2 left.
>
> The reasons section is labelled "WHY? (OPTIONAL)", but on the platform-launch decision the commit button stayed disabled until I ticked a reason.
>
> The "DECISION RECORDED" banner hangs on. At 20 July it was still showing a decision from May and pushing the page down.
>
> The game doesn't say which actions cost budget until after you commission them.
>
> The console showed no errors, only a warning about a deprecated Apple meta tag. I didn't test the mobile layout.
>
> My top three fixes would be a clear win condition or scorecard, a guided first visit to the Risk screen, and a warning before a decision lapses.

## Source triage — 29 October 2026

No browser reproduction or tests were run for this triage. Existing source is
evidence of intended/current implementation, not proof of what this player saw.
Do not dismiss a reported problem because the implementation appears to cover it.

| Report | Source finding / uncertainty | Smallest next action and retest |
|---|---|---|
| Cannot judge progress before the ending | A substantive unmet newcomer need; no ending observed. A universal score remains outside the product contract. | Explain the eight annual assessment dimensions and what evidence of sound judgement looks like, without computing a mid-year grade or revealing hidden truth. Ask a fresh newcomer to explain how they would judge their year before playing Q2. |
| Dense Risk screen; raising confused with agenda submission | Raising enables board eligibility; the player must still select eligible material in a board paper. The player's interpretation is an observed misunderstanding, not the rule. | Prototype a first-visit evidence → hypothesis/enquiry → raised scenario explanation with a separate board-selection step. Retest navigation and explanation unaided. |
| Jargon and inaccessible dismissed tips | [Lessons](../../src/components/game/lessons.ts) explain some terms at triggered moments; [Onboarding](../../src/components/game/Onboarding.tsx) renders only an eligible undismissed lesson. Discoverability/retrieval remains a credible gap. | Audit the exact reported terms at their point of use; propose an accessible way to revisit lessons. Retest after dismissing a tip and returning later. |
| SOC renewal lapsed without warning at 4× | [Tick processing](../../src/game/engine/tick.ts) adds a deadline pause on the preceding day; [TimeControls](../../src/components/game/TimeControls.tsx) exposes deadline status. This does not reproduce the reported lapse or establish that the warning was noticed. | Identify the renewal decision/build and replay at 1×, 4× and Skip ahead; distinguish first pause from manually resumed time. Preserve default/lapse semantics while testing warning visibility. |
| Confidence rose but band stayed Neutral | [Reaction text](../../src/store/decision-reactions.ts) reports an underlying delta; banded presentation can remain unchanged. This is a plausible wording mismatch, not established engine corruption. | Say whether confidence moved within the current band or crossed it, keeping internal numbers hidden; verify both cases. |
| Attention 6 versus 2 | [DecisionDialog](../../src/components/decisions/DecisionDialog.tsx) reads current `focusRemaining` directly. No discrepancy reproduced. | Obtain build/save and compare header and dialog in the same paused frame, including a weekly reset. |
| Optional reasons required to commit | Current [DecisionDialog](../../src/components/decisions/DecisionDialog.tsx) uses `requiresRationale` for both label and submit handling; required reasons say “at least one reason” and “Record why first”. No mismatch reproduced. | Revisit the platform-launch decision on the played build; check selected-option affordability separately from rationale requirements. |
| May receipt still visible in July | [Receipt UI](../../src/components/game/CampaignFeedbackView.tsx) offers manual Dismiss; [store](../../src/store/game-store.ts) clears receipts on campaign lifecycle changes. No age-based expiry appears in the inspected path. | Reproduce the old receipt after advancing time; propose expiry/collapse with a retained decision-history route and no loss of recent keyboard feedback. |
| Commission cost appears only afterwards | [InvestigationPanel](../../src/components/risk/InvestigationPanel.tsx) shows attention and nonzero budget cost in the list and before confirmation. Other action paths and the played build remain unverified. | Identify the exact action; check costs at selection and confirmation, including a zero-budget enquiry and a paid one. |
| Early Inbox overload and generic board feedback | Single reported experience; counts alone do not establish useless mail or justify suppression. | Record which messages/actions were confusing and whether urgency labels distinguished deadlines from optional reading. Check existing replies before adding or consolidating correspondence. |
| Deprecated Apple meta tag | Reported warning only, no console error supplied. | Capture exact warning/browser before deciding whether a compatibility change is needed. |

## Follow-through priority

1. Reproduce deadline, attention, rationale and cost reports against an identified
   build; fix any factual contradiction with targeted regression coverage.
2. Clarify progress expectations and the first Risk visit; restore access to
   dismissed teaching material. These are small clarity proposals grounded in
   this report, not authority to add mechanics or a score.
3. Review receipt lifetime and within-band reaction wording, then retest the
   reported tasks with fresh newcomers.
4. Keep mail-volume, generic stakeholder feedback, total duration and replay
   questions open for repeated independent observations. An unfinished 35-minute
   session is not a measured full-year duration.

Preserve what this player valued: named reactions, delayed evidence, explicit
known effects and the quarter collision explanation. “Honesty pays” is the
player's interpretation, not proof that honesty is always the optimal choice.
This report changes the clarity backlog; it does not close Phase 0 or upgrade
the roadmap grades.

## Implementation follow-through — 29 October 2026

Implemented: qualitative annual-assessment guidance on Briefing; a foldable
first Risk guide with evidence/enquiry routes and separate board-selection step;
revisitable lessons through Glossary; contextual links for game terms and
missing definitions; explicit no-budget enquiry quotes; cross-screen deadline
notices; current attention versus weekly allowance wording; band-aware board
confidence reactions; and receipt expiry on day advancement. The mobile web-app
meta tag accompanies the existing Apple compatibility tags.

The attention, platform-launch rationale and commissioning-cost reports were
not reproduced as current contradictions. Regression coverage checks those
paths without claiming to explain the unidentified played build. No balance,
assessment, clock speed, deadline, lapse/default, mail suppression or stakeholder
response effects changed. Human retests, full-year duration and mobile observation
remain open. Executed check results are reported with the delivered change.
