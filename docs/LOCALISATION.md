# Localisation

Where the game's English lives, how much of it there is, and how a second
language would be added. Phase 4 of `docs/ROADMAP.md`. Nothing here is built
beyond the inventory; this is the plan the work follows when a language and a
translator are chosen.

## How much English there is

`pnpm strings` counts it. On 9 October 2026:

| Where | Strings | Words | Share |
|---|---:|---:|---:|
| Authored content (`src/content/nexora/`) | 2,308 | 24,219 | 80% |
| Composed by the engine (`src/game/`) | 458 | 3,889 | 13% |
| Printed by the screens (`src/components/`, `src/screens/`, `src/app/`) | 441 | 2,165 | 7% |
| **Total** | | **about 30,000** | |

The engine and screen figures count every quoted string of two or more words,
including some inside code comments, so they are an upper bound. Half of the
engine's words are the annual review (`src/game/debrief/review.ts`, about 2,000).

Add the player's guide (`docs/PLAYER_GUIDE.md`, about 5,000 words) if it is to
be translated too.

## The three kinds of text, and what each needs

**Content is a pack, so a translation is a pack.** The content pipeline
(Phase 2) already validates any pack file with `pnpm validate:content
--pack`. A French Nexora is the same pack with every prose string translated
and every id, number and condition left alone. That makes four-fifths of the
job a translator's, with the existing checks catching a broken reference. The
voice rules in `scripts/content/voice.ts` are English (British spelling,
"you should"); a second locale needs its own rule set, chosen by
`meta.locale`, and the shared rules (no ids, no day numbers, no exclamation
marks) carry over unchanged.

**The engine composes sentences, and those need templates.** The review, the
orchestrator's refusals and the daily highlights build English from parts:
`` `${family.name} tested the organisation on ${dateOf(day)}.` `` Word order,
plurals and grammatical agreement differ between languages, so these cannot
be translated by swapping words. Each becomes a keyed template with named
slots — `review.incident.tested: "{family} tested the organisation on
{date}."` — looked up from a table the pack supplies. The engine stays pure:
the table is data, passed in like the rest of the content. Plurals go through
`Intl.PluralRules`, never `count === 1 ? '' : 's'`.

**The screens print words, and those need a catalogue.** About 440 strings in
34 files. They move into one message catalogue per locale, looked up by key
with `Intl` formatting for numbers and plurals. Labels the tests and the guide
quote — "Skip ahead", "Begin your first day", "Print or save as PDF" — become
keys, and the tests read them from the English catalogue.

## Dates, money and names

- **Dates** are the campaign calendar (`src/game/time.ts`): month names come
  from a table, so they move into the locale's table with the rest. The
  one place the interface printed a real-world date in the browser's own
  locale — when a campaign was saved — now formats it in the interface's
  language (`src/lib/formatting/saved-at.ts`), so a British interface no
  longer shows an American date.
- **Money** is pounds in thousands and millions (`money()` in
  `src/game/types/primitives.ts`). Nexora is a British company, so a
  translation keeps sterling and changes only the formatting:
  `Intl.NumberFormat(locale, { style: 'currency', currency: 'GBP',
  notation: 'compact' })`.
- **People's names** stay as written. They are characters, not interface.

## The gate

A pseudo-locale build in CI: every catalogue and template string wrapped and
accented (`[Ŝķîƥ àĥéàð]`), and a browser test that fails if any visible text
on any screen is not. That is what proves extraction is complete. It comes
before the first real translation, not after.

## Order of work

1. Screens into a catalogue, with the pseudo-locale gate (one to two weeks).
2. Engine sentences into templates, starting with the review (two weeks).
3. Voice rules per locale; `meta.locale` on packs (days).
4. One real language: a translated pack, catalogue and template table, then
   a native speaker plays a quarter and marks every line that reads as a
   translation.
