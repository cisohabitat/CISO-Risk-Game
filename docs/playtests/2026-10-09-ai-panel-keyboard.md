# CISO: First Year, keyboard and accessibility-tree playtest

**This is an AI simulating keyboard and accessibility-tree use. It is not a screen-reader user.** The tree is roughly what a screen reader exposes. It is not what NVDA, JAWS or VoiceOver actually say, and browse mode, focus mode and the reader's own key handling were not exercised.

**This session does not count toward the human playtest gate.** It does not replace a test with real assistive technology. Each finding below is a hypothesis for a human AT session to confirm or reject.

## Session and evidence boundary

> **Editor's note (build):** the driver served a copy of the build made from `dfa8554` before any of the day's changes, in a directory of its own, so the uncommitted work in the checkout was not in the game this session played. See `2026-10-09-ai-panel-synthesis.md`.

- Build: commit `dfa8554` (HEAD of the checkout). The working tree also had uncommitted changes, and this session cannot say whether the served build included them.
- Driver: `localhost:4341`, serving the game at `localhost:5341`. Start URL: `/?playtest&seed=panel-keyboard`.
- Setup: CISO difficulty (the default) and **A tidy inheritance**, both chosen by keyboard (Shift+Tab into the radio group, then ArrowDown ×3). Playtest recording was on.
- Persona: a blind keyboard-only player. Input was limited to Tab, Shift+Tab, Enter, Space, the arrow keys, Escape and End. Output was limited to the `read` (accessibility tree) and `focused` commands.
- **`click`, `clickText` and `check` were never used.** No task needed a mouse workaround.
- Screenshots were taken only as evidence and were never used to navigate.
- Harness limitation: `focused` reports an empty name for `<input>` and `<textarea>` elements. Accessible names for radios, checkboxes, the slider and the text box come from `read`, which reports them correctly.
- Harness behaviour: navigation used small scripts that press Tab or Shift+Tab until focus reaches a named control. The counts below are those presses. A few counts include wrap-arounds caused by the script's own overshoot; these are marked and are not used as task costs.
- No source, content, docs or tests were read. The only repository file opened was the earlier playtest report, as a format example. After the year was over, the in-game `/accessibility` page and the `/guide#keyboard-shortcuts` table were read in the browser, as a player could.
- Timing (UTC, 9 October 2026):

| Clock | Elapsed | Game point | What happened |
|---|---|---|---|
| 15:24:45 | 0:00 | start screen | Opened `/?playtest&seed=panel-keyboard` |
| 15:25:09 | 0:24 | day 1, 2 Jan | Pressed **Begin your first day**; focus landed on `body` |
| 15:26:46 | 2:01 | 6 Jan | First decision committed. The clock had been started by Space without my knowing, and the CEO's "three risks" decision lapsed on 4 Jan |
| ~15:28 | ~3:15 | 6 Jan | Identity programme started |
| 15:31:00 | 6:15 | 5 Feb | Control testing commissioned. Four → presses on the Risk tabs had advanced the clock from 6 Jan to 5 Feb, and "Security conditions on the platform launch" lapsed on 30 Jan |
| ~15:36 | ~11:30 | 2 Apr | Q1 board paper |
| 15:42:58 | 18:13 | 22 Jul | Incident (1–22 Jul) closed |
| 15:46:58 | 22:13 | 31 Dec | Annual review |
| 15:47:34 | 22:49 | review | Log exported with **Export log** |

## Outcome

The year **was completable by keyboard alone**. The annual review read **Credible first year** and led with **"You built the capability on people who cannot do it again."**

| Measure | Result |
|---|---|
| Decisions | 26 taken, 3 decided by default. Two of the three lapsed because global shortcuts moved the clock during normal keyboard use (S1, S2). The third is covered in M4 |
| Programmes | 1 started (Identity), 1 completed (100%) |
| Enquiries | 2 commissioned |
| Board papers | 3 of 3 |
| Business objectives | 4 achieved, 1 missed (Kestrel) |
| Incidents | 1: Customer data exposure, 1 to 22 July |
| Ratings | Risk understanding developing, Prioritisation solid, Resilience solid, Programme execution strong, Business enablement strong, Communication strong, Team sustainability weak, Material blind spots weak |

`pnpm session` on the exported log:

