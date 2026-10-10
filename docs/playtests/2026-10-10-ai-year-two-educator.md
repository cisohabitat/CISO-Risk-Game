# CISO: First Year, a second year played by an AI lecturer

**This is an AI-driven session, not a human playtest.** An AI agent played the
second year through the browser driver as a further-education lecturer
weighing the game for a class. It does not count toward Phase 0's human gate.
The first year was played by the engine (`scripts/prepare-campaign.ts
linden-55203 year-end`) and handed over at 31 December.

Build: `985bc06`, copied out of the checkout before play. Driver: port 4402,
1280×800, `/?playtest`. Played 26.7 minutes to day 364 of the second year
(`pnpm session`).

What was done with it is in `2026-10-10-ai-year-two-synthesis.md`.

---

## Report, as received

### Session

- Seed linden-55203, CISO, continued from year one's 31 December.
- Wall clock 02:29:07 to 02:56:03 UTC, 10 October 2026.
- Ran at 1× and stopped at every message, apart from eight seconds at 4× at
  the start. Answered every decision with a reason, started two programmes,
  ran eleven enquiries, filed three papers and held about fifteen meetings.

### Year one, as the review told it

"You built the capability on people who cannot do it again." Identity uplift
100% delivered, two enquiries, three papers, no incident. Four of five
objectives met, Kestrel integration achieved. "Non-production environment as
a route into production … nothing you did went near it." A fifth less budget.

### Timeline highlights

- **2 Jan.** The CFO's "Next year's plan went to the board with a fifth less"
  (good continuity; "next year" is now this year). The CEO's "A year ago I
  gave you twenty-three minutes" (good). "Finish what is half-built" offered
  with nothing running; "Your week 6 of 5 left" after choosing another
  option. The finished identity uplift listed under "Under way". "Two
  vacancies in his team" beside "Fully staffed". Enquiries done last year
  offered again with no note.
- **4× from 2 Jan.** The clock ran to 4 February in about eight seconds,
  through a blocker, and stopped at an incident.
- **20 Jan.** "What came back: A restore, timed from the request." It never
  gives the time.
- **25 Jan.** "Two of the analysts who carried last winter have resigned",
  against year one's SOC "energised, fully staffed".
- **4 Feb.** Incident, customer data exposure. "Open the response log"
  changed nothing on repeated clicks.
- **2 Mar.** "Corvus had to ask … Schedule four did what it says." The best
  callback of the session; "Schedule four" is not explained.
- **22 Mar.** The Organisation screen still says "Last full restore test was
  14 months ago" after a restore in January; "Adoption was never finished"
  of the vault; "Contract renews in month nine" of the SOC.
- **29 Apr.** An enquiry "confirmed what you already had (Platform launch
  date is fixed and public)". The platform launched in year one.
- **15 May.** The register review returned "Risk register entries have not
  moved in 18 months", while Sir Alan remembers "The risk register now
  describes the business as it is."
- **21 May.** Ruth: "Our process today takes about a week", although the
  player notified on day two in February; and "last year's incident".
- **7–21 Jun.** An acceptance ran out; the player re-accepted on the Risk
  screen on 13 June. On 21 June the game recorded "Let it sit on the open
  register" as the decision by default, while the risk showed "Accepted".
- **1 Oct.** The Q3 committee reply listed the February incident as "not on
  the agenda … They will find out another way", though it was in the Q1 and
  Q2 papers.
- **3 Oct to 31 Dec.** No decisions at all.

### Findings: continuity with year one

| # | Severity | Finding | Defect or taste |
|---|---|---|---|
| C1 | High | Kestrel integrated twice; Kestrel text stale | Defect |
| C2 | High | "Last year's incident", twice, after a year with none | Defect |
| C3 | High | Year one's identity work, register review and SOC renewal not reflected in descriptions | Probably a defect |
| C4 | Medium | The resilience redesign leaves no trace; "half-built" with nothing running; a finished programme under "Under way" | Defect in wording |
| C5 | Medium | Launch-year text in four places | Defect |
| C6 | Medium | Enquiries repeat without a note; evidence re-dated "1 Jan" | Dates a defect, repeats taste |
| C7 | Medium | SOC "carried last winter" against an energised SOC and a quiet year | Judgement |
| C8 | Low | Last year's acceptances announced but not shown | Unsure |
| C9 | Low | Every executive starts Neutral | Taste |
| C10 | Low | The same review headline both years | Taste |

### Findings: everything else

| # | Severity | Finding | Defect or taste |
|---|---|---|---|
| F1 | High | The board "will find out" about an incident already in two papers | Probably a defect |
| F2 | High | A decision lapsed by default after the player had re-accepted the risk on the Risk screen | Defect |
| F3 | High | Warnings ten weeks before the incident offered nothing to act on; the cause arrives only at year end | Design |
| F4 | Medium | Risk bands do not respond to events | Judgement |
| F5 | Medium | Objectives missed or achieved with no cause in the year | Mostly taste |
| F6 | Medium | Treatment links only to the finished identity programme | Defect |
| F7 | Medium | Enquiry results and meeting replies say little | Taste |
| F8 | Medium | Messages repeated word for word | Taste |
| F9 | Medium | No decisions in the fourth quarter | Taste |
| F10 | Low | Team signals disagree | Judgement |
| F11 | Low | Response log button, "6 of 5", the silent "Raise as a risk scenario" when attention is short, 4× not pausing for a blocker, "1 decision lapsed and were taken" | Mostly defects, minor |

### Q3 account and the review

> Year 2 was about closing the build-pipeline route … and, after the February
> incident, funding recovery. … The team is the weak point. … The
> payments-diversion risk worries me most.

The review agreed on the team and the partner portal. It disagreed on the
year's purpose (it named the ransomware programme), on resilience ("strong",
where the briefing read recovery confidence "Limited" all year) and on the
Kestrel risk (Low all year, yet "among the largest").

### For a class

Year two adds running an incident, people as a cost, governing an AI tool,
who owns a decision, what the board hears, and delivered-is-not-effective,
with the reconstruction tying the breach back to the risk year one left
alone. Students would get lost on the Kestrel and "last year's incident"
contradictions, risk ratings that do not move, the duplicate decision route,
stale descriptions, jargon ("Schedule four", "tenancy", "peering", "posture",
"workload identity", "extranet") and the summer and fourth-quarter lulls.
Would use it as a facilitated second lesson at 1×. Fixing C1–C3, F1, F2 and
F6 would remove the caveats.
