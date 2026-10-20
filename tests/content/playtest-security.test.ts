import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { request, type Server } from 'node:http'
import { once } from 'node:events'
import { describe, expect, it, vi } from 'vitest'
import { playtestControl, playtestSite } from '../../scripts/playtest-http'

async function withServer(server: Server, test: (port: number) => Promise<void>) {
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  try { await test((server.address() as { port: number }).port) }
  finally { server.closeAllConnections(); await new Promise<void>((resolve) => server.close(() => resolve())) }
}

function send(port: number, path = '/', headers: Record<string, string> = {}, body?: string, method = body === undefined ? 'GET' : 'POST') {
  return new Promise<{ status: number; text: string }>((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path, headers, method, agent: false }, (response) => {
      let text = ''
      response.setEncoding('utf8').on('data', (chunk) => { text += chunk }).on('end', () => resolve({ status: response.statusCode!, text }))
    })
    req.on('error', reject)
    req.end(body)
  })
}

describe('local playtest HTTP boundaries', () => {
  it('serves clean URLs but rejects traversal, symlinks, malformed URLs and foreign hosts', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ciso-http-'))
    try {
      const dist = join(dir, 'dist')
      await mkdir(dist)
      await writeFile(join(dist, 'index.html'), 'game')
      await writeFile(join(dist, 'guide.html'), 'guide')
      await writeFile(join(dir, 'outside.txt'), 'outside the build')
      await symlink(join(dir, 'outside.txt'), join(dist, 'link.txt'))
      await withServer(playtestSite(dist), async (port) => {
        expect(await send(port, '/guide')).toEqual({ status: 200, text: 'guide' })
        expect(await send(port, '/risk')).toEqual({ status: 200, text: 'game' })
        expect(await send(port, '/', {}, undefined, 'HEAD')).toEqual({ status: 200, text: '' })
        for (const path of ['/../outside.txt', '/%2e%2e%2foutside.txt', '/link.txt']) {
          const response = await send(port, path)
          expect(response.status).toBe(403)
          expect(response.text).not.toContain('outside the build')
        }
        expect((await send(port, '/%zz')).status).toBe(400)
        expect((await send(port, '/%00')).status).toBe(400)
        expect((await send(port, '/', { host: `attacker.invalid:${port}` })).status).toBe(403)
        expect((await send(port, '/', {}, 'body')).status).toBe(405)
      })
    } finally { await rm(dir, { recursive: true, force: true }) }
  })

  it('requires local JSON POST commands, rejects cross-site requests and bounds input', async () => {
    const run = vi.fn(async () => ({ ok: true }))
    await withServer(playtestControl(run), async (port) => {
      const json = { 'content-type': 'application/json' }
      expect((await send(port)).status).toBe(405)
      expect((await send(port, '/', {}, '{}')).status).toBe(415)
      expect((await send(port, '/', { ...json, origin: 'https://attacker.invalid' }, '{"do":"read"}')).status).toBe(403)
      expect((await send(port, '/', { ...json, host: `attacker.invalid:${port}` }, '{"do":"read"}')).status).toBe(403)
      expect((await send(port, '/', { ...json, 'sec-fetch-site': 'cross-site' }, '{"do":"read"}')).status).toBe(403)
      expect((await send(port, '/', json, 'not json')).status).toBe(400)
      expect((await send(port, '/', json, 'null')).status).toBe(400)
      expect((await send(port, '/', json, JSON.stringify({ do: 'read', padding: 'x'.repeat(70_000) }))).status).toBe(413)
      expect(run).not.toHaveBeenCalled()
      expect((await send(port, '/', json, '{"do":"read"}')).status).toBe(200)
      expect((await send(port, '/', { ...json, origin: `http://127.0.0.1:${port}` }, '{"do":"read"}')).status).toBe(200)
      expect(run).toHaveBeenCalledTimes(2)
    })
  })
})
