# Hosting

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
    SPA rewrites, headers, caching and asset paths.
14. Vercel usage after a scripted full playthrough shows no unexpected compute.
    The Functions tab should show no invocations at all: normal gameplay makes
    no request after the app shell and content have loaded.

CI covers 1–3, 6 and 11 on every push; the remainder are checked before release.

Treat any accidental server dependency in the MVP as an architectural
regression, not a convenience.

## Bundle budget

The initial bundle carries the app shell, the engine and the campaign content.
The dependency graph library is lazy-loaded into its own chunk and is only
fetched when a player opens the graph view. Check after changes:

```bash
pnpm build   # review the emitted chunk sizes
```

Keep the graph library, and anything of comparable weight, out of the initial
chunk.

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
