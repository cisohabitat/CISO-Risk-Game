# Teaching with CISO: First Year

For a lecturer, trainer or team lead running the game with a group. Phase 6
of `docs/ROADMAP.md`. Everything here works with the game as it is hosted:
no accounts, no installation, nothing sent anywhere.

## What it teaches, and what it does not

The game is about the judgement of a security leader, not the technology: an
inherited picture that is partly wrong, too little attention to check it all,
executives who want different things, and a board that hears what you choose
to tell it. Students leave having made trade-offs and seen them come back.
They do not leave knowing how to configure anything.

It is one organisation (Nexora Group, a payments and retail business) and
one year, about twenty to forty minutes of play.

## The key idea for a class: one world, different years

A **seed** fixes the hidden world: which awkward dependencies exist, how good
the controls really are, what the executives are like. Give a whole class the
same seed and they all inherit the same Nexora. What happens next depends on
what each of them does — so a debrief can put two years side by side and ask
why the same estate went two ways.

Send a link and everyone starts on the same year:

```
https://<where the game is hosted>/?seed=class-2&mode=ciso
```

The start screen says the link chose the year, and shows the seed. Without
`&situation=` it opens in the first situation, *The inherited mess*, which is
what the cohort below was played in. To give the class a different start, add
one of `sit-inherited-mess`, `sit-after-breach`, `sit-new-money` or
`sit-tidy`, and re-run the cohort with it (`pnpm cohort 30 ciso class
sit-after-breach`) before relying on the table.

## The cohort

`pnpm cohort 30 ciso class` played thirty seeds in *The inherited mess* as a
light, engaged year (answer what is asked, file each board paper, run the
identity programme, commission two enquiries), and the same seeds again with
a player who does nothing. On 9 October 2026:

| Seed | Played engaged | Played idle | Use it for |
|---|---|---|---|
| `class-6` | No incident; credible year | No incident | **The quiet year.** Nothing goes wrong. Does anyone notice what they never checked? The review's blind spots are the lesson. |
| `class-4`, `class-27` | No incident; mixed year | No incident | More quiet years, for a comparison group. |
| `class-9` | Data exposure 24 July | Data exposure 20 July | **The steady year.** The same summer incident whatever the student does: compare how ready each was. |
| `class-25` | Ransomware 4 July, data exposure 18 July | Ransomware 16 July, data exposure 5 August | **The crisis year.** A summer ransomware either way; the difference is what was ready for it. |
| `class-2` | Ransomware 3 April (severe) | Data exposure 20 November | **The comparison year.** The same world gives an engaged player an early ransomware and an idle one a late data exposure. Put two students' reviews side by side. |
| `class-28` | Data exposure 29 January and 11 September | Data exposure 16 May, 6 August, 17 November | **The data year.** The same weakness, again and again: did anyone close it? |

Treat the dates as typical rather than promised: a student who plays
differently meets a different year, which is the point. Re-run
`pnpm cohort` after any change to the game before relying on the table.

## A ninety-minute session

| Time | What happens |
|---|---|
| 0–10 | Introduce the role in two sentences: "You are the new head of cyber security at Nexora. You cannot fix everything; decide what matters." Send the seed link. Ask them not to open the guide yet. |
| 10–45 | Play. Pause the room at the end of each quarter (the game stops itself when a board paper is due) for one question from the list below, two minutes, no answers given. |
| 45–55 | Finish the year. Each student reads their own annual review. |
| 55–80 | Debrief in pairs, then the room: the questions under "After the review". Students on the same seed compare reviews; **Share this year** copies a summary with the seed link, and **Print or save as PDF** makes a page to hand in. |
| 80–90 | What would you do differently in year two? Then, if there is time, "Start another year". |

Two forty-five minute sessions work as well: stop at the end of Q2, save
(the game keeps the campaign on the device; **Export this campaign** on
**Your year** makes a file if they will change machine), and resume next time.

## Questions by quarter

Ask one at each pause. Do not answer; the review will.

**End of Q1 — knowing.** Which of the risks on your list have you checked
yourself, and which are you taking on someone's word? How would you tell?

**End of Q2 — choosing.** What have you not funded, and who will notice
first? What did the board hear from you this quarter, and what did they not?

**End of Q3 — people.** How is your team? (Ask before they look.) Which
executive trusts you least, and what did it cost you?

**End of Q4 — the year.** In three sentences, what was your year about? Write
it down before reading the review.

### After the review

- Which sentence in the review did you disagree with? Was the review wrong,
  or did it see something you did not?
- Where did your attention go, and was that where the risk was?
- Was there an incident? What helped, what hurt, and which of those did you
  choose?
- Students on the same seed: why did the same organisation give you different
  years?
- What did you learn about the job that you did not know at the start?

## Practicalities

- **Devices.** Any current browser, phone to desktop. Saves stay on the
  device used; a shared lab machine keeps each campaign until it is deleted.
- **Time.** CISO mode, a first year, takes most people twenty to forty
  minutes. Guided is gentler; High pressure is for people who have played
  once.
- **Assessment.** The game has no score, deliberately. Assess the reflection:
  the three-sentence account against the review, and the year-two plan.
- **The guide.** `/guide` explains every screen. Hand it out after the first
  session, not before: whether the game teaches itself is part of what
  students experience.
- **Recording a session** for research or a playtest: `/?playtest` turns on a
  local log the student exports at the end (`docs/playtest-kit/`). Ask first;
  the consent note is in the kit.
