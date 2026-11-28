# Owner-supplied 15-run matrix on 427b290 (pass 13) — 27 November 2026

Fifteen fresh-seed campaigns on `427b290` (0.1.0-rc.5): 3 difficulties × 4
situations, Surprise me on CISO and High pressure, and a replay of run 07.
Who played is not supplied. Notes and screenshots are on the owner's computer
and were not available to this session.

Confirmed by the report:
- 0 lapses; every review rendered first time.
- The replay matched in game state through week 52, and all 133 logged
  actions were accepted.
- Accelerate confirms and happens once.
- The SOC card disables a hunt that cannot be bought, with the reason.
- The review names unspent money and emergency debt.
- The £400k comes once a year, costs confidence and pays down debt.
- Experts met 23 of 25 objectives.

## What was checked and done (27 November)

Fixed:
- **MJ-29: every debrief in three runs blamed the warehouse acceptance, for
  attacks through Corvus, the build pipeline and Kestrel.**
  - The acceptance leaves segmentation weak, and segmentation is a control
    on most routes. `priorRouteChoices` matched on controls alone.
  - A decision about named systems (`relatedNodeIds`) is now cited only when
    the attack path goes through one of them.
  - The two on-route choices the report found uncited now declare the gap
    they leave: "Leave access in place, monitor it closely" (supplier access)
    and "Connect on schedule" (segmentation).
- **MJ-30: "an assumption you recorded no longer holds" about assumptions
  the player never saw.**
  - Some options record an assumption when chosen. The decision card now
    says so, and names it.
  - The stop names the decision it came from and the assumption itself.
  - "Leave access in place" recorded "the provider holds no standing
    privileged access" while its own text said it does. It now records that
    monitoring is enough to see an intrusion. The supplier assumption reads
    "The provider's standing accounts do not reach into the identity
    platform", which is what its check tests.
  - Accepting the warehouse risk says it puts the risk on the register
    (CS-11).
- **MJ-27: block fixes spent up to £150k on one click.** They now confirm,
  as Accelerate does: "Spend £150k: …, leaving £270k" or "Not yet".
- **MN-48: "Go-live review: platform held" over a card saying "not
  cleared".** The letters for the go-live and data protection checks now say
  "not cleared" and "paused".
- **MN-49: "Expect a result around 34 December".** A piece of work due after
  31 December says it will report after the year ends. The SOC card warns
  before a late hunt, and says when a hunt is already running rather than
  "no spare capacity" (MJ-25 residue).
- **MJ-10, in part: "Tested, and it did not hold" over Credible 5/5 years,
  and "It held" over ransomware.**
  - A year hit hard (an outage-class incident at material consequence, or
    any incident at 0.5 or more) whose Resilience is solid or better reads
    "It was hit hard, and it recovered."
  - "Did not hold" needs a material incident (0.3 or more).
- **CS-26:** the Briefing counts an open SOC warning, so it no longer says
  "Nothing is waiting on you today" above the card.
- **CS-28:** the review drops a repeated sentence. The run's exact sentence
  was not reproduced.

Checked, not defects, or owner calls:
- **MJ-01:** at most two reflections a year (owner, 19 November).
- **MJ-02:** no jump cap (owner, 17 November).
- **MJ-04, MJ-05, MJ-06, MJ-15:** what counts as seen. The review reads
  hidden truth at the close by design, and "38 of 38" already splits what
  the player examined since 25 November (L).
- **MJ-07, MN-45:** how candour and "in hand" are scored is design.
- **MJ-08, MJ-24, MJ-28:** further verdict and dimension gates (vacancies,
  ransom paid, a repeat route) change calibration. Owner's call.
- **MJ-09, MJ-12, MJ-21, MJ-23, MJ-26:** writing, the £400k's size, mode
  separation, priced-out options, overload relief. Design.
- **MN-50:** raising from the register is free, while raising a hypothesis
  costs attention; and a raised risk is not one the board has heard about.
  The second is intended: raising and telling the board are different acts.
  The cost difference is the owner's call.
- **MN-01:** the £90k and £60k credits are authored events.

## Measured

The fixes change words and attribution, not the simulation.
- `pnpm ladder sweep 15`: incidents 0.67 / 1.47 / 2.20, objectives missed
  0.67 / 1.53 / 1.33. The misses match rc.5.
- Soak: 300 years and 60 two-year campaigns, 0 crashes, 0 invariant
  failures.
- Coverage: 94% of events, 100% of decisions.

Tests: `tests/engine/pass13-fixes.test.ts`.

## Fix all (28 November)

