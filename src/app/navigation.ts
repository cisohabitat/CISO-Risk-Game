/**
 * Navigation model. The same simulation is presented differently by width
 * (plan §28): mobile gets four primary destinations plus More, desktop gets the
 * full rail. Nothing is reachable on one and unreachable on another.
 */
import type { Screen } from '@/store/game-store'

export interface Destination {
  id: Screen
  label: string
  shortLabel: string
  description: string
  icon: string
  /** Shown in the mobile bottom bar rather than behind "More". */
  primary: boolean
  shortcut?: string
}

export const DESTINATIONS: Destination[] = [
  { id: 'home', label: 'Briefing', shortLabel: 'Home', description: 'Today, and what needs you', icon: '◎', primary: true, shortcut: 'h' },
  { id: 'inbox', label: 'Inbox', shortLabel: 'Inbox', description: 'What the organisation is telling you', icon: '✉', primary: true, shortcut: 'i' },
  { id: 'risk', label: 'Risk', shortLabel: 'Risk', description: 'Evidence, hypotheses and risk scenarios', icon: '◈', primary: true, shortcut: 'r' },
  { id: 'organisation', label: 'Organisation', shortLabel: 'Org', description: 'How Nexora actually fits together', icon: '⬡', primary: true, shortcut: 'o' },
  { id: 'programmes', label: 'Programmes', shortLabel: 'Programmes', description: 'Capability you are building', icon: '▤', primary: false, shortcut: 'p' },
  { id: 'team', label: 'Team', shortLabel: 'Team', description: 'Your people and their capacity', icon: '◍', primary: false, shortcut: 't' },
  { id: 'board', label: 'Board', shortLabel: 'Board', description: 'Executives, and what they believe', icon: '❖', primary: false, shortcut: 'b' },
]

export function destinationFor(screen: Screen): Destination | undefined {
  return DESTINATIONS.find((destination) => destination.id === screen)
}

export const KEYBOARD_HELP: { keys: string; action: string }[] = [
  { keys: 'Space', action: 'Pause or resume time' },
  { keys: '→', action: 'Advance to the next meaningful event' },
  { keys: 'H', action: 'Briefing' },
  { keys: 'I', action: 'Inbox' },
  { keys: 'R', action: 'Risk' },
  { keys: 'O', action: 'Organisation' },
  { keys: 'P', action: 'Programmes' },
  { keys: 'T', action: 'Team' },
  { keys: 'B', action: 'Board' },
  { keys: 'G', action: 'Glossary' },
  { keys: 'Esc', action: 'Close a dialog or inspector' },
]
