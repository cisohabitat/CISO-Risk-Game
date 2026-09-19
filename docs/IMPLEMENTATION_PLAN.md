# CISO: First Year
## Frontier AI Implementation Plan

**Document status:** Build specification for vibe coding  
**Target:** Single-player responsive web game  
**Platforms:** Desktop/PC, iPad/tablet, mobile phone  
**Primary role:** Player is always the CISO  
**MVP campaign:** One fictional organisation, one simulated year  
**Core purpose:** Teach cyber risk judgement through gameplay, not cybersecurity trivia
**Hosting constraint:** The complete MVP must deploy and run on Vercel Hobby/free without requiring paid Vercel infrastructure
**Commercial note:** Vercel Hobby is for personal/non-commercial use. A commercial or organisational production deployment must move to an appropriate paid hosting plan.

---

# 1. Product Vision

Build a single-player cyber risk strategy game in which the player inherits an imperfectly understood organisation as its new CISO.

The player must:

- discover what actually matters to the business;
- distinguish findings from material risks;
- form and test cyber risk hypotheses;
- prioritise scarce resources;
- influence executives they do not control;
- build cyber capability over time;
- make decisions under uncertainty;
- record the assumptions behind material decisions;
- manage a cyber team with finite capacity;
- support business objectives rather than merely minimise risk;
- experience delayed and sometimes unexpected consequences;
- learn from incidents without the game reducing every outcome to "correct" or "wrong".

The game should make the player think:

> I cannot fix everything. I need to understand what matters, decide what deserves attention, influence the organisation, and live with the consequences of my judgement.

The central design test for every feature is:

> **Am I managing cyber risk, or merely answering cybersecurity questions?**

If a feature primarily resembles a quiz, compliance checklist, or awareness module, redesign or remove it.

---

# 2. Product Principles

## 2.1 The player is a CISO, not a hacker

The player should never spend the main game performing technical exploitation, packet analysis, malware reverse engineering, or SOC analyst tasks.

Technical evidence exists, but it is presented at the level necessary for executive cyber risk decisions.

## 2.2 The organisation is alive

The world must continue to evolve because of:

- business projects;
- organisational dependencies;
- cyber programmes;
- staff capacity;
- supplier decisions;
- control effectiveness;
- changing threats;
- player choices;
- hidden conditions;
- previous assumptions.

Events should not feel like unrelated scripted quiz questions.

## 2.3 Findings are not risks

A vulnerability, audit finding, security alert, unsupported system, supplier exception, or failed test is evidence.

The player must interpret evidence and decide whether it creates a meaningful risk scenario.

## 2.4 Information is a resource

The player cannot investigate everything.

Investigations consume:

- time;
- staff capacity;
- budget;
- CISO attention.

Sometimes the correct strategic choice is to investigate further. Sometimes delay creates additional exposure.

## 2.5 Outcomes are probabilistic

Good decisions do not guarantee good outcomes.

Poor decisions do not always cause incidents.

The simulation must distinguish:

- decision quality;
- resulting outcome.

The debrief should explain both.

## 2.6 Cybersecurity enables business

The game is not won by driving every risk toward zero.

The organisation has goals. The CISO must help it achieve those goals while keeping cyber risk within acceptable bounds.

## 2.7 Controls have effectiveness, not merely presence

"MFA exists" is not enough.

Controls should have characteristics such as:

- coverage;
- configuration quality;
- adoption;
- maturity;
- implementation progress;
- monitoring;
- exceptions;
- dependencies;
- degradation.

## 2.8 Assumptions matter

Material decisions may depend on assumptions.

Examples:

- system will retire in six months;
- supplier has no privileged access;
- recovery completes in four hours;
- legacy environment is isolated;
- MFA covers all external administrators.

The simulation should invalidate assumptions when the world changes and automatically prompt reassessment.

## 2.9 No visible universal "cyber score"

The internal engine may use numeric values, but the player should mainly see meaningful qualitative information.

Avoid interfaces such as:

- Security = 82/100;
- Risk +12;
- Influence -5.

Prefer:

- Board confidence: Strong;
- Team capacity: Stretched;
- Recovery confidence: Limited;
- Residual exposure: Elevated.

---

# 3. Vercel Hobby / Free Hosting Constraint

Treat Vercel Hobby/free as a **hard MVP architecture constraint**. The game must not merely be deployable to Vercel Hobby in theory; its normal play loop must avoid Vercel metered compute entirely wherever practical.

## 3.1 Static-first requirement

The production MVP should be a static client application.

Required properties:

- all core simulation runs in the browser;
- all authored scenario content ships as static JSON/TypeScript assets;
- save/resume uses IndexedDB locally;
- no server-rendering is required for gameplay;
- no Vercel Function is required for a player to start, play, save, resume, or complete the campaign;
- no cron job, queue, workflow, websocket, or background worker is required;
- no runtime database is required for MVP;
- no paid API is required for MVP;
- deployment should continue to work if all optional backend integrations are removed.

The desired hosting profile is therefore:

```text
Browser
  |
  +-- Static HTML/CSS/JS from Vercel CDN
  |
  +-- Pure TypeScript simulation in-browser
  |
  +-- IndexedDB save data on device
  |
  +-- Static authored scenario/content bundles

No required Vercel Functions
No required Vercel Cron
No required Vercel database
No required server-side rendering
```

## 3.2 Free-tier cost guardrail

The intended MVP hosting cost is **$0 on Vercel Hobby** for a personal/non-commercial public prototype, subject to Vercel's current fair-use and included-usage limits.

Because Hobby usage is capped rather than pay-as-you-go, the application should fail economically safe: if usage grows, the architecture should not generate hidden compute or API cost.

Rules:

- prefer static assets over runtime-generated content;
- prefer client computation over server computation;
- bundle scenario content with the application rather than fetching it from a server on every play session;
- lazy-load large screens/content chunks rather than shipping everything in the first bundle;
- compress large JSON/content assets at build time where useful;
- optimise images before committing them to the repository;
- avoid large video assets in the MVP;
- avoid server-side image transformation for routine game art;
- do not introduce analytics that sends an event for every tick, click, or simulation transition;
- do not poll a server to advance game time;
- never make one Vercel Function invocation per game day/tick.

## 3.3 Hobby plan usage policy

Vercel Hobby is suitable for this MVP only while it is a personal/non-commercial project.

If the game is later used as a paid product, enterprise training product, organisational service, or other commercial deployment, treat a move to Vercel Pro or another appropriate production platform as an explicit launch requirement. Do not attempt to work around plan terms.

## 3.4 Optional online services

Optional future services such as cross-device cloud saves must be **progressive enhancements**.

If cloud save is added:

- keep the local IndexedDB save as the canonical offline-capable fallback;
- access an external backend-as-a-service directly from the browser where securely appropriate;
- do not proxy every save through Vercel Functions without a clear security reason;
- rate-limit/sparsely sync saves rather than writing after every simulation tick;
- gracefully degrade to local-only mode if the external service is unavailable or its free quota is exhausted.

---

# 4. Target Experience

## 3.1 Target audience

Primary:

- cybersecurity professionals;
- aspiring CISOs;
- cyber governance/risk professionals;
- security leaders;
- advanced cybersecurity students.

Secondary:

- executives wishing to understand the CISO role;
- business risk professionals;
- leadership development programmes.

The game must remain understandable to players who do not know detailed networking terminology.

## 3.2 Session model

The game must support:

