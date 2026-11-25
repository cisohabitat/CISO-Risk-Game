# The design list of 25 November 2026

Eleven rounds of AI playtests kept reporting the same handful of design
issues. On 25 November the owner read the list and asked for it to be fixed
("fix design issues"). H is writing work, not mechanics, and is not done
here.

| | Issue | Change |
|---|---|---|
| A | Skip ahead jumps 30 to 69 days and passes SOC warnings | A SOC warning and an incident closing each stop Skip ahead and name themselves (`soc-warning`, `incident-closed`). There is still no jump cap (owner, 17 November). |
| B | SOC warnings are mail only, then the review asks why nobody hunted | Recent warnings sit on the Briefing (`SocWarnings`, `openSocWarnings`) until a targeted hunt answers them, with "Commission a hunt" and "Read the warning". |
| C | 1 of 5 objectives rated Mixed while 4 of 5 rated Difficult | One objective in five or fewer caps the verdict at Difficult. Two of five was tried first and was too harsh (below). |
| D | Resilience strong after a year that built and tested nothing | Above developing needs a recovery test, a restore or a finished programme. The narrative says why when it holds a year down. |
| E | The post-incident £400k was free, repeatable and raised confidence | Once a year (`post-funding.taken`), −0.03 board confidence, and the board asks what it bought. |
| F | CISO years with no incident, High years whose first came in November | `incidentFloorDay` (CISO 182, High 150, Guided none). With no incident by then, the live campaign furthest along breaks through; with none live, a route is drawn. The day is spread over the two months before by a hash of the seed, so the seeded stream is untouched. |
| G | A priced blocker the budget cannot pay holds a programme forever | "Work around it": free, and the programme finishes without its last milestone's controls (`descoped`). |
| H | Board replies and headlines feel templated | Writing work; not done. |
| I | Objective delays show no cause | Each delay records its cause (`delayLog`), and the card lists them. |

## Measured

**Skip ahead.** 20 years a mode, first option every time, Skip only.

| Mode | Stops a year | Jumps of 30 days or more a year |
|---|---|---|
| Guided | 27.7 → 29.3 | 3.1 → 2.8 |
| CISO | 31.4 → 35.1 | 2.5 → 1.9 |
| High pressure | 33.5 → 37.3 | 2.3 → 2.0 |

The longest jump is still 69 days, into an empty fourth quarter.

**Incident floor.** 60 years a mode, first option.

| Mode | Years with no incident | Incidents a year | Median first incident (day) |
|---|---|---|---|
| CISO | 13 → 0 | 1.28 → 1.80 | 220 → 147 |
| High pressure | 7 → 0 | 1.98 → 2.18 | 149 → 108 |

Guided is unchanged. A fixed floor day put the first incident on the floor
day in most years; spreading it fixed that.

**A competent player.** 25 years a mode. The player:
- takes the launch conditions and the Kestrel quarantine;
- starts identity on day 20;
- runs a recovery test;
- files and briefs every paper.

| Mode | Objectives | Verdicts |
|---|---|---|
| Guided | 4.8 → 4.8 | 24 Credible, 1 Mixed (unchanged) |
| CISO | 3.1 → 2.6 | 12 Credible / 13 Mixed → 10 / 9 Mixed / 6 Difficult |
| High pressure | 3.6 → 2.9 | 13 / 11 / 1 Difficult → 11 / 7 / 7 Difficult |

With C at two of five, CISO had 13 Difficult years; at one of five, 6. Each
of those six met 0 or 1 objective after a severe incident (ransomware at
0.68 to 0.73, or three incidents). Two had their incident from the floor.

**Harnesses.**
- `pnpm ladder sweep 15`: incidents 0.73 / 1.33 / 2.00 (were 0.73 / 0.87 /
  1.20). Objectives missed 0.93 / 1.87 / 1.93 (were 0.93 / 1.47 / 1.27).
- `pnpm tsx scripts/tune.ts 25` (CISO, before → after):

  | Policy | Clean years | Incidents | Objectives |
  |---|---|---|---|
  | Passive | 8% → 0% | 1.60 → 1.76 | 3.3 → 2.7 |
  | Defensive | 20% → 0% | 1.60 → 2.16 | 3.3 → 3.1 |
  | Business-first | 20% → 0% | 1.24 → 1.64 | 3.0 → 2.6 |

- Soak: 300 years and 80 two-year campaigns, with no crashes and no
  invariant failures.
- Coverage: 94% of events and 100% of decisions.
- The facilitator table was re-picked. No CISO year is quiet now, so its two
  quiet rows are Guided seeds.

Whether a CISO year should always be tested, and at this weight, is the
question to put to people.

## The second list, the same day: J to Q, and H

The owner asked for these to be done in the recommended order.

| | Issue | Change |
|---|---|---|
| J | Engaged Guided years with no incident and 4 of 5 objectives rated Difficult on three weak dimensions | `quietYearFloor: 'Mixed'` on Guided: such a year is not rated below Mixed. |
| L | "38 of 38 systems known" read as the player's work | The line says how many were examined by the player's own enquiries; the rest were named in correspondence or inherited. |
| O | A held check took progress from 90% to 74% | A delay pauses delivery for its days (`delayOwedDays`); progress never goes back. The card says how long it is paused. |
| K | The fourth quarter was empty, and Skip ran 69 days to 31 December | Two December decisions: the peak-trading change freeze (1 December) and cover over Christmas (11 December). |
| N | The card-data decision could come after the Nordic check | If the merchant's question has not come by 2 August, it comes then, with the evidence. |
| P | The warehouse acceptance renewed three times a year; the overload decision repeated word for word | Acceptances renewed through a decision run six months (`ACCEPTANCE_RENEWAL_DAYS`). The overload decision says how many times it has been asked and what was answered last time. |
| Q | Two incidents of one kind read as a duplicate | The second is named "(second this year)". |
| H | Board replies and headlines templated | An empty paper a second and third time draws a different reply, at a small cost. A full paper, a paper after an empty one, and an optional-only paper open differently. "The business got its year" is not used with two objectives missed; three or more incidents that held have their own headline. |

### Measured

- **Card-data decision after the Nordic check.** 60 CISO years: 14 before,
  0 after.
- **December decisions.** Both open in 60 of 60 years.
- **Skip ahead, 20 CISO years.**

  | | Before | After |
  |---|---|---|
  | Longest jump (days) | 69 | 39 |
  | Jumps of 30 days or more, a year | 1.9 | 1.6 |
  | Stops a year | 35.1 | 37.6 |

- **The competent player.** Over 25 years a mode, objectives are 4.8 / 2.6 /
  3.1 (Guided / CISO / High pressure).

  | Mode | Credible | Mixed | Difficult |
  |---|---|---|---|
  | Guided | 24 | 1 | 0 |
  | CISO | 8 | 9 | 8 |
  | High pressure | 11 | 8 | 6 |

  CISO's Difficult years rose from 6 to 8. A delay pausing for its stated 45
  days is a little harsher than the progress it used to take, which cost
  about 40. On "objective-component", supporting the launch without
  conditions now misses its date by a day rather than meeting it with three
  to spare.
- **Ladder.** Incidents 0.67 / 1.47 / 1.93, objectives missed 0.80 / 1.87 /
  1.67.
- **Soak.** Clean: 300 years and 80 two-year campaigns.
- **Coverage.** 94% of events and 100% of decisions.
- **Facilitator table.** Re-picked again. `class-10` is now the two-routes
  row.

