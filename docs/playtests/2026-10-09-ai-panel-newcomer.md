# CISO: First Year, AI panel session: the curious newcomer

**This is an AI-driven session, not a human playtest. It does not count toward the human playtest gate (Phase 0).** An AI agent played the game in a scripted browser, reading the accessibility tree and taking screenshots, while role-playing the persona below. Its confusion is a hypothesis about where a person might stumble. It does not show that a person would.

## Session and evidence boundary

> **Editor's note (build):** the driver served a copy of the build made from `dfa8554` before any of the day's changes, in a directory of its own, so the uncommitted work in the checkout was not in the game this session played. See `2026-10-09-ai-panel-synthesis.md`.

- Build: commit `dfa8554`, served locally (`http://localhost:5311`) behind a browser driver on port 4311. When the session ended, the checkout also held uncommitted changes that this session did not make (engine, content and screens, including a new `next-year` module). The served build may have included them. The review's "Another year" section is one visible sign of this.
- URL: `/?playtest&seed=panel-newcomer`. Difficulty: CISO. Situation: "The inherited mess". Both were already selected by the link.
- Persona: a curious newcomer who works in IT operations. They know roughly what a firewall and a phishing email are, but have never worked in security risk or met a board. They read most of what is on screen, but not everything. They play on a laptop (1440×900 screenshots) and want to finish the year in one sitting.
- Wall clock: started 15:24:45 UTC on 9 October 2026. Annual review reached at 15:47:05. Log exported at 15:47:24. Elapsed 22:39. The recorder's own figure is 22.4 min. Tool latency is included, so this is not a human reading time.
- Method: the interface only. The agent read no source, content, tests or docs apart from the earlier report `docs/playtests/2026-09-20-ai-browser-session.md`, which it used as a format example. There were no reloads, no replays and no save manipulation. Recording stayed on for the whole year. Time moved on only through **Skip ahead**.
- The persona did not optimise. It chose what an IT-operations person would plausibly choose: fund the obvious things early, protect the team, follow the reporting line. It never opened the glossary or a "Words:" definition, because it never felt the need.
- Screenshots were taken at the start, the briefing, the programme dialog, the inbox, the year view, the board paper of each quarter, the first incident-like event (22 October) and the annual review. They sit in the session scratchpad and are not committed.

## Outcome

The annual review called the run **Credible first year**. Its headline was **"You built the capability, and the business paid for it in delivery."**

| Measure | Observed result |
| --- | --- |
| Decisions | 27, all answered by the player; 23 with a recorded rationale |
| Programmes | 2 started (identity, recovery), 2 completed |
| Enquiries | 14 commissioned |
| Board papers | 3 of 3 prepared |
| Business objectives | 2 achieved, 3 missed (cloud migration 30d, Kestrel 55d, cost reduction 20d) |
| Material incidents | "none reached the business" |
| Assumptions | 1 stopped holding (22 October, "There is no adversary currently operating inside the environment.") |
| Risk understanding | Solid |
| Prioritisation | Strong |
| Resilience | Solid |
| Cyber programme execution | Strong |
| Business enablement | Developing |
| Communication and escalation | Strong |
| Team sustainability | Weak |
| Material blind spots | Developing |

Budget was **£2.4m** on day 1, **£850k** after two programmes that same morning, **£90k** by 6 March and **£50k** by 17 March. From there it went to £10k (1 June), rose without explanation to £70k (20 July) and £160k (29 August), and ended at £20k. Board confidence moved from Neutral to Solid, Strong and Solid. Recovery confidence stayed Limited until the production restore in October, then became Partial.

## `pnpm session` summary

