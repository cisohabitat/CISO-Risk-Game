# Repository instructions

These instructions apply to the entire repository. Read [CLAUDE.md](CLAUDE.md)
for architecture rules, project constraints and measured findings before making
changes.

## Documentation

- Keep `AGENTS.md` and `README.md` updated in every change set. Record changes
  to contributor workflows here and changes to behaviour, setup, commands,
  limitations and deployment in the README.
- Keep the two files consistent with the implementation, CI and hosting
  configuration. Update related documentation when those contracts change.
- Report only checks actually run and results actually measured.
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

## Artwork

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

## Verification and deployment

- Commit and push completed, verified changes directly to `main` without asking
  for confirmation. This is the owner's standing instruction for future work.
- Before pushing, run `pnpm check`: typecheck, lint, content validation, unit
  tests, production build and bundle size budget.
- For UI changes, also run `pnpm test:e2e:local`.
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
