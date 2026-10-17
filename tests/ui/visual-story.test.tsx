// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ProgrammeJourney } from '@/components/programmes/ProgrammeJourney'
import { programmeViews } from '@/store/selectors'
import { useGameStore } from '@/store/game-store'
import { InboxScreen } from '@/screens/inbox/InboxScreen'
import { QuarterOffice } from '@/components/game/QuarterOffice'

beforeEach(async () => { await useGameStore.getState().startNewGame('ui-visual-story', 'ciso') })

describe('visual narrative follows public records', () => {
  it('separates completed milestones, the next milestone and delivery status', () => {
    const store = useGameStore.getState()
    const programme = programmeViews(store.state!, store.index!)[0]!
    programme.status = 'paused'
    programme.milestones[0]!.complete = true
    const view = render(<ProgrammeJourney programme={programme} />)
    expect(screen.getByText('Delivery paused')).toBeVisible()
    expect(screen.getAllByText('Completed')).toHaveLength(1)
    const next = view.container.querySelector('[aria-current="step"]')!
    expect(next).toHaveTextContent(programme.milestones[1]!.name)
    expect(next).toHaveTextContent('Next milestone')
    expect(view.container.textContent).not.toMatch(/due|days left/i)
    programme.status = 'complete'
    programme.milestones.forEach((milestone) => { milestone.complete = true })
    view.rerender(<ProgrammeJourney programme={programme} />)
    expect(screen.getByText('Delivery complete')).toBeVisible()
    expect(view.container.querySelector('[aria-current]')).toBeNull()
    programme.milestones[0]!.complete = false
    view.rerender(<ProgrammeJourney programme={programme} />)
    expect(screen.getByText('Not recorded')).toBeVisible()
    expect(screen.queryByText('Next milestone')).toBeNull()
  })

  it('keeps known sender names and full roles alongside important portraits', () => {
    render(<InboxScreen />)
    const signature = document.querySelector('.sender-signature')!
    expect(signature).toHaveTextContent('Marianne Okafor')
    expect(signature).toHaveTextContent('Chief Executive')
    expect(signature.querySelector('img')).toHaveAttribute('alt', '')
  })

  it('preserves an unknown sender without inventing a person or role', () => {
    useGameStore.setState((store) => {
      const state = structuredClone(store.state!)
      state.inbox.messages[0]!.from = 'External advisory team'
      return { state }
    })
    render(<InboxScreen />)
    const signature = document.querySelector('.sender-signature')!
    expect(signature).toHaveTextContent('External advisory team')
    expect(signature.querySelector('img')).toBeNull()
  })

  it('keeps the quarter label when the decorative office image fails', () => {
    const view = render(<QuarterOffice quarter={4} year={2} />)
    fireEvent.error(view.container.querySelector('img')!)
    expect(screen.getByText('Office of the CISO · Year 2 · Q4')).toBeVisible()
    expect(screen.getByText('The final quarter')).toBeVisible()
    expect(view.container.querySelector('img')).not.toBeVisible()
  })
})