```
Campaign: seed panel-newcomer, ciso, sit-inherited-mess
Played 22.4 min, reached day 364, finished the year

First decision:     day 1, 0.5 min in
First enquiry:      day 1, 2.7 min in
First programme:    day 1, 2 min in
First board paper:  day 91, 13.3 min in

Screens (minutes, visits):
  home             8.2  37
  risk             5.6  14
  inbox            4.7  25
  programmes       1.7  4
  board            1.7  7
  team             0.3  3
  debrief          0.2  3

Glossary opened: never
Lessons dismissed: lesson-evidence, lesson-stakeholder, lesson-investigation, lesson-hypothesis, lesson-risk-scenario, lesson-attention, lesson-assumption
Clock stopped for: decision-deadline ×26, quarter-end ×3, assumption-invalidated ×1, year-end ×1
Skipped ahead: day 2, day 18, day 22, day 38, day 40, day 44, day 45, day 60, day 64, day 70, day 75, day 88, day 90, day 91, day 100, day 120, day 150, day 151, day 160, day 182, day 200, day 230, day 240, day 262, day 273, day 275, day 280, day 294, day 295, day 300, day 318, day 348, day 364

Actions taken:
  markRead                 99
  advance                  33
  resolveDecision          27
  startInvestigation       14
  treatRisk                10
  createHypothesis         9
  dismissTutorial          7
  meetStakeholder          7
  convertHypothesis        3
  completeQuarterReview    3
  markEvidenceRead         2
  startProgramme           2
  acceptRisk               1
  escalateRisk             1
```

The briefing ("home") took the most time. The team screen got 0.3 minutes over the whole year, even though team sustainability was the review's weakest mark.

## Timestamped observation log

Elapsed time is measured from 15:24:45 UTC. Day numbers are the game's own `dN` labels.

