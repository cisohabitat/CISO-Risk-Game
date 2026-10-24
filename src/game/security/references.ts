/** Object-map references must never resolve through JavaScript's prototype. */
export function unsafeKey(value: unknown): boolean {
  return value === '__proto__' || value === 'constructor' || value === 'prototype'
}

export function referenceField(key: string): boolean {
  return key === 'id' || key === 'fn' || key === 'flag' || key === 'refs' || key.endsWith('Id') || key.endsWith('Ids')
}

export function ownValue<T>(record: Record<string, T>, key: string): T | undefined {
  return Object.hasOwn(record, key) ? record[key] : undefined
}
