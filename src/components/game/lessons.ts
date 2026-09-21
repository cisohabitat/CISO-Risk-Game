/**
 * Teaching happens when a mechanic is first encountered, not in a tutorial up
 * front (plan §45). The plan names eight mechanics to teach; a test fails the
 * build if one of them has no lesson, and another plays a campaign to check
 * every lesson can actually be triggered — a note nobody can reach teaches
 * nobody anything.
 *
 * Kept apart from the component so the triggers can be run against real game
 * states without a browser.
 */
import type { GameState } from '@/game/types'

export interface LessonContext {
  evidence: number
  hypotheses: number
  risks: number
  programmes: number
  investigations: number
  assumptions: number
  stakeholderMemories: number
  liveIncidents: number
  day: number
}

export interface Lesson {
  id: string
  /** The mechanic from plan §45 this lesson covers. */
  teaches: string
  title: string
  body: string
  when: (context: LessonContext) => boolean
  /** Shown only where the profile coaches decisions: an aim, not a mechanic. */
  coachedOnly?: boolean
}

export function lessonContext(state: GameState): LessonContext {
  return {
    evidence: state.evidence.order.length,
    hypotheses: Object.keys(state.risks.hypotheses).length,
    risks: Object.values(state.risks.scenarios).filter((scenario) => scenario.status !== 'emerging').length,
    programmes: Object.values(state.programmes.programmes).filter((programme) => programme.status !== 'proposed').length,
    investigations: state.team.assignments.length,
    assumptions: Object.keys(state.assumptions.assumptions).length,
    stakeholderMemories: Object.values(state.stakeholders.stakeholders).reduce((sum, s) => sum + s.memory.length, 0),
    liveIncidents: Object.values(state.incidents.incidents).filter((incident) => incident.phase !== 'closed').length,
    day: state.currentDay,
  }
}

/**
 * Order is priority: the first undismissed lesson whose moment has arrived is
 * the one shown, so what is happening right now comes before standing advice.
 */
export const LESSONS: Lesson[] = [
  {
    id: 'lesson-first-quarter',
    teaches: 'investigation',
    title: 'A first quarter, in three questions',
    body: 'Before the Q1 board paper, try to check three things yourself: one service the business cannot lose, one route an attacker would take, and one assumption about recovery. The enquiries are grouped by those questions, and each says which of your risks it speaks to.',
    when: (context) => context.day < 91 && context.investigations === 0,
    coachedOnly: true,
  },
  {
    id: 'lesson-incident',
    teaches: 'incident',
    title: 'This was not scripted',
    body: 'Something has walked a path through your estate, step by step, against the controls that were actually there. What you do now is recorded, and the year-end review reconstructs it move by move.',
    when: (context) => context.liveIncidents >= 1,
  },
  {
    id: 'lesson-assumption',
    teaches: 'assumption',
    title: 'You are relying on something',
    body: 'Carrying a risk means depending on something staying true. Record what, because it will be checked — and you will hear about it only once you could plausibly have known.',
    when: (context) => context.assumptions >= 1,
  },
  {
    id: 'lesson-evidence',
    teaches: 'evidence',
    title: 'Evidence is not risk',
    body: 'What you have just received is an observation. It becomes a risk only when you can say how it leads to business harm. The Risk screen is where you do that work.',
    when: (context) => context.evidence >= 2 && context.hypotheses === 0,
  },
  {
    id: 'lesson-hypothesis',
    teaches: 'hypothesis',
    title: 'Test the proposition',
    body: 'A hypothesis gives you something to gather evidence against. Some of what you find will contradict it, and that is the point.',
    // On forming one, whatever else is already open: the old trigger also
    // required no raised scenario, so a player who raised one first could
    // never be taught what a hypothesis is for.
    when: (context) => context.hypotheses >= 1,
  },
  {
    id: 'lesson-risk-scenario',
    teaches: 'risk scenario',
    title: 'A scenario is a claim you defend',
    body: 'A risk scenario says how harm reaches this business, by what route, and how confident you are that you have it right. The confidence is part of the claim, not a footnote to it.',
    when: (context) => context.risks >= 1,
  },
  {
    id: 'lesson-investigation',
    teaches: 'investigation',
    title: 'Delegated work comes back shaped',
    body: 'What you commission returns coloured by who did it and how loaded they were. A thin answer is not a clean bill of health — it is a thin answer.',
    when: (context) => context.investigations >= 1,
  },
  {
    id: 'lesson-stakeholder',
    teaches: 'stakeholder influence',
    title: 'They remember',
    body: 'The people around you keep a record of how you deal with them. Trust is spent by what you ask for, and earned by telling them things before they find out some other way.',
    when: (context) => context.stakeholderMemories >= 1,
  },
  {
    id: 'lesson-programme',
    teaches: 'programme',
    title: 'Capability takes months',
    body: 'Controls do not improve because you approved something. Programmes run for months, need people you have already committed elsewhere, and hit blockers that money cannot clear.',
    when: (context) => context.day >= 14 && context.programmes === 0,
  },
  {
    id: 'lesson-attention',
    teaches: 'attention',
    title: 'Your week is the scarce resource',
    body: 'Attention does not carry over. Spending it on everything means spending it on nothing that matters.',
    when: (context) => context.day >= 21,
  },
]
