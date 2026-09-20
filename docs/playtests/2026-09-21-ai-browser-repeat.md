# CISO: First Year, repeat browser playtest

## Verdict

The revised briefing communicates consequences better. The new team-health note and returned-work section materially improved this run. The annual review, however, contradicted three recorded actions or outcomes. Correcting those contradictions should take priority over further balancing or adding content.

This is one repeat-player AI session, not a human usability study. The observations establish what appeared on screen, not how often human players would encounter or interpret it.

## Session record

| Item | Detail |
| --- | --- |
| Site | https://ciso-risk-game.vercel.app/ |
| Difficulty and seed | CISO, `quarry-5813` |
| Start | 20 September 2026, 23:13:07 UTC; 21 September, 07:13 Singapore time |
| End-Q3 checkpoint | Elapsed 08:01, quarter-end stop on 1 October |
| Annual review | Elapsed 12:30, approximately 23:25:37 UTC |
| Protocol | Default-branch `docs/PLAYTEST.md`, SHA `f789a551af47d4e6ed0a62bcf15335b30eba65ff` |
| Method | Fresh campaign after reloading the deployment; normal visible UI interactions and live commentary |
| Boundaries | No game source, hidden application state, network payloads, or simulation harness inspected during play |
| Comparison limits | Same seed and broadly similar early choices, but not a controlled replay: event timing diverged, a team review and late hunt were commissioned, and the live production-restore option was selected |

The updated protocol explicitly asks about team health at Q3. That question was answered before continuing Q4. Prior experience and the protocol's discussion of known weaknesses prevent this from being a blinded first-time test. Runtime includes tool and commentary overhead and is not a human reading-speed benchmark. Only directly measured elapsed times are presented as exact checkpoints.

## What improved, with observed evidence

| Change | What happened in this run | Assessment |
| --- | --- | --- |
| Team-health note in briefing | Engineering was shown as strained in January and burning out in February. The warning persisted even when weekly capacity became available. | The previous misunderstanding was resolved in this repeat session. Burnout was anticipated at Q3. Human validation remains necessary. |
| Came back to you section | Used it to read the thin service review, launch follow-up, CEO and COO feedback, audit follow-up, team and architecture enquiries, identity outcome, restore outcome and incident-command follow-up. | Clear improvement in discovering consequences. |
| Board-agenda guidance | Paper explicitly explained that four emerging risks were excluded until raised from the Risk screen. | Previous eligibility uncertainty resolved. |
| Finance request | Now requested £220k, or a named line worth half, and explained that Finance would take what remained if funds were insufficient. | The earlier percentage/amount contradiction was absent. |
| Empty decision wording | Changed to No decision is open. | More precise, although Nothing needs an answer still appeared beside a due board paper and during initial incident escalation. |
| Opening CEO timing | Main explanation acknowledged the days taken after a morning's notice. | Improved, but the option description still referred to having had one morning. |
| Assumption reminders | No unsupported reminder was encountered in the inspected messages; Assumptions remained empty. | Previous issue did not recur. This run does not prove every reminder condition is correct. |

## High-priority annual-review contradictions

These are directly observed inconsistencies, not inferred engine diagnoses. The relevant evidence was visible in the same campaign. A source investigation should determine whether the defect is in state updates, scoring, narrative generation, or the relationship between them.

### 1. Incident command was established, but the review says it was not

- Day 306: supplier-driven disruption escalated.
- Day 307: selected **Stand up incident command now** and committed it.
- The active incident panel immediately listed that decision under What you have already decided.
- Day 325 follow-up, **What standing up command changed**, explicitly credited formal command and the recorded handovers and decision times.
- Annual review's judgement list again recorded **Day 307 Incident command: Stand up incident command now**.
- Nevertheless, both the annual narrative and incident reconstruction listed **Incident command was never formally stood up** under what hurt.

This is a direct factual contradiction. A player should not be criticised for failing to take an action that the same review records as taken.

### 2. Production recovery was exercised, but the review says it never was

- Day 275: selected **Take the window now** for the four-hour production restore test.
- Day 305 follow-up, **The restore came back in three and a half**, said the restore took three-and-a-half hours and the runbook held. The COO said she had told the CEO.
- Annual review's judgement list recorded the live-test choice.
- The Resilience section nevertheless said **Recovery was never exercised**.
- The next line said **2 of 2 recovery controls carried assurance you established yourself**.

The negative statement does not match the decision, its explicit result, or the adjacent assurance statement. If the metric counts only one particular enquiry type, the wording should not claim that no exercise occurred. That is a possible explanation to investigate, not a confirmed cause.

### 3. Recovery was a central investment, but prioritisation says nothing addressed it

- Day 1: funded **Ransomware resilience and recovery** with £700k and the COO as sponsor.
- Linked **Recovery fails when it is needed** to treatment.
- Programme completed on day 173, shown as 100% delivered in the annual review.
- Day 275: took the production restore window; successful follow-up on day 305.
- Nevertheless, the review said **Recovery fails when it is needed was among the largest risks you inherited, and nothing you did went near it**.

