# AI second-year playtests, 10 October 2026: synthesis

**AI-driven sessions, not human playtests.** Two AI agents each played a whole
second year through the browser driver: an experienced CISO
(`2026-10-10-ai-year-two-practitioner.md`) and a further-education lecturer
weighing it for a class (`2026-10-10-ai-year-two-educator.md`). Neither counts
toward Phase 0's human gate.

**How the second year was reached.** The second year had never been played
through the interface. The driver now takes a save as its last argument
(`docs/PLAYTEST.md`, "AI playtests"). Each agent was handed a first year
played by the engine (`scripts/prepare-campaign.ts <seed> year-end`) and
read its review as their own year.

That engine-played year left every tutorial card open and every piece of
evidence unread. The tutorials replaying, and part of "49 items, all unread",
are the harness's doing, not the game's.

Both played build `985bc06`, copied out of the checkout before play.

## What the logs say

`pnpm session` over the two exported logs:

| | Practitioner | Lecturer |
|---|---|---|
| Played | 24.8 min, to day 364 | 26.7 min, to day 364 |
| First decision | day 1, 2.8 min | day 1, 1.3 min |
| First programme | day 1, 3.3 min | day 1, 1.5 min |
| First board paper | day 91 | day 91 |
| Decisions, enquiries, programmes | 11, 11, 2 | answered every one, 11, 2 |
| Glossary | never | never |

## Where both agreed, and what was done

Every fix below has a test that fails when the fix is reverted, unless
marked otherwise.

| Finding | Both | Fixed | How |
|---|---|---|---|
| The second year re-issued the first year's evidence as current: "1 Jan", unread, and "confirmed" by enquiries | Yes | Yes | Carried evidence is dated "last year" and marked read. Findings a programme fixed, or that only described the year the player arrived (nine, from "Exploit published … this week" to "Platform launch date is fixed and public"), are dropped. A finding an enquiry returns again becomes this year's. |
| Kestrel was integrated a second time | Yes | Yes | The second year's objective is now its own stage: "Move Kestrel's customers onto Nexora's platforms". Due diligence "before it is connected" is first-year only. |
| "Last year's incident" after a year with none | Yes | Yes | The option and its follow-up now speak of an exercise incident. The regulator's letter about last year's incidents still needs one. |
| "Finish what is half-built" with nothing running | Yes | Yes | Now "Deliver before starting more", which is true whatever is running. |
| "Your week 6 of 5 left" | Yes | Yes | Now "5 of 5 left, and 1 extra". |
| The finished identity programme listed "Under way", and dated "1 Jan to 1 Jan" in this year's record | Yes | Yes | Listed as "Delivered in an earlier year", and left out of this year's timeline. |
| A risk could be linked only to last year's finished programme | Yes | Yes | The link offers the programme running now, and a linked risk says what it is linked to. |
| What executives care about still named the launch year | Yes | Yes | Each executive has second-year concerns, and four have second-year priorities. |
| Engineering's overload reported by the head of architecture | One | Yes | The leader whose own function it is speaks for it. |
| A resignation cut capacity but left "Fully staffed" | One | Yes | A resignation is now a departure: a day a week less, and a post to fill. |
| "Recruiting" six months after "about two months" | One | Yes | A countdown set to sixty was never counted down. Recruiting is now read from the hire itself. |
| The resignation came from the SOC whatever had burnt out | One | Yes | It comes from the function closest to breaking. |
| The reconstruction blamed retention that the first year enforced | One | Yes | A choice made in an earlier year counts as made. |
| The board said it "will find out another way" about an incident already in two papers | One | Yes | A closed incident, or a failed assumption, that is already reported is no longer required on every paper. |
| A renewal lapsed to "Let it sit on the open register" after the player had re-accepted on the Risk screen | One | Yes | Answering on the Risk screen closes the renewal decision as the player's own. |
| "Skip ahead" ran past programme blockers | Yes | Yes | A new blocker stops the clock: "A programme is blocked". |
| "Last year's acceptances … the assumptions came across too", naming nothing | Yes | Yes | The message names the risks still accepted. |
| The CFO's "Next year's plan" on 2 January | Yes | Yes | "This year's plan". Not tested. |
| Ruth: "Our process today takes about a week", after notifying on day two | One | Yes | It now says nobody can say how long it would take. Not tested. |
| Dev said "September" for a date the objective set in October | Yes | Yes | It says October now. Not tested. |
| Organisation descriptions describe the estate on arrival ("restore test was 14 months ago") | Yes | Partly | A later year labels them "When you arrived:". Rewriting each description per year is content work. Not tested. |
| "Raise as a risk scenario" did nothing visible without attention | One | Yes | It says how much attention it needs and how much is left. Not tested. |
| "Open the response log" opened one message | Yes | Yes | It is now named for what it does: "Read the latest incident message". Not tested. |
| "1 decision lapsed and were taken" | One | Yes | Grammar. Not tested. |

## Not fixed, and why

- **The incident is thin.** One-line messages, and no regulator, customer or
  board reaction. The same as the 9 October panel, and the same reason:
  authored response content.
- **Recurring signals have no lever.** Phishing, credential dumps, the print
  server and low-confidence anomalies cannot be acted on, and the review
  then counts an unfollowed warning. This is a design question, raised
  before.
- **Messages repeat word for word inside a year.** The recurring messages
  cycle through three or four wordings; a busy year exhausts them. It needs
  more wordings, which the campaign chunk's budget (89.2 of 90 kB) leaves
  little room for.
- **Morale does not recover with rest,** and nothing says why. A balance
  question for a person.
- **Risk text does not change when a control lands** ("uses standing
  privileged access" after it was removed). The statements are authored
  once. Per-state wording is content work.
- **No decisions from October to December** in one year. The quiet back half
  is already a known weakness in `CLAUDE.md`.
- **Leaders' "Watch for" lines were static** ("Two vacancies in his team" once
  they were filled). Fixed afterwards: the two lines that described a state
  ("Two vacancies in his team", "Inherited a stale risk register") are now
  traits that stay true.

## Measured

Over 20 CISO second years (`pnpm ladder transcript ciso y2m-N --years 2`),
before and after:

| Line | Before | After |
|---|---|---|
| "confirmed what you already had" | 22 | 0 |
| "half-built" | 60 | 0 |
| A first-year-only fact ("Platform launch date is fixed", "18 months", "before the previous CISO") | 20 | 0 |
| "Bring Kestrel onto" | 20 | 0 |
| "last year's incident(s)" | 54 | 14, all the regulator's letter, which needs a first-year incident |

`pnpm soak 200 --years 2`: 0 crashes, 0 invariant failures.
