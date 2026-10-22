# Character voice catalogue

Thirty-three prerecorded synthetic messages, twelve recurring characters. Playback is
explicit and optional in Inbox. The authoritative transcript is the message body
in campaign content, copied into `manifest.json` for exact runtime comparison.
Event ID, sender, subject and body must all match before playback is offered.
No voices are inferred for other messages, and no future correspondence is shown.
The audio reads the body; the sender and subject remain visible beside it.

| Character | Voice preset | Direction | Coverage |
|---|---|---|---|
| Marianne Okafor, CEO | `bf_isabella`, phrase speeds 0.96–1.08 | Direct, conversational | 3: opening, follow-up, year-end invitation |
| Tomas Lindqvist, CFO | `bm_george`, phrase speeds 0.95–1.03 | Measured, precise | 6: audit, next year's plan, acquisition, both boundary outcomes, external responders |
| Helen Brandt, COO | `bf_alice`, phrase speeds 0.96–1.05 | Practical, composed | 4: warehouse, fallback, both restore outcomes |
| Dev Raghunathan, CIO | `bm_daniel`, phrase speeds 0.97–1.06 | Fluent, concerned with delivery | 2: migration and review pressure |
| Jo Mbeki, Security Operations | `bf_emma`, phrase speeds 0.97–1.03 | Factual, composed | 2: response readiness and mailbox activity |
| Sir Alan Whitcombe, board chair | `bm_fable`, phrase speeds 0.94–1.00 | Deliberate, probing | 2: appetite and six-month review |
| Priya Nandakumar, Digital | `bf_lily`, phrase speeds 0.98–1.05 | Brisk, commercially focused | 2: releases and client questions |
| Nadia Farrell, Procurement | `mix-nadia`, phrase speeds 0.97–1.04 | Practical, matter-of-fact | 2: SOC and Corvus renewals |
| Ruth Ahmadi, Legal | `mix-ruth`, phrase speeds 0.95–1.01 | Precise, composed | 3: regulator and merchant questions, People Cloud disclosure |
| Fenella Osei, Governance | `mix-fenella`, phrase speeds 0.96–1.03 | Evidence-focused, measured | 3: audit findings matched and overstated, command record |
| Stefan Alvarez, Architecture | `mix-stefan`, phrase speeds 0.95–1.03 | Analytical, direct | 2: contradictory documents and unseen data flows |
| Callum Reid, Engineering | `bm_lewis`, phrase speeds 0.98–1.03 | Plain, delivery-focused | 2: vacancies and unsigned releases |

The four custom profile names refer to fixed blends of stock voice embeddings,
not recordings or clones of real people:

| Profile | Stock voice weights |
|---|---|
| `mix-nadia` | 70% `bf_emma`, 30% `bf_alice` |
| `mix-ruth` | 55% `bf_alice`, 45% `bf_lily` |
| `mix-fenella` | 45% `bf_emma`, 55% `bf_lily` |
| `mix-stefan` | 60% `bm_daniel`, 40% `bm_george` |

Weights are recorded as `voiceMix` in the manifest. Tests require positive weights
summing to one and an unchanged mix across a character's messages. Different
configured profiles are not proof that listeners can reliably distinguish them.

The owner found the original pilot monotonous, approved the revised CEO sample,
and requested that approach for the original six clips, then further coverage.
Each recording uses explicit
sentence/paragraph phrases, modest rate changes and pauses of 0.12–0.40 seconds
between phrases. The CEO welcome retains the sample's exact four-phrase plan.
The words and figures stay unchanged. The manifest records every phrase, rate
and pause; joined phrase text must match the authored body after whitespace
normalisation. A changed sentence count requires review of its direction plan.

The board preset was quieter in a technical level check. Its two new clips use
`loudnorm=I=-19:TP=-1.5:LRA=7`, resampled back to 24 kHz before MP3 encoding;
the manifest records that mastering filter. The original six files remain
unchanged. This reduces level variation; perceived loudness still needs listening.
The same filter is applied to the six newly added profiles. All earlier eighteen
MP3s are retained byte for byte in this expansion.

These are stock synthetic voices, not impersonations or claims about the
characters' nationalities. The owner approved the revised CEO preview. Broader
human listening review is pending: check pronunciation
(especially Nexora, Meridian, names and numbers), speaker distinction, naturalness
and whether delivery biases a decision. Do not claim voice improves comprehension
until people compare it with the same text. Keep independent observations and
prompted listening tasks separate in the existing focused review protocol.

## Provenance and generation

- Model: [hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M),
  Apache 2.0. The model repository declares the weights Apache-licensed.
  [Kokoro-LICENSE.txt](Kokoro-LICENSE.txt) retains the upstream licence.
- Offline runner: `kokoro-onnx==0.4.9` (MIT); phonemisation uses its bundled
  `espeakng-loader`. None of these tools, dependencies or model weights ship in
  the game or run in a player's browser.
- ONNX and voice table: [model-files-v1.0 release](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0).
  SHA-256 for `kokoro-v1.0.onnx`:
  `7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5`.
  SHA-256 for `voices-v1.0.bin`:
  `bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d`.
- Generated on 22 October 2026, English (`en-gb`), mono 24 kHz MP3, 48 kbit/s.
  `manifest.json` records each duration, preset and phrase direction. No third-party text
  service received campaign or player data.

To regenerate, install `kokoro-onnx==0.4.9` in a separate Python virtual
environment and install FFmpeg with libmp3lame. Download and verify the two model
files into a directory outside the repository. Then run:

```sh
python scripts/voice/generate.py /path/to/model-directory
```

The script reads current authored bodies, rewrites the 33 MP3s and manifest,
and generates `event-ids.json` for the lightweight UI gate and size check. Tests
require the IDs and manifest to agree, avoiding a separate manual playback list.
It leaves temporary WAVs in the model directory. Review any transcript changes
and listen before accepting new audio. Byte-identical output across runtimes is
not promised. Do not add Python/model dependencies to the player application.

## Loading and validation

The player and transcript manifest are deferred; MP3 URLs acquire no media source
until Play message is clicked. No preloading or autoplay. Switching messages,
leaving Inbox or changing campaign releases the player. Background tabs pause
without automatic resumption. Playback errors leave the text and retry controls
available. Audio does not change saves, resources, choices or clock state.

The catalogue has a 160 KiB per-clip and 3072 KiB total encoded budget, separate from
the unchanged title/critical-path budgets. Content tests verify exact transcripts,
all 33 files, consistent speaker mapping and fixed stock-voice mixes. UI tests verify explicit playback,
cleanup, mismatch protection and error recovery. Browser tests use real decoding
in Chromium/WebKit and verify on-request loading and phone layouts.
On restricted Linux runners, WebKit's media cache needs a writable `/var/tmp`;
without it the browser can reject valid MP3s with a temporary-file error.
Grant test-process cache access rather than weakening playback assertions.

The total allowance was deliberately raised from 768 to 2048 KiB for the first
expansion, then to 3072 KiB for the full cast. First-visit limits stay fixed;
all audio remains on request.
See [the review](../../../docs/VOICE_REVIEW.md) for selection and remaining gaps.

The incident expansion adds three authored, static messages with the existing
Tomas, Ruth and Fenella profiles. All earlier thirty files are preserved. It
adds no generic narration for changing operational reports and does not infer
incident identity from message wording. The 3072 KiB allowance is unchanged.
