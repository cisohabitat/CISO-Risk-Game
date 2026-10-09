/**
 * What a playtest session log says, as the measures Phase 0 of
 * docs/ROADMAP.md asks for. Pure, so it can be tested without a file.
 */
import type { SessionEvent, SessionLog } from '../../src/store/session-log'

export interface SessionSummary {
  campaign?: { seed: string; difficulty: string; situation: string | null }
  minutesPlayed: number
  dayReached: number
  finishedYear: boolean
  firsts: Record<'decision' | 'enquiry' | 'programme' | 'boardPaper', { day: number; minutes: number } | null>
  screens: { screen: string; visits: number; minutes: number }[]
  glossary: string[]
  lessonsDismissed: string[]
  pauses: { reason: string; count: number }[]
  skips: { day: number; days: number }[]
  actions: { type: string; count: number }[]
}

const minutes = (ms: number) => Math.round((ms / 60_000) * 10) / 10

const FIRSTS: Record<keyof SessionSummary['firsts'], string> = {
  decision: 'resolveDecision',
  enquiry: 'startInvestigation',
  programme: 'startProgramme',
  boardPaper: 'completeQuarterReview',
}

export function summariseSession(log: SessionLog): SessionSummary {
  const events = log.events
  const last = events.at(-1)
  const campaign = events.find((event) => event.kind === 'campaign')
  const succeeded = (event: SessionEvent) => event.kind === 'action' && event.ok === true

  const firsts = Object.fromEntries(
    Object.entries(FIRSTS).map(([name, type]) => {
      const hit = events.find((event) => succeeded(event) && event.type === type)
      return [name, hit ? { day: hit.day ?? 0, minutes: minutes(hit.at) } : null]
    }),
  ) as SessionSummary['firsts']

  // Time on a screen runs from opening it to opening the next one.
  const screenTime = new Map<string, { visits: number; ms: number }>()
  let open: SessionEvent | undefined
  for (const event of [...events.filter((e) => e.kind === 'screen'), ...(last ? [{ ...last, kind: 'screen' as const, screen: '' }] : [])]) {
    if (open && typeof open.screen === 'string' && open.screen) {
      const entry = screenTime.get(open.screen) ?? { visits: 0, ms: 0 }
      entry.visits += 1
      entry.ms += event.at - open.at
      screenTime.set(open.screen, entry)
    }
    open = event
  }

  const count = (values: string[]) => {
    const tally = new Map<string, number>()
    for (const value of values) tally.set(value, (tally.get(value) ?? 0) + 1)
    return [...tally].sort((a, b) => b[1] - a[1])
  }

  const actions = events.filter((event) => event.kind === 'action')
  return {
    campaign: campaign
      ? { seed: String(campaign.seed), difficulty: String(campaign.difficulty), situation: (campaign.situation as string | null) ?? null }
      : undefined,
    minutesPlayed: minutes(last?.at ?? 0),
    dayReached: Math.max(0, ...events.map((event) => event.day ?? 0)),
    finishedYear: events.some((event) => event.kind === 'year-end'),
    firsts,
    screens: [...screenTime]
      .map(([screen, entry]) => ({ screen, visits: entry.visits, minutes: minutes(entry.ms) }))
      .sort((a, b) => b.minutes - a.minutes),
    glossary: events.filter((event) => event.kind === 'glossary').map((event) => String(event.term ?? '(index)')),
    lessonsDismissed: actions.filter((event) => event.type === 'dismissTutorial').map((event) => String(event.id)),
    pauses: count(events.filter((event) => event.kind === 'paused').flatMap((event) => event.reasons as string[])).map(
      ([reason, n]) => ({ reason, count: n }),
    ),
    skips: actions
      .filter((event) => event.type === 'advance')
      .map((event) => ({ day: event.day ?? 0, days: Number(event.days) })),
    actions: count(actions.filter(succeeded).map((event) => String(event.type))).map(([type, n]) => ({ type, count: n })),
  }
}

export function formatSummary(summary: SessionSummary): string {
  const first = (name: keyof SessionSummary['firsts']) => {
    const hit = summary.firsts[name]
    return hit ? `day ${hit.day}, ${hit.minutes} min in` : 'never'
  }
  const lines = [
    summary.campaign
      ? `Campaign: seed ${summary.campaign.seed}, ${summary.campaign.difficulty}${summary.campaign.situation ? `, ${summary.campaign.situation}` : ''}`
      : 'Campaign: none opened',
    `Played ${summary.minutesPlayed} min, reached day ${summary.dayReached}${summary.finishedYear ? ', finished the year' : ''}`,
    '',
    `First decision:     ${first('decision')}`,
    `First enquiry:      ${first('enquiry')}`,
    `First programme:    ${first('programme')}`,
    `First board paper:  ${first('boardPaper')}`,
    '',
    'Screens (minutes, visits):',
    ...summary.screens.map((s) => `  ${s.screen.padEnd(14)} ${String(s.minutes).padStart(5)}  ${s.visits}`),
    '',
    `Glossary opened: ${summary.glossary.length === 0 ? 'never' : summary.glossary.join(', ')}`,
    `Lessons dismissed: ${summary.lessonsDismissed.length === 0 ? 'none' : summary.lessonsDismissed.join(', ')}`,
    `Clock stopped for: ${summary.pauses.length === 0 ? 'nothing' : summary.pauses.map((p) => `${p.reason} ×${p.count}`).join(', ')}`,
    `Skipped ahead: ${summary.skips.length === 0 ? 'never' : summary.skips.map((s) => `day ${s.day}`).join(', ')}`,
    '',
    'Actions taken:',
    ...summary.actions.map((a) => `  ${a.type.padEnd(24)} ${a.count}`),
  ]
  return lines.join('\n')
}