- 2-minute check-in;
- 10-minute decision session;
- 30-minute strategic session;
- 2 to 3-hour complete MVP playthrough.

The player can leave and resume at any point.

## 3.3 Tone

Professional, modern, tense, credible.

Avoid:

- cartoon hacking stereotypes;
- neon hacker aesthetics as the primary visual language;
- exaggerated "you have been hacked!" presentation;
- patronising tutorial text;
- gamified corporate e-learning style.

The experience should feel like a polished strategy game built around an executive cyber role.

---

# 5. MVP Scope

The MVP is deliberately constrained.

## 4.1 MVP campaign

**Title:** CISO: First Year  
**Organisation:** Nexora Group  
**Duration:** 12 simulated months  
**Target playtime:** 2 to 3 hours per run  
**Replayability:** seeded world variations and multiple viable strategies

## 4.2 Organisation profile

Nexora Group is a fictional mid-sized digital services company.

Baseline:

- approximately 4,500 employees;
- multiple operating markets;
- cloud-heavy digital platform;
- legacy corporate environment;
- payment processing;
- external managed service provider;
- acquisition activity;
- major cloud transformation programme;
- existing SOC provider;
- understaffed security organisation;
- incomplete architecture knowledge;
- weakly maintained cyber risk register.

## 4.3 MVP content budget

Target approximately:

| Content | MVP target |
|---|---:|
| Business services | 5 |
| Important systems | 15-20 |
| Dependency relationships | 30-45 |
| Key executives/stakeholders | 6-8 |
| Cyber leadership roles | 4 |
| Cyber staff represented in capacity pool | ~20 |
| Strategic cyber programmes | 6 |
| Risk hypotheses/scenarios | ~25-30 |
| Threat actors | 3 |
| Event pool | 80-100 |
| Major incident families | 4-6 |
| Hidden starting configurations | 10+ combinable variables |

Do not expand into multiple industries during MVP.

---

# 6. Opening Sequence

The player should enter gameplay within 60 seconds.

## Opening scene

**08:07, Monday. Your first day as CISO.**

The CEO meeting starts in 23 minutes.

She wants to know:

> What are the three cyber risks I should be most concerned about?

The player sees an inherited environment containing:

- 6,283 critical vulnerabilities;
- 17 high-priority audit findings;
- 23 open risk register entries;
- 4 major transformation programmes;
- 14 important suppliers;
- 5 security vacancies;
- remaining cyber budget.

The game asks:

> **Where do you start?**

Possible actions could include:

- review critical business services;
- review inherited risk register;
- meet security leadership;
- inspect architecture/dependencies;
- review current threat intelligence;
- review recent control testing.

There must be no obvious mechanically superior first choice.

This sequence teaches the player that cyber risk cannot be understood from one data source.

---

# 7. Core Gameplay Loop

The primary loop is:

> **DISCOVER -> HYPOTHESISE -> PRIORITISE -> DECIDE -> INFLUENCE -> BUILD -> OBSERVE -> ADAPT**

## 6.1 Discover

The player receives fragments of evidence from:

- audits;
- vulnerability management;
- SOC;
- threat intelligence;
- architecture reviews;
- business interviews;
- supplier reviews;
- penetration testing;
- recovery tests;
- incident history;
- business project updates.

## 6.2 Hypothesise

The player may create or adopt a risk hypothesis.

Example:

> Compromise of privileged identity could enable a threat actor to disrupt several critical business services.

The hypothesis starts with a confidence level and supporting/contradicting evidence.

## 6.3 Prioritise

The player decides what deserves:

- CISO attention;
- staff effort;
- funding;
- investigation;
- escalation;
- acceptance;
- deferral.

## 6.4 Decide

Possible decision classes:

- investigate;
- mitigate;
- avoid;
- accept temporarily;
- accept with compensating controls;
- escalate;
- delegate;
- fund programme;
- pause programme;
- accelerate programme;
- support business proposal;
- oppose business proposal;
- support with conditions.

## 6.5 Influence

The player cannot directly control most business functions.

Some actions require cooperation from:

- CIO;
- COO;
- CFO;
- CEO;
- business owners;
- procurement;
- HR;
- suppliers;
- Board.

## 6.6 Build

The player invests in long-running capability programmes.

## 6.7 Observe

Time progresses. Programmes mature, threats move, projects launch, people become overloaded, assumptions change.

## 6.8 Adapt

The player reassesses prior decisions based on new evidence and changed conditions.

---

# 8. Three Independent Clocks

The simulation should track three major clocks.

## 7.1 Business Clock

Represents:

- product launches;
- cloud migration;
- acquisition milestones;
- expansion;
- cost reduction programmes;
- operational deadlines.

## 7.2 Cyber Clock

Represents:

- security programme delivery;
- control improvements;
- investigations;
- audit remediation;
- hiring;
- capability development;
- risk review dates.

## 7.3 Threat Clock

Represents:

- adversary interest;
- sector targeting;
- exploit availability;
- reconnaissance;
- compromise progression;
- dwell time;
- attack opportunities.

These clocks should deliberately collide.

Example:

- payment platform launches in 35 days;
- PAM uplift completes in 62 days;
- credential attacks are increasing now.

The player must decide whether to delay, accelerate, compensate, accept, or investigate.

---

# 9. Time Model

Use a deterministic discrete-time simulation.

Recommended MVP unit:

- one simulation tick = one in-game day.

The UI may animate time progression, but the engine should process explicit daily ticks.

Player controls:

- Pause;
- 1x;
- 2x;
- 4x;
- Advance to next meaningful event.

The simulation automatically pauses for:

- material incidents;
- Board/CEO decisions;
- decisions whose deadline has arrived;
- assumption invalidation requiring action;
- end-of-quarter review.

Do not implement a real-time action game loop.

---

# 10. Scarce Resources

## 9.1 Budget

Money for:

- technology;
- external services;
- programme acceleration;
- hiring;
- investigations;
- training;
- architecture remediation.

## 9.2 Team capacity

Each cyber function has limited capacity per week/month.

Functions:

- SOC / detection;
- security engineering;
- security architecture;
- GRC / risk;
- IAM;
- incident response.

## 9.3 CISO focus

Use a small weekly focus budget.

Suggested starting model:

- 5 Focus Points per week.

Example costs:

- executive intervention: 1;
- deep risk review: 2;
- major programme intervention: 2;
- Board preparation: 2;
- personally lead incident escalation: context-dependent.

Do not make Focus Points look like arcade energy. Present them as calendar/attention capacity.

## 9.4 Executive goodwill / influence

Track hidden numeric values per stakeholder but present qualitatively.

Examples:

- Resistant;
- Cautious;
- Neutral;
- Supportive;
- Trusted.

## 9.5 Operational tolerance

Some remediation actions create downtime, process friction, or project delay.

This creates legitimate business resistance.

---

# 11. Delegation System

Delegation is a core mechanic.

Cyber leadership roles:

- Head of SOC;
- Head of Security Architecture;
- Head of GRC / Cyber Risk;
- Head of Security Engineering.

Each leader has:

- skill profile;
- confidence/reliability;
- current workload;
- morale;
- domain strengths;
- delegation history.

The player can delegate:

- investigations;
- control reviews;
- programme oversight;
- risk analysis;
- supplier reviews;
- incident preparation.

Delegated work has:

- duration;
- quality range;
- confidence level;
- capacity cost;
- chance of delay.

