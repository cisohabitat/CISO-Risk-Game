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
   through rather than play. There is a measured suspect: decisions arrive
   11.7, 4.7, 2.5 and 1.3 times per quarter, and the second half of the year
   sends half as much mail from a quarter as many distinct subjects. Do not
   lead the witness — watch the clock and see whether they slow down where the
   numbers say they should. A session that does not is the more interesting
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

## Two questions a review raised that only people can settle

A comparative read of all three modes ranked them CISO, then High Pressure,
then Guided, and left two things it explicitly would not act on without real
players. Both are worth putting on the list rather than deciding from a desk.

- **Does "Guided" read as a tutorial?** The reviewer's point was that it is not
  one — it is the full simulation with more organisational capacity and clearer
  signals — and that the name may undersell it to the experienced players most
  likely to pick it up. They suggested "Supported" and then declined to change
  it without testing. So test it: ask which mode a new player picks and why,
  before they play, and whether the name matched what they got afterwards. Do
  not rename on one person's word.

- **Is the budget difference felt, or only the incidents?** Playing one
  philosophy across all three modes, the ladder landed entirely on the threat
  side — incidents 0.47 / 0.93 / 1.47 a year, worst consequence 0.17 / 0.33 /
  0.51 — while the budget difference never bound, because a player who builds
  one programme at a time never runs out. Guided ended 41% of its budget
  unspent. So ask what they did with the money, and whether they ever wanted
  something they could not afford. If nobody ever hits the budget wall, the
  25%/90% multipliers are doing less than the table suggests.

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
