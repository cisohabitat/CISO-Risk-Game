# Hosting

## Build size

`pnpm build && pnpm size` prints the transfer size of every chunk against a
budget and fails if one is exceeded. CI runs it on every push, next to the
check that the output is still static. It is part of the job named after the
typecheck and the tests, so a red run there is not always a failing test.

The critical path is read out of `dist/index.html`: the module script, every
chunk it preloads and every blocking stylesheet. It is not a hand-kept list,
because a hand-kept list was wrong. Naming the graph library as a manual chunk
turned it into a shared chunk that the entry preloaded, so the budget reported
241 kB while a first-time player fetched 301 kB. A chunk that is meant to load
on demand is named in `MUST_STAY_LAZY` and the build fails if the entry asks
for it.

The campaign ships inside the client bundle — that is the point of a static
build, and it is why no request is made per tick — so every authored event adds
to what a first-time player downloads. Twenty-three kilobytes of consequence
callbacks went in during one session without anybody noticing, which is what the
budget is for: the cost of content should be a decision, not a drift.

The campaign is its own chunk, and it is not part of the first load. It
changes on a different cadence from the app, so a content edit does not
invalidate the cached app code and vice versa. The start screen needs none of
it except the starting situations, which have a small chunk of their own; the
rest is fetched as soon as the start screen is up, so starting or continuing
does not wait on it. Moving it out took the first screen from 258.2 kB to
176.7 kB, and moving schema validation into a module loaded only in
development took it to 174.9 kB. If a deploy replaces the files while the
start screen is open, the page reloads once to pick up the new version. `MUST_STAY_LAZY` fails the build if
the campaign or its loader is ever preloaded again, which one static import
from the start screen is enough to do.

The chunking is written as Rolldown's `advancedChunks` groups in
`vite.config.ts`. A `manualChunks` function returning a separate name for the
situations file had no effect under Rolldown: the file stayed in the campaign
chunk, the output did not change by a byte, and the campaign was still
preloaded.

Raising a budget is fine when the content is worth it; do it deliberately, in
`scripts/size-budget.ts`.

## The constraint

The MVP is a **static client application**. Its normal play loop must not touch
metered compute at all:

- the whole simulation runs in the browser;
- campaign content ships as static assets inside the bundle;
- saves live in IndexedDB on the device;
- no server rendering, no API route, no cron, no queue, no websocket;
- no database and no runtime secret;
- deployment keeps working if every optional integration is removed.

```text
Browser
  ├── Static HTML/CSS/JS from the CDN
  ├── Pure TypeScript simulation in-browser
  ├── IndexedDB save data on device
  └── Static authored scenario content
```

## Vercel settings

```text
Framework preset:  Vite
Install command:   pnpm install --frozen-lockfile
Build command:     pnpm build
Output directory:  dist
Node.js:           22.x or 24.x (build only — nothing runs at request time)
```

`vercel.json` sets SPA rewrites, immutable caching for hashed assets and a strict
Content-Security-Policy. It defines no functions and no cron.

The SPA fallback deliberately excludes `assets/`, `favicon.svg` and
`manifest.webmanifest`. Vercel checks the filesystem before applying rewrites, so
those files would be served anyway, but excluding them means the rule does not
depend on that ordering.

The player's guide is the one page that does depend on it. The build renders
`docs/PLAYER_GUIDE.md` into `dist/guide.html` (`scripts/guide/`), with its
pictures emitted as hashed files in `assets/`, and `cleanUrls` serves it at
`/guide` because the file exists. It is plain HTML with inline styles and no
script, so the Content-Security-Policy needs nothing new, and it adds nothing to
the game's first load. `vite preview` resolves `/guide` the same way, which is
what `tests/e2e/guide.spec.ts` checks.

Note that Vercel schema-validates this file and **rejects any property it does
not recognise**, including comment keys — adding one fails the deployment. The
constraints above are therefore asserted in `tests/content/deployment.test.ts`
rather than written into the file as comments.

## Release gate

A build is not release-ready unless all of the following hold:

1. `pnpm build` produces a static `dist/` application.
2. No gameplay path imports or calls a serverless function or API route.
3. No server-rendered page is required.
4. A new player can start with no account.
5. A campaign can be completed with browser-local persistence only.
6. Save migration tests pass (`tests/engine/saves.test.ts`).
7. Optional online services can fail without preventing play — there are none in
   the MVP, so this holds by construction.
8. No cron or background process is required.
9. No secret is embedded in the client bundle.
10. Production assets are optimised and the deployment size reviewed.
11. Playwright passes desktop, tablet, phone and 320px projects against the
    production build.
12. The Vercel deployment succeeds under Hobby settings.
13. The suite passes against the deployed URL, not only against a local build:

    ```bash
    BASE_URL=https://ciso-risk-game.vercel.app pnpm test:e2e:live
    ```

    This is the only check that exercises the hosting configuration itself —
    SPA rewrites, headers, caching and asset paths. It has to run from a
    machine that can reach the deployment: the remote development environment
    this project is worked on from has a network policy that rejects the
    connection to `vercel.app`, so the step is a person's, at a terminal of
    their own, and its result is recorded in `FINDINGS.md` like anything else.
14. Vercel usage after a scripted full playthrough shows no unexpected compute.
    The Functions tab should show no invocations at all: normal gameplay makes
    no request after the app shell and content have loaded.

**Who checks what.** CI covers 1–3, 6 and 11 on every push. Steps 4, 5, 7, 8, 9
and 14 are asserted by `tests/content/release-gate.test.ts`, which reads them
off the source rather than trusting that somebody remembered: it fails the build
if any application file gains a network primitive, an account, a remote store or
an environment variable that is not one of Vite's build-time booleans. Step 10
is `pnpm size` against the budget below.

That leaves **12, 13 and 14's confirmation** — the three that genuinely need a
deployment to exist. Nothing in the repository can check those, and no test
should pretend to. They are done by a person, against the live URL, before a
release is called done.

Step 14 deserves a note: the reason the Functions tab shows nothing is not
restraint, it is that the application has no way to make a request at all. The
test above holds it that way, so an accidental analytics call fails `pnpm check`
rather than appearing on a bill.

Treat any accidental server dependency in the MVP as an architectural
regression, not a convenience.

## Bundle budget

The initial bundle carries the app shell, the engine and the campaign content.
The dependency graph library is lazy-loaded into its own chunk and is only
fetched when a player opens the graph view; the year view (the annual review
and timeline) is split the same way. Both are listed in `MUST_STAY_LAZY`, and
`pnpm size` fails if either is fetched before the first screen or stops being
a chunk of its own. `pnpm check` runs the budget. Check after changes:

```bash
pnpm build && pnpm size   # every chunk, and what the entry HTML fetches first
```

Keep the graph library, and anything of comparable weight, out of the initial
chunk — and note that a dynamic import is not enough on its own. Do not give
such a library a `manualChunks` name: that makes it a shared chunk the entry
preloads, which is how it spent a while being fetched by every first-time
player despite the `lazy()` around it. `pnpm size` now prints `first load` or
`on demand` beside each chunk, which is the thing to read.

## Commercial use

Vercel Hobby is for personal, non-commercial projects. If this is deployed as a
paid product, an enterprise training product or an organisational service, move
to Vercel Pro or another appropriate production platform. Do not work around the
plan terms.

## If cloud save is ever added

It must remain a progressive enhancement: IndexedDB stays canonical, the browser
talks to the provider SDK directly, sync happens on checkpoints rather than
ticks, and losing the service degrades to local-only play. It must not turn the
core campaign into a serverless application.
