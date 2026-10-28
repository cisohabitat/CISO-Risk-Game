/**
 * What only a second year says: its events and its decisions. A module of its
 * own so the build can put it in a download of its own (`vite.config.ts`),
 * fetched when a second year begins or a second-year save opens.
 */
import events from './events/year-two.json'
import decisions from './decisions-year-two.json'
import type { YearTwoContent } from './assemble'

export const yearTwo: YearTwoContent = { events: events.events, decisions: decisions.decisions }
