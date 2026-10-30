import { expect, it } from 'vitest'
import { newGame } from '@/game/engine/orchestrator'
import { discoveryCounts } from '@/game/knowledge/discovery'
import { buildAnnualReview } from '@/game/debrief/review'
import { buildQuarterReview, materialTopics } from '@/game/debrief/quarter'
import { undiscoveredCount } from '@/store/selectors'
import { testIndex } from './helpers'

const index = testIndex()
it('counts systems and dependencies separately in the same annual snapshot', () => {
  const state = newGame(index, { seed: 'pm-discovery' })
  for (const node of Object.values(state.organisation.nodes)) node.discovered = true
  for (const edge of Object.values(state.organisation.edges)) edge.discovered = false
  const counts = discoveryCounts(state)
  expect(undiscoveredCount(state)).toEqual({ nodes: 0, edges: counts.dependencies.total })
  const evidence = buildAnnualReview(state, index).dimensions.find((item) => item.id === 'risk-understanding')!.evidence
  expect(evidence).toContain(`${counts.systems.total} of ${counts.systems.total} systems discovered; 0 remain unseen`)
  expect(evidence.some((line) => line.startsWith(`0 of ${counts.dependencies.total} dependencies discovered; ${counts.dependencies.total} remain unseen`))).toBe(true)
})
it('varies approved papers by reporting quarter without changing their effects', () => {
  const state = newGame(index, { seed: 'pm-board' })
  Object.values(state.risks.scenarios)[0]!.status = 'accepted'
  const topics = materialTopics(state, index).filter((topic) => topic.material).map((topic) => topic.id)
  const papers = [1, 2, 3].map((quarter) => buildQuarterReview(state, index, { quarter, topics, recommendations: [], communicateUncertainty: true }))
  expect(new Set(papers.map((paper) => paper.boardReaction)).size).toBe(3)
  expect(papers[0]!.boardReaction).toContain(materialTopics(state, index).find((topic) => topic.material)!.label)
  expect(papers[1]!.effects).toEqual(papers[0]!.effects)
  expect(papers[2]!.effects).toEqual(papers[0]!.effects)
})
it('states partial business delivery explicitly while preserving the assessment scale', () => {
  const state = newGame(index, { seed: 'pm-objectives' })
  Object.values(state.business.objectives).forEach((objective, i) => { objective.status = i < 3 ? 'achieved' : 'failed' })
  const result = buildAnnualReview(state, index).dimensions.find((item) => item.id === 'business-enablement')!
  expect(result.band).toBe('solid')
  expect(result.evidence[0]).toContain('3 of 5 objectives achieved; 2 missed; 0 still in delivery')
})
