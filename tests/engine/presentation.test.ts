import { describe, expect, it } from 'vitest'
import { applyAction, newGame, runDays } from '@/game/engine/orchestrator'
import { buildAnnualReview } from '@/game/debrief/review'
import { collisions, formatGameDate, incidentCommand, patternSuggestions } from '@/store/selectors'
import { testIndex } from './helpers'

describe('incident command view', () => {
  it('shows only what the player has been told', () => {
    const index = testIndex()
    // Find a campaign that actually has an incident to look at.
    let state = newGame(index, { seed: 'cmd-1' })
    let found = false
    for (let seed = 0; seed < 12 && !found; seed += 1) {
      state = newGame(index, { seed: `cmd-${seed}` })
      for (let day = 0; day < 364; day += 1) {
        runDays(state, index, 1)
        if (incidentCommand(state, index)) {
          found = true
          break
        }
      }
    }
    expect(found, 'no campaign produced an incident to inspect').toBe(true)

    const view = incidentCommand(state, index)!
    expect(view.name.length).toBeGreaterThan(3)
    expect(view.daysRunning).toBeGreaterThanOrEqual(0)

    // Every timeline entry must correspond to a message the player was sent:
    // the attack path is hidden truth and may not reach the screen.
    const told = new Set(
      state.inbox.messages.filter((m) => m.type === 'incident').map((m) => m.body || m.subject),
    )
    for (const entry of view.timeline) {
      expect(told.has(entry.text), `timeline entry was never sent to the player: ${entry.text}`).toBe(true)
    }
  })

  it('records the choices taken during the response', () => {
    const index = testIndex()
    for (let seed = 0; seed < 12; seed += 1) {
      const state = newGame(index, { seed: `cmd-take-${seed}` })
      for (let day = 0; day < 364; day += 1) {
        const live = incidentCommand(state, index)
        if (live && live.awaiting.length > 0) {
          const target = live.awaiting[0]!
          const runtime = state.decisions.decisions[target.decisionId]!
          const def = index.decision.get(runtime.defId)!
          applyAction(state, index, {
            type: 'resolveDecision',
            decisionId: target.decisionId,
            optionId: def.options[0]!.id,
            // A reason the decision offers: incident decisions do not offer tolerance.
            rationaleTagIds: [def.rationaleTagIds?.[0] ?? 'rat-within-tolerance'],
          })
          // The field existed and nothing wrote to it, so the record was empty.
          const after = incidentCommand(state, index)
          expect(after?.taken.some((entry) => entry.title === def.title)).toBe(true)
          return
        }
        runDays(state, index, 1)
      }
    }
    throw new Error('no incident offered a decision within twelve campaigns')
  })
})

describe('collisions', () => {
  it('only names a date something could actually have covered', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'collide-1' })
    let sawOne = false
    for (let day = 0; day < 364; day += 1) {
      for (const collision of collisions(state, index)) {
        sawOne = true
        // A collision with no relevant programme is just a date; it is filtered
        // out rather than shown as "nothing covers this" every day.
        expect(collision.verdict).not.toBe('nothing-relevant')
        expect(collision.programmeName, collision.objectiveName).toBeTruthy()
        expect(collision.daysUntilTarget).toBeGreaterThanOrEqual(0)
        // The card offers a way into the decision, so the ids it navigates by
        // have to be real ones.
        expect(index.programme.get(collision.programmeId!), collision.programmeId).toBeDefined()
        for (const risk of collision.exposedRisks) {
          expect(index.riskScenario.get(risk.id), risk.id).toBeDefined()
        }
      }
      runDays(state, index, 1)
    }
    expect(sawOne, 'a year of play produced no collision at all').toBe(true)
  })

  it('reports a started programme differently from one never begun', () => {
    const index = testIndex()
    const idle = newGame(index, { seed: 'collide-2' })
    runDays(idle, index, 60)
    const beforeStart = collisions(idle, index)
    expect(beforeStart.some((collision) => collision.verdict === 'not-started')).toBe(true)

    const working = newGame(index, { seed: 'collide-2' })
    const def = index.programme.get('prog-identity')!
    applyAction(working, index, { type: 'startProgramme', programmeId: def.id, budget: def.budgetCost })
    runDays(working, index, 60)
    const started = collisions(working, index)
    const identityCollision = started.find((collision) => collision.programmeName === def.name)
    if (identityCollision) expect(identityCollision.verdict).not.toBe('not-started')
  })
})

