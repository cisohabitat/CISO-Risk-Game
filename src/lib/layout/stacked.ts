/**
 * Whether a list and its detail panel are stacked, one under the other, as
 * they are below the `lg` breakpoint. There, a selection's detail appears
 * after the whole list, and on a phone choosing a card seemed to do nothing
 * (AI phone playtest, 2026-10-09): the screen has to take the player to it.
 */
export function detailIsBelowTheList(): boolean {
  return typeof window.matchMedia === 'function' && !window.matchMedia('(min-width: 1024px)').matches
}
