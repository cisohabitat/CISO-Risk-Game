# Repository instructions

These instructions apply to the entire repository. Read [CLAUDE.md](CLAUDE.md)
for architecture rules, project constraints and measured findings before making
changes.

## Documentation

- Inbox search covers sender, subject and body across the full selected filter,
  before pagination. Searching must not automatically read transient results;
  preserve frozen Unread membership and choose results explicitly. Keep search
  local to the device and use the shared return labels in Briefing and reader.
- Annual judgements must remain reachable beyond the initial 14 entries. When
  revealing older entries, focus the first new entry. Replay links preserve the
  original opening, seed and mode, open fresh options rather than beginning a
  campaign, and leave the original campaign available for export/comparison.
- Paused-work guidance must describe the actual lack of delivery progress,
  without promising that resuming alone clears staffing or blockers.
- Keep `AGENTS.md` and `README.md` updated in every change set. Record changes
  to contributor workflows here and changes to behaviour, setup, commands,
  limitations and deployment in the README.
- Keep the two files consistent with the implementation, CI and hosting
  configuration. Update related documentation when those contracts change.
- Report only checks actually run and results actually measured.
- Run `pnpm audit:content-flow 6` for the content follow-through audit. Its
  declared engine policies, repeated runs and duplicate counts are probes, not
  human engagement evidence. Do not suppress repeated urgent/decision mail on
  the basis of identical text alone.
- Carry pending replies' guard flags on their scheduled entries across years,
  never into the new year's global story flags. Recheck present capability and
  suppression at delivery. Historical paper checks use the originating year's
  record. Keep the estate retirement date shifted normally.
- Load the next-year builder on request from the store, not through a static
  orchestrator re-export. Read the active campaign again after loading, prevent
  duplicate starts, and preserve the finished campaign/export route on failure.
  Keep `next-year-` out of the initial download in the size budget.
- Briefing work summaries show actual programme status and the first outstanding
  milestone; enquiry return dates are approximate. Do not expose scheduled
  narrative events or turn milestones into promised delivery dates.
- Use `docs/playtest-kit/FOCUSED_REVIEW.md` for the five-player content review.
  Treat recruitment slots, optional paired replays and human results separately.
  Record the build, preserve original saves and distinguish prompted tasks from
  unaided observations. This focused round does not complete the broader pilot.
- Decision-paper shortcuts must move focus as well as scroll within the paper;
  retain native radio navigation, known effects, resource costs and fixed actions.
- Inbox Follow-ups shares `messageReturnKind` with the Briefing and includes
  read messages. Do not classify consequences by additional wording guesses.
  Older mail must remain reachable beyond the initial 60 rows; revealing a batch
  focuses its first row without marking it read. Retained selections must have
  a reachable row after navigation. Preserve frozen Unread membership.
- Replay guidance distinguishes continuing the existing organisation from a fresh
  campaign. A strategy comparison needs the same seed, situation and mode;
  describe variation without promising different outcomes or exposing hidden state.
- Unread-filter membership must stay stable while messages are opened; never
  let marking one read recursively select and consume the next unread message.
- Incident warning links require recorded signal provenance. Do not infer an
  exact warning from similar wording, dates or nodes in an older save. Date
  reconstruction assessments and keep closed routes hidden until debrief.
- Team recovery guidance must use the same daily morale rule as the engine,
  including vacancies. Describe conditional direction, not a promised deadline.
- Empty decision states must acknowledge an active incident and offer a
  keyboard-accessible route to its journal, even when other work is due.
- Keep workload capacity separate from wellbeing in compact summaries. Name
  all struggling functions; a spare-capacity badge cannot stand for morale.
- Board eligibility copy must match `materialTopics`, including workload
  strain rather than morale alone. Label the reporting quarter separately
  from the preparation date and submission window.
- Serialize save validation and persistence in request order, including the
  initial save. A delayed invariant import or disk write must not overwrite
  newer progress. A rejected save must still allow later saves to proceed.

## Security

- Treat imported saves as untrusted: check the 16 MiB file limit before reading,
  bound nesting/entries, and reject prototype-related keys and non-finite numbers
  before migration. Load the import parser only on demand. Run engine invariants
  and verify content identity before replacing active state or queuing a write.
  Rejection must preserve both the running campaign and existing saves.
