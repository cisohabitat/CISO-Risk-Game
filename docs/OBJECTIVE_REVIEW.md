# Business objective responsiveness — 30 October 2026

The CISO closing retest asked whether business results respond to choices. The
reported campaign has no identified seed/build. These probes test the current
engine; they do not reconstruct that session or establish perceived fairness.

## Method

Run `pnpm --silent audit:objectives 12`. The harness asserts the `sit-after-breach`
opening exists and that each full campaign actually opens it.

The component arm uses the actual platform-launch decision on day 22 and ticks
only objectives thereafter. It compares support as planned, conditions and
opposition. The investment fixture holds Identity and Recovery active for their
nominal authored durations to isolate programme friction; it does not simulate
their staffing, blockers or actual completion. Later events and incidents are
excluded from this arm.

The full arm uses 12 matched seeds × three choices × three modes: 108 campaign-
years. It attempts fully funded Identity and Recovery from day one, takes the
first available zero-cost option on other decisions, clears affordable blockers
above a £300k reserve and prepares material board papers. It does not commission
extra enquiries or optimise its choices. Downstream event/incident paths and
option availability can diverge: this is a declared policy comparison, not an
isolated single-effect experiment or a ranking of good play.

## Recorded results

Component results for the platform, whose commitment is 25 June:

| Investment fixture | Support as planned | Support with conditions | Oppose |
|---|---|---|---|
| No live programmes | Achieved 4 May (day 123) | Achieved 4 June (154) | Achieved 12 June (162) |
| Two nominal-duration programmes | Achieved 21 May (140) | Achieved 25 June (175) | Missed 26 June (176) |

Full campaign results, 12 years per cell:

| Mode | Launch choice | Mean objectives achieved / 5 | Platform achieved / 12 |
|---|---|---:|---:|
| Guided | Support as planned | 4.75 | 12 |
| Guided | Conditions | 3.83 | 2 |
| Guided | Oppose | 3.75 | 0 |
| CISO | Support as planned | 5.00 | 12 |
| CISO | Conditions | 4.92 | 11 |
| CISO | Oppose | 4.92 | 11 |
| High pressure | Support as planned | 5.00 | 12 |
| High pressure | Conditions | 4.83 | 10 |
| High pressure | Oppose | 4.58 | 7 |

All 108 chosen launch options were recorded, with no defaulted decisions and zero
invariant violations. The results show choice responsiveness, not that any one
option is universally better: security exposures, incidents, trust, team health
and programme relevance are outside this objective count. The small fixed set
and policy differences do not establish mode fairness or a causal explanation
for the owner's reported run.

## Findings and changes

- Positive objective progress also marks security support, increasing delivery
  rate. Recorded delays reduce existing progress; disruption, live programme
  friction and operational tolerance affect the daily rate. Outcomes are not a
  flat draw independent of choices.
- The existing progress-penalty model clamps at zero. An early delay can be
  absorbed by available schedule float, so a recorded 45-day penalty is not
  necessarily a 45-day actual completion slip. Keep that limitation explicit;
  the option now describes a commitment at risk rather than guaranteeing a miss.
  No new delivery-debt mechanic or balance adjustment is introduced.
- The collision view added `delayDays` to the displayed target even though the
  reducer explicitly leaves the commitment fixed. It now compares programme
  cover against the actual commitment; recorded delay is labelled separately.
  Annual delay labels no longer read as observed completion dates.
- Rating weights, business rates, friction and stored annual judgements remain
  unchanged. These findings do not close independent human-learning or fairness
  gates.


## Subsequent five-run retest

The [five-run review](FIVE_RUN_REVIEW.md) records a later rerun after fixed
post-deadline expiry and workload/priority fixes. Keep the earlier table above as
its dated measurement, not a claim it reproduces the new engine byte for byte.
The component cases are unchanged; the current High-pressure/Oppose full-policy
cell has 8/12 platform achievements and mean 4.667 objectives. Other cells match
to rounding. This does not isolate the effect of the deadline fix.