describe('the annual review reads as prose', () => {
  it('never prints a raw function or enum id into a sentence', () => {
    const index = testIndex()
    // Raw ids that used to reach the closing screen: "Your architecture and grc
    // functions are spent", "soc: burning out". They are internal names, and the
    // last thing a player reads should not contain one.
    const rawIds = /\b(grc|soc|iam|incident-response)\b/
    for (const seed of ['prose-1', 'prose-2', 'prose-3']) {
      const state = newGame(index, { seed })
      // Grind the team down so the spent-function sentence is reachable.
      for (const fn of Object.values(state.team.functions)) fn.morale = 0.1
      runDays(state, index, 364)
      const review = buildAnnualReview(state, index)
      const prose = [
        review.headline,
        review.performanceBand,
        ...review.narrative,
        ...review.blindSpots,
        ...review.dimensions.flatMap((d) => [d.label, d.narrative, ...d.evidence]),
        ...(review.reasoning ?? []).map((line) => line.verdict),
      ]
      for (const line of prose) {
        expect(rawIds.test(line), `annual review says: ${line}`).toBe(false)
      }
    }
  })

  it('makes its verbs agree with what it is counting', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'agreement' })
    runDays(state, index, 364)
    // "1 business objective were missed" reached the closing screen. Counted
    // prose is generated, so the singular case has to be written, not derived.
    const objectives = Object.values(state.business.objectives)
    for (const [failed, expected] of [[1, /One business objective was missed/], [2, /2 business objectives were missed/]] as const) {
      objectives.forEach((objective, i) => {
        objective.status = i < failed ? 'failed' : 'achieved'
      })
      const line = buildAnnualReview(state, index).dimensions.find((d) => d.id === 'business-enablement')!.narrative
      expect(line, `with ${failed} missed it says: ${line}`).toMatch(expected)
    }
  })
})

describe('pattern suggestions', () => {
  it('offers a pattern when the evidence for it arrives, and not forever', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'pattern-1' })
    let everOffered = false
    let daysWithOffer = 0

    for (let day = 0; day < 364; day += 1) {
      const suggestions = patternSuggestions(state, index)
      if (suggestions.length > 0) {
        everOffered = true
        daysWithOffer += 1
        for (const suggestion of suggestions) {
          // Everything it shows has to be real and already in the player's hands.
          expect(index.hypothesisTemplate.get(suggestion.templateId)).toBeDefined()
          expect(suggestion.evidence.length).toBeGreaterThanOrEqual(2)
          for (const item of suggestion.evidence) {
            expect(state.evidence.items[item.id], `${item.id} was suggested but never received`).toBeDefined()
            // A red herring is not grounds for alarm. The printer alerts are
            // marked benign in the content's own words, and citing them under
            // "what suggests it" asks the player to reason from something the
            // game already knows to be nothing.
            // Nor is somebody's reassurance. A "contradicts-x" tag says what a
            // piece argues against, and naming it in each template's own
            // contradictingTags closed one case and left the rest: only 2 of 14
            // templates list any. The rule is structural now, so this holds for
            // every template without the author repeating it.
            const tags = index.evidence.get(item.id)?.tags ?? []
            const template = index.hypothesisTemplate.get(suggestion.templateId)!
            for (const tag of tags) {
              if (!tag.startsWith('contradicts-')) continue
              expect(
                template.supportingTags,
                `${item.id} argues against ${tag.slice('contradicts-'.length)}, which ${suggestion.templateId} rests on`,
              ).not.toContain(tag.slice('contradicts-'.length))
            }
            expect(
              index.evidence.get(item.id)?.noise,
              `${item.id} is noise but was cited as support for ${suggestion.templateId}`,
            ).not.toBe(true)
          }
        }
      }
      runDays(state, index, 1)
    }

    expect(everOffered, 'a whole year produced no pattern at all').toBe(true)
    // Offered at a moment rather than standing open all year: the failure this
    // guards is a permanent backlog dressed up as an insight.
    expect(daysWithOffer).toBeLessThan(300)
  })

  it('keeps a dismissed pattern dismissed', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'pattern-2' })
    for (let day = 0; day < 364; day += 1) {
      const suggestion = patternSuggestions(state, index)[0]
      if (suggestion) {
        const result = applyAction(state, index, { type: 'dismissPattern', templateId: suggestion.templateId })
        expect(result.ok).toBe(true)
        expect(patternSuggestions(state, index).some((s) => s.templateId === suggestion.templateId)).toBe(false)
        runDays(state, index, 30)
        expect(
          patternSuggestions(state, index).some((s) => s.templateId === suggestion.templateId),
          'a dismissed pattern came back',
        ).toBe(false)
        return
      }
      runDays(state, index, 1)
    }
    throw new Error('no pattern was offered within a year')
  })
})