```
Campaign: seed panel-keyboard, ciso, sit-tidy
Played 22.7 min, reached day 364, finished the year

First decision:     day 5, 1.9 min in
First enquiry:      day 35, 5.3 min in
First programme:    day 5, 3.3 min in
First board paper:  day 91, 11.5 min in

Screens (minutes, visits):
  home            14.1  6
  risk             3.3  4
  board            1.5  3
  inbox            1.2  3
  programmes         1  1
  organisation     0.9  1
  debrief          0.7  2

Glossary opened: (index)
Lessons dismissed: none
Clock stopped for: decision-deadline ×23, quarter-end ×2, incident ×2, year-end ×1
Skipped ahead: day 21, day 22, day 28, day 35, day 40, day 45, day 55, ... day 348, day 364

Actions taken:
  advance                  36
  resolveDecision          26
  setSpeed                 6
  markRead                 3
  completeQuarterReview    3
  startInvestigation       2
  startProgramme           1
  createHypothesis         1
  openRisk                 1
  treatRisk                1
```

The log corroborates S1 and S2. The `setSpeed ×6` entries are all Space presses; I never chose a speed. The skips at days 21, 22, 28 and 35 are → presses on the Risk tabs; I never chose to advance time there.

## Core tasks: keystrokes and keyboard feasibility

The counts were measured at this build's default layout, with the "How this works" tip (**Got it**) still showing. Dismissing the tip removes one Tab stop.

| Task | Route as measured | Keystrokes | By keyboard? |
|---|---|---|---|
| Answer a decision (first one, from Begin) | Focus on `body` → 26 Tab to **Decide**, Enter. The dialog takes focus. 3 Tab to the first radio, Space, 8 Tab to **Commit to this**, Enter | 37 Tab, 1 Space, 2 Enter (**40**) | Yes |
| Answer a decision (typical, with a required reason) | After Skip ahead: 20 Shift+Tab to **Briefing**, Enter, 26 Tab to **Decide**, Enter, 2–4 Tab to the radio, Space or 1–3 ArrowDown, 2–11 Tab to a reason, Enter, 4–6 Tab to **Commit to this**, Enter | about 55–70 | Yes |
| Answer the next decision while already on Briefing | Focus is on `main` after a commit → 6 Tab to **Decide** | 6 Tab plus the dialog work | Yes |
| Start a programme | **Programmes** nav, Enter (focus stays on the nav button), 18 Tab to the first **Start this**, Enter, 5 Tab (Close, slider, sponsor, Cancel) to **Start the programme**, Enter | 23 Tab, 2 Enter, plus reaching the nav | Yes. Do not touch the slider (M8) |
| Commission an enquiry | **Risk** nav, Enter, 20 Tab to the tab **Risk scenarios**, **2 ArrowLeft** (wraps to **Investigate**), 1 Tab to the tabpanel, 1 Tab to the first **Commission** (5 for the fifth), Enter, 4 Tab to **Commission the work**, Enter | 26–30 Tab, 2 Arrow, 2 Enter | Yes. **ArrowRight is the expected key here and it advances the clock instead** (S2) |
| Write a board paper (Q1, from the briefing prompt) | From **Skip ahead**: 6 Tab to **Prepare it**, Enter (the screen changes to Board and focus drops to `body`), 2 Tab to **Prepare the Q1 board paper**, Enter, 2 Tab to **Identity uplift**, Enter, 8 Tab to **Take it to the board**, Enter | 18 Tab, 4 Enter (**22**) | Yes |
| Write a board paper (Q2, from the nav, three agenda items) | 14 Shift+Tab to **Board**, Enter, 18 Tab to **Prepare the Q2 board paper**, Enter, 2 Tab, Space, Tab, Space, Tab, Space, 3 Tab to **Detection uplift**, Enter, 6 Tab to **Take it to the board**, Enter | 45 Tab, 3 Space, 4 Enter (**52**) | Yes |
| Move time on | After a commit (focus on `main`): 1 Shift+Tab to **Skip ahead**, Enter | **2** | Yes |
| Move time on (from the top of a screen) | 22 Tab to **Skip ahead** | 23 | Yes |

Other measured costs:
- From an item in the Organisation list back to the **Risk** nav: 46 Shift+Tab.
- From `body` to **Skip ahead** after the focused control was removed: 39 Tab. Tab resumed from inside `main` and wrapped round.
- From **Begin** to **Decide**: 26 Tab. The first 22 stops are the skip link, 8 nav buttons, Glossary, Guide, Sound, the two export buttons, two save buttons, dark mode, Pause, 1×, 2×, 4× and Skip ahead.

## Focus behaviour

