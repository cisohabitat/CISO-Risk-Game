/**
 * Shown only while a playtest session is being recorded, so the player always
 * knows it is. Exporting hands over the file; stopping exports it one last
 * time and clears it, so the next person on this device starts a log of their
 * own rather than adding to somebody else's.
 */
import { Button } from '@/components/ui/primitives'
import { setRecording, useRecording } from '@/store/session-recording'

export function RecordingControl({ className }: { className?: string }) {
  const recording = useRecording()
  if (!recording) return null

  const exportLog = () => void import('@/store/session-log').then((log) => log.downloadSessionLog())
  const stop = () =>
    void import('@/store/session-log').then((log) => {
      log.downloadSessionLog()
      log.clearSessionLog()
      setRecording(false)
    })

  return (
    <div className={className} data-testid="recording-control">
      <p className="flex items-center gap-2 text-xs text-ink-muted">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-band-severe" />
        Recording this session for a playtest
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button variant="quiet" size="sm" block className="compact min-h-9" onClick={exportLog}>
          Export log
        </Button>
        <Button variant="quiet" size="sm" block className="compact min-h-9" onClick={stop}>
          Stop and export
        </Button>
      </div>
    </div>
  )
}