describe('the date in the header', () => {
  it('never shows a day that does not exist', () => {
    const lengths: Record<string, number> = {
      January: 31, February: 28, March: 31, April: 30, May: 31, June: 30,
      July: 31, August: 31, September: 30, October: 31, November: 30, December: 31,
    }
    // Every day a campaign can reach. The old formatter used a uniform 30.33-day
    // month and printed "30 February"; only a screenshot caught it.
    for (let day = 0; day < 365; day += 1) {
      const { label, month } = formatGameDate(day)
      const dayOfMonth = Number(label.split(' ')[0])
      expect(Number.isFinite(dayOfMonth), label).toBe(true)
      expect(dayOfMonth, label).toBeGreaterThanOrEqual(1)
      expect(dayOfMonth, `${label} does not exist`).toBeLessThanOrEqual(lengths[month]!)
    }
  })

  it('advances one day at a time and never goes backwards', () => {
    let previous = ''
    for (let day = 0; day < 365; day += 1) {
      const label = formatGameDate(day).label
      expect(label).not.toBe(previous)
      previous = label
    }
    expect(formatGameDate(0).label).toBe('1 January')
    expect(formatGameDate(31).label).toBe('1 February')
    expect(formatGameDate(59).label).toBe('1 March')
  })

  it('ends the year in week 52, not on a week 53 of one day', () => {
    expect(formatGameDate(357).weekLabel).toBe('Week 52')
    expect(formatGameDate(364).label).toBe('31 December')
    expect(formatGameDate(364).weekLabel).toBe('Week 52')
  })
})

describe('team sustainability', () => {
  it('cannot read well while a function is spent', () => {
    const index = testIndex()
    // A team is as sustainable as the part of it closest to walking out. The
    // defect this guards: a flat average across functions let one sit at zero
    // while the others carried the score, and the review told the player their
    // team could do it all again next year.
    for (let seed = 0; seed < 8; seed += 1) {
      const state = newGame(index, { seed: `sustain-${seed}` })
      const commissioned: Record<string, number> = {}
      for (let day = 0; day < 364; day += 1) {
        if (day % 5 === 0) {
          const order = [...index.content.investigations].sort(
            (a, b) => (commissioned[a.id] ?? 0) - (commissioned[b.id] ?? 0),
          )
          for (const investigation of order) {
            const result = applyAction(state, index, {
              type: 'startInvestigation',
              investigationId: investigation.id,
              leaderId: index.content.leaders[day % index.content.leaders.length]!.id,
            })
            if (result.ok) {
              commissioned[investigation.id] = (commissioned[investigation.id] ?? 0) + 1
              break
            }
          }
        }
        runDays(state, index, 1)
      }

      const worst = Math.min(...Object.values(state.team.functions).map((fn) => fn.morale))
      const dimension = buildAnnualReview(state, index).dimensions.find((d) => d.id === 'team-sustainability')!
      if (worst < 0.25) {
        expect(
          ['weak', 'developing'],
          `a function at ${worst.toFixed(2)} morale still read ${dimension.band}`,
        ).toContain(dimension.band)
        expect(dimension.narrative).toMatch(/spent/)
        return
      }
    }
    throw new Error('no campaign burned a function out, so the cap was never exercised')
  })
})

describe('incident words agree with the phase', () => {
  it('never says "not yet recovering" once the phase is recovery', () => {
    // Day 183 of a hand-played year: "Recovery, Contained, Not yet recovering"
    // on one line, over a timeline entry saying restoration had begun.
    const index = testIndex()
    let seen = 0
    for (const seed of ['phase-1', 'phase-2', 'phase-3', 'phase-4', 'phase-5', 'phase-6']) {
      const state = newGame(index, { seed, difficulty: 'high-pressure' })
      for (let day = 0; day < 364; day += 1) {
        runDays(state, index, 1)
        const view = incidentCommand(state, index)
        if (!view || view.phase !== 'recovery') continue
        seen += 1
        expect(view.recoveryLabel, `day ${state.currentDay} of ${seed}`).not.toBe('Not yet recovering')
      }
    }
    expect(seen, 'no campaign reached a recovery phase, so nothing was checked').toBeGreaterThan(0)
  })
})

