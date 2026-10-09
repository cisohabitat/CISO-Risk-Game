/**
 * When a campaign was saved, in the interface's language rather than the
 * browser's. `toLocaleString()` with no locale printed "10/9/2026, 3:04:12 PM"
 * on an American browser beside a British interface — the ninth of October or
 * the tenth of September, depending on who was reading.
 */
export function savedAtLabel(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
