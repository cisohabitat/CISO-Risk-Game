import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Public provenance only. Never serialize the build environment. */
export function buildInfo(root: string) {
  const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string }
  let commit = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || ''
  if (!/^[a-f0-9]{40}$/i.test(commit)) {
    try {
      commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    } catch {
      commit = ''
    }
  }
  return { version, commit: /^[a-f0-9]{40}$/i.test(commit) ? commit : undefined, builtAt: new Date().toISOString() }
}
