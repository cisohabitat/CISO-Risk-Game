/**
 * Entry point. The player must be able to start without an account, without
 * reading anything, and be making a real decision inside a minute (plan §6, §53).
 */
import { useEffect, useRef, useState } from 'react'
import { Badge, Button, Card, CardBody, Dialog, Disclosure } from '@/components/ui/primitives'
import { useGameStore } from '@/store/game-store'
import { situationChoices, situationName } from '@/lib/content/situations'
import { parseImportedSave, storageAvailable, type SaveSummary } from '@/store/persistence'
import type { Difficulty } from '@/game/types'
import { cn } from '@/lib/utils/cn'
import { GUIDE_URL } from '@/app/navigation'
import { setRecording, useRecording } from '@/store/session-recording'
import { formatGameDate } from '@/game/time'
import { savedAtLabel } from '@/lib/formatting/saved-at'
import { readSeedLink } from '@/lib/seed-link'

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

const YEAR_IN_THREE = [
  { title: 'Find out what is true', body: 'You inherit a picture. Commission the work that checks it.' },
  { title: 'Spend a week you cannot stretch', body: 'Five actions a week and a budget that does not refill.' },
  { title: 'Answer to the board', body: 'Every quarter, what they hear is your call, and so is what they do not.' },
]

export function StartScreen() {
  const startNewGame = useGameStore((store) => store.startNewGame)
  const loadGame = useGameStore((store) => store.loadGame)
  const loadImported = useGameStore((store) => store.loadImported)
  const ensureCampaign = useGameStore((store) => store.ensureCampaign)
  const deleteCampaign = useGameStore((store) => store.deleteCampaign)
  const deleteAllSaves = useGameStore((store) => store.deleteAllSaves)
  const refreshSaves = useGameStore((store) => store.refreshSaves)
  const pushToast = useGameStore((store) => store.pushToast)
  const saves = useGameStore((store) => store.ui.saves)
  const situations = situationChoices
  // A shared year: the start screen opens on what the link asked for.
  const [link] = useState(() => readSeedLink(window.location.search, situations.map((choice) => choice.id)))
  const [seed, setSeed] = useState(() => link.seed ?? randomSeed())
  const [difficulty, setDifficulty] = useState<Difficulty>(link.mode ?? 'ciso')
  const recording = useRecording()
  const [situation, setSituation] = useState<string>(link.situation ?? situations[0]?.id ?? 'surprise')
  // What the player has asked to delete: one campaign, or everything.
  const [pendingDelete, setPendingDelete] = useState<SaveSummary | 'all' | undefined>()
  const fileInput = useRef<HTMLInputElement>(null)
  // What is being opened. The campaign content is fetched while this screen is
  // up; on a slow connection a quick click can still wait a few seconds for
  // it (2.8 s on Slow 3G a second after the screen appeared), and a button
  // that did nothing for that long would read as broken.
  const [opening, setOpening] = useState<string | undefined>()
  const open = async (what: string, action: () => Promise<unknown>) => {
    setOpening(what)
    try {
      await action()
    } finally {
      setOpening(undefined)
    }
  }

  useEffect(() => {
    void refreshSaves()
  }, [refreshSaves])

  // The campaign is not part of what this screen waits for, but it is fetched
  // as soon as the screen is up, so starting or continuing does not wait on it.
  useEffect(() => {
    void ensureCampaign().catch(() => undefined)
  }, [ensureCampaign])

  const onImport = (file: File) =>
    open('import', async () => {
      try {
        const text = await file.text()
        const save = parseImportedSave(text)
        if (await loadImported(save.state)) pushToast('Campaign imported.', 'success')
      } catch (error) {
        pushToast(error instanceof Error ? error.message : 'That file could not be read.', 'warning')
      }
    })

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
          {/* What a year is made of, before the form asks anything. The start
              screen was a title, two paragraphs and a set of radio buttons. */}
          <ol className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Your year">
            {YEAR_IN_THREE.map((step, position) => (
              <li key={step.title} className="border-t-2 border-accent/60 pt-3">
                <p className="font-display text-sm text-ink-faint">{['I', 'II', 'III'][position]}</p>
                <p className="mt-0.5 font-medium">{step.title}</p>
                <p className="mt-1 text-sm text-ink-muted text-pretty">{step.body}</p>
              </li>
            ))}
          </ol>
        </header>

        {saves.length > 0 && (
          <Card className="mb-6">
            <CardBody>
              <h2 className="font-medium">Continue</h2>
              <ul className="mt-3 space-y-2">
                {saves.slice(0, 4).map((save) => (
                  <li key={save.key} className="flex items-stretch gap-2">
                    <button
                      type="button"
                      onClick={() => void open(save.key, () => loadGame(save.key))}
                      disabled={opening !== undefined}
                      aria-busy={opening === save.key}
                      className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-4 py-3 text-left hover:border-line-strong"
                    >
                      <span>
                        <span className="block font-medium">
                          {opening === save.key ? 'Opening… ' : ''}
                          {formatGameDate(save.day).label} ·{' '}
                          {DIFFICULTIES.find((mode) => mode.id === save.difficulty)?.label ?? save.difficulty}
                          {save.situationId && situationName(save.situationId) ? ` · ${situationName(save.situationId)}` : ''}
                        </span>
                        <span className="block text-sm text-ink-faint">
                          seed {save.seed} · saved {savedAtLabel(save.savedAtIso)}
                        </span>
                      </span>
                      {save.savedByPlayer && <Badge tone="neutral" glyph={false}>Saved by you</Badge>}
                    </button>
                    <Button
                      variant="quiet"
                      size="sm"
                      className="shrink-0 self-center"
                      aria-label={`Delete the campaign with seed ${save.seed}`}
                      onClick={() => setPendingDelete(save)}
                    >
                      Delete
                    </Button>
                  </li>
                ))}
              </ul>
              {saves.length > 1 && (
                <Button variant="quiet" size="sm" className="mt-3" onClick={() => setPendingDelete('all')}>
                  Delete all saved campaigns
                </Button>
              )}
            </CardBody>
          </Card>
        )}

        {pendingDelete && (
          <Dialog
            open
            onClose={() => setPendingDelete(undefined)}
            title={pendingDelete === 'all' ? 'Delete every saved campaign?' : 'Delete this campaign?'}
            description={
              pendingDelete === 'all'
                ? 'Every campaign saved on this device goes. There is no undo; to keep one, open it and export it from Your year first.'
                : `The campaign with seed ${pendingDelete.seed} goes, at ${formatGameDate(pendingDelete.day).label}. There is no undo; to keep it, open it and export it from Your year first.`
            }
            footer={
              <>
                <Button variant="quiet" onClick={() => setPendingDelete(undefined)}>Keep it</Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    const target = pendingDelete
                    setPendingDelete(undefined)
                    void (target === 'all' ? deleteAllSaves() : deleteCampaign(target.gameId))
                  }}
                >
                  {pendingDelete === 'all' ? 'Delete everything' : 'Delete the campaign'}
                </Button>
              </>
            }
          >
            <p className="text-sm text-ink-muted">
              {pendingDelete === 'all'
                ? `${saves.length} campaigns, and everything each of them reached.`
                : 'Everything this campaign reached: what you found, what you decided and what it cost.'}
            </p>
          </Dialog>
        )}

        <Card>
          <CardBody className="space-y-6">
            <div>
              <h2 className="font-medium">Start a new year</h2>
              <p className="mt-1 text-sm text-ink-muted">
                No account, no sign-in. Your campaign is saved on this device.
              </p>
              {link.seed && (
                <p className="mt-2 rounded-lg border border-accent/40 bg-accent-soft/40 p-3 text-sm text-pretty" data-testid="shared-year">
                  This link opens a particular year, seed <span className="font-medium">{link.seed}</span>: the same
                  Nexora for everyone who opens it. Change anything below to play a different one.
                </p>
              )}
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

            {situations.length > 0 && (
              <fieldset>
                <legend className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  What are you walking into?
                </legend>
                <div className="space-y-2">
                  {[...situations.map((s) => ({ id: s.id, label: s.name, description: s.summary })),
                    { id: 'surprise', label: 'Surprise me', description: 'Find out on your first morning, as a new CISO usually does.' }].map((option) => (
                    <label
                      key={option.id}
                      className={cn(
                        'flex cursor-pointer gap-3 rounded-lg border p-3',
                        situation === option.id ? 'border-accent bg-accent-soft/40' : 'border-line bg-surface-2',
                      )}
                    >
                      <input
                        type="radio"
                        name="situation"
                        value={option.id}
                        checked={situation === option.id}
                        onChange={() => setSituation(option.id)}
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
            )}

            {/*
              Folded away by default. The seed is a replay tool, not part of
              arriving as the new CISO, and a first-time player asked to choose
              one before they have started is being asked about the machinery.
            */}
            <details className="rounded-lg border border-line bg-surface-2/60 p-3" open={recording || Boolean(link.seed) || undefined}>
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
              {/* For playtests (docs/PLAYTEST.md). Open by default when a
                  facilitator's link turned it on, so the player can see it. */}
              <label className="mt-4 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={recording}
                  onChange={(event) => setRecording(event.target.checked)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]"
                  style={{ minHeight: 0 }}
                  aria-describedby="recording-help"
                />
                <span>
                  <span className="block text-sm font-medium">Record this session for a playtest</span>
                  <span id="recording-help" className="mt-0.5 block text-sm text-ink-muted text-pretty">
                    Notes what you open and decide, and when, on this device only. Nothing is sent anywhere; you export
                    the file and hand it over yourself. No names or typed notes are kept.
                  </span>
                </span>
              </label>
            </details>

            <Button
              variant="primary"
              size="lg"
              block
              onClick={() => void open('new', () => startNewGame(seed.trim() || randomSeed(), difficulty, situations.length > 0 ? situation : undefined))}
              disabled={opening !== undefined}
              aria-busy={opening === 'new'}
            >
              {opening === 'new' ? 'Opening the campaign…' : 'Begin your first day'}
            </Button>

            {!storageAvailable() && (
              <p className="rounded-lg border border-band-elevated/40 bg-band-elevated-soft/50 p-3 text-sm">
                This browser will not let the game store data, so your campaign cannot be saved. You can still play a
                full year in this tab.
              </p>
            )}

            <Disclosure summary="Import a saved campaign">
              <p className="mb-3 text-pretty">
                A campaign can be exported to a file from Your year, at any point in the year, and brought back here — useful if you
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
              <Button variant="secondary" size="sm" disabled={opening !== undefined} onClick={() => fileInput.current?.click()}>
                Choose a save file
              </Button>
            </Disclosure>
          </CardBody>
        </Card>

        <p className="mt-8 text-center text-sm text-ink-muted text-pretty">
          The game teaches itself as you go. If you would rather read first, there is a{' '}
          <a href={GUIDE_URL} target="_blank" rel="noopener" className="text-accent-ink underline underline-offset-2">
            player's guide<span className="sr-only"> (opens in a new tab)</span>
          </a>
          .
        </p>
        <p className="mt-3 text-center text-sm text-ink-faint text-pretty">
          Nexora Group is fictional. Any resemblance to your own organisation is a coincidence you should probably act on.
        </p>
      </div>
    </div>
  )
}
