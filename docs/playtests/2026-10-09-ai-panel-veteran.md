# CISO: First Year, AI panel session: the veteran CISO

**This is an AI-driven session, not a human playtest.** An AI agent played the
game through a browser driver while role-playing an experienced CISO. It does
not count toward the human playtest gate in `docs/PLAYTEST.md` or Phase 0 of
`docs/ROADMAP.md`. Treat every finding below as a hypothesis for a human session
to confirm or reject, not as evidence of what a person would feel.

## Session and evidence boundary

> **Editor's note (build):** the driver served a copy of the build made from `dfa8554` before any of the day's changes, in a directory of its own, so the uncommitted work in the checkout was not in the game this session played. See `2026-10-09-ai-panel-synthesis.md`.

- Build: commit `dfa8554` (Phase 7: release material), served locally and
  driven through the browser driver at `localhost:4331`. When the session
  ended, the checkout also had uncommitted changes from other work in progress
  (content, engine and screen files). I did not check which build the driver
  was serving, so the game I played may include some of those changes.
- Start URL: `/?playtest&seed=panel-veteran`. Difficulty **High pressure**,
  situation **After the breach**. Recording left on for the whole year and
  exported with **Stop and export** at the annual review.
- Persona: a CISO with fifteen years in the role, at a bank and then a
  manufacturer. Sceptical, impatient with anything cartoonish, judging whether
  the game is true to the job: what the board hears, whether programme
  trade-offs are real, whether incidents play out credibly, whether the advice
  is advice a practitioner would give.
- Wall clock: page opened 15:24:45 UTC on 9 October 2026, **Begin your first
  day** at 15:24:56, annual review reached at about 15:55:40. The session log
  says 30.6 minutes played and day 364 reached. Elapsed times below come from
  `date` checkpoints taken during play. Each one marks when a note was written,
  so the actions it describes happened just before it.
- Method: one continuous run using only the accessibility tree, screenshots
  and normal controls. I did not read any source, content, test or doc file
  except the format example
  (`docs/playtests/2026-09-20-ai-browser-session.md`). There were no reloads,
  no replays and no save manipulation.
- Navigation: mostly **Skip ahead** between events, with deliberate inbox
  sweeps after each jump. That turned out to cost unused weeks of attention
  (finding 10). An attentive human would probably have used the speed controls
  more.
- Not a blinded evaluation. The persona knows the subject, so this session
  cannot say whether a newcomer learns anything. Its job is to say whether a
  practitioner would believe the game.
- Screenshots (start screen, early briefing, risk detail, three board papers,
  acquisition decision, budget decision, incident banner, response log, review)
  and the exported log
  `ciso-session-2026-10-09.json` were kept in the session scratchpad. None of
  them is committed.

## Outcome

The annual review called the year a **Mixed first year** and opened with
**"You built the capability, and the business paid for it in delivery."**

| Measure | Observed result |
| --- | --- |
| Decisions | 31, all answered, each with a recorded reason |
| Programmes | 2 started, 2 completed: Identity uplift (23 Jan to 17 Aug) and Recovery uplift (23 Jan to 21 Jul) |
| Enquiries | 14 commissioned, including two threat hunts and two vulnerability triages |
| Board papers | 3 of 3 prepared (Q1 on 2 Apr, Q2 on 2 Jul, Q3 on 1 Oct) |
| Business objectives | 2 achieved, 3 missed: customer platform launch (10 days late), cloud migration (30 days), Kestrel acquisition (55 days) |
| Incidents | 1 reached the business: ransomware, 11 to 27 December, "high consequence", Customer Digital Platform and Nexora Pay |
| Attacks that stopped at a control | 2, "at Order Fulfilment and Production Cloud" |
| Assumptions | 1 stopped holding: "The managed service provider holds no standing privileged access." |
| Budget | £0k of £2.6m at year end; "£310k was committed beyond the cyber allocation and left for finance to fund" |
| Board confidence (briefing panel) | Neutral at every checkpoint from 2 January to 31 December |
| Risk understanding | Developing |
| Prioritisation | Solid |
| Resilience | Solid |
| Cyber programme execution | Strong |
| Business enablement | Developing |
| Communication and escalation | Strong |
| Team sustainability | Weak |
| Material blind spots | Developing |