High workload should reduce quality and increase delay risk.

The CISO should not be able to personally solve everything.

---

# 12. Evidence, Hypothesis and Risk Lifecycle

This is one of the most important systems.

## 11.1 Evidence

Evidence is an observation, not a conclusion.

Example evidence types:

- vulnerability finding;
- audit finding;
- threat intelligence;
- failed recovery test;
- architecture dependency;
- unsupported technology;
- supplier exception;
- anomalous SOC event;
- staff observation;
- control test result.

Evidence fields:

```ts
interface Evidence {
  id: string
  title: string
  description: string
  sourceType: EvidenceSourceType
  discoveredAtDay: number
  confidence: 'low' | 'medium' | 'high'
  affectedEntityIds: string[]
  tags: string[]
  expiresAtDay?: number
  hiddenTruthRef?: string
}
```

## 11.2 Hypothesis

A hypothesis links evidence to a potential material scenario.

```ts
interface RiskHypothesis {
  id: string
  title: string
  statement: string
  supportingEvidenceIds: string[]
  contradictingEvidenceIds: string[]
  confidence: 'low' | 'medium' | 'high'
  status: 'draft' | 'investigating' | 'validated' | 'rejected' | 'converted'
  linkedScenarioId?: string
}
```

The player should be able to:

- create hypothesis;
- attach evidence;
- commission investigation;
- dismiss/reject;
- convert to formal risk scenario.

For MVP, provide assisted hypothesis creation rather than unrestricted free-text semantic reasoning.

Use selectable templates plus optional notes.

## 11.3 Risk scenario

Risk scenarios should express:

> Threat / event -> pathway -> business consequence.

Example:

> A financially motivated actor compromises a third-party privileged identity through remote access, moves into the production environment, and disrupts order fulfilment for more than 24 hours.

Suggested model:

```ts
interface RiskScenario {
  id: string
  title: string
  threatActorIds: string[]
  triggerEntityIds: string[]
  attackPathIds: string[]
  affectedServiceIds: string[]
  consequenceIds: string[]
  confidence: 'limited' | 'moderate' | 'strong'
  exposureBand: RiskBand
  consequenceBand: RiskBand
  residualRiskBand: RiskBand
  status: 'emerging' | 'open' | 'accepted' | 'treated' | 'closed'
  ownerStakeholderId: string
  decisionIds: string[]
  assumptionIds: string[]
  nextReviewDay: number
}
```

The visible risk bands should be derived from hidden numeric simulation values.

---

# 13. Assumption System

Every material decision may store assumptions.

```ts
interface Assumption {
  id: string
  statement: string
  createdDay: number
  linkedDecisionId: string
  linkedEntityIds: string[]
  status: 'valid' | 'uncertain' | 'invalidated'
  validationRuleId?: string
  nextReviewDay?: number
}
```

Examples:

- retirement date remains before Q4;
- no external privileged access exists;
- supplier MFA coverage remains complete;
- backups recover within service tolerance;
- application remains isolated from production.

When world state contradicts an assumption:

1. mark assumption invalidated;
2. create an event;
3. identify linked decisions and risk scenarios;
4. request reassessment.

This must be deterministic and testable.

---

# 14. Organisation Graph

Represent the organisation as a dependency graph.

Node categories:

- business objective;
- business service;
- application/system;
- infrastructure;
- cloud platform;
- identity service;
- network zone;
- supplier;
- data set;
- cyber control/programme.

Edge types:

- depends_on;
- authenticates_via;
- hosted_on;
- administered_by;
- connected_to;
- supplied_by;
- processes_data_for;
- protects;
- monitors.

The organisation graph is partially hidden at game start.

The player progressively discovers nodes and edges.

Each graph object should support:

```ts
interface OrgNode {
  id: string
  type: OrgNodeType
  name: string
  description: string
  criticality: 'low' | 'medium' | 'high' | 'critical'
  discovered: boolean
  discoveryConfidence: number
  attributes: Record<string, unknown>
}
```

The hidden full graph is the simulation truth.

The visible graph is the player's current understanding.

This distinction is essential.

---

# 15. Risk Engine

Do not expose a simplistic equation to the player.

Internally, risk should be influenced by:

- threat capability;
- threat intent;
- target attractiveness;
- attack opportunity;
- exposure;
- weakness severity;
- control effectiveness;
- control coverage;
- attack-path length/viability;
- business consequence;
- dependency concentration;
- recovery capability;
- uncertainty.

Use numeric internal values between 0 and 1 where convenient, but convert them into qualitative bands for UI.

Example internal approach:

```ts
baseOpportunity = exposure * weakness * pathViability
controlModifier = 1 - effectiveControlCoverage
attackOpportunity = clamp(baseOpportunity * controlModifier, 0, 1)
impact = serviceCriticality * consequenceSeverity * dependencyAmplifier
```

Do not implement one giant monolithic formula.

Prefer composable functions:

```ts
calculatePathViability()
calculateControlEffectiveness()
calculateThreatPressure()
calculateConsequence()
calculateResidualExposure()
calculateRecoveryModifier()
```

All simulation functions must be unit-testable and deterministic for a given state and RNG seed.

---

# 16. Threat Actor Engine

MVP contains three threat actors/archetypes.

Example archetypes:

1. financially motivated ransomware group;
2. credential-focused opportunistic criminal group;
3. strategic espionage actor.

Each actor has:

```ts
interface ThreatActor {
  id: string
  name: string
  motivation: string
  capability: number
  persistence: number
  targetPreferences: string[]
  techniquePreferences: AttackTechnique[]
  activityLevel: number
  discoveredByPlayer: boolean
}
```

Threat actor progression should include:

- interest;
- reconnaissance;
- attempted initial access;
- foothold;
- lateral movement;
- target access;
- action on objective.

The player should not normally see the exact stage unless detection provides evidence.

## Attack opportunity

Each day, threat actors evaluate a bounded set of relevant paths rather than the whole graph exhaustively.

Use precomputed candidate attack paths for MVP.

This avoids unnecessary simulation complexity.

A path might be:

```text
Supplier -> Remote Access -> Privileged Identity -> Management Server -> Production
```

Controls modify specific path edges/nodes.

Example:

- MFA reduces initial access opportunity;
- PAM reduces privilege abuse;
- segmentation reduces lateral movement;
- EDR increases detection chance;
- recovery controls reduce consequence rather than initial compromise probability.

---

# 17. Control Model

Controls are not binary.

Suggested structure:

```ts
interface SecurityControl {
  id: string
  name: string
  category: ControlCategory
  coverage: number
  configurationQuality: number
  operationalEffectiveness: number
  monitoringQuality: number
  exceptionRate: number
  targetEntityIds: string[]
  implementationProgrammeId?: string
}
```

The effective value may be computed from the above, but keep the dimensions separately visible where useful.

Examples:

- MFA;
- PAM;
- network segmentation;
- EDR;
- logging;
- backup and recovery;
- threat hunting;
- supplier access governance;
- vulnerability management.

---

# 18. Cyber Programme System

The player should build capability over time.

MVP programme options:

1. Identity and privileged access uplift
2. Ransomware resilience and recovery
3. Detection and telemetry modernisation
4. Cloud security uplift
5. Third-party security programme
6. Security architecture / segmentation

Programme structure:

