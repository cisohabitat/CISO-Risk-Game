# Owner-supplied Guided four-scenario account — 31 October 2026

Received from the owner in chat. Builds, seeds, exports and participant independence
are unknown. This is one account of four Guided campaigns, including an After the
breach run from the previous night that may overlap earlier reports. The no-lapse
claim applies to the three morning runs. The CISO campaign is still in progress;
no CISO ending is inferred. Do not count these as four independent pilot players.

## Supplied account

I've finished all four Guided runs, and I'm now playing CISO difficulty with
"The inherited mess". On Guided I never let a decision lapse in any of this
morning's three runs, and the review came out consistent from one run to the
next. The best result was a "Credible first year".

| Scenario | Verdict | Objectives | Incidents | Weak spots |
|---|---|---|---|---|
| The inherited mess | Credible ("Tested, and it held") | 3/5 | 1 | Blind spots |
| New money, short patience | Credible | 3/5 | 0 | Blind spots |
| A tidy inheritance | Mixed | 1/5 | 2 | Business enablement, blind spots |
| After the breach (last night) | Mixed | 1/5 | 0 | Business enablement, team |

### What a newcomer learns on Guided

Difficulty is uneven. "New money" was too easy, with £3.6m to spend, no incidents,
every programme finished and about £460k left over. "A tidy inheritance" felt
harsh. Responsible-looking security choices quietly ate into delivery time, and
four objectives finished 89 to 99% done. Nothing during play hinted at that until
the review.

The scenario-specific decisions land well. Two stood out. In "The board wants
something it can see", I showed the plan instead of buying a £300k platform. In
"Your predecessor's numbers", the MFA figure turned out to count staff accounts
only, and I restated it to the board. The review quoted both back.

Blind spots were weak in every run. As a newcomer I commissioned only 2 or 3
enquiries out of about 16, and nothing prompts you to look further.

### Recurring friction

- The inbox reached 180 to 196 messages with over 100 unread, while the briefing
  said "1 thing needs your attention".
- The Q1 board paper only appears in week 15 or 16.
- Budget fell from £3.6m to £2.0m in week 1 with no breakdown of where it went.
- "Recovery confidence" is still unexplained.

### New bugs

- The top "Begin your first year" button ignores the difficulty and scenario
  pickers and always starts CISO with "The inherited mess". It's easy to start
  the wrong game.
- A hard reload can auto-resume an old save instead of showing the start screen.
- Skip ahead on the Briefing jumped from week 48 straight to week 52, and weeks
  also slipped past silently (22 to 29, 31 to 39).
- "Vulnerability triage by exposure" was greyed out with no reason given.
- The board paper says you can add up to two optional updates, but it seemed to
  let me pick only one.

## Source triage

The current top and lower start buttons already share a handler, and startup
lists saves without activating them. Those reported failures were not reproduced
in current-source browser tests. Selected setup and a build ID are now visible.
Vercel inspection found production READY on `b3a54f5`; this does not establish
which code an already-open playtest tab had loaded.

The Right Arrow shortcut still requested thirty days despite the seven-day button.
UI skips now share a central bound and attention boundary; Guided normal time
also holds at each renewed week. Headless rules remain unchanged.

Delivery watch uses public observed progress, not hidden dependency health or a
live grade. Guided exploration prompts identify visible unexamined areas without
an enquiry quota. Week-one ledger defaults open, recovery has inline wording,
triage refusal text is programmatically associated, and agenda guidance quotes
actual optional availability. The Q1 paper opens at day 91 / Week 14; current
engine timing, deadlines, effects and rating weights are unchanged.

The exact four campaigns and difficulty impressions remain unidentified. See
[FINDINGS](../FINDINGS.md) for verification and limits.
