/**
 * Application root. Navigation is application state rather than URL routing:
 * this is a single-player shell, and avoiding a router keeps the static
 * deployment trivial (plan §32.2).
 */
import { useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { StartScreen } from '@/screens/start/StartScreen'
import { HomeScreen } from '@/screens/home/HomeScreen'
import { InboxScreen } from '@/screens/inbox/InboxScreen'
import { RiskScreen } from '@/screens/risk/RiskScreen'
import { OrganisationScreen } from '@/screens/organisation/OrganisationScreen'
import { ProgrammesScreen } from '@/screens/programmes/ProgrammesScreen'
import { TeamScreen } from '@/screens/team/TeamScreen'
import { BoardScreen } from '@/screens/board/BoardScreen'
import { DebriefScreen } from '@/screens/debrief/DebriefScreen'
import { DecisionDialog } from '@/components/decisions/DecisionDialog'
import { Glossary } from '@/components/game/Glossary'
import { Toasts } from '@/components/game/Toasts'
import { IncidentCommand } from '@/components/game/IncidentCommand'
import { Onboarding } from '@/components/game/Onboarding'
import { useGameClock } from '@/components/game/useGameClock'
import { useKeyboardShortcuts } from '@/app/useKeyboardShortcuts'
import { useGameStore } from '@/store/game-store'
import { Button, Card, CardBody } from '@/components/ui/primitives'

export function App() {
  const state = useGameStore((store) => store.state)
  const screen = useGameStore((store) => store.ui.screen)
  const openDecisionId = useGameStore((store) => store.ui.openDecisionId)
  const setUi = useGameStore((store) => store.setUi)
  const finishCampaign = useGameStore((store) => store.finishCampaign)

  useGameClock()
  useKeyboardShortcuts()

  // An incident subtly raises the temperature of the whole shell (plan §30).
  const incidentRunning = Boolean(
    state && Object.values(state.incidents.incidents).some((incident) => incident.phase !== 'closed'),
  )
  useEffect(() => {
    document.documentElement.dataset.incident = incidentRunning ? 'true' : 'false'
  }, [incidentRunning])

  useEffect(() => {
    if (state?.finished && !state.reviews.annual) finishCampaign()
  }, [state?.finished, state?.reviews.annual, finishCampaign, state])

  if (!state) {
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
        <Onboarding />
        {state.finished && screen !== 'debrief' && (
          <Card className="mb-4 border-brass/50 bg-brass-soft/40">
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-pretty">Your first year is over. The review is written.</p>
              <Button variant="primary" onClick={() => useGameStore.getState().setScreen('debrief')}>
                Read the annual review
              </Button>
            </CardBody>
          </Card>
        )}
        {screen === 'home' && <HomeScreen />}
        {screen === 'inbox' && <InboxScreen />}
        {screen === 'risk' && <RiskScreen />}
        {screen === 'organisation' && <OrganisationScreen />}
        {screen === 'programmes' && <ProgrammesScreen />}
        {screen === 'team' && <TeamScreen />}
        {screen === 'board' && <BoardScreen />}
        {screen === 'debrief' && <DebriefScreen />}
      </AppShell>
      {openDecisionId && (
        <DecisionDialog decisionId={openDecisionId} onClose={() => setUi({ openDecisionId: undefined })} />
      )}
      <Glossary />
      <Toasts />
    </>
  )
}
