import { createServer, type IncomingMessage } from 'node:http'
import { readFile, realpath, stat } from 'node:fs/promises'
import { extname, isAbsolute, relative, resolve, sep } from 'node:path'

const TYPES: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
}

function localRequest(request: IncomingMessage): boolean {
  const port = request.socket.localPort
  return request.headers.host === `localhost:${port}` || request.headers.host === `127.0.0.1:${port}`
}

function inside(root: string, file: string): boolean {
  const path = relative(root, file)
  return path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path)
}

/** Serve only build files, including when a request traverses a symlink. */
export function playtestSite(dist: string) {
  return createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff')
    if (!localRequest(request)) { response.writeHead(403).end(); return }
    if (!['GET', 'HEAD'].includes(request.method ?? '')) { response.writeHead(405).end(); return }
    let path: string
    try {
      path = decodeURIComponent((request.url ?? '/').split('?')[0]!)
      if (!path.startsWith('/') || path.includes('\0')) throw new Error('Invalid path')
    } catch { response.writeHead(400).end(); return }
    try {
      const root = await realpath(dist)
      const file = resolve(root, `.${path}`)
      if (!inside(root, file)) { response.writeHead(403).end(); return }
      for (const candidate of [file, `${file}.html`, resolve(root, 'index.html')]) {
        let actual: string
        try { actual = await realpath(candidate) } catch { continue }
        if (!inside(root, actual)) { response.writeHead(403).end(); return }
        if (!(await stat(actual)).isFile()) continue
        response.writeHead(200, { 'Content-Type': TYPES[extname(actual)] ?? 'application/octet-stream' })
        response.end(request.method === 'HEAD' ? undefined : await readFile(actual))
        return
      }
      response.writeHead(404).end()
    } catch { response.writeHead(404).end() }
  })
}

/** Curl clients may omit Origin; web pages may use only this local origin. */
export function playtestControl(run: (command: { do: string; [key: string]: unknown }) => Promise<unknown>) {
  return createServer({ requestTimeout: 30_000, headersTimeout: 10_000 }, async (request, response) => {
    response.setHeader('Content-Type', 'application/json')
    response.setHeader('X-Content-Type-Options', 'nosniff')
    const origin = request.headers.origin
    if (!localRequest(request) || request.headers['sec-fetch-site'] === 'cross-site' ||
      (origin !== undefined && origin !== `http://${request.headers.host}`)) {
      response.writeHead(403).end(); return
    }
    if (request.method !== 'POST' || request.url !== '/') { response.writeHead(405).end(); return }
    if (request.headers['content-type']?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
      response.writeHead(415).end(); return
    }
    try {
      const chunks: Buffer[] = []
      let size = 0
      for await (const chunk of request) {
        size += chunk.length
        if (size > 64 * 1024) { response.writeHead(413).end(); return }
        chunks.push(chunk)
      }
      const command: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      if (!command || typeof command !== 'object' || !('do' in command) || typeof command.do !== 'string') {
        response.writeHead(400).end(); return
      }
      response.end(JSON.stringify(await run(command as { do: string; [key: string]: unknown })))
    } catch (error) {
      response.writeHead(400).end(JSON.stringify({ error: String(error).slice(0, 600) }))
    }
  })
}
