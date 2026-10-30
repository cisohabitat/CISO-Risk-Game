# Owner-supplied newcomer retest — 30 October 2026

The owner supplied this account in the working conversation. Build, seed, mode,
recording and participant independence were not supplied. Treat it as reported
retest evidence, separately from the independent pilot and physical-device gates.
The report observes year-end results but does not supply an assessment headline.
The owner subsequently supplied the same account labelled “playtest from ciso”.
Keep both supplied labels; the repeated text does not establish a second session
or a different participant.

## Supplied account

> Bug check
>
> Didn't happen this time:
> - Raised risks stayed on the Q2 and Q3 papers, listed as "previously reported". The "7 emerging, not on the agenda" count still reads as if it includes them, though.
> - Disabled "Commission" buttons now explain why, such as no spare capacity, budget or attention.
> - "Skip ahead" no longer says "Paused", but the game still stays stopped after each skip until you press a speed button.
>
> Still happens:
> - The Inbox badge sat at "9+" while there were 17 and then 82 messages, and the "N things need your attention" count didn't match the decisions actually open.
> - Buying team capacity says morale lifted, but Identity showed "burning out" for the rest of the year.
> - There are long quiet stretches with no feedback, for example 30 Nov to 31 Dec and most of May and June.
> - "Form the hypothesis" only shows a brief toast, and the button stays the same afterwards. The risk scenario count also didn't change after I raised a risk.
>
> Not tested: whether the Q3 paper can lapse unnoticed, because I submitted it the day it opened. It did show a due date and a reminder.
>
> New bugs
> - Commitment review date: the funded-programme commitment's review date (26 May) passed with no outcome. The panel still said "Review scheduled for 26 May" in October, after the programme was delivered.
> - Recovery programme status: the review says 2 of 3 programmes finished, yet it lists recovery as both 100% delivered and "still running at year end".
> - Budget figures: the budget showed £110k left while the CFO's request mentioned "£170k uncommitted", and £260k then appeared in October with no explanation.
> - Silent commissioning: commissioning an investigation gives no confirmation, and the results of the January recovery test never appeared.
> - Repetitive choices: the incident command decision came up twice, and I used the same "More evidence is required" reason 26 times with no pushback.
>
> Top fixes
> - Show each commitment's outcome at its review date.
> - Make the counters match what's actually waiting.
> - Make the team panel reflect the effect of buying capacity.
> - Fix the recovery programme status in the review.
> - Name the evasive choices that caused incidents in the review's "what hurt" section.
> - Add a short note during quiet weeks.

## Source findings and implementation scope

| Reported issue | Findings and follow-through | Limit |
|---|---|---|
| Commitment outcome | A new `programme.review` effect records the actual funding/status/progress checkpoint when the existing audit reminder fires. Its dated summary appears in the letter and commitment panel, independently of later delivery. Preserve those records through history trimming. | Old saves without a recorded outcome say so; current delivery cannot reconstruct May. This is a checkpoint, not audit closure. |
| 100% and still running | Review prose rounded raw progress while portfolio views capped unfinished work at 99. Share the status-aware percentage across review and portfolio; completion remains a recorded status. | No forced completion, assessment-weight change or rewrite of stored annual judgements. |
| Inbox and attention counts | The badge intentionally capped at 9; it now shows actual unread counts. The attention sum includes papers, blockers, collisions and patterns; expose that breakdown and reveal work beyond list limits. Label raised versus emerging totals separately. | Total messages are not unread messages. A second hypothesis can link to an already-raised scenario without adding a new scenario. |
| Capacity and burnout | A positive morale delta need not cross a wellbeing band. Receipts state actual capacity changes and current wellbeing; Team shows the latest recorded capacity change. | No instant cure, extra morale bonus or guarantee that vacancies/overload stop causing decline. |
| Hypothesis and commission feedback | Keep named in-place confirmations and working/terminal enquiry records. Reject duplicate active hypotheses without another attention charge. Retain the full report body at enquiry completion, not only its generic quality summary. | Older summaries are not retroactively expanded from today's controls. The reported missing January report is not separately reproduced on an identified save. |
| Budgets | Record actual bounded budget movements with public source labels, including refunds. Briefing exposes retained activity; older correspondence distinguishes its date from today's available budget. | The £110k/£170k/£260k sequence remains unidentified. No invented historical ledger or changed amounts. |
| Quiet periods | A current-state note acknowledges seven days without a new decision and names running work and any outstanding paper. | No filler events, RNG changes, added mail or claim that a quiet week is safe. |
| What hurt | Explicit option metadata identifies control gaps deliberately left unaddressed. Reconstruction names a recorded pre-incident choice only when that control is on the used route and still weak; defaults are labelled separately. | This is evidence of a carried trade-off, not proof that one answer alone caused the incident. Post-impact, unrelated-route and remediated choices are excluded. |
| Repeated response/reason | Response papers identify their incident and start date. Repeated evidence reasons receive a nonblocking prompt about the evidence, owner and review date. | Distinct incidents can each need command. A valid repeated reason is not automatically evasive or punished. |
| Skip ahead | It is a one-shot advance, now explicitly held before the skip; guidance says to choose a speed for continuous play. | Do not restore automatic running while a new decision or incident needs reading. |

Verification and remaining limits are recorded in [FINDINGS](../FINDINGS.md).
This account does not complete the independent-pilot or physical-device gates.
