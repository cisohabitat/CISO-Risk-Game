/**
 * Responsive application shell (plan §28).
 *
 * Mobile: a bottom bar with four destinations plus More, and a compact header.
 * Tablet and desktop: a persistent rail, a wider header and room for context.
 * The same screens are reachable everywhere; only the presentation changes.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { DESTINATIONS, destinationFor } from '@/app/navigation'
import { useGameStore, type Screen } from '@/store/game-store'
import { briefing } from '@/store/selectors'
import { TimeControls } from '@/components/game/TimeControls'
import { Badge, Button, Dialog } from '@/components/ui/primitives'
import { cn } from '@/lib/utils/cn'
import { money } from '@/lib/formatting/labels'
import { capacityTone } from '@/lib/formatting/labels'

export function AppShell({ children }: { children: ReactNode }) {
  const state = useGameStore((store) => store.state)
  const index = useGameStore((store) => store.index)
  const screen = useGameStore((store) => store.ui.screen)
  const setScreen = useGameStore((store) => store.setScreen)
  const openGlossary = useGameStore((store) => store.openGlossary)
  const [moreOpen, setMoreOpen] = useState(false)

  if (!state) return null
  const view = briefing(state, index)
  const primary = DESTINATIONS.filter((destination) => destination.primary)
  const secondary = DESTINATIONS.filter((destination) => !destination.primary)
  const current = destinationFor(screen)

  const go = (next: Screen) => {
    setScreen(next)
    setMoreOpen(false)
  }

  return (
    /* On wide screens the rail stays put and only the content pane scrolls;
       on small screens the page scrolls normally under a fixed bottom bar. */
    <div className="flex min-h-[100dvh] flex-col bg-paper lg:h-[100dvh] lg:min-h-0 lg:flex-row lg:overflow-hidden">
      {/* Desktop rail */}
      <nav
        aria-label="Primary"
        className="hidden shrink-0 border-r border-line bg-surface lg:flex lg:h-full lg:w-60 lg:flex-col xl:w-64"
      >
        <div className="border-b border-line px-5 py-5">
          <p className="font-display text-xl leading-tight">CISO: First Year</p>
          <p className="mt-0.5 text-xs uppercase tracking-[0.18em] text-ink-faint">Nexora Group</p>
        </div>
        <ul className="scroll-area flex-1 space-y-1 p-3">
          {DESTINATIONS.map((destination) => (
            <li key={destination.id}>
              <button
                type="button"
                onClick={() => go(destination.id)}
                aria-current={screen === destination.id ? 'page' : undefined}
                aria-label={destination.label}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  screen === destination.id
                    ? 'bg-surface-3 font-medium text-ink'
                    : 'text-ink-muted hover:bg-surface-2 hover:text-ink',
                )}
              >
                <span aria-hidden="true" className="w-4 text-center text-base text-ink-faint">{destination.icon}</span>
                <span className="flex-1">{destination.label}</span>
                {destination.id === 'inbox' && view.unreadMessages > 0 && (
                  <span className="rounded-full bg-accent px-1.5 py-0.5 text-xs font-semibold text-ink-inverse tabular-nums">
                    {view.unreadMessages}
                  </span>
                )}
                {destination.id === 'home' && view.openDecisions > 0 && (
                  <span className="rounded-full bg-brass px-1.5 py-0.5 text-xs font-semibold text-ink-inverse tabular-nums">
                    {view.openDecisions}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
        <div className="space-y-3 border-t border-line p-4 text-sm">
          <dl className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-xs uppercase tracking-wider text-ink-faint">Budget left</dt>
              <dd className="font-medium tabular-nums">{money(view.budgetRemaining)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-xs uppercase tracking-wider text-ink-faint">Your week</dt>
              <dd className="font-medium tabular-nums">
                {view.focusRemaining}/{view.focusPerWeek}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-xs uppercase tracking-wider text-ink-faint">Team</dt>
              <dd><Badge tone={capacityTone(view.teamCapacity)} glyph={false}>{view.teamCapacity}</Badge></dd>
            </div>
          </dl>
          <Button variant="quiet" size="sm" block onClick={() => openGlossary()} className="compact min-h-10">
            Glossary
          </Button>
        </div>
      </nav>

      <div className="flex min-w-0 flex-1 flex-col lg:h-full lg:overflow-hidden">
        <ShellHeader />
        <main
          id="main"
          className="scroll-area flex-1 pb-24 lg:pb-8"
          aria-label={current?.label ?? 'Game'}
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6">{children}</div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="grid grid-cols-5">
          {primary.map((destination) => (
            <li key={destination.id}>
              <button
                type="button"
                onClick={() => go(destination.id)}
                aria-current={screen === destination.id ? 'page' : undefined}
                aria-label={destination.label}
                className={cn(
                  'flex h-16 w-full flex-col items-center justify-center gap-0.5 text-[0.7rem] font-medium transition-colors',
                  screen === destination.id ? 'text-accent-ink' : 'text-ink-muted',
                )}
              >
                <span aria-hidden="true" className="relative text-lg leading-none">
                  {destination.icon}
                  {destination.id === 'inbox' && view.unreadMessages > 0 && (
                    <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-accent" />
                  )}
                  {destination.id === 'home' && view.openDecisions > 0 && (
                    <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-brass" />
                  )}
                </span>
                {destination.shortLabel}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              aria-haspopup="dialog"
              className={cn(
                'flex h-16 w-full flex-col items-center justify-center gap-0.5 text-[0.7rem] font-medium',
                secondary.some((destination) => destination.id === screen) ? 'text-accent-ink' : 'text-ink-muted',
              )}
            >
              <span aria-hidden="true" className="text-lg leading-none">⋯</span>
              More
            </button>
          </li>
        </ul>
      </nav>

      <Dialog open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <ul className="space-y-2">
          {secondary.map((destination) => (
            <li key={destination.id}>
              <button
                type="button"
                onClick={() => go(destination.id)}
                aria-label={destination.label}
                className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface-2 px-4 py-3 text-left"
              >
                <span aria-hidden="true" className="text-lg text-ink-faint">{destination.icon}</span>
                <span>
                  <span className="block font-medium">{destination.label}</span>
                  <span className="block text-sm text-ink-muted">{destination.description}</span>
                </span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false)
                openGlossary()
              }}
              className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface-2 px-4 py-3 text-left"
            >
              <span aria-hidden="true" className="text-lg text-ink-faint">?</span>
              <span>
                <span className="block font-medium">Glossary</span>
                <span className="block text-sm text-ink-muted">What the game means by its terms</span>
              </span>
            </button>
          </li>
        </ul>
      </Dialog>
    </div>
  )
}

function ShellHeader() {
  const state = useGameStore((store) => store.state)
  const index = useGameStore((store) => store.index)
  const saveManual = useGameStore((store) => store.saveManual)
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (document.documentElement.dataset.theme as 'dark' | 'light') ?? 'dark',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('ciso-theme', theme)
    } catch {
      /* Theme preference is a convenience; blocked storage must not break play. */
    }
  }, [theme])

  if (!state) return null
  const view = briefing(state, index)

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      {/* One row on wide screens; on phones the clock drops to its own row so
          the date and the save/theme controls stay readable. */}
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 sm:py-3">
        <div className="order-1 min-w-0 flex-1 lg:flex-none">
          <p className="truncate text-sm font-medium">
            {view.dateLabel}
            <span className="text-ink-faint"> · {view.weekLabel} · Q{view.quarter}</span>
          </p>
          <p className="truncate text-xs text-ink-faint lg:hidden">
            {money(view.budgetRemaining)} left · {view.focusRemaining}/{view.focusPerWeek} attention
          </p>
        </div>
        <div className="order-2 flex items-center gap-1 lg:order-3">
          <Button
            size="sm"
            variant="ghost"
            className="compact min-h-9 px-2.5"
            onClick={() => void saveManual()}
            title="Save campaign"
          >
            <span aria-hidden="true">💾</span>
            <span className="sr-only">Save campaign</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="compact min-h-9 px-2.5"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
            <span className="sr-only">{theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}</span>
          </Button>
        </div>
        <div className="order-3 w-full lg:order-2 lg:flex lg:w-auto lg:flex-1 lg:justify-end">
          <TimeControls compact />
        </div>
      </div>
    </header>
  )
}
