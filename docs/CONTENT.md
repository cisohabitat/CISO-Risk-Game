# Authoring campaign content

Newcomer-completion follow-through (30 October): recovery-confidence help links
to the existing entry; break-glass aliases reuse its ID, with three additional
definitions for assumed-breach tests, quarantine and change windows. Preserve
authored event/decision IDs, effects and voiced transcripts. Starter enquiries
use current public concern links and affordability, never hidden outcome quality.
Plan-confidence wording distinguishes a declared commitment from funding or
delivery; no additional score or purchase is implied.

Closing-retest follow-through (30 October): describe objective-delay effects as
risk to the original commitment; imposed delay can be absorbed by schedule float.
Do not imply `delayDays` extends the deadline or equals observed lateness.
Programme blocker multipliers distinguish slowing from stopping; a completion
receipt must not invent purchase of an unresolved fix. Budget receipts quote
actual recorded effects, without retroactively reconstructing older ledgers.
All voiced transcripts, event eligibility and effect amounts remain unchanged.
The objective probe and its limits are in `OBJECTIVE_REVIEW.md`.

Five-run follow-through (30 October): recruitment quotes a single identity hire
in 60 days, not all five vacancies. Priorities can cite delivered programmes as
well as work under way. The watch option declares controls it leaves open for
route-specific reconstruction; do not claim it alone caused an incident. Negative
choice consequences in annual accounts require observed authored return mail.
Assumption enquiry suggestions expose public examination routes, never a hidden
verdict. Accepted risk still needs disclosure, and stopped work retains sunk
cost. Voiced message transcripts and difficulty profiles remain unchanged.

Guided follow-through (31 October): delivery watch uses observed public progress
and an explicit average-pace assumption. It does not expose hidden service health,
change authored outcomes or guarantee completion. Exploration prompts concern
visible unexamined areas, not a quota of enquiries. Scenario prose, effects,
rates and voiced transcripts remain unchanged; Q1 reporting still opens after
its 13-week period on day 91 / Week 14.

All campaign content is data. Nothing about Nexora is hard-coded into a React
component or an engine module.

## Where it lives

```
src/content/nexora/
├─ meta.json            campaign identity, budget, opening briefing
├─ organisation.json    nodes, dependencies, business services
├─ people.json          executives, cyber leaders, business objectives
├─ controls.json        security controls and what they mitigate
├─ programmes.json      cyber programmes, milestones, blockers
├─ threats.json         threat actors, attack paths, incident families
├─ evidence.json        evidence items, including deliberate noise
├─ risks.json           risk scenarios, hypothesis templates, assumptions, rationale tags
├─ investigations.json  lines of enquiry, glossary
├─ decisions.json       decisions and their options
├─ decisions-year-two.json  decisions only a second year offers
└─ events/              the conditional event pool, split by theme
                        (year-two.json: what only a later year says)
```

`src/content/nexora/assemble.ts` assembles the bundle, with or without Year
Two (`year-two.ts`), and `index.ts` is both years for harnesses and tests.
`src/lib/content/loader.ts` validates it (in development) and indexes it. The
app downloads Year Two separately, when a second year begins or a second-year
save opens, so anything only a later year says goes in the two Year Two files;
`tests/content/year-two-split.test.ts` checks a first year stands on its own
and that the two put back together are the campaign in its authored order.

## The rules that make content safe

- **Conditions are data.** Events, options and lines of enquiry gate on the
  `Condition` union, never on code. See `src/game/types/conditions.ts`.
- **Effects are data.** Content changes the world only through `GameEffect`.
- **Ids are checked.** `pnpm validate:content` (on Nexora, or on any pack
  with `--pack file.json`) fails on missing references,
  duplicate ids, impossible conditions (a tag no evidence carries), unreachable
  decisions, invalid effect targets and dependency cycles.
