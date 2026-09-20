# Playtesting

The harnesses in `CLAUDE.md` answer whether the game *works*. They cannot answer
whether it *lands*. Everything below is the second question, and it needs people.

What automation already establishes, so a session need not check it: mechanics
fire, play styles diverge, hidden information stays hidden, the difficulty ladder
is monotonic, every authored event and decision is reachable, saves resume, the
year completes, nothing overflows at 320px, and the build stays inside its size
budget. Treat all of that as given and spend the session on what it cannot see.

## What a session is for

Five questions, none of which a test can answer:

1. **Where did they stop understanding?** Not "did they fail" — where did the
   game stop explaining itself. The moment someone reads a screen twice.
2. **Where did they get bored?** Which stretch of the year did they click
   through rather than play. There is a measured suspect and it has its own
   entry below — the fourth quarter. Watch the clock rather than asking, and a
   session that slows down somewhere else entirely is the more interesting
   result.
3. **What did they not notice?** A collision, a pattern offer, an assumption
   failing. Anything the game surfaced and the player walked past.
4. **Which decision made them stop and think?** If none did, the game is a
   quiz. Note the one that did, and what made it hard.
5. **What did they think the year had been about?** Ask before showing them the
   annual review, then compare. A gap between their account and the debrief's is
   the most useful thing a session produces.

## Running one

Half an hour is enough. A first year takes twenty minutes at a normal pace.

- Give them the seed and the difficulty, nothing else. No explanation of the
  mechanics: whether the game teaches itself is one of the things under test.
- Ask them to think aloud. Prompt with "what are you looking at?" rather than
  "what are you doing?" — the second one makes people narrate rather than play.
- Do not answer questions during play. Write the question down; an unanswered
  question is data, and answering it destroys the thing you came to measure.
- Note times, not just events. "Went quiet from about day 120" is worth more
  than "seemed engaged".
- Stop them at the end of Q3 and ask question 5 before they reach the review.

Five sessions is enough to find the things everyone hits. Three is enough to
find the worst one.

## Turning a session into a change

Write findings into the **Known weaknesses** list in `CLAUDE.md` the same way a
measured finding goes in: what was observed, by how many people, and what it
suggests. "Two of three players never opened the Organisation screen" is a
finding. "The UI is confusing" is not.

Then resist fixing it immediately. The failure mode of this project has been
acting on a single reading — a fifteen-seed balance run, a probe that counted the
wrong thing, a pattern notice that turned into a backlog. One player's confusion
is a hypothesis; two players' identical confusion is a defect.

## Questions only people can settle

Everything under this heading is on the list because measuring it has already
been tried and could not answer it. Three of them — the fourth quarter,
executive patience and the risk bands — are open items in **Known
weaknesses**, and a session is the thing standing between them and a decision.
Put them in front of players rather than deciding from a desk.

- **Do the risks all look the same?** Measured, 86% of the risk rows a player
  ever sees read `moderate`, and `high` and `severe` never appear: the bands
  are cut for a wider scale than Nexora's estate produces. The list is ordered
  by assessment within a band, so the top of it is the biggest risk, but the
  words beside the rows say almost nothing. Watch whether the player uses the
  order or the words when they choose what to work on, and ask afterwards which
  risk they thought was the biggest and why. If they say "they all looked the
  same" unprompted, that is the signal to re-cut the thresholds — a tuning
  pass that reaches the board pack, the collisions and the debrief together,
  which is why it waits for a person.

- **Does a pattern offer read as an insight or a menu?** Several propositions
  can be offered on overlapping evidence, because the tag vocabulary is coarse
  and two pairs of templates share most of their tags. The offer now leads
  with the evidence that is actually about the proposition. Watch what the
  player does when two or three are on screen at once: read the evidence and
  choose, or form the top one and move on. If they say the list felt like a
  backlog, the fix is finer tags on the evidence, which is a content pass on a
  frozen campaign.

- **Does the last quarter have anything to do?** This was the highest-value
  open item, and it has now been acted on from a desk: five late-year
  decisions arising from the player's own position — the identity programme's
  enforcement, the recovery programme's restore window, an acceptance running
  out, a platform that outgrew its recovery design, next year's budget after
  a quiet year — and the draw now spreads the calendar-only texture across
  the year instead of spending it by July. Measured, the longest stretch with
  nothing to decide fell from 114 days to 67 for an engaged player, Q3/Q4
  decisions went from 2.8 / 1.4 to 3.9 / 2.8, and the second half of the
  inbox went from 54 / 55 distinct subjects a quarter to 94 / 94. What the numbers cannot say is whether the back
  half now *feels* like the year building to something or like more of the
  same. Ask where they stopped reading, whether the identity or restore
  question felt like their own programme coming back to them, and whether the
  budget conversation landed as a consequence of the year or as a random
  event. If the answer is "more of the same", the next lever is the event
  draw, which is frozen.
- **Does "Guided" read as a tutorial?** The reviewer's point was that it is not
  one — it is the full simulation with more organisational capacity and clearer
  signals — and that the name may undersell it to the experienced players most
  likely to pick it up. They suggested "Supported" and then declined to change
  it without testing. So test it: ask which mode a new player picks and why,
  before they play, and whether the name matched what they got afterwards. Do
  not rename on one person's word.

- **Should hard mode cost the business its year?** `executiveTolerance` is
  meant to make high pressure less patient, and measurably stops doing so after
  about week seven. Bounding it works, but only high pressure ends up paying,
  and over 40 seeds it went from missing 1.38 business objectives a year to
  2.40 — figures taken before a later change moved the baseline, so treat the
  direction as established and the size as unverified. Ask a player who has
  finished a high-pressure year whether the executives felt harder to work with
  than on CISO, and whether missing half the business objectives would read as
  the mode being hard or as the mode being unwinnable. That answer decides
  whether to bound the dial and move the 0.45 friction threshold with it; the
  experiment gets re-run either way before anything ships.

- **Does High Pressure feel noisier or harder?** The worry was that the mode
  might buy difficulty with inbox volume rather than with strategy. The
  measurement says it does not — 150, 158 and 163 messages a year across the
  ladder, a flat routine share, and the growth all in critical messages,
  decisions and incidents — but what the numbers cannot settle is whether it
  *feels* that way at 11pm on a Tuesday. Ask where they stopped reading their
  inbox, and whether the last third of the year felt like more to handle or
  less to go on.

## Sessions so far

- `playtests/2026-09-20-ai-browser-session.md`: an AI-driven browser session
  on the live site, following this protocol. Not a human, and it says so; its
  concrete findings were verified in the source and are closed in
  `FINDINGS.md`, its tuning questions were left where they were.

## What not to change on playtest feedback alone

- **The bands.** "I want to see the actual number" is the most common request a
  risk game gets and the one thing it must never grant. The whole point is that
  a CISO argues from judgement rather than from a score.
- **The uncertainty.** Players will ask to be told whether a control really
  works. Being unable to know without going and checking is the subject.
- **The pace of consequence.** A decision whose cost arrives four months later
  will feel unfair to somebody who played for twenty minutes. It is not unfair;
  it is the job.