That claim conflicts with the campaign's principal investment and subsequent verification. Prioritisation also highlighted **Build pipeline used as a route into production**, which was not a consciously selected priority in this run. The attribution should be checked rather than assuming the displayed explanation is accurate.

## Incident experience and remaining usability issues

### Incident onset and navigation

The red incident banner was prominent. On day 306 it said an incident was active and not contained, while the briefing said Nothing is waiting on you today and No decision is open. The response choices appeared on day 307. There should be a clear distinction between awaiting the next incident update and having nothing requiring attention.

**Open the response log** navigated to Inbox while retaining an old selected message about an unused classification tool. The escalation message had to be selected manually. The label implies a more specific destination than was delivered.

During containment, the large incident panel obscured the lower Decide control. Browser interaction with that lower control could not complete. A fresh screenshot showed the panel over the underlying briefing; the decision button inside the incident panel worked immediately. This was recoverable, but the duplicate action locations were not equally usable at that scroll position.

### Skip ahead passed over the incident's conclusion

After incident command and cutting third-party access on day 307, one Skip ahead advanced to day 322. The active panel was gone. The consequence, recovery, debrief and closure updates remained in Inbox, rather than appearing as a clear closing summary in the briefing.

Their messages were sparse:

- Day 311: actor pushed out; damage being counted.
- Day 314: recovery update listed in Inbox.
- Day 321: services restored; time to reconstruct events.
- Day 322: post-incident review complete.

An **After the incident** decision appeared on day 323, and a command follow-up appeared on day 325. Thus follow-up was not entirely absent. The gap was that the most consequential transition from active response to restored services could be skipped without a useful summary of impact and recovery.

### Returned work is visible but often too generic

Both the architecture review and team capability review said they answered part of the question and raised others. The hunt said it produced a solid, usable picture. These messages did not themselves explain the findings, what changed, or where to inspect the result.

The team review was commissioned specifically because burnout was visible. Its return did not help the player identify a remedy or interpret the likely recovery path. The Evidence screen was also inspected, but no specific new team-review result was identified there.

The launch follow-up said some conditions had not been met and referred to a list. No list was visible in that message. Stronger delivery of a message does not resolve missing actionable detail inside it.

### Completion versus assurance still needs clearer wording

At midyear the recovery programme was 100% complete with **Restore tested end to end** checked. In October the production-window decision said the capability had never been run against production. These can describe different scopes of testing, but the milestone did not communicate that distinction. Name the scope so that a completed programme does not imply production assurance prematurely.

The October live-test result was not actually missing: it arrived on day 305 and was surfaced in Came back to you. An earlier live observation queried its absence; the later result resolved that concern. It took 30 game days to appear, so a pending-result cue may still help.

### Other unresolved questions

- A £140k recruitment decision still followed the £120k Engineering recruitment action without explaining their relationship on the decision screen.
- Budget increased from £20k to £80k during Q3 without an explanation noticed in the briefing. A procurement message about an unused tool was later found, but this playtest did not establish the causal link.
- Many low-confidence signals and drift notices remained outside the surfaced decision/follow-up flow. The inbox still requires deliberate triage, which may be intended. The important question is whether players understand that requirement.

## Timestamped observations

| Elapsed checkpoint or interval | Game point | Observation |
| --- | --- | --- |
| 00:00 | Day 1 | Started CISO with the same seed; chose business services; funded recovery and identity. |
| 00:54 | Day 5 | Read revised CEO timing text. |
| 00:54–02:36 | Days 20–45 | Read service-review result through Came back to you. Engineering warning progressed from strained to burning out. Bought capacity, then saw burnout persist. |
| 02:36 | Day 45 | Team screen showed Engineering committed at 3 of 4.5 days, while burning out. Capacity and health were distinguishable. |
| 02:36–04:50 | Q1 paper and early Q2 | Board eligibility explanation understood; launch follow-up surfaced; supplier hypothesis raised. |
| 04:50 | Day 120 | Budget prevented preferred SOC scope rewrite. Renewed as-is; read CEO/COO follow-ups. |
| 04:50–05:45 | Days 150–182 | Finance wording reconciled with options. Supplier-access decision arrived earlier than prior run. |
| 05:45 | Q2 boundary | Completed recovery programme still showed Limited recovery confidence. Commissioned architecture and team reviews. |
| 05:45–07:27 | July to August | Generic enquiry returns gave little specific guidance. Refused acquisition connection and disclosed card-data issue. |
| 07:27 | Day 238 | Available capacity and Engineering burning out shown together. Repeated risk descriptions increasingly skimmed. |
| 08:01 | Q3 boundary | Recorded year narrative and explicit team-health prediction before the review. |
| 08:01–09:10 | Days 275–300 | Took production restore window; defended next year's budget; found low-confidence anomaly on inbox inspection. |
| 09:10 | Day 300 | Commissioned targeted threat hunt with the remaining £80k budget. |
| 09:10–11:45 | Days 306–322 | Incident escalated; response-log navigation unclear; established command and cut all third-party access; Skip ahead passed through incident closure. |
| 11:45 | Day 322 | Read successful restore result, hunt return and sparse incident closing messages. |
| 12:30 | Annual review | Review contradicted command, recovery exercise and recovery investment. Team-health headline was expected. |

