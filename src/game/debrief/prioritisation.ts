/**
 * Did the player's scarce resources go to what mattered? (plan §26.)
 *
 * The dimension used to score three things — whether the player decided at
 * all, whether they decided in time, and whether they recorded why — none of
 * which establish that attention and money went to the right places. A player
 * could answer every prompt promptly, invest the year in the wrong problems,
 * and read `strong`. That is decision discipline, which is worth having and is
 * not what the plan names.
 *
 * This measures selection instead: of the commitments the player made, how
 * material were they, against the best they could have chosen with the same
 * number of commitments?
 *
 * Three things it deliberately is not:
 *
 * - **Not coverage.** How much of the estate was examined is the blind-spots
 *   dimension. This asks whether the things you *did* choose were the ones
 *   worth choosing, so a player who commits to one thing and picks the biggest
 *   risk in the organisation scores full marks. "Pick one programme and finish
 *   it" is the advice the player guide gives; the review should not then mark
 *   it down for not having picked four.
 *
 * - **Not judged against the end state.** Materiality is read from the day-one
 *   snapshot in `risks.initialMateriality`. A programme that worked lowers its
 *   scenario's residual, so scoring the year-end picture would read success as
 *   having worked on something that did not matter.
 *
 * - **Not judged against what the player could not know.** The comparison set
 *   is scenarios some investigation or programme in the campaign could have
 *   reached. Scoring against risks nothing in the game could have led them to
 *   would make the dimension unwinnable, which is the same defect pointing the
 *   other way.
 */
import type { ContentIndex, GameState } from '../types'
import { assessScenario } from '../risk/calculations'

export interface Commitment {
  /** What the player spent: a programme they started, or an enquiry they ran. */
  kind: 'programme' | 'enquiry'
  label: string
  /** The most material scenario this piece of work was aimed at.  */
  scenarioId: string
  scenarioTitle: string
  materiality: number
}

export interface EffortAllocation {
  /**
   * 0..1, normalised: 0 is the worst set of choices this campaign offered, 1
   * the best. The raw ratio below never approaches 0 — even the least material
   * thing you could commit to is a real risk — so passing it through unshaped
   * put a player who deliberately chased the smallest risks in the top band on
   * 19 of 20 seeds. The floor is computed per campaign rather than assumed.
   */
  allocation: number
  /** The unnormalised ratio: how close to the biggest risk the average commitment was. */
  raw: number
  /** The worst ratio this campaign's own options allowed. */
  floor: number
  commitments: Commitment[]
  /** The most material scenario anything in the campaign could have reached. */
  biggest?: { id: string; title: string; materiality: number }
  /** The biggest one no commitment went near. */
  missed?: { id: string; title: string; materiality: number }
}

/**
 * Which scenarios a piece of work was aimed at.
 *
 * Deliberately narrow. Matching through whole attack paths as well is a mean
 * of 6.0 scenarios of 14 per enquiry and a maximum of all 14, because the
 * paths cross the estate: assessing almost any control grazes almost every
 * risk. A scenario's `triggerNodeIds` are the systems it is actually about,
 * and a programme's treatment link is an authored statement that it addresses
 * that risk — 0.8 and 2-to-5 scenarios respectively.
 *
 * The normalisation below turns out to absorb most of the difference, so this
 * is not the only thing holding the measure up. It still earns its place on
 * two counts: it is the more truthful statement of what a piece of work was
 * aimed at, and measured over 20 campaigns per style the loose version puts an
 * undirected year in the top band on 2 seeds of 20 and the narrow one on none
 * — a threshold a play style sits exactly on reads as noise to the player.
 */
export function aimedAt(index: ContentIndex, opts: { programmeId?: string; nodeIds?: Set<string> }): string[] {
  const out: string[] = []
  for (const def of index.content.riskScenarios) {
    if (opts.programmeId && def.treatmentProgrammeIds.includes(opts.programmeId)) {
      out.push(def.id)
    } else if (opts.nodeIds && def.triggerNodeIds.some((id) => opts.nodeIds!.has(id))) {
      out.push(def.id)
    }
  }
  return out
}

