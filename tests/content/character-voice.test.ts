import { expect, it } from 'vitest'
import { readFile, readdir, stat } from 'node:fs/promises'
import recordings from '@/assets/voice/manifest.json'
import { testIndex } from '../engine/helpers'

it('ships six bounded recordings with exact authored transcripts and one voice per character', async () => {
  const events = testIndex().content.events
  expect(recordings).toHaveLength(6)
  expect(new Set(recordings.map((clip) => clip.eventId)).size).toBe(6)
  const speakers = new Map<string, string>()
  let total = 0
  for (const clip of recordings) {
    const event = events.find((entry) => entry.id === clip.eventId)
    expect(event).toBeDefined()
    expect({ from: clip.from, subject: clip.subject, body: clip.body }).toEqual({ from: event!.from, subject: event!.title, body: event!.body })
    expect(clip.body).not.toContain('{{')
    expect(clip.phrases.map((phrase) => phrase.text).join(' ').replace(/\s+/g, ' ').trim()).toBe(clip.body.replace(/\s+/g, ' ').trim())
    expect(clip.phrases.length).toBeGreaterThan(1)
    expect(new Set(clip.phrases.map((phrase) => phrase.speed)).size).toBeGreaterThan(1)
    expect(clip.phrases.at(-1)!.pauseAfterSeconds).toBe(0)
    for (const phrase of clip.phrases) {
      expect(phrase.speed).toBeGreaterThanOrEqual(0.9)
      expect(phrase.speed).toBeLessThanOrEqual(1.15)
      expect(phrase.pauseAfterSeconds).toBeGreaterThanOrEqual(0)
      expect(phrase.pauseAfterSeconds).toBeLessThanOrEqual(0.4)
    }
    expect(clip.file).toBe(`${clip.eventId}.mp3`)
    if (speakers.has(clip.from)) expect(clip.voice).toBe(speakers.get(clip.from))
    speakers.set(clip.from, clip.voice)
    expect(clip.durationSeconds).toBeGreaterThan(5)
    expect(clip.durationSeconds).toBeLessThan(40)
    const url = new URL(`../../src/assets/voice/${clip.file}`, import.meta.url)
    const bytes = (await stat(url)).size
    expect(bytes).toBeGreaterThan(1000)
    expect(bytes).toBeLessThanOrEqual(160 * 1024)
    total += bytes
    expect((await readFile(url)).subarray(0, 3).toString()).toBe('ID3')
  }
  expect(speakers.size).toBe(3)
  expect(new Set(speakers.values()).size).toBe(3)
  expect(total).toBeLessThanOrEqual(768 * 1024)
  const shipped = (await readdir(new URL('../../src/assets/voice/', import.meta.url))).filter((name) => name.endsWith('.mp3')).sort()
  expect(shipped).toEqual(recordings.map((clip) => clip.file).sort())
})

it('retains the owner-approved CEO preview voice and four-phrase direction', () => {
  const welcome = recordings.find((clip) => clip.eventId === 'evt-day-one')!
  expect(welcome.voice).toBe('bf_isabella')
  expect(welcome.phrases.map(({ speed, pauseAfterSeconds }) => [speed, pauseAfterSeconds])).toEqual([
    [1, 0.12], [1.02, 0.32], [1.08, 0.4], [0.96, 0],
  ])
})