## Q3 account, recorded before Q4

> This year has been about funding recovery and identity early, then accepting business disruption because I could not afford every safer alternative. The enforcement follow-up now gives me visible evidence that one investment worked. Detection and independent assurance remain weak.
>
> How is the team doing? Engineering is still burning out, even though current capacity is available. I do not regard them as recovered. I expect team sustainability to be a weakness in the annual review, alongside limited investigation and the acquisition delay. That outcome would no longer surprise me.

## Q3 account compared with the annual review

| Expectation at Q3 | Annual review | Interpretation |
| --- | --- | --- |
| Two delivered capability programmes | Two of two completed; programme execution strong | Agreed. |
| Engineering burnout despite available capacity | Team sustainability weak; Engineering and Cyber Risk burning out | Engineering outcome anticipated. Cyber Risk was not specifically predicted. The briefing principally named Engineering, while the final review named both. |
| Limited investigation and assurance | Risk understanding developing; 9 of 30 things examined, 5 of 13 controls independently assessed | Broad agreement. Some assurance was added after Q3. |
| Acquisition delay and business friction | Three of five objectives met; acquisition and cloud migration failed | Acquisition expected; cloud failure less explicitly anticipated. |
| Recovery was a principal priority | Review said nothing went near recovery risk | Contradiction, not a useful difference of interpretation. |
| Quiet year did not imply safety | Supplier incident occurred in Q4 and was reconstructed at year end | Useful consequence after the Q3 statement, although command attribution was wrong. |

## Answers to the protocol's five questions

1. **Where did understanding break down?** In generic enquiry results, the scope of completed recovery milestones, and incident navigation. The final review then introduced factual contradictions rather than merely challenging the player's judgement.
2. **Where did engagement decline?** Repeated top-risk prose was skimmed in late Q3. The incident re-engaged the player in Q4. Its rapid transition to closure weakened the sense of a sustained response. These are AI interaction observations, not measurements of human boredom.
3. **What was missed?** Low-confidence anomalies, routine drift notices and some urgent inbox material. Important returned work and the identity payoff were noticed more reliably than before. Incident closure details still needed a deliberate inbox visit.
4. **Which decisions caused hesitation?** Capacity relief, an unaffordable SOC improvement, acquisition integration without quarantine funding, and the production recovery outage. During the incident, broad supplier isolation imposed a clear operational trade-off, although the options gave little detail about known implicated accounts.
5. **Did the year account match the review?** It matched the burnout theme and capability/business trade-offs much better. It did not match the review's inaccurate claims about command and recovery.

## Final campaign outcome

- Overall: **Credible first year**.
- Headline: **You built the capability on people who cannot do it again.**
- 25 decisions, all answered; 15 recorded rationales.
- Two programmes started and completed.
- Four enquiries commissioned: service review, dependency review, team capability review, targeted hunt.
- Three board papers prepared.
- Three of five business objectives achieved.
- One material incident: supplier-driven disruption, day 306 to 322, Order Fulfilment, elevated consequence.
- Reconstruction route: Lattice Logistics → Order Management System → Order Fulfilment.
- Communication strong; team sustainability weak; risk understanding developing.

## Suggested Known weaknesses entries

Prepared for maintainer review; no repository or game changes made during this task.

- **Annual-review attribution contradicts recorded command.** In one repeat AI browser session, day-307 formal command and a positive day-325 follow-up coexisted with a review claiming command was never established. Verify the state and narrative connection before adjusting scoring.
- **Recovery actions are not consistently recognised in the review.** In one session, a completed £700k recovery programme, successful production restore decision and assurance evidence coexisted with claims that recovery was never exercised and nothing addressed its risk. Verify all legitimate action routes against review statements.
- **Incident closure is easy to skip past.** In one session, Skip ahead moved from containment decisions to closure, leaving material updates in Inbox and no closing briefing summary. Test a human's understanding immediately after that transition.
- **Returned-work visibility improved, but content can remain opaque.** In one repeat AI session, the player read substantially more follow-ups through Came back to you; generic enquiry-result text still did not explain what was learned. Test whether a specific finding and destination for its evidence make the result usable.
- **Team-health visibility improved; remediation remains uncertain.** The repeat AI player predicted Engineering burnout correctly at Q3 after seeing the new note. They could not determine from the team review how to restore sustainability. This does not settle the protocol's human-test question.

## Recommended order of work

1. Correct the three review contradictions and verify the review against the visible decision record.
2. Make incident response-log navigation land on the incident, and make incident closure/impact visible after Skip ahead.
3. Replace generic enquiry returns with specific findings and links to the resulting evidence or changed assessment.
4. Clarify recovery milestone scope and the difference between current team capacity and sustainable team health.
5. Run human sessions before changing risk bands, difficulty, event frequency or delayed consequences.

No conclusion is drawn about Guided or High Pressure, other seeds, mobile/iPad layouts, or statistical difficulty balance. A brief screenshot was used only to diagnose the incident-panel obstruction.
