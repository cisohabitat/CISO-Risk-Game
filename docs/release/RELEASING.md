# Releasing

Phase 7 of `docs/ROADMAP.md`: how a version goes out. The game is static and
deploys from `main` (`docs/HOSTING.md`); a *release* is a named, checked
point on `main` with notes, cut about monthly while people are playing.

## Before

1. `pnpm check` — typecheck, lint, content (with the voice rules), unit tests,
   build, size budget. The first screen's budget is tight (184.1 kB of 185 on
   9 October 2026); a release that needs more raises it on purpose, with the
   reason in `docs/HOSTING.md`.
2. `pnpm test:e2e` — the full browser suite, including Chromium and WebKit.
3. `pnpm soak 1000` — no crash or broken invariant.
4. `pnpm coverage 60 --years 2` — authored content still reached (95% of
   events and 100% of decisions on 22 November 2026, for 0.1.0-rc.1; most of
   the rest sits behind options the harness does not take). A one-year run
   cannot reach Year Two and reads lower (80% and 86%).
5. `pnpm screenshots` and `pnpm playthrough` — look at them. Then
   `pnpm guide:shots` so the guide and the About page show the game as it is.
6. `tests/engine/cohort.test.ts` passing means the facilitator's seed table
   still holds; if it failed and was updated, re-run `pnpm cohort` and check
   `docs/educator/FACILITATOR.md` matches.

## Cutting it

1. Move the **Unreleased** section of `CHANGELOG.md` under a version and date;
   write it for players, not developers.
2. Bump `version` in `package.json` to match.
3. Commit, run both required suites for that commit, and push. The host
   deploys `main`. Confirm both CI jobs pass. Then run the **Release** workflow
   (`.github/workflows/release.yml`, by hand, on `main`, with the version). It
   checks `package.json` and the CHANGELOG match, builds, tags `vX.Y.Z` on
   that commit, publishes the GitHub Release with the notes and the `dist/`
   ZIP (a pre-release when the version has a suffix), and runs
   `pnpm test:e2e:live` against the deployment. That covers steps 4–6 below
   apart from looking at the pages yourself.
4. Check the live site: the start screen, `/guide`, `/about`,
   `/accessibility`, a seed link, and one campaign started and saved.
5. Check `/release-notes` and About's **Release and build** section. The version
   is read from `package.json`; the build records its UTC timestamp and commit.
6. Create a GitHub Release for the tag using that version's changelog notes.
   Attach a ZIP of the verified `dist/` directory (contents at the archive root)
   as `ciso-first-year-X.Y.Z.zip`, so the release includes a deployable static
   build as well as GitHub's source archives. Never include campaign exports,
   local environment files, or credentials. Mark release candidates as prereleases.
   Ordinary pushes do not cut named releases or change the package version.

## After

- Open problems reported on the issue tracker go into `docs/FINDINGS.md`
  once measured, and into **Known limitations** on `/about` if players should
  know about them.
- The month's playtest logs go through `pnpm session` (the tuning cadence in
  `docs/PLAYTEST.md`).
