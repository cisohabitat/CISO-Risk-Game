import { Button } from '@/components/ui/primitives'
import { teamStrain, leaderAsAssigned } from '@/game/team/capacity'
import { useGameStore } from '@/store/game-store'

export function CapacityNotice() {
  const state = useGameStore((store) => store.state)
  if (!state) return null
  const overloaded = Object.values(state.team.leaders).filter((leader) => leaderAsAssigned(state, leader).workload > 0.55).length
  if (teamStrain(state) <= 0.7 && overloaded === 0) return null
  return <section aria-label="Before commissioning more work" className="rounded-lg border border-band-elevated/50 bg-band-elevated-soft p-3 text-sm">
    <p className="font-medium">Pause before commissioning more work</p>
    <p className="mt-1">{overloaded > 0 ? `${overloaded} ${overloaded === 1 ? 'leader already has' : 'leaders already have'} substantial commitments. ` : ''}More enquiries compete with programmes for the same people. Finish one, or pause something, before adding another: your attention is not your team's time.</p>
    <Button variant="secondary" size="sm" className="mt-2" onClick={() => useGameStore.getState().setScreen('team')}>Review team workload</Button>
  </section>
}