In short, the game modelled the first nine months better than most training I
have seen. It then lost credibility in December, when the incident it had been
building towards played out as four one-line updates and three decisions.

## Timestamped observation log

| Elapsed | Game point | What I did, and my professional reaction |
| --- | --- | --- |
| 00:00 | Start screen | Chose High pressure and After the breach. The premise "the people who got in know the way back" is exactly the question a post-breach board asks. |
| 00:11–01:59 | Day 1, 2 Jan | Read the inbox before deciding. Opening question: started with the business services. No option offered to read last quarter's post-incident report, which is what I would actually do first. The risk register holds six scenarios and **none of them is ransomware or extortion**, a quarter after an encryption. Order Fulfilment, the service that was encrypted, is not marked Critical. Commissioned a targeted threat hunt (moved it from the default lead, Architecture, to SecOps), a privileged access review, a critical service review and an incident response readiness review. That used the whole week. |
| 01:59 | Day 2, 3 Jan | CEO asks for "your three risks". The options are about tone, not content: I never get to name the three. The honest option is plainly the right one. |
| 01:59–03:47 | Days 2–19 | **Skip ahead** jumped from 3 January to 20 January, so week 2's attention went unused without any warning. |
| 03:47 | Day 19, 20 Jan | Results. The post-breach threat hunt returned "SOC receives no telemetry from the legacy estate." It did not say whether anyone is still inside. The IR readiness review came back with no content at all. Forming four hypotheses quietly used most of the week; the pattern cards do not show a cost. Recruited properly (£140k). Commissioned a supplier access review from Fenella. |
| 03:47–05:53 | Day 22, 23 Jan | Started Ransomware resilience (£700k, COO sponsor) and Identity and privileged access (£850k, CFO sponsor). The sponsor list includes the Board Risk Chair. The ransomware card says "It cannot currently prove it can survive being encrypted", but this organisation *was* encrypted last quarter. Supported the platform launch with conditions. Budget left: £730k. |
| 05:53–07:32 | Day 34, 4 Feb | Extortion: the attackers hold real customer records. Refused and notified the regulator. The decision is "Due in 10 days", and payment would come "from the cyber budget". Briefed the CEO and the risk chair; listened to the CIO. Raised "Supplier-enabled ransomware across production", which arrived rated Exposure **Low**, Consequence **Low**. |
| 07:32–09:23 | Days 36–41 | Vendor sessions at 03:40 three nights running: suspended vendor access. Supplier review found "Provider access does not enforce second factor". I had no tactical lever to force MFA on vendor access, only a £520k six-month programme. Team over capacity: bought capacity (£200k). Recruited incident response (£120k). Commissioned control effectiveness testing. Pressing the CFO "for a commitment" got "pushes back hard. You have spent credit you did not have." |
| 09:23–10:32 | Days 41–45 | Public exploit for the checkout framework: blocked it at the edge and patched in the release window. A realistic call, though "next release window is in eleven days" sits oddly beside the twice-weekly releases announced on 1 Feb. Repeat audit finding on privileged access: committed to a funded programme with dates. The CFO is already its sponsor, and the decision does not acknowledge that. |
| 10:32–11:35 | Day 59, 1 Mar | Skip ahead again passed a week unused. Corvus returned a clean questionnaire claiming enforced MFA: good realism, undercut by Fenella's "I have not tested it" when her own review had already found the opposite. Replaced Corvus standing access with monitored break-glass (£80k). Commissioned a legacy estate inventory. |
| 11:35–13:12 | Days 60–70 | Escalating supplier ransomware to the board: chose the CEO first, then the board together. One option was to brief the risk chair "now, out of cycle" ahead of the CEO. |
| 13:12–14:26 | Day 89, 31 Mar | The best investigative texture of the year: "Backups share credentials with what they protect", "Legacy systems are outside the backup schedule", and the architecture pack versus firewall rules. Sir Alan's Q1 ask was excellent. Isolated Meridian (£180k). Kept the pen test scope to protect the budget. Pressed People Cloud for specifics. Budget left: £50k. |
| 14:26–16:35 | Days 90–91 | Refused an executive exception (the £60k redesign option was greyed out). Q1 paper: six risks, recommended Identity, Recovery and Detection, explicit about uncertainty. **No visible board response at all.** |
| 16:35–18:08 | Days 100–120 | A low-confidence anomaly at Order Fulfilment. A hunt was unaffordable (£60k against £50k). Enforced the retention policy. SOC renewal: the rescope (£140k) and replacement (£60k) were both disabled, so I renewed as-is. The board asked for a risk appetite statement; there was no way to write one. Two public buckets had exposed session identifiers for seven months; no decision was attached. |
| 18:08–19:51 | Days 150–175 | Finance asked for £220k and only £50k was uncommitted: refused and explained. Data holdings review found card data outside the PCI boundary: fixed it and told the acquirer. SOC message: "whatever they were trying there did not get through, and they appear to have given up on it." That was reported after the fact. |
| 19:51–21:32 | Days 175–183 | 25 Jun: the "What is about to collide" panel gave the launch 10 days. 26 Jun: "Missed: Launch the new customer platform". Accepted "Material intrusion goes unnoticed" with recorded assumptions. This is the best governance mechanic in the game. Q2 paper with all eight risks: "The board sat through a long list." Next day: "Something you relied on was never the case … We simply had not checked." |
| 21:32–23:12 | Days 200–230 | Kestrel network join: refused until due diligence was done (the £120k quarantine option was unaffordable). Both programmes delivered. Budget rose from £10k to £100k with no message explaining why. Commissioned Kestrel technical due diligence (£90k). |
| 23:12–24:17 | Days 240–270 | "What was never decided is whether they are mandatory": enforced MFA and PAM now. Three weeks later: "The exception list is a tenth of what it was." Very true to life. Kestrel due diligence: "confirmed what you already had, and found nothing new." A cyber insurance questionnaire arrived with no lever attached. |
| 24:17–27:36 | Days 272–300 | Q3 paper: six items, including the failed assumption. "Fewer, sharper" again. Budget rose silently from £10k to £70k. Restore test: chose the test tenancy over taking Nexora Pay down for four hours. Wrote Corvus access terms into the contract. Commissioned a second threat hunt: "found nothing new". Audit: showed production as it is. Next-year budget: "No incident reached the business this year." I had a confirmed data theft, a regulator notification and an acquirer disclosure on file. |
| 27:36–28:44 | Days 318–344 | Inbox only, in hindsight: low-confidence anomalies at Engineering Workstations (23 Oct), the Build and Deployment Pipeline (1 Nov) and Production Cloud (3 Dec). None of them reached me as a decision. "Someone is thinking of leaving" arrived for the third time, word for word. |
| 28:44–30:14 | Days 344–360 | **Ransomware, 11 December**, Customer Digital Platform and Nexora Pay, in peak trading. I was offered three decisions: stood up incident command, cut all external access, and brought in external responders at £320k ("no retainer in place"). Then four one-line updates, and closure on 27 Dec. |
| 30:14–30:55 | Days 362–364 | Presented the post-incident account honestly. Annual review. Exported the log. |

