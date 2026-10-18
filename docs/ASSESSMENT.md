# Annual assessment

The owner authorised these assessment changes on 18 October 2026. They change
newly generated reviews, not simulation effects, difficulty, RNG or stored
reviews. Business outcomes and incident consequences remain separately visible
from management assessments; a damaging incident alone does not force an overall
failure rating.

Eight dimensions retain equal weights. Their bands map internally to weak 0.20,
developing 0.45, solid 0.68 and strong 0.88. Average thresholds remain strictly
above 0.78 for Exceptional, 0.60 for Credible and 0.42 for Mixed, otherwise
Difficult. Minimum standards can lower that result, never raise it:

- Three or more Weak dimensions: at most Difficult.
- Weak prioritisation or team sustainability: at most Mixed.
- Any other Weak dimension: at most Credible.
- Without tested recovery capability: at most Credible. A completed recovery/IR
  exercise, a recorded production/test-tenancy restore, or closed incidents with
  at least Solid resilience qualifies. An incident still running does not qualify
  through the incident route. A quiet exercised year can qualify.

An applied ceiling is explained in the narrative. The headline continues to
identify trade-offs independently of the overall band.

Programme execution first reads delivery as before: completed programmes count
fully and other started programmes receive 0.4 credit. Strong additionally
requires programme relevance of at least 0.5. For each available programme,
relevance reads the largest opening materiality among its authored treatment
links. Portfolio relevance normalises the mean of those values between the
least and most material available programme choices. Below the midpoint, otherwise
Strong delivery becomes Solid. It does not become Weak for choosing smaller work.
One programme addressing the most material risk can still earn Strong.

Only this year's work counts, including unfinished carry-over programmes but
excluding programmes completed in earlier years. Equally material choices are
neutral; work without authored treatment links is unscored for relevance. A
missing opening snapshot uses current residuals with a stated limitation: risk
reduction may make successful older work look less material.

## Calibration

Run `pnpm tsx scripts/tune.ts 10 <mode>` for guided, ciso and high-pressure.
The harness compares the prior equal-weight, delivery-only assessment against
the revised assessment on the same end states. Six scripted policies use ten
seeds each: passive (answers prompts only), defensive, business, balanced,
relevant (highest-materiality programme) and minor (lowest-materiality programme).
These labels describe scripts, not a ranking of human play styles.

Measured on 18 October 2026: 180 complete campaigns, zero invariant violations.
Exceptional remained reachable in seven campaigns (six guided, one CISO).
All 25 completed minor-policy programmes had their Strong delivery limited to
Solid; none of the relevant-policy portfolios were limited by relevance. The overall ceilings expose weaknesses that an average could previously hide.
This is a regression/calibration sample, not evidence that the game is balanced
for human players. Ten seeds per policy cannot establish small differences.

| Mode (60 campaigns each) | Prior overall ratings | Revised overall ratings | Programme relevance caps |
|---|---|---|---|
| guided | Difficult: 10, Credible: 42, Mixed: 2, Exceptional: 6 | Difficult: 10, Credible: 19, Mixed: 25, Exceptional: 6 | 9 |
| ciso | Difficult: 10, Credible: 45, Exceptional: 1, Mixed: 4 | Difficult: 10, Credible: 20, Mixed: 29, Exceptional: 1 | 9 |
| high-pressure | Difficult: 10, Credible: 43, Mixed: 7 | Difficult: 10, Mixed: 45, Credible: 5 | 7 |