```ts
interface CyberProgramme {
  id: string
  name: string
  description: string
  startDay?: number
  status: 'proposed' | 'active' | 'paused' | 'complete' | 'at-risk'
  progress: number
  budgetAllocated: number
  capacityDemand: CapacityDemand
  executiveSponsorId?: string
  blockers: ProgrammeBlocker[]
  milestones: ProgrammeMilestone[]
  controlEffects: ControlEffectDefinition[]
}
```

Programmes should:

- take months;
- encounter blockers;
- require staff capacity;
- improve controls gradually;
- create opportunity cost;
- sometimes fall behind.

Do not allow instant control upgrades.

---

# 19. Stakeholder and Influence System

Persistent stakeholders are important for emotional and strategic engagement.

MVP stakeholders may include:

- CEO;
- CIO;
- COO;
- CFO;
- Head of Digital/Product;
- Board Risk Chair;
- Procurement/Supplier leader.

Each has:

```ts
interface Stakeholder {
  id: string
  name: string
  role: string
  priorities: string[]
  cyberUnderstanding: number
  riskTolerance: number
  trustInCiso: number
  relationshipState: RelationshipBand
  activeConcerns: string[]
}
```

Never show trust as an exact number.

Actions modify relationships based on context.

Example:

- blocking a launch without alternatives damages CIO trust;
- finding a workable compensating control may improve trust;
- surprising the Board with a previously known material risk damages Board confidence;
- transparent uncertainty can strengthen trust if communicated well.

Stakeholders must remember significant past decisions.

---

# 20. Business Objective System

Nexora must have objectives independent of cybersecurity.

Examples:

- launch a new customer platform;
- migrate major workloads to cloud;
- complete an acquisition;
- enter a new market;
- reduce operating costs;
- maintain target service availability.

Model:

```ts
interface BusinessObjective {
  id: string
  name: string
  description: string
  targetDay: number
  importance: 'medium' | 'high' | 'critical'
  progress: number
  status: 'planned' | 'active' | 'at-risk' | 'achieved' | 'failed'
  dependencyIds: string[]
}
```

Security actions may:

- delay objectives;
- protect objectives;
- enable objectives;
- impose conditions;
- reduce later disruption.

The game must make business success visible in the end-of-year review.

---

# 21. Decision System

All meaningful decisions must be data driven.

```ts
interface Decision {
  id: string
  eventId?: string
  title: string
  description: string
  createdDay: number
  deadlineDay?: number
  optionIds: string[]
  selectedOptionId?: string
  resolvedDay?: number
  assumptionIds: string[]
  rationaleTagIds: string[]
}
```

```ts
interface DecisionOption {
  id: string
  label: string
  description: string
  visibleKnownEffects?: string[]
  immediateEffects: GameEffect[]
  delayedEffectIds: string[]
  requirements?: DecisionRequirement[]
}
```

## Important UI rule

Do not expose hidden consequences before the player decides.

Bad:

> Require MFA: +20 security, -10 productivity.

Good:

> Require MFA before launch. Likely consequence: delivery team expects a two-week schedule impact.

The engine knows the hidden consequences.

---

# 22. Decision Rationale

For important decisions, ask the player why.

Use quick-select rationale tags rather than mandatory long text.

Examples:

- compensating controls are sufficient;
- business disruption is disproportionate;
- more evidence is required;
- system retirement is imminent;
- residual risk remains within tolerance;
- risk requires executive ownership;
- resource constraints require deferral.

Optional free-text note may be supported but must not be required for core gameplay.

Rationales feed the end-of-year debrief.

---

# 23. Events

Events are story delivery mechanisms, not isolated quiz questions.

Event categories:

- business;
- threat;
- cyber programme;
- people/team;
- supplier;
- executive request;
- Board;
- discovery;
- incident;
- assumption change.

```ts
interface GameEvent {
  id: string
  type: EventType
  title: string
  body: string
  priority: EventPriority
  availableFromDay: number
  expiresOnDay?: number
  trigger: EventTrigger
  conditions: EventCondition[]
  effectsOnReveal?: GameEffect[]
  decisionId?: string
  relatedEntityIds: string[]
}
```

Events should be conditional wherever possible.

Avoid hard-coded sequences such as:

> Day 90 always equals supplier compromise.

Prefer:

> Supplier compromise event can emerge if specific conditions create sufficient opportunity.

Some narrative milestones may remain fixed for campaign structure.

---

# 24. Risk Noise and Conflicting Evidence

Not every high-severity technical issue matters.

The world must include:

- false positives;
- noisy vulnerability volume;
- stale risk register entries;
- conflicting assurance reports;
- incomplete control inventories;
- irrelevant alerts;
- important medium-severity weaknesses.

Example:

A critical vulnerability may affect isolated dev systems.

A moderate authentication weakness may affect a systemic identity dependency.

This teaches prioritisation naturally.

---

# 25. Incident Engine

Incidents should emerge from world state when possible.

Incident phases:

1. detection / initial signal;
2. escalation;
3. executive response decisions;
4. containment progression;
5. consequence;
6. recovery;
7. reconstruction/debrief.

The CISO makes high-level decisions only.

Examples:

- activate incident command;
- isolate supplier access;
- approve temporary shutdown;
- escalate to CEO/Board;
- invoke external response support;
- prioritise restoration of a critical service.

Do not require detailed forensic commands.

## Incident reconstruction

After resolution, display the attack path and overlay:

**What helped**

- effective segmentation;
- detection telemetry;
- rehearsed recovery;
- strong privileged controls.

**What hurt**

- unmonitored supplier access;
- exceptions;
- shared credentials;
- failed backup assumption.

Then link to prior player decisions.

Do not label them simply "correct" or "incorrect".

---

# 26. End-of-Quarter and End-of-Year Reviews

## Quarterly review

Summarise:

- business progress;
- risk changes;
- programme health;
- assumptions requiring review;
- team health;
- Board agenda;
- emerging threats.

## Annual CISO review

Evaluate dimensions independently:

- risk understanding;
- prioritisation;
- resilience;
- cyber programme execution;
- business enablement;
- communication/escalation;
- team sustainability;
- material blind spots.

The review should produce narrative feedback, not just a numeric score.

Example:

> You identified identity concentration early and invested before the threat environment worsened. However, supplier access remained poorly understood for most of the year, leaving two material risks below your stated confidence threshold.

The player may still receive an optional high-level performance band for game progression, but it must not replace the narrative review.

---

# 27. Replayability

Use a seeded pseudo-random generator.

Every new game has a visible campaign seed.

Randomised/variable elements:

- stakeholder traits within bounded archetypes;
- starting control effectiveness;
- hidden dependencies;
- threat actor activity;
- supplier weaknesses;
- staff workload/morale;
- programme delivery friction;
- timing of non-critical events;
- attack path attractiveness;
- vulnerability noise.

Fixed elements:

- main organisation identity;
- core business services;
- campaign learning arc;
- key mechanics;
- broad business objectives.

Use deterministic seeded RNG so bugs can be reproduced by seed.

Never call `Math.random()` directly inside game logic.

Provide a dedicated seeded RNG service.

---

# 28. Responsive UX Strategy

The rule is:

> **Same simulation and decisions. Different presentation.**

Do not shrink the desktop dashboard onto mobile.

## 27.1 Mobile: 320-599 px

Primary orientation: portrait.

Primary experience:

- CISO inbox;
- decision cards;
- daily briefing;
- top risks;
- quick programme review;
- incident escalation;
- short sessions.

Navigation:

