/**
 * Application root. Navigation is application state rather than URL routing:
 * this is a single-player shell, and avoiding a router keeps the static
 * deployment trivial (plan §32.2).
 */
import { Suspense, lazy, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ScreenBoundary } from '@/components/layout/ScreenBoundary'
import { StartScreen } from '@/screens/start/StartScreen'
import { HomeScreen } from '@/screens/home/HomeScreen'
import { RiskScreen } from '@/screens/risk/RiskScreen'
import { OrganisationScreen } from '@/screens/organisation/OrganisationScreen'
import { ProgrammesScreen } from '@/screens/programmes/ProgrammesScreen'
import { TeamScreen } from '@/screens/team/TeamScreen'
import { Glossary } from '@/components/game/Glossary'
import { Toasts } from '@/components/game/Toasts'
import { CampaignFeedback } from '@/components/game/CampaignFeedback'
import { IncidentCommand } from '@/components/game/IncidentCommand'
import { DecisionDeadlines } from '@/components/game/DecisionDeadlines'
import { Onboarding } from '@/components/game/Onboarding'
import { useGameClock } from '@/components/game/useGameClock'
import { usePullToRefreshGuard } from '@/app/usePullToRefreshGuard'
import { useKeyboardShortcuts } from '@/app/useKeyboardShortcuts'
import { useGameStore } from '@/store/game-store'
import { Button, Card, CardBody, Dialog, LoadingState } from '@/components/ui/primitives'
import { yearWord } from '@/game/time'

// The year view is opened a few times a year and read once at the close, so
// it stays out of what the first screen waits for. It is fetched in the
// background once a campaign is open, so the close never waits on it.
const loadInbox = () => import('@/screens/inbox/InboxScreen')
const InboxScreen = lazy(() => loadInbox().then((module) => ({ default: module.InboxScreen })))
const loadBoard = () => import('@/screens/board/BoardScreen')
const BoardScreen = lazy(() => loadBoard().then((module) => ({ default: module.BoardScreen })))
const loadDecision = () => import('@/components/decisions/DecisionDialog')
const DecisionDialog = lazy(() => loadDecision().then((m) => ({ default: m.DecisionDialog })))
const loadDebrief = () => import('@/screens/debrief/DebriefScreen')
const DebriefScreen = lazy(() => loadDebrief().then((m) => ({ default: m.DebriefScreen })))

export function App() {
  const state = useGameStore((store) => store.state)
  const contentLoaded = useGameStore((store) => store.index !== null)
  const screen = useGameStore((store) => store.ui.screen)
  const openDecisionId = useGameStore((store) => store.ui.openDecisionId)
  const setUi = useGameStore((store) => store.setUi)
  const finishCampaign = useGameStore((store) => store.finishCampaign)

  useGameClock()
  useKeyboardShortcuts()

  const inCampaign = state !== null
  usePullToRefreshGuard(inCampaign && contentLoaded)
  useEffect(() => {
    if (inCampaign) {
      void loadInbox().catch(() => undefined)
      void loadBoard().catch(() => undefined)
      void loadDebrief().catch(() => undefined)
      void loadDecision().catch(() => undefined)
    }
  }, [inCampaign])

  // An incident subtly raises the temperature of the whole shell (plan §30).
  const incidentRunning = Boolean(
    state && Object.values(state.incidents.incidents).some((incident) => incident.phase !== 'closed'),
  )
  useEffect(() => {
    document.documentElement.dataset.incident = incidentRunning ? 'true' : 'false'
  }, [incidentRunning])

  useEffect(() => {
    if (state?.finished && !state.reviews.annual) void finishCampaign()
  }, [state?.finished, state?.reviews.annual, finishCampaign, state])

  // The campaign screens read the content; they are shown only once both the
  // campaign and its content are here, which the store opens in that order.
  if (!state || !contentLoaded) {
    return (
      <>
        <StartScreen />
        <Toasts />
      </>
    )
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <AppShell>
        <IncidentCommand />
        <DecisionDeadlines />
        <CampaignFeedback kind="decision" />
        {/* The Briefing places teaching below the work waiting on the player,
            keeping the first decision reachable on small screens. */}
        {screen !== 'home' && <Onboarding compact />}
        {/* Only once the review is written: while it loads, the year's end
            is already on its way to the review screen, and a banner that
            appeared for a moment and vanished under the pointer was worse
            than none. */}
        {state.finished && state.reviews.annual && screen !== 'debrief' && (
          <Card className="mb-4 border-brass/50 bg-brass-soft/40">
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-pretty">Your {yearWord(state.year)} year is over. The review is written.</p>
              <Button variant="primary" onClick={() => useGameStore.getState().setScreen('debrief')}>
                Read the annual review
              </Button>
            </CardBody>
          </Card>
        )}
        {/* Keyed by screen, so leaving a screen that failed clears the failure.
            The briefing is the way out unless it is the briefing that failed. */}
        <ScreenBoundary
          key={screen}
          leaveLabel={screen === 'home' ? 'Open the inbox' : 'Back to the briefing'}
          onLeave={() => useGameStore.getState().setScreen(screen === 'home' ? 'inbox' : 'home')}
        >
          {screen === 'home' && <HomeScreen />}
          {screen === 'inbox' && <Suspense fallback={<LoadingState label="Opening inbox…" />}><InboxScreen /></Suspense>}
          {screen === 'risk' && <RiskScreen />}
          {screen === 'organisation' && <OrganisationScreen />}
          {screen === 'programmes' && <ProgrammesScreen />}
          {screen === 'team' && <TeamScreen />}
          {screen === 'board' && <Suspense fallback={<LoadingState label="Opening board…" />}><BoardScreen /></Suspense>}
          {screen === 'debrief' && (
            <Suspense fallback={<LoadingState label="Opening your year…" />}>
              <DebriefScreen />
            </Suspense>
          )}
        </ScreenBoundary>
      </AppShell>
      {openDecisionId && (
        <ScreenBoundary onLeave={() => setUi({ openDecisionId: undefined })} leaveLabel="Back to campaign">
          <Suspense fallback={<Dialog open title="Opening decision…" onClose={() => setUi({ openDecisionId: undefined })}><LoadingState label="Opening decision…" /></Dialog>}>
            <DecisionDialog decisionId={openDecisionId} onClose={() => setUi({ openDecisionId: undefined })} />
          </Suspense>
        </ScreenBoundary>
      )}
      <Glossary />
      <Toasts />
    </>
  )
}