- Keep playtest HTTP services on 127.0.0.1. Reject foreign Host/Origin values,
  cross-site commands, non-JSON/non-POST commands and oversized request bodies.
  Resolve file paths and symlinks inside the build directory; navigation and
  downloads must stay within their intended local origin/output directory.
- CI tokens are read-only, checkout credentials are not persisted, and actions
  are pinned to reviewed commit SHAs. Run `pnpm audit:security` before release;
  remediate advisories without disabling TLS or skipping registry failures.

## Artwork

- Organisation uses a labelled native System type filter. Stacked risk/system
  detail panels expose a return action that restores the selected row’s focus
  without clearing selection. Keep these actions below the fixed header when
  opening details, including dependency walks, and verify at 320px and tablet.
  Correspondence portraits use the compact 56px size below 1280px; retain
  readable full sender names and roles beside them.

- Split-workspace choices share the `workspace-choice` selection cue and
  `aria-current`. Keep selection geometry stable, preserve unverified systems’
  dashed outlines, and distinguish hover from selection in both themes.
  Keep pane framing desktop-only and phone reader actions freely wrapping.

- Give map attribution links a real layout box so the shared minimum touch
  height applies and WebKit can scroll their hit target into clipped panes.

- Suppress root pull-to-refresh only during gameplay. The touch fallback may
  cancel a single-finger downward edge swipe only when neither the page nor an
  ancestor reader can scroll upward. Preserve horizontal/upward gestures, native
  editing, map gestures and multi-touch; remove listeners on campaign exit.

- At widths of 1024px and above, Inbox, risk scenarios and Organisation use
  bounded independent scroll panes. Keep headers/tabs reachable, contain vertical
  scroll chaining, and reset only the detail pane on selection. Preserve narrow
  screen navigation and document printing. Verify isolation with real wheel input
  in Chromium and WebKit, including panel ends and rotation back to portrait.

- Annual-review section links must reach and focus their targets beneath the
  header, and disappear in print. Timeline guides and keys describe recorded
  marks and programme completion only. Do not invent opening/closing snapshots.
- Board introductions scroll with the paper; keep title, Close and footer
  reachable. Show reporting period, preparation date and actual deadline together.

- Map selection and direct neighbours carry distinct text labels; keep the
  inspector selection cue consistent. Space rows for wrapped names and public
  status labels without overlap, and draw highlighted edges behind node cards.
  Team dossiers pair workload and morale on phones, with track record beneath;
  keep capacity and recovery guidance separate.

- Decision descriptions scroll with the paper, with one description ID linked
  from the dialog. Keep title, Close and footer fixed and reachable on phones.
- At narrow widths, containment and recovery share a row; services use the full
  row beneath them. Keep public wording and the status → actions → update order.

- Decision papers put deadlines before context, label budget/attention costs
  separately and show selection in words as well as colour. Keep the fixed
  footer and reachable rationale route; preserve affordability and hidden effects.
- Preload decision UI when play begins, with an accessible loading dialog and
  recoverable failure. Keep the decision chunk out of the title download budget.
- Incidents show public operational status before response controls, then the
  latest recorded update. Keep earlier history expandable and controls reachable.

- Active programme status occupies a stable row beneath its title/sponsor.
  Risk-tab edge fades follow the same overflow state as the cue, use theme
  colours and never intercept input. Keep keyboard focus and final tabs visible.
- Phone Inbox return and branding share one letterhead row. Retain both return
  actions, heading focus, full sender details and the desktop letterhead.

- Phone date labels use the existing calendar formatter and compact week text;
  retain the full date/week/quarter in accessible text. Risk badges beneath
  labelled comparison cells omit repeated field names, keeping qualitative bands.
- Risk tab cues reflect actual overflow at each edge and update on scroll/resize.
  Retain keyboard navigation and vertical gesture propagation.
- Keep message type and date readable in the compact phone masthead. Active
  programme summaries and delivery paths share the desktop width; milestone
  order and completion remain recorded facts, with vertical phone fallbacks.

- Compact header resources retain visible Budget and Attention labels and full
  values at 320px. Keep clock, save and theme controls within two phone rows.
- Risk tabs may scroll horizontally below 768px, with a visible discovery cue,
  native overflow and keyboard access to every tab. Contain horizontal gestures
  only; vertical wheel/touch input must still reach the page.
- Compact phone correspondence keeps full sender names and roles, and a working
  portrait fallback. Programme groups use one divider per boundary while keeping
  the same keyed rows and intervention controls.

