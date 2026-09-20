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

- **Does the last quarter have anything to do?** This is the highest-value
  question a session can answer, because the route to fixing it is authored
  content on a campaign this project has frozen, and nobody should write that
  content on a hunch. Measured: decisions arrive 11.7, 4.7, 2.5 and 1.3 times
  per quarter, the longest stretch with nothing to decide averages 128 days and
  reaches 164, and the second half sends 42 messages from 24 distinct subjects
  against 104 from 88 in the first. Played by hand the back half is a loop of
  four recycled threat-intel subjects.

  Do not ask whether the ending dragged — nobody says no to that. Watch the
  clock, and watch what they do between decisions: a player with nothing to do
  starts pressing *Skip ahead* repeatedly, or stops opening screens they were
  opening in Q1. Note the day they change gear.

  Then the second half of the question, which is what a fix would have to get
  right. A review proposed that the last quarter should stop asking *what
  organisation have I inherited?* and start asking **what organisation have I
  created, and what must I now change?** — a nearly finished programme facing
  its adoption choice, a temporary acceptance falling due on assumptions that
  have since moved, a service that has outgrown the resilience design it was
  given, pressure to cut next year's budget after a quiet one. Those are late
  decisions arising from the player's own position rather than from the draw.
  After the review, ask what they thought was still unresolved on 31 December.
  If they name something of their own making, the proposal is right and the
  content is missing. If they name nothing, the problem is larger than pacing.

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

## What not to change on playtest feedback alone

- **The bands.** "I want to see the actual number" is the most common request a
  risk game gets and the one thing it must never grant. The whole point is that
  a CISO argues from judgement rather than from a score.
- **The uncertainty.** Players will ask to be told whether a control really
  works. Being unable to know without going and checking is the subject.
- **The pace of consequence.** A decision whose cost arrives four months later
  will feel unfair to somebody who played for twenty minutes. It is not unfair;
  it is the job.
