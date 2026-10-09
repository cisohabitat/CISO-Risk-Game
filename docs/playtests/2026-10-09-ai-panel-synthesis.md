# AI playtest panel, 9 October 2026: synthesis

**AI-driven sessions, not human playtests.** Four AI agents each played one
whole year, in character, through a real browser. None of it counts toward
Phase 0's human playtest gate (`docs/ROADMAP.md`). What an agent found
confusing is a hypothesis about where a person might stumble, not evidence
that one would. The value is in the defects it could point at, quote and
reproduce. Several of those were plain bugs.

## The panel

| Persona | Report | Mode and opening | Device |
|---|---|---|---|
| A curious newcomer from IT operations | `2026-10-09-ai-panel-newcomer.md` | CISO, the inherited mess | laptop, 1440×900 |
| A primary-school teacher with no IT background | `2026-10-09-ai-panel-phone.md` | Guided, the inherited mess | phone, 393×852 |
| A CISO of fifteen years | `2026-10-09-ai-panel-veteran.md` | High pressure, after the breach | laptop, 1440×900 |
| A blind player with a screen reader and keyboard, simulated through the accessibility tree and key presses only | `2026-10-09-ai-panel-keyboard.md` | CISO, a tidy inheritance | 1280×800 |

**Method**
- Each agent drove its own browser through `scripts/playtest-driver.ts`.
  The driver serves a build and takes small commands: read the page, take a
  screenshot, click by role and name, press a key. It has no command that
  reads game state, so an agent knew what a player would know.
- The agents were told not to read the source, the content or the docs.
- Every session ran with `/?playtest` recording on, and each exported its
  log.

**Build**
- All four played the same build, copied to a separate directory from
  commit `dfa8554` before any of the day's changes.
- The four reports say the served build may have included uncommitted
  work, because the checkout changed while they played. It did not: the
  served directory was that frozen copy.

## What the logs say

`pnpm session` over the four logs:

| Measure | Result |
|---|---|
| Year finished | 4 of 4 |
| Median minutes played | 22.6 |
| First decision taken | 4 of 4, median 0.5 minutes in |
| First enquiry commissioned | 4 of 4, median 2.7 minutes in |
| First programme started | 4 of 4, median 3.3 minutes in |
| First board paper filed | 4 of 4, median 11.5 minutes in |
| First skip ahead | median day 2 |
| Glossary opened | 2 of 4 |

Share of time by screen:

| Screen | Share |
|---|---|
| Briefing | 45% |
| Inbox | 18% |
| Risk | 18% |
| Board | 8% |
| Programmes | 7% |
| Debrief | 2% |
| Organisation | 2% |
| Team | 1% |

Three of the four players barely visited the Organisation and Team screens.
Those screens hold what the review's blind spots and team sustainability
are graded on.

## Where the panel agreed

Ranked by how many of the four players hit each problem.

| Finding | Players | Fixed | Fix or reason |
|---|---|---|---|
| Money comes back with no message: £10k became £70k, then £160k | 3 | Yes | The two cancellations behind it ("The cost of a control nobody uses", "Two tools doing the same job") now say the saving returns to the cyber budget, and how much |
| Attention costs are hidden on "Form the hypothesis" and "Raise as a risk scenario" | 3 | Yes | Both buttons show the cost, as decision options already do |
| The board's verdict on a paper is a toast that vanishes | 3 | Yes | The chair's reading of each paper is kept in the inbox as "The committee on your Q*n* paper" |
| A hypothesis looks finished but stays a draft; "Open formally", "Raise" and "raised" read as three different acts | 2 | Yes | The result says it is a draft and where to raise it; one verb, "Raise as a risk scenario", throughout |
| Enquiry results are generic ("confirmed what you already had") | 3 | No | Needs authored findings per enquiry and outcome. Content work, left for a human playtest to confirm it matters |
| The incident has little CISO work in it | 2 | Partly | The reconstruction's "detected almost immediately" was wrong and is fixed (below). The thin incident itself needs authored response decisions (regulator, acquirer, insurer, ransom); not started |
| Executive meetings return the same stock lines | 2 | No | Needs authored replies per person and approach |
| Team burnout never recovers, and the screens disagree about load | 2 | Partly | A hire a decision already paid for now reads "Recruiting", so the screen no longer offers to pay for it twice. How morale recovers is a balance question for a person |
| The budget runs out in March and only the review says so | 2 | Partly | A locked option now reads "Costs £90k, more than the £50k left this year" instead of "(£90k)". An earlier warning is a design question |

## Defects fixed from one report

**Keyboard and screen reader** (`ai-panel-keyboard.md`)
- **Space on a button inside a decision dialog started the clock, and a
  decision lapsed while the dialog was open.**
  - → on the Risk tabs skipped a month per press.
  - A letter typed inside the glossary changed the screen behind it.
  - Fix: no shortcut now fires from a dialog or a focused control
    (`src/app/useKeyboardShortcuts.ts`).
  - Held by `tests/ui/panel-2026-10-09.test.tsx`, which fails with the
    fix removed.
