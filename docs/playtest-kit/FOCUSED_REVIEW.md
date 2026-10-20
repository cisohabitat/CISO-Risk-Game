# Five-player review: does Nexora respond?

Status: ready to run; no participants or human results recorded yet.

Use this focused round before adding stakeholder replies, consolidating routine
mail, filling quiet weeks or expanding replay content. It supplements the
8–12-player pilot in [the roadmap](../ROADMAP.md); five players do not complete
that gate or establish learning effectiveness.

## Set up five first-time players

| Player | Background | Device | Coverage to seek |
|---|---|---|---|
| P01 | Experienced CISO | Desktop | Full year; stakeholder commitments and board feedback |
| P02 | Experienced CISO | Physical iPad, landscape | Independent Inbox panes, quiet periods and follow-ups |
| P03 | Newcomer to the role | Desktop | Full year; understands choices and delayed responses |
| P04 | Newcomer to the role | Physical iPhone, Chrome | Quick swipes, long papers, older mail and returning to a message |
| P05 | No security background | Desktop or their usual device | Opening decision, first enquiry and understanding what comes back |

These are recruitment slots, not completed sessions. All five should be new to
the game. Record role experience separately from experience with this game.
Seek at least two full-year observations, but never rush a player through the
year to meet that target. Offer a continuation session if they want one; an
unfinished year remains useful evidence and must be labelled unfinished.

Book about an hour, including setup and debrief; use the existing 20–40-minute
play window and agree any extension with the player. Follow
[PROTOCOL.md](PROTOCOL.md) and obtain [consent](CONSENT.md), including a separate
choice about local session recording. Do not contact participants or distribute
their notes without the owner's instruction.

Open <https://ciso-risk-game.vercel.app/?playtest>. Record the actual build commit
from About, seed, opening situation, mode, browser, device and orientation in a
copy of [OBSERVATION.md](OBSERVATION.md). Keep the build fixed across this round
where possible; record any change and analyse those sessions separately.

Use a different seed for each initial session. Let players make their own
choices. Do not explain the new Follow-ups filter, decision shortcuts or a
preferred strategy before they play: discovering those controls is part of the
observation. Use the normal protocol's introduction without naming these four
review hypotheses to the player.

## Observe; ask afterwards

Record exact messages and choices, game days, elapsed times, what the player
said and any facilitator assistance. A skip ahead alone is not evidence of
boredom. A response that arrives is not necessarily one the player notices.

| Topic | Observe during play | Neutral questions after play |
|---|---|---|
| Stakeholder follow-through | Commitments made; later replies seen or missed; whether the player connects the two | Which people changed how they worked with you? What makes you say that? Was there a response you expected? |
| Routine correspondence | Specific messages skimmed or skipped; what changed between similar updates; discovery of Follow-ups | Which updates changed your next step? Which did not? Point to examples. |
| Quiet periods | Date range, enquiries/programmes in progress, the player's expectation when advancing time | What were you waiting for, if anything? What did you expect next? |
| Replay | Which strategy the player wants to revisit; observed differences on an actual second run | What changed between these runs? Which choices might explain it, and what did you see that supports that? |

Also capture the opening decision, first enquiry and the player's explanation of
their trade-off without coaching. Report the target of four of five new players
succeeding as a count with a denominator; explain incomplete attempts. Five
first-time players can inform onboarding, but the role-experience subgroups are
too small for separate pass-rate claims.

On phones and tablets record browser chrome, text size and orientation when a
scroll stalls, refresh happens, action is obscured or reading position is lost.
Ask the player to reproduce an observed issue afterwards, rather than directing
their first attempt. Test large text and orientation changes after natural play;
keep those prompted checks separate from unaided observations.

## Compare approaches with returning players

Invite P01 and P03 to an optional second session after their first year. This
means five participants and up to seven sessions, not seven independent people.
Use a fresh campaign with the same seed, opening situation, mode and build.
Keep the original campaign/save; do not overwrite it or use the next-year route
as a strategy comparison, since that carries forward the first year's state.

Let each returning player choose one judgement to revisit and explain their
intended change before starting. Record what they actually change: a different
approach can involve several decisions. Compare replies, business disruption,
programme delivery and review passages they encountered. Do not promise a
different incident or result, or ascribe every difference to a single choice.
Record the comparison point reached; compare matching periods if a run stops
early. Interest in replay is useful feedback but is not an observed replay.

## Turn observations into a small next change

Save pseudonymous notes and consented logs in `docs/playtests/`; keep consent
forms and identifying details out of the repository. Export through the game's
recording control and run `pnpm session <file>` to supply the timeline. A log
shows navigation and actions, not whether a message was read or understood.

Fill this table after the sessions. Keep rows blank until there is evidence.

| Candidate change | Player IDs / build | Exact day, message or choice | Observation and quote | Alternative explanation | Smallest proposed fix | Retest task |
|---|---|---|---|---|---|---|
| Stakeholder follow-through | | | | | | |
| Repeated correspondence | | | | | | |
| Quiet-period guidance | | | | | | |
| Replay differences | | | | | | |

- **Stakeholders first if supported:** two independent players expect a reply
  to a specific recorded commitment and cannot find a meaningful response.
  Check whether a reply exists but is missed before authoring another one.
- **Mail consolidation if supported:** two independent players identify the
  same unchanged update as obstructing useful news. Preserve decisions,
  deadlines, provenance and access to original correspondence.
- **Quiet-period guidance if supported:** two players reach a dated stretch
  without understanding what is in progress or what might return. First make
  existing public progress easier to find. New events require a separate content
  proposal grounded in the observed gap.
- **Replay work if supported:** returning players complete comparable periods
  with deliberately different approaches but cannot identify meaningful
  differences. Inspect reached branches and actual responses before adding an
  organisation or mechanics. Report two paired observations, not four players.

One report raises a hypothesis; repeated independent observations justify a
focused proposal. A reproducible factual contradiction or scrolling defect can
be fixed directly. Do not manufacture consensus, alter balance from this small
sample or upgrade the game's grades simply because this protocol is complete.

For each implemented change, rerun the observed task with players and record
whether the problem persists. Carry findings into [SYNTHESIS.md](SYNTHESIS.md)
when the broader pilot has enough sessions. Record open questions as open.
