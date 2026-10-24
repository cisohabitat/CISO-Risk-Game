# Security review — 20 October 2026

This is a repository review and hardening pass, not an independent penetration
test or a guarantee that every vulnerability has been found.

## Scope

Reviewed browser rendering and URL inputs, save parsing/migration/activation,
local persistence, optional playtest logging, the local AI driver, static hosting
headers, build output configuration, dependencies and GitHub Actions. The deployed
app has no server API, authentication or remote data store. React renders player
text as text; the application has no raw HTML insertion or dynamic code execution
sink. The existing CSP restricts scripts to the same origin, disables objects and
frames, and is accompanied by nosniff and no-referrer headers. Inline styles are
still allowed for the interface and graph library.

## Findings and changes

- **Build dependency advisory:** `pnpm audit` reported the high-severity
  source-map-js indexed-source-map denial of service,
  [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
  Updated every locked source-map-js 1.2.1 reference to 1.2.2. This is in the
  build/test toolchain rather than the gameplay runtime. A subsequent full
  dependency audit reported zero known vulnerabilities. CI now repeats the audit
  and fails on moderate or higher advisories; registry failures are not ignored.
- **Unconfined local driver:** the development servers listened on all interfaces
  and served joined paths without a containment check. Both now bind only to
  127.0.0.1. Realpath checks reject path traversal and symlinks outside the build.
  The command service checks Host and Origin, rejects cross-site requests,
  requires JSON POSTs, and limits bodies to 64 KiB. Browser navigation stays on
  the local game's origin, and downloads use a basename inside the output folder.
- **Import activation before validation:** the store made imported state active
  before its asynchronous save guard checked invariants. Imports now verify
  campaign identity and engine invariants before changing state or queuing a
  write. Malformed imports preserve the running campaign and stored save.
- **Unbounded file parsing:** imports read the entire selected file before any
  size check. The file reader now rejects files over 16 MiB before calling text(),
  checks text length, and rejects more than 64 nesting levels, more than 500,000
  values, non-finite numbers and prototype-related keys before migration. The
  parser remains deferred until the player imports a file. Its module boundary
  adds about 0.3 KiB to the initial download; the code/CSS/font budget is raised
  from 220 to 221 KiB while page-rendering and visit limits are retained.
- **CI supply chain:** explicit contents:read permissions, non-persistent checkout
  credentials and immutable commit pins replace ambient permissions and mutable
  action tags. Pins were resolved from the official action repositories' v4 tags.

## Verification and limits

Regression tests exercise actual HTTP requests for traversal, symlinks, foreign
hosts/origins, malformed input and body limits. Import tests cover rejection before
reading oversized files, unsafe nested keys, nesting and numeric bounds, normal
round trips, and preservation of running state and stored progress. A browser
regression checks a failed import followed by reopening the original campaign.

Engine invariants are consistency checks, not a complete GameState schema or an
anti-cheat system. Local campaigns and exports remain editable by their owner.
The local driver is not designed to be exposed as a remote service. The review
does not inspect browser extensions, operating-system security, all Git history,
GitHub organisation settings or Vercel account configuration. Existing exports
are not encrypted. Dependency audit results describe the registry's known
advisories at the time checked.


## 24 October follow-up — deferred save effects

The review of main `4c0c312` reproduced a local prototype-pollution path. A save
with a pending `control.coverage` effect targeting `__proto__` passed the file
parser and all engine invariants. Applying that effect created an own `coverage`
property on `Object.prototype`. This requires importing a crafted local save;
remote execution, data exfiltration and an account/server compromise were not
shown. Ordinary invariant checks did not validate the future work's shape.

File and IndexedDB migration now share bounded pre-migration checks for unsafe
keys and reference values. Free-text notes retain those words. A deferred
save-safety validator checks pending effect schemas and content targets,
scheduled events and carried flag primitives before activation or persistence.
The reducer independently ignores reserved reference targets and reads object
maps through own properties, including ordinary inherited names like `toString`.
An invalid import is refused rather than sanitised into a different campaign.

Documentation URL rendering also rejects executable schemes such as JavaScript,
VBScript and data URLs; ordinary web/site/fragment links remain. This is build
renderer defence in depth: the published Markdown sources are repository-owned,
and the hosting CSP already restricts script execution.

Focused regressions cover the reproduced payload, inherited function targets,
malformed/unknown deferred effects, unsafe stored-save migration, valid pending
recruitment and temporary effects, free text, and preservation of active and
stored campaigns. Browser coverage imports both reserved and inherited targets
and then resumes the untouched campaign. The current dependency audit is clean;
a credential-pattern scan of tracked text found no matches (values were never
printed). This is not a complete secret-history scan or independent penetration
test. Full state-shape validation and anti-cheat remain outside the claim.


Saved-list initialization has explicit readiness and request ordering. Prepared
browser fixtures wait for both saved-list enumeration and campaign prefetch
before seeding a record/reloading, preventing navigation from interrupting a
new validation download. A late older listing cannot replace a newer result.
The focused ordering cases passed, and 18 WebKit save/voice cases passed over
two repeats after this readiness change. Full final-revision checks remain the
release gate; no test assertions or timeouts were relaxed for the fixture fix.
