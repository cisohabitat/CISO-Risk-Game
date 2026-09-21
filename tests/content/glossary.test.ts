import { describe, expect, it } from 'vitest'
import { nexoraContent } from '@/content/nexora'

/**
 * The player guide is written for somebody who knows nothing about the
 * subject, and the glossary defined only the game's own mechanics. Measured
 * across the authored content: "privileged" 82 times, "credential" 78,
 * "segmentation" 52, "MFA" 35, "pipeline" 45 — none of them defined. Every
 * term of art the content leans on has an entry, and this keeps it so: a new
 * piece of jargon that arrives without one fails here.
 */
const TERMS: [RegExp, string][] = [
  [/\bSOC\b/, 'gls-soc'],
  [/\bMFA\b|second factor/i, 'gls-mfa'],
  [/privileged/i, 'gls-privileged'],
  [/credential/i, 'gls-credential'],
  [/service account/i, 'gls-service-account'],
  [/segmentation/i, 'gls-segmentation'],
  [/peer(ed|ing)/i, 'gls-peering'],
  [/tenanc(y|ies)/i, 'gls-tenancy'],
  [/pipeline/i, 'gls-pipeline'],
  [/workload identit/i, 'gls-workload-identity'],
  [/jump server/i, 'gls-jump-server'],
  [/\bPAM\b|vault/i, 'gls-vault'],
  [/break-glass/i, 'gls-break-glass'],
  [/\bVPN\b|remote access/i, 'gls-remote-access'],
  [/\bEDR\b|endpoint/i, 'gls-endpoint'],
  [/telemetry/i, 'gls-telemetry'],
  [/exploit/i, 'gls-patch-exploit'],
  [/phishing/i, 'gls-phishing'],
  [/ransomware/i, 'gls-ransomware'],
  [/immutable/i, 'gls-immutable-backup'],
  [/containment/i, 'gls-containment'],
  [/retainer/i, 'gls-retainer'],
  [/egress/i, 'gls-egress'],
  [/posture/i, 'gls-posture'],
  [/assurance/i, 'gls-assurance'],
  [/cardholder|\bPCI\b|acquirer/i, 'gls-cardholder'],
  [/extranet|partner portal/i, 'gls-extranet'],
  [/managed service provider|\bMSP\b/i, 'gls-msp'],
  [/identity platform|identity provider/i, 'gls-identity-platform'],
]

function everyString(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach((v) => everyString(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => everyString(v, out))
  return out
}

describe('the glossary', () => {
  it('defines every term of art the content leans on, in a section of its own', () => {
    const ids = new Set(nexoraContent.glossary.map((entry) => entry.id))
    const { glossary: _glossary, ...rest } = nexoraContent
    const text = everyString(rest)
    for (const [pattern, id] of TERMS) {
      const uses = text.filter((line) => pattern.test(line)).length
      expect(uses, `${pattern} is not used by the content any more; retire ${id} or this row`).toBeGreaterThan(0)
      expect(ids.has(id), `the content uses ${pattern} ${uses} times and the glossary has no ${id}`).toBe(true)
      expect(nexoraContent.glossary.find((entry) => entry.id === id)?.section).toBe('subject')
    }
    const game = nexoraContent.glossary.filter((entry) => (entry.section ?? 'game') === 'game')
    expect(game.length, 'the game\'s own words are still defined').toBeGreaterThanOrEqual(19)
  })
})