| Event | What happened | Sensible? |
|---|---|---|
| Dialog opens (decision, programme, commission, board paper, glossary) | Focus moves to the dialog container, named by its heading | Yes |
| Inside a dialog | Tab is trapped: Close → … → Not yet → Close. A disabled **Commit to this** or **Record why first** is skipped | Mostly. See M3 |
| Dialog closes with Escape or Cancel | Focus returns to the trigger (**Decide**, **Start this**, **Glossary**) | Yes |
| Dialog closes by committing | Focus goes to `main` (the trigger is gone). Once, after the second commission, it went back to the **Commission** trigger instead | Acceptable |
| Screen change from a nav button | Focus stays on the nav button. Nothing announces the new screen and the new `h1` is not focused | No (S4) |
| Screen change from a button inside content (**Prepare it**, **Read**) | Focus drops to `body`. The next Tab resumes somewhere in the middle of the page | No (S4) |
| Button removes itself (**Form the hypothesis**, **Open formally**) | Focus drops to `body` | No (S4) |
| **Open the response log** | The screen changes to Inbox and focus stays on that button, which persists in the incident banner | No |
| **Begin your first day** / year end | Focus lands on `body`. The review headline (`h1`) is not focused | No |
| Time advances (Skip ahead) | Focus stays on **Skip ahead** and the banner `status` gives the reason | Yes |
| Selecting a system (Organisation list) or a risk (Risk scenarios) | Focus stays on the item. The detail panel renders after the whole list, with no announcement and no selected state on the item | No (M6) |
| Toast appears | Toasts are in a `status` region and do not take focus | Yes, but see minor m5 |
| Focus ring | Visible: a blue outline on buttons and chips (screenshot `shot-004.png`) | Yes |

## Announcements

- **Risk bands are announced.** Words come first, such as "High residual limited confidence", with no number. The visual height glyph (▅ ▆) is kept out of the accessible name. Executive stance is an image named, for example, "Cautious, on a scale from resistant to trusted". Meters have names such as "Cyber budget: £2m of £2m".
- **Deadlines are announced inside the dialog** ("Due in 3 days.") but on the briefing they read as bare "3d" or "14d". **Decide** says nothing about which decision it opens or when it is due (M5).
- **The budget is in the sidebar** as a term and definition ("Budget left £2m") and as a meter on the briefing. Spending is not announced. The decision toast never states the cost. A £40k commission left the figure at "£1.1m" both before and after, because of rounding (m6).
- **What changed after an action is announced.** Toasts read, for example, "Decided: Out-of-hours vendor access — Have the SOC hunt it for a week.", "Identity and privileged access uplift is under way.", "Control effectiveness testing commissioned. Expect a result around 19 February." and "The board follows the argument and supports the direction you set out."
- **Why the clock stopped** is in the banner `status`: "A decision is due", "Quarter end", "An incident needs you", "The year is over." Twice (30 June and 24 August) the clock stopped with an empty status and no stated reason. On 22 July it said "An incident needs you" on the day the incident closed (M4).
- **Unread counts are not announced.** The sidebar shows "Inbox 3" and "9+", but the button's accessible name is "Inbox" (m1).

## Findings, ranked

No **blocker** was found: every task could be done from the keyboard and no mouse workaround was needed. S1 and S2 come closest. They do not stop a task; they change the game state without the player knowing, and both cost a decision in this run.

### Serious

**S1. Space is a global play/pause key, even inside a modal dialog. On buttons it does not activate them; it runs the clock.**
- Where: dialog **"Where do you start?"**, reason toggle **"More evidence is required"** (a button with `aria-pressed`).
- What happened: Space on the toggle did not press it (screenshot `shot-002.png`: not pressed). It switched the clock from **Pause** to **1×**. With the dialog still open the date ran from 2 January to 3 January and, in a second test, from 3 January to 6 January. **"The CEO wants your three risks" lapsed on 4 January while the player was reading a modal dialog.** Enter does press the toggle (`shot-004.png`, `[pressed]`). Space on radios and checkboxes worked and did not affect the clock. The session log records six `setSpeed` actions the player never chose.
- Expected: Space activates the focused button, as for any native button. Global shortcuts should not fire while focus is on an interactive control or inside a modal dialog. Time should not run while a decision dialog is open.

