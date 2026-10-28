/**
 * Guards the deployment configuration.
 *
 * `vercel.json` is schema-validated by Vercel at deploy time and rejects any
 * property it does not recognise — including comment keys, which is how a
 * previous version of this file broke a deployment. It is also the file that
 * keeps the MVP on static hosting, so the hard rules from the plan's release
 * gate (§50) are asserted here rather than trusted.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const vercelConfig = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8')) as Record<
  string,
  unknown
>

/** Top-level properties Vercel's schema accepts. Anything else fails the deploy. */
const ALLOWED_KEYS = new Set([
  '$schema',
  'buildCommand',
  'cleanUrls',
  'crons',
  'devCommand',
  'framework',
  'functions',
  'git',
  'headers',
  'ignoreCommand',
  'images',
  'installCommand',
  'outputDirectory',
  'public',
  'redirects',
  'regions',
  'rewrites',
  'trailingSlash',
])

describe('deployment configuration', () => {
  it('uses only properties Vercel recognises', () => {
    const unknown = Object.keys(vercelConfig).filter((key) => !ALLOWED_KEYS.has(key))
    expect(unknown, `vercel.json rejects unknown properties, including comments: ${unknown.join(', ')}`).toEqual([])
  })

  it('declares no server-side runtime at all', () => {
    // The MVP must deploy with no functions, no cron and no metered compute.
    expect(vercelConfig.functions).toBeUndefined()
    expect(vercelConfig.crons).toBeUndefined()
    expect(vercelConfig.regions).toBeUndefined()
  })

  it('builds static output with the expected commands', () => {
    expect(vercelConfig.framework).toBe('vite')
    expect(vercelConfig.outputDirectory).toBe('dist')
    expect(vercelConfig.buildCommand).toBe('pnpm check')
    expect(vercelConfig.installCommand).toContain('--frozen-lockfile')
  })

  it('keeps the static files out of the SPA fallback', () => {
    const rewrites = vercelConfig.rewrites as { source: string; destination: string }[]
    expect(rewrites).toHaveLength(1)
    const [rule] = rewrites
    expect(rule?.destination).toBe('/index.html')

    // The fallback must not swallow real files.
    const pattern = new RegExp(`^${rule!.source}$`)
    for (const path of ['/assets/index-abc123.js', '/favicon.svg', '/manifest.webmanifest']) {
      expect(pattern.test(path), `${path} must be served from disk, not rewritten`).toBe(false)
    }
    // The player's guide is dist/guide.html. Vercel serves a file that exists
    // before it applies a rewrite, and clean URLs are what make /guide find it;
    // without them the link from the game would land back on the game.
    expect(vercelConfig.cleanUrls).toBe(true)
    // Application routes must still fall back to the shell.
    for (const path of ['/', '/risk', '/organisation/node-idp']) {
      expect(pattern.test(path), `${path} should fall back to index.html`).toBe(true)
    }
  })

  it('sets the security headers the plan asks for', () => {
    const headers = vercelConfig.headers as { source: string; headers: { key: string; value: string }[] }[]
    const global = headers.find((entry) => entry.source === '/(.*)')
    expect(global).toBeDefined()
    const keys = global!.headers.map((header) => header.key)
    expect(keys).toContain('Content-Security-Policy')
    expect(keys).toContain('X-Content-Type-Options')

    const csp = global!.headers.find((header) => header.key === 'Content-Security-Policy')!.value
    // No inline or remote script execution: the bundle is self-hosted.
    expect(csp).toContain("script-src 'self'")
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("frame-ancestors 'none'")
  })

  it('ships no serverless entry points in the repository', async () => {
    const { readdir } = await import('node:fs/promises')
    const root = await readdir(new URL('../../', import.meta.url))
    expect(root).not.toContain('api')
  })
})

describe('CI browser coverage', () => {
  // The browser suite runs in CI as a matrix of project groups and shards. A
  // project added to the Playwright config but to no group would pass CI
  // without ever running; a group whose shards do not count 1..n would skip
  // part of its project.
  it('runs every Playwright project, each in one group, with complete shards', () => {
    const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8')
    const config = readFileSync(new URL('../../playwright.config.ts', import.meta.url), 'utf8')
    const projects = [...config.slice(config.indexOf('projects:')).matchAll(/name: '([\w-]+)'/g)].map((match) => match[1]!)
    expect(projects.length).toBeGreaterThan(0)
    const groups = new Map<string, number[]>()
    for (const [, args] of workflow.matchAll(/args: (.+)/g)) {
      const names = [...args!.matchAll(/--project=([\w-]+)/g)].map((match) => match[1]!).sort().join(' ')
      const [current, total] = /--shard=(\d+)\/(\d+)/.exec(args!)!.slice(1).map(Number)
      groups.set(`${names}/${total}`, [...(groups.get(`${names}/${total}`) ?? []), current!])
    }
    const covered: string[] = []
    for (const [key, shards] of groups) {
      const total = Number(key.split('/').at(-1))
      expect(shards.sort((a, b) => a - b), key).toEqual(Array.from({ length: total }, (_, i) => i + 1))
      covered.push(...key.slice(0, key.lastIndexOf('/')).split(' '))
    }
    expect(covered.sort()).toEqual([...projects].sort())
  })
})

describe('CI supply-chain boundaries', () => {
  it('uses read-only tokens, ephemeral checkout credentials and pinned actions', () => {
    const workflow = readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8')
    // The shared setup steps live in a local composite action; its third-party
    // actions are held to the same pinning as the workflow's own.
    const setup = readFileSync(new URL('../../.github/actions/setup/action.yml', import.meta.url), 'utf8')
    expect(workflow).toContain('permissions:\n  contents: read\n')
    const actions = [...`${workflow}\n${setup}`.matchAll(/uses: ([\w/-]+)@([^\s]+)/g)]
    expect(actions.length).toBeGreaterThanOrEqual(4)
    // Local actions are the only unpinned references allowed.
    for (const local of workflow.matchAll(/uses: (\S+)/g)) {
      if (!local[1]!.includes('@')) expect(local[1]).toMatch(/^\.\/\.github\/actions\//)
    }
    for (const action of actions) expect(action[2], action[1]).toMatch(/^[a-f0-9]{40}$/)
    const checkouts = workflow.match(/uses: actions\/checkout@/g) ?? []
    expect(workflow.match(/persist-credentials: false/g)).toHaveLength(checkouts.length)
    expect(workflow).not.toContain('pull_request_target')
    expect(setup).not.toContain('actions/checkout')
    expect(workflow).toContain('pnpm audit:security')
  })
})
