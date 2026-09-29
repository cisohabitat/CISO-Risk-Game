# CISO: First Year, a New money year played and fixed as it went

## Verdict

The year holds together. A CISO who builds early, spends the new money by
April and answers everything gets a coherent year: the decisions follow from one
another, the follow-ups remember what was chosen, and the close reads the year
back mostly correctly. What the session found was not balance but **honesty
at the edges**:

- a card that promised what it did not deliver;
- a save that lost what the player had just done;
- a reward paid for money that was never there;
- a review line that contradicted the decision record.

Eighteen were found and fixed during play, each with a test that fails
without its fix. The entries are in `docs/FINDINGS.md`.

This is an AI driving a browser, as the earlier four reports were, and it is
not blind: the player read source to diagnose each fault before carrying on.
It says what appeared on screen and whether it was true. It cannot say whether
a person would have noticed, or minded.

## Session record

| Item | Detail |
| --- | --- |
| Build | Local production build, served on a local port and rebuilt after each batch of fixes, so the later months ran on the fixed game |
| Situation and difficulty | New money, short patience; CISO |
| Seed | `sentinel-23976` |
| Method | Chromium through Playwright with a persistent profile, a few days to a few weeks at a time, deciding from the screen |
| Boundaries | Not blind: source was read to diagnose each fault, and saves were reloaded between sessions (which is how the save gap surfaced) |

## What was played

| When | What the player did |
| --- | --- |
| Day 1 | Started with the business services. Commissioned the critical business service review and the architecture review, both to Stefan Alvarez. Started identity (£850k). Ransomware was refused for want of attention. |
| Day 2 | Gave the CEO three risks with confidence stated. |
| Day 18 | Recruited properly; started ransomware resilience (£700k). |
| Day 22 | Supported the launch, with conditions. |
| Days 23–41 | Formed three hypotheses (lost to the save gap; see below). Commissioned a threat hunt on the out-of-hours vendor access. Held the line with the CIO over the identity blocker. Delegated the data holdings review to Fenella Osei. |
| Day 40 | Engineering past sustainable load: bought capacity (£200k). |
| Days 43–60 | Mitigated the checkout exploit at the edge. Committed to a funded programme for the audit finding. Showed the board the plan instead of buying the flagship. Break-glass path for Corvus. Isolated the warehouse platform (£180k). |
| Days 75–109 | Put the legacy estate into the pen test scope. Briefed the CEO before the board on an unseen risk. Refused the executive exceptions. Restricted data lake access. Disclosed the card data to the acquirer. Started cloud security uplift with the last £680k. |
| Q1 paper (day 102) | Two risks, identity and recovery, uncertainty stated. The board followed. |
| Days 120–150 | Renewed the SOC as it stands (no money for the rewrite). Engineering overloaded again; asked them to push through. Refused Finance's clawback with nothing left to give. |
| Q2 paper (day 200) | Three risks, all moderate; "a long list". Refused the Kestrel join until due diligence was done. |
| Days 240–318 | Enforced identity now. Restored into the test tenancy. Wrote the Corvus access terms into the contract. Showed audit production as it is. Argued the quiet year was capability. Led next year's priorities with the risks raised. |
| Q3 paper (day 275) | Two risks, cloud, uncertainty stated. The board followed. |

## Q3 account, recorded before the close

> Identity is done and enforced; recovery is built and restored into the test
> tenancy rather than production; cloud is at 82%. I spent the last of the new
> money on cloud in April, which left nothing for Finance's clawback (refused),
> the SOC re-scope or the Kestrel quarantine (I refused the join instead). The
> platform launch missed its date. No incident yet that I know of. Board papers:
> Q1 and Q3 landed, Q2 was "a long list". I expect board confidence solid,
> residual moderate, and a close that asks about the launch and about going
> broke in April.

## The close, against that account