The owner then asked for the design items above to be fixed too.

| Issue | Change |
|---|---|
| MJ-01 | Every closed incident schedules its reflection for the next day; no yearly cap. One that closes too late is named in the review. |
| MJ-02, MN-33 | Skip ahead stops on an objective met or missed (both now have a letter), a programme finished, and after 21 days of nothing (`SKIP_LIMIT_DAYS`). |
| MJ-04 | A threat letter about a system a live campaign's route crosses becomes that campaign's SOC warning: a card, a stop and the debrief's link. |
| MJ-05 | The systems line leads with what the player examined; the rest is "named in correspondence or inherited and taken on trust". |
| MJ-06 | A risk that never surfaced is "found at the year end, not before", not "nothing you did went near it". |
| MJ-15 | A follow-up letter left unopened is said to be one. |
| MJ-07 | A failed "in hand" is said even when the board also heard elsewhere, and caps communication at developing. A programme presented to audit as on track, which audit then found was not, counts as kept quiet. |
| MN-45 | Notifying the regulator and restating the figure no longer cost board confidence. |
| MJ-08 | Two or more empty papers cap communication at developing. Two objectives held at their checks cap business enablement at developing. A rested team with four or more posts empty, in a year that left three quarters of its budget unspent, is developing. |
| MJ-24 | A ransom paid, a second incident through the same route, or debt over a tenth of the allocation caps the verdict at Mixed. A worked-around programme counts 0.75 towards execution; one short of people at the close caps it at solid. |
| MJ-28 | Resilience caps at developing after an outage-class incident (ransomware, a destructive attack) at material consequence, or a repeat route. |
| MJ-12 | The post-incident money is £400k × size (0.5 to 1.25 by consequence) × time left (a quarter to all of it), and the option says how much pays down unbudgeted spend. |
| MJ-23 | The two decisions with no free alternative to their default now have one: grade the SOC's escalations yourself (2 attention, half an analyst for four months), and swap the cloud half of the test for the legacy estate. |
| MJ-26 | The overload decision offers "Let routine work wait for two months": free, stops nothing, and patching and log review drift. |
| MJ-21 | "After the breach" sets an incident floor near day 240 in every mode. The ladder already separates the modes (0.60 / 1.40 / 2.13 incidents). |
| MN-50 | Raising a named concern from the register costs 1 attention; working a hypothesis up still costs 2. |
| MN-01 | The two refund letters are notable, and say when finance set the money against unbudgeted spend. |
| MJ-09 | A paper that recommends nothing, recommends what the budget cannot pay for, or says nothing of what is unknown on a thin picture, is told so. |
| MJ-16, MN-27 | The cloud slip names its cause; the objective card names the decision that moved it on. |

### Measured

- **A competent player** (launch conditions, Kestrel quarantine, identity on
  day 20, a recovery test, every paper filed and briefed), 25 years a mode,
  before and after:

  | Mode | Objectives | Credible / Mixed / Difficult |
  |---|---|---|
  | Guided | 4.72 → 4.72 | 24 / 1 / 0 → 25 / 0 / 0 |
  | CISO | 3.08 → 3.28 | 4 / 17 / 4 → 6 / 16 / 3 |
  | High pressure | 3.56 → 3.44 | 9 / 13 / 3 → 8 / 15 / 2 |

  The first version of the vacancy cap made Team developing for every
  player who did not hire; it now applies only to a year that left three
  quarters of its budget unspent. A single empty paper capping
  communication cost Guided quiet years their Credible; it takes two now.
- **`pnpm tsx scripts/tune.ts 25`** (CISO, revised ratings, before → after):
  - defensive 19 / 5 / 1 → 13 / 12 / 0, most of it debt over a tenth of the
    allocation (the gate was first set at 5% and caught 11 of its 15 Mixed
    years);
  - relevant 6 / 12 / 7 → 16 / 7 / 2, because the reflections move the
    seeded draws (objectives 2.0 → 3.1);
  - passive, business, balanced and minor within a few years of before.
- **Ladder**: incidents 0.60 / 1.40 / 2.13, objectives missed 0.67 / 1.60 /
  1.53.
- **Soak**: 300 years and 60 two-year campaigns, 0 crashes, 0 invariant
  failures. **Coverage**: 94% of events, 100% of decisions.
- **Seeds re-picked**: the facilitator's class-26 (ransomware three times)
  became class-62 (twice), and three of its engaged-column rows were
  corrected; `messages-honest` uses overtaken-4 and overtaken-6.

Tests: `tests/engine/design-nov28.test.ts`.
