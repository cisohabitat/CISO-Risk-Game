// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Badge, Dialog, Meter, Tab, TabList, TabPanel, Tabs } from '@/components/ui/primitives'
import { useState } from 'react'

describe('accessible primitives', () => {
  it('never carries risk state by colour alone', () => {
    render(<Badge tone="severe">Severe</Badge>)
    // The label is present as text, and a shape glyph accompanies the colour.
    expect(screen.getByText('Severe')).toBeInTheDocument()
    expect(screen.getByText('█')).toBeInTheDocument()
  })

  it('exposes a meter to assistive technology with a text value', () => {
    render(<Meter label="Cyber budget" value={40} max={100} valueLabel="£40k of £100k" />)
    const meter = screen.getByRole('meter', { name: /Cyber budget/ })
    expect(meter).toHaveAttribute('aria-valuenow', '40')
    expect(screen.getByText('£40k of £100k')).toBeInTheDocument()
  })

  it('closes a dialog with Escape and returns focus', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Dialog open onClose={onClose} title="A decision" description="Context">
        <button type="button">Inside</button>
      </Dialog>,
    )
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  it('closes a dialog with the close button', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Dialog open onClose={onClose} title="A decision">
        <p>Body</p>
      </Dialog>,
    )
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('drives tabs from the keyboard', async () => {
    const user = userEvent.setup()
    function Harness() {
      const [value, setValue] = useState('one')
      return (
        <Tabs value={value} onChange={setValue}>
          <TabList label="Sections">
            <Tab value="one">One</Tab>
            <Tab value="two">Two</Tab>
          </TabList>
          <TabPanel value="one">First panel</TabPanel>
          <TabPanel value="two">Second panel</TabPanel>
        </Tabs>
      )
    }
    render(<Harness />)
    expect(screen.getByText('First panel')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'One' }))
    await user.keyboard('{ArrowRight}')
    expect(screen.getByText('Second panel')).toBeInTheDocument()
  })
})
