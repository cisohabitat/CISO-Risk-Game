/**
 * The campaign calendar. Day 0 is the first Monday of the year and the
 * months are real, because the header shows the date to the player and the
 * board pack names the day an incident began.
 *
 * Lives in the engine rather than the store so that engine-side text (the
 * board agenda) can date things without importing the presentation layer.
 */
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** A real year, because the header shows the date to the player. */
const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

/**
 * Day 0 is the first Monday of the campaign year.
 *
 * Months used to be a uniform 30.33 days, which put "30 February" in the header
 * and made every date after January wrong by a day or two. Nothing tested it
 * because nothing reads the string; it took looking at a screenshot.
 */
/**
 * "22 April": a day as the player reads it. The review and the messages said
 * "on day 221" while every screen around them showed dates, so a player had
 * to count from January to place an incident they had lived through.
 */
export function dateOf(day: number): string {
  return formatGameDate(day).label
}

/** "22 April, 3 May and 9 June". */
export function datesOf(days: number[]): string {
  const labels = days.map(dateOf)
  return labels.length <= 1 ? (labels[0] ?? '') : `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`
}

const YEAR_WORDS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth']

/** "second": which year of the job this is, as the game says it. */
export function yearWord(year: number | undefined): string {
  const n = Math.max(1, Math.floor(year ?? 1))
  return YEAR_WORDS[n - 1] ?? `${n}th`
}

export function formatGameDate(day: number): { label: string; month: string; weekLabel: string } {
  let remaining = Math.max(0, Math.floor(day))
  let monthIndex = 0
  while (monthIndex < MONTH_LENGTHS.length - 1 && remaining >= MONTH_LENGTHS[monthIndex]!) {
    remaining -= MONTH_LENGTHS[monthIndex]!
    monthIndex += 1
  }
  const month = MONTHS[monthIndex] ?? 'December'
  return {
    label: `${remaining + 1} ${month}`,
    month,
    // 364 days is 52 weeks and a day; the last day, 31 December, belongs to
    // week 52 rather than opening a week 53 nobody will play.
    weekLabel: `Week ${Math.min(52, Math.floor(day / 7) + 1)}`,
  }
}