- bottom navigation;
- maximum 4 primary destinations plus More;
- recommended tabs: Home, Risk, Organisation, Team, More.

Rules:

- minimum 44 x 44 CSS px touch targets;
- body input text at least 16px;
- no hover-only content;
- no mandatory drag gesture;
- no page-level horizontal scrolling;
- portrait must remain fully functional;
- architecture graph must have an alternative hierarchical/list view.

## 27.2 Tablet/iPad: 600-1023 px

Primary experience:

- two-column layouts;
- inbox + detail;
- risk portfolio + inspector;
- larger organisation graph;
- programme portfolio;
- Board preparation.

Support portrait and landscape equally.

## 27.3 Desktop: 1024 px+

Primary experience:

- strategic command centre;
- three-region layouts where useful;
- persistent context panels;
- large dependency graph;
- detailed risk/portfolio inspection;
- keyboard shortcuts as optional acceleration.

Keyboard shortcuts must never be required.

Suggested:

- Space: pause/resume;
- I: inbox;
- R: risks;
- O: organisation;
- T: team;
- Escape: close inspector/dialog.

Do not activate shortcuts while typing in form fields.

---

# 29. Primary Screens

## 28.1 Home / CISO Briefing

Show:

- current date/month;
- current business/cyber/threat briefing;
- pending decisions;
- material changes;
- top risk concerns;
- programme exceptions;
- upcoming deadlines;
- team capacity alerts.

## 28.2 Inbox

Messages/events from:

- CEO;
- CIO;
- COO;
- Board;
- SOC lead;
- architecture lead;
- HR;
- suppliers;
- threat intelligence.

Inbox is a narrative surface, not the complete event database.

## 28.3 Risks

Views:

- emerging hypotheses;
- material risks;
- accepted risks;
- risks due for reassessment;
- assumptions invalidated.

Do not default to a giant spreadsheet.

## 28.4 Organisation

Desktop/tablet:

- dependency graph;
- filter by service/system/supplier/control;
- select a node for details;
- overlay known attack paths;
- distinguish discovered vs uncertain dependencies.

Mobile:

- hierarchical drill-down list by default;
- optional graph view.

## 28.5 Programmes

Show:

- strategic programmes;
- progress;
- blockers;
- capacity;
- executive sponsor;
- control impact;
- delivery confidence.

## 28.6 Team

Show:

- cyber leadership;
- functional capacity;
- workload;
- morale state;
- vacancies;
- delegated assignments.

Avoid turning the game into an HR simulator.

## 28.7 Board

Quarterly Board preparation:

- choose material topics;
- select recommendations;
- communicate uncertainty;
- answer concise executive questions.

---

# 30. Visual Design Direction

Use a premium enterprise strategy-game aesthetic.

Design cues:

- dark and light mode support;
- restrained colour palette;
- strong typography;
- clear data hierarchy;
- subtle motion;
- maps/graphs used meaningfully;
- incident moments can temporarily become visually more intense.

Avoid excessive cyber-green/neon visual clichés.

Risk colours should not be the only carrier of meaning. Always include labels/icons/text for accessibility.

---

# 31. Accessibility

Target WCAG 2.2 AA where practical.

Requirements:

- keyboard navigable;
- semantic HTML;
- visible focus states;
- sufficient contrast;
- motion respects `prefers-reduced-motion`;
- touch targets approximately 44 px minimum;
- no essential information only on hover;
- screen-reader labels on interactive controls;
- charts/graphs have textual equivalents;
- do not require colour perception to interpret risk state.

---

# 32. Recommended Technology Stack

Use current stable releases compatible with each other at build time. The guiding rule is **static-first, browser-executed, Vercel-Hobby-safe**.

For the MVP, prefer a simpler static React application over a server-centric framework. This reduces accidental serverless usage and makes the hosting model obvious to a frontier coding agent.

## 32.1 Runtime and package manager

Development/build tooling:

- **Node.js 24 LTS**
- **pnpm**

Node is a build/development dependency. The deployed game should not require a Node server process.

## 32.2 Application framework and build tool

Recommended:

- **Vite** with the current stable release
- **React 19** with the current stable compatible release
- **TypeScript** with strict mode enabled

Why Vite rather than Next.js for the MVP:

- the game is fundamentally a client-side strategy simulation;
- static output maps cleanly to Vercel Hobby/CDN hosting;
- it removes accidental Server Components, SSR, route handlers, and function invocations from the architecture;
- build/debug behaviour is straightforward for a frontier AI coding agent;
- smaller architectural surface area means fewer vibe-coding failure modes;
- future cloud save can be added through a browser SDK without changing the simulation engine.

Do **not** introduce Next.js merely because deployment is on Vercel. Vercel hosts Vite static applications well.

Do not put core simulation logic inside React components.

Routing:

- routing is optional for MVP;
- primary game navigation can be application state because this is a single-player application shell;
- if URL routes are desired, use a lightweight React router and configure Vercel SPA rewrites carefully;
- do not require server-side routing.

## 32.3 Styling and component primitives

- **Tailwind CSS 4.x** or current compatible stable release
- **shadcn/ui** source-owned components using current supported primitives
- CSS variables/design tokens for theme

Why:

- fast frontier-AI iteration;
- source-owned components rather than black-box UI;
- strong accessibility baseline;
- easy responsive composition.

Do not make the game look like an unmodified shadcn admin dashboard. Customise the visual language substantially.

## 32.4 Client/game state

Recommended:

- **Zustand** for application/game UI state
- **Immer** for safe immutable state updates where helpful

Important split:

- simulation engine functions accept serialisable state and return deterministic state/effects;
- Zustand is the adapter/store, not the game engine itself.

## 32.5 Runtime schema validation

- **Zod**

Use Zod to validate:

- scenario JSON;
- event definitions;
- imported save games;
- optional cloud-save payloads;
- content authoring data.

Invalid content should fail loudly in development.

## 32.6 Organisation graph

- **React Flow (`@xyflow/react`)** using the current stable compatible release

Reason:

- pan/zoom;
- pinch/touch support;
- responsive node graph;
- mature React integration;
- suitable for dependency and attack-path visualisation.

Rules:

- graph is primarily read-only in MVP;
- player does not manually design architecture;
- mobile must have a non-graph fallback view;
- lazy-load the graph module;
- avoid rendering thousands of nodes. MVP graph is small.

## 32.7 Charts and visualisation

Use lightweight SVG/HTML visualisations first.

If a chart library is required, prefer a small React-native library and lazy-load it where appropriate.

Do not build major gameplay around dashboard charts.

## 32.8 Persistence

### MVP local-first

Use **IndexedDB** for local saves.

Recommended implementation:

- small persistence wrapper using `idb`, or a minimal native IndexedDB abstraction;
- versioned save schema;
- autosave after meaningful state transitions, not every animation frame or tick;
- retain at least 3 rolling autosaves plus a manual slot;
- provide export/import of a save as JSON as a resilience feature.

Do not rely only on `localStorage` for the main game save.

This local-first model is required for the Vercel Hobby MVP because it eliminates database and write-API dependency.

### Optional cloud sync phase

Cloud sync is post-MVP and must not be required for gameplay.

A backend-as-a-service such as Supabase may be used if its current free tier and project requirements are acceptable at implementation time.

If used:

- browser talks directly to the service using its supported client SDK;
- Row Level Security protects user-owned saves;
- sync happens on meaningful save checkpoints, not every game tick;
- local IndexedDB remains the offline fallback;
- loss of cloud service must not corrupt or block the local campaign.

