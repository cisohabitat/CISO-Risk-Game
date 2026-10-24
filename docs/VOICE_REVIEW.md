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
| Six recurring characters still had no voiced messages | Add two existing messages each for Priya, Nadia, Ruth, Fenella, Stefan and Callum; retain all earlier eighteen files |

## Selected coverage

| Character | Clips | Coverage |
|---|---:|---|
| Marianne Okafor | 3 | First meeting, later uncertainty follow-up, first-year review invitation |
| Tomas Lindqvist | 6 | Audit, next year's plan, acquisition join, boundary held and lifted, external responder invoice |
| Helen Brandt | 4 | Warehouse concern, funded fallback, restore within and beyond its window |
| Dev Raghunathan | 2 | Migration slipping, security review affecting delivery |
| Jo Mbeki | 2 | An unexercised incident plan, an unauthorised finance mailbox rule |
| Sir Alan Whitcombe | 2 | Risk appetite, the six-month post-encryption review |
| Priya Nandakumar | 2 | Release cadence and client security questions |
| Nadia Farrell | 2 | SOC renewal and Corvus contract direction |
| Ruth Ahmadi | 3 | Regulatory scope, merchant card-data questions, People Cloud disclosure |
| Fenella Osei | 4 | Audit evidence matched and overstated, incident command record, early team introduction |
| Stefan Alvarez | 2 | Conflicting architecture documents and unseen data flows |
| Callum Reid | 2 | Engineering vacancies and unsigned releases |

These are existing authored messages with static bodies and known senders.
Playback is offered only after the message is delivered and its recorded ID,
sender, subject and body match. Voicing an outcome does not make it happen;
eligibility, randomness, choices, incident generation and saves are unchanged.
The six-month board message belongs to the after-breach opening, not every run.
Media test fixtures exercise reader behaviour separately from event reachability.

## Delivery and constraints

The catalogue grew from 6 to 18 clips, and now to 30 across the full recurring
cast; the incident pass adds three more, for 33. Eight profiles use individual stock voices and four use fixed stock-voice
blends recorded in the manifest. These are twelve configured identities;
perceptual recognition remains a listening question. Existing profiles and
the CEO's approved four phrases are retained.
The new total encoded-audio allowance is 3072 KiB, up from 2048 KiB; the per-clip
limit remains 160 KiB. MP3s are still fetched only on Play message. Initial
download budgets, optional sound cues and the full written correspondence stay
as before. The expanded player catalogue remains deferred.

Content tests check catalogue alignment, exact transcripts, phrase reconstruction,
speaker consistency, file presence and size limits. UI/browser checks cover
new-speaker discovery, real playback, switching without overlap, stopping on
navigation and narrow layouts. See `src/assets/voice/README.md` for generation
and licensing. Report the checks actually run when releasing this revision.

Verification of the earlier 18-clip expansion: nine voice unit/content tests and twelve
browser cases passed across the six configured projects. All eighteen MP3s fully
decoded without errors. SHA-256 comparison against the six pre-expansion files
confirmed those recordings are unchanged. The measured catalogue is 1436.1 KiB,
within its 2048 KiB allowance. The full-cast pass has its own file-preservation,
decode, mix-consistency and browser checks; report their measured results when
releasing it. Full revision checks remain a separate release gate.

Full-cast focused verification: nine voice unit/content tests, typechecking and
eighteen browser cases passed. All thirty files fully decoded, and SHA-256
comparison confirmed the earlier eighteen MP3s are unchanged. Audio totals
2232.0 KiB within the 3072 KiB allowance. The new profiles' measured MP3 peaks
remain below full scale. These technical checks do not establish naturalness or
perceptual speaker recognition.

## Remaining listening work

Listen for names and numbers, noticeably abrupt phrase joins, speaker identity,
fatigue and whether delivery overstates a character's written certainty. Compare
the same messages with and without playback; keep prompted listening separate
from unaided play. Only the CEO preview has explicit owner approval so far.

Routine updates, full annual-review narration and dynamically
assembled incident correspondence remain outside this catalogue. Dynamic text
needs matching recordings for its actual wording before it can be voiced safely.
No runtime synthesis, inferred missing words or automatic narration is added.

## Incident correspondence pass

Add the existing command-record follow-up, external responder invoice and People
Cloud disclosure with their established speaker profiles. These static bodies
contain no substituted incident names, severity or service figures. They remain
subject to their existing delivery conditions and exact transcript matching.
The response follow-ups are scheduled by the existing command and external
support choices; the supplier disclosure retains its existing availability.
No event, decision, eligibility, simulation or incident attribution changes.
All earlier thirty recordings and the 3072 KiB total allowance are retained.
Browser fixtures check decoding and switching for all three added recordings;
they do not establish event reachability or human listening quality.

Incident asset verification: all 33 MP3s fully decoded with FFmpeg; SHA-256
comparison confirmed all earlier 30 recordings are unchanged. The catalogue
measures 2476.8 KiB within the unchanged 3072 KiB allowance.

## Team introduction — 24 October 2026

The owner selected Fenella’s existing day-two team introduction for the next
recording. It establishes the team and competing workload early, using her
existing `mix-fenella` blend and mastering filter. Six sentence phrases vary
slightly in rate; the longer pause before the workload warning separates
introductions from the practical constraint. No authored text, delivery
conditions or effects change. All earlier 33 recordings are retained, giving
34 clips within the unchanged 3072 KiB allowance. Playback remains explicit
and transcript-matched. Human pronunciation and naturalness review is pending.

Asset verification: the new clip is 22.57 seconds and 132.8 KiB; the catalogue
is 2609.7 KiB within 3072 KiB. All 34 files fully decode with FFmpeg. SHA-256
comparison confirms all earlier 33 MP3s are unchanged, and their manifest
entries are identical. Browser coverage includes the new clip in the existing
real-decoding, switching and on-request playback checks.
