# Owner-supplied 15-run matrix on f364f2e — 17 November 2026

Fifteen fresh-seed campaigns on `f364f2e` (run 15 replays run 7). Who played,
and whether by hand or by an agent, is not supplied.

Confirmed fixed since `535a241`: the CEO's three risks prompted in every run;
no duplicated board responses in any run; headlines varied (six lines); the
comparison table, the setup budget, single recorded costs and a one-campaign
session log all held.

## What was checked and done (17 November)

- **"Seed replay diverged (regression)": not a regression.** On the engine,
  one seed played with the same choices on the same days ends byte-identical
  whether time moves a day at a time, a week at a time or by Skip ahead.
  Starting one programme a day later gives a different year (in the probe, no
  incidents at all). Run 15 unblocked the ransomware programme on 21 Apr
  against run 7's 20 Apr, which is enough. A seed reproduces a year for the
  same choices on the same days, not for different ones.
- **A programme held for months by "A change freeze over the quarter close"
  (runs 6, 13): fixed.** Its own text says it lasts until the quarter's books
  are closed, but only the player's action cleared it. Blockers can now carry
  `liftsAtQuarterEnd`, and this one does: it lifts on the quarter boundary,
  with a history line (`tests/engine/quarter-freeze.test.ts`, failing without
  the fix).

Left, with the reason:

- **Two incident decisions lapsing at 4× (run 10):** each incident decision
  stops the clock when it opens and again the day before its deadline; a
  speed pressed through both lets the organisation decide. No defect found.
- **"After the incident" only after the first incident (runs 12, 13):** the
  reflection decision is once a year by design (`oncePerCampaign`), on the
  latest closed incident. One per incident would need a new condition; the
  owner's call.
- **Cost-cutters at 5/5:** as recorded on 16 November, balance waits for a
  human playtest.
- **"A quiet year that bought the organisation real capability" in five
  runs:** all five were incident-free years with programmes delivered, which
  is what it says.
- **Board-paper hold "intermittent" on High pressure:** Skip holds once per
  paper; runs 9 and 14 skipped after that hold, inside the paper's window.
- **"Audit promise still unfunded on 26 May", the day it was funded:** the
  message fired at the start of that day, before the funding.
- **As before:** the 90-day renewal, Q1 "submit by 1 July" (a quarter's paper
  goes to the next quarter's committee), "Jump to your reasons" as a jump
  link, weekly holds at speed, inbox volume, emergency incident spending
  allowed beyond budget while ordinary options are not, licence refunds in
  the budget ledger.
