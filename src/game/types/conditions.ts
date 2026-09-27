/**
 * Declarative conditions used by authored content. Content never contains
 * executable code: every gate is one of these serialisable shapes, evaluated by
 * src/game/events/conditions.ts. This keeps content validatable and keeps
 * scenario logic out of React components (plan §41, §52).
 */
export type Condition =
  | { kind: 'always' }
  | { kind: 'day.after'; day: number }
  | { kind: 'day.before'; day: number }
  | { kind: 'flag.set'; flag: string }
  | { kind: 'flag.notSet'; flag: string }
  | { kind: 'flag.atLeast'; flag: string; value: number }
  | { kind: 'node.discovered'; nodeId: string }
  | { kind: 'node.notDiscovered'; nodeId: string }
  | { kind: 'edge.exists'; edgeId: string }
  | { kind: 'edge.discovered'; edgeId: string }
  | { kind: 'control.coverageBelow'; controlId: string; value: number }
  | { kind: 'control.coverageAtLeast'; controlId: string; value: number }
  | { kind: 'control.effectivenessBelow'; controlId: string; value: number }
  | { kind: 'programme.status'; programmeId: string; status: string }
  | { kind: 'programme.progressAtLeast'; programmeId: string; value: number }
  | { kind: 'programme.anyActive' }
  /** A live programme has a blocker nobody has resolved. */
  /** A live programme has an unresolved blocker, at least `forDays` old when given. */
  | { kind: 'programme.anyBlocked'; forDays?: number }
  /** A live programme is where the time elapsed says it should be, with nothing blocking it. */
  | { kind: 'programme.anyOnPlan' }
  /** The player has recorded at least one assumption that has not been invalidated. */
  | { kind: 'assumption.anyRecorded' }
  /** A function still has a vacancy nobody is recruiting for. */
  | { kind: 'team.vacancyOpen' }
  | { kind: 'stakeholder.trustBelow'; stakeholderId: string; value: number }
  | { kind: 'stakeholder.trustAtLeast'; stakeholderId: string; value: number }
  | { kind: 'threat.pressureAtLeast'; actorId: string; value: number }
  | { kind: 'threat.campaignActive'; actorId?: string }
  | { kind: 'threat.campaignStageAtLeast'; stage: string }
  | { kind: 'incident.active' }
  | { kind: 'incident.none' }
  /** No urgent message in the inbox from the last `days` days: a quiet spell a message can honestly call quiet. */
  | { kind: 'inbox.noUrgentWithin'; days: number }
  /** No incident running, and none closed, in the last N days. */
  | { kind: 'incident.noneWithin'; days: number }
  /** The year began in this starting situation. */
  | { kind: 'situation.is'; situationId: string }
  | { kind: 'incident.resolvedCountAtLeast'; value: number }
  | { kind: 'evidence.known'; evidenceId: string }
  | { kind: 'evidence.tagKnown'; tag: string }
  | { kind: 'evidence.countAtLeast'; value: number }
  /** Board papers the player has written this year, whatever the committee made of them. */
  | { kind: 'review.papersWrittenAtLeast'; value: number }
  | { kind: 'risk.scenarioStatus'; scenarioId: string; status: string }
  | { kind: 'risk.openCountAtLeast'; value: number }
  | { kind: 'assumption.invalidated'; assumptionId: string }
  | { kind: 'team.capacityBandAtLeast'; band: string }
  | { kind: 'team.moraleBelow'; value: number }
  | { kind: 'budget.remainingBelow'; value: number }
  | { kind: 'budget.remainingAtLeast'; value: number }
  | { kind: 'objective.status'; objectiveId: string; status: string }
  | { kind: 'decision.optionTaken'; decisionId: string; optionId: string }
  | { kind: 'decision.resolved'; decisionId: string }
  | { kind: 'event.fired'; eventId: string }
  | { kind: 'event.notFired'; eventId: string }
  | { kind: 'not'; condition: Condition }
  | { kind: 'all'; conditions: Condition[] }
  | { kind: 'any'; conditions: Condition[] }
