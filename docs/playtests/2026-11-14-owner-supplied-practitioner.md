# Owner-supplied practitioner account — 14 November 2026

One supplied account from a security practitioner. Build, seed, mode and
recording are not supplied; the notes and screenshots are on the owner's
computer (`/workspace/ciso-playtest-expert/`) and were not available to the
session that recorded this. It is one person's reading, and per
`docs/PLAYTEST.md` not a reason on its own to change a system.

## Supplied account

> To a practitioner, a lot rang true. Highlights were the confidence levels on
> evidence and the difference between a backup read test and a real
> production restore. Supplier access terms written into contracts also
> landed, along with incident command, early regulatory notification,
> sanctions checks before any ransom decision, and honest board reporting.
>
> These are the parts that felt too simple:
> - "The exploit arrived before the change window" offers only patch or watch.
>   It has no step for checking reachability, testing the patch, planning a
>   rollback or rolling out in stages.
> - "Card data outside the payment environment" never says whether the data is
>   card numbers or sensitive authentication data. That decides the PCI scope
>   and the right response.
> - The August incident doesn't say whether MFA was missing, bypassed or simply
>   ineffective when the attacker got in.
> - The ransomware review explains the cause in far less detail than the data
>   exposure review does.
>
> The top fixes for credibility with security professionals:
> - Show real coverage of assets, dependencies, service accounts, suppliers and
>   telemetry, and when each control was last tested.
> - Make technical options more operational: patch rollback, PCI data types,
>   and recovery time and recovery point targets.
> - Give incidents a clearer progression of evidence and cause, and separate
>   data theft from encryption.
> - Make budget and capacity trade-offs transparent, with contingency money and
>   smaller staged options.
> - Track governance through risk owners, deadlines and measured control
>   effectiveness, not just programme completion percentages.
>
> The two bugs were small. Board submission messages appear twice in the
> inbox, and the review says the ransomware incident was "still running" even
> though services were already restored. The pacing was the same as in the
> newbie runs: quiet stretches in the second half, then four December
> decisions due within two days.

## What was checked and done

- **"Still running" beside restored services: fixed.** The review counted any
  incident not yet closed as running. Restored services wait a day in the
  debrief phase before an incident closes, and the response panel already
  calls recovery of 0.95 "Recovered", so a year ending in either window said
  "still running". Running now means the business is still affected, with the
  threshold shared with the panel (`src/game/incidents/thresholds.ts`);
  `tests/engine/incident-still-running.test.ts` fails without the fix.
- **Board submission messages twice: not reproduced.** Submitting the Q1 paper
  through the interface (prepared `board` save, desktop Chromium) gives one
  committee reply, listed once under All and once under Updates, and one place
  in the code sends it. The screenshot is needed to find the path the
  practitioner took.
- **Four December decisions within two days: measured, not changed.** They are
  a ransomware incident's four response decisions (incident command, cutting
  the actor off, external support, the ransom), which open together with
  two-day deadlines wherever in the year the incident lands. Over 40 CISO
  seeds, answering each at its deadline, 8 years had three or more decisions
  due within three days after day 300, every one of them an incident's
  response set. Staggering them (command and isolation first, the ransom once
  encryption is confirmed) would also answer "a clearer progression of
  evidence and cause", but it changes incident mechanics and is the owner's
  call.

## For the owner

The highlights confirm the parts the plan bet on: confidence on evidence,
recovery proven rather than asserted, contractual supplier terms, incident
command and honest reporting. The credibility list splits in two:

- **Authored text, within the freeze:** stating what the card data is (full
  card numbers or sensitive authentication data), and naming whether MFA was
  missing, bypassed or ineffective in an incident's reconstruction where the
  simulation knows.
- **New mechanics, needing the owner:** extra exploit-response steps
  (reachability, patch testing, rollback, staged rollout), recovery time and
  point targets, a coverage view across assets, service accounts, suppliers
  and telemetry, contingency budget and staged programme options, separating
  data theft from encryption in one incident, and governance tracked through
  owners and measured effectiveness rather than completion percentages.
