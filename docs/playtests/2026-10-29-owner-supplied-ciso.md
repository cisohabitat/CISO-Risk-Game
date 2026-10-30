# Owner-supplied CISO feedback — received 29 October 2026

Source: the owner supplied this report in chat as “playtest from a ciso”. This
is a separate reported full-year session, not a newly observed playthrough.
Build, seed, session date, device, browser, assistance, recording and participant
independence were not supplied. Do not assign it a recruitment slot or count it
as a completed independent pilot session without establishing the protocol data.

Reported setup: CISO difficulty, Nexora, full year; “Credible first year”, four
of five business objectives met. Several late decisions were reportedly taken
by default during fast-forward, including next year's budget. Exclude those
outcomes from claims about the player's intended strategy. A save/log would
allow `resolvedByDefault` records to be distinguished from deliberate choices.

## Report as supplied

> I played a full year at Nexora on the CISO difficulty and finished with a "Credible first year" (4 of 5 business objectives met). The scenarios are strong and feel real, but a few bugs and balance issues undercut them. One caveat: during fast-forward a few late decisions were auto-picked without me reading them, including next year's budget, so ignore those outcomes.

### What rings true for a CISO

> The opening: you inherit 6,283 critical vulns, a stale risk register and five vacancies, and the CEO wants your top three risks within the hour.
>
> The trade-offs:
> - Card data found outside the payment environment, and whether to tell the acquiring bank.
> - A restore test that needs a four-hour payments outage.
> - Pressure to connect the acquired company's network.
> - Standing supplier access and break-glass paths.
> - Creeping executive exceptions to the access process.
> - Finance asking for budget back.
> - The choice between notifying the regulator early and establishing the facts first.
>
> The incident: it came from the identity and partner-credential gaps I actually left open, rather than being scripted. Honesty with the CEO and board is rewarded, which is right.

### Bugs and inconsistencies

> I committed to a funded identity programme to close a repeat audit finding. By the time I could act on it I couldn't afford it, and the game never warned me or penalised the broken promise.
>
> Risks I raised and put on the Q1 board paper showed up on the Q2 paper as "emerging, not on the agenda".
>
> The Q3 board paper lapsed with no deadline reminder, and the year-end review counted only 2 of 3 papers.
>
> The first time I used "Skip ahead", it paused the game instead of advancing. Time also jumped from late July to October with nothing happening.
>
> "Raise as a risk scenario" gives no confirmation, and the notification counters fall out of sync with what's actually waiting.

### Balance

> The honest, specific option nearly always wins, and the cheap or evasive choices ("note it", "renew as-is", "defer") rarely have a visible cost.
>
> Funding only Ransomware resilience and Detection earned "strong" on Resilience and Prioritisation without any identity or cloud work.
>
> SOC burnout was visible from Q2, but hiring was the only fix and ignoring it cost nothing.
>
> Programmes finish much faster than their stated durations. Detection was done in about three months against a stated five.
>
> The weekly attention points are never explained, and trust changes show as arrows with no size.

### What a real CISO would miss

> There's no cyber insurance, threat intel, tabletop exercise, ransomware negotiation, board talk about risk appetite, or metrics such as time to detect, time to respond and patch deadlines. That makes the board and regulator side feel thinner than the operational side.

### Top fixes

> - Track commitments and show the consequence when one can't be honoured.
> - Keep raised risks on the board agenda.
> - Explain the attention points and show the size of trust changes.
> - Give evasive options visible downsides.
> - Add insurance, threat intel and risk appetite to the board loop.

## Source triage — 29 October 2026

This is source inspection, not browser reproduction, a balance sweep or a human
retest. The played build is unknown; do not assume it includes the latest
newcomer or CI fixes. Preserve the reported experience even where a feature
already exists: implementation is not evidence that the player found it.

