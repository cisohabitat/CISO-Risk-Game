/**
 * What the player's own actions sent back, on the briefing, so a player who
 * follows the briefing and Skip ahead is told what their decisions did
 * without having to go and look for it.
 */
import { Button } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'
import { cameBack } from '@/store/selectors'

const KIND_LABEL: Record<ReturnType<typeof cameBack>[number]['kind'], string> = {
  result: 'Enquiry returned',
  consequence: 'Follow-up to a choice',
  lapse: 'Decided for you',
  acceptance: 'Acceptance ran out',
  stopped: 'Work pulled back',
  incident: 'Incident update',
}

export function CameBack() {
  const state = useGameStore((store) => store.state)
  const index = useGameStore((store) => store.index)
  const setUi = useGameStore((store) => store.setUi)
  const setScreen = useGameStore((store) => store.setScreen)
  if (!state) return null
  const items = cameBack(state, index)
  if (items.length === 0) return null

  return (
    <section aria-labelledby="came-back" className="border-y border-line py-3">
      <h2 id="came-back" className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
        Came back to you
      </h2>
      <ul className="mt-2 divide-y divide-line">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{item.subject}</p>
              <p className="text-xs text-ink-faint">
                {KIND_LABEL[item.kind]} · {item.from} · day {item.day}
              </p>
            </div>
            <Button
              variant="quiet"
              size="sm"
              onClick={() => {
                setUi({ selectedMessageId: item.id })
                setScreen('inbox')
              }}
            >
              Read
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}
