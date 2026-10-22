import { useEffect, useRef, useState } from 'react'
import type { InboxMessage } from '@/game/types'
import { Button } from '@/components/ui/primitives'
import recordings from '@/assets/voice/manifest.json'

const files = import.meta.glob<string>('/src/assets/voice/*.mp3', { eager: true, query: '?url', import: 'default' })

export default function CharacterVoicePlayer({ message }: { message: InboxMessage }) {
  const player = useRef<HTMLAudioElement>(null)
  const [started, setStarted] = useState(false)
  const [failed, setFailed] = useState(false)
  // Exact matching protects edited content, imports and subsequent-year text.
  const clip = recordings.find((entry) => entry.eventId === message.eventId &&
    entry.from === message.from && entry.subject === message.subject && entry.body === message.body)
  const url = clip && files[`/src/assets/voice/${clip.file}`]

  useEffect(() => {
    const audio = player.current
    const stopWhenHidden = () => { if (document.hidden) audio?.pause() }
    document.addEventListener('visibilitychange', stopWhenHidden)
    return () => {
      document.removeEventListener('visibilitychange', stopWhenHidden)
      if (audio) {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
      }
    }
  }, [url])

  if (!clip || !url) return null

  const play = () => {
    const audio = player.current
    if (!audio) return
    setFailed(false)
    setStarted(true)
    if (!audio.getAttribute('src')) audio.src = url
    audio.currentTime = 0
    void audio.play().catch(() => setFailed(true))
  }

  return (
    <div className="mt-3 space-y-2 print:hidden">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={play}>{started ? 'Replay message' : 'Play message'}</Button>
        {started && <Button variant="quiet" size="sm" onClick={() => {
          if (player.current) { player.current.pause(); player.current.currentTime = 0 }
        }}>Stop voice</Button>}
      </div>
      <p className="text-xs text-ink-faint">AI-generated character voice. The full message is below.</p>
      <audio ref={player} controls={started} preload="none" tabIndex={0} className={started ? 'block w-full max-w-sm' : 'hidden'}
        aria-label={`Voice message from ${message.from}`} onError={() => setFailed(true)} />
      {failed && <p role="status" className="text-sm text-ink-muted">Voice could not play. You can read the full message below or try Replay message.</p>}
    </div>
  )
}
