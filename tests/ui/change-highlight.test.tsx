// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ChangeHighlight } from '@/components/ui/ChangeHighlight'

const cancel = vi.fn()
const animate = vi.fn(() => ({ cancel }))
let reduced = false
let motionChanged: (() => void) | undefined
beforeEach(() => {
  reduced = false
  motionChanged = undefined
  animate.mockClear()
  cancel.mockClear()
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate })
  vi.stubGlobal('matchMedia', () => ({ get matches() { return reduced }, addEventListener: (_: string, listener: () => void) => { motionChanged = listener }, removeEventListener: vi.fn() }))
})
afterEach(() => { Reflect.deleteProperty(HTMLElement.prototype, 'animate'); vi.unstubAllGlobals() })

describe('observed resource feedback', () => {
  it('stays quiet on load and unchanged values, then briefly marks a real change', () => {
    const view = render(<ChangeHighlight value={5}>5 attention</ChangeHighlight>)
    view.container.querySelector('span')!.style.setProperty('--accent-soft', '#dbeafe')
    expect(animate).not.toHaveBeenCalled()
    view.rerender(<ChangeHighlight value={5}>5 attention</ChangeHighlight>)
    expect(animate).not.toHaveBeenCalled()
    view.rerender(<ChangeHighlight value={3}>3 attention</ChangeHighlight>)
    expect(animate).toHaveBeenCalledTimes(1)
    expect(view.container).toHaveTextContent('3 attention')
    view.unmount()
    expect(cancel).toHaveBeenCalled()
  })

  it('does not animate with reduced motion and stops when the preference changes', () => {
    const view = render(<ChangeHighlight value={5}>5</ChangeHighlight>)
    view.container.querySelector('span')!.style.setProperty('--accent-soft', '#dbeafe')
    reduced = true
    view.rerender(<ChangeHighlight value={4}>4</ChangeHighlight>)
    expect(animate).not.toHaveBeenCalled()
    reduced = false
    view.rerender(<ChangeHighlight value={3}>3</ChangeHighlight>)
    expect(animate).toHaveBeenCalledTimes(1)
    reduced = true
    motionChanged!()
    expect(cancel).toHaveBeenCalled()
  })
})
