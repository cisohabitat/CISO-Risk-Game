/**
 * Where a response counts as done. The response panel reads containment and
 * recovery at or above this as "Contained" and "Recovered", and the annual
 * review counts an incident in recovery past it as no longer running, so the
 * two say the same thing about the same incident.
 */
export const RESPONSE_DONE = 0.95

/**
 * The consequence at which an incident is the board's business, not only the
 * security team's. The same floor as the organisation-wide diversion.
 */
export const BOARD_MATERIAL = 0.3
/** Regulatory interest at which the board must hear regardless of consequence. */
export const BOARD_REGULATORY = 0.5
/** Days after the response begins within which the board expects to hear from the CISO. */
export const BOARD_BRIEFING_DAYS = 3
