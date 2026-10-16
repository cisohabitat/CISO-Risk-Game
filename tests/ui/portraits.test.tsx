// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { PersonPortrait } from '@/components/game/Person'
import { nexoraContent } from '@/content/nexora'

describe('character portraits', () => {
  it('covers every executive and cyber leader without repeating their accessible names', () => {
    for (const person of [...nexoraContent.stakeholders, ...nexoraContent.leaders]) {
      const view = render(<PersonPortrait id={person.id} name={person.name} />)
      const image = view.container.querySelector('img')!
      expect(image, person.name).not.toBeNull()
      expect(image).toHaveAttribute('alt', '')
      expect(image).toHaveAttribute('loading', 'lazy')
      expect(image.closest('[aria-hidden="true"]')).not.toBeNull()
      view.unmount()
    }
  })

  it('keeps initials usable when a custom campaign has no portrait or the atlas cannot load', () => {
    const view = render(<PersonPortrait id="custom-ceo" name="Alex Morgan" />)
    expect(view.container).toHaveTextContent('AM')
    expect(view.container.querySelector('img')).toBeNull()
    view.rerender(<PersonPortrait id="stk-ceo" name="Marianne Okafor" />)
    const image = view.container.querySelector('img')!
    fireEvent.error(image)
    expect(image).not.toBeVisible()
    expect(view.container).toHaveTextContent('MO')
  })
})
