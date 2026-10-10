# CISO: First Year, a second year re-tested by an AI auditor

**This is an AI-driven session, not a human playtest.** An AI agent played a
second year through the browser driver as a head of security assurance,
checking every claim against what it had seen. It does not count toward
Phase 0's human gate.

**Setup.** Build `552f7f3`, after the second-year fixes
(`2026-10-10-ai-year-two-synthesis.md`), copied out of the checkout before
play. The first year was played by the engine (`scripts/prepare-campaign.ts
fjord-60417 year-end`), so its unread tutorials are the harness's. Driver
on port 4411, 1440×900, `/?playtest`. Played 23.2 minutes to day 364
(`pnpm session`).

**Harness note.** A second agent ran beside it. At the start that agent
overwrote a helper script in the shared scratchpad, so this agent sent one
read, one screenshot and one timed-out click to the other agent's browser
before it noticed. Agents run side by side need separate working
directories.

What was done with it is under **Acted on**.

---

## Report, as received

### Year one, as its review told it

"The business got its year. The security programme did not." No programmes,
two enquiries, three papers, no incidents, all five objectives met, £870k
unspent. Decisions included isolating the legacy warehouse platform, fixing
the card data and telling the acquiring bank, connecting Kestrel, funding a
resilience redesign, writing access terms into the Corvus contract, and
accepting next year's budget cut.

### Year two, in brief

- **2 Jan.** "A fifth less, as agreed" (correct). "Twenty-three minutes"
  recalled. Chose to take on the largest untreated risk; started ransomware
  resilience.
- **13 Feb to 7 Mar.** A customer data exposure. Stood up incident command,
  notified early.
- **2 Mar.** "Corvus … for the first time, had to ask for it."
- **3 Mar and 1 Jun.** "Past sustainable load". Pushed through the first
  time (a resignation followed); stopped something the second.
- **21 Jul.** Ransomware resilience delivered. **12 Nov.** Third-party
  programme delivered.
- **31 Dec.** "You built the capability on people who cannot do it again."

### Findings: continuity with year one

1. **A contract blocker contradicts year one and March.** On 18 October the
   third-party programme was blocked by "The managed service contract does
   not oblige the provider to change how its engineers connect", after year
   one wrote the access terms into the contract and Corvus "had to ask" in
   March.
2. **The out-of-hours blocker repeats a solved problem.** "Removing standing
   access would leave night operations unable to respond quickly", after
   year one removed it and March described a working on-request route.
3. **The supplier access review contradicts March.** On 21 March it returned
   "Provider engineers hold standing administrative accounts … None expire".
4. **This year's acceptance called last year's.** On 3 July "Last year's
   acceptances still stand" named a risk accepted on 2 July.
5. **The card data decision is never reflected.** "Cardholder data appears
   outside the payment environment" came back as a new result in December,
   after year one fixed it and told the bank.
6. **The legacy isolation decision is never reflected.** "Legacy data centre
   can route into production" came back on 26 January.
7. **The resilience redesign left no trace** but a memory.
8. **Year-one assumptions offered again** in the accept dialog: "The cloud
   migration completes to its current schedule."
9. **Year-one evidence comes back as this year's,** including "Incident
   response plan has never been exercised" a month after incident command
   was run.
10. **Morale fell at the year boundary,** from "energised" to "Steady".

### Findings: everything else

11. **Risk text does not follow what was done:** "restores have never been
    timed" after two timed restores.
12. **Organisation descriptions stale in December,** and the list view drops
    the inspector's "When you arrived:".
13. **An assumption that failed never stopped holding.** "The legacy
    platform retires before the end of Q3", with the switch-off due 18
    October, stayed "Needs review" all year.
14. **The review contradicts the player's work.** "A door nobody had looked
    at recently" for a peering the architecture review found eighteen days
    earlier; "Cardholder data … nothing you did went near it" for a risk the
    player raised on 13 October.
15. **Overload messages against the Team screen.** "Has been for a while"
    for a function with nothing committed until the day before.
16. **A stale banner.** "An incident needs you" after the incident closed,
    beside "Nothing is waiting on you today"; the same for "A programme is
    blocked" after the blocker was cleared.
17. **Word-for-word repeats:** "A week to think", "Quiet, for now", "A quiet
    week", "Partner portals: the attempts continue", "Ransomware again in the
    sector", "The portal is being scanned again", "Stolen passwords,
    patiently tried", "The print server again".
18. **Sir Alan's July promise** answered generically.
19. **Q1 committee grammar:** "…and A destructive attack … did not need its
    time".
20. **Small:** every middling enquiry "answered part of the question and
    raised others" whether or not it raised anything; the tab label "Risk
    scenarios , 11"; "recorded day 182" instead of a date; "whatever is still
    being built" with nothing being built; hypotheses citing evidence not on
    the Evidence tab; the first year's review listing 14 of 22 judgements.

### What worked well

The opening of year two remembered year one accurately: the budget cut, the
twenty-three minutes, the executives' memories, "Peak trading, again".
Incident handling read well. "Built, but you have not checked recovery
yourself since" was honest. The restore-window decision, the seventy-two-hour
and AI-assistant threads, and the review's two-year comparison all held.

---

## Acted on

Fixed, each recorded in `docs/FINDINGS.md`:
- 1–3: the supplier blockers and findings the first year had dealt with;
- 4: the carried acceptances;
- 5, 6 and 9: the card data, legacy routing and incident-plan evidence;
- 10: morale at the new year;
- 13: the retirement assumption;
- 14: the "went near it" claim and the breach headline;
- 15: the "for a while" claim;
- 16: the banner;
- 19: the board's list;
- from 20: "raised others", the tab count and the assumption date;
- from 12: the list view's "When you arrived:".

Not fixed:
- 7: the resilience redesign's trace;
- 8: assumptions offered again;
- 11: risk text per state;
- 17: repeated wordings;
- 18: Sir Alan's July line;
- from 20: the commission dialog's fit text and the first-year review's list
  of judgements.

These need authored content or a closer look than one report justifies.
