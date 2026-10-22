# Character voice pilot

Six prerecorded synthetic messages, three recurring stakeholders. Playback is
explicit and optional in Inbox. The authoritative transcript is the message body
in campaign content, copied into `manifest.json` for exact runtime comparison.
Event ID, sender, subject and body must all match before playback is offered.
No voices are inferred for other messages, and no future correspondence is shown.
The audio reads the body; the sender and subject remain visible beside it.

| Character | Voice preset | Direction | Messages |
|---|---|---|---|
| Marianne Okafor, CEO | `bf_emma`, speed 1.04 | Direct, concise | `evt-day-one`, `evt-con-ceo-honest-returns` |
| Tomas Lindqvist, CFO | `bm_george`, speed 0.98 | Measured, precise | `evt-audit-report`, `evt-con-next-year-plan` |
| Helen Brandt, COO | `bf_alice`, speed 1.00 | Practical, composed | `evt-legacy-question`, `evt-con-legacy-fallback-used` |

These are stock synthetic voices, not impersonations or claims about the
characters' nationalities. Human listening review is pending: check pronunciation
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
  `manifest.json` records each duration, preset and speed. No third-party text
  service received campaign or player data.

To regenerate, install `kokoro-onnx==0.4.9` in a separate Python virtual
environment and install FFmpeg with libmp3lame. Download and verify the two model
files into a directory outside the repository. Then run:

```sh
python scripts/voice/generate.py /path/to/model-directory
```

The script reads current authored bodies, rewrites the six MP3s and manifest,
and leaves temporary WAVs in the model directory. Review any transcript changes
and listen before accepting new audio. Byte-identical output across runtimes is
not promised. Do not add Python/model dependencies to the player application.

## Loading and validation

The player and transcript manifest are deferred; MP3 URLs acquire no media source
until Play message is clicked. No preloading or autoplay. Switching messages,
leaving Inbox or changing campaign releases the player. Background tabs pause
without automatic resumption. Playback errors leave the text and retry controls
available. Audio does not change saves, resources, choices or clock state.

The pilot has a 160 KiB per-clip and 768 KiB total encoded budget, separate from
the unchanged title/critical-path budgets. Content tests verify exact transcripts,
six files and consistent speaker mapping. UI tests verify explicit playback,
cleanup, mismatch protection and error recovery. Browser tests use real decoding
in Chromium/WebKit and verify on-request loading and phone layouts.
On restricted Linux runners, WebKit's media cache needs a writable `/var/tmp`;
without it the browser can reject valid MP3s with a temporary-file error.
Grant test-process cache access rather than weakening playback assertions.
