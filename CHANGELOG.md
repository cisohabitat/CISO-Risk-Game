# Changelog

What changed for players, newest first. Each release is cut with the checklist
in `docs/release/RELEASING.md`; the measured detail behind every fix is in
`docs/FINDINGS.md`.

## Unreleased — first public release candidate

The game as it stands after the roadmap's engineering phases
(`docs/ROADMAP.md`, Phases 0–7). Version 0.1.0 until the owner tags a release.

### Playing

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