| Item | The close said | Against the account |
| --- | --- | --- |
| Headline | "You built the capability, and the business paid for it in delivery." Credible first year. | Fair. All five objectives were missed, and the Kestrel refusal cost 55 days. |
| Programmes | 3 started, 3 finished | Right |
| Board | Solid; communication strong | As expected |
| Residual | Moderate | As expected |
| Recovery | Partial, and "Recovery was never exercised" | The second half was **false**: the test-tenancy restore assessed the backups. Fixed. *Partial* for a completed programme is the known ceiling in CLAUDE.md. |
| Prioritisation | Strong, but "Acquisition integration … nothing you did went near it" | **False**: the join was refused until due diligence. Fixed. |
| Team | Engineering burning out, 2 vacancies | Right: the push-through cost a resignation |
| Going broke in April | Not mentioned | The close never remarks that the budget ran out in the first quarter. That may be right, since the year was not worse for it. |

## Found and fixed

The first quarter, day 1 to 22:

- Recruiting an identity engineer bought nothing in half of all years: the briefing's five vacancies, two of them in identity, were not how setup drew them.
- A programme started with idle teams read "Starved of people" until the next day.
- Starting a programme without the attention for it was refused after the click.
- "Your functions are at available."
- The first decisions offered all twelve reasons, among them "the system retires imminently" for where to start.

February:

- **Forming a hypothesis, clearing a blocker, accelerating, hiring or meeting an executive was not saved.** Three hypotheses and a cleared blocker were gone after a reload.
- Every leader "had room" for delegated work that came back thin (1,784 of 1,829 commissions said so).
- The SOC head reported engineering's overload.
- Every thin enquiry blamed "the team was stretched", a third of them while the team was not.

March to May:

- "Link to treatment" was offered and then refused, and named no programme.
- "Review due" never said what a review was.
- The identity programme's blocker was the day-90 decision told early, in 43 of 100 years that start identity early.
- The retention decision quoted a figure only an enquiry finds. A content test now catches any decision that does.

June:

- **Giving back money you did not have earned full thanks.** Most players reach Finance's £220k request with less than that. "Give it up" took the remainder for the whole reward, and the smaller named contribution was strictly worse.
- An option's condition was validated and never enforced, so next year's priorities could be led with programmes the player was not running, and by default.

July:

- "Bring fewer, sharper items" without saying which.

The close:

- The two contradictions in the table above.

## Noticed and left

- **The threat hunt twice.** The out-of-hours decision's "commission a focused threat hunt" is an internal SOC week, while the paid "Targeted threat hunt" enquiry stays on offer beside it. They are different things, but nothing on screen says so.
- **"In their area" does not change the work.** The delegation badge suggests fit matters, but quality reads skill, workload, morale and team strain, not whether the enquiry is in the leader's area. The dialog's copy says who leads changes "how much comes back", which is true, but not for the reason the badge implies.
- **An audit decision without "Regulatory exposure".** The year-end audit follow-up offers seven reasons, and that is not one of them.
- **June was empty.** The skip from 30 May ran to 20 July with one decision. This is already the second known weakness in CLAUDE.md.
- **"Recovery confidence" read *Partial* at the close** after the recovery programme finished at 100% and a restore was run. This is the known ceiling, not a new finding.

## Answers to the protocol's questions

1. **Where did it stop explaining itself?**
   - "Review due" sat on four risks for two months before the player found
     that accepting or linking is the review.
   - The Q2 paper was called "a long list" without saying which items.

   Both now say.
2. **Where did it get boring?** From 30 May to 20 July: two skips and one
   decision. The fourth quarter did not drag. It had six decisions, each
   following up something chosen earlier.
3. **What went unnoticed?**
   - The "Supplier privileged access" pattern was offered on the Briefing
     from February to May and never formed. Other patterns kept taking the
     top slot, so the player formed those instead.
   - The engineering morale note under Team capacity, until the close.
4. **Which decision made the player stop?** The Kestrel join. Quarantine was
   unaffordable after April's spending, so the choice was between connecting
   blind and costing the deal 55 days. That was the one moment where the
   early all-in spending came back as a price.
5. **What did the player think the year had been about?** The Q3 account
   above: building fast and going broke early. The close agreed about the
   building and said nothing about the money. Its headline was about delivery
   instead ("the business paid for it"), which the account had not expected.

**How is the team doing, at Q3?** The account did not mention the team at
all. The Briefing's line that day was "Your functions have room to take on
work", and the close said engineering was burning out with two vacancies. That
is the gap `docs/PLAYTEST.md` describes: an AI read "available" as
"recovered". The note beneath the team reading was on screen and was not
read.
