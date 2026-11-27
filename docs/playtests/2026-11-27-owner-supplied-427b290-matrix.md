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