- **Never expose hidden consequences.** `visibleKnownEffects` is what a CISO
  could reasonably foresee — "the delivery team expects a two-week impact", not
  "+20 security, −10 productivity". A test checks for the latter shape.
- **Every option buys something and costs something.** Name what the option
  gains as plainly as what it loses, and leave the verdict to the player:
  "No acquirer scrutiny, and no conversation for finance" beside "The next
  assessment will find it", not "No immediate scrutiny" beside a warning.
  Lines such as "Changes little" or "It is never only a few more weeks" tell
  the player which answer is wanted. Keep each line true to the option's
  effects; where an option really is weaker, say what it is weaker at.

## Writing an event

```jsonc
{
  "id": "evt-org-supplier-contradiction",
  "type": "supplier",
  "title": "The questionnaire was wrong",
  "from": "Callum Reid, Head of Security Engineering",
  "body": "…",
  "priority": "urgent",
  "availableFromDay": 55,
  "conditions": [
    { "kind": "evidence.known", "evidenceId": "ev-supplier-questionnaire-clean" }
  ],
  "weight": 16,          // relative likelihood once the conditions hold
  "pinned": false,       // pinned events fire as soon as they become possible
  "oncePerCampaign": true,
  "effectsOnReveal": [
    { "type": "evidence.reveal", "evidenceId": "ev-msp-no-mfa" }
  ],
  "decisionId": "dec-msp-access",
  "relatedNodeIds": ["node-sup-msp"],
  "tags": ["supplier", "identity"]
}
```

Prefer conditional events to calendar events. "Day 90 is always a supplier
compromise" is the thing the design is trying to avoid; "a supplier compromise
becomes possible when the conditions create the opportunity" is the goal. A small
number of pinned beats carry the campaign's spine and that is deliberate.

A message that can arrive more than once (`oncePerCampaign: false`) should
carry `variants`: other titles and bodies for the same event, taken in turn on
its later firings and then round again. They share the event's conditions and
effects, so each must be true of everything the original is true of, and like
the original none may state a count (`tests/content/repeats.test.ts`). A
variant only ever arrives after the original, so it may say "again".

## Writing a decision

For a temporary `capacity.change` or `node.exposure`, set
`temporary: { "dayOffset": 11, "relativeTo": "decision-opened" }` to end it
on an announced window. Omit `relativeTo` for a duration measured from the
action. The reducer queues an inverse of the actual bounded delta; do not
also author a fixed positive/negative refund in `delayedEffects`. These plain
inverse effects survive saves and year transitions, preserve other changes
and do not schedule further inverses. Delayed patch effects may also set
`relativeTo: "decision-opened"`; player choices and defaults use the same clock.
Describe the announced window, rather than a number of days that stays frozen
while the player reads. Existing content without these fields keeps its timing.

**AI acceleration changes the trade-off, not the evidence standard.** The
checkout exploit uses a fictional advisory about faster exploit development,
a shorter response deadline and existing exposure/capacity/delivery effects.
It does not identify an AI-enabled actor inside Nexora or force an incident.
Callbacks name the actual choice and check any present capability they claim;
the SOC watch uses current logging coverage. Preserve existing option IDs and
use scheduled guard flags for replies that may cross into another year.

Each option needs a label, a description, the foreseeable effects, immediate
effects and, where the point is delayed consequence, `delayedEffects`. Set
`requiresRationale` for material decisions: the recorded rationale is read back
in the annual review. Attach `assumptionIds` where the option only makes sense if
something stays true — the assumption engine will tell the player when it stops.

