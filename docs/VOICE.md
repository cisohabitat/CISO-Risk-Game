# Voice

How *CISO: First Year* speaks. Written from the content as it stands — about
2,300 authored strings in `src/content/nexora/`, and the sentences the engine
composes in `src/game/` — so that a new line, or a second organisation, sounds
like the same game. The plan's tone in one line (§3.3): *professional, modern,
tense, credible.* Below is what that means sentence by sentence.

`tests/content/voice.test.ts` holds the mechanical parts of this guide against
every authored string. The rest needs a reader.

## The stance

**The game reports; it does not judge.** It tells the player what happened,
what someone said, and what is now true. It never tells them whether that was
good. "Nobody outside the warehouse noticed" — not "your investment paid off".
The review is the one place the game weighs the year, and it weighs it in
bands and in the organisation's own terms, never with a score.

**No answer is marked right.** A decision's options carry what a CISO could
foresee, and many of those consequences are two-edged on purpose: "You own the
figure from now on." The game does not mark gains and costs, and copy never
hints which option is better (`docs/FINDINGS.md`, fourth visual round).

**Uncertainty is stated, not hidden.** The player's picture is partial and the
writing says so in passing: "with the caveat that we hunted where we have
telemetry, which is not everywhere." A sentence that knows more than the
player could know is a defect, and several were found and fixed that way.

## People

Every message comes from somebody, with their name and role, and sounds like
that person at work — not like the game.

- **Executives** are brief, direct and about the business. They state their
  position and what they need: "I argued against it and lost, so you may as
  well hear that from me." Each has a temperament fixed in `people.json`
  (impatient with abstraction, protective of delivery dates, wants the
  business case); the lines follow it.
- **The player's leaders** are specialists talking to their boss: precise,
  candid about limits, proposing the next step. "I would like to keep pulling
  this thread."
- **Nobody performs.** No banter, no catchphrases, no villain monologues.
  Threat actors never speak; their work is seen through its traces.

## Sentences

- **British English.** Organisation, prioritise, defence, behaviour, colour,
  programme (a body of work; *program* only for software). `lang="en-GB"`.
- **Plain declaratives.** Short sentences, active voice, past tense for what
  happened and present for what is now true. "The hunt came back clean."
- **No exclamation marks.** Tension comes from what is at stake, not from
  punctuation. A ransomware morning reads "Nexora woke up to encrypted
  infrastructure and a negotiation window."
- **Numbers of things are facts; assessments are words.** 6,283 critical
  vulnerabilities, four hundred rows, 30% above forecast, a programme 73%
  delivered — these are counts and measures someone in the organisation would
  quote, and they may be numbers. Residual exposure, confidence, control
  effectiveness, morale, board standing and recovery are judgements, and they
  are always words (`CLAUDE.md`, "Bands, not numbers").
- **Dates, not day numbers.** "10 August", never "day 221" — anywhere the
  player reads it, including the review and the engine's own messages.
- **Straight quotes and apostrophes** in content (`'`, `"`). The typography
  is the interface's job.
- **Names, not ids.** A sentence never shows `ctl-backup`; content refers to
  things by the name the player knows them by.

## What the game never says

| Never | Because | Say instead |
|---|---|---|
| "Great job", "Well done", "Congratulations" (as the game) | It judges, and it is e-learning | What happened, and who noticed |
| "You should…" (as the game) | It prescribes | What a choice would cost and buy |
| A score, points, a percentage on an assessment | No universal cyber score (plan §2.9) | A band in words |
| "Hackers", "cyber-attack!", "you've been hacked" | Cartoon register (plan §3.3) | The actor's objective and what they did |
| "Click", "tap", "press" in content | Content is the organisation, not the UI | The action itself: "commission", "decide" |
| What the player has not discovered | Hidden truth stays hidden | What they know, with how they know it |

A character may say any of these words in character — the CFO's
"Congratulations on the budget" is sardonic and his — but the game never says
them in its own voice. The voice test therefore checks for them only where the
game itself is speaking: titles, decisions, options, glossary, lessons.

## Consequences

When an earlier choice comes back, the message names the choice in the
player's terms and says what it did, without saying whether it was right.

> The manual fulfilment fallback you funded was exercised last week, for four
> hours, during a planned change that did not go to plan. Nobody outside the
> warehouse noticed.

It arrives from the person who would know, on a day it could have happened
(`docs/CONTENT.md`, "Consequences of earlier choices").

## Teaching

Lessons are one line, shown once, at the moment the mechanic is first in
reach, and they explain the world rather than the controls: "They remember.
The people around you keep a record of how you deal with them." Never "Click
here to…". The glossary defines a term in a sentence a newcomer can follow and
a practitioner would not wince at.

## Checking a new line

1. Who is saying it, and would they say it like that?
2. Does it tell the player only what they could know?
3. Does it judge or prescribe? Rewrite as what happened and what is true.
4. Is any assessment a number? Make it a word.
5. Read it aloud. If it sounds like a training course, start again.