- At widths below 768px, explicit or retained Inbox selections move to the reader
  after shell navigation has settled. Back to messages restores the selected
  row’s focus and position. Do not hide or rebuild the frozen Unread membership.
- Risk cards compare the same four public facts: residual band, confidence,
  owner and next review. Keep statement and title ahead of the fact grid; retain
  the existing review selector and qualitative bands.
- Programme status groups use actual unresolved blockers, not the at-risk badge
  alone. Keep rows keyed under one list so regrouping preserves controls and
  focus. Paused work still exposes blockers, and completed work stays visible.
- Change highlights are a single neutral pulse for observed resource or recorded
  milestone changes. Do not pulse on mounting, load, unchanged values or theme
  changes. Respect reduced motion, including preference changes mid-animation;
  never add clock pauses, inferred causation or simulation effects.

- Preserve screen identity without moving urgent work behind decorative content:
  Briefing uses a newspaper masthead, Inbox correspondence, Board a committee
  paper and incidents a response room. Office artwork follows the public quarter
  only, never risk, morale, performance or weather inferred from the simulation.
- Programme delivery journeys read recorded milestone completion. Name the first
  outstanding milestone as “Next milestone”, not a promised delivery date. Keep
  paused/blocked status, blockers and interventions outside optional details.
- Important message portraits use recorded priority/type and known sender IDs.
  Keep full names and roles readable; preserve unknown sender text without
  inventing a portrait or role. Initials remain the image-failure fallback.
- The office atlas is deferred until play, has a 160 KiB encoded-size budget and
  uses a neutral closing scene for every annual outcome. Keep narrative in HTML,
  retain a useful image-failure fallback, and omit decorative scenes from print.

- Incident response actions precede journal history. Keep the latest public
  update visible and earlier updates/recorded choices expandable, preserving
  the journal focus target and every pending response route.
- Decision receipts use successful before/after snapshots for actual resource
  changes and new message IDs. Never promote foreseeable or delayed effects to
  observed outcomes. Bring a new receipt into view and focus its heading once,
  without repeating focus on ticks or navigation. Feedback is ephemeral UI
  state, cleared on campaign
  lifecycle changes; it must not alter the engine, saves or clock pauses.
- Quarter recaps appear only after played boundaries, below the Briefing action
  area. Exclude defaulted decisions from player choices, use programme completion
  dates, preserve pending board-paper status, and never invent a fifth quarter.
- Quarterly guidance uses recorded choices/completions and public views only;
  never call the annual grader mid-year. Separate dated quarter lapses from
  today's labelled workload, morale and blocker concerns. Name all struggling
  functions and keep the linked next step available without hiding urgent work.
- Keep optional feedback deferred and nonblocking. Expand programme milestones
  and leadership notes without hiding costs, staffing, morale, blockers or
  actions; disclosures need keyboard controls and associated panels.

- Decision papers separate context, option costs, known effects and rationale;
  never present hidden outcomes as foreseeable effects. Board submission counts
  must reflect the selected agenda, recommendations and uncertainty control.
- Inbox type labels and icons come from recorded message types; do not infer
  investigation provenance or incident severity from wording. Preserve stable
  Unread membership. Map highlights use only the displayed, discovered nodes
  and their direct links; arrows point toward dependencies. Keep node text
  readable and retain the list/inspector keyboard route.
- Team function and programme rows retain morale, vacancies, staffing, costs,
  blockers and actions when stacked at 320px. Keep people portraits in dossiers.

- Keep the Briefing's action area ahead of standing metrics in DOM and visual
  order. Its lead decision follows the existing deadline sort; board papers and
  programme blockers retain their own routes. Review highlights are a sample
  of recorded choices, not inferred causes or a ranking of importance. Preserve
  fewer-choice and older-save fallbacks, keyboard access, and print readability.

- Portraits live in `src/assets/art/nexora-people.webp`; their character mapping
  and initials fallback live in `src/components/game/Person.tsx`. Preserve the
  atlas order documented in `src/assets/art/README.md` when replacing artwork.
- Keep portraits decorative beside readable names, with lazy loading and a
  working fallback. Never use a face or its colour to convey trust or risk.