**S2. → advances to the next event even when focus is on a tab in the `Risk workspace` tablist, where → is the key the ARIA tabs pattern uses.**
- Where: Risk screen, tablist **"Risk workspace"**, tabs **"Risk scenarios"**, **"Evidence"**, **"Hypotheses"**, **"Investigate"**, **"Assumptions"**.
- What happened: three ArrowRight presses to reach **Investigate** moved the selected tab and also advanced the game three times: 6 January to 29 January. The **Evidence** tab's name changed from "Evidence2" to "Evidence5" to "Evidence8" as it happened. A fourth press (Hypotheses → Investigate) moved the date from 29 January to 5 February. **"Security conditions on the platform launch" lapsed on 30 January.** ArrowLeft did not advance time, so ArrowLeft ×2 (wrapping) is the safe route. ArrowRight inside radio groups and on the funding slider did not advance time either.
- Expected: arrow keys on a tablist, a radio group or any composite widget belong to that widget. A clock-advancing shortcut should never fire from a focused interactive control.

**S3. The single-letter screen shortcuts fire while a modal dialog is open, and cannot be turned off.**
- Where: the **Glossary** dialog. The guide lists the keys as H I R O P T B Y G.
- What happened: with focus inside **"Glossary"**, pressing `b` switched the screen behind the dialog to **Board**. `i` also navigated with focus on `body`.
- Expected: no navigation behind a modal. Single-character shortcuts should be possible to switch off or remap (WCAG 2.1.4), because H, B, T, G and I are screen-reader quick-navigation keys. In focus or forms mode, which readers use inside dialogs and inside `role="application"` (the dependency map), those keys reach the page. This was tested only on the Glossary dialog, not on a decision dialog, because no decision was open after the year ended.

**S4. Screen changes neither move focus nor announce the new screen. Several buttons drop focus to `body`.**
- Where: the sidebar nav buttons (**Inbox**, **Programmes**, **Risk** and the others); in-content buttons **"Prepare it"**, **"Read"**, **"Form the hypothesis"**, **"Open formally"**, **"Open the response log"** and **"Begin your first day"**; the year end.
- What happened: after a nav button, focus stays on the button and nothing announces that the screen changed. The new `h1` (for example "Inbox", "Programmes") is never read. After **Prepare it**, **Read**, **Form the hypothesis**, **Open formally**, **Begin** and at year end, focus falls to `body`. The next Tab then starts from the removed element's old position, which cost 39 Tab to reach **Skip ahead** and 41 Shift+Tab after **Read**. The annual review appears with focus on `body`; its headline is not focused.
- Expected: after a screen change, focus moves to the new `main` or its `h1`, or the change is announced. A button that removes itself hands focus to a sensible neighbour.

### Moderate

**M1. Every screen costs 21–26 Tab stops before its content.**
- The banner (Save, Save and close, dark mode, Pause, 1×, 2×, 4×, Skip ahead) comes after the sidebar in focus order. So does the playtest pair (**Export log**, **Stop and export**).
- Measured: 26 Tab from the top of the Briefing to **Decide**; 20 Shift+Tab from **Skip ahead** back to **Briefing**; 46 Shift+Tab from the Organisation list to **Risk**.
- **Skip to content** exists, but only at the very top, and focus is rarely there after a screen change (S4).

**M2. Default Organisation view exposes internal identifiers.**
- Where: Organisation screen, default **Graph** view. Thirty images are named like `"Edge from node-svc-payments to node-app-paygw"`. The nodes are unnamed groups inside `role="application"` and are not focusable.
- What happened: **List** is the accessible equivalent and works well: buttons such as "Infrastructure Critical Taken on trust Backup Platform …". However, Graph is the default and nothing says the list is the way in.
- Expected: edges named with system names, or the edges hidden from the tree. Consider defaulting to List for keyboard or screen-reader users, or saying in the graph's name that the list holds the same information.

**M3. "Why?" can be required, but a keyboard user is never told so.**
- Where: decision dialogs where the button reads **"Record why first"** [disabled]; the optional ones say **"Why? (optional)"**.
- What happened: the disabled button is not in the tab order, so Tab runs Close → … → **Not yet** → Close and the player never hears why they cannot commit. The only cue is the missing "(optional)".
- Expected: a focusable button that explains itself (for example with `aria-disabled` and a description), or a reasons group marked as required.

**M4. Skip ahead's stops and statuses are not always explained.**
- On 30 June and 24 August the clock stopped with an empty `status` and no decision waiting.
- On 22 July it said "An incident needs you" although "Customer data exposure: closed" arrived that day.
- A third decision, **"Regulatory notification"**, lapsed on 4 July. That run skipped from 3 July to 20 July right after committing **Incident command**, and the harness did not re-read "Waiting on you" first, so this session cannot say whether the decision was listed. Skip ahead gave no warning that an open decision would lapse during the skip.

