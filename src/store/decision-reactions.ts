/**
 * What a decision changed straight away that the player can already see
 * elsewhere: an executive's remembered reaction (the Board screen), board
 * confidence (Home) and a team's morale (Team). The receipt said only "Choice
 * recorded in your decision log", so a choice that cost the CEO's trust read
 * the same as one that cost nothing.
 *
 * Directions in words, never amounts (`CLAUDE.md`, "Bands, not numbers").
 * Delayed effects are not here: they belong to the organisation's response.
 */
import { boardConfidenceLabel, relationshipBand, RELATIONSHIP_LABEL } from '@/game/stakeholders/relationships'
import { functionTitle } from '@/game/team/capacity'
import type { ContentIndex, GameState } from '@/game/types'

export interface DecisionReaction {
  text: string
  tone: 'positive' | 'negative' | 'neutral'
}

/** Smallest change worth a line: below it the player's own screens would not move. */
const NOTICEABLE = 0.02

export function decisionReactions(before: GameState, after: GameState, index: ContentIndex): DecisionReaction[] {
  const reactions: DecisionReaction[] = []

  for (const [id, person] of Object.entries(after.stakeholders.stakeholders)) {
    const earlier = before.stakeholders.stakeholders[id]
    if (!earlier) continue
    const name = index.stakeholder.get(id)?.name ?? 'An executive'
    const remembered = person.memory.filter(
      (memory) => !earlier.memory.some((old) => old.day === memory.day && old.summary === memory.summary),
    )
    for (const memory of remembered) reactions.push({ text: `${name}: ${memory.summary}`, tone: memory.sentiment })
    const delta = person.trust - earlier.trust
    if (Math.abs(delta) >= NOTICEABLE) {
      const extent = Math.abs(delta) >= 0.1 ? 'substantially' : Math.abs(delta) >= 0.05 ? 'noticeably' : 'slightly'
      const currentBand = RELATIONSHIP_LABEL[relationshipBand(person.trust)]
      reactions.push({ text: `${name}’s trust ${delta > 0 ? 'rose' : 'fell'} ${extent}. Relationship: ${currentBand}.`, tone: delta > 0 ? 'positive' : 'negative' })
    }
  }

  const board = after.stakeholders.boardConfidence - before.stakeholders.boardConfidence
  if (Math.abs(board) >= NOTICEABLE) {
    const earlier = boardConfidenceLabel(before.stakeholders.boardConfidence)
    const current = boardConfidenceLabel(after.stakeholders.boardConfidence)
    reactions.push({ text: `Board confidence ${board > 0 ? 'rose' : 'fell'}${earlier === current ? ` within the ${current} band` : ` from ${earlier} to ${current}`}.`, tone: board > 0 ? 'positive' : 'negative' })
  }

  for (const [fn, team] of Object.entries(after.team.functions)) {
    const earlier = before.team.functions[fn]
    if (!earlier) continue
    const delta = team.morale - earlier.morale
    if (Math.abs(delta) >= NOTICEABLE) {
      reactions.push({ text: `${functionTitle(fn)} morale ${delta > 0 ? 'lifted' : 'fell'}.`, tone: delta > 0 ? 'positive' : 'negative' })
    }
  }

  return reactions
}
