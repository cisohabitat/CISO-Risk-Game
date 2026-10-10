/**
 * What an executive says in a meeting.
 *
 * Every meeting used to return one stock line per approach: "talks you
 * through what is actually keeping them up at night", without saying what.
 * Three AI playtesters asked what had actually been said (the 9 October panel
 * twice, and harbour-87524: "What did Helen actually tell me?"). The words
 * come from the person's own plan for the year, the systems it rests on that
 * the player has found, and the risks the player already holds. Nothing the
 * player has not discovered is named.
 */
import type { ContentIndex, GameState } from '../types'
import { formatGameDate } from '../time'

export type MeetingApproach = 'listen' | 'brief' | 'press'

export interface MeetingAccount {
  /** What the meeting came to, as the player is told it and as the note keeps it. */
  message: string
  /** How the person remembers it, on their card. */
  memory: string
}

interface Agenda {
  goal: string
  due: string
  slipping: boolean
  systems: string[]
  risk?: string
}

/** The person's own plan this year, if they own one still in flight. */
function agendaFor(state: GameState, index: ContentIndex, stakeholderId: string): Agenda | undefined {
  const owned = index.content.objectives
    .filter((def) => def.ownerStakeholderId === stakeholderId)
    .map((def) => ({ def, runtime: state.business.objectives[def.id] }))
    .filter(({ runtime }) => runtime && runtime.status !== 'achieved' && runtime.status !== 'failed')
    .sort((a, b) => a.runtime!.targetDay - b.runtime!.targetDay)
  const first = owned[0]
  if (!first) return undefined
  const { def, runtime } = first
  const depends = new Set(def.dependencyNodeIds)
  const systems = def.dependencyNodeIds
    .filter((id) => state.organisation.nodes[id]?.discovered)
    .map((id) => index.node.get(id)?.name)
    .filter((name): name is string => Boolean(name))
  // The worst risk on the register whose own systems, or the services it
  // would hit, include one the plan rests on. Inherited risks not yet
  // assessed are on the register too: Tomas said "Nothing on your register
  // reaches it" beside an inherited acquisition risk he owned (AI tablet
  // playtest).
  const serviceNode = new Map(index.content.services.map((service) => [service.id, service.nodeId]))
  const reaches = (scenarioId: string) => {
    const def = index.riskScenario.get(scenarioId)
    if (!def) return false
    return (
      def.triggerNodeIds.some((id) => depends.has(id)) ||
      def.affectedServiceIds.some((id) => depends.has(serviceNode.get(id) ?? ''))
    )
  }
  const held = Object.values(state.risks.scenarios)
    .filter((s) => s.status !== 'closed')
    .filter((s) => reaches(s.id))
    .sort((a, b) => (b.lastAssessed?.residual ?? 0) - (a.lastAssessed?.residual ?? 0))[0]
  return {
    goal: def.name.charAt(0).toLowerCase() + def.name.slice(1),
    due: formatGameDate(runtime!.targetDay).label,
    slipping: runtime!.status === 'at-risk',
    systems,
    risk: held ? index.riskScenario.get(held.id)?.title : undefined,
  }
}

function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

export function meetingAccount(
  state: GameState,
  index: ContentIndex,
  stakeholderId: string,
  approach: MeetingApproach,
  receptive: boolean,
): MeetingAccount {
  const def = index.stakeholder.get(stakeholderId)
  const person = state.stakeholders.stakeholders[stakeholderId]
  const name = def?.name ?? 'They'
  const agenda = agendaFor(state, index, stakeholderId)

  if (approach === 'listen') {
    if (agenda) {
      const when = agenda.slipping ? `which is behind and due ${agenda.due}` : `due ${agenda.due}`
      const rests = agenda.systems.length > 0 ? ` It rests on ${list(agenda.systems)}.` : ''
      const reach = agenda.risk
        ? ` Of the risks you hold, the one that reaches it is ${agenda.risk}.`
        : ' Nothing on your register reaches it yet: because it is safe, or because nobody has looked?'
      return {
        message: `${name} talks you through the plan to ${agenda.goal}, ${when}.${rests}${reach}`,
        memory: `You asked about the plan to ${agenda.goal} and heard them out.`,
      }
    }
    const concern = person?.concerns.at(-1)
    return {
      message: concern
        ? `${name} talks you through what is actually keeping them up at night. Top of the list: ${concern}.`
        : `${name} talks you through what is actually keeping them up at night.`,
      memory: concern ? `You asked about ${concern.charAt(0).toLowerCase() + concern.slice(1)}.` : 'You asked what mattered to them.',
    }
  }

  if (approach === 'brief') {
    const message = agenda
      ? agenda.risk
        ? `${name} follows the argument and asks the sharper question: which of your risks reaches the plan to ${agenda.goal}? You can answer it: ${agenda.risk}.`
        : `${name} follows the argument and asks the sharper question: which of your risks reaches the plan to ${agenda.goal}? None on your register does yet, and you say so.`
      : `${name} follows the argument and asks a sharper question than last time.`
    return { message, memory: 'You briefed them in their own terms.' }
  }

  return {
    message: receptive
      ? `${name} agrees to move, on the understanding you will not do this every week.`
      : `${name} pushes back hard. You have spent credit you did not have.`,
    memory: 'You pushed them hard on a security commitment.',
  }
}