**Let the card state the costs.** An option's money comes from its
`budget.change` effect and its attention from `requirements.focus`, and the
dialog prints both beside the label. Do not write them into the option's words
as well ("Costs £250k", "Costs attention"): `tests/content/decisions.test.ts`
fails it. And an option that says *Nothing changes* must not move trust,
confidence, morale or money without naming who notices.
A length of time on the card ("Takes about ten weeks", "Two months before
anyone starts") is the one the option's delayed effects keep, to within a
tenth; the same test holds it. And what a card says will slip, or a later
letter says has slipped, must be an effect somebody wrote, not a flag nothing
reads.

**Say when a finding stops being true.** A letter that carries evidence is
often kept away by a situation (`not situation.is`) or by the programme that
fixes the problem (`not programme.status … complete`). Investigations carry
the same evidence without those gates, so put the same facts on the evidence
as `staleWhen`, and nothing will reveal it in a year that has made it untrue.
`tests/content/content.test.ts` fails a letter whose gate its evidence does
not share.

**Name the reasons a decision can be taken for** when the whole vocabulary
would mislead. `rationaleTagIds` on a decision limits what the dialog offers
and what the engine accepts; leave it off where most reasons are arguable, and
set it on decisions where some plainly are not — the incident decisions do not
offer "residual risk is within tolerance". Keep at least two, and prefer six or
more: the point is to remove nonsense, not to hand the player the answer.

**A decision the engine opens.** `dec-acceptance-renewal` is opened by the
tick when a temporary acceptance runs out, linked to whichever scenario it
was; no event names it, and the validator knows. Its text carries
`{{scenario}}` and its options say `"scenarioId": "linked"`, which the reducer
resolves to the decision's scenario. Author a decision this way when it is
about *whichever one it was* rather than a fixed thing.

**The back half asks what organisation you have created.** Programme follow-through
(identity enforcement and the restore window) can become eligible from day 210,
while still requiring 80% progress. Their historical `q4` IDs remain stable.
Other late-year
decisions gate on the player's own position — a programme past 80%, an
objective the business achieved while recovery was never built, a year with
no incident — rather than on the calendar alone, so an idle player meets few
of them and an engaged one meets the ones they earned. Measured before they
were written, Q4 carried 1.4 decisions to Q1's 12.4 and every one was an
incident. Keep that rule for anything added there: a Q4 decision should be
impossible to receive without having done something in Q1–Q3.

**An event gated only on the calendar is spread across the year.** The draw
paces one-shot pool events whose conditions are nothing but `always` or a
day, so that the reservoir lasts until December rather than being spent by
July; those that reveal evidence or a node are spent faster than those that
only colour. If an event's timing matters — it must land in a particular
month, or before something — say so with a condition, or pin it. A pinned
event, a decision-opening event and anything gated on state fire when they
become eligible and are never held back.

**A date in the text must hold on every day the text can appear.** An event
gated on state fires whenever the state arises, so "before the freeze" in a
decision that waits for a programme to finish was offered a month into the
freeze, and "the next meeting is in six weeks" arrived three weeks before it.
Close the window with `availableUntilDay`, word it so it holds either side, or
write `{{nextBoard}}`, which renders when the board next meets from the day
the decision opens ("in three weeks", "not until the new year"). A message
about a quiet stretch tests for it: `incident.noneWithin` and
`inbox.noUrgentWithin` take a number of days.

**Post-incident correspondence needs a specific response.** Set
`incidentContext: "latest-closed"` on a post-incident event to bind the message
and its decision to the latest closed incident when it fires. Use
`{{closedIncident}}` in its body or decision description to name that response.
A resolved-count condition alone does not mean the currently active incident
has closed. Response-phase messages and decisions record their incident IDs;
legacy messages without provenance remain readable but are not guessed into a
live journal.

**A report the player has overtaken is not sent.** A once-only message whose
every effect reveals evidence, a node or an edge the player already holds is
skipped, so a colleague does not "discover" what the player's own enquiry
found. Give a message another effect only if it genuinely changes something.

**Do not name a function the engine chooses.** A decision that fires on team
strain fires on whichever function is closest to breaking, and it was once
authored as if that were always the SOC: over 92 firings it never was. Where an
option acts on "the team under pressure", target `most-pressed` rather than a
function id — `capacity.change`, `team.morale` and `team.workload` accept it as
`fn`, and `leader.morale` accepts it as `leaderId`, resolving to that function's
leader — and write the function into the text as `{{pressedFunction}}`, which
the interface renders as its screen name. `work.stop` with `fn: "most-pressed"`
is how "stop something" stops something: it abandons the newest enquiry on that
function, or pauses its newest programme when no enquiry draws on it, and tells
the player which.

**A message that claims a state must test for it.** "A programme has stalled"
used to fire on `programme.anyActive` and was true in 27 of 93 arrivals; "ahead
of plan" was true in none, because a programme never outruns its plan. Gate on
`programme.anyBlocked` or `programme.anyOnPlan`, and if no condition kind
describes the state the message claims, add one before writing the message.

## Adding a starting situation

A situation is the year Nexora has had before the CISO arrives, in
`situations.json`: a name, a one-line summary for the start screen, an optional
`budgetDelta` (added to the year's allocation, total and remaining alike) and
`setupEffects`, which the one reducer applies before the first day. The first
situation is the usual opening and must have no effects.

A situation is felt through messages, not numbers alone. Gate them on
`situation.is`, and give each situation an opening on day one and at least one
beat later in the year (`events/situations.json`), and a decision of its own
whose every option is answered by a consequence message gated the same way —
`tests/engine/situations.test.ts` checks both that it arrives only in its own
year and that each option's reply is reachable. Then read the existing
content for anything the situation makes untrue — a tidy inheritance cannot
receive "the last restore test was abandoned" — and guard it with
`{ "kind": "not", "condition": { "kind": "situation.is", ... } }`, which is a
closing guard and leaves the message paced. If the situation poses a question,
answer it in the annual review from state.

## Writing for a later year

A finished year can lead to the next one at the same Nexora
(`src/game/engine/next-year.ts`). The world carries over. These start again:

- the inbox;
- the decisions;
- the incidents;
- the board papers;
- the budget;
- the business's plans.

Anything the first year already said is not said again: fired events carry,
so a `oncePerCampaign` event fires once across all the years.

- **Gate later-year content** on `{ "kind": "campaign.yearAtLeast", "year": 2 }`
  (`events/year-two.json`). Every event there carries it.
- **Answer last year's choices** with `lastYear.optionTaken` (a decision
  definition and an option). Decisions do not carry, so `decision.optionTaken`
  only ever reads this year. `lastYear.dimensionBand` reads last year's review,
  and `lastYear.incidentsAtLeast` its incident count. `event.fired` still
  works across years, because fired events carry.
- **Give the business its plans for the year** in `people.json` with
  `"year": 2`. A first year never builds them, and a later year builds only
  its own.
- **Guard first-year content** that would be untrue later with
  `{ "kind": "not", "condition": { "kind": "campaign.yearAtLeast", "year": 2 } }`.
  A message the first year never sent is free to arrive in the second. One
  that is about the first year's own plans, or that greets a new arrival, is
  the kind to guard: the Nordic partner and the Kestrel diligence window
  both were.
- **Read the second year whole**: `pnpm ladder transcript ciso <seed> --years 2`.
  To measure it, use `pnpm coverage 60 --years 2` and `pnpm soak 300 --years 2`.

## Adding an assumption

Add it to `risks.json` with a `validationRuleId`, then implement that rule in
`VALIDATION_RULES` (`src/game/assumptions/validation.ts`). Rules are pure
predicates over game state, which keeps invalidation deterministic and testable.
The content validator fails if a rule name does not exist.

## Control drift

Every control declares how it decays when no programme maintains it:
`driftPerDay`, a `driftKind` and a `driftFloor`. The kind matters because the
causes differ — `coverage-erosion` for controls the growing estate outruns,
`operational-decay` for capability that is still deployed but stops being
exercised, `exception-accumulation` for controls hollowed out from inside. The
floor is the share of the best level ever reached that survives unaided, so a
programme that lifts a control also lifts the level it will not fall below.

Keep floors in the 0.65–0.85 range. Lower and an idle year destroys the
organisation; higher and inaction costs nothing.

## What counts as knowing something

The player's picture has two layers. `discovered` means the entity is visible
to them — the inherited register starts most of the estate that way, and events
mention more of it as the year goes on. `verified` means they established it
themselves, through an investigation they commissioned or an assessment they
ran. Only investigation effects set it.

Author accordingly: an event that mentions a system reveals it, but does not
verify it, and it should not pretend to. If new content ought to count as the
player having examined something — a penetration test, an audit — give it an
investigation rather than an event, so the annual review can tell the
difference between what somebody was told and what they checked.

## Consequences of earlier choices

A decision option that records a flag should have something read that flag
later. The organisation is meant to remember what the player chose, and a flag
nobody consults is a choice it immediately forgets — `tests/content/content.test.ts`
fails the build on one.

Write the callback as a `scheduledOnly` event and schedule it from the option
that causes it, with an `event.schedule` effect carrying the delay. Scheduled
events fire on their day regardless of the daily draw; leaving a callback in
the weighted pool instead dilutes every other event's chance of being drawn,
which measurably cost the campaign some of its other content when these were
first written.

A callback makes an earlier choice visible. It should not charge for it again:
the cost of the choice was applied when it was made. Evidence, a stakeholder
remembering, and a line of dialogue are the right effects here; fresh exposure
or a new control weakness is double-charging.

## Teaching a mechanic

Lessons live in `src/components/game/lessons.ts`, not in the campaign JSON:
they explain how the game works rather than what is happening at Nexora. Each
one names the mechanic it `teaches` and a `when` predicate over game state.

Two tests hold the set honest. One fails if a mechanic the plan names has no
lesson. The other plays four campaigns and fails if any lesson never becomes
showable — a trigger that cannot be met teaches nobody, and nothing else in the
build would notice. Write the predicate for the moment the player first meets
the mechanic, and do not add "and they have not done the next thing yet"
clauses: one of those made the hypothesis lesson unreachable for anyone who
raised a risk scenario first.

Order in the array is priority, because only the first undismissed lesson whose
moment has arrived is shown. What is happening right now goes above standing
advice.

## Balance

`pnpm tsx scripts/tune.ts 25` plays seeded campaigns under passive, defensive,
business-first and balanced policies and reports incidents per run, clean-year
rate, worst consequence, objectives achieved, board confidence and programmes
completed. Use it after changing rates or costs; the soak test in
`tests/engine/soak.test.ts` enforces the outer bounds.

## Checking content is actually reached

`pnpm coverage 60` plays campaigns under two policies and reports which authored
content a player encounters and which mechanics ever fire. Authoring an event
nobody sees is the same as not authoring it, and a gate set slightly too tight
is invisible without this.

It lists anything never reached. At the time of writing a campaign reaches 98%
of events and 96% of decisions. Two pieces remain unreached under the harness's
policies: `evt-thr-detection-worked`, which needs telemetry coverage a player
only gets well into the detection programme, and the pair
`evt-org-programme-tradeoff` / `dec-programme-tradeoff`, which need two
specific programmes running at once. Both are legitimately gated on particular
play rather than unreachable, but they are worth re-checking after any change
to the gates or to the rates that drive them.

## Starting a second campaign

Nexora is the only organisation, but nothing in the engine or the screens
knows its name: a second organisation is a second pack. Phase 2 of
`docs/ROADMAP.md` waits on Phase 0's playtests before one is written; this is
how to write it when it is.

1. **Start from a file.** `pnpm content:bundle hospital.json` writes Nexora as
   a single pack in the shape every content script reads. Change `meta.id`,
   `meta.title` and the organisation's name in `meta`, and keep the file
   valid as you replace it — a pack that fails halfway is harder to finish
   than one that never stops passing.
2. **Point your editor at the schema.** `docs/content/campaign.schema.json` is
   generated from the same schema the game validates with (`pnpm
   content:schema` regenerates it, and a test fails if it falls behind). Add
   `"$schema": "../docs/content/campaign.schema.json"` while writing and your
   editor will check field names and shapes as you type; remove it before
   validating.
3. **Replace the organisation first, then everything that points at it.**
   Nodes, edges and services; then controls, attack paths and risks that
   name nodes; then people; then programmes, evidence, enquiries, decisions
   and events. `pnpm validate:content --pack hospital.json` names every
   reference that no longer resolves, every condition nothing can satisfy and
   every decision nothing opens.
4. **Write in the voice.** `docs/VOICE.md` is the register; the same command
   applies its mechanical rules to every string and fails on a breach. It
   cannot tell whether a consultant sounds like a consultant — read the
   messages aloud.
5. **Size it.** The same command reports the pack against the content budget
   (plan §4.3). Short lines are warnings, not errors, but a year needs
   roughly what Nexora has.
6. **Check it plays.** `pnpm soak 200 --pack hospital.json` for crashes and
   broken invariants; `pnpm coverage 60 --pack hospital.json` for what a
   player actually reaches. Aim for the same reach as Nexora (98% of events,
   96% of decisions).
7. **Then put it in the game.** A pack lives beside Nexora under
   `src/content/<id>/`, split by section the way Nexora is, with its own
   `index.ts`; the loader and the start screen choosing between packs are the
   last step, not the first.

What the pipeline cannot check is whether the organisation teaches something
Nexora does not. Pick a sector where the lesson differs — a hospital puts
safety and a regulator where Nexora puts payments and growth — and ask two
players who finished a Nexora year which lesson was new.

## Authored appetite delegation

An option may carry `riskAppetite: { statement, delegatedResidualCeiling }` with
one of the five public residual bands. A resolved selection records the adopted
working delegation; no new save field, hidden assessment, control effect or
purchase is implied. Current selections take precedence over previous-year
choice history; a deferral option omits the metadata and preserves an earlier
adoption. Historical records do not provide an adoption day. With multiple
policy choices in one year, authors should use one replacement decision: annual
history retains selected options but not their resolution ordering.

Board and acceptance UI compare the last recorded public assessment to the
boundary. No assessment means unknown, never within appetite. Accepted risks
remain material; paper feedback adds context to the existing omission penalty,
not another charge or an approval record. Schedule follow-ups with conditions
that remain true on delivery. Do not attach `decisionId` to an existing texture
letter merely to open discussion: that reclassifies its pacing. Keep voiced bodies
unchanged and use a scheduled discussion when extending an existing request.

Use optional event `followUp: true` to classify an authored return for Briefing,
Inbox and Skip ahead without adding spacing tags. This presentation metadata
does not change event eligibility, RNG draws or the scheduled delivery date.

## Checkpoint and reconstruction records

`programme.review` records the current allocation, public delivery percentage and
status for the referenced programme in history. A message containing
`{{programmeReview:<programme-id>}}` renders that day's recorded outcome. This
records a checkpoint; it does not fund, complete or close an audit finding. Old
unrecorded checkpoints stay unknown. Actual snapshots carry in the optional
`YearRecord.programmeReviews` field, with their original year/day; validate these
records on import and never invent them for legacy saves. The published schema and deferred-save
validator accept only registered programme references.

An option may declare `unaddressedControlIds` to identify a control gap it leaves
carried. Reconstruction names that recorded choice only before impact, on the
used route, while the declared control still has a gap at reconstruction. This
metadata changes no effects, rates or score. Do not infer an evasive choice from
its label or claim that it alone caused an incident. Same-day ordering is not
recorded, so exclude same-day choices from these attributions. Defaults remain defaults.
