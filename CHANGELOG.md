# Changelog

What changed for players, newest first. Each release is cut with the checklist
in `docs/release/RELEASING.md`; the measured detail behind every fix is in
`docs/FINDINGS.md`.

## Unreleased — first public release candidate

The game as it stands after the roadmap's engineering phases
(`docs/ROADMAP.md`, Phases 0–7). Version 0.1.0 until the owner tags a release.

- Patch Zod to 4.6.7 and the test tooling’s Undici to 8.12.3 for the
  24 October security advisories.

### Security

- Reject crafted deferred-save effects and unsafe object references before
  activation; keep stored progress intact. Guard reducer map lookups against
  inherited properties and reject executable URLs in built documentation.

### Playing

- Hold high-speed time after actions and when weekly attention renews. Keep each
  open board paper announced across screens, preselect material items for fresh
  drafts and explain the agenda range, reporting calendar and Q4 annual closure.
- Give quarter-specific board responses, show system/dependency discovery totals
  together in reviews, use full programme names and clarify partial business
  delivery and Developing resilience without changing ratings or balance.

- Record dated audit-programme checkpoint outcomes and retain them after later
  delivery. Stop showing past checkpoints as upcoming; older missing outcomes
  remain explicitly unknown.
- Show exact unread badges, explain the attention total and expose work beyond
  list previews. Separate raised/emerging counts and unraised board concerns.
- Report capacity changes and current wellbeing together; keep unfinished
  programme percentages below 100 in annual reviews.
- Confirm hypotheses and commissions in place, prevent duplicate working drafts,
  and retain full completed enquiry reports. Add recorded budget activity and
  factual quiet-week notes without extra simulated mail.
- Name supported earlier route choices in incident reconstruction, identify each
  response's incident and date, and coach repeated evidence reasons without a
  new requirement. Explain the single-step Skip ahead control.


- Answer the board's appetite request with a working delegation, see its boundary
  beside acceptances and in Board, and review accepted exceptions in later papers.
  A thirty-day follow-up checks the current register. Unknown risks are not
  labelled tolerable; adopting a statement does not fund or improve controls.


- Hold time while reading a decision or other modal and when the browser tab is
  hidden; prevent queued callbacks from overrunning an incident/decision pause.
- Warn before board papers lapse and require a deliberate acknowledgement before
  submitting a paper with material omissions. Name emerging and previously
  reported risks separately and link received governance correspondence.
- Quote the audit promise's programme funding, retain its follow-through in
  Briefing/Programmes, and deliver a credibility consequence if the new promise
  remains unstarted at its funding review.
- Reconcile paper counts, discovery counts and choice/default totals in new annual
  reviews; clarify recovery versus prevention, weekly attention, base programme
  durations, required reasons and the size of relationship changes in words.
- Use situation-aware opening context, full accessible unread counts, finished
  glossary labels and clean fallbacks when decorative images fail.


- Keep teaching notes compact outside Briefing and put Teaching tips in shared
  help menus, retaining every lesson and dismissal action. This fixes Inbox
  panes extending below short landscape viewports with wider fallback fonts.

- Explain the year-end assessment during play, guide the first Risk visit from
  evidence to board consideration, and make dismissed teaching tips available
  again through Glossary. Add definitions and contextual links for game terms.
- Show impending decision deadlines across workspaces, expire decision receipts
  when the day advances, and explain confidence changes within their current
  band. Clarify current attention versus the weekly allowance and quote free
  as well as paid enquiries before confirmation.

- A decision's receipt now names the reactions it caused straight away: an
  executive's remembered response, board confidence and a team's morale, in
  words. It used to say only that the choice was recorded.
- Year Two's events and decisions download when a second year begins, not
  with the first. The campaign a first year waits for is about 7 kB smaller.

- The live incident panel now says when nothing waits on you, and why: on the
  day an incident escalates its first decisions arrive when the clock next
  moves, and after you answer them the response runs on what you decided.
  The red bar no longer reads as an alarm with no next step.

- Rewrite the known effects on thirteen decision options so each names what
  it buys as well as what it costs. Options such as fixing card data quietly,
  waiting for the scheduled board meeting or asking a stretched team to push
  through no longer give away the expected answer; no effect changed.

- Add optional voice for Fenella’s early team introduction, retaining her
  established voice and every earlier recording.

- Fix fresh-playtest follow-through: dated recovery assurance, incident-safe
  restore requests, visible SOC hunt replies and material blocked programmes.
  Retain board drafts during risk review, show recruitment arrival dates and
  partial-funding guidance, and reserve 100% progress for completed programmes.
  Group explicitly linked returns without deleting correspondence; add evidence
  and converted-risk routes and retain executive plan details in history.


