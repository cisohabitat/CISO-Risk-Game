import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
import { useGameStore } from '@/store/game-store'
import { resumeRecording } from '@/store/session-recording'
import { resumeSound } from '@/lib/sound/sound-setting'
import './index.css'

// Theme preference is restored before first paint where storage allows it.
try {
  const stored = localStorage.getItem('ciso-theme')
  if (stored === 'light' || stored === 'dark') {
    document.documentElement.dataset.theme = stored
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    document.documentElement.dataset.theme = 'light'
  }
} catch {
  /* Blocked storage must never stop the game loading. */
}

// A playtest session keeps recording across reloads until it is turned off.
resumeRecording()
// Sound stays on across reloads for a player who turned it on.
resumeSound()

// A deploy replaces the hashed files that an open page would fetch next, so
// the campaign it has not loaded yet no longer exists at the address it knows.
// On the start screen nothing is lost by reloading to pick up the new version;
// once a campaign is open the error is left to surface instead. At most once
// in thirty seconds, so a page that is simply offline cannot loop.
window.addEventListener('vite:preloadError', (event) => {
  if (useGameStore.getState().state) return
  try {
    const last = Number(sessionStorage.getItem('ciso-reloaded-at') ?? 0)
    if (Date.now() - last < 30_000) return
    sessionStorage.setItem('ciso-reloaded-at', String(Date.now()))
  } catch {
    return
  }
  event.preventDefault()
  window.location.reload()
})

const container = document.getElementById('root')
if (!container) throw new Error('Root container missing')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
