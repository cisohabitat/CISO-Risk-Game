# Releasing

Phase 7 of `docs/ROADMAP.md`: how a version goes out. The game is static and
deploys from `main` (`docs/HOSTING.md`); a *release* is a named, checked
point on `main` with notes, cut about monthly while people are playing.

## Before

1. `pnpm check` — typecheck, lint, content (with the voice rules), unit tests,
   build, size budget. The first screen's budget is tight (184.1 kB of 185 on
   9 October 2026); a release that needs more raises it on purpose, with the
   reason in `docs/HOSTING.md`.
2. `pnpm test:e2e:local` — the browser suite, every device profile.
3. `pnpm soak 1000` — no crash or broken invariant.
4. `pnpm coverage 60` — authored content still reached (98% of events, 96% of
   decisions when last measured).
5. `pnpm screenshots` and `pnpm playthrough` — look at them. Then
   `pnpm guide:shots` so the guide and the About page show the game as it is.
6. `tests/engine/cohort.test.ts` passing means the facilitator's seed table
   still holds; if it failed and was updated, re-run `pnpm cohort` and check
   `docs/educator/FACILITATOR.md` matches.

## Cutting it

1. Move the **Unreleased** section of `CHANGELOG.md` under a version and date;
   write it for players, not developers.
2. Bump `version` in `package.json` to match.
3. Commit, tag `vX.Y.Z`, push both. The host deploys `main`.
4. Check the live site: the start screen, `/guide`, `/about`,
   `/accessibility`, a seed link, and one campaign started and saved.

## After

- Open problems reported on the issue tracker go into `docs/FINDINGS.md`
  once measured, and into **Known limitations** on `/about` if players should
  know about them.
- The month's playtest logs go through `pnpm session` (the tuning cadence in
  `docs/PLAYTEST.md`).
