/**
 * The mechanical half of docs/VOICE.md, as a check any pack can be put
 * through: `pnpm validate:content` runs it, and tests/content/voice.test.ts
 * holds Nexora and the lessons to it.
 */

export interface VoiceLine {
  where: string
  text: string
  /** Said by a character in a message, rather than by the game itself. */
  inCharacter: boolean
}

export interface VoiceRule {
  id: string
  description: string
  /** Applies to the game's own voice only, not to characters in messages. */
  ownVoiceOnly?: boolean
  test: (text: string) => boolean
}

/** Every prose string in a pack, and every id it declares. */
export function collectLines(raw: unknown): { lines: VoiceLine[]; ids: Set<string> } {
  const lines: VoiceLine[] = []
  const ids = new Set<string>()
  const walk = (value: unknown, where: string, inCharacter: boolean): void => {
    if (typeof value === 'string') {
      // Prose has spaces; ids, enums and tags do not.
      if (value.includes(' ')) lines.push({ where, text: value, inCharacter })
    } else if (Array.isArray(value)) {
      value.forEach((item, position) => walk(item, `${where}[${position}]`, inCharacter))
    } else if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) {
        if (key === 'id' && typeof item === 'string' && item.includes('-')) ids.add(item)
        // Messages are written in the sender's voice; everything else is the game's.
        walk(item, where ? `${where}.${key}` : key, inCharacter || (where === '' && key === 'events'))
      }
    }
  }
  walk(raw, '', false)
  return { lines, ids }
}

export function voiceRules(ids: Set<string>): VoiceRule[] {
  const escaped = [...ids].map((id) => id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const idPattern = escaped.length > 0 ? new RegExp(`(?<![\\w-])(${escaped.join('|')})(?![\\w-])`) : undefined
  return [
    {
      id: 'british-english',
      description: 'British spelling',
      test: (text) =>
        /\b(organiz|prioritiz|analyz|recogniz|minimiz|maximiz|authoriz|utiliz|behavior|color|defense\b|center\b|favor|honor\b|catalog\b|modeling|traveled|canceled\b|programs\b)/i.test(text),
    },
    { id: 'exclamation', description: 'no exclamation marks', test: (text) => text.includes('!') },
    { id: 'typography', description: 'straight quotes, single spaces', test: (text) => /[‘’“”]/.test(text) || /\S {2,}\S/.test(text) },
    { id: 'day-number', description: 'dates, not day numbers', test: (text) => /\bday \d+\b/i.test(text) },
    {
      id: 'visible-id',
      description: 'names, not ids',
      test: (text) => Boolean(idPattern?.test(text.replace(/\{\{[^}]*\}\}/g, ''))),
    },
    {
      id: 'praise',
      description: 'the game does not praise',
      ownVoiceOnly: true,
      test: (text) => /\b(congratulations|well done|great job|good job|nice work|awesome|amazing)\b/i.test(text),
    },
    { id: 'prescription', description: 'the game does not prescribe', ownVoiceOnly: true, test: (text) => /\byou (should|must|ought to)\b/i.test(text) },
    { id: 'score', description: 'no score', ownVoiceOnly: true, test: (text) => /\b(score|points|level up|achievement unlocked)\b/i.test(text) },
    { id: 'interface-verbs', description: 'content does not say click or tap', ownVoiceOnly: true, test: (text) => /\b(click|tap)\b/i.test(text) },
    { id: 'cartoon', description: 'no hacker cliche, from anyone', test: (text) => /\b(you'?ve been hacked|hackers?|1337|pwn\w*)\b/i.test(text) },
  ]
}

export interface VoiceIssue {
  rule: string
  where: string
  text: string
}

export function voiceIssues(lines: VoiceLine[], ids: Set<string>): VoiceIssue[] {
  const issues: VoiceIssue[] = []
  for (const rule of voiceRules(ids)) {
    for (const line of lines) {
      if (rule.ownVoiceOnly && line.inCharacter) continue
      if (rule.test(line.text)) issues.push({ rule: rule.id, where: line.where, text: line.text.slice(0, 90) })
    }
  }
  return issues
}
