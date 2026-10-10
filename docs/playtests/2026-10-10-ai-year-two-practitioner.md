# CISO: First Year, a second year played by an AI practitioner

**This is an AI-driven session, not a human playtest.** An AI agent played the
second year through the browser driver, in character as an experienced CISO.
It does not count toward Phase 0's human gate (`docs/ROADMAP.md`). The first
year was not played by the agent: it was played by the engine
(`scripts/prepare-campaign.ts quay-31907 year-end`) and handed over at
31 December, so the agent read its review as its own year. What the engine's
year left undone is the engine's, not the agent's: every tutorial card was
still open, and every piece of evidence was unread.

Build: `985bc06`, copied out of the checkout before play. Driver: port 4401,
1440×900, `/?playtest`. Played 24.8 minutes to day 364 of the second year
(`pnpm session`). The agent's running notes and screenshots were not kept in
the repository.

What was done with it is at the end, under **Acted on**.

---

## Report, as received

### Session

- Seed quay-31907, CISO. Continued from 31 December of year one; played year
  two from 2 January to 31 December.
- Wall clock 02:29:07 to 02:53:09 UTC, 10 October 2026.
- Moved through time mostly with "Skip ahead", which jumps up to a month or
  to the next decision. Read every inbox message.

### Year one, as the review told it

- "A year spent acting on a picture you never verified." Rated "Credible
  first year".
- One programme, the identity uplift, 100% delivered. Two enquiries. Three of
  three board papers. No incident reached the business.
- All five objectives met, including "Complete and integrate the Kestrel
  acquisition".
- "Nothing happened this year, so you agreed to start next year with a fifth
  less."
- Decisions included: removing standing supplier access, connecting Kestrel on
  schedule, enforcing identity controls, funding a resilience redesign,
  writing access terms into the Corvus contract, enforcing the retention
  policy.

### Findings: continuity with year one

1. **Year two treats year one's opening evidence as current.** The Evidence
   tab started year two with 49 items, all dated "1 Jan" and all unread,
   including "Platform launch date is fixed and public", "Exploit published …
   this week", "Provider engineers hold standing administrative accounts",
   "Five security vacancies … before the previous CISO left" and "Risk
   register entries have not moved in 18 months". Enquiries then "confirmed"
   them: "It confirmed what you already had (Platform launch date is fixed and
   public…)". This contradicts the game's own memory: Sir Alan's "The risk
   register now describes the business as it is", and Jo's "Corvus … for the
   first time, had to ask".
2. **Kestrel is integrated twice.** Year one achieved it and connected it.
   Year two makes "Bring Kestrel onto Nexora's systems" a new objective, and
   offers "Technical due diligence on the acquisition: Examine Kestrel
   Digital's estate before it is connected to Nexora's."
3. **"Last year's incident", which did not happen.** The 21 May option reads
   "exercise it against last year's incident"; on 5 July Ruth says "We ran the
   new reporting process against last year's incident as an exercise." The
   year-one review said "Incidents: none reached the business".
4. **The first decision assumes programmes are half-built.** "What this year
   is for" offers "Finish what is half-built — Put the year behind the
   programmes already running". None was running.
5. **The incident reconstruction blamed retention that year one enforced:**
   "What hurt: Data held longer than the retention policy allowed".
6. **Risk text and treatment links do not reflect what was done.** Supplier
   ransomware keeps "uses standing privileged access" and could only be
   linked to the finished identity programme, not the ransomware programme
   that lists it under "Treats".
7. **What executives care about never moves.** Priya: "Anything that delays
   the launch". Nadia: "The SOC contract renewal". The map still calls the
   platform "the focus of this year's growth plan".
8. **The year-one programme in the year-two record:** "Identity uplift: 1 Jan
   to 1 Jan, completed".
9. **The tutorial replays in year two.**
10. **Not clearly carried over:** the resilience redesign funded in year one;
    "Last year's acceptances still stand", with nothing matching on the
    Assumptions tab; leaders showing "0 delivered".
11. **Small wording:** the CFO's "Next year's plan" on 2 January.

What carried over well: the CEO's "A year ago I gave you twenty-three
minutes", the budget cut being honoured, Sir Alan's three adopted risks
revisited at half-time, "Corvus had to ask", "Peak trading, again", "The
print server again", the executives' memories, and the review's opening
comparison of the two years.

### Findings: everything else

1. **The wrong person reports engineering overload.** On 1 June Stefan
   Alvarez, Head of Security Architecture, writes "Engineering is running
   above what my people can sustain". Engineering is Callum's team.
2. **The team's numbers disagree.** After the 16 July resignation,
   engineering capacity falls from 4 to 3 days a week but reads "Fully
   staffed". Callum's card says "Has room / Engaged" while his function is
   "Burning out".
3. **Morale does not recover with rest,** and nothing says why.
4. **Messages repeat word for word within the year:** "A week to think",
   "A programme is on plan", "Quiet, for now", "Ransomware again in the
   sector", "The portal is being scanned again", "Partner portals: the
   attempts continue", "Background noise on the partner portal", "The print
   server again".
5. **Recurring signals with no lever:** finance phishing, credential dumps,
   the print server, a "Low-confidence anomaly" that the review later counts
   as a warning not followed up.
6. **The incident is thin:** one-line messages, "Open the response log"
   opening nothing more, no regulator or board reaction.
7. **"Skip ahead" passes blockers** until a later message mentions them.
8. **"Your week 6 of 5 left"** after the first decision.
9. **A linked risk stays "Due now" all year** with no review action.
10. Smaller: "Brief them" gives one reply; Dev gives September and October
    for the same date.

### Q3 account, written on 1 October, and the review

> My second year has been about closing the two routes my first year left
> open: the build pipeline into production, and supplier-borne ransomware
> with untested recovery. … The team delivered but paid for it. … The risk
> that worries me most is recovery.

The review agreed on the theme ("Your clearest investment was Ransomware
resilience and recovery"), on the team ("You built the capability on people
who cannot do it again") and on engineering being spent. It disagreed on
identity (spent, where the player thought it had recovered) and rated
resilience "strong" where the player rated recovery the largest worry. What
hurt was a route the player thought the cloud programme had treated.

### Would play a third year

Yes, for the people and the decisions. Year three should start from the
state the previous year left, let risk text change when a control lands, give
recurring signals a lever, make an incident weigh with the board, show how a
burnt-out team recovers, and stop repeating messages word for word.

---

## Acted on

See `2026-10-10-ai-year-two-synthesis.md`.
