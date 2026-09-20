import { describe, expect, it } from 'vitest'
import { readdir, readFile } from 'node:fs/promises'

/**
 * The release gate, asserted rather than remembered.
 *
 * `docs/HOSTING.md` lists fourteen conditions a build must meet. CI already
 * covers five of them; the rest were marked "checked before release", which in
 * practice meant nobody checked them, because they are all properties that hold
 * by construction today and would only ever break by accident — somebody adding
 * analytics, an account system, or a key to the bundle.
 *
 * Those are exactly the changes that should fail a build rather than be noticed
 * later, so the ones that can be read off the source are read off the source
 * here. The three that genuinely need a deployment (steps 12-14: Vercel builds,
 * the suite passes against the deployed URL, and the Functions tab shows no
 * invocations) cannot be checked from a test and stay in the document.
 */

async function sourceFiles(): Promise<{ path: string; code: string }[]> {
  const root = new URL('../../src/', import.meta.url)
  const files: URL[] = []
  const walk = async (dir: URL) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const child = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir)
      if (entry.isDirectory()) await walk(child)
      else if (/\.(ts|tsx)$/.test(entry.name)) files.push(child)
    }
  }
  await walk(root)
  return Promise.all(
    files.map(async (file) => ({
      path: file.pathname.replace(/.*\/src\//, 'src/'),
      // Comments discuss the rules; only code can break them.
      code: (await readFile(file, 'utf8'))
        .split('\n')
        .filter((line) => {
          const trimmed = line.trimStart()
          return !trimmed.startsWith('*') && !trimmed.startsWith('//') && !trimmed.startsWith('/*')
        })
        .join('\n'),
    })),
  )
}

describe('release gate', () => {
  it('makes no network request, so gameplay cannot produce compute (steps 7, 8, 14)', async () => {
    const files = await sourceFiles()
    expect(files.length).toBeGreaterThan(40)

    // Step 14 asks that the Functions tab show no invocations after a full
    // playthrough. The strongest form of that is an application that has no way
    // to call anything: no request primitive reaches the bundle at all.
    const forbidden = ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'new WebSocket', 'EventSource(']
    for (const { path, code } of files) {
      for (const primitive of forbidden) {
        expect(code, `${path} would make a network request (${primitive})`).not.toContain(primitive)
      }
    }
  })

  it('asks nobody to sign in (step 4)', async () => {
    const files = await sourceFiles()
    // A new player starts by pressing a button. Anything resembling an account
    // is a change to the product, not a refactor, and should say so loudly.
    const forbidden = ['signIn', 'signOut', 'oauth', 'OAuth', 'Auth0', 'getSession', 'currentUser']
    for (const { path, code } of files) {
      for (const term of forbidden) {
        expect(code, `${path} looks like it introduces accounts`).not.toContain(term)
      }
    }
  })

  it("keeps the campaign on the player's own device (step 5)", async () => {
    const files = await sourceFiles()
    // IndexedDB via idb, and nothing else. A remote store would also be caught
    // by the network test above, but this names the actual requirement.
    const persistence = files.filter((file) => /from '(idb|@supabase|firebase)/.test(file.code))
    expect(persistence.length).toBeGreaterThan(0)
    for (const { path, code } of persistence) {
      expect(code, `${path} persists somewhere other than the browser`).not.toMatch(/@supabase|firebase/)
    }
  })

  it('reads no environment variable that could carry a secret (step 9)', async () => {
    const files = await sourceFiles()
    // `import.meta.env.DEV` and `.PROD` are build-time booleans Vite inlines and
    // are fine. Anything else read off the environment ends up in the bundle as
    // a literal, which is how a key ships to every player.
    for (const { path, code } of files) {
      for (const match of code.matchAll(/import\.meta\.env\??\.([A-Za-z_]+)/g)) {
        expect(['DEV', 'PROD', 'MODE', 'BASE_URL', 'SSR']).toContain(match[1])
      }
      expect(code, `${path} reads process.env, which Vite inlines into the bundle`).not.toContain('process.env.')
    }
  })
})