**M5. Deadlines and targets on the briefing are terse or missing.**
- The waiting list reads as `heading "Out-of-hours vendor access"`, then bare text `3d`, then a button **"Decide"**.
- A screen reader user moving by buttons hears "Decide, Decide" with no title and no deadline.
- Expected: "Due in 3 days" in text, and a button name that includes the decision title, for example "Decide: Out-of-hours vendor access".

**M6. Selection is silent in master-detail views.**
- Where: Organisation list (**"… Backup Platform …"**) and Risk scenarios (**"High residual moderate confidence Emerging · Review due Supplier-enabled ransomware across production …"**).
- What happened: Enter fills a detail panel that sits after the whole list (after about 16 more items in Organisation). The selected item has no `aria-pressed`, `aria-selected` or `aria-current`, and nothing is announced.

**M7. Out-of-context duplicate names.**
- **"Start this"** ×6 (Programmes).
- **"Commission"** for every line of enquiry.
- **"Decide"**, **"Read"** and **"Examine"** (Briefing).
- **"Listen"**, **"Brief them"** and **"Press for a commitment"** for each executive (Board).
- Two **"Pause"** buttons: the clock, and a programme's own pause on Programmes.
- Expected: each name includes its item, for example "Start Identity and privileged access uplift", "Listen to Marianne Okafor" or "Pause programme".

**M8. Funding slider: once it is touched by keyboard, the programme cannot be fully funded again.**
- Where: dialog **"Start Identity and privileged access uplift"**, slider **"Funding £850k of £850k — fully funded"** with value `"845"`.
- What happened: ArrowLeft then ArrowRight gave **"Funding £845k of £850k — underfunded, which will slow delivery"**. ArrowRight ×2 and End stayed at 845. The only recovery is Cancel and reopen.
- Expected: the keyboard maximum equals the full cost. The value text should be in pounds, not a raw "845".

**M9. Executive sponsor select has no name of its own.**
- The `combobox` sits inside `group "Executive sponsor"` but is unnamed, so a reader may announce only "combo box, Default sponsor".

### Minor

- **m1.** Counts are dropped from names or run into them. The nav button is named **"Inbox"** while it shows "3" or "9+", and **"Briefing"** while it shows "1". The tab reads **"Evidence2"** with no space.
- **m2.** Inbox message names give no read or unread state, for example **"Fenella Osei, Head of Cyber Risk and Governance 5 Jan The inherited risk register Notable"**. Only the **Unread** filter shows it.
- **m3.** Long list-button names put the item's name in the middle. "Business service Critical Taken on trust Nexora Pay Merchant payment processing …" and "High residual moderate confidence Emerging · Review due Supplier-enabled ransomware …" both make a listener wait for the name.
- **m4.** Every radio and checkbox label is also exposed as an adjacent `text` node, so browse mode may read each option twice. This affects the start screen, decisions, commission and board agenda.
- **m5.** Toasts pile up in the `status` region with a **Dismiss** each, and the last one survives several time advances. Its text is not re-announced, so this is mainly clutter.
- **m6.** Rounding hides spending. "Budget left £1.1m" was unchanged by a £40k commission. The "Recently" log reads "Started Identity and privileged access uplift with 850k", without the £.
- **m7.** The start screen's **Replay settings** `group` has no name, and the seed field's accessible name includes its whole help paragraph.
- **m8.** On the **Your year** screen at day 91, the timeline said "Identity uplift: 6 Jan to 2 Apr, still running at year end".
- **m9.** The **Glossary** dialog has a single focusable control (**Close**). A screen reader can read it in browse mode, but a sighted keyboard-only user may not be able to scroll it. This was not verified visually.

### What worked well

- Landmarks (`navigation "Primary"`, `banner`, `main "<screen>"`), named regions and a heading structure on every screen.
- Native radios and checkboxes; toggle chips with `aria-pressed`; a real `tablist`.
- Dialogs that take, trap and return focus, and close with Escape.
- Every result of an action announced in a `status` region.
- Bands always given as words.
- A disabled option explains itself in its name: "… You are not running a programme to lead with".

## What this session does not settle

- What NVDA, JAWS or VoiceOver actually say, or how browse and focus mode interact with S1–S3. In browse mode a reader may send a click rather than the Space key, which could hide S1 for some users and not others.
- Whether the letter shortcuts fire inside a decision dialog, or from a focused radio.
- Mobile screen readers, switch access, voice control and zoom.
- Whether a blind player understands the year. No human was involved.

Screenshots from this session are in the session scratchpad and were not committed:
- `shot-002.png`: Space failed to press a reason toggle.
- `shot-004.png`: Enter pressed it, with the focus ring visible.
- `shot-005.png`: the incident banner, with focus still on Skip ahead.