- Defer Inbox code until a campaign opens to recover entry-download headroom.
  Keep a readable loading state and return to Briefing on load failure. Cover
  iPad rotation with Continue and a storage warning together in both themes.

- Use the portrait theme image and centred title composition on upright iPads.
  Rotate to landscape to restore the wide image and layout automatically.

- Add optional voices to three existing incident-related messages: the command
  record, external responder invoice and People Cloud disclosure. Keep all
  earlier 30 recordings and the 3 MiB total allowance. Dynamic operational
  reports remain written; playback still requires an exact transcript match.

- Continue voice coverage to 30 selected messages across all 12 recurring
  characters. Add digital, procurement, legal, governance, architecture and
  engineering voices with fixed profiles and phrase pacing. Preserve the earlier
  18 recordings; raise the on-request audio allowance to 3 MiB while retaining
  per-clip and first-visit limits.

- Expand optional character speech from six to eighteen selected messages,
  adding Dev, Jo and Sir Alan. Voice both Kestrel boundary outcomes and both
  restore-test outcomes, plus delivery, readiness, board and closing messages.
  Generate the playback catalogue alongside recordings; retain exact text
  matching and on-request loading. Allow 2 MiB total audio with unchanged
  per-clip and first-visit limits.

- Revise all six character recordings with phrase-level pacing and pauses,
  following the owner's approved CEO sample. Marianne uses the revised voice;
  Tomas and Helen retain their distinct presets. Spoken message text is unchanged.

- Optional character voice pilot for six selected messages from Marianne,
  Tomas and Helen. Play on request, pause/replay/stop, and keep the full text;
  no runtime speech service or autoplay. Human listening review remains pending.

- Make half-funded programmes reachable with smaller budgets, preserve resources
  on refused programme actions, and enforce quoted funding and acceleration.
- Credit actual delivered progress in annual programme execution; retain
  relevance and overall safeguards. Bring earned identity and restore follow-ups
  into Q3 from day 210. Add paired strategy/mode balance probes and document limits.

- Patched Vitest and matching coverage tooling to 5.0.3, resolving two moderate
  mocker advisories reported by the dependency audit.

- Compact incident context on secondary screens while keeping response actions
  visible; the full factual journal expands on request and opens on Briefing.
- Give sidebar navigation more room by folding Help and settings. Present Team
  wellbeing alongside capacity, bring executive actions above expandable
  profiles/history, and tighten Inbox spacing and search guidance on phones.

- Keep Inbox, Risk and Organisation readers usable beneath incident banners;
  long banner stacks expand the page while preserving independent pane scrolling.
- Keep incident journals, response decisions and latest-message links scoped to
  their recorded incident. Name the closed incident in post-incident reviews and
  retain older unlinked correspondence without guessing its response.
- Stop Skip ahead on newly delivered results, follow-ups, programme delivery,
  recorded warnings and urgent updates. Milestones now remain in correspondence;
  ordinary timed play is unchanged and unread backlogs never block another skip.
- Explain Emerging risks and board eligibility before paper preparation. Defer
  Board UI until play begins to stay within the existing initial download limit.

- Fixed temporary exploit-response effects over-refunding low capacity or
  exposure, and removed the retired edge mitigation's remaining exposure
  benefit. The announced patch date now stays fixed when answering later or
  letting the decision default; emergency engineering time starts on approval.
- Updated Vite to 8.3.5 to address three launch-editor security advisories found
  during the release audit; the shipped game remains a static client application.
- Extended the checkout exploit decision with an AI-accelerated disclosure,
  a two-day response window, an access-restriction option and choice-specific
  follow-ups. Temporary monitoring consumes SOC capacity; its report reflects
  current logging coverage without claiming that silence proves safety.
- Preserve free-text campaign seeds in replay links instead of silently choosing
  a different seed, and retain a valid accessible reader target in Inbox search.
- Search Inbox correspondence across sender, subject, body and older mail,
  without automatically reading search results. Follow-up labels now match the
  Briefing, and paused programmes explain the next place to review delivery.
- Reveal earlier annual judgements beyond the latest 14, and open matching
  first-year replay settings directly while retaining the original campaign.
- Explain a hypothesis in plain language with its enquiry-to-risk next step.
- Preserved the guard facts for replies carried across a year boundary, without
  restoring old budget decisions into the new year's global flags.
- Briefing now names programme status and next milestones, wraps enquiry names
  and labels approximate return dates. The second-year builder loads on request
  with protection against duplicate starts and a retained export route on failure.
- Added a reproducible content-flow audit for scheduled replies, repeated mail
  and contrasting strategies under matching seeds.
- Added focused shortcuts through long decision papers and clearer enquiry and
  board-submission guidance. Corrected the decision footer’s directional copy.
- Added an Inbox Follow-ups view and access to correspondence older than the
  first 60 messages, preserving read state and retained selections.