| Elapsed | Game point | What happened, and what the persona thought |
| --- | --- | --- |
| 00:00 | Start screen | Clean and readable. The seed note ("the same Nexora for everyone who opens it") is clear. CISO and "The inherited mess" were already checked. |
| 00:13 | d1, 2 Jan | Briefing. The headline band reads "Residual exposure: Moderate", yet all three "top concerns" say "Elevated residual". Mildly puzzling. Chose "Start with your own leadership team" because it felt natural for someone from ops. |
| 00:13–02:48 | d1 | The tip "Evidence is not risk. What you have just received is an observation…" appeared. Not sure what I had just received; the Evidence tab held two items. Started Ransomware resilience (£700k, sponsor Helen Brandt, who owns the risk) and Identity uplift (£850k, sponsor CIO). That left £850k on day one, and it did not feel reckless: "Treats" and "Recovery confidence: Limited" both pointed there. Commissioned vulnerability triage, my comfort zone. The sponsor dropdown has no visible explanation of "Default sponsor". |
| 02:48 | d2, 3 Jan | The CEO wanted her three risks. "Twenty-three minutes is up", on the next day. Gave three with confidence levels. |
| 02:48–04:35 | d18, 19 Jan | Skip ahead jumped 16 days and passed a returned enquiry (13 Jan) without stopping. Chose "Recruit properly £140k" for the vacancies. Formed two hypotheses, raised one as a risk and commissioned a business-service review. Then found 0/5 attention left and could not tell why. The buttons do not say what they cost. |
| 04:35 | d22, 23 Jan | Identity was already "burning out". Platform launch: supported it with conditions; here "Why?" is mandatory. Commissioned a threat hunt (someone had entered credentials in a phish) and control testing. |
| 06:07 | d38, 8 Feb | Three enquiries back. The business-service review returned one line: "Platform launch date is fixed and public." The threat hunt "found nothing new". Vendor 03:40 access: had the SOC hunt it. Briefed Sir Alan ("asks a sharper question than last time", at a first meeting) and listened to Helen ("talks you through what is actually keeping them up at night", but nothing was said). |
| 07:11 | d40, 10 Feb | "Your team is past sustainable load". Bought capacity for £200k. Identity stayed "burning out" afterwards. |
| 07:25–08:08 | d44–45 | Checkout exploit: mitigated at the edge and patched in the window, which felt like my day job. The repeat audit finding: committed to a funded programme with dates. |
| 08:44 | d60, 2 Mar | Legacy warehouse platform: isolated it for £180k, leaving £170k. The "Your year" view offers a big blue **Write up the year now** on day 60 and lists both programmes as "still running at year end". |
| 09:37 | d64, 6 Mar | Standing supplier access: chose the break-glass path for £80k. £90k left. |
| 10:03 | d70, 12 Mar | Board escalation for "Supplier-enabled ransomware across production". I did not recognise the name. I had raised "Supplier privileged access could enable major disruption". Briefed the CEO first. Opened the Risk screen: almost everything said "Review due". Discovered that my programmes had never been linked to the risks they "Treat", and linked them. Accepted "Bulk exposure of customer records" for 90 days, ticking the assumption "There is no adversary currently operating inside the environment" because the hunt had come back clean. |
| 11:24 | d75, 17 Mar | Penetration test scope: two of three options read "Not enough budget remains this year (£90k)" and "(£70k)". Realised I was out of money in March. Regret. |
| 12:35 | d91, 2 Apr | **Q1 board paper.** The dialog says "Leaving out something material does more damage than bringing bad news", so I ticked all seven risks. The only feedback was a toast: "The board sat through a long list… the chair asks for fewer, sharper items next time." It vanished. It was not in Recently or the Inbox, and Board confidence stayed Neutral. |
| 13:38 | d100, 11 Apr | Warehouse containment went live four days after the vendor advisory with no patch. That felt good and connected. Callum's "Where you started" message rewarded the first choice. Kestrel due diligence (£90k) was unaffordable. |
| 14:36 | d120, 1 May | Skip jumped 20 days. SOC renewal: "Renew as-is" was the only affordable option. Engineering was now "burning out" at "3 of 4 days a week". |
| 15:24 | d150, 31 May | Finance asked for £220k. The dialog now says "Only £35k is left uncommitted, so that is all this gives", which is clear. Refused. Spent £25k on a threat-intel review without noticing the price. |
| 16:02 | d151 | Engineering overload again. Buying capacity was unaffordable, so I asked them to push through, since both programmes were over 70% done. A resignation followed on 16 July: clear cause and effect. |
| 16:33 | d182, 2 Jul | **Q2 board paper**, cut to two risks and one recommendation: "The board follows the argument and supports the direction you set out." Board confidence went to Solid. Briefing: "Recovery confidence Limited · Built, not yet verified by a restore", although the Programmes card had shown "✓ Restore tested outside production" since May. |
| 17:10 | d200, 20 Jul | Budget was £70k (it had been £10k); no message said why. Kestrel: quarantine unaffordable, so I refused connection "until due diligence is done", and diligence was unaffordable too. |
| 18:36 | d240, 29 Aug | Budget was £160k, again with no message. "Make the identity controls mandatory": surprised that a "delivered" programme was optional. Enforced now. Spent £90k on Kestrel diligence and £50k on a cloud review. |
| 19:20 | d262, 20 Sep | Both returned "confirmed what you already had, and found nothing new". Nothing told me whether Kestrel could now connect. Card data: fixed it and told the acquirer. Callum's three-week enforcement follow-up was satisfying. |
| 19:42 | d273, 1 Oct | **Q3 board paper**: three risks and two recommendations. Supported. The CEO slipped to Neutral ("You delayed value from the acquisition"). |
| 20:07–20:21 | d275–280 | Took the production restore window and wrote the Corvus access terms into the contract. |
| 20:36 | d294, 22 Oct | **First incident-like event.** Status: "An assumption no longer holds". Inbox: "There is now detected adversary activity inside the environment." Briefing headline: "Nothing is waiting on you today." The threat hunt cost £60k and I had £20k. All I could do was escalate the customer-records risk to the CEO. |
| 21:30 | d300, 28 Oct | Budget decision: "No incident reached the business this year." That came a week after being told an adversary was inside. Made the case with what I had verified. |
| 21:42 | d318, 15 Nov | Next year's priorities: led with the risks I had raised. Follow-ups landed well: restore in 3.5 hours, audit "account matched production", Corvus signed. |
| 22:20 | d364, 31 Dec | Annual review. Skip jumped from 15 Nov to 15 Dec and then to year end; Q4 had no paper. |
| 22:39 | — | Exported the log with **Export log**. |

