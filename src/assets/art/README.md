# Nexora artwork

## Illustrated title screen

`start-desktop.webp` (1600×900, 122,046 bytes) and `start-mobile.webp`
(720×1281, 77,514 bytes) are decorative office scenes generated with OpenAI
image generation on 17 October 2026 from the owner's approved title-screen
mockup. They depict a fictional CISO overlooking Singapore; they do not imply
an official affiliation or change the fictional Nexora campaign setting.
Sources remain in the session's generated-image library. Assets are resized
and encoded as WebP at quality 76; they contain no interface text.

`StartHero` selects one scene with `<picture>` at the 640px breakpoint. It uses
an empty image alt, a permanent navy fallback and readable HTML copy/buttons.
The artwork never gates starting or resuming. Do not preload both variants.
`scripts/size-budget.ts` enforces each encoded image size and the complete
first-visit transfer, while the existing 220 KiB code/CSS/font gate stays in
place. Browser tests cover responsive selection, direct play, resume and image
failure. Keep character and incident atlases deferred as before.

## Character portraits

`nexora-people.webp` is a 720 × 960 image with three columns and four rows of
square portraits, without gutters. It is 80,460 bytes. The source was generated
with OpenAI image generation on 16 October 2026 for this fictional cast, then
resized and encoded as WebP at quality 80. No real person's image was used as a
reference.

The direction is restrained editorial illustration: warm paper, muted teal,
ochre and charcoal, distinct silhouettes and composed expressions. The faces
are character identity, not indicators of competence, trust, morale or risk.

Read cells left to right, top to bottom:

| Row | Left | Centre | Right |
| --- | --- | --- | --- |
| 1 | Marianne Okafor (`stk-ceo`) | Dev Raghunathan (`stk-cio`) | Helen Brandt (`stk-coo`) |
| 2 | Tomas Lindqvist (`stk-cfo`) | Priya Nandakumar (`stk-digital`) | Sir Alan Whitcombe (`stk-board`) |
| 3 | Nadia Farrell (`stk-procurement`) | Ruth Ahmadi (`stk-legal`) | Jo Mbeki (`lead-soc`) |
| 4 | Stefan Alvarez (`lead-arch`) | Fenella Osei (`lead-grc`) | Callum Reid (`lead-eng`) |

`PersonPortrait` in `src/components/game/Person.tsx` crops cells in CSS. Keep
the 3:4 sheet ratio and this order when replacing the atlas, or update its ID
mapping together. Vite emits a hashed asset URL. Portraits use lazy images and
one cached download, not embedded image data or remote image services. A missing
portrait or a failed image request leaves initials visible. Every image has an
empty alt attribute because a readable name is adjacent.

`src/components/game/NexoraMark.tsx` defines the company mark as inline SVG. It
uses the existing theme's accent text token and has no image download.

Review portraits in Board, Team and Inbox at desktop and 320px, in both themes.
Run `pnpm check` and `pnpm test:e2e:local` after changes. Browser coverage in
`tests/e2e/art.spec.ts` checks that the start screen never requests the atlas
and that it loads on the people screens. Full browser coverage remains required
before deployment, as set out in the root `AGENTS.md`.

## Incident scenes

`nexora-incidents.webp` is a 960 × 640 atlas (123,886 bytes) with two columns and
two rows. The four scenes are service interruption, information exposure,
containment and recovery, in that order. Generated with OpenAI image generation
on 16 October 2026; encoded as WebP at quality 79. The warm editorial palette
matches the portraits. No real person's image was supplied as a reference.

`IncidentIllustration` selects a decorative scene using only the already-visible
incident name and phase. It never reads the hidden attack path. The scene is
not evidence about a particular affected service. It loads lazily, stays compact
beside live response controls, and appears again with reconstruction notes.
Keep dates, impact, response status and decisions as text.

Empty-state vignettes in `src/components/ui/EmptyIllustration.tsx` are inline
SVGs for research, correspondence, people and maps. They add no image download
and follow the existing light and dark theme tokens.
