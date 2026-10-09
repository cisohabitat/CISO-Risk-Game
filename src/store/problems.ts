/**
 * Where the game reports what went wrong without stopping: a save it refused
 * to write, a screen that failed to draw, a save it could not open. The
 * playtest log listens (docs/ROADMAP.md, Phase 5: crash capture to the same
 * local file as the session log); nothing else does, and nothing is sent.
 */
export interface Problem {
  kind: 'save-refused' | 'save-recovered' | 'screen-failed' | 'uncaught'
  detail: string
}

const listeners = new Set<(problem: Problem) => void>()

export function reportProblem(problem: Problem): void {
  console.error(`[${problem.kind}] ${problem.detail}`)
  listeners.forEach((listener) => listener(problem))
}

export function onProblem(listener: (problem: Problem) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
