// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ScreenBoundary } from '@/components/layout/ScreenBoundary'
import { onProblem } from '@/store/problems'

/**
 * Phase 5 of docs/ROADMAP.md: an exception while drawing a screen blanked the
 * whole page, rail and all. Now it takes down only that screen, says so, and
 * offers a way out.
 */
function Broken(): never {
  throw new Error('a screen that cannot draw')
}

describe('a screen that fails to draw', () => {
  it('takes only itself down, reports it, and offers another screen', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const problems: string[] = []
    const stop = onProblem((problem) => problems.push(`${problem.kind}: ${problem.detail}`))
    const leave = vi.fn()

    render(
      <div>
        <nav aria-label="Primary">still here</nav>
        <ScreenBoundary onLeave={leave} leaveLabel="Back to the briefing">
          <Broken />
        </ScreenBoundary>
      </div>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('This screen could not be shown')
    expect(screen.getByRole('navigation', { name: 'Primary' })).toHaveTextContent('still here')
    expect(problems).toEqual(['screen-failed: Error: a screen that cannot draw'])
    fireEvent.click(screen.getByRole('button', { name: 'Back to the briefing' }))
    expect(leave).toHaveBeenCalledOnce()
    stop()
  })

  it('draws a screen that works as if it were not there', () => {
    render(
      <ScreenBoundary onLeave={() => {}} leaveLabel="Back to the briefing">
        <p>fine</p>
      </ScreenBoundary>,
    )
    expect(screen.getByText('fine')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
