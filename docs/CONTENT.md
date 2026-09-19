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
