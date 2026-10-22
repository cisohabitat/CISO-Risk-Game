// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import CharacterVoicePlayer from '@/components/game/CharacterVoicePlayer'
import recordings from '@/assets/voice/manifest.json'
import type { InboxMessage } from '@/game/types'

const message: InboxMessage = { ...recordings[0], id: 'voice-one', day: 0, type: 'executive', priority: 'critical', read: false, pinned: false, relatedNodeIds: [] }

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

it('loads no audio until requested, supports replay/stop, and releases it on exit', () => {
  const { container, unmount } = render(<CharacterVoicePlayer message={message} />)
  const audio = container.querySelector('audio')!
  expect(audio).not.toHaveAttribute('src')
  expect(audio).toHaveAttribute('preload', 'none')
  fireEvent.click(screen.getByRole('button', { name: 'Play message' }))
  expect(audio.src).toContain('evt-day-one')
  expect(audio.play).toHaveBeenCalledOnce()
  audio.currentTime = 4
  fireEvent.click(screen.getByRole('button', { name: 'Stop voice' }))
  expect(audio.paused).toBe(true)
  expect(audio.currentTime).toBe(0)
  fireEvent.click(screen.getByRole('button', { name: 'Replay message' }))
  expect(audio.play).toHaveBeenCalledTimes(2)
  unmount()
  expect(audio).not.toHaveAttribute('src')
  expect(audio.load).toHaveBeenCalledOnce()
})

it.each(['body', 'from', 'subject', 'eventId'] as const)('hides a recording when %s differs from the transcript', (field) => {
  const { container } = render(<CharacterVoicePlayer message={{ ...message, [field]: 'Changed content' }} />)
  expect(container).toBeEmptyDOMElement()
})

it('keeps a failed playback recoverable and stops speech in a hidden tab', async () => {
  vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValueOnce(new Error('Unavailable'))
  const { container } = render(<CharacterVoicePlayer message={message} />)
  fireEvent.click(screen.getByRole('button', { name: 'Play message' }))
  expect(await screen.findByRole('status')).toHaveTextContent('read the full message')
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  fireEvent(document, new Event('visibilitychange'))
  expect(container.querySelector('audio')!.pause).toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Replay message' }))
  expect(screen.queryByRole('status')).not.toBeInTheDocument()
})
