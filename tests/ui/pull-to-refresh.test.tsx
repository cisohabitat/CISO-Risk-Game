// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { usePullToRefreshGuard } from '@/app/usePullToRefreshGuard'
function Guard({ active = true }) { usePullToRefreshGuard(active); return <div data-testid="surface" /> }
afterEach(cleanup)
function touch(target: Element, type: string, x: number, y: number, count = 1) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'touches', { value: Array.from({ length: count }, () => ({ clientX: x, clientY: y })) })
  target.dispatchEvent(event)
  return event.defaultPrevented
}
function swipe(target: Element, x = 100, y = 150, count = 1) {
  touch(target, 'touchstart', 100, 100, count)
  return touch(target, 'touchmove', x, y, count)
}
describe('gameplay pull-to-refresh guard', () => {
  it('cancels only downward vertical edge swipes and cleans up on leaving play', () => {
    const { getByTestId, rerender } = render(<Guard />)
    const target = getByTestId('surface')
    expect(swipe(target)).toBe(true)
    expect(swipe(target, 100, 101)).toBe(false)
    expect(swipe(target, 100, 50)).toBe(false)
    expect(swipe(target, 160, 110)).toBe(false)
    expect(swipe(target, 100, 150, 2)).toBe(false)
    touch(target, 'touchstart', 100, 100)
    touch(target, 'touchcancel', 100, 100, 0)
    expect(touch(target, 'touchmove', 100, 160)).toBe(false)
    expect(document.documentElement.dataset.gameplayScroll).toBe('true')
    rerender(<Guard active={false} />)
    expect(document.documentElement.dataset.gameplayScroll).toBeUndefined()
    expect(swipe(target)).toBe(false)
  })
  it('allows scrolling back up a page or a nested reader before guarding its edge', () => {
    const { getByTestId } = render(<Guard />)
    const target = getByTestId('surface')
    Object.defineProperty(document, 'scrollingElement', { configurable: true, value: document.documentElement })
    document.documentElement.scrollTop = 100
    expect(swipe(target)).toBe(false)
    document.documentElement.scrollTop = 0
    target.style.overflowY = 'auto'
    Object.defineProperties(target, { scrollHeight: { value: 800 }, clientHeight: { value: 300 } })
    target.scrollTop = 100
    expect(swipe(target)).toBe(false)
    target.scrollTop = 0
    expect(swipe(target)).toBe(true)
  })
  it('preserves native editing and map gestures', () => {
    const { container } = render(<Guard />)
    for (const tag of ['input', 'textarea', 'select']) {
      const element = document.createElement(tag); container.append(element)
      expect(swipe(element)).toBe(false)
    }
    const map = document.createElement('div'); map.className = 'react-flow'; container.append(map)
    expect(swipe(map)).toBe(false)
    const editable = document.createElement('div'); editable.contentEditable = 'true'; editable.setAttribute('contenteditable', 'true'); container.append(editable)
    expect(swipe(editable)).toBe(false)
  })
})