## Findings, ranked by severity

Each finding gives the screen, the exact text, and what a newcomer is likely to do wrong because of it.

### High

**1. Being told an adversary is inside produces nothing to do, and the game then says the year was quiet.**
- Inbox, 22 October, from "Cyber risk": "There is no adversary currently operating inside the environment." / "There is now detected adversary activity inside the environment." / "The decisions and risks that relied on it need reassessment."
- Briefing the same day: "Nothing is waiting on you today."
- Decision, 28 October: "No incident reached the business this year."
- Review: "Incidents: none reached the business".
- The only investigation that fits, "Targeted threat hunt", cost £60k against £20k left. Nothing in the briefing offered a response.
- A newcomer reads "adversary activity inside" as an incident. With nothing to click, they either panic and wander, or conclude that the message was noise and that detection does not matter. Both are the wrong lesson. The game's real meaning, that an assumption under an accepted risk failed, needs to be said in those words.

**2. The budget runs out in March, and the game says so only in the annual review.**
- Programmes, day 1: "£2.4m of cyber budget remains. Everything still on the table would cost £4.3m, so this is a choice rather than a plan." Two "Start this" clicks spent £1.55m before lunch on day 1.
- The decisions that followed came with £140k, £200k, £180k and £80k prices. By 17 March, options began to read "Not enough budget remains this year (£90k)".
- The review explains it afterwards: "From 17 March, the year offered things the budget could no longer pay for: 5 decisions held an option out of reach."
- A newcomer funds what looks important as it appears. Nothing on day 1 warns that unplanned decisions will also cost six figures. Five later decisions then turn into "pick the free option", Kestrel diligence included.
- "Not enough budget remains this year (£90k)" also reads as if £90k is what remains (I had £50k). "Costs £90k: more than the £50k left" would be unambiguous.

**3. The board-paper guidance pushes toward the list that the board then rejects, and the feedback disappears.**
- Board, Q1: "Choose what goes in front of them. Leaving out something material does more damage than bringing bad news." The dialog also says: "Pick what the committee sees. They will find out about the rest another way."
- I ticked all seven. The result arrived only as a toast: "The board sat through a long list. Unsupported warehouse platform taken out of service, Partner credential abuse reaching internal systems, Material intrusion goes unnoticed and Concentration of business services on one identity platform did not need its time this quarter; the chair asks for fewer, sharper items next time."
- The toast was gone a moment later. It does not appear in Recently or the Inbox, and the board paper is not in Recently either.
- A newcomer who looks away loses the only lesson the Q1 board gives. Even one who reads it learns that the text and the result disagree. No hint says how many items are "sharper".

### Medium

**4. Enquiries rarely say anything a newcomer can act on.**
- Every result began "…answered part of the question and raised others", even with a lead the dialog marked "Has room for this".
- Six of fourteen returned "It confirmed what you already had, and found nothing new". That included the £90k "Technical due diligence on the acquisition" and "Check exposure to the HR provider incident".
- The HR follow-up says only: "The HR provider has confirmed the scope of its incident." It never says what the scope was.
- After the due diligence came back, nothing said whether Kestrel could now connect. The review later recorded "Complete and integrate the Kestrel acquisition: failed · 55d of delay".
- A newcomer reads "nothing new" as "all clear" and stops investigating, or feels that £90k bought nothing. The run never answers whether the HR breach touched Nexora staff.

