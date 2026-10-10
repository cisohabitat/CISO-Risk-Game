/**
 * Delegated work: investigations, reviews and oversight (plan §11).
 *
 * Every assignment consumes capacity for its duration and returns a quality
 * that depends on who did it and how loaded they were. A thin result reveals
 * less and carries lower confidence — which is exactly how bad delegation hurts.
 */
import type {
  AssignmentState,
  ContentIndex,
  CyberFunction,
  GameEffect,
  GameState,
  InvestigationDef,
  LeaderRuntime,
} from '../types'
import { clamp01 } from '../types'
import type { Rng } from '../engine/rng'
import { capacityBand, delegationDelayDays, delegationQuality, teamStrain } from './capacity'
import { DIFFICULTY_PROFILES } from '../engine/setup'
import { evidenceIsStale } from '../knowledge/discovery'

export interface AssignmentTickResult {
  effects: GameEffect[]
  completed: {
    assignmentId: string
    title: string
    leaderId: string
    quality: number
    summary: string
    evidenceIds: string[]
    /** Systems, dependencies and controls the work reached, as queued. */
    nodeIds: string[]
    edgeIds: string[]
    controlIds: string[]
  }[]
  delayed: { assignmentId: string; title: string; days: number }[]
}

export function startInvestigation(
  state: GameState,
  index: ContentIndex,
  def: InvestigationDef,
  leaderId: string,
  rng: Rng,
): AssignmentState | undefined {
  const leader = state.team.leaders[leaderId]
  if (!leader) return undefined

  state.team.assignmentCounter += 1
  const id = `asg-${state.team.assignmentCounter}`
  // Slower when the person is already loaded, and slower again on the harder
  // difficulties, where everything takes longer than it should.
  const speed = DIFFICULTY_PROFILES[state.difficulty].investigationSpeed
  const baseDays = Math.max(3, Math.round(def.durationDays * speed))
  const loadPenalty = Math.round(baseDays * 0.4 * clamp01(leader.workload))
  const assignment: AssignmentState = {
    id,
    kind: 'investigation',
    refId: def.id,
    title: def.name,
    leaderId,
    startedDay: state.currentDay,
    dueDay: state.currentDay + baseDays + loadPenalty,
    progress: 0,
    capacityPerDay: def.capacityPerDay,
    status: 'running',
    quality: 0,
    delivered: false,
    producedEvidenceIds: [],
  }
  // Capacity is derived from running assignments, so pushing it is the commit.
  state.team.assignments.push(assignment)
  void rng
  void index
  return assignment
}

/** What "stop something" stopped, so the caller can say so. */
export type StoppedWork =
  | { kind: 'investigation'; id: string; title: string }
  | { kind: 'programme'; id: string; title: string }

/**
 * Pulls work back from a function under pressure.
 *
 * The most recently commissioned running enquiry that draws on `fn` is
 * abandoned. If no enquiry does — and measured over 92 firings of the overload
 * decision, none did in two thirds of them, because the load is programmes —
 * the most recently started programme that draws on `fn` is paused instead,
 * which frees its people until the player resumes it. Budget already spent
 * stays spent — the delay is the cost, which is what "stop something" means.
 */
export function stopWork(state: GameState, index: ContentIndex, fn: CyberFunction): StoppedWork | undefined {
  const running = state.team.assignments.filter(
    (assignment) => assignment.status === 'running' && assignment.kind === 'investigation',
  )
  const onFunction = running.filter((assignment) => (assignment.capacityPerDay[fn] ?? 0) > 0)
  const enquiry = onFunction.reduce<AssignmentState | undefined>(
    (latest, assignment) => (!latest || assignment.startedDay > latest.startedDay ? assignment : latest),
    undefined,
  )
  if (enquiry) {
    enquiry.status = 'abandoned'
    return { kind: 'investigation', id: enquiry.id, title: enquiry.title }
  }

  const live = Object.values(state.programmes.programmes).filter(
    (programme) => (programme.status === 'active' || programme.status === 'at-risk')
      && (index.programme.get(programme.id)?.capacityDemand[fn] ?? 0) > 0,
  )
  const programme = live.reduce<(typeof live)[number] | undefined>(
    (latest, candidate) => (!latest || (candidate.startedDay ?? 0) > (latest.startedDay ?? 0) ? candidate : latest),
    undefined,
  )
  if (!programme) return undefined
  programme.status = 'paused'
  return { kind: 'programme', id: programme.id, title: index.programme.get(programme.id)?.name ?? programme.id }
}

