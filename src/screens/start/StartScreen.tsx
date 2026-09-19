/**
 * Entry point. The player must be able to start without an account, without
 * reading anything, and be making a real decision inside a minute (plan §6, §53).
 */
import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Card, CardBody, Disclosure } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'
import { parseImportedSave, storageAvailable } from '@/store/persistence'
import type { Difficulty } from '@/game/types'
import { cn } from '@/lib/utils/cn'

const DIFFICULTIES: { id: Difficulty; label: string; description: string }[] = [
  {
    id: 'guided',
    label: 'Guided',
    description: 'More budget, more capacity, a calmer threat environment and plainer explanations of the mechanics.',
  },
  {
    id: 'ciso',
    label: 'CISO',
    description: 'The intended experience. Scarce attention, an incomplete picture and executives with their own priorities.',
  },
  {
    id: 'high-pressure',
    label: 'High pressure',
    description: 'Less of everything, more noise, an unforgiving board and a threat environment that is already moving.',
  },
]

function randomSeed(): string {
  const words = ['nexora', 'meridian', 'harbour', 'lattice', 'kestrel', 'corvus', 'sentinel', 'orbit', 'quarry', 'vellum']
  const word = words[Math.floor(Date.now() / 1000) % words.length]
  return `${word}-${Math.abs(Date.now() % 99991)}`
}

export function StartScreen() {
  const startNewGame = useGameStore((store) => store.startNewGame)
  const loadGame = useGameStore((store) => store.loadGame)
  const loadImported = useGameStore((store) => store.loadImported)
  const refreshSaves = useGameStore((store) => store.refreshSaves)
  const pushToast = useGameStore((store) => store.pushToast)
  const saves = useGameStore((store) => store.ui.saves)
  const [seed, setSeed] = useState(randomSeed)
  const [difficulty, setDifficulty] = useState<Difficulty>('ciso')
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void refreshSaves()
  }, [refreshSaves])

  const onImport = async (file: File) => {
    try {
      const text = await file.text()
      const save = parseImportedSave(text)
      loadImported(save.state)
      pushToast('Campaign imported.', 'success')
    } catch (error) {
      pushToast(error instanceof Error ? error.message : 'That file could not be read.', 'warning')
    }
  }

  return (
    <div className="min-h-[100dvh] bg-paper">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.24em] text-ink-faint">A cyber risk strategy game</p>
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">CISO: First Year</h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-muted text-pretty">
            You have just been made Chief Information Security Officer of Nexora Group. You have inherited 6,283 critical
            vulnerabilities, a risk register nobody trusts, four transformation programmes and a CEO who wants three
            answers in twenty-three minutes.
          </p>
          <p className="mt-3 max-w-2xl text-ink-muted text-pretty">
            You cannot fix everything. The job is to work out what actually matters, decide what deserves your
            attention, influence people you do not control, and live with the consequences.
          </p>
        </header>

        {saves.length > 0 && (
          <Card className="mb-6">
            <CardBody>
              <h2 className="font-medium">Continue</h2>
              <ul className="mt-3 space-y-2">
                {saves.slice(0, 4).map((save) => (
                  <li key={save.slot}>
                    <button
                      type="button"
                      onClick={() => void loadGame(save.slot)}
                      className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-4 py-3 text-left hover:border-line-strong"
                    >
                      <span>
                        <span className="block font-medium">
                          Day {save.day} · {save.difficulty}
                        </span>
                        <span className="block text-sm text-ink-faint">
                          seed {save.seed} · saved {new Date(save.savedAtIso).toLocaleString()}
                        </span>
                      </span>
                      <Badge tone="neutral" glyph={false}>{save.slot.startsWith('auto') ? 'Autosave' : save.slot}</Badge>
                    </button>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody className="space-y-6">
            <div>
              <h2 className="font-medium">Start a new year</h2>
              <p className="mt-1 text-sm text-ink-muted">
                No account, no sign-in. Your campaign is saved on this device.
              </p>
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
                How hard should it be?
              </legend>
              <div className="space-y-2">
                {DIFFICULTIES.map((option) => (
                  <label
                    key={option.id}
                    className={cn(
                      'flex cursor-pointer gap-3 rounded-lg border p-3',
                      difficulty === option.id ? 'border-accent bg-accent-soft/40' : 'border-line bg-surface-2',
                    )}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={option.id}
                      checked={difficulty === option.id}
                      onChange={() => setDifficulty(option.id)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
                      style={{ minHeight: 0 }}
                    />
                    <span>
                      <span className="block font-medium">{option.label}</span>
                      <span className="mt-0.5 block text-sm text-ink-muted text-pretty">{option.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/*
              Folded away by default. The seed is a replay tool, not part of
              arriving as the new CISO, and a first-time player asked to choose
              one before they have started is being asked about the machinery.
            */}
            <details className="rounded-lg border border-line bg-surface-2/60 p-3">
              <summary className="cursor-pointer text-sm font-medium">Replay settings</summary>
              <label className="mt-3 block">
                <span className="mb-2 block text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  Campaign seed
                </span>
                <div className="flex flex-wrap gap-2">
                  <input
                    value={seed}
                    onChange={(event) => setSeed(event.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2.5 text-base"
                    aria-describedby="seed-help"
                  />
                  <Button variant="quiet" onClick={() => setSeed(randomSeed())}>New seed</Button>
                </div>
                <p id="seed-help" className="mt-2 text-sm text-ink-muted text-pretty">
                  The seed fixes this world's hidden configuration: which awkward dependencies exist, how good the
                  controls really are, and what the executives are like. The same seed always produces the same Nexora.
                </p>
              </label>
            </details>

            <Button
              variant="primary"
              size="lg"
              block
              onClick={() => void startNewGame(seed.trim() || randomSeed(), difficulty)}
            >
              Begin your first day
            </Button>

            {!storageAvailable() && (
              <p className="rounded-lg border border-band-elevated/40 bg-band-elevated-soft/50 p-3 text-sm">
                This browser will not let the game store data, so your campaign cannot be saved. You can still play a
                full year in this tab.
              </p>
            )}

            <Disclosure summary="Import a saved campaign">
              <p className="mb-3 text-pretty">
                Campaigns can be exported to a JSON file from the debrief screen and brought back here — useful if you
                clear your browser data or move device.
              </p>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void onImport(file)
                }}
              />
              <Button variant="secondary" size="sm" onClick={() => fileInput.current?.click()}>
                Choose a save file
              </Button>
            </Disclosure>
          </CardBody>
        </Card>

        <p className="mt-8 text-center text-sm text-ink-faint text-pretty">
          Nexora Group is fictional. Any resemblance to your own organisation is a coincidence you should probably act on.
        </p>
      </div>
    </div>
  )
}
