/**
 * Deterministic seeded RNG service.
 *
 * Domain rule: simulation code must never call Math.random(). Every draw is a
 * pure function of (campaign seed, cursor), and the cursor lives in game state,
 * so a save reproduces the exact same future. ESLint blocks Math.random in the
 * repository; see eslint.config.js.
 */

/** xmur3 string hash -> 32-bit seed. */
function hashString(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

/** splitmix32: strong avalanche for a counter-based stream. */
function splitmix32(a: number): number {
  let t = (a + 0x9e3779b9) | 0
  t = Math.imul(t ^ (t >>> 16), 0x21f0aaad)
  t = Math.imul(t ^ (t >>> 15), 0x735a2d97)
  return ((t ^ (t >>> 15)) >>> 0) / 4294967296
}

export interface Rng {
  readonly seed: string
  /** Number of draws consumed; persisted in game state. */
  cursor: number
  next(): number
  int(minInclusive: number, maxInclusive: number): number
  chance(probability: number): boolean
  pick<T>(items: readonly T[]): T
  weighted<T>(items: readonly T[], weight: (item: T) => number): T | undefined
  shuffle<T>(items: readonly T[]): T[]
  /** Uniform draw in [min, max). */
  range(min: number, max: number): number
  /** Symmetric jitter in [-amount, +amount]. */
  jitter(amount: number): number
  /** Roughly normal draw via averaging; used for quality/variance rolls. */
  normal(mean: number, spread: number): number
}

export function createRng(seed: string, cursor = 0): Rng {
  const base = hashString(seed)
  const rng: Rng = {
    seed,
    cursor,
    next() {
      const value = splitmix32((base + this.cursor * 0x6d2b79f5) | 0)
      this.cursor += 1
      return value
    },
    int(minInclusive, maxInclusive) {
      if (maxInclusive <= minInclusive) return minInclusive
      return minInclusive + Math.floor(this.next() * (maxInclusive - minInclusive + 1))
    },
    chance(probability) {
      if (probability <= 0) {
        this.next()
        return false
      }
      if (probability >= 1) {
        this.next()
        return true
      }
      return this.next() < probability
    },
    pick(items) {
      if (items.length === 0) throw new Error('rng.pick called with an empty list')
      return items[this.int(0, items.length - 1)] as never
    },
    weighted(items, weight) {
      let total = 0
      for (const item of items) {
        const w = weight(item)
        if (w > 0 && Number.isFinite(w)) total += w
      }
      if (total <= 0) {
        this.next()
        return undefined
      }
      let roll = this.next() * total
      for (const item of items) {
        const w = weight(item)
        if (!(w > 0) || !Number.isFinite(w)) continue
        roll -= w
        if (roll <= 0) return item
      }
      return items[items.length - 1]
    },
    shuffle(items) {
      const copy = items.slice()
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = this.int(0, i)
        const a = copy[i] as never
        copy[i] = copy[j] as never
        copy[j] = a
      }
      return copy
    },
    range(min, max) {
      return min + this.next() * (max - min)
    },
    jitter(amount) {
      return (this.next() * 2 - 1) * amount
    },
    normal(mean, spread) {
      const a = this.next()
      const b = this.next()
      const c = this.next()
      const avg = (a + b + c) / 3
      return mean + (avg - 0.5) * 2 * spread
    },
  }
  return rng
}

/**
 * Derives an independent, reproducible stream for a named purpose. Used where
 * a subsystem needs draws that must not shift when unrelated code changes how
 * many draws it consumes (e.g. world generation).
 */
export function deriveRng(seed: string, purpose: string, cursor = 0): Rng {
  return createRng(`${seed}::${purpose}`, cursor)
}