- Distinguished carrying Nexora into another year from replaying a fresh
  campaign, with guidance for comparing approaches under the same setup.

- Validate imported campaigns before activation, reject unsafe or oversized save
  files, and preserve the current campaign when an import fails.
- Restrict the local AI playtest servers, patch a build dependency advisory, and
  harden CI permissions and dependency checks.

- Compacted tablet correspondence and system filters, improved sender-name
  wrapping and selected titles, and added focused return actions to stacked
  risk/system details with clearance below the toolbar.

- Clarified Inbox, Risk and Organisation panel boundaries, unified selection
  styling, and improved message hierarchy and narrow-screen reading space.
- Added a gameplay-only pull-to-refresh guard for downward swipes at the page
  edge, while preserving ordinary scrolling and dialog readers.
- Fixed coupled scrolling on iPad landscape and desktop: Inbox, Risk scenarios
  and Organisation now scroll their list/map and detail panes independently.
- Quarter recaps explain recorded strengths, missed decisions and current public
  team/programme concerns, with a practical next step linked to the work.
- Later-year reviews now credit the second-year test-tenancy restore and exclude
  programmes finished in earlier years from prioritisation commitments.
- Overall annual ratings now have minimum standards, with explanations when a
  weak dimension or untested capability limits the rating. Programme execution
  judges delivery alongside relevance to material risks. Existing stored reviews
  keep their original assessment.
- Annual reviews have section links, a labelled overall assessment and timeline
  quarter guides with a marker key. Board introductions scroll with the paper,
  and its reporting period, preparation date and deadline sit together.
- Map neighbours are labelled Directly connected, with more space between rows,
  links behind cards and a matching selection cue on the inspector. Team dossiers give phone facts
  more room and separate function capacity from wellbeing guidance.
- Decision descriptions scroll with the paper beneath the fixed title and Close
  button. Phone incident summaries put containment and recovery side by side,
  with services on the next row, leaving more room for response controls.
- Decision papers foreground deadlines, separate resource costs and identify
  the selected option in the paper and fixed footer. Decision UI preloads during
  play. Incident status precedes response choices and the latest recorded update.
- Programme status stays beneath the title and sponsor across screen sizes.
  Phone risk tabs have theme-aware edge fades that follow actual overflow.
  Inbox return and branding share a compact phone letterhead row.
- Phone dates and risk badges are shorter without losing calendar context or
  qualitative bands. Risk tab cues follow the actual scroll position. Compact
  Inbox mastheads bring text closer, and full-width desktop programme summaries
  and delivery paths reduce unused column space.
- Compact phone resources have readable labels and values beside the clock.
  Risk tabs scroll in one row with a discovery cue and keyboard navigation;
  the inspector has a clearer selection prompt. Programme dividers and mobile
  sender blocks use less space while keeping controls, names and roles visible.
- Phone Inbox selections move to the reader, with Back to messages restoring the
  selected row. Returning to Inbox retains the selected message.
- Risk cards align four comparable facts. Programme status groups keep running,
  paused, blocked and completed work distinct while preserving control focus.
- Long messages, evidence and reviews have more consistent reading widths and
  spacing. Actual resource and milestone changes receive a brief neutral
  highlight; loading and reduced-motion settings keep the view quiet.
- Working screens have clearer identities, from morning Briefing to committee
  papers and incident response. Important correspondence has larger named sender
  portraits with full roles.
- Programme delivery paths distinguish completed milestones, the next milestone
  and paused/blocked delivery, while keeping intervention controls available.
- Office light changes with the quarter, and a neutral blue-hour closing scene
  accompanies the annual review’s recorded business outcome. Artwork is optional
  and excluded from printed reviews.
- Incident response decisions now precede the journal, with earlier updates
  and recorded response choices available on demand.
- Decision receipts confirm the chosen option, immediate resource changes and
  new messages. Briefing quarter recaps show recorded work and what remains open.
- Programme milestones and leadership notes expand separately from actions and
  staffing; screen headings and document/map loading states are consistent.
- **A second year that knows what the first did.** From two AI playthroughs
  of the second year:
  - Last year's evidence reads as last year's, and what the first year fixed
    or outlived is gone.
  - Kestrel is not integrated twice.
  - Nothing mentions an incident or a programme that did not exist.
  - Executives have this year's worries.
  - Last year's finished work is not "Under way".
- **Team fixes:**
  - "Recruiting" ends when the hire joins.
  - A resignation opens a post.
  - Overload comes from the head of the team that is overloaded.
- **A new programme blocker stops the clock,** like a decision does.
- From a first year after the breach, played on a tablet:
  - A review due on a linked risk can be done.
  - Assumptions under review can be reaffirmed.
  - Meetings and the board paper show what they cost.
  - The board paper says what the committee counts as material.
  - The commission dialog says why it expects thin work.
  - A resignation lands on the team that was pushed.
  - "Write up the year now" asks first.
  - On a tablet, the header keeps its date and budget, and choosing a
    system takes you to its detail.