describe('what a pattern cites', () => {
  it('never cites evidence that argues against the proposition', () => {
    const index = testIndex()
    for (const seed of ['cite-1', 'cite-2']) {
      const state = newGame(index, { seed })
      for (let day = 0; day < 364; day += 1) {
        for (const suggestion of patternSuggestions(state, index)) {
          const template = index.hypothesisTemplate.get(suggestion.templateId)!
          for (const item of suggestion.evidence) {
            const evidence = index.evidence.get(item.id)!
            // Evidence can be tagged both ways: about the subject, and against
            // the claim. Citing such a piece as grounds reads as nonsense.
            const contradicts = evidence.tags.some((tag) => template.contradictingTags.includes(tag))
            expect(contradicts, `${item.id} argues against ${template.id} and was cited as suggesting it`).toBe(false)
          }
        }
        runDays(state, index, 1)
      }
    }
  })

  it('cites something that is actually about the proposition, and leads with it', () => {
    // A shared tag is a passing mention. "Backup shares administrative
    // credentials" is tagged `privileged`, which supports five templates, so
    // it was cited for the deployment pipeline. An offer has to rest on at
    // least one piece that carries two of the proposition's tags or the tag it
    // is about, and the list leads with the best fit rather than the newest.
    const index = testIndex()
    const fit = (evidenceId: string, templateId: string): number => {
      const evidence = index.evidence.get(evidenceId)!
      const template = index.hypothesisTemplate.get(templateId)!
      const shared = evidence.tags.filter((tag) => template.supportingTags.includes(tag)).length
      return shared + (evidence.tags.some((tag) => template.requiresTags.includes(tag)) ? 1 : 0)
    }
    let offers = 0
    for (const seed of ['cite-3', 'cite-4']) {
      const state = newGame(index, { seed })
      for (let day = 0; day < 364; day += 1) {
        for (const suggestion of patternSuggestions(state, index)) {
          offers += 1
          const fits = suggestion.evidence.map((item) => fit(item.id, suggestion.templateId))
          expect(Math.max(...fits), `${suggestion.templateId} was offered on ${suggestion.evidence.map((e) => e.id).join(', ')}, none of which is about it`).toBeGreaterThanOrEqual(2)
          for (let i = 1; i < fits.length; i += 1) {
            expect(fits[i]!, `${suggestion.templateId} lists a weaker fit before a stronger one`).toBeLessThanOrEqual(fits[i - 1]!)
          }
        }
        runDays(state, index, 1)
      }
    }
    expect(offers, 'two idle years produced no offer to check').toBeGreaterThan(0)
  })
})

describe('what you never looked at', () => {
  it('does not name the same thing twice under contradictory descriptions', () => {
    const index = testIndex()
    const state = newGame(index, { seed: 'spots-1' })
    runDays(state, index, 364)
    const review = buildAnnualReview(state, index)

    // "Never brought into view" and "taken on trust and never examined" are
    // mutually exclusive: you cannot take on trust what you never saw.
    const subjects = new Map<string, string[]>()
    for (const spot of review.blindSpots) {
      for (const def of index.content.nodes) {
        if (!spot.startsWith(def.name)) continue
        subjects.set(def.name, [...(subjects.get(def.name) ?? []), spot])
      }
    }
    for (const [name, lines] of subjects) {
      expect(lines.length, `${name} is named ${lines.length} times:\n${lines.join('\n')}`).toBe(1)
    }
    // And the list stays readable rather than running to thirty lines.
    expect(review.blindSpots.length).toBeLessThanOrEqual(12)
  })
})

describe('a dimension and its explanation', () => {
  it('never scores a player well and then tells them they did badly', () => {
    // Found by playing: "STRONG — 3 decisions lapsed and the organisation chose
    // for you", and "STRONG — the board listened, but never quite came to
    // depend on you". The band and the sentence were computed from separate
    // thresholds, and the player reads the sentence.
    const index = testIndex()
    const failureWords = /lapsed and the organisation chose|never quite came to depend|unsure whether they were hearing|goodwill that has now run out|spent the year acting on an inherited picture|never verified/
    for (let seed = 0; seed < 6; seed += 1) {
      const state = newGame(index, { seed: `voice-${seed}` })
      runDays(state, index, 364)
      for (const dimension of buildAnnualReview(state, index).dimensions) {
        if (dimension.band !== 'strong' && dimension.band !== 'solid') continue
        expect(
          failureWords.test(dimension.narrative),
          `${dimension.label} reads ${dimension.band} but says: ${dimension.narrative}`,
        ).toBe(false)
      }
    }
  })
})