export function tickAssignments(state: GameState, index: ContentIndex, rng: Rng): AssignmentTickResult {
  const result: AssignmentTickResult = { effects: [], completed: [], delayed: [] }
  const strain = teamStrain(state)

  for (const assignment of state.team.assignments) {
    if (assignment.status !== 'running') continue
    const total = Math.max(1, assignment.dueDay - assignment.startedDay)
    assignment.progress = clamp01((state.currentDay - assignment.startedDay) / total)
    if (state.currentDay < assignment.dueDay) continue

    const leader = state.team.leaders[assignment.leaderId]
    if (!leader) {
      assignment.status = 'abandoned'
      continue
    }

    // One slip check per assignment, at the point it was due.
    if (!assignment.delivered) {
      const delay = delegationDelayDays(leader, strain, rng.next())
      if (delay > 0) {
        assignment.dueDay += delay
        assignment.delivered = true // slip already spent; no repeated slipping
        leader.assignmentsLate += 1
        result.delayed.push({ assignmentId: assignment.id, title: assignment.title, days: delay })
        continue
      }
      assignment.delivered = true
    }

    const quality = delegationQuality(leader, strain, rng.next())
    assignment.quality = quality
    assignment.status = 'complete'
    leader.assignmentsCompleted += 1

    const def = index.investigation.get(assignment.refId)
    if (!def) continue

    // A finding the year has made untrue does not come back, and so is not
    // reported as having come back either. The draw for an optional one is
    // still made, so the rest of the year's draws do not move.
    const evidenceIds: string[] = []
    for (const evidenceId of def.guaranteedEvidenceIds) {
      if (evidenceIsStale(state, index, evidenceId)) continue
      evidenceIds.push(evidenceId)
      result.effects.push({ type: 'evidence.reveal', evidenceId, note: def.name })
    }
    // Quality decides how much of the optional picture comes back.
    for (const evidenceId of def.possibleEvidenceIds) {
      if (rng.chance(0.25 + 0.7 * quality) && !evidenceIsStale(state, index, evidenceId)) {
        evidenceIds.push(evidenceId)
        result.effects.push({ type: 'evidence.reveal', evidenceId, note: def.name })
      }
    }
    for (const nodeId of def.revealsNodeIds) {
      // Work the player commissioned: this is knowledge they established.
      result.effects.push({ type: 'node.reveal', nodeId, confidence: clamp01(0.45 + 0.55 * quality), verified: true })
    }
    const edgeIds: string[] = []
    for (const edgeId of def.revealsEdgeIds) {
      // A thin review can miss a dependency entirely.
      if (quality > 0.35 || rng.chance(0.4)) {
        edgeIds.push(edgeId)
        result.effects.push({ type: 'edge.reveal', edgeId, verified: true })
      }
    }
    const assesses = quality > 0.3
    if (assesses) for (const controlId of def.assessesControlIds) result.effects.push({ type: 'control.assess', controlId })

    assignment.producedEvidenceIds = evidenceIds
    assignment.resultSummary = summariseQuality(def, quality, thinBecause(index, leader, strain))
    // A thin enquiry does not count as assessing its controls, and the close
    // later says they were "never independently assessed": a player who had
    // commissioned the review heard nothing linking the two.
    if (!assesses && def.assessesControlIds.length > 0) {
      const names = def.assessesControlIds.map((id) => index.control.get(id)?.name).filter((name): name is string => Boolean(name))
      const listed = names.map((name) => (/^[A-Z][a-z]/.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name))
      if (listed.length > 0) {
        assignment.resultSummary += ` It was too thin to count as an assessment of ${listed.length === 1 ? listed[0] : `${listed.slice(0, -1).join(', ')} or ${listed.at(-1)}`}.`
      }
    }
    result.completed.push({
      assignmentId: assignment.id,
      title: assignment.title,
      leaderId: assignment.leaderId,
      quality,
      summary: assignment.resultSummary,
      evidenceIds,
      nodeIds: def.revealsNodeIds,
      edgeIds,
      controlIds: assesses ? def.assessesControlIds : [],
    })
  }

  // Keep completed work for the debrief but bound the array.
  if (state.team.assignments.length > 120) {
    state.team.assignments = state.team.assignments.filter(
      (a) => a.status === 'running' || state.currentDay - a.dueDay < 120,
    )
  }

  return result
}

/**
 * Why thin work was thin, as far as anyone could say. Every thin result used
 * to blame a stretched team, and a third of them came back while the Briefing
 * said the functions had room.
 */
export function thinBecause(index: ContentIndex, leader: LeaderRuntime, strain: number): string {
  if (capacityBand(strain) !== 'available' && capacityBand(strain) !== 'committed') return 'the team was stretched'
  const name = index.content.leaders.find((candidate) => candidate.id === leader.id)?.name
  if (leader.workload > 0.55) return `${name ?? 'whoever led it'} had too much else on`
  if (leader.morale < 0.45) return `${name ?? 'whoever led it'} is running low`
  return 'it did not get far enough'
}

function summariseQuality(def: InvestigationDef, quality: number, because: string): string {
  if (quality < 0.3) return `${def.name} came back thin — ${because}, and the picture is incomplete.`
  if (quality < 0.55) return `${def.name} answered part of the question and raised others.`
  if (quality < 0.78) return `${def.name} produced a solid, usable picture.`
  return `${def.name} was thorough: the team went further than asked.`
}

export function runningAssignments(state: GameState): AssignmentState[] {
  return state.team.assignments.filter((a) => a.status === 'running')
}