## Findings, ranked by severity

### High: these would stop a practitioner trusting the simulation

**1. The incident everything led up to plays out with almost no CISO work in it.**
In order, the whole incident record reads: "Ransomware and service encryption
escalated to the CISO." / "Response decisions are live; containment work has
started." / "The actor has been pushed out. The damage is now being counted." /
"Restoration of affected services has begun." / "Services are restored. Time to
reconstruct what happened." / "Post-incident review complete. Ransomware and
service encryption ran 16 days and touched Customer Digital Platform, Nexora
Pay; the consequence to the business was high. You took 3 response decisions
while it ran." This was a payments platform encrypted in peak trading, in a
payment-services firm already under a regulator's thematic review on
operational resilience. Yet nothing asked me about:

- the regulator, the acquirer or the card schemes;
- merchants, customers or the board;
- the insurer, which had sent a renewal questionnaire in September;
- law enforcement;
- a ransom.

The review then says "Nexora woke up to encrypted infrastructure and a
negotiation window", but no negotiation was ever put to me. The post-incident
review closes one day after the debrief opens. In practice that takes weeks.

**2. The review says the attack was caught fast, but the inbox shows weak signals at every step.**
The reconstruction lists "The activity was detected almost immediately" under
*What helped*. The inbox shows "Low-confidence anomaly … A weak signal has been
raised around Engineering Workstations" on 23 Oct, "… around Build and
Deployment Pipeline" on 1 Nov and "… around Production Cloud" on 3 Dec. Those
are the exact steps the reconstruction then lists. On 24 Aug Callum had warned
"One credential, forty repositories". A slow chain of weak signals is the most
realistic thing in the game. Calling it immediate detection throws that lesson
away. Either the line is wrong, or "detected" means something the player never
saw.

