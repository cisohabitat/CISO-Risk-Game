# Owner-supplied product-manager feedback — received 29 October 2026

Source: the owner supplied the report below in chat as “playtest from product
manager”. It describes two completed campaigns; do not assume these were a
continuation into Year Two. The participant's two runs are not two independent
participants. Build, seeds, session dates, device/browser, assistance, recording
and independence from the earlier supplied reports were not provided. Mobile was
explicitly untested. No save, screenshots or session logs accompany the account.

| Run | Reported setup / approach | Reported outcome |
|---|---|---|
| 1 | The inherited mess, CISO; passive | Mixed first year; two supplier ransomware incidents through the same route; nine lapsed decisions |
| 2 | After the breach, Guided; active, early enquiries, raised risks/Q1 paper, recovery funding | Credible first year; no incidents |

Mode, starting situation and approach all changed; seeds are unknown. These runs
cannot isolate the effect of play style or establish that the active strategy
caused the difference. The player's positive interpretation remains feedback,
not a matched-policy experiment. Do not add these sessions to an independent
pilot denominator without the missing protocol information.

## Report as supplied

> I played two full years of CISO: First Year. The core is strong: the decisions are realistic and the year-end review that replays your choices is the best part. What holds it back is how it plays the first time. The clock punishes slow readers, the board rules only make sense after you fail them, and the review's stats contradict themselves.

### My two runs

> Run 1 (The inherited mess, CISO difficulty): I played passively and got a "Mixed first year". Two supplier ransomware incidents came in through the same route, and 9 decisions lapsed while I was on other screens.
>
> Run 2 (After the breach, Guided): I played actively. I commissioned enquiries early, raised risks and put them in the Q1 board paper, and funded the ransomware recovery programme. That run had no incidents and got a "Credible first year". The outcomes really do follow from your choices, which is the main thing the game needs to get right.

### What's working

> The dilemmas feel like real CISO calls: standing supplier access, an unpatched legacy platform, connecting an acquisition, and enforcing MFA before peak trading. The trade-offs are shown up front.
>
> The game tracks the reasons you give for each decision and plays them back at year end, for example "You leaned on this 6 times. On 1 of them the assurance underneath it turned out not to hold." That's the hook.
>
> Delegation shows who has room for more work, and warnings can be traced to incidents 36 to 108 days later. Cause and effect are easy to see.
>
> The writing is sharp and the security content is accurate. Replay is well supported through seeds and campaign export.

### Biggest problems, in priority order

> The clock doesn't pause for new decisions or incidents. At 4× speed, about three months passed in under three minutes while I was on another screen, including two full incident responses whose decisions lapsed. The "A decision is due" pill is easy to miss. I'd pause automatically on incidents and new decisions, at least on Guided.
>
> Board papers are a trap the first time. In Q1 nothing can go on the agenda until you raise risks yourself. In Q2, items labelled "Required: material to this committee" are unticked by default, and submitting them that way earns a penalty. Required items should be ticked by default, or the paper should block submission with a reason.
>
> Nothing explains the loop. There are seven interlocking screens and a lot of reading before you understand what a week is for. The coaching banners such as "Evidence is not risk" and "A first quarter, in three questions" help a lot. More of those at the start would do more than the player's guide.
>
> Giving a reason switches from optional to required without warning. The first decision says "(optional)", and after that the button reads "Record why first".
>
> Spare attention costs nothing. In my passive run, most weekly attention went unused with no penalty or prompt.

### Bugs to file