export function effortAllocation(state: GameState, index: ContentIndex): EffortAllocation {
  // A campaign saved before the snapshot existed cannot have its first day
  // recovered, so it is assessed from where it stands now. That reads a
  // successful programme as having addressed something smaller than it was,
  // which is the bias this measure otherwise exists to avoid — but it is much
  // closer than the alternative, which is scoring a year of good choices at
  // zero because the yardstick is missing.
  const materiality =
    state.risks.initialMateriality ??
    Object.fromEntries(
      index.content.riskScenarios.map((def) => [def.id, assessScenario(state, index, def).residual]),
    )
  const describe = (id: string) => ({
    id,
    title: index.riskScenario.get(id)?.title ?? id,
    materiality: materiality[id] ?? 0,
  })

  // The ceiling: the most material risk anything in this campaign could have
  // been pointed at. Scoring against a risk nothing could reach would make the
  // dimension unwinnable, which is the same defect as scoring against nothing.
  const reachable = new Set<string>()
  for (const def of index.content.programmes) for (const id of aimedAt(index, { programmeId: def.id })) reachable.add(id)
  const allRevealed = new Set<string>()
  for (const def of index.content.investigations) for (const id of def.revealsNodeIds) allRevealed.add(id)
  for (const id of aimedAt(index, { nodeIds: allRevealed })) reachable.add(id)
  const ranked = [...reachable].map(describe).sort((a, b) => b.materiality - a.materiality)
  const biggest = ranked[0]

  const commitments: Commitment[] = []
  // Every scenario a commitment was aimed at. The score reads the biggest of
  // them; "missed" must read all of them, or a programme that treats three
  // scenarios is told it went nowhere near the two it was not scored on. The
  // second observed playtest funded recovery on day one and was told that
  // nothing it did went near the recovery risk.
  const addressed = new Set<string>()
  const pick = (kind: Commitment['kind'], label: string, scenarioIds: string[]) => {
    for (const id of scenarioIds) addressed.add(id)
    // Work that was not about any authored risk — a team review, threat intel —
    // is not counted either way. It is effort, but it is not a choice about
    // which risk to pursue, and charging it here would mark a player down for
    // looking after their own people. Team sustainability is its own dimension.
    if (scenarioIds.length === 0) return
    const best = scenarioIds.map(describe).sort((a, b) => b.materiality - a.materiality)[0]!
    commitments.push({ kind, label, scenarioId: best.id, scenarioTitle: best.title, materiality: best.materiality })
  }

  for (const runtime of Object.values(state.programmes.programmes)) {
    if (runtime.status === 'proposed') continue
    const def = index.programme.get(runtime.id)
    pick('programme', def?.shortName ?? runtime.id, aimedAt(index, { programmeId: runtime.id }))
  }
  for (const assignment of state.team.assignments) {
    const def = index.investigation.get(assignment.refId)
    if (!def) continue
    pick('enquiry', def.name, aimedAt(index, { nodeIds: new Set(def.revealsNodeIds) }))
  }

  // How close to the biggest thing in the organisation the average commitment
  // was. Not how many things were covered: that is the blind-spots dimension,
  // and a player who commits to one thing and picks the right one has
  // prioritised perfectly.
  const ceiling = biggest?.materiality ?? 0
  const raw =
    commitments.length === 0 || ceiling <= 0
      ? 0
      : Math.min(1, commitments.reduce((sum, c) => sum + c.materiality, 0) / (commitments.length * ceiling))

  // The worst this campaign allowed: the least material thing the player could
  // have pointed a programme or an enquiry at. Everything between that and the
  // ceiling is the range they were actually choosing within, so that is the
  // range the dimension reads.
  let worst = ceiling
  for (const def of index.content.programmes) {
    const aimed = aimedAt(index, { programmeId: def.id })
    if (aimed.length === 0) continue
    worst = Math.min(worst, Math.max(...aimed.map((id) => materiality[id] ?? 0)))
  }
  for (const def of index.content.investigations) {
    const aimed = aimedAt(index, { nodeIds: new Set(def.revealsNodeIds) })
    if (aimed.length === 0) continue
    worst = Math.min(worst, Math.max(...aimed.map((id) => materiality[id] ?? 0)))
  }
  const floor = ceiling > 0 ? worst / ceiling : 0
  const allocation = commitments.length === 0 || floor >= 1 ? 0 : Math.max(0, Math.min(1, (raw - floor) / (1 - floor)))

  // Decisions the player chose, as opposed to ones that lapsed, count as having
  // gone near whatever risk their effects touched. They are not commitments in
  // the sense scored above — the game offered them, the player did not pick the
  // risk — so they leave the score alone. But "nothing you did went near it" is
  // a claim about everything the player did: a year that fixed card data on
  // day 244 was told nothing it did went near the card data risk.
  for (const runtime of Object.values(state.decisions.decisions)) {
    if (!runtime.selectedOptionId || runtime.resolvedByDefault) continue
    const option = index.decision.get(runtime.defId)?.options.find((o) => o.id === runtime.selectedOptionId)
    if (!option) continue
    if (runtime.scenarioId) addressed.add(runtime.scenarioId)
    // A decision about something went near it whatever was chosen: refusing
    // the Kestrel join until due diligence was done changes no node, and the
    // close said nothing the player did went near the acquisition risk.
    const nodeIds = new Set<string>(index.decision.get(runtime.defId)?.relatedNodeIds ?? [])
    const effects = [...(option.immediateEffects ?? []), ...(option.delayedEffects ?? []).flatMap((d) => d.effects)]
    for (const effect of effects) {
      const target = effect as { nodeId?: unknown; scenarioId?: unknown }
      if (typeof target.nodeId === 'string') nodeIds.add(target.nodeId)
      if (typeof target.scenarioId === 'string' && index.riskScenario.has(target.scenarioId)) addressed.add(target.scenarioId)
    }
    for (const id of aimedAt(index, { nodeIds })) addressed.add(id)
  }
  // So does raising, accepting or escalating the risk itself: "Cardholder
  // data … nothing you did went near it" was said to a player who raised it
  // as a scenario in October (AI second-year re-test).
  for (const entry of state.history.entries) {
    if (entry.kind !== 'risk-opened' && entry.kind !== 'risk-accepted' && entry.kind !== 'escalation') continue
    const scenarioId = entry.refs?.[0]
    if (scenarioId && index.riskScenario.has(scenarioId)) addressed.add(scenarioId)
  }
  // So does an enquiry that traced a dependency between a risk's systems.
  // A cloud configuration review that exposed the peering from non-production
  // into production was followed by "Non-production environment as a route
  // into production ... nothing you did went near it" (AI playtest,
  // harbour-87524): the enquiry counts its systems, not its dependencies.
  for (const assignment of state.team.assignments) {
    if (assignment.status !== 'complete') continue
    const def = index.investigation.get(assignment.refId)
    if (!def) continue
    const ends = new Set<string>()
    for (const edgeId of def.revealsEdgeIds ?? []) {
      const edge = index.edge.get(edgeId)
      if (edge) {
        ends.add(edge.from)
        ends.add(edge.to)
      }
    }
    for (const scenario of index.content.riskScenarios) {
      if (scenario.triggerNodeIds.filter((id) => ends.has(id)).length >= 2) addressed.add(scenario.id)
    }
  }

  const missed = ranked.find((s) => !addressed.has(s.id) && s.materiality > 0)

  return { allocation, raw, floor, commitments, biggest, missed }
}