- Keep portrait and incident atlases out of the start screen. The owner's
  approved illustrated title screen uses one responsive, decorative WebP scene;
  keep all text and controls in HTML and preserve play when the image fails.
  Enforce scene and complete first-visit limits in `scripts/size-budget.ts`.
  Review desktop, 320px, both themes, direct start, latest-save resume and options.
- Check text contrast against the actual photo with Continue and storage notices
  present. Axe cannot measure photo backgrounds. Keep mobile shading anchored
  to the heading and actions, rather than percentages of the entire scene.
- The hero starts the selected/default campaign immediately, with no splash
  step. Campaign options, Replay settings, import and saved-campaign management
  remain below it. Keep those existing routes and shared-seed selections intact.
- Incident illustrations are decorative and may use only the public incident
  name and response phase. Keep response controls prominent and preserve the
  factual timeline in readable text.
- Newsreader is self-hosted under the SIL Open Font License in
  `src/assets/fonts/`. Keep the licence with the deployed font. The first-visit
  budget includes stylesheet font URLs; do not replace it with a remote font.
- Use larger portraits for people directories, document layouts for papers and
  reviews, and compact rows for routine records. Empty-state illustrations
  remain decorative beside a clear explanation and a useful next action.

## Annual assessment

- Use the shared `programmesThisYear` filter for execution and prioritisation;
  exclude earlier completions but retain unfinished carry-over work. Credit
  recorded test-tenancy restores from both the Q4 and second-year decisions
  in recovery evidence and Exceptional eligibility.

- Keep the eight dimensions equally weighted. Exceptional requires no weak
  dimension and tested recovery capability; weak prioritisation or team
  sustainability caps the overall result at Mixed. Three weak dimensions cap
  it at Difficult. Explain an applied ceiling in the review narrative.
- Programme delivery retains credit, but Strong also requires portfolio
  relevance in the upper half of the available programme materiality range.
  Use the opening snapshot, authored treatment links and this year's work;
  retain current-picture fallback for older saves and neutral handling of ties.
- Review generation must remain pure: no effects, RNG draws or save rewrites.
  Stored annual reviews retain their original judgement. Calibrate changed
  assessment rules across seeds, modes and policies with `pnpm tsx scripts/tune.ts`.

## Verification and deployment

- The start footer reads its version from `package.json`; `/release-notes`
  is built from `CHANGELOG.md`. About shows build-time UTC date and the public
  commit SHA (Vercel/CI metadata or local Git), never arbitrary environment data.
  Keep About reachable from the desktop rail and mobile menu without leaving play.
  Named GitHub releases and downloadable site archives follow `docs/release/RELEASING.md`.

- Commit and push completed, verified changes directly to `main` without asking
  for confirmation. This is the owner's standing instruction for future work.
- Before pushing, run `pnpm check`: typecheck, lint, content validation, unit
  tests, production build and bundle size budget.
- For UI changes, also run `pnpm test:e2e:local`.
- Browser automation selects decision actions by their `Decide: <title>`
  accessible names. A substring match for “Decide” also matches the expandable
  “What you have already decided” journal and can stall a playthrough.
- Browser tests that already opened the start screen should use
  `beginCampaign` rather than navigate again during the campaign preload.
- Scroll checks must cover vertical reachability as well as horizontal
  overflow, and exercise real wheel input rather than only `scrollIntoView`.
  Keep main-pane overflow and overscroll containment desktop-only so narrow
  layouts can scroll the page. Horizontal filter strips must contain only
  horizontal overscroll and let vertical gestures reach their parent scroller.
  Preserve the single scrolling desktop rail at
  heights up to 768px; a long wellbeing summary must not collapse the navigation menu. Run
  `tests/e2e/scrolling.spec.ts` for screen navigation and short-rail regressions.
- Before deploying any revision, require `pnpm check` and the full
  `pnpm test:e2e` suite to pass for that exact revision. CI provides Chromium
  and WebKit coverage. Run the commands sequentially because both rebuild
  `dist/`.
- Vercel's build command is `pnpm check`, so a failing check blocks the hosted
  build. Browser tests run separately in CI; confirm both CI jobs pass before
  deployment or promotion.
- If dependencies, browsers or network access prevent verification, report the
  blocker and leave deployment pending. Never describe skipped tests as passing
  or bypass the checks to deploy.
- After deployment, run `BASE_URL=<deployment-url> pnpm test:e2e:live` and follow
  the remaining release checks in [docs/HOSTING.md](docs/HOSTING.md).
