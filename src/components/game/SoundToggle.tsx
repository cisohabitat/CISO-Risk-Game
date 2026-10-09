/** Sound, off until the player asks for it (docs/ROADMAP.md, Phase 3). */
import { Button } from '@/components/ui/primitives'
import { setSound, useSound } from '@/lib/sound/sound-setting'

export function SoundToggle({ className }: { className?: string }) {
  const on = useSound()
  return (
    <Button
      variant="quiet"
      size="sm"
      block
      className={className}
      aria-pressed={on}
      onClick={() => setSound(!on)}
      data-testid="sound-toggle"
    >
      {on ? 'Sound on' : 'Sound off'}
    </Button>
  )
}