Do not add a Vercel Function proxy unless there is a concrete secret-management or security requirement that cannot be solved safely in the client.

## 32.9 Authentication

MVP: **no authentication required**.

The player can start immediately and save locally.

If cloud save is later added:

- account remains optional;
- use the selected backend provider's supported authentication;
- do not block first gameplay behind login;
- do not require a Vercel-hosted auth backend.

## 32.10 Testing

- **Vitest** for unit/domain tests
- **React Testing Library** for component interaction tests where valuable
- **Playwright** for end-to-end and responsive/device tests

Playwright test projects must cover at least:

- Chromium desktop at 1440 x 900;
- WebKit desktop;
- iPad/tablet portrait;
- iPad/tablet landscape;
- modern iPhone portrait;
- 320 px minimum-width mobile layout.

Use Playwright touch/device emulation for mobile and tablet.

## 32.11 Vercel Hobby deployment

Deploy the MVP as a **static Vite application** on Vercel Hobby.

Hard rules:

- no required Vercel Functions;
- no required server-side rendering;
- no required Edge Functions;
- no required cron jobs;
- no required Vercel Workflow/Queue;
- no required Vercel-managed database;
- no required runtime secret for the core game;
- the production build must be deployable from static output alone.

Recommended project settings:

```text
Framework preset: Vite
Install command: pnpm install --frozen-lockfile
Build command: pnpm build
Output directory: dist
Node.js: 24 LTS
```

Keep the deployed asset footprint small. Avoid committing raw source media, large videos, PSDs, or other non-runtime files into the production bundle.

A CI/preview deployment should not be required for every automated content-generation experiment. Use local validation/tests before pushing to reduce unnecessary deployment churn.

### Vercel Hobby verification gate

Before every production release verify:

1. Vercel dashboard shows no unexpected Function usage from normal gameplay.
2. There are no serverless/API routes required by the main campaign.
3. Build output is static and `dist/` contains the production app.
4. A fresh browser can start and complete gameplay with network disabled after the app shell/content has loaded, except for features explicitly marked online-only.
5. Saving and restoring a campaign works through IndexedDB without authentication.
6. The app remains usable if optional analytics/cloud-save services are blocked.
7. Deployment size remains comfortably below Hobby deployment-storage limits.

## 32.12 PWA

PWA is desirable but not a Phase 1 blocker.

After gameplay stabilises, add:

- web app manifest;
- installable shell;
- offline app shell;
- cached static campaign content;
- reliable resume from IndexedDB.

For Vite, a well-maintained PWA plugin may be used if it does not obscure cache/update behaviour.

Avoid aggressive service-worker caching until update behaviour is tested on iOS/iPadOS.

---

# 33. Technologies Explicitly Not Required for MVP

Do not add unless a concrete need emerges:

- Unity;
- Unreal;
- Phaser;
- PixiJS;
- WebGL custom rendering;
- WebSockets;
- multiplayer infrastructure;
- Kubernetes;
- microservices;
- GraphQL;
- dedicated event-stream infrastructure;
- LLM API dependency for core gameplay.

This is a strategy simulation application, not a sprite/action game.

If later visual effects require canvas rendering, add it only to that isolated feature.

---

# 34. AI/LLM Use in the Product

The game itself should **not require a live LLM for MVP**.

Reasons:

- deterministic gameplay is easier to balance;
- easier automated testing;
- no API cost dependency;
- avoids inconsistent executive dialogue;
- supports offline/local play;
- easier content QA.

Use authored dialogue templates and conditional content.

Potential future LLM use:

- optional free-text CISO coaching/debrief;
- dynamic executive follow-up conversations;
- scenario authoring assistance;
- adaptive explanation.

If added later, LLM output must never directly mutate simulation state without structured validated tool output.

---

# 35. Architecture

Core architecture:

```text
              RESPONSIVE UI
    Mobile      Tablet       Desktop
       \           |            /
        \          |           /
          APPLICATION LAYER
                 |
          GAME ORCHESTRATOR
                 |
       PURE TYPESCRIPT ENGINE
       /       |        |      \
   Risk     Threat   Events   Programmes
   Engine   Engine   Engine   Engine
                 |
             GAME STATE
                 |
      -------------------------
      |                       |
   IndexedDB             Cloud Save
   local save            optional later
                             |
                     External BaaS
                  (e.g. Supabase)
```

Core engine must not import React, Vite/browser DOM APIs, IndexedDB adapters, or any cloud SDK.

---

# 36. Suggested Repository Structure

```text
/
├─ src/
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ navigation.ts
│  │  └─ providers.tsx
│  │
│  ├─ screens/
│  │  ├─ home/
│  │  ├─ inbox/
│  │  ├─ risk/
│  │  ├─ organisation/
│  │  ├─ programmes/
│  │  ├─ team/
│  │  └─ board/
│  │
│  ├─ components/
│  │  ├─ game/
│  │  ├─ decisions/
│  │  ├─ organisation/
│  │  ├─ risk/
│  │  ├─ team/
│  │  └─ ui/
│  │
│  ├─ game/
│  │  ├─ engine/
│  │  │  ├─ tick.ts
│  │  │  ├─ rng.ts
│  │  │  ├─ effects.ts
│  │  │  ├─ invariants.ts
│  │  │  └─ orchestrator.ts
│  │  ├─ risk/
│  │  ├─ threats/
│  │  ├─ events/
│  │  ├─ controls/
│  │  ├─ programmes/
│  │  ├─ stakeholders/
│  │  ├─ team/
│  │  ├─ business/
│  │  ├─ incidents/
│  │  ├─ debrief/
│  │  └─ types/
│  │
│  ├─ content/
│  │  └─ nexora/
│  │     ├─ organisation.json
│  │     ├─ stakeholders.json
│  │     ├─ threats.json
│  │     ├─ controls.json
│  │     ├─ programmes.json
│  │     ├─ risks.json
│  │     ├─ events/
│  │     └─ incidents/
│  │
│  ├─ store/
│  │  ├─ game-store.ts
│  │  ├─ selectors.ts
│  │  └─ persistence.ts
│  │
│  └─ lib/
│     ├─ schemas/
│     ├─ formatting/
│     └─ utils/
│
├─ public/
├─ tests/
│  ├─ engine/
│  ├─ content/
│  └─ e2e/
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
├─ package.json
└─ vercel.json        # only if SPA rewrites/headers are needed
```

Avoid a monorepo unless a second deployable application actually appears.

Keep scenario/content data inside static application assets for MVP rather than creating a CMS or runtime content API.

---

# 37. Game State

Use a single canonical serialisable game state.

```ts
interface GameState {
  schemaVersion: number
  gameId: string
  seed: string
  currentDay: number
  speed: GameSpeed
  paused: boolean

  organisation: OrganisationState
  visibleKnowledge: PlayerKnowledgeState
  business: BusinessState
  threats: ThreatState
  controls: ControlState
  programmes: ProgrammeState
  risks: RiskState
  evidence: EvidenceState
  stakeholders: StakeholderState
  team: TeamState
  inbox: InboxState
  events: EventState
  decisions: DecisionState
  assumptions: AssumptionState
  incidents: IncidentState
  resources: ResourceState
  history: HistoryState
}
```

Everything required to reproduce a saved game must live in serialisable state or deterministic scenario content.

Do not store functions inside game state.

---

# 38. Effect System