- From a second-year re-test:
  - Blockers and findings the first year already settled stay settled.
  - Last year's acceptances are only the ones that came across.
  - A keen team stays keen over the new year.
  - The pause banner clears when its reason does.
- **Re-accepting a risk on the Risk screen** answers its renewal decision.
- From a played year on seed harbour-87524:
  - Carrying the platform's recovery gap no longer records that backups
    recover within tolerance, the very thing the decision said was false.
  - The warning about a risk the board has not seen now waits until there
    is one, and names it.
  - Follow-up messages say what the test, the HR provider and the launch
    conditions actually came to.
  - An enquiry that traced a risk's route counts as having gone near it.
  - A risk already linked to its programme says so instead of offering the
    link again.
- **Meetings say what was said.** Listening goes through the person's own
  plan for the year, the systems it rests on and the worst risk you hold
  that reaches it. The note stays in the inbox.
- **Shortcut keys can be turned off**, beside Sound (WCAG 2.1.4).
- **Returned enquiries say what they reached:** the systems they mapped, the
  dependencies they traced, the controls they assessed, and what they
  confirmed.
- **More kinds of attack:**
  - an actor that wants an outage rather than a payment;
  - six new routes in;
  - three new kinds of incident (a wiped warehouse estate, a diverted
    payment, a tampered checkout);
  - a ransom demand that goes to the board with your recommendation.
- From the same panel:
  - The board's reading of each paper stays in the inbox.
  - Money that comes back says where it came from.
  - Attention costs show on the buttons that spend attention.
  - A hypothesis says it is a draft until it is raised.
  - Blocked programmes appear under "Waiting on you".
  - The commission dialog counts work already given to a lead.
  - The incident reconstruction counts the warnings an intrusion raised
    before it struck.
- **A second year that remembers the first.** "Begin your second year" on
  the review carries on at the same Nexora. Carried over:
  - the estate and what you found;
  - the controls and programmes;
  - the people and the team;
  - the risks you accepted.

  The budget is the one the autumn agreed. Seven new decisions and their
  replies answer last year's choices, the business has new plans, and the
  review compares the two years.
- One simulated year at Nexora Group in three modes (Guided, CISO, High
  pressure) and four starting situations, with an annual review that reads
  the year in eight bands and no score.
- **Share this year** on the review sends its headline, each dimension's band
  and a link that opens the same year for whoever receives it. Links of the
  form `/?seed=…&mode=…&situation=…` open the start screen on that year.
- **Print or save as PDF** sets the review out as a document.
- Export a campaign from **Your year** at any point in the year, not only at
  its end.
- Optional sound, off until turned on.

### Reliability
- Each campaign keeps the save before its latest; a damaged save opens from
  that one and says so. A broken state is never written over a good save.
- A screen that fails to draw no longer blanks the page.
- Dates everywhere, including the review and the messages, instead of day
  numbers.

### Access
- From an AI playtest panel (`docs/playtests/2026-10-09-ai-panel-synthesis.md`):
  - Space, the arrow keys and the letter shortcuts no longer act from inside
    a dialog or a focused control. Space in a decision used to start the
    clock.
  - Focus moves to a new screen.
  - The dependency map names systems rather than ids.
  - Buttons say which item they act on.
  - "Record why first" can be reached and explains itself.
  - The funding slider reaches full funding.
  - On a phone, choosing a card takes you to its detail.
- Every screen is checked against WCAG 2.2 A/AA in both themes, at 320px and
  up, on every change. Following a dependency in the organisation view moves
  focus to where it lands and keeps a trail back. Reduced motion stops all
  animation. See `/accessibility`.

### Presentation
- Clearer decision papers and Board submissions, typed Inbox messages,
  stronger map selection and dependency arrows, and quieter Team and Programme rows.
- The Briefing puts decisions before standing metrics and gives its next
  decision more visual emphasis. The annual review has a stronger cover and
  a chronological selection of recorded choices.
- The title footer shows the version and links to release notes. About includes
  the build date and commit, and opens from the in-game menu without interrupting play.
- One line-icon set, sentence-case labels, a key on the dependency map, a
  year strip, ratings on the board paper's agenda, and motion only where
  something arrives.

### For facilitators and authors
- `/?playtest` records a session on the player's device for a playtest;
  `pnpm session` reads one or many logs. The kit is in `docs/playtest-kit/`.
- A facilitator's pack for teaching with the game (`docs/educator/`), with
  characterised seeds from `pnpm cohort`.
- Content packs can be validated, sized and voice-checked with
  `pnpm validate:content --pack`; the schema is published in `docs/content/`.
