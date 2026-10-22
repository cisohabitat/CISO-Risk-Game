/** A viable initial allocation: the same half-cost floor offered by the UI. */
export function minimumProgrammeFunding(cost: number): number {
  return Math.ceil(cost * 0.5)
}

/** The delivery push offered in the portfolio: a quarter of the base cost. */
export function programmeAccelerationCost(cost: number): number {
  return Math.round(cost * 0.25)
}
