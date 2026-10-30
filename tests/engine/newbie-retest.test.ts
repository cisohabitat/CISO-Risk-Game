import { expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { openDecision } from '@/game/decisions/open'
import { applyEffects } from '@/game/engine/effects'
import { createRng } from '@/game/engine/rng'
import { tickDay } from '@/game/engine/tick'
import { createNextYear } from '@/game/engine/next-year'
import { checkInvariants } from '@/game/engine/invariants'
import { buildAnnualReview, finishYear } from '@/game/debrief/review'
import { createIncident } from '@/game/incidents/create'
import { buildReconstruction } from '@/game/incidents/engine'
import { programmeCommitments } from '@/store/commitments'
import { yearTimeline } from '@/store/selectors'
import { testIndex } from './helpers'

const index = testIndex()
it('bounds resource receipts without evicting operational assessment evidence', () => {
  const state = newGame(index, { seed: 'receipt-retention' })
  state.history.entries = [{ day: 0, kind: 'investigation', summary: 'Early operational evidence' }]
  for (let n = 0; n < 490; n += 1) state.history.entries.push({ day: 0, kind: 'test-activity', summary: 'Operational activity' })
  for (let n = 0; n < 130; n += 1) state.history.entries.push({ day: 0, kind: 'budget', summary: `Receipt ${n}` })
  tickDay(state, index)
  expect(state.history.entries.some((entry) => entry.summary === 'Early operational evidence')).toBe(true)
  expect(state.history.entries.filter((entry) => entry.kind === 'budget')).toHaveLength(120)
  expect(state.history.entries.some((entry) => entry.summary === 'Receipt 0')).toBe(false)
})
it('records the funding checkpoint on its day and never replaces it with later delivery', () => {
  const state = newGame(index, { seed: 'checkpoint-retest' })
  const decision = openDecision(state, index, 'dec-audit-finding')!
  // The fixture opened this before the authored event; do not open it a second time later.
  state.events.suppressedEventIds.push(...index.content.events.filter((event) => event.decisionId === 'dec-audit-finding').map((event) => event.id))
  const day = state.currentDay + 100
  expect(applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId: 'opt-audit-programme', rationaleTagIds: ['rat-more-evidence'] }).ok).toBe(true)
  expect(applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-identity', budget: 425 }).ok).toBe(true)
  state.currentDay = day - 1
  tickDay(state, index)
  const record = programmeCommitments(state, index)[0]!
  expect(record.reviewedDay).toBe(day)
  expect(record.reviewOutcome).toContain('Funding allocated £425k')
  expect(record.reviewOutcome).not.toContain(': Delivered;')
  expect(state.inbox.messages.find((message) => message.eventId === 'evt-con-audit-commitment-due')?.body).toContain(record.reviewOutcome)
  applyEffects(state, [{ type: 'programme.status', programmeId: 'prog-identity', status: 'complete' }], { index, rng: createRng(state.seed, state.rngCursor), source: 'test-later-delivery' })
  state.currentDay += 100
  expect(programmeCommitments(state, index)[0]).toMatchObject({ status: 'Delivered', reviewOutcome: record.reviewOutcome, reviewedDay: day })
  for (let n = 0; n < 620; n += 1) state.history.entries.push({ day: state.currentDay, kind: 'test-activity', summary: 'Later activity' })
  tickDay(state, index)
  expect(programmeCommitments(state, index)[0]!.reviewOutcome).toBe(record.reviewOutcome)
  state.currentDay = 364
  state.finished = true
  finishYear(state, index)
  const next = createNextYear(index, state)
  next.history.entries.push({ day: 1, kind: 'programme-review', refs: ['prog-identity'], summary: 'A different year checkpoint' })
  expect(programmeCommitments(next, index)[0]).toMatchObject({ reviewYear: 1, reviewedDay: day, reviewOutcome: record.reviewOutcome })
  expect(checkInvariants(next, index).filter((issue) => issue.rule === 'programme-review-record')).toEqual([])
  next.previousYears![0]!.programmeReviews![0]!.day = Number.NaN
  expect(checkInvariants(next, index).some((issue) => issue.rule === 'programme-review-record')).toBe(true)
})
it('never rounds an unfinished recovery programme to 100% in the review', () => {
  const state = newGame(index, { seed: 'recovery-rounding-retest' })
  const ids = ['prog-identity', 'prog-detection', 'prog-ransomware']
  for (const id of ids) {
    const work = state.programmes.programmes[id]!
    work.startedDay = 1
    work.progress = id === 'prog-ransomware' ? 0.9999 : 1
    work.status = id === 'prog-ransomware' ? 'active' : 'complete'
    if (work.status === 'complete') work.completedDay = 80
  }
  state.currentDay = 364
  state.finished = true
  const dimension = buildAnnualReview(state, index).dimensions.find((item) => item.id === 'programme-execution')!
  expect(dimension.narrative).toContain('2 of 3 programmes')
  expect(dimension.evidence).toContain(`${index.programme.get('prog-ransomware')!.name}: 99% delivered`)
  const recovery = yearTimeline(state, index).find((lane) => lane.id === 'programmes')!.spans.find((span) => span.label === index.programme.get('prog-ransomware')!.name)!
  expect(recovery).toMatchObject({ complete: false, ending: 'still running at year end' })
})
it('records actual refunds and bounded cuts, and records no refused purchase', () => {
  const state = newGame(index, { seed: 'budget-retest' })
  state.resources.budgetRemaining = 110
  const context = { index, rng: createRng(state.seed, state.rngCursor), source: 'test-refund' }
  applyEffects(state, [{ type: 'budget.change', amount: 60, note: 'Unused licence refund' }], context)
  expect(state.resources.budgetRemaining).toBe(170)
  expect(state.history.entries.at(-1)!.summary).toContain('Unused licence refund: £60k returned or added; £170k available (was £110k)')
  const count = state.history.entries.length
  expect(applyAction(state, index, { type: 'startProgramme', programmeId: 'prog-identity', budget: 425 }).ok).toBe(false)
  expect(state.history.entries).toHaveLength(count)
  applyEffects(state, [{ type: 'budget.change', amount: -500 }], context)
  expect(state.history.entries.at(-1)!.summary).toContain('£170k spent or withdrawn; £0k available')
})
it('retains the full recovery enquiry report after it comes back', () => {
  const state = newGame(index, { seed: 'enquiry-retest', difficulty: 'guided' })
  for (const fn of Object.values(state.team.functions)) fn.capacity = 20
  const enquiry = index.investigation.get('inv-recovery-test')!
  expect(applyAction(state, index, { type: 'startInvestigation', investigationId: enquiry.id, leaderId: 'lead-grc' }).ok).toBe(true)
  const assignment = state.team.assignments.at(-1)!
  for (let n = 0; n < 100 && assignment.status === 'running'; n += 1) runDays(state, index, 1)
  expect(assignment.status).toBe('complete')
  const message = state.inbox.messages.find((item) => item.subject === `Completed: ${assignment.title}`)!
  expect(message).toBeDefined()
  expect(assignment.resultSummary).toBe(message.body)
  const report = assignment.resultSummary
  state.controls.controls['ctl-backup']!.coverage = 1
  state.currentDay += 100
  expect(assignment.resultSummary).toBe(report)
})
it('does not charge for forming the same working hypothesis twice', () => {
  const state = newGame(index, { seed: 'hypothesis-retest' })
  const template = index.content.hypothesisTemplates[0]!
  const evidence = index.content.evidence.find((item) => item.tags.some((tag) => template.supportingTags.includes(tag)))!
  applyEffects(state, [{ type: 'evidence.reveal', evidenceId: evidence.id }], { index, rng: createRng(state.seed, state.rngCursor), source: 'test' })
  expect(applyAction(state, index, { type: 'createHypothesis', templateId: template.id, evidenceIds: [evidence.id] }).ok).toBe(true)
  const focus = state.resources.focusRemaining
  expect(applyAction(state, index, { type: 'createHypothesis', templateId: template.id, evidenceIds: [evidence.id] }).ok).toBe(false)
  expect(state.resources.focusRemaining).toBe(focus)
  expect(Object.values(state.risks.hypotheses)).toHaveLength(1)
})
it('names a deferred choice only on the used route while its declared control gap remains', () => {
  const state = newGame(index, { seed: 'choice-retest' })
  const decision = openDecision(state, index, 'dec-msp-access')!
  expect(applyAction(state, index, { type: 'resolveDecision', decisionId: decision.id, optionId: 'opt-msp-nothing', rationaleTagIds: ['rat-more-evidence'] }).ok).toBe(true)
  state.controls.controls['ctl-3p-access']!.coverage = 0.2
  state.controls.controls['ctl-3p-access']!.operationalEffectiveness = 0.2
  const choiceDay = state.currentDay
  state.currentDay += 1
  const incident = createIncident(state, index, { familyId: 'fam-ransomware', pathId: 'path-msp-ransom' })!
  const related = buildReconstruction(state, index, incident)
  const label = index.decision.get('dec-msp-access')!.options.find((option) => option.id === 'opt-msp-nothing')!.label
  expect(related.hurt.some((line) => line.includes(`You chose "${label}"`))).toBe(true)
  expect(buildReconstruction(state, index, { ...incident, pathId: 'path-checkout-data' }).hurt.some((line) => line.includes(`You chose "${label}"`))).toBe(false)
  decision.resolvedByDefault = true
  expect(buildReconstruction(state, index, incident).hurt.some((line) => line.includes('The deadline default selected'))).toBe(true)
  state.history.decisionsLog.find((entry) => entry.decisionId === decision.id)!.day = incident.startedDay + 1
  expect(buildReconstruction(state, index, incident).hurt.some((line) => line.includes(label))).toBe(false)
  state.history.decisionsLog.find((entry) => entry.decisionId === decision.id)!.day = incident.startedDay
  expect(buildReconstruction(state, index, incident).hurt.some((line) => line.includes(label))).toBe(false)
  state.history.decisionsLog.find((entry) => entry.decisionId === decision.id)!.day = choiceDay
  decision.resolvedByDefault = false
  state.controls.controls['ctl-3p-access']!.coverage = 1
  state.controls.controls['ctl-3p-access']!.operationalEffectiveness = 1
  state.controls.controls['ctl-3p-access']!.exceptionRate = 0
  expect(buildReconstruction(state, index, incident).hurt.some((line) => line.includes(`You chose "${label}"`))).toBe(false)
})
