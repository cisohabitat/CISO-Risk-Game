# Owner-supplied 15-run matrix — 15 November 2026

One supplied report of fifteen campaigns: every difficulty against every
starting situation, three personas (newbie, expert, cost-cutter), two
"Surprise me" runs and one seed replay. Played against the hosted game at
build `1bbb558`; `main` had moved four commits on (`de99bb6`, `bc0eb1d`,
`fa66af6`, `9463f8d`), so production had not been updated for at least two
weeks. Who played, and whether by hand or by an agent, is not supplied. The
report is preserved verbatim below, after what was checked and done.

## What was checked and done (14–15 November)

Fixed, each with a test that fails without it:

- **Recording ticked by default; export carried other campaigns.** The
  switch was remembered in the browser, so every later campaign recorded.
  It is now chosen per campaign on the start screen (still on by default from
  a facilitator's `/?playtest` link), and every logged event carries its
  campaign: an export holds the open campaign only.
- **Review contradicting the year.** "No material incident" beside a
  confirmed People Cloud breach now says no incident reached Nexora's own
  systems and names the supplier's breach. Communication names what the board
  or regulator did not hear from the player (a silent extortion refusal, card
  data fixed quietly, a payment fraud absorbed, a skimmed checkout fixed
  quietly, a predecessor's figure corrected quietly) and drops "including when
  you told them what you did not know" when there is any; the band itself is
  unchanged. "Incidents of other kinds" after a breach now names them.
- **Duplicate decision controls on the Briefing.** The deadline strip listed
  each due decision with its own "Review:" button beside the list's "Decide:"
  one; on the Briefing it now leaves the button to the list, and elsewhere it
  reads "Decide:".
- **"Review board paper" opened the Board screen, not the paper.** It is now
  "Open the Q*n* board paper" and opens it.
- **"Compare options" and "Your reasons" did nothing visible** when the section
  was already on screen. The section now pulses once (not under reduced motion).
- **Q2/Q3 papers did not hold Skip ahead.** Skip held for waiting decisions
  only; a paper paused once, two days out, and the next Skip ran past its
  deadline (run 5 missed two). A paper in its final week now holds Skip as a
  decision does; a chosen speed still lets the deadline pass.
- **Seed and situation not reset.** A shared seed link stayed in the address
  and applied again on every return to the start screen. It is dropped once
  its campaign begins; `?playtest` stays.
- **"Surprise me" told its pick only inside a decision paper.** The Briefing
  names the situation beside the date from the first morning.

Already fixed on `main` before this report, absent from `1bbb558`:

- **The annual review needing a hard reload** (`de99bb6`, 31 October).

Checked and left alone:

- **Unexplained budget rises.** Over 20 CISO years, 39 rises, every one in the
  Briefing's budget ledger with its reason (mostly cancelled duplicate tools).
  The ledger is folded near the bottom of the Briefing, which is the real
  finding: they are explained, but where nobody looks.
- **Acceptance renewal repeating three times.** By design: its option reads
  "Ninety days, then this question again".
- **Overload acknowledgement bypassable.** Not reproduced: the commission
  button stays disabled until the box is ticked, and the tick resets with the
  enquiry, the leader and after each commission.
- **Skip ahead jumped 15 Nov to 31 Dec.** Not reproduced: every skip is
  capped at seven days in the store and the engine, and the year closes only
  on its last day. Most likely the clock running at speed through a quiet
  stretch.
- **"Decide sometimes does nothing" and a stale incident view.** Not
  reproduced on prepared saves at days 2, 40 and 120; screenshots needed.
- **Empty papers submittable.** Deliberate: an empty paper needs an explicit
  acknowledgement.
- **Seed replay diverging after week 8.** Expected: the seed fixes the world
  and the draws, and different choices (here, risks raised later) take a
  different path through them.

For the owner, not changed:

- **Cost-cutting meets every business objective.** Runs 3, 5, 10 and 12 spent
  almost nothing, met 5/5 objectives and were punished only by the review's
  verdict; builders met 0–3. Two of the four had no incident at all. Run 12
  had three incidents including severe ransomware and still scored Strong on
  communication and team. Whether events should bite harder for an idle year,
  and whether the business should be so sure to get its year, is a balance
  decision.
- **Team "Strong" with vacancies held, Prioritisation "Strong" after empty
  papers.** Scoring questions, not wording.
- **Inbox volume:** 100–200+ unread by year end.

## Supplied report

### CISO Risk Game playtest matrix (15 runs, 15 Nov 2026)

Game: https://ciso-risk-game.vercel.app/ (build 1bbb558 v0.1.0)

### Key findings
- Balance: cost-cutters met 5/5 business objectives every time (runs 3, 5, 10, 12) and are punished only by the annual review verdict; capability builders met 0-3/5. Run 12 had three incidents incl. severe ransomware yet scored strong on communication and team.
- Seed replay (run 15 vs 7): first 8 decisions identical in title, options and cost; incidents diverged afterwards (no ransomware; data exposure moved from 17 Mar to 17 Apr), partly because risks were raised later.
- Review wording contradicts events: "no material incident" after a confirmed HR-provider breach; strong communication after a silent extortion refusal.
- Record this session: ticked by default; exported log includes events from other campaigns in the same browser (privacy).
- Board papers: empty papers can be submitted; Q2/Q3 papers don't hold Skip ahead.
- Smaller bugs: duplicate Decide buttons; overload "I understand" bypassable; "Review board paper" toast opens Board screen; unexplained budget rises; seed/settings not reset after auto-resume; annual review sometimes needs hard reload; Surprise me only reveals its pick inside the week-1 decision; inbox 100-200+ unread.

### Runs and seeds

| # | Difficulty | Scenario | Persona | Folder | Seed |
|---|---|---|---|---|---|
| 1 | Guided | The inherited mess | newbie | g-im-newbie | quarry-54020 |
| 2 | Guided | After the breach | expert | g-ab-expert | lattice-88945 |
| 3 | Guided | New money, short patience | cost-cutter | g-nm-cost | nexora-6181 |
| 4 | Guided | A tidy inheritance | newbie | g-ti-newbie | corvus-70940 |
| 5 | CISO | The inherited mess | cost-cutter | c-im-cost | lattice-69634 |
| 6 | CISO | After the breach | newbie | c-ab-newbie | lattice-78816 |
| 7 | CISO | New money, short patience | expert | c-nm-expert | corvus-70788 |
| 8 | CISO | A tidy inheritance | expert | c-ti-expert | corvus-1814 |
| 9 | High pressure | The inherited mess | expert | h-im-expert | kestrel-60771 |
| 10 | High pressure | After the breach | cost-cutter | h-ab-cost | kestrel-61053 |
| 11 | High pressure | New money, short patience | newbie | h-nm-newbie | nexora-17051 |
| 12 | High pressure | A tidy inheritance | cost-cutter | h-ti-cost | orbit-74151 |
| 13 | CISO | Surprise me | newbie | c-surprise | vellum-56518 (picked: A tidy inheritance) |
| 14 | High pressure | Surprise me | expert | h-surprise | quarry-25288 (picked: After the breach) |
| 15 | CISO | seed replay of run 7's seed, same persona, also tick "Record this session for a playtest" | expert | c-replay | corvus-70788 (replay) |

### Results 01

Run 1 Guided / Inherited mess / newbie. Seed quarry-54020. Mixed, "The business got its year. The security programme did not." Objectives 5/5.
Dims: risk dev, prio dev, resilience dev, execution weak, enablement strong, comms strong, team strong, blind spots weak.
26 decisions 0 lapsed; 0 enquiries; 0 programmes started (newbie never found/started one; board paper recommendations don't auto-start programmes). 1 risk raised. Papers 3/3.
Incident: ransomware 16 Oct-10 Nov severe (pipeline credential lure; warning 39 days before, no hunt). Chose "talk to buy time".
Budget: wk1 £3.0m, wk13 £2.6m, wk26 £2.1m, wk39 £2.2m, wk52 £1.6m (mostly unspent).
Pacing gaps Jul-Oct and post-Nov. Known issues only. Files g-im-newbie/.

### Results 02

Run 2 Guided / After the breach / expert. Seed lattice-88945. Mixed, "You built the capability, and the business paid for it in delivery." Objectives 0/5 (all 87-97% delivered, 10-30 days delay).
Dims: risk solid, prio strong, resilience strong, execution strong, enablement weak, comms strong, team developing, blind spots developing.
29 decisions 0 lapsed; 5 enquiries (no threat hunt); 3 programmes all 100%. Papers 3/3 (Q1 only offered wk14).
Incident: customer data exposure 5-24 Jul via exposed non-prod + legacy peering. Scenario decision "They are back in touch" (4 Feb) refused extortion and notified regulator.
Budget wk1 £3.4m, wk13 £1.2m, wk26 £380k->£250k, wk39 £130k, wk52 £280k.
Pacing: wk36-39 and 47-52 empty. New bugs: first Briefing "Decide" button sometimes does nothing (hidden duplicate); Replay settings didn't expand reliably on first load, causing an old save to resume.

### Results 03

Run 3 Guided / New money / cost-cutter. Seed nexora-6181. Difficult first year, "The business got its year. The security programme did not." Objectives 5/5.
Dims: risk dev, prio dev, resilience weak, execution weak, enablement strong, comms strong, team strong, blind spots weak.
23 decisions 0 lapsed; 0 enquiries; 0 programmes; papers 3/3. No incident reached business (HR provider incident, card data in logs fixed quietly). Accepted 20% budget cut next year.
Budget wk1 £3.6m, 13 £3.6m, 26 £3.4m, 39 £3.5m, 52 £3.5m (almost all unspent).
Punished only in review scores, not by events: zero-spend year had no incident. Review failed to render after Close year (known), hard reload fixed. Acceptance-renewal decision repeats 3x.

### Results 04

Run 4 Guided / Tidy / newbie. Seed corvus-70940. Interrupted, resumed from wk30 (notes wk1-29 lost). Mixed, "You built the capability, and the business paid for it in delivery." Objectives 1/5 (Nordic only).
Dims: risk dev, prio strong, resilience solid, execution strong, enablement weak, comms strong, team strong, blind spots weak.
26 decisions 0 lapsed; 0 enquiries; Identity 100%, Ransomware 100%; papers 3/3; no incident reached business (one attack stopped at Checkout Service).
Budget wk8 £910k, wk52 £390k (others not captured). Scenario decision "Your predecessor's numbers" -> restate.

### Results 05

Run 5 CISO / Inherited mess / cost-cutter. Seed lattice-69634. Difficult, "The business got its year. The security programme did not." Objectives 5/5.
Dims: risk weak, prio dev, resilience weak, execution weak, enablement strong, comms dev, team strong, blind spots weak.
23 decisions 0 lapsed; 0 enquiries; 0 programmes; papers 1/3 (2 missed; Q3 prompt only appeared wk48). No incident reached business (attack stopped at identity platform). 3 acceptance assumptions failed. Accepted 20% cut.
Budget wk1 £2.4m, ~13 £2.4m, ~26 £2.2m, ~39 £2.3m, 52 £2.3m (unexplained rise after giving £220k).
Punished only in review scores. New bug: "Compare options" and "Your reasons" buttons do nothing visible. Skip-ahead gaps wk26-29, 35-40, 43-48.

### Results 06

Run 6 CISO / After the breach / newbie. Seed lattice-78816. Mixed, "You built the capability, and the business paid for it in delivery." Objectives 2/5 (Nordic, cost reduction).
Dims: risk dev, prio strong, resilience solid, execution strong, enablement dev, comms strong, team weak, blind spots weak.
30 decisions 0 lapsed; 0 enquiries; Ransomware 100%, Identity 100%; papers 3/3. Incidents: customer data exposure wk21; legacy platform ransomware wk47.
Budget wk1 £2.8m, 13 £640k, 26 £90k, 39 £160k, 52 £160k (unexplained rise ~wk30-34).
Extortion decision wk5 refused + notified. New bugs: Briefing button names vary (Decide / Decide: X / Review: X / Prepare it) and bare "Decide" collides with "What you have already decided" toggle; Briefing sometimes shows stale incident view.

### Results 07

Run 7 CISO / New money / expert. Seed corvus-70788. Mixed, "You built the capability, and the business paid for it in delivery." Objectives 2/5 (Nordic, cost reduction; platform 93%, cloud 87%, Kestrel 90%).
Dims: risk dev, prio solid, resilience solid, execution strong, enablement dev, comms strong, team dev, blind spots weak.
38 decisions 0 lapsed; 5 enquiries (others blocked by capacity); Identity 100%, Ransomware 100%; papers 3/3; 3 risks raised.
Incidents: customer data exposure 17 Mar; ransomware 3 Aug; ransomware again 18 Oct (different route).
Budget wk1 £3m, 13 £690k, ~26 £420k, 39 £390k, 52 £390k. Skip ahead jumped 15 Nov -> 31 Dec. Review "38/38 systems, 0 unseen" vs dependency blind spots.
First 8 decisions in c-nm-expert/notes.md for replay.

### Results 08

### Run 8: CISO / A tidy inheritance / expert / seed corvus-1814
Verdict: Credible first year: "A year of decisions taken on an inherited picture."
Objectives 3/5 (missed cloud migration 92%, Kestrel 79% with 55-day imposed delay)
Dimensions: Risk understanding developing; Prioritisation solid; Resilience developing; Execution strong; Enablement solid; Comms strong; Team strong; Blind spots developing
Decisions 29 taken, 0 lapsed; enquiries 11; programmes: Identity & PAM 100% (26 Jan-20 Nov); papers 3/3
Incidents: AP phishing cred entry 12 Mar (contained); People Cloud employee-data breach disclosed 1 Apr, confirmed 19 Apr; one attack stopped at Analytics Platform. Review says no material incident reached business (inconsistent?)
Budget: wk1 £2m, wk13 £20k, wk26 £0, wk39 £0, wk52 £90k (unexplained rise)
Screenshot: c-ti-expert/annual-review.png

### Results 09

### Run 9: High / The inherited mess / expert / seed kestrel-60771
Verdict: Mixed, "You built the capability, and the business paid for it in delivery." Objectives 2/5 (missed platform 94%, cloud 92%, Kestrel 83%)
Dimensions: Risk developing; Prioritisation strong; Resilience developing; Execution solid; Enablement developing; Comms strong; Team developing; Blind spots weak
Decisions 35 taken/0 lapsed; 4 enquiries (6/31 examined; 14/51 deps unseen, 8 material); Identity 100% (£850k), Ransomware resilience 35% (paused for overload); papers 3/3
Incidents: data exposure 23 Feb; targeted data theft 28 Aug (moderate); ransomware 2 Nov (severe, closed 25 Nov, 2 weeks undetected)
Budget: wk1 £2.2m, wk13 £280k, wk26 £80k, wk39 £0, wk52 £90k (duplicate tool cancelled 26 Dec)
Bugs: duplicate Decide buttons wk6/wk19; overload "I understand" checkbox bypassable; inbox 144+ unread
Screens: 01-start-seed, 03-incident2, 04-incident3-ransomware, 05-annual-review

### Results 10

### Run 10: High / After the breach / cost-cutter / seed kestrel-61053
Verdict: Difficult, "The business got its year. The security programme did not." Objectives 5/5 (cloud 30d imposed delay)
Dimensions: Risk weak; Prioritisation developing; Resilience developing; Execution weak; Enablement strong; Comms strong; Team strong; Blind spots weak
Decisions 26/0 lapsed; 0 enquiries; 0 programmes; papers 3/3 minimal
Extortion wk5: refused silently -> sample published 11 Mar, regulator asked. Destructive attack on Order Fulfilment 21 Sep-20 Oct (severe). 3 assumptions failed ~21 Apr.
Budget: wk1 £2.6m, wk13 £2.6m, wk26 £2.4m, wk39 £2.5m, wk52 £2.5m (>£2.5m unspent)
Bugs: review wording mismatches (Comms strong despite silent refusal; Team strong with vacancies held; "incidents of other kinds"); "Review board paper" toast goes to Board screen not dialog

### Results 11

### Run 11: High / New money / newbie / seed nexora-17051
Verdict: Difficult, "You built the capability, and the business paid for it in delivery." Objectives 1/5 (only cost reduction; platform 98%, cloud 91%, Kestrel 80%, Nordic 99%)
Dimensions: Risk weak; Prioritisation strong; Resilience solid; Execution strong; Enablement weak; Comms solid; Team developing; Blind spots weak
Decisions 26/0 lapsed; 0 enquiries (1/31 examined); Identity 100% + Ransomware 100% (both 15 Feb); papers 3/3 with zero agenda items
Incidents: none; 4 attacks stopped by controls
Budget: wk1 £2.8m, wk13 £600k, wk26 ~£60k, wk39 £60k, wk52 £150k
Scenario decision wk8 "board wants something it can see" -> show plan
Bugs: papers submittable empty; Q2/Q3 papers don't hold Skip ahead; Review board paper toast -> Board screen; Prioritisation strong wording mismatch; weeks 44-52 empty

### Results 12

### Run 12: High / A tidy inheritance / cost-cutter / seed orbit-74151
Verdict: Difficult, "The business got its year. The security programme did not." Objectives 5/5
Dimensions: Risk weak; Prioritisation developing; Resilience developing; Execution weak; Enablement strong; Comms strong; Team strong; Blind spots weak
Decisions 32/0 lapsed; 0 enquiries; 0 programmes; papers 3/3 all supported
Incidents: ransomware 1-28 Feb severe (11 Jan warning unhunted); customer data exposure 11 May-4 Jun high; targeted data theft 1-26 Oct elevated
Budget: wk1 £1.8m, wk13 £1.8m, wk26 £1.5m, wk39 £1.7m, wk52 £1.7m (unexplained rise)
Scenario decision: predecessor's MFA figure left standing (went to insurers)

### Results 13

### Run 13: CISO / Surprise me -> A tidy inheritance / newbie / seed vellum-56518
Scenario revealed wk1 in "Where do you start?" paper.
Verdict: Mixed, "A year spent acting on a picture you never verified." Objectives 3/5 (missed cloud, Kestrel)
Dimensions: Risk developing; Prioritisation strong; Resilience weak; Execution strong; Enablement solid; Comms strong; Team developing; Blind spots weak
Decisions 26/0 lapsed; 1 enquiry; Identity 100% (15 Feb-1 Oct); papers 3/3
Incidents: none material; People Cloud disclosure 31 Mar; phishing cred entry 25 Jun (reset); 2 attacks stopped
Budget: wk1 £2m, wk13 £660k, wk26 £440k, wk39 £380k, wk52 £200k (refunds £90k, £60k)
Scenario decision: restated predecessor's MFA figure
Only annual-review-summary.png screenshot saved

### Results 14

### Run 14: High / Surprise me -> After the breach / expert / seed quarry-25288
Verdict: Mixed, "You built the capability on people who cannot do it again." Objectives 3/5 (missed cloud 94%, Kestrel 97%)
Dimensions: Risk developing; Prioritisation strong; Resilience solid; Execution strong; Enablement solid; Comms strong; Team weak; Blind spots weak
Decisions 33/0 lapsed; 2 enquiries; Identity 99%, Ransomware 100% (28 Nov); papers 3/3
Incidents: extortion 4 Feb (refused, notified regulator); HR provider disclosure 30 Mar; legacy compromise 21 Jul-10 Aug; customer data exposure 19 Aug-6 Sep
Budget: wk1 £2.5m, wk13 £915k, wk26 £465k, wk39 £435k, wk52 £315k
Review needed hard reload to render. Needed one resume (time_budget at wk34).

### Results 15

### Run 15: CISO / New money / expert / replay seed corvus-70788 with Record session
First 8 decisions matched run 7 (titles, options, costs; dates within a day). Diverged after week 8 (risks raised later). No ransomware; data exposure 17 Apr + supplier disruption 18 Apr instead.
Verdict: Credible (run 7 Mixed), same headline. Objectives 2/5. Prioritisation strong (run 7 solid), rest same.
31 decisions/0 lapsed; 4 enquiries; both programmes 100%; papers 3/3. Budget £3m -> £410k.
Record: ticked by default; sidebar notice, Export log JSON includes events from other campaigns (privacy). Seed/scenario not reset after auto-resume.

