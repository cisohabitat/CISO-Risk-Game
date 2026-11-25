import { Button } from '@/components/ui/primitives'
import { useCampaignIndex, useGameStore } from '@/store/game-store'
import { openSocWarnings } from '@/store/selectors'
import { shortDate } from '@/lib/formatting/labels'

/**
 * SOC warnings on the Briefing, with the way to check them. They were mail
 * among a hundred unread, passed inside long skips, and the incident review
 * then asked why nobody hunted (owner, 25 November: design issues A and B).
 */
export function SocWarnings() {
  const state = useGameStore((store) => store.state)
  const index = useCampaignIndex()
  const setScreen = useGameStore((store) => store.setScreen)
  const setUi = useGameStore((store) => store.setUi)
  if (!state || state.finished) return null
  const warnings = openSocWarnings(state, index)
  if (warnings.length === 0) return null
  return <aside aria-label="SOC warnings" data-testid="soc-warnings" className="mb-4 rounded-lg border border-band-elevated/50 p-3 text-sm">
    <p className="font-medium">{warnings.length === 1 ? 'The SOC raised a warning' : `The SOC raised ${warnings.length} warnings`}</p>
    <ul className="mt-1 space-y-1">
      {warnings.map((warning) => <li key={warning.messageId}><span className="tabular-nums text-ink-faint">{shortDate(warning.day)}</span> · {warning.subject}{warning.where ? `, around ${warning.where}` : ''}.</li>)}
    </ul>
    <p className="mt-1 text-ink-muted">A warning can be noise or the start of an intrusion. A targeted threat hunt is how you find out; the review will ask whether one ran.</p>
    <div className="mt-2 flex flex-wrap gap-2">
      <Button variant="secondary" size="sm" onClick={() => { setScreen('risk'); setUi({ riskTab: 'investigate' }) }}>Commission a hunt</Button>
      <Button variant="quiet" size="sm" onClick={() => { setUi({ selectedMessageId: warnings[0]!.messageId }); setScreen('inbox') }}>Read the warning</Button>
    </div>
  </aside>
}