**3. The game forgets the "After the breach" premise when it matters.**
On 28 October the budget decision opened with "No incident reached the business
this year" and "the year had no incident to point at". By then I had handled
an extortion attempt using customer records that "are real", notified the
regulator ("The regulator has acknowledged our notification") and disclosed a
card-data scope problem to the acquirer. A finance director would not call that
a quiet year. Other examples:

- The inherited register has no ransomware or extortion scenario.
- Order Fulfilment, the service encrypted last quarter, is not marked Critical.
- The ransomware programme says "It cannot currently prove it can survive
  being encrypted".
- In December, still with "no retainer in place", the response support
  decision costs £320k. That comes a year after a ransomware attack, from an
  organisation that had just finished a programme promising "an incident
  response capability that has actually been exercised".
- On 17 December, mid-incident, the CEO writes "Your first year is nearly up …
  Bring the honest version." with no reference to the outage.

**4. Risk ownership and governance roles are wrong in ways a board would notice.**

- *The CISO is the one accepting risk.* "Support now, compensate afterwards …
  You are carrying the exposure in the meantime." Accepting a risk is the
  business owner's job, and the CISO advises. The acceptance dialog puts the
  CISO's name on accepting "Material intrusion goes unnoticed", which is "Owned
  by Dev Raghunathan (CIO)".
- *A board member can be picked as executive sponsor.* The list offers "Sir
  Alan Whitcombe — Board Risk Chair". A non-executive overseeing the programme
  cannot also sponsor it.
- *The CISO decides whether to pay.* "Pay to have it deleted £250k … Pay from
  the cyber budget, through a negotiator". A ransom or extortion payment is a
  board decision, taken after legal advice and a sanctions check. It is not a
  line in the CISO's budget.
- *The timeline is wrong for a personal-data breach.* The extortion decision is
  "Due in 10 days". Under UK GDPR the regulator must be told within 72 hours of
  awareness.
- *The CEO is sidelined twice.* The DPO opens with "I need your view before
  anyone else sees this", when the CEO must know at once. One escalation option
  is "Brief the risk chair now, out of cycle", ahead of the CEO.

**5. A newly raised risk shows ratings that contradict its own impact text.**
"Supplier-enabled ransomware across production" was raised on 4 February. It
showed "Exposure Low", "Consequence Low" and "Low residual limited
confidence", directly above "If it happened: Multi-day loss of payment
processing / Fulfilment halted across three distribution centres / Regulatory
and acquirer notification". By mid-February it read High. Two other problems:

