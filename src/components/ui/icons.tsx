/**
 * Hand-drawn stroke icons, one per concept the year timeline shows.
 *
 * Inline rather than from a library: the critical path runs at 225 kB against a
 * 240 kB budget, and lucide alone would spend most of what is left. These are
 * the seven the timeline needs and nothing else.
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
    default:
      return null
  }
}

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
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
      className="shrink-0"
    >
      <Extras name={name} />
      <path d={PATHS[name]} />
    </svg>
  )
}
