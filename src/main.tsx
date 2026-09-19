import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/App'
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

const container = document.getElementById('root')
if (!container) throw new Error('Root container missing')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