- "Material intrusion goes unnoticed" carries "Consequence Moderate" beside
  "Dwell time measured in months / Reconstruction impossible after the fact".
- From Q2 it is marked "Improving", although detection was never funded and
  the SOC was renewed as-is.

A residual rating should not be shown before the risk has been assessed.

### Medium: these cost credibility or teach the wrong habit

**6. Paid enquiries often come back empty or generic.**
- The post-breach threat hunt returned one line, "SOC receives no telemetry from
  the legacy estate". That is a coverage gap. It does not answer whether anyone
  is still inside.
- "Incident response readiness review answered part of the question and raised
  others." had no other content.
- The £90k Kestrel due diligence: "confirmed what you already had, and found
  nothing new." Due diligence on an unexamined estate always finds something.
- The second threat hunt, the register review and the team review all returned
  the same "found nothing new" template.

Practitioners pay for these, and a template where a finding should be is the
fastest way to lose them.

**7. Messages contradict what the player has already established.**
- On 17 Feb Fenella writes, of Corvus's claimed MFA, "I would like to believe
  it. I have not tested it." On 9 Feb her own review had found "Provider access
  does not enforce second factor".
- The failed assumption says "We simply had not checked". I had commissioned a
  supplier access review and was told on 20 Apr "The break-glass path for
  supplier access is live." The hidden route via Management Jump Servers,
  revealed in the review, is a good twist. The message's framing is unfair.
- A July pattern cites "No current inventory of the legacy estate" after the
  inventory returned on 27 Mar.
- The review says "Backup Platform was taken on trust and never examined".
  Meanwhile the year had "Backups share credentials with what they protect", a
  restore test, and the incident credit "Backups that could not be reached from
  the compromised accounts".

**8. Every cost is charged to the cyber budget, and the budget moves without explanation.**
- The quarantine for the acquisition (£120k), the SOC contract rescope (£140k)
  and a ransom are all charged to the cyber budget. In a real organisation,
  integration security is an M&A cost and a contract variation is a run-cost
  decision.
- "From 1 April, the year offered things the budget could no longer pay for: 3
  decisions held an option out of reach." That is fair as a lesson in front-
  loading. But there is no in-year route to ask for more money, which is the
  first thing a post-breach CISO does.
- The board paper's Recommendations ("What the paper asks the board to back")
  got Detection uplift three times running, with no answer either way.
- The budget went from £10k to £100k (around day 230) and from £10k to £70k
  (around day 273) with no message saying why.

**9. The board's verdicts are hard to read and do not match the review.**
- The Q1 paper drew no visible response.
- Q2: "The board sat through a long list. … Cardholder data outside the
  regulated boundary did not need its time this quarter". A scope problem I
  had just disclosed to the acquiring bank is board business whatever its
  residual rating.
- Q3: "Concentration of business services on one identity platform … did not
  need its time", for an Elevated-residual risk.
- The briefing showed "Board confidence: Neutral" all year, yet the review says
  "The board came to rely on your judgement".

The note "fewer, sharper" is true to life. The rule behind it is invisible.

**10. Skip ahead and pattern cards spend attention without saying so.**
- Skip ahead jumped from 3 Jan to 20 Jan, from 1 Mar to 12 Mar, from 17 Mar to
  31 Mar, from 20 Jul to 19 Aug and from 29 Aug to 28 Sep. Each jump passed
  weeks of fresh attention unused.
- "Form the hypothesis" took attention, but the card does not show a cost. I
  found out from "Working a hypothesis up into a risk scenario needs more
  attention than you have left this week."

The first three weeks went without a programme started. For a time-poor
executive that teaches the wrong lesson: the real constraint was invisible
bookkeeping, not judgement.

**11. Many real events arrive with no way to respond.**
None of these had an action attached:

