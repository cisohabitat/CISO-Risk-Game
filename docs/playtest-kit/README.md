# Playtest kit

Phase 0 of `docs/ROADMAP.md`: everything needed to run a session with a person
and turn it into evidence. The method — what a session is for, how to run it,
what not to change on one player's word — is in `docs/PLAYTEST.md`. This folder
is the paperwork around it.

| File | Use it |
|---|---|
| `PROTOCOL.md` | The facilitator's one page: before, during, after, in order |
| `CONSENT.md` | Read to the player, or hand over, before they begin |
| `OBSERVATION.md` | Copy once per session and fill in while they play |
| `SYNTHESIS.md` | Fill in once, after every eight to twelve sessions |

## The session log

The game can record a session on the player's own device and hand it over as
a file. Nothing is sent anywhere.

- **Turn it on** with the facilitator's link, the game's address with
  `?playtest` on the end (for example `https://ciso-risk-game.vercel.app/?playtest`).
  The player sees "Record this session for a playtest" already ticked under
  **Replay settings** on the start screen, and can untick it.
- **While it runs**, a red dot and "Recording this session for a playtest" sit
  at the foot of the left-hand rail (under **More** on a phone), with
  **Export log** and **Stop and export**.
- **At the end**, press **Stop and export**. The browser saves
  `ciso-session-<date>.json` and clears the log, so the next player on the same
  device starts their own.

What it records: the campaign's seed, mode and situation; every screen opened;
every action taken (decisions, enquiries, programmes, board papers, lessons
dismissed, speed changes and skips ahead, but not the clock's own daily ticks);
every time the clock stopped and why; every glossary entry opened; the end of
the year. Each line carries the game day and the time since the log began.
What it never records: a decision's optional typed note, or anything else the
player typed.

## Reading a log

```
pnpm session path/to/ciso-session-2026-10-09.json
```

prints the measures `docs/ROADMAP.md` asks Phase 0 for: minutes to the first
decision, enquiry and programme; the day reached; the screens visited and how
long was spent on each; glossary entries opened and lessons dismissed; where the
clock stopped them; skips ahead, with the day of each; and whether the guide
was opened (only if the facilitator noted it — the log cannot see another tab).

Copy those figures into the session's observation sheet; they are the timeline
the notes hang on.