> The annual review says "38 of 38 systems were ever brought into view" and also "9 material systems and dependencies were never discovered".
>
> The count of missed board papers is wrong. I skipped three and it reported two, and there's a grammar slip in "1 quarterly reviews prepared".
>
> The decision count is off: "18 taken, 9 decided for you" doesn't match the 27 entries listed.
>
> Run 1 rated Resilience "solid" even though two incidents came through the same unfixed route and recovery was never exercised.
>
> After the game said "Board confidence rose", the header still showed "Neutral".
>
> The Inbox badge stays at "9+" even after you open messages.
>
> The incident card has an empty grey placeholder, and the start-screen hero image didn't load the first time.
>
> The "After the breach" scenario reuses the default opening text, "no picture of your own".
>
> "Words: MFA" glossary tags read like raw data fields rather than finished copy.
>
> I didn't test mobile. The browser console was clean apart from one minor warning.
>
> If it helps, I can turn this into a prioritised backlog or a Page you can share with the team.

The final offer is part of the supplied report. It is not an instruction to
create a Page, share material or contact a team.

## Source triage — 29 October 2026

No browser reproduction, engine experiment or human retest was run for this
report. Earlier newcomer/CISO records remain separate. The played build is
unknown; source may contain later fixes the participant did not see.

| Issue / priority | Current source evidence and limits | Next investigation / acceptance task |
|---|---|---|
| Clock/default decisions — highest correctness priority | [Tick](../../src/game/engine/tick.ts) already adds incident pauses when incidents begin and when response interrupts occur, and a deadline pause when an authored event opens a decision. It applies paused state/speed at the tick's end. [UI clock](../../src/components/game/useGameClock.ts) drives interval callbacks; [advance](../../src/game/engine/orchestrator.ts) stops on pause reasons. This does not reproduce the reported unattended multi-month run. | Capture build/save, starting day, screen, speed and inputs. Test 4× callbacks around new decisions/incidents, delayed React effect cleanup, queued advances, resumed time and background-tab transitions. Verify the day stops and stays stopped until a deliberate resume; preserve the distinction between engine pause policy and UI timing. Do not merely add pause flags that already exist. |
| Required board items omitted — confirmed source mismatch in the guard/label | [BoardScreen](../../src/screens/board/BoardScreen.tsx) starts topics from a draft or an empty list, labels material topics Required and allows submission without requiring those selections. [Quarter assessment](../../src/game/debrief/quarter.ts) applies a missing-material-item penalty. Material items include more than raised risks; an empty Q1 agenda is not a universal rule. | Propose explicit informed submission: explain omissions before accepting the paper, or preselect material topics with visible player control. Verify the paper says what will be submitted and which omitted items matter. Preserve optional agenda items and do not silently overwrite drafts or force every prior-quarter item onto the new agenda. |
| Systems versus dependencies — wording ambiguity, not established arithmetic error | [Review](../../src/game/debrief/review.ts) counts discovered existing nodes for the 38-system line. [Blind spots](../../src/game/knowledge/discovery.ts) also counts undiscovered dependencies; knowing both endpoints does not discover the link. Thus 38/38 nodes and nine hidden dependencies can coexist. | Split system and dependency counts explicitly and label known-but-unexamined items separately. Reconcile exact entity IDs in the saved run before claiming a calculation bug. |
| Decision count — reported numbers can reconcile | [Selectors](../../src/store/selectors.ts) separates deliberate choices from defaults; [decision history](../../src/screens/debrief/DebriefScreen.tsx) includes both and labels defaulted entries. Eighteen plus nine equals 27. | Label the total, player-made and defaulted subsets together, then compare record IDs, not just definition names. If a real mismatch remains, reproduce it; do not change the count simply because the current wording confused the player. |
| Missed paper count and singular grammar | [Tick](../../src/game/engine/tick.ts) opens three quarterly-paper windows and records a missed paper at the following boundary. The reviewed [annual evidence string](../../src/game/debrief/review.ts) unconditionally says quarterly reviews prepared, confirming the singular grammar defect. The reported 3-versus-2 mismatch is not reproduced. | Reconcile offered windows, submitted records, missed records and year-end rollover on the same save. Cover zero/one/multiple papers and singular/plural copy. Keep a prepared draft distinct from a submitted paper. |
| Resilience Solid after repeated incidents | [Resilience calculation](../../src/game/debrief/review.ts) uses worst incident consequence when incidents occurred; the unexercised-capability ceiling applies to quiet years. It does not directly deduct for repeated route entry. Solid recovery/resilience is therefore not proof that prevention or recurring exposure was handled. | Inspect incident consequences, closure and the printed dimension evidence. Explain prevention versus recovery versus recurrence. Any change to assessment semantics or ceilings needs a separate calibration proposal, not an automatic penalty inferred from one report. |
| Confidence rose, still Neutral | Current [reaction text](../../src/store/decision-reactions.ts) distinguishes movement within a band from crossing it, following the earlier newcomer fix. The participant's build is unknown. | Retest on the identified build; preserve qualitative bands and do not reopen a closed source issue solely because an undated report quotes older wording. |
| Inbox 9+ remains after reading | [AppShell](../../src/components/layout/AppShell.tsx) caps the displayed unread count above nine. Reading from 30 down to 20 still displays 9+. A stable Unread-filter list is separately intentional. | Verify actual unread IDs/count before and after marking a message read and while crossing ten to nine. Expose the full count accessibly or explain the cap; retain stable Unread membership and do not auto-read the next message. |
| Optional versus required reasons | Current [DecisionDialog](../../src/components/decisions/DecisionDialog.tsx) labels required reasons and uses Record why first to route focus to them; requirements vary by authored decision. Existing regressions cover the platform-launch requirement. | Explain why material decisions require a recorded reason before the player chooses. Check the exact decision and build rather than assuming every reason should be mandatory or optional. |
| Weekly loop and unused attention | The [attention lesson](../../src/components/game/lessons.ts) says unused attention does not carry over; [tick](../../src/game/engine/tick.ts) restores the weekly allowance. Forgone investigation/treatment is an opportunity cost, not necessarily a direct penalty. | Teach one concrete evidence → enquiry → judgement → delivery/review loop, with a weekly refresh explanation. Test whether newcomers can name their next useful action. Do not add a mechanical penalty merely for having spare attention. |
| Artwork missing/grey placeholder | [Title artwork](../../src/screens/start/StartHero.tsx) has a fallback so image failure does not block play. The report alone does not establish whether the incident surface was an image load, an empty state or a loading boundary. | Record screenshot, image URL/status, screen/incident phase, connection/cache conditions and build. Test first load, slow/failing asset responses and retry/recovery; distinguish recoverable fallback from a broken image source. |
| After-breach opening copy | The initial [decision](../../src/content/nexora/decisions.json) uses the common inherited-backlog/no-picture description. Starting situations have additional authored correspondence and choices. | Review the opening against the selected situation without implying that being post-breach gives the new CISO verified knowledge. Make scenario-specific context recognisable while retaining the immediate decision. |
| Words: MFA copy | [Terms](../../src/components/game/Terms.tsx) explicitly renders the Words prefix before glossary links. | Replace the raw-field tone with a short, understandable reference label, retaining keyboard access and the exact glossary target. This is a presentation edit, not a content/mechanics expansion. |

## Follow-through priorities

1. Reproduce the clock/default hazard, including stale/queued UI ticks after a
   pause. Preserve build-identified saves and traces; do not explain it away
   merely because engine pause flags exist.
2. Make material board omissions an informed act before submission. Investigate
   paper-count records and repair the confirmed singular grammar.
3. Make review totals reconcile visibly: systems/dependencies, deliberate/default
   decisions and offered/submitted/missed papers. Clarify resilience's scope.
4. Teach the weekly loop and attention refresh; review scenario opening copy,
   reference wording and asset failures. Preserve the choice/reason replay,
   realistic dilemmas, delegation and incident provenance the participant valued.

These topics overlap earlier reports, but participant independence, build equality
and controlled setup are unknown. Keep them as converging reported concerns,
not three independently reproduced failures or causal proof of learning gains.
No gameplay, pause policy, assessment, balance or Page-sharing change was made by
recording this report. Pilot gates and roadmap grades remain open.

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
