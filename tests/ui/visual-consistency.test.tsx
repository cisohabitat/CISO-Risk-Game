// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { useGameStore } from '@/store/game-store'
import { HomeScreen } from '@/screens/home/HomeScreen'
import { TeamScreen } from '@/screens/team/TeamScreen'
import { AppShell } from '@/components/layout/AppShell'
import { Onboarding } from '@/components/game/Onboarding'
import { quarterProgress } from '@/store/selectors'
import { openDecision } from '@/game/decisions/open'
import { InboxScreen } from '@/screens/inbox/InboxScreen'
import { ProgrammesScreen } from '@/screens/programmes/ProgrammesScreen'
import { BoardScreen } from '@/screens/board/BoardScreen'
import { StartScreen } from '@/screens/start/StartScreen'
import { visibleRisks } from '@/store/selectors'

/**
 * What a look at every screen found, light and dark, desktop and phone:
 * notifications stacked three deep over the page and said only an option's
 * label; teaching notes took a sixth of the screen above the briefing;
 * capacity cards ended on different rows; the inbox badge counted to 63; and
 * a quarter of work looked the same as a quarter of nothing.
 */
describe('what the screens show', () => {
  it('keeps at most two notifications, and a decision says what was decided', async () => {
    await useGameStore.getState().startNewGame('ui-visual-toasts', 'ciso')
    const store = useGameStore.getState()
    for (const message of ['one', 'two', 'three']) store.pushToast(message)
    expect(useGameStore.getState().ui.toasts.map((toast) => toast.message)).toEqual(['two', 'three'])

    const { state, index } = useGameStore.getState()
    const id = state!.decisions.openIds[0] ?? openDecision(state!, index!, index!.content.decisions[0]!.id)!.id
    const def = index!.decision.get(useGameStore.getState().state!.decisions.decisions[id]!.defId)!
    for (const option of def.options) {
      const result = useGameStore.getState().dispatch({
        type: 'resolveDecision',
        decisionId: id,
        optionId: option.id,
        rationaleTagIds: def.rationaleTagIds?.slice(0, 1) ?? ['rat-material'],
      })
      if (result.ok) {
        expect(result.message).toBe(`Decided: ${def.title} — ${option.label}.`)
        return
      }
    }
    throw new Error('no option could be taken')
  })

  it('shows a teaching note as one line, not a card', async () => {
    await useGameStore.getState().startNewGame('ui-visual-note', 'guided')
    render(<Onboarding />)
    const note = screen.getByRole('complementary', { name: 'How this works' })
    expect(note.querySelectorAll('p')).toHaveLength(1)
    expect(within(note).getByRole('button', { name: 'Got it' })).toBeInTheDocument()
  })

  it('ends every capacity card on a staffing line', async () => {
    await useGameStore.getState().startNewGame('ui-visual-team', 'ciso')
    render(<TeamScreen />)
    const cards = screen.getAllByText(/^(Fully staffed|\d+ vacanc(y|ies) unfilled|Recruiting)$/)
    const functions = Object.keys(useGameStore.getState().state!.team.functions).length
    expect(cards).toHaveLength(functions)
  })

  it('caps the inbox badge', async () => {
    await useGameStore.getState().startNewGame('ui-visual-badge', 'ciso')
    useGameStore.setState((store) => {
      const state = structuredClone(store.state!)
      const template = state.inbox.messages[0]!
      for (let n = 0; n < 40; n += 1) state.inbox.messages.push({ ...template, id: `extra-${n}`, read: false })
      return { state }
    })
    render(
      <AppShell>
        <div />
      </AppShell>,
    )
    const rail = screen.getAllByRole('navigation', { name: 'Primary' })[0]!
    expect(within(rail).getByText('9+')).toBeInTheDocument()
  })

  it('says what the quarter has produced', async () => {
    await useGameStore.getState().startNewGame('ui-visual-progress', 'ciso')
    const { index } = useGameStore.getState()
    expect(quarterProgress(useGameStore.getState().state!, index!)).toEqual([])
    render(<HomeScreen />)
    expect(screen.getByTestId('quarter-progress')).toHaveTextContent('Nothing has come back yet.')

    useGameStore.setState((store) => {
      const state = structuredClone(store.state!)
      state.currentDay = 20
      state.controls.controls['ctl-backup']!.believed!.assessedOnDay = 15
      return { state }
    })
    expect(quarterProgress(useGameStore.getState().state!, index!)).toContain('1 control checked for yourself')
  })

  it('dates the inbox as the header does', async () => {
    await useGameStore.getState().startNewGame('ui-visual-inbox', 'ciso')
    render(<InboxScreen />)
    const list = screen.getByRole('list', { name: 'Messages' })
    expect(within(list).queryByText(/^d\d+$/)).toBeNull()
    expect(within(list).getAllByText(/^\d+ Jan$/).length).toBeGreaterThan(0)
  })

  it('says which of the player\'s risks a programme treats, and what it takes of the budget', async () => {
    await useGameStore.getState().startNewGame('ui-visual-programmes', 'ciso')
    const { state, index } = useGameStore.getState()
    const visible = new Set(visibleRisks(state!, index!).map((risk) => risk.title))
    render(<ProgrammesScreen />)
    const lines = screen.getAllByTestId('programme-treats')
    expect(lines.length).toBeGreaterThan(0)
    for (const line of lines) {
      const named = line.textContent!.replace(/^Treats /, '').split('; ')
      for (const title of named) expect(visible.has(title), title).toBe(true)
    }
    expect(screen.getAllByText('Of the budget left').length).toBeGreaterThan(0)
  })

  it('draws each executive with a monogram and a place on the trust scale', async () => {
    await useGameStore.getState().startNewGame('ui-visual-board', 'ciso')
    render(<BoardScreen />)
    expect(screen.getAllByRole('img', { name: /on a scale from resistant to trusted$/ }).length).toBeGreaterThanOrEqual(4)
  })

  it('shows what a year is made of before the form', () => {
    render(<StartScreen />)
    const steps = within(screen.getByRole('list', { name: 'Your year' })).getAllByRole('listitem')
    expect(steps).toHaveLength(3)
  })
})
