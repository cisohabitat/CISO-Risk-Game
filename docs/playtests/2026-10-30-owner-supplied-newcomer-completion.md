# Owner-supplied newcomer completion — 30 October 2026

The owner first labelled this account CISO and then repeated the same text with
the corrected label newbie. Preserve it as one reported session, not two people.
Build, seed, recording and independence are not supplied. “After the breach”
was reportedly selected through Surprise me; mode is not explicitly supplied.
The account says every choice was read, but also reports 24 of 25 decisions as
the participant's; do not silently count the remaining choice as deliberate.

## Supplied account

> The new newbie playtest got to the end of the year, and this time I read and chose every decision myself. "Surprise me" gave "After the breach" again, and the verdict was "Mixed first year": "You built the capability, and the business paid for it in delivery." Both programmes finished at 100% and no incident reached the business. But Nexora met only 1 of 5 objectives, with four of them landing 10 to 30 days late. Business enablement and team sustainability scored weak. Everything else was solid or strong, and 24 of the 25 decisions were mine.
>
> Fixed since last run
> - Required board paper items are now pre-ticked, and the counter reads "1 selected".
> - A blocked programme now gets a Briefing card and an amber "A programme is blocked" chip, with a "See what clears it" button.
> - The "commit to funding" reply now says plainly that it doesn't buy anything. Its board confidence boost still lands before any money exists, though.
>
> Still there
> - Skip ahead on the Risk screen still lets a decision lapse with no warning at the time.
> - "Record why first" looks like an active blue button once you pick an option, but clicking it does nothing until you tick a reason.
> - Jargon: "Recovery confidence" still has no "?" help, and neither do "break-glass", "assumed-breach test", "quarantined zone" and "change window".
> - Overloaded leaders: you can still give work to someone marked "Too much else on". By week 2 the whole team was saturated, and nothing told me to stop commissioning.
> - Scoring: there's no live score, and "How to judge your year" stays folded away, so a newcomer won't find it.
>
> What overwhelmed this newbie
> - About 16 enquiries are on offer against 6 attention a week, with no hint which ones matter.
> - The "Suggested hypotheses" count climbed to 8 with no guidance.
> - "Raise as a risk scenario" spent 2 attention with no confirmation step.
> - Budget dropped to about £1.1m by April, and nothing explained what that could still buy.
>
> New small bugs
> - One radio option only registered when I clicked its label.
> - "Talk to Priya" and "Brief them" gave no confirmation of what they did.
> - Jo Mbeki, Head of Security Operations, showed as "Not their strongest ground" for the incident response review while the Team screen said "Has room".
>
> What worked well were the teaching moments, like "A thin answer is not a clean bill of health" and the extortion decision. The review explains the year clearly, but "Mixed" is a vague overall verdict for a newcomer.
>
> My top fixes now are making Skip ahead stop for pending decisions on every screen, showing "How to judge your year" open on day one, and adding a nudge when the team is full.

## Triage and limits

- Reproduced in source: Skip only inspected newly arriving updates, not a
  decision already waiting. `stopOnUpdate` now holds before advancing or drawing
  RNG and exposes a review route on every screen. Explicit ordinary time still
  permits deliberate waiting/defaults; no engine deadline is extended.
- Guidance opens in the first week. Reasons use a secondary navigation action
  that scrolls/focuses the real reason. Radio targets are larger and directly
  clickable. Browser checks distinguish a circle click from a label click; the
  unidentified historical radio is not independently reproduced.
- Recovery confidence already had a definition but lacked the metric link.
  Break-glass already had an entry under a longer name; expand matching rather
  than duplicate it. Add assumed-breach, quarantine and change-window definitions
  and surface relevant terms in enquiries.
- Function capacity and leader commitments differ. Briefing/Investigate nudge
  when stretched; commissioning requires acknowledgement of forecast workload
  pressure. Intentional delegation remains possible. Label limited answer
  quality without implying a domain-specialism rule the engine does not have.
- Enquiries and suggested hypotheses are leads, not tasks due today. The
  Guided starter view offers three choices from current affordability and visible
  concern links, with the full menu reachable explicitly. It uses no hidden
  outcome quality or new recommendation score.
  Quote the
  attention cost before raising a risk; cancelling spends nothing, confirmation
  records the actual change. Show an available programme funding example using
  actual remaining budget, not a recommendation or a promise of staffing.
- “Talk to Priya” only navigated to Board. Rename it to describe that route;
  actual meetings show the existing account, observed reactions and attention
  cost in place. No extra relationship effects or simulated messages are added.
- Funding promises remain distinct from purchases; explain that immediate
  confidence responds to the declaration, not funded delivery. Mixed is
  explained without an invented live grade. Keep budget, morale, business
  friction, eight equal assessment weights and stored judgements intact. The
  reported late objectives need an identified campaign for causal reproduction.

Verification and remaining gates are recorded in [FINDINGS](../FINDINGS.md).
