// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
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
import { visibleRisks, discoveredNodes } from '@/store/selectors'
import { RiskScreen } from '@/screens/risk/RiskScreen'
import { OrganisationScreen } from '@/screens/organisation/OrganisationScreen'
import { TimeControls } from '@/components/game/TimeControls'
import { Toasts } from '@/components/game/Toasts'
import { InvestigationPanel } from '@/components/risk/InvestigationPanel'

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
      const named = [...line.querySelectorAll('li')].map((item) => item.textContent!.replace(/^–/, ''))
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

  it('gives a risk card two chips for its rating and words for the rest', async () => {
    await useGameStore.getState().startNewGame('ui-visual-risk-cards', 'ciso')
    useGameStore.setState((store) => {
      const state = structuredClone(store.state!)
      for (const scenario of Object.values(state.risks.scenarios)) scenario.nextReviewDay = 0
      return { state }
    })
    render(<RiskScreen />)
    expect(screen.getAllByText('Review due').length).toBeGreaterThan(0)
    const lines = screen.getAllByTestId('risk-meta')
    expect(lines.length).toBeGreaterThan(0)
    for (const line of lines) {
      const chips = line.parentElement!.querySelectorAll('.rounded-full')
      // Residual and confidence, and "Assumption failed" when one has.
      expect(chips.length).toBeLessThanOrEqual(3)
      for (const chip of chips) expect(chip.textContent).toMatch(/residual$|confidence$|^Assumption failed$/)
    }
  })

  it('draws the navigation and the header with line icons, not glyphs and emoji', async () => {
    await useGameStore.getState().startNewGame('ui-visual-icons', 'ciso')
    const { container } = render(
      <AppShell>
        <div />
      </AppShell>,
    )
    expect(container.textContent).not.toMatch(/[◎✉◈⬡▤◍❖◷⏏☾☀▶⏸]|\p{Extended_Pictographic}/u)
    const rail = screen.getAllByRole('navigation', { name: 'Primary' })[0]!
    expect(rail.querySelectorAll('svg').length).toBeGreaterThanOrEqual(8)
  })

  it('marks the rows the player has checked, not every row taken on trust', async () => {
    await useGameStore.getState().startNewGame('ui-visual-org', 'ciso')
    useGameStore.setState((store) => ({ ui: { ...store.ui, graphMode: 'list' } }))
    const { state, index } = useGameStore.getState()
    const nodes = discoveredNodes(state!, index!)
    const list = () => screen.getByRole('list', { name: 'Discovered systems' })
    const { unmount } = render(<OrganisationScreen />)
    const onTrust = nodes.filter((node) => !node.verified).length
    expect(onTrust).toBeGreaterThan(0)
    // Still said to a screen reader, but not drawn: the dashed row says it.
    const trust = within(list()).getAllByText('Taken on trust')
    expect(trust).toHaveLength(onTrust)
    for (const chip of trust) expect(chip).toHaveClass('sr-only')
    unmount()

    const target = nodes.find((node) => !node.verified && node.confidence >= 0.6)!
    useGameStore.setState((store) => {
      const next = structuredClone(store.state!)
      next.organisation.nodes[target.id]!.verified = true
      return { state: next }
    })
    render(<OrganisationScreen />)
    expect(within(list()).getAllByText('Checked').length).toBeGreaterThan(0)
  })

  it('keeps capitals for section headings, not the labels inside cards', async () => {
    await useGameStore.getState().startNewGame('ui-visual-labels', 'ciso')
    for (const Screen of [TeamScreen, BoardScreen, ProgrammesScreen]) {
      const { container, unmount } = render(<Screen />)
      const shouting = [...container.querySelectorAll('.uppercase')].filter((element) => element.tagName !== 'H2')
      expect(shouting.map((element) => element.textContent)).toEqual([])
      unmount()
    }
  })

  it('shows only the incident note while an incident runs', async () => {
    await useGameStore.getState().startNewGame('ui-visual-incident-note', 'guided')
    // The first-quarter note comes first in the list and is due on day one.
    const first = render(<Onboarding />)
    expect(screen.getByRole('complementary', { name: 'How this works' })).not.toHaveTextContent('This was not scripted')
    first.unmount()
    useGameStore.setState((store) => {
      const state = structuredClone(store.state!)
      state.incidents.incidents['inc-test'] = { id: 'inc-test', phase: 'containment' } as never
      return { state }
    })
    render(<Onboarding />)
    expect(screen.getByRole('complementary', { name: 'How this works' })).toHaveTextContent('This was not scripted')
  })

  it('puts the note under the briefing headline', async () => {
    await useGameStore.getState().startNewGame('ui-visual-note-place', 'guided')
    render(<HomeScreen />)
    const note = screen.getByRole('complementary', { name: 'How this works' })
    const headline = screen.getByRole('heading', { level: 1 })
    expect(headline.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('dates what came back, and labels the standing in sentence case', async () => {
    await useGameStore.getState().startNewGame('ui-visual-came-back', 'ciso')
    useGameStore.setState((store) => {
      const state = structuredClone(store.state!)
      state.currentDay = 120
      const template = state.inbox.messages[0]!
      state.inbox.messages.unshift({ ...template, id: 'came-back', subject: 'Completed: a look at the backups', day: 111, read: false })
      return { state }
    })
    render(<HomeScreen />)
    const section = screen.getByRole('region', { name: 'Came back to you' })
    expect(section).toHaveTextContent('22 Apr')
    expect(section.textContent).not.toMatch(/\bday \d+/i)
    const standing = screen.getByRole('region', { name: 'Where the organisation stands' })
    for (const label of standing.querySelectorAll('dt')) expect(label.className).not.toMatch(/uppercase/)
  })

  it('colours the header pill by what stopped the clock', async () => {
    await useGameStore.getState().startNewGame('ui-visual-pill', 'ciso')
    const live = { id: 'inc-ui', familyId: 'fam-ransomware', startedDay: 1, phase: 'containment', phaseEnteredDay: 1 } as never
    useGameStore.setState((store) => ({
      state: { ...store.state!, pauseReasons: ['incident'], incidents: { ...store.state!.incidents, incidents: { 'inc-ui': live } } },
    }))
    const { unmount } = render(<TimeControls />)
    const pill = screen.getByText('An incident needs you')
    expect(pill.className).toMatch(/text-band-severe/)
    unmount()
    // Once the incident is over, the pill does not say it still needs you
    // (AI second-year re-test: beside "Nothing is waiting on you today").
    useGameStore.setState((store) => ({
      state: { ...store.state!, incidents: { ...store.state!.incidents, incidents: { 'inc-ui': { ...live, phase: 'closed' } } } },
    }))
    render(<TimeControls />)
    expect(screen.queryByText('An incident needs you')).toBeNull()
  })

  it('draws the header solid, and sets document headings in the display face', async () => {
    await useGameStore.getState().startNewGame('ui-visual-header', 'ciso')
    const { container, unmount } = render(
      <AppShell>
        <div />
      </AppShell>,
    )
    expect(container.querySelector('header')!.className).not.toMatch(/bg-surface\/\d+/)
    unmount()
    useGameStore.setState((store) => ({ ui: { ...store.ui, selectedMessageId: store.state!.inbox.messages[0]!.id } }))
    render(<InboxScreen />)
    const subject = useGameStore.getState().state!.inbox.messages[0]!.subject
    expect(screen.getByRole('heading', { level: 2, name: subject }).className).toMatch(/font-display/)
  })

  it('lists a programme\'s people in days a week', async () => {
    await useGameStore.getState().startNewGame('ui-visual-people', 'ciso')
    render(<ProgrammesScreen />)
    const lists = screen.getAllByTestId('programme-people')
    expect(lists.length).toBeGreaterThan(0)
    for (const list of lists) {
      expect(list.textContent).not.toMatch(/d\/wk/)
      for (const item of list.querySelectorAll('li')) expect(item.textContent).toMatch(/, [\d.]+ days? a week$/)
    }
  })

  it('keeps a phone notification to two lines', async () => {
    await useGameStore.getState().startNewGame('ui-visual-toast-phone', 'ciso')
    useGameStore.getState().pushToast('A notification long enough to wrap on a phone screen several times over.')
    render(<Toasts />)
    const text = screen.getByText(/A notification long enough/)
    expect(text.className).toMatch(/max-lg:line-clamp-2/)
  })

  it('shows how far through the year the player is, and when the quarter closes', async () => {
    await useGameStore.getState().startNewGame('ui-visual-year', 'ciso')
    const strip = (day: number) => {
      useGameStore.setState((store) => ({ state: { ...store.state!, currentDay: day } }))
      const { unmount } = render(
        <AppShell>
          <div />
        </AppShell>,
      )
      const text = screen.getByTestId('year-strip-text').textContent
      unmount()
      return text
    }
    expect(strip(0)).toBe('Q1 closes in 91 days.')
    expect(strip(100)).toBe('Q2 closes in 82 days.')
    expect(strip(181)).toBe('Q2 closes in 1 day.')
    expect(strip(364)).toBe('The year is over.')
  })

  it('shows each risk on the board agenda with its rating, and recommendations as toggles', async () => {
    await useGameStore.getState().startNewGame('ui-visual-agenda', 'ciso')
    useGameStore.setState((store) => {
      const state = structuredClone(store.state!)
      state.reviews.pendingQuarter = 1
      for (const scenario of Object.values(state.risks.scenarios)) scenario.status = 'open'
      return { state }
    })
    const { state, index } = useGameStore.getState()
    const risks = visibleRisks(state!, index!).filter((risk) => risk.status === 'open')
    expect(risks.length).toBeGreaterThan(0)
    render(<BoardScreen />)
    fireEvent.click(screen.getByRole('button', { name: /Prepare the Q1 board paper/ }))
    const agenda = screen.getByRole('group', { name: 'Agenda' })
    for (const risk of risks) {
      const row = within(agenda).getByText(risk.title).closest('label')!
      expect(row).toHaveTextContent(/(Low|Moderate|Elevated|High|Severe) residual$/)
    }
    const toggle = within(screen.getByRole('group', { name: 'Recommendations' })).getAllByRole('button')[0]!
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    expect(toggle.className).toMatch(/border-dashed/)
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(toggle.className).not.toMatch(/border-dashed/)
  })

  it('stands the clock down when the year is over', async () => {
    await useGameStore.getState().startNewGame('ui-visual-year-over', 'ciso')
    useGameStore.setState((store) => ({ state: { ...store.state!, finished: true, pauseReasons: ['year-end'] } }))
    render(<TimeControls />)
    expect(screen.getByTestId('year-over')).toHaveTextContent('The year is over.')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('lists the risks an enquiry speaks to one to a line', async () => {
    await useGameStore.getState().startNewGame('ui-visual-enquiry', 'ciso')
    render(<InvestigationPanel />)
    const blocks = screen.getAllByTestId('speaks-to')
    expect(blocks.length).toBeGreaterThan(0)
    for (const block of blocks) {
      expect(block.textContent).not.toMatch(/;/)
      expect(block.querySelectorAll('li').length).toBeGreaterThan(0)
    }
  })
})
