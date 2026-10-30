import { useState } from 'react'
import desktopScene from '@/assets/art/start-desktop.webp'
import mobileScene from '@/assets/art/start-mobile.webp'
import { GUIDE_URL } from '@/app/navigation'

interface StartHeroProps {
  disabled: boolean
  beginning: boolean
  continuing: boolean
  onBegin: () => void
  onContinue?: () => void
  resumeLabel?: string
  savingUnavailable: boolean
}

/** The title screen is the start screen itself; artwork never gates play. */
export function StartHero({ disabled, beginning, continuing, onBegin, onContinue, resumeLabel, savingUnavailable }: StartHeroProps) {
  const [artFailed, setArtFailed] = useState(false)
  return (
    <header className="start-hero">
      {!artFailed && <picture className="start-scene" aria-hidden="true">
        <source media="(max-width:639px),(orientation:portrait)" srcSet={mobileScene} />
        <img src={desktopScene} alt="" width="1600" height="900" decoding="async" fetchPriority="low" onError={() => setArtFailed(true)} />
      </picture>}
      <div className="start-content">
        <div className="start-heading">
          <p className="start-company">Nexora Group <span>· Office of the CISO</span></p>
          <h1 className="start-title" aria-label="CISO: First Year">
            <span className="start-wordmark" aria-hidden="true">CIS<span className="start-letter-o">O</span></span>
            <span className="start-subtitle" aria-hidden="true">First Year</span>
          </h1>
          <p className="start-tagline">Every decision has a consequence.</p>
        </div>
        <div className="start-actions">
          <p className="start-intro">Lead Nexora through a year of cyber risk, limited resources, and difficult decisions.</p>
          {savingUnavailable && <p className="start-storage" role="status">Saving is unavailable in this browser. You can still play in this tab.</p>}
          <div className="start-buttons">
            <button type="button" className="start-play" disabled={disabled} aria-busy={beginning} onClick={onBegin}>
              <span>{beginning ? 'Opening your year…' : 'Begin your first year'}</span><span aria-hidden="true">→</span>
            </button>
            {onContinue && (
              <>
                <button type="button" className="start-continue" disabled={disabled} aria-busy={continuing} aria-describedby="start-resume" onClick={onContinue}>
                  <span>{continuing ? 'Resuming…' : 'Continue campaign'}</span><span aria-hidden="true">→</span>
                </button>
                <p id="start-resume" className="start-resume">{resumeLabel}</p>
              </>
            )}
          </div>
          <nav className="start-links" aria-label="Getting started">
            <a href={GUIDE_URL} target="_blank" rel="noopener">Player's guide<span className="sr-only"> (opens in a new tab)</span></a>
            <a href="/about">About</a>
            <a href="#campaign-options">Campaign options</a>
            {onContinue && <a href="#saved-campaigns">Saved campaigns</a>}
          </nav>
        </div>
        <p className="start-caption">A strategy game about decisions, people, and resilience.</p>
      </div>
    </header>
  )
}