**5. Attention costs are hidden on the buttons that spend the most.**
- Briefing and Risk › Hypotheses: "Form the hypothesis" and "Raise as a risk scenario" show no cost. Measured: forming one took 1 attention, and raising one took 2 (4/5 to 2/5). The Q1 board paper also took 2.
- Other buttons do show the cost: "Look at it again before deciding 1 attention", "Write the access terms into the contract 1 attention".
- On d18, starting with 5/5, I formed two hypotheses, raised one and commissioned one enquiry. Every other enquiry then read "No attention left this week."
- A newcomer acts on every "Pattern emerging" card the briefing offers, because they look like free insight. Then they cannot commission the work they actually wanted.

**6. Team burnout cannot be fixed, and the screens contradict each other about it.**
- The briefing read "Identity burning out" from 23 January to 31 December. In that time I chose "Recruit properly £140k", bought capacity for £200k, a new identity engineer joined on 20 March, and the identity programme was delivered on 29 July.
- Team, 1 May: Identity "Committed 2 of 4.5 days a week", "Morale Burning out". The briefing said "Your functions have room to take on work, but identity is burning out."
- After the recruiting decision, the Team screen still showed "2 vacancies unfilled" and a **Recruit (£120k)** button, with nothing saying a hire was already under way.
- Review: "Team sustainability: weak … Your engineering and identity functions are spent."
- A newcomer is likely to pay for the same vacancy twice. Or they see spare days on the meter and assume the team is fine. And no visible lever ever moves "burning out".

**7. Starting a programme does not link the risks it "Treats".**
- Programmes lists "Treats: Recovery fails when it is needed". Yet on d70 the risk itself still offered "Link to Ransomware resilience and recovery" and showed "Review due". The same was true of five risks.
- Linking was free. It also made those risks eligible for the Q1 board agenda.
- A newcomer assumes that funding the treatment *is* treating the risk. They leave a register full of "Review due" and wonder why the board agenda looks the way it does.

**8. Budget rises with no explanation.**
- The sidebar "Budget left" went from £10k (1 June) to £70k (20 July) and £160k (29 August). No inbox message, decision or Recently entry mentions it.
- A newcomer cannot tell whether the board's "supports the direction you set out" brought money, so they cannot plan. They will also not think to recheck which locked options have opened up. I found the Kestrel diligence only because I went looking. (The 2026-09-20 report found the same.)

**9. The review credits and blames things the player never connected to their choices.**
- "Prioritisation: strong — What you committed to was what mattered, Build pipeline used as a route into production among it." I only formed a hypothesis on the pipeline. The next bullet reads "Non-production environment as a route into production was among the largest risks you inherited, and nothing you did went near it".
- "Business enablement: … Security programmes you chose to run were part of the pressure on them". Yet the CIO's 21 April message gave other reasons for the cloud slip: "The remaining legacy workloads are harder than the survey suggested and we have lost two engineers to the platform team."
- A newcomer cannot tell which of their choices cost which objective, so the "business paid for it in delivery" headline feels unearned rather than instructive.

### Low

**10. A completed restore milestone sits beside "not yet verified by a restore".** Programmes, 31 May, showed "✓ Restore tested outside production". From 2 July the briefing read "Recovery confidence Limited · Built, not yet verified by a restore". A newcomer concludes the dashboard is wrong, when the real distinction is between a non-production test and a production restore.

**11. Risks change names when they are raised.** I raised "Supplier privileged access could enable major disruption", "One identity platform underpins several critical services" and "A material intrusion could progress unnoticed". They became "Supplier-enabled ransomware across production", "Concentration of business services on one identity platform" and "Material intrusion goes unnoticed". The d70 escalation decision named the new title, and the persona did not recognise it as its own.

**12. A refusal that leads nowhere.** The Kestrel decision (20 July) offers "Refuse connection until due diligence is done". At that moment the diligence enquiry read "Not enough budget remains." A newcomer picks the responsible-sounding option without seeing that it means "never, this year".

**13. Exposure and residual do not agree between screens.** The risk list shows "Elevated residual" while the detail shows "Exposure: Moderate · Consequence: Elevated". On 22 October, "Bulk exposure of customer records" read "Improving since it was first assessed" next to "Exposure: High". On day 1 the headline band read "Residual exposure: Moderate" while every top concern was "Elevated residual".