Content should not mutate arbitrary state directly.

Define a constrained `GameEffect` union.

Example:

```ts
type GameEffect =
  | { type: 'budget.change'; amount: number }
  | { type: 'stakeholder.trust'; stakeholderId: string; delta: number }
  | { type: 'control.coverage'; controlId: string; delta: number }
  | { type: 'programme.progress'; programmeId: string; delta: number }
  | { type: 'evidence.reveal'; evidenceId: string }
  | { type: 'assumption.invalidate'; assumptionId: string }
  | { type: 'event.schedule'; eventId: string; dayOffset: number }
  | { type: 'threat.pressure'; actorId: string; delta: number }
```

One central effect reducer applies changes.

Benefits:

- content is safer;
- effects are auditable;
- deterministic tests are easier;
- frontier AI is less likely to create inconsistent ad hoc state mutations.

---

# 39. Daily Tick Order

Define and preserve a deterministic tick order.

Recommended:

1. increment date;
2. refresh weekly/monthly resources if boundary crossed;
3. progress business objectives;
4. progress cyber programmes;
5. update team workload/morale;
6. update stakeholder state;
7. evaluate assumption validity;
8. update threat pressure;
9. evaluate attack paths;
10. progress active incidents;
11. evaluate conditional events;
12. create inbox notifications;
13. recalculate derived risk information;
14. evaluate auto-pause triggers;
15. autosave.

Create tests ensuring order does not accidentally change.

---

# 40. Derived State

Do not store values that can be reliably derived unless performance requires it.

Use memoised selectors for:

- top visible risks;
- programme health;
- stakeholder relationship bands;
- team capacity band;
- service resilience;
- currently actionable decisions;
- risk review due list.

Keep simulation truth and UI formatting separate.

---

# 41. Content Authoring

All campaign content must be data driven where practical.

Use TypeScript/Zod schemas to validate JSON.

Content should support:

- conditions;
- effects;
- narrative variants;
- related entities;
- decision options;
- delay/scheduling;
- one-time flags.

Avoid embedding scenario-specific logic into React components.

Create a development-only content validation command:

```bash
pnpm validate:content
```

It must detect:

- missing referenced IDs;
- impossible event conditions;
- duplicate IDs;
- invalid effect targets;
- circular invalid dependencies where prohibited;
- unreachable required events;
- schema violations.

---

# 42. Testing Strategy

Testing is critical because a simulation can appear functional while producing incoherent state.

## 41.1 Unit tests

Test:

- seeded RNG consistency;
- risk calculations;
- control effects;
- attack path viability;
- assumption invalidation;
- programme progression;
- resource consumption;
- relationship changes;
- event condition evaluation;
- save migration.

## 41.2 Invariant tests

Examples:

- budget cannot become NaN;
- control coverage remains 0..1;
- day never decreases;
- completed decisions cannot be selected twice;
- unknown organisation nodes are not accidentally shown;
- invalidated assumptions remain traceable;
- no incident references missing entities;
- all game states remain serialisable.

## 41.3 Simulation soak tests

Run thousands of automated seeded games with basic policies.

Detect:

- crashes;
- impossible states;
- permanent deadlocks;
- event explosions;
- campaigns where nothing happens;
- campaigns where major incidents occur constantly;
- resource values leaving bounds.

## 41.4 End-to-end tests

Must test:

- new game;
- first decision;
- create hypothesis;
- run investigation;
- start programme;
- advance time;
- receive event;
- resolve decision;
- trigger/replay one incident;
- save;
- reload;
- complete quarter;
- complete campaign.

## 41.5 Responsive testing

No release if:

- text clips at 320 px;
- primary buttons fall off-screen;
- modal/dialog cannot close on mobile;
- iPad landscape breaks graph layout;
- touch interaction requires hover;
- page-level horizontal scroll appears on core screens.

---

# 43. Game Balance Principles

Do not balance by making every choice roughly equal.

Instead:

- some choices are clearly reckless given available evidence;
- some choices are clearly prudent;
- most important choices should involve trade-offs;
- consequences should depend on context;
- no single cyber programme should dominate every run;
- risk reduction must compete with business delivery and capacity.

A defensive player should be able to create problems by:

- overspending;
- delaying critical projects;
- damaging executive trust;
- overloading cyber staff;
- escalating everything.

An aggressive business-enablement player should face:

- accumulated technical debt;
- hidden dependencies;
- excessive residual risk;
- fragile recovery.

Neither play style should automatically win.

---

# 44. Difficulty

MVP difficulty modes may alter:

- starting information quality;
- budget pressure;
- team capacity;
- threat pressure;
- executive tolerance;
- frequency of noise;
- investigation speed.

Do not simply multiply attack probability.

Suggested modes:

- Guided;
- CISO;
- High Pressure.

Default should be **CISO**.

Guided mode may explain terminology and give more structured hints.

---

# 45. Onboarding

Tutorial should be integrated into the first campaign.

Avoid a long standalone tutorial.

Teach mechanics when first encountered:

- evidence;
- hypothesis;
- risk scenario;
- investigation;
- programme;
- stakeholder influence;
- assumption;
- incident.

Tooltips should be concise and dismissible.

Provide a glossary accessible from any screen.

---

# 46. Telemetry for Development

Do not add invasive user tracking by default.

For development/balancing, optionally collect anonymised events with consent when backend exists:

- decision selected;
- decision time;
- abandoned run;
- campaign completion;
- most/least selected programmes;
- commonly missed risks;
- device class;
- UI errors.

Never collect free-text decision notes without explicit need and clear privacy treatment.

---

# 47. Security Requirements for the Web Application

Even though this is a game, use normal secure engineering practices.

- no secrets in client bundle;
- Content Security Policy where practical;
- no authentication or cookies are required for MVP;
- if optional cloud saves are added, use provider-native secure authentication and Row Level Security or equivalent;
- validate all imported save/scenario data;
- validate all optional backend inputs;
- rate limit optional write endpoints where appropriate;
- dependency scanning;
- no untrusted HTML rendering;
- sanitise imported scenario/save content;
- do not use `dangerouslySetInnerHTML` for game content;
- avoid storing auth tokens manually.

---

# 48. Performance Targets

Aim for:

- responsive interaction on modern iPhone/iPad;
- no main-thread long task above ~100 ms during normal decisions;
- organisation graph remains smooth with MVP node count;
- save/load feels immediate;
- initial page shell usable quickly on normal broadband;
- lazy load heavy graph/incident visualisation modules.

The simulation should run only when ticks are processed, not via a continuous 60 FPS loop.

Vercel Hobby performance/cost requirements:

- normal gameplay must generate **zero required Vercel Function invocations**;
- no network request should be generated per simulation tick;
- static content should be cacheable by the CDN/browser;
- optional telemetry must be batched/sampled rather than chatty;
- build output should be monitored for accidental large assets or duplicated scenario bundles.

---

# 49. Implementation Phases

## Phase 0: Repository and quality foundation

Deliver:

- Vite + React project;
- TypeScript strict;
- Tailwind;
- shadcn setup;
- linting;
- Vitest;
- Playwright;
- CI build/test;
- responsive app shell;
- theme tokens.

Acceptance:

- passes tests;
- renders on desktop/tablet/mobile;
- no game logic yet.

## Phase 1: Pure simulation kernel

Deliver:

- game state types;
- seeded RNG;
- tick engine;
- effect reducer;
- content loader/validation;
- basic resources;
- game history;
- unit/invariant tests.

