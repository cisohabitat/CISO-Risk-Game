# Session protocol

One page for the facilitator. The reasoning behind each step is in
`docs/PLAYTEST.md`; this is the order to do them in.

## Before (10 minutes)

1. Pick the player's group: **an experienced CISO**, **a newcomer to the
   role**, or **someone with no security knowledge**. Phase 0 wants three to
   four of each.
2. Pick the seed and mode in advance and write them on the observation sheet.
   Use a fresh seed per player unless the session is a comparison.
3. Open the game with the facilitator's link (`/?playtest`) on the device the
   player will use. On a phone, check the log control appears under **More**.
4. Copy `OBSERVATION.md` and fill in the header.
5. Read or hand over `CONSENT.md`. Do not start without a yes.

## Briefing the player (2 minutes)

Say only this:

> You have just become the head of cyber security at a company called Nexora.
> Play your first year however you like. Please think aloud — say what you're
> looking at. I won't answer questions while you play, but write them down
> or say them anyway; they're useful. There's a guide linked in the game;
> please leave it until the end unless you're truly stuck.

Do not explain any mechanic. Do not name the difficulty modes' differences.

## During (20–40 minutes)

- Prompt with "what are you looking at?", never "what are you doing?".
- Answer nothing. Note every question, with the game day.
- Note times and days, not impressions: "skipped ahead without reading, day
  120" beats "seemed bored".
- Mark on the sheet: first time they open each screen; first decision; first
  enquiry; first programme; every time they open the glossary or the guide;
  every skip ahead; every decision they hesitate over and why.
- **At the end of Q3** (the clock stops at the quarter end around 30 September),
  pause them and ask the three Q3 questions on the sheet *before* they see the
  annual review.

## After (10 minutes)

1. Let them read the annual review. Ask them to point at any sentence they
   disagree with.
2. Ask the closing questions on the sheet, in order, and write the answers
   verbatim.
3. Press **Stop and export** in the game. Save the file beside the sheet.
4. Run `pnpm session <file>` and paste the figures into the sheet.
5. Within a day, write the session up in `docs/playtests/` in the existing
   format: what was observed, at what day, by this player. Nothing fixed yet —
   see "Turning a session into a change" in `docs/PLAYTEST.md`.