**14. Stakeholder meetings return stock lines.**
- "Sir Alan Whitcombe follows the argument and asks a sharper question than last time." This appeared at the first meeting, and the same sentence came back for the CEO.
- "Helen Brandt talks you through what is actually keeping them up at night." It never says what that is.
- The CIO's "They remember" listed "You recommended Detection and telemetry modernisation to the board." three times.
- A newcomer stops using Listen and Brief because nothing they learn comes back.

**15. Small text and interface issues.**
- Recently: "Started Identity and privileged access uplift with 850k." has no £ sign.
- Your year, day 60: both programmes are listed as "still running at year end".
- Your year: a primary-blue "Write up the year now" button on day 60 invites a newcomer to end the year by accident.
- The Inbox "Unread" filter shows "Nothing here" once the inbox has been opened, while the badge said 4.
- The vacancies decision on d18 never appeared in Recently.
- Accessibility: the sponsor combobox has no accessible name. Milestone ticks are visual only, so the accessibility tree lists all four milestones the same way. Tab names read "Evidence2" and "Assumptions1".

### What worked

- Consequences of my own choices came back in my own words, and they landed. Examples: "Where you started", the CEO's "She remembered what you said you did not know", the resignation after "push through", the restore "back in three and a half", "the account matched production", and Corvus "signed, with the terms in".
- The warehouse containment went live days before the "no patch" vendor advisory. It was the clearest felt payoff of the year.
- The finance-cut dialog now explains the uncommitted amount ("Only £35k is left uncommitted, so that is all this gives"). The 2026-09-20 report had found that one confusing.
- "Make the identity controls mandatory" taught the difference between built and enforced better than any tip.

## What it taught

What this persona could now explain that it could not before:

- **A risk is a story, not a finding.** "Unsupported warehouse platform taken out of service" is a route plus a consequence plus a statement of how sure you are. A pile of 6,283 vulnerabilities is not a risk until you say what it reaches. Callum's "about a third sit on an isolated development cluster" made that concrete.
- **Built is not the same as working, and working is not the same as mandatory.** MFA was "delivered" in July and still optional in August. Backups were "built" but "not yet verified by a restore" until a production window was taken.
- **Exceptions are how controls decay.** The executive exception request, the 214-account MFA exception register, and "the exception list is a tenth of what it was" after enforcement all made the same point.
- **Supplier access is your access.** Standing Corvus accounts, a questionnaire that was wrong about MFA, then break-glass access, then contract terms.
- **When you cannot fix something, contain it, and plan to survive losing it.** The legacy warehouse platform.
- **Tell the board early, including what you do not know.** That paid off with the CEO and the risk chair.
- **Accepting a risk rests on assumptions**, and the game will tell you when one stops holding.
- **Money and attention are both finite**, and delegating to a loaded team returns thinner work.

What it still could not explain:

- How residual exposure differs from exposure and consequence, and why the headline band can disagree with every top concern.
- Whether the board backing a recommendation gives you money, and where the extra £150k in the second half came from.
- What to do when an adversary is detected. The game's answer was nothing, and then "no incident".
- How to fix burnout once it starts. Recruiting, buying capacity and finishing the programme all failed to clear it.
- Whether an enquiry that "found nothing new" means safe, uncertain or wasted.
- Why detection mattered. It was recommended to the board twice, never funded, and the year still read as "quiet".
- Which of its own choices cost which business objective.

## What this session does not settle

- Human reading time, boredom or emotion. 22 minutes of AI time says nothing about how long a person takes.
- Whether a person would spend the budget as fast. This persona did so in good faith, and the game's day-1 text did not stop it.
- Guided and High pressure modes, the other three situations, other seeds, mobile layout, screen readers.
- No balance or content changes are recommended on this run alone. Findings 1, 3 and 5 are the ones to put in front of a human first: what a person does on 22 October, how many risks they put in the first board paper, and whether they notice where their attention went on a busy week.