- **A screen change neither moved focus nor said where it went.** Focus now
  moves to the new screen's main region, which is named for the screen. The
  screen also opens at its top.
- **The dependency map named its thirty lines by internal id**, e.g. "Edge
  from node-svc-payments to node-app-paygw". They now read "Nexora Pay
  depends on Payment Gateway", and the boxes carry their system's name.
- **The funding slider could not get back to full funding by keyboard.** It
  stepped from £425k in £10k steps and stopped at £845k. The steps now count
  down from the most it can hold.
- **"Record why first" was disabled, so Tab skipped it** and a keyboard
  player never heard why the decision would not commit. It now stays
  reachable, says what it waits for, and takes the player to the reasons.
- **Buttons that shared a name now carry their item**:
  - "Decide: Out-of-hours vendor access";
  - "Start this: Identity and privileged access uplift";
  - "Commission: Targeted threat hunt";
  - "Listen: Marianne Okafor".

  Deadlines read "Due in 3 days", not "3d". The tab counts read "Evidence, 2",
  not "Evidence2". The executive sponsor select has a name.

**Phone** (`ai-panel-phone.md`)
- **Tapping a card on Organisation or Risk seemed to do nothing**, because
  the detail rendered after the whole list. Where the two are stacked, the
  screen now takes the player to the detail.
- **The "Graph" toggle showed as pressed over a list.** A phone always shows
  the list, so the toggle is hidden there.
- **The Risk tabs hid "Investigate" and "Assumptions" off the right edge**,
  with no cue that they were there. They now wrap.
- **The commission dialog promised "Has room for this" three times to one
  lead**, and all three enquiries came back thin.
  - The dialog read the lead's workload as a lagging average, so work given
    that morning did not count.
  - It now counts the work held and the work being offered.
  - Over three same-day commissions on that seed it reads room, partial,
    thin. The three came back 0.18, 0.35 and 0.26.
- **Programme blockers never reached "Waiting on you"**, and a £120k fix
  looked available with £20k left. A blocked programme is now listed there,
  and a fix the year cannot pay for is disabled with the reason.
- **"5 things need your attention" sat above "Nothing needs an answer"**.
  The empty list now says that the rest is further down the page.

**Practitioner** (`ai-panel-veteran.md`)
- **The reconstruction said "The activity was detected almost
  immediately"** after three weak signals, a month apart, on the exact route
  it then drew. Detection was timed from when the incident reached the
  business, not from when the intrusion began. It now reads, for example,
  "The intrusion raised 3 warnings over 7 weeks before it reached the
  business, and none of them was followed up", and that line comes first.
- **After the breach, the autumn budget letter called the year quiet.** It
  is no longer sent in a year that began after a breach.
- **Governance roles were wrong in places a board would notice:**
  - The extortion demand gave ten days. It now gives three, because a
    personal-data breach is notifiable within seventy-two hours.
  - Paying is now a recommendation to the board, after legal advice and a
    sanctions check, rather than a line the CISO pays from the cyber budget.
  - The chair of the risk committee is no longer offered as a programme's
    executive sponsor.

**Smaller**
- "Recently" said "with 850k" beside a "d19" day code; it now gives money
  and dates.
- "critical criticality" now reads "Critical".
- "There is no mechanically superior answer here." was designer language,
  and is gone.
- An enquiry run by engineering was described as "your architecture lead"'s
  work.

## Not fixed, and why

These need authored content, a design decision or a person's reaction, not
engineering.

- **The incident is thin.** It needs response decisions authored per
  family:
  - the regulator and the acquirer;
  - the insurer;
  - customers;
  - a ransom, put to the board.

  This is the largest piece of work the panel points at. The veteran's "Would
  I use it to train a deputy?" answer turns on it.
- **Enquiry results are generic, and some contradict what the player
  established**, e.g. "I have not tested it" after the player's own review
  had tested it. That needs authored findings and conditions on prior
  evidence.
- **Executive meetings are stock lines.**
- **Many real events have no response**: finance credential resets, public
  buckets, a shadow project. The week offers enquiries, programmes and
  meetings, and no "act now" lever. That is a design question.
- **Every cost lands on the cyber budget, and there is no in-year way to ask
  for more.** Also a design question.
- **A newly raised risk can read "Low" beside impact text describing a
  multi-day payments outage.** The rating is the assessment of what the
  player knows, which is the model working as intended. Whether to show a
  rating before the player has looked is for a person to judge.
- **Single-key shortcuts cannot be turned off** (WCAG 2.1.4). They no longer
  fire from controls or dialogs, which removes the harm the keyboard session
  found. A setting to turn them off is still owed, and only a real
  screen-reader user can say whether it is needed.

## What the panel cannot say

Whether the game teaches itself. Every agent knew what a CISO is before it
started, even the one asked to pretend otherwise. The question in
`docs/PLAYTEST.md` still needs people.
