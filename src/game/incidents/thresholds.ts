/**
 * Where a response counts as done. The response panel reads containment and
 * recovery at or above this as "Contained" and "Recovered", and the annual
 * review counts an incident in recovery past it as no longer running, so the
 * two say the same thing about the same incident.
 */
export const RESPONSE_DONE = 0.95
