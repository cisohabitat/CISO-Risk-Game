/**
 * The constrained effect vocabulary. Authored content and player actions may
 * only change the world through these shapes; one reducer applies them
 * (src/game/engine/effects.ts). Nothing else may mutate canonical state.
 */
import type { CyberFunction } from './primitives'

export type GameEffect =
  | { type: 'budget.change'; amount: number; note?: string }
  | { type: 'focus.change'; amount: number }
  | { type: 'capacity.change'; fn: CyberFunction; delta: number }
  | { type: 'stakeholder.trust'; stakeholderId: string; delta: number; reason?: string }
  | { type: 'stakeholder.concern'; stakeholderId: string; concern: string }
  | { type: 'stakeholder.understanding'; stakeholderId: string; delta: number }
  | { type: 'control.coverage'; controlId: string; delta: number }
  | { type: 'control.configuration'; controlId: string; delta: number }
  | { type: 'control.operational'; controlId: string; delta: number }
  | { type: 'control.monitoring'; controlId: string; delta: number }
  | { type: 'control.exceptions'; controlId: string; delta: number }
  | { type: 'control.assess'; controlId: string }
  | { type: 'programme.progress'; programmeId: string; delta: number }
  | { type: 'programme.status'; programmeId: string; status: 'proposed' | 'active' | 'paused' | 'complete' | 'at-risk' }
  | { type: 'programme.blocker'; programmeId: string; blockerId: string }
  | { type: 'programme.resolveBlocker'; programmeId: string; blockerId: string }
  | { type: 'programme.sponsor'; programmeId: string; stakeholderId: string }
  | { type: 'evidence.reveal'; evidenceId: string; note?: string }
  | { type: 'node.reveal'; nodeId: string; confidence?: number; verified?: boolean }
  | { type: 'edge.reveal'; edgeId: string; verified?: boolean }
  | { type: 'node.exposure'; nodeId: string; delta: number }
  | { type: 'node.weakness'; nodeId: string; delta: number }
  | { type: 'assumption.record'; assumptionId: string; decisionId?: string }
  | { type: 'assumption.invalidate'; assumptionId: string; reason?: string }
  | { type: 'event.schedule'; eventId: string; dayOffset: number }
  | { type: 'event.suppress'; eventId: string }
  | { type: 'threat.pressure'; actorId: string; delta: number }
  | { type: 'threat.interest'; actorId: string; delta: number }
  | { type: 'threat.setback'; actorId: string; stages: number; note?: string }
  | { type: 'objective.progress'; objectiveId: string; delta: number }
  | { type: 'objective.delay'; objectiveId: string; days: number }
  | { type: 'objective.status'; objectiveId: string; status: 'planned' | 'active' | 'at-risk' | 'achieved' | 'failed' }
  | { type: 'risk.open'; scenarioId: string }
  | { type: 'risk.status'; scenarioId: string; status: 'emerging' | 'open' | 'accepted' | 'treated' | 'closed' }
  | { type: 'risk.review'; scenarioId: string; dayOffset: number }
  | { type: 'team.morale'; fn?: CyberFunction; delta: number }
  | { type: 'team.workload'; fn: CyberFunction; delta: number }
  | { type: 'leader.morale'; leaderId: string; delta: number }
  | { type: 'leader.confidence'; leaderId: string; delta: number }
  | { type: 'team.vacancyFilled'; fn: CyberFunction }
  | { type: 'incident.start'; familyId: string; pathId?: string; actorId?: string }
  | { type: 'incident.containment'; delta: number }
  | { type: 'incident.recovery'; delta: number }
  | { type: 'incident.consequence'; delta: number }
  | { type: 'flag.set'; flag: string; value?: number | string | boolean }
  | { type: 'flag.increment'; flag: string; amount: number }
  | { type: 'inbox.message'; messageId: string }
  | { type: 'history.note'; kind: string; summary: string }
  | { type: 'decision.open'; decisionId: string; deadlineDays?: number }
  | { type: 'board.confidence'; delta: number }
  | { type: 'operationalTolerance'; delta: number }
