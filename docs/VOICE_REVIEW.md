# Character voice review — 22 October 2026

The owner approved a revised CEO sample after finding the first pilot
monotonous, then requested more voice coverage. This review checks coverage,
text fidelity and playback behaviour. It does not establish that all voices
sound natural or improve comprehension; that still needs listening sessions.

## Findings and changes

| Finding | Change |
|---|---|
| Six clips covered three characters; delivery and operational voices were absent | Add Dev (CIO), Jo (Security Operations) and Sir Alan (board chair), two messages each |
| Voice stopped short of several consequential follow-ups | Add acquisition correspondence, both Kestrel boundary outcomes, both restore-test outcomes and the first-year review invitation |
| The playback ID list was maintained separately from generated recordings | Generate a small `event-ids.json` with the transcript manifest; use it in the UI gate and output-size checks |
| The owner preferred the revised phrasing over uniform delivery | Retain the original six recordings and approved CEO direction; give new recordings explicit sentence pacing and pauses |
| The new board preset measured quieter than the other cast | Master its two new clips with a recorded loudness filter and peak headroom; retain the original six files |

## Selected coverage

| Character | Clips | Coverage |
|---|---:|---|
| Marianne Okafor | 3 | First meeting, later uncertainty follow-up, first-year review invitation |
| Tomas Lindqvist | 5 | Audit, next year's plan, acquisition join, boundary held and lifted |
| Helen Brandt | 4 | Warehouse concern, funded fallback, restore within and beyond its window |
| Dev Raghunathan | 2 | Migration slipping, security review affecting delivery |
| Jo Mbeki | 2 | An unexercised incident plan, an unauthorised finance mailbox rule |
| Sir Alan Whitcombe | 2 | Risk appetite, the six-month post-encryption review |

These are existing authored messages with static bodies and known senders.
Playback is offered only after the message is delivered and its recorded ID,
sender, subject and body match. Voicing an outcome does not make it happen;
eligibility, randomness, choices, incident generation and saves are unchanged.
The six-month board message belongs to the after-breach opening, not every run.
Media test fixtures exercise reader behaviour separately from event reachability.

## Delivery and constraints

The catalogue grows from 6 to 18 clips and from 3 to 6 distinct stock voice
presets. Existing profiles and the CEO's approved four phrases are retained.
The new total encoded-audio allowance is 2048 KiB, up from 768 KiB; the per-clip
limit remains 160 KiB. MP3s are still fetched only on Play message. Initial
download budgets, optional sound cues and the full written correspondence stay
as before. The expanded player catalogue remains deferred.

Content tests check catalogue alignment, exact transcripts, phrase reconstruction,
speaker consistency, file presence and size limits. UI/browser checks cover
new-speaker discovery, real playback, switching without overlap, stopping on
navigation and narrow layouts. See `src/assets/voice/README.md` for generation
and licensing. Report the checks actually run when releasing this revision.

Focused verification during this pass: nine voice unit/content tests and twelve
browser cases passed across the six configured projects. All eighteen MP3s fully
decoded without errors. SHA-256 comparison against the six pre-expansion files
confirmed those recordings are unchanged. The measured catalogue is 1436.1 KiB,
within the new allowance. Full revision checks remain a separate release gate.

## Remaining listening work

Listen for names and numbers, noticeably abrupt phrase joins, speaker identity,
fatigue and whether delivery overstates a character's written certainty. Compare
the same messages with and without playback; keep prompted listening separate
from unaided play. Only the CEO preview has explicit owner approval so far.

Other characters, routine updates, full annual-review narration and dynamically
assembled incident correspondence remain outside this catalogue. Dynamic text
needs matching recordings for its actual wording before it can be voiced safely.
No runtime synthesis, inferred missing words or automatic narration is added.
