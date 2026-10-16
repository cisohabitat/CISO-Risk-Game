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

## Verification and deployment

- Before pushing, run `pnpm check`: typecheck, lint, content validation, unit
  tests, production build and bundle size budget.
- For UI changes, also run `pnpm test:e2e:local`.
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
