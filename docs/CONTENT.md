# Authoring campaign content

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
└─ events/              the conditional event pool, split by theme
```

`src/content/nexora/index.ts` assembles the bundle;
`src/lib/content/loader.ts` validates it (in development) and indexes it.

## The rules that make content safe

- **Conditions are data.** Events, options and lines of enquiry gate on the
  `Condition` union, never on code. See `src/game/types/conditions.ts`.
- **Effects are data.** Content changes the world only through `GameEffect`.
- **Ids are checked.** `pnpm validate:content` fails on missing references,
  duplicate ids, impossible conditions (a tag no evidence carries), unreachable
  decisions, invalid effect targets and dependency cycles.
- **Never expose hidden consequences.** `visibleKnownEffects` is what a CISO
  could reasonably foresee — "the delivery team expects a two-week impact", not
  "+20 security, −10 productivity". A test checks for the latter shape.

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

## Writing a decision

Each option needs a label, a description, the foreseeable effects, immediate
effects and, where the point is delayed consequence, `delayedEffects`. Set
`requiresRationale` for material decisions: the recorded rationale is read back
in the annual review. Attach `assumptionIds` where the option only makes sense if
something stays true — the assumption engine will tell the player when it stops.

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
