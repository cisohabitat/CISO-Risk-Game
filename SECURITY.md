# Security

CISO: First Year is a static browser application. Campaigns and optional playtest
logs stay on the player's device until explicitly exported. There is no account,
server API or cloud save. Exported campaigns can include free-text notes.

Please report a suspected vulnerability privately through GitHub's **Report a
vulnerability** feature when available, or contact the repository maintainer
privately. Include the affected revision, a minimal reproduction and expected
impact. Do not include credentials, personal notes or another person's save in a
public issue. This file does not establish a response-time commitment.

For contributors, run `pnpm audit:security` and `pnpm check`, then the full
`pnpm test:e2e` suite sequentially before pushing. Keep immutable action pins,
read-only CI permissions and the browser's import boundary intact. See
[the review record](docs/SECURITY_REVIEW.md) for tested boundaries and limits.