| Report | What current source establishes | Investigation / retest |
|---|---|---|
| Funded audit promise becomes unaffordable | `opt-audit-programme` in [decisions](../../src/content/nexora/decisions.json) grants trust/confidence, sets `audit.committed` and schedules a reminder; it neither reserves funding nor starts identity work. The [100-day reminder](../../src/content/nexora/events/consequences.json) is correspondence, not a funding/delivery check. A later audit follow-up and conditional consequences do exist. | Highest follow-through priority: distinguish a promise from an actual purchase, make its funding/staffing dependency visible and check delivery/renegotiation against the recorded commitment. Do not claim there are no consequences anywhere. Any reservation or penalty change needs an explicit design and balance review. |
| Raised risks become emerging in Q2 | [BoardScreen](../../src/screens/board/BoardScreen.tsx) displays a count of all still-emerging risks, without naming them in that warning. That warning does not establish that a previously raised risk reverted. [Conversion](../../src/game/engine/orchestrator.ts) marks the scenario open and guards duplicate conversion. | Compare exact scenario IDs/statuses and submitted Q1/Q2 topic IDs. Distinguish raised status, agenda eligibility, selected topics and actual submission. Improve identification of the emerging items; do not automatically reselect every previous agenda topic. |
| Q3 paper lapses without reminder | [BoardScreen](../../src/screens/board/BoardScreen.tsx) displays the submission date, and [tick](../../src/game/engine/tick.ts) opens a paper at a quarter boundary and lapses an unwritten one at the following boundary. The global [deadline notice](../../src/components/game/DecisionDeadlines.tsx) covers open decisions only, not board papers. | Concrete reminder-coverage gap. Add/test board-paper warning coverage at the real submission window while preserving existing lapse rules. Reconcile submitted versus missed quarter records before calling the annual total wrong. |
| Skip ahead initially pauses; July jumps to October | Each [advance action](../../src/game/engine/orchestrator.ts) requests a bounded number of days, ticks before checking new updates and stops on pause reasons. The UI requests 30 days per skip. A multi-month jump is not established by one such action. | Replay from the save with initial day, speed, pause reasons, click count and input method recorded. Distinguish a one-day stop, retained running speed, repeated skips, default decisions and quiet correspondence. Never infer deliberate choices from defaults. |
| Raise has no confirmation; counters disagree | Conversion returns a success message and writes history; [store dispatch](../../src/store/game-store.ts) routes successful messages to a toast. Counters represent different sets (unread mail, decisions, patterns and other work). | Verify toast visibility/focus and the resulting risk route, then compare each counter with its labelled set on the same paused frame. Existing toast code is not proof that confirmation was noticed. |
| Honesty dominates; evasive choices have no visible cost | Authored effects and delayed guarded replies determine consequences. Some straightforward answers receive immediate positive reactions; effects cannot be judged from labels alone. | Audit concrete option pairs and their reached consequences across matched seeds/modes, excluding defaulted choices. Identify trade-offs or missed feedback before adding punishments; preserve ambiguity and avoid labelling an option as correct. |
| Strong Resilience/Prioritisation with recovery and detection only | [Assessment](../../src/game/debrief/review.ts) evaluates recovery evidence and incident handling for resilience, and effort allocation/decision handling for prioritisation. Neither is a requirement to buy identity and cloud programmes. | Check the saved dimension evidence and enquiries, not just the two purchases. Explain what Strong does and does not establish; do not turn the rating into a checklist requiring unaffordable coverage of every programme. |
| Burnout has no cost or remedy except hiring | [Capacity/wellbeing](../../src/game/team/capacity.ts) includes conditional morale recovery, workload penalties and delegated-quality effects; sustained workload and vacancies matter separately. | Trace actual SOC commitments, vacancies, delegated work and recovery conditions. Check whether pausing/reallocating work is discoverable and whether consequences were encountered. No extra burnout penalty is justified by this account alone. |
| Programme completes faster than advertised | [Progression](../../src/game/programmes/progression.ts) uses authored base duration, staffing, funding, friction, blockers and acceleration; authored `programme.progress` effects can also advance work. [UI](../../src/screens/programmes/ProgrammesScreen.tsx) displays approximate base months. | Obtain start/completion days, funding, acceleration and progress-effect history. Separate an early milestone from full completion. Quote the base/conditional duration honestly before altering rates. No duration bug is reproduced here. |
| Attention unexplained; trust arrows lack magnitude | Attention [lesson](../../src/components/game/lessons.ts) says it does not carry over; [tick](../../src/game/engine/tick.ts) restores the weekly allowance every seven days. [Reaction text](../../src/store/decision-reactions.ts) reports direction/memory and board-band crossings, not numerical trust deltas. | Explain the weekly refresh and action costs directly. Consider qualitative magnitude consistent with visible relationship bands; keep hidden trust numbers hidden and do not create a universal score. |
| Missing insurance, threat intel, appetite, negotiation | Existing [business events](../../src/content/nexora/events/business.json) include insurance renewal and a risk-appetite request; [threat events](../../src/content/nexora/events/threat.json) include intelligence advisories; [decisions](../../src/content/nexora/decisions.json) include ransom negotiation. | Distinguish content not reached/not noticed from a thin decision loop. Correspondence alone is not an implemented insurance market or board appetite policy. Audit reachability and player recall before proposing new mechanics. |
| Missing tabletop and operational metrics | The [IR-readiness review](../../src/content/nexora/investigations.json) walks a response plan against a scenario, but its authored finding says the plan has not been exercised. That is not an established full tabletop feature. | Inspect the assessment's exercise credit against the actual delivered review/evidence. Treat a full tabletop, insurer terms and detection/response/patch-deadline metrics as separately scoped proposals, grounded in observable records. Do not invent historical timings or equate detection time with intrusion time. |

## Next priorities

1. Commitment truthfulness and visible follow-through; board-paper deadline
   coverage. These have concrete source support.
2. Scenario/agenda identity, paper counts, Skip ahead/default handling and
   notification consistency: reproduce with a build-identified save/log.
3. Attention refresh, relationship change magnitude and conditional programme
   duration: clarify what the existing simulation actually does.
4. Matched-policy audits of option trade-offs, assessment evidence and burnout
   consequences. Retest with people after any targeted fix.
5. Inventory/reachability of insurance, intelligence, readiness and appetite;
   then propose any genuinely missing board/regulator mechanics separately.

The report reinforces the earlier newcomer concerns about delayed follow-through,
deadlines, time controls and feedback clarity. It does not establish that the two
reports came from independent participants or the same build. Retain the scenarios,
credible trade-offs and incident causality the player valued. No gameplay,
assessment, balance or new-feature change is authorised merely by recording this
report, and no roadmap grade or pilot gate is advanced by this source review.

## Implementation follow-through, 30 October 2026

The combined implementation pass is recorded in [FINDINGS](../FINDINGS.md#combined-cisoproduct-manager-follow-through--30-october-2026)
and [ROADMAP](../ROADMAP.md#combined-report-implementation-follow-through-30-october-2026).
This does not identify or reproduce the supplied player's build, change the raw
account above, or count as an independent human retest. Clock callbacks/modal
reading, board submission/deadlines, audit promise follow-through and review
labels/counts have targeted regressions. Raised-risk persistence was already in
the engine; explicit agenda labels and omission safeguards address the confusion.
The reported first-click Skip ahead and silent July-to-October jump are not
independently reproduced as separate engine defects. Existing 30-day skip actions
still stop on new decisions, incidents and returned/urgent correspondence.
Broader balance and new insurance/appetite/tabletop/metrics mechanics remain
separately scoped; recovery credit does not certify prevention work.