- "Some of them still match live accounts" (credentials in a breach dump);
- five finance credential compromises ("Somebody gave up their credentials; we
  reset the account within the hour");
- "Two storage buckets in the production tenancy permit anonymous read. One
  contains application logs including session identifiers. They have been like
  this for at least seven months.";
- "An analyst in the commercial team has been querying the data lake at
  volumes well beyond their role";
- "a customer data enrichment project with an external provider for four
  months. Nobody told us.";
- the insurance questionnaire;
- "The committee has asked for a cyber risk appetite statement";
- "The committee wants one page on what is different now".

A real CISO acts on most of these the same day, by forcing resets, closing the
buckets and getting a DPO assessment. The week offers only enquiries,
programmes and meetings. Meanwhile "Someone is thinking of leaving" arrived
word for word on 12 Mar, 25 Aug and 14 Nov, with no retention lever, and the
review then grades team sustainability "weak".

**12. Stakeholder actions have no content.**
I took 31 Listen, Brief and Press actions and got back:

- "follows the argument and asks a sharper question than last time", over and
  over, whether the subject was an extortion demand or a routine update;
- "talks you through what is actually keeping them up at night", with nothing
  about what keeps them up;
- "pushes back hard. You have spent credit you did not have." without saying
  what I had asked for.

The relationship tracking is well built ("You notified before anyone could say
you had hidden it."). The conversations themselves are empty.

### Low

**13. The calendar contradicts itself.**
- 25 Jun: "Launch the new customer platform … 10 days". 26 Jun: "Missed:
  Launch the new customer platform".
- "Missed: Complete and integrate the Kestrel acquisition" (4 Sep) arrived
  before the due diligence I had made a condition of joining returned (8 Sep).
- Release cadence ("twice-weekly releases") does not fit "next release window
  is in eleven days".

**14. Restore assurance is described inconsistently.**
The milestone "Restore tested outside production" was complete, but the
briefing said "Built, not yet verified by a restore". The restore decision also
offers "A full restore test needs a four-hour outage on Nexora Pay", and
nobody takes a card platform down to test backups. An isolated recovery
environment is normal practice, and that is effectively the "test tenancy"
option, which the game labels "Proves the backups, not the runbook".

**15. The pattern cards cite evidence that does not support them.**
"Commercially sensitive data could be taken slowly" is "led" by "HR provider
reports a security incident". "The deployment pipeline is a privileged path into
production" is led by "Logistics integration account has write access" and
"Backup platform shares administrative credentials with production". Three
different patterns shared the same three evidence items in January.

**16. Accessibility: the executive sponsor select has no accessible name.**
The label sits on the group ("Executive sponsor") and the combobox inside is
unnamed. Selecting it by label failed in the driver, and I had to reach it by
role and arrow keys.

## True to the job?

### What rang true

- **The risk committee chair.** "At the next committee I would like to hear what
  you now believe, what you have changed your mind about, and what you still
  cannot answer. I am more interested in the third of those than the first two."
  And: "The committee wants one page on what is different now and what is not.
  Not what is planned: what is different." That is word for word the best risk
  chair I worked for.
- **The gap between documents and reality.** "The architecture pack says the
  legacy estate is fully segregated from production. The firewall rule base says
  otherwise. Both are current documents." "Corvus has returned the annual
  assurance questionnaire fully compliant, including enforced multi-factor
  authentication" against a review that found the opposite. "Backups share
  credentials with what they protect." These are the findings that actually
  turn up in a first year.
- **Built is not the same as mandatory.** "The vault and the second factor are
  built; what was never decided is whether they are mandatory." The follow-up,
  "Lockouts in week one, then quiet. The exception list is a tenth of what it
  was", is exactly how enforcement goes.
- **Exceptions.** "Exceptions are how good controls quietly become partial
  controls." Most CISOs learn this the hard way.
- **Alert fatigue.** "They know that on the night it is not the printer, they
  will be tempted to assume it is."
- **The vulnerability count.** "The number people keep quoting at you is real.
  It is also close to meaningless". Re-cutting it by exposure is the right
  advice.
- **Risk acceptance with assumptions and an expiry.** Accepting a risk asked what
  I was assuming, checked it, and came back when it failed and when the period
  ran out ("Renewing is a decision, not a default"). If the game teaches one
  thing, it should be this.
- **Audit.** "noted that management's account matched what they found. That last
  line is the one the audit committee will read." True.
- **Real trade-offs between programmes.** The identity team was the
  bottleneck. Buying capacity, recruiting and pausing were all real costs. Two
  programmes plus a containment project used up a £2.6m budget by April. The
  checkout exploit (edge mitigation versus emergency change), the warehouse
  platform (isolate, retire, accept or build a manual fallback) and Corvus
  (contractual terms versus tender) are decisions I have taken, with the
  options I had.
- **The attack path.** A package lure on an engineering workstation, then the
  pipeline's standing credential, then production. That is how these happen
  now. Leaving the cloud and pipeline work unfunded and getting hit through
  exactly that route is a fair consequence.

### What did not ring true, and what a real organisation would do instead

- **The incident.** Within the first hours a real organisation runs an
  executive crisis team and puts legal privilege over the investigation. It
  calls the insurer, whose panel supplies the responders, so there is no
  £320k "emergency rate" decision. It notifies the data regulator within 72
  hours and the payments regulator, acquirer and schemes on their own
  timetables. It talks to merchants and reports to law enforcement. The board
  takes any ransom decision after a sanctions check. The post-incident review
  takes weeks. The game asked three questions, and one of them ("whether you
  stand up formal incident command") would not be a question at all with
  payments encrypted in December.
- **Who owns what.** The business owner accepts residual risk and the CISO
  advises; the game has the CISO accept and "carry" it. Non-executives oversee
  and do not sponsor. The CEO hears about an extortion demand before anyone
  else, and the risk chair is not briefed ahead of the CEO.
- **Budgets.** Cyber has a run budget and a change budget. M&A integration
  security comes from the deal. Post-breach emergency money comes with a route
  back to the board when the threat changes. A finance clawback in May of
  board-approved emergency money would go back to the board, not be settled
  between the CISO and the CFO.
- **Tactical levers.** Force a password reset, lock down a public bucket, turn
  on conditional access for third parties, or put an IR retainer in place.
  These are a day's work. In the game they either do not exist or are buried
  in six-month programmes.
- **What a board ignores.** A board does not wave away a disclosed card-data
  scope problem because its residual rating is Low.
- **Restore tests.** You do not take a payments platform down for four hours
  to test backups. You restore into an isolated environment and run the
  runbook there.

### Terms used wrongly or loosely

- **"Privileged access flow" / "session recording" for executive assistants.**
  "Three executive assistants hold delegated access to their principals' mail
  and files, and the new privileged access flow now covers it." Mailbox
  delegation is not privileged access in the PAM sense, and nobody records
  sessions for it. The real-world version of this dispute is about MFA or
  conditional access for executives.
- **"Containment"** is the glossary word on the restore test decision. A restore
  test is recovery assurance, not containment.
- **"Residual"** is shown on a scenario that has just been raised and not yet
  assessed ("Low residual limited confidence"). Residual means what is left
  after controls have been assessed.
- **"Targeted threat hunt"** is used for the post-breach "are they still in?"
  question. Practitioners call that a compromise assessment, and its output is
  a yes or no with a confidence, not "SOC receives no telemetry from the
  legacy estate" (a coverage finding).
- **"Control testing"** is the source label on "MFA exception register holds 214
  accounts". Reading a register is a document review, not a control test.
- **"You are carrying the exposure"**: the CISO does not carry exposure. The
  risk owner does.
- **"The SOC is a person down for five months"**, said of moving to a different
  outsourced provider, reads oddly. The real cost is a detection gap during
  transition, which the next line does say.
- **"Executive sponsor"** should not include the Board Risk Chair.

## Would I use it to train a deputy?

**With caveats: yes for Q1 to Q3, no for the incident.**

I would put a new deputy through the first three quarters as a facilitated
exercise. They would learn:

- to check the inherited picture before believing it;
- why a questionnaire is not assurance;
- why a built control is not an enforced one;
- how to accept a risk properly, with stated assumptions and an expiry;
- how to tell the board what you do not know;
- what it feels like when the money is gone in April and the year is still
  asking for things.

That is more than most tabletop packs teach, and the writing in those parts
sounds like the job.

I would not let them learn incident leadership or governance roles from it
unsupervised. The December ransomware teaches that an incident is three
choices and a fortnight's wait. The ownership errors (the CISO accepting and
"carrying" risk, a non-executive as sponsor, a ransom paid from the cyber
budget, a 10-day clock on a personal-data breach) are exactly the habits I
would be trying to train out of a deputy. With a facilitator correcting those
points live, and the incident replaced by a proper tabletop, it is a useful
tool. Without one, it risks teaching the wrong reflexes on the days that matter
most.

## Session log summary

Output of `pnpm session ciso-session-2026-10-09.json`, run from the repository
root after export:

```
Campaign: seed panel-veteran, high-pressure, sit-after-breach
Played 30.6 min, reached day 364, finished the year

First decision:     day 1, 0.5 min in
First enquiry:      day 1, 1.2 min in
First programme:    day 22, 5.2 min in
First board paper:  day 91, 16.2 min in

Screens (minutes, visits):
  home             9.8  39
  inbox            8.4  25
  risk             6.3  19
  board            3.7  19
  programmes       1.9  6
  team             0.3  2
  organisation     0.1  1
  debrief          0.1  2

Glossary opened: never
Lessons dismissed: lesson-stakeholder, lesson-investigation
Clock stopped for: decision-deadline ×25, quarter-end ×3, assumption-invalidated ×1, incident ×1, year-end ×1
Skipped ahead: day 2, day 19, day 22, day 34, day 36, day 40, day 41, day 45, day 59, day 60, day 70, day 75, day 89, day 90, day 91, day 100, day 120, day 150, day 175, day 182, day 183, day 200, day 230, day 240, day 270, day 272, day 273, day 275, day 280, day 295, day 300, day 318, day 344, day 345, day 360, day 362, day 364

Actions taken:
  markRead                 135
  advance                  37
  resolveDecision          31
  meetStakeholder          31
  startInvestigation       14
  createHypothesis         7
  convertHypothesis        6
  dismissPattern           5
  treatRisk                5
  completeQuarterReview    3
  dismissTutorial          2
  startProgramme           2
  acceptRisk               2
  openRisk                 2
  hire                     1
```

The log is consistent with the session notes. The first programme started on
day 22 because the opening weeks' attention went on enquiries, hypotheses and
an unused week 2 (finding 10). The 37 advances show how much of the year went
by on Skip ahead. "hire 1" counts the £120k incident response recruitment
only. The £140k "Recruit properly" decision is counted under resolveDecision.

## What this session does not settle

- Whether a human practitioner reacts the same way. The persona is an AI's
  model of a veteran CISO. A real one may forgive more or less.
- Whether a newcomer learns from the parts a practitioner finds thin. A
  sparse incident might read as suspense to someone who has never run one.
- Balance. One seed, one situation, one difficulty, no replays. The budget
  being gone by April may follow from my own front-loading rather than from
  the tuning.
- Whether the board's "fewer, sharper" rule is meant to be learned by trial.
  Two rounds of feedback were not enough to infer it.
- The CISO and Guided modes, the other three situations, mobile, and
  assistive technology beyond the one unlabelled control noticed in passing.

Recommended next step: put findings 1 to 5 in front of one or two practising
CISOs or deputies, using a save prepared at the December incident
(`scripts/prepare-campaign.ts panel-veteran incident`). Ask them two questions:
what they would do in the first 24 hours, and whether the game let them do it.
Fix the plain inconsistencies (findings 3, 7, 13 and 14) separately. They need
no playtest to confirm.
