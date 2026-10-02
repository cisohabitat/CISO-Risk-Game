/**
 * Hand-drawn stroke icons: the concepts the year timeline shows, the screens
 * the navigation goes to, and the header's controls.
 *
 * Inline rather than from a library: lucide alone would spend most of what the
 * critical path has left. The navigation and the header used Unicode shapes
 * and a colour emoji (◎ ✉ ◈ ⬡ ▤ ◍ ❖ ◷, 💾 ⏏ ☾), which every operating system
 * draws differently and which sat beside these line icons in a different
 * style; one set now covers all of them.
 *
 * They take their colour from `currentColor`, so a lane sets the colour once on
 * its label and the icon follows. Every one is `aria-hidden`: the icon repeats
 * a label that is already written beside it in words.
 */

export type IconName =
  | 'decision'
  | 'lapsed'
  | 'programme'
  | 'enquiry'
  | 'board'
  | 'assumption'
  | 'incident'
  | 'briefing'
  | 'inbox'
  | 'risk'
  | 'organisation'
  | 'team'
  | 'year'
  | 'save'
  | 'leave'
  | 'moon'
  | 'sun'
  | 'play'
  | 'pause'
  | 'external'
  | 'check'
  | 'plus'

const PATHS: Record<IconName, string> = {
  // A fork in the road: two ways out of one place.
  decision: 'M12 20.8v-7.4M12 13.4 6.4 7.2M12 13.4l5.6-6.2',
  // A clock with the hour struck through.
  lapsed: 'M12 7.4V12l3.2 2M5.6 5.6l12.8 12.8',
  // Capability stacked up over time.
  programme: 'M3.4 17.4h17.2M3.4 12h11.6M3.4 6.6h6.4',
  // The magnifier.
  enquiry: 'M15.4 15.4l4.4 4.4',
  // A paper with lines on it.
  board: 'M8 8.2h8M8 12h8M8 15.8h4.8',
  // A shield with a crack running through it.
  assumption: 'M12 3.4 5 6.1v5.2c0 4 2.9 7.6 7 9.3 4.1-1.7 7-5.3 7-9.3V6.1Zm1.2 4.6-2.9 4.3h3.4L10.8 16',
  // The warning triangle.
  incident: 'M12 3.6 2.7 20.2h18.6ZM12 10v4.2',
  // A folded brief with its headline rule.
  briefing: 'M8 8.4h8M8 12h8M8 15.6h5',
  // An envelope.
  inbox: 'M4 7.4l8 5.8 8-5.8',
  // A diamond with a mark in it: something to weigh.
  risk: 'M12 3.4 20.6 12 12 20.6 3.4 12ZM12 8.4v4.4',
  // Three things and what joins them.
  organisation: 'M7.9 7.6 10.6 15.8M16.1 7.6 13.4 15.8M8.4 5.8h7.2',
  // Two people.
  team: 'M3.6 19.2c.6-3.1 2.8-4.9 5.4-4.9s4.8 1.8 5.4 4.9M15.6 14.4c2.2.1 4 1.7 4.7 4.4',
  // A clock.
  year: 'M12 7.4V12l3.2 2',
  // A disk, drawn as a line icon rather than an emoji.
  save: 'M5 4.2h11l3 3v12.6H5ZM8.2 4.2v4.6h6.6V4.2M8.2 19.8v-5.6h7.6v5.6',
  // Out through the door.
  leave: 'M13.6 4.4H5.8v15.2h7.8M10.4 12h9.4M17 9l3 3-3 3',
  moon: 'M19.8 14.6A8 8 0 0 1 9.4 4.2a8 8 0 1 0 10.4 10.4Z',
  sun: 'M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4',
  play: 'M8.2 5.6v12.8L18.6 12Z',
  pause: 'M9 5.8v12.4M15 5.8v12.4',
  // Opens elsewhere.
  external: 'M13.4 4.6h6v6M19.4 4.6l-8.6 8.6M17.6 13.8v5.6H4.6V6.4h5.6',
  check: 'M5 12.6l4.4 4.4L19 7.4',
  plus: 'M12 5.4v13.2M5.4 12h13.2',
}

/** Extra shapes some icons need beyond a single path. */
function Extras({ name }: { name: IconName }) {
  switch (name) {
    case 'decision':
      return (
        <>
          <circle cx="6.4" cy="5.6" r="1.8" />
          <circle cx="17.6" cy="5.6" r="1.8" />
        </>
      )
    case 'lapsed':
      return <circle cx="12" cy="12" r="8.4" />
    case 'enquiry':
      return <circle cx="10.8" cy="10.8" r="6.2" />
    case 'board':
      return <rect x="4.6" y="3.2" width="14.8" height="17.6" rx="1.8" />
    case 'incident':
      return <circle cx="12" cy="17.2" r="0.9" fill="currentColor" stroke="none" />
    case 'briefing':
      return <rect x="4.6" y="4.2" width="14.8" height="15.6" rx="1.8" />
    case 'inbox':
      return <rect x="3.6" y="5.6" width="16.8" height="12.8" rx="2" />
    case 'risk':
      return <circle cx="12" cy="15.8" r="0.9" fill="currentColor" stroke="none" />
    case 'organisation':
      return (
        <>
          <circle cx="6.4" cy="5.8" r="2" />
          <circle cx="17.6" cy="5.8" r="2" />
          <circle cx="12" cy="18" r="2" />
        </>
      )
    case 'team':
      return (
        <>
          <circle cx="9" cy="8.6" r="3" />
          <circle cx="16.4" cy="9.6" r="2.3" />
        </>
      )
    case 'year':
      return <circle cx="12" cy="12" r="8.4" />
    case 'sun':
      return <circle cx="12" cy="12" r="3.8" />
    case 'play':
      return null
    default:
      return null
  }
}

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className ? `shrink-0 ${className}` : 'shrink-0'}
    >
      <Extras name={name} />
      <path d={PATHS[name]} />
    </svg>
  )
}
