/**
 * The whole campaign as one strip (plan §26).
 *
 * The annual review is eight dimensions of prose, and a player who has just
 * spent a year deciding things reads it without being able to see the year. The
 * question a playtest asks last is "what did you think this year was about?",
 * and this is the answer put on screen.
 *
 * Three things it deliberately does:
 *
 * - **Identity by lane, not by colour.** Six rows, each with its own label and
 *   icon. Remove the colour entirely — print it, or view it with any
 *   colour-vision deficiency — and the figure still reads, which is the rule
 *   the rest of the app already holds to.
 * - **Thin marks.** A tick is 3px, not an icon bubble. The icon lives once on
 *   the lane's label, where it can be read at size, rather than 21 times at
 *   11px where it cannot.
 * - **Says it in words too.** Every mark is also a row in the list underneath,
 *   with its day. That is the readable equivalent, not an afterthought: it is
 *   what a screen reader gets, and what anybody gets on a narrow phone where
 *   364 days will not fit legibly.
 */
import { CAMPAIGN_DAYS } from '@/game/types'
import { Icon } from '@/components/ui/icons'
import type { TimelineLane } from '@/store/selectors'
import { dayLabel } from '@/lib/formatting/labels'

/** Day 1 sits at the left edge, day 364 at the right. */
function offset(day: number): number {
  return Math.min(100, Math.max(0, (day / CAMPAIGN_DAYS) * 100))
}

function Lane({ lane }: { lane: TimelineLane }) {
  const colour = `var(${lane.tone})`
  const empty = lane.marks.length === 0 && lane.spans.length === 0

  return (
    <div className="flex flex-col gap-1 sm:grid sm:grid-cols-[1.25rem_minmax(0,10rem)_minmax(0,1fr)] sm:items-center sm:gap-x-3">
      <span className="hidden sm:block sm:justify-self-end" style={{ color: colour }}>
        <Icon name={lane.icon} size={17} />
      </span>
      <div className="flex items-center gap-2 sm:block sm:text-right">
        <span className="sm:hidden" style={{ color: colour }}>
          <Icon name={lane.icon} size={16} />
        </span>
        <span className="text-sm font-medium leading-tight">{lane.label}</span>
        <span className="text-xs text-ink-muted sm:mt-0.5 sm:block">{lane.summary}</span>
      </div>

      <div className="relative h-10 border-t border-line">
        {empty && (
          <span className="absolute inset-y-0 left-0 flex items-center text-xs text-ink-faint">
            nothing this year
          </span>
        )}

        {lane.spans.map((span) => (
          <span
            key={`${span.label}-${span.fromDay}`}
            className="absolute top-1/2 h-4 -translate-y-1/2 rounded-full border"
            style={{
              left: `${offset(span.fromDay)}%`,
              width: `${Math.max(1.2, offset(span.toDay) - offset(span.fromDay))}%`,
              borderColor: colour,
              borderStyle: span.complete ? 'solid' : 'dashed',
              background: span.complete ? colour : 'transparent',
              opacity: span.complete ? 0.28 : 1,
            }}
          >
            <span className="sr-only">
              {span.label}: {dayLabel(span.fromDay)} to {dayLabel(span.toDay)}
              , {span.ending}
            </span>
          </span>
        ))}

        {lane.marks.map((mark, i) => (
          <span
            key={`${mark.day}-${i}`}
            className="absolute top-1/2 h-5 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              left: `${offset(mark.day)}%`,
              background: mark.present ? colour : 'transparent',
              // A lapsed decision is drawn as the gap it was: an outline where a
              // mark would have been.
              border: mark.present ? 'none' : `1.5px dashed var(--ink-faint)`,
            }}
          >
            <span className="sr-only">
              {mark.label}, {dayLabel(mark.day)}
              {mark.present ? '' : ' (lapsed)'}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

export function YearTimeline({ lanes }: { lanes: TimelineLane[] }) {
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4']

  return (
    <figure className="m-0 space-y-3">
      <figcaption className="sr-only">
        Your year at Nexora, as six lanes across 364 days. Every mark is also listed below with its date.
      </figcaption>

      <div className="space-y-1.5">
        {/* The axis. On a phone the lanes stack and the track runs the full
            width, so the quarters run the full width too — without them a mark
            three-quarters along the row says nothing about when it happened. */}
        <div className="grid grid-cols-4 sm:hidden" aria-hidden="true">
          {quarters.map((q) => (
            <span key={q} className="border-l border-line pl-2 text-xs font-medium text-ink-faint">
              {q}
            </span>
          ))}
        </div>
        <div className="hidden sm:grid sm:grid-cols-[1.25rem_minmax(0,10rem)_minmax(0,1fr)] sm:gap-x-3">
          <span />
          <span />
          <div className="grid grid-cols-4" aria-hidden="true">
            {quarters.map((q) => (
              <span key={q} className="border-l border-line pl-2 text-xs font-medium text-ink-faint">
                {q}
              </span>
            ))}
          </div>
        </div>

        {lanes.map((lane) => (
          <Lane key={lane.id} lane={lane} />
        ))}
      </div>

      <details className="rounded-lg border border-line bg-surface-2">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium">Read the year as a list</summary>
        <div className="space-y-4 border-t border-line p-3">
          {lanes.map((lane) => {
            const rows = [
              ...lane.spans.map((s) => ({
                day: s.fromDay,
                text: `${s.label} — started ${dayLabel(s.fromDay)}, ${s.complete ? `completed ${dayLabel(s.toDay)}` : s.ending}`,
              })),
              ...lane.marks.map((m) => ({
                day: m.day,
                text: `${m.label} — ${dayLabel(m.day)}${m.present ? '' : ' (lapsed, decided by default)'}`,
              })),
            ].sort((a, b) => a.day - b.day)

            return (
              <div key={lane.id}>
                <h4 className="flex items-center gap-2 text-sm font-medium">
                  <span style={{ color: `var(${lane.tone})` }}>
                    <Icon name={lane.icon} size={15} />
                  </span>
                  {lane.label}
                  <span className="font-normal text-ink-muted">· {lane.summary}</span>
                </h4>
                {rows.length === 0 ? (
                  <p className="mt-1 text-sm text-ink-faint">Nothing this year.</p>
                ) : (
                  <ul className="mt-1 space-y-0.5">
                    {rows.map((row, i) => (
                      <li key={`${row.day}-${i}`} className="text-sm text-ink-muted text-pretty">
                        {row.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </details>
    </figure>
  )
}