Acceptance:

- simulation runs 365 days headlessly;
- identical seed produces identical state history;
- state serialises/deserialises.

## Phase 2: Organisation and knowledge model

Deliver:

- organisation graph;
- hidden vs visible knowledge;
- evidence;
- investigations;
- hypothesis model;
- risk scenarios.

Acceptance:

- player can discover dependencies;
- evidence can support a hypothesis;
- hypothesis can become a risk;
- hidden nodes remain hidden until revealed.

## Phase 3: UI vertical slice

Deliver one polished 30-day playable slice:

- Home;
- Inbox;
- Risk;
- Organisation;
- one stakeholder;
- one programme;
- one threat actor;
- 15-20 events;
- one possible incident.

Acceptance:

- plays well on PC, iPad and mobile;
- player can finish 30 days without debug controls;
- save/resume works.

**Do not proceed to full content until this slice is genuinely enjoyable.**

## Phase 4: Stakeholders, team and delegation

Deliver:

- stakeholder trust/influence;
- cyber leadership;
- capacity;
- delegation;
- programme blockers;
- business objectives.

Acceptance:

- player cannot personally handle all work efficiently;
- stakeholder relationships materially change available options.

## Phase 5: Threat and incident engine

Deliver:

- three threat actors;
- candidate attack paths;
- detection/control interaction;
- incident progression;
- reconstruction view.

Acceptance:

- same incident family can have meaningfully different outcomes depending on prior controls;
- good controls reduce consequence without guaranteeing zero incidents.

## Phase 6: Full Year One content

Deliver:

- all five services;
- full event pool;
- six programmes;
- all stakeholders;
- all major risk families;
- quarterly Board reviews;
- annual CISO debrief.

Acceptance:

- complete 12-month campaign;
- 2-3 hour target run;
- multiple seeds produce materially different stories.

## Phase 7: Balance and polish

Deliver:

- sound design;
- subtle animation;
- final visual treatment;
- onboarding polish;
- accessibility review;
- content balance;
- soak-test tuning;
- mobile/iPad fixes.

## Phase 8: Optional cloud sync

Deliver only after gameplay is stable and only if cross-device persistence is worth the added dependency:

- optional external BaaS project, such as Supabase;
- optional account;
- provider-native access controls / RLS-secured cloud saves;
- checkpoint-based sync rather than tick-based writes;
- cross-device resume;
- migration from local save;
- graceful fallback to IndexedDB-only play.

This phase must not turn the core campaign into a Vercel serverless application.

---

# 50. Vercel Hobby Release Gate

A build is not release-ready unless all of the following are true:

- `pnpm build` produces a static `dist/` application;
- no normal gameplay path imports or calls a Vercel Function/API route;
- no server-rendered page is required;
- a new player can start without an account;
- the campaign can be completed with only browser-local persistence;
- IndexedDB migration tests pass;
- optional online services can fail without preventing play;
- there is no required cron/background process;
- there is no secret embedded in the client bundle;
- production assets are optimised and deployment size is reviewed;
- Playwright passes desktop, iPad and mobile projects against the production build;
- Vercel preview/production deployment succeeds under Hobby settings;
- Vercel usage after a scripted full playthrough shows no unexpected compute consumption.

The frontier coding model should treat any accidental server dependency in the MVP as an architectural regression.

---

# 51. Vertical Slice Definition

Before attempting the full game, prove this exact slice.

## Slice scenario

The player inherits Nexora and discovers possible identity/supplier risk.

Available evidence:

- privileged recertification overdue;
- supplier remote access exists;
- one failed access review;
- identity platform supports two important services;
- ransomware activity in sector.

Possible actions:

- commission access review;
- inspect architecture;
- perform targeted threat hunt;
- start MFA/PAM improvement;
- defer while prioritising recovery;
- escalate supplier access issue.

The business simultaneously needs approval for a platform launch.

A threat actor may exploit supplier access depending on state.

The slice should demonstrate:

- discovery;
- uncertainty;
- prioritisation;
- business tension;
- delayed consequences;
- one stakeholder relationship;
- one programme;
- one incident path;
- post-incident reconstruction.

If this slice is not compelling, do not scale content.

---

# 52. Frontier AI Coding Rules

The coding model should follow these rules throughout implementation.

## 50.1 Before coding a feature

1. read this plan;
2. identify affected domain modules;
3. preserve separation between engine, content and UI;
4. add or update tests first where practical;
5. make the smallest coherent change.

## 50.2 Never

- put scenario-specific conditions directly in generic React components;
- use `Math.random()` in simulation;
- mutate canonical state from arbitrary components;
- expose hidden simulation values because it is convenient;
- solve a UI problem by changing game rules;
- add a new major dependency without documented rationale;
- remove mobile functionality to simplify desktop implementation;
- create placeholder buttons that do nothing;
- use static fake data in a screen once the corresponding domain system exists;
- add a feature that bypasses the effect system;
- introduce an LLM dependency into core simulation.

## 50.3 Always

- preserve deterministic seeds;
- keep game state serialisable;
- validate content;
- test 320 px width;
- test iPad touch behaviour;
- add loading/error/empty states where applicable;
- maintain accessible labels;
- keep touch and mouse workflows equivalent;
- document non-obvious domain rules in code comments;
- update this plan/README when architecture meaningfully changes.

---

# 53. Definition of Done for MVP

The MVP is complete only when all of the following are true.

## Gameplay

- new player can start without reading external documentation;
- first meaningful decision occurs within 60 seconds;
- player can complete one full simulated year;
- player discovers risks rather than only receiving them;
- at least three materially different strategic approaches are viable;
- programme choices visibly change later outcomes;
- incidents can occur without being fully scripted;
- risk assumptions can be invalidated;
- annual debrief references player rationale/history.

## Technical

- deterministic game seed;
- no uncaught runtime errors during 1,000 automated simulation runs;
- save/resume works;
- save schema versioning exists;
- all content validates;
- responsive tests pass;
- main screens work at 320 px width;
- main workflows work with touch;
- Chromium/WebKit E2E tests pass;
- Lighthouse/accessibility issues reviewed and material issues fixed.

## Experience

- does not feel like a compliance quiz;
- does not require cybersecurity trivia to progress;
- does not reward simply buying every control;
- business outcomes are visible;
- the organisation appears to remember past decisions;
- the player can explain why their organisation ended the year differently from another run.

---

# 54. Post-MVP Roadmap

Only consider after MVP validation.

Potential expansions:

- multi-year campaign;
- hospital scenario;
- banking scenario;
- airport/transport scenario;
- power/OT scenario;
- government digital service scenario;
- deeper cloud concentration risk;
- systemic/cross-sector mode;
- Academy/instructor mode;
- scenario editor;
- optional AI-assisted debrief;
- cloud saves and achievements;
- PWA offline support;
- additional CISO career progression.

Do not begin these before the core loop proves fun and replayable.

---

# 55. Final Product Statement

**CISO: First Year** is a single-player cyber risk strategy simulation in which the player inherits a living organisation as its CISO, progressively discovers its real cyber risks, forms and tests hypotheses, allocates limited resources, builds cyber capability, influences business leaders, manages assumptions, and experiences the delayed consequences of those decisions as business and threat conditions evolve.

The game is successful when a player finishes a run thinking:

> I understand why this organisation became resilient or fragile, and I can trace that outcome back to the judgements I made along the way.

