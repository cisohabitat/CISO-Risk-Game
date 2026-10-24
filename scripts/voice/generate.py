"""Regenerate selected character clips offline; see src/assets/voice/README.md."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import wave

os.environ['OMP_NUM_THREADS'] = '2'
from kokoro_onnx import Kokoro
import onnxruntime as ort
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'src/assets/voice'
PROFILES = [
    ('evt-day-one', 'bf_isabella', [1.00, 1.02, 1.08, 0.96], [0.12, 0.32, 0.40, 0]),
    ('evt-con-ceo-honest-returns', 'bf_isabella', [1.02, 1.04, 0.96], [0.25, 0.32, 0]),
    ('evt-audit-report', 'bm_george', [0.99, 1.03, 0.97, 0.95], [0.18, 0.32, 0.22, 0]),
    ('evt-con-next-year-plan', 'bm_george', [1.00, 0.97, 0.96], [0.22, 0.28, 0]),
    ('evt-legacy-question', 'bf_alice', [1.02, 1.04, 0.98, 0.96, 1.02, 0.97], [0.18, 0.32, 0.14, 0.22, 0.30, 0]),
    ('evt-con-legacy-fallback-used', 'bf_alice', [1.05, 1.00, 0.96], [0.28, 0.30, 0]),
    ('evt-year-end-notice', 'bf_isabella', [1.00, 1.04, 0.96], [0.20, 0.35, 0]),
    ('evt-acquisition-integration', 'bm_george', [0.99, 1.03, 0.98, 0.95], [0.16, 0.30, 0.18, 0]),
    ('evt-con-kestrel-held', 'bm_george', [0.99, 1.02, 0.96], [0.24, 0.28, 0]),
    ('evt-con-kestrel-lifted', 'bm_george', [0.99, 1.03, 0.96], [0.22, 0.28, 0]),
    ('evt-con-recovery-tested', 'bf_alice', [1.02, 1.05, 0.97], [0.22, 0.30, 0]),
    ('evt-con-recovery-struggled', 'bf_alice', [1.00, 1.04, 0.96], [0.24, 0.32, 0]),
    ('evt-biz-migration-slip', 'bm_daniel', [1.02, 1.06, 1.00, 0.97], [0.18, 0.30, 0.20, 0]),
    ('evt-biz-cio-pressure', 'bm_daniel', [1.04, 0.99, 1.01], [0.24, 0.22, 0]),
    ('evt-org-ir-plan', 'bf_emma', [1.00, 0.97, 1.03], [0.22, 0.28, 0]),
    ('evt-thr-mailbox-rule', 'bf_emma', [1.01, 0.97, 1.02], [0.22, 0.26, 0]),
    ('evt-biz-board-appetite', 'bm_fable', [0.98, 0.94], [0.32, 0]),
    ('evt-sit-breach-six-months', 'bm_fable', [0.96, 1.00, 0.94], [0.24, 0.34, 0]),
    ('evt-biz-release-pressure', 'bf_lily', [1.05, 0.99], [0.22, 0]),
    ('evt-biz-customer-question', 'bf_lily', [1.04, 0.98], [0.28, 0]),
    ('evt-soc-renewal', 'mix-nadia', [1.01, 1.04, 0.97], [0.22, 0.18, 0]),
    ('evt-q4-corvus-renewal', 'mix-nadia', [1.00, 1.03, 1.01, 0.97], [0.20, 0.24, 0.22, 0]),
    ('evt-biz-regulator-thematic', 'mix-ruth', [0.99, 0.96, 1.01], [0.24, 0.18, 0]),
    ('evt-biz-merchant-complaint', 'mix-ruth', [1.00, 0.95], [0.30, 0]),
    ('evt-con-audit-shown', 'mix-fenella', [1.00, 1.03, 0.96], [0.22, 0.28, 0]),
    ('evt-con-audit-overstated', 'mix-fenella', [0.99, 1.03, 0.96], [0.24, 0.30, 0]),
    ('evt-org-doc-contradiction', 'mix-stefan', [1.02, 0.97, 0.95], [0.22, 0.26, 0]),
    ('evt-biz-shadow-project', 'mix-stefan', [1.03, 0.97, 1.00], [0.24, 0.22, 0]),
    ('evt-org-vacancy-pressure', 'bm_lewis', [1.02, 0.98], [0.26, 0]),
    ('evt-org-unsigned-releases', 'bm_lewis', [1.03, 0.99], [0.24, 0]),
    ('evt-con-incident-command-recalled', 'mix-fenella', [1.00, 1.03, 0.96], [0.20, 0.30, 0]),
    ('evt-con-incident-external-invoiced', 'bm_george', [1.00, 0.96], [0.28, 0]),
    ('evt-org-hr-provider-incident', 'mix-ruth', [0.99, 0.96], [0.26, 0]),
    ('evt-team-intro', 'mix-fenella', [1.00, 1.03, 0.98, 1.00, 0.99, 0.96], [0.18, 0.40, 0.20, 0.24, 0.28, 0]),
]
MODEL_HASHES = {
    'kokoro-v1.0.onnx': '7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5',
    'voices-v1.0.bin': 'bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d',
}
MASTERING = {'bm_fable': 'loudnorm=I=-19:TP=-1.5:LRA=7'}
VOICE_MIXES = {
    'mix-nadia': {'bf_emma': 0.70, 'bf_alice': 0.30},
    'mix-ruth': {'bf_alice': 0.55, 'bf_lily': 0.45},
    'mix-fenella': {'bf_emma': 0.45, 'bf_lily': 0.55},
    'mix-stefan': {'bm_daniel': 0.60, 'bm_george': 0.40},
}
for profile in ['bf_lily', 'bm_lewis', *VOICE_MIXES]:
    MASTERING[profile] = 'loudnorm=I=-19:TP=-1.5:LRA=7'


def phrase_text(event_id, body):
    if event_id == 'evt-day-one':
        # Preserve the owner's approved sample's four phrases exactly.
        opening, inventory, question = body.split('\n\n')
        welcome, rest = opening.split('. ', 1)
        return [welcome + '.', rest, inventory, question]
    return re.split(r'(?<=[.!?])\s+', body)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('model_dir', type=Path)
    parser.add_argument('--event', action='append', choices=[profile[0] for profile in PROFILES],
                        help='Regenerate only this event; retain other manifest entries and MP3s. Repeatable.')
    args = parser.parse_args()
    for name, expected in MODEL_HASHES.items():
        actual = hashlib.sha256((args.model_dir / name).read_bytes()).hexdigest()
        if actual != expected:
            raise ValueError(f'Unexpected model file: {name}')

    # Bound CPU usage. The runner otherwise chooses all available host cores.
    original_session = ort.InferenceSession

    def bounded_session(*session_args, **kwargs):
        options = ort.SessionOptions()
        options.intra_op_num_threads = 2
        options.inter_op_num_threads = 1
        kwargs['sess_options'] = options
        return original_session(*session_args, **kwargs)

    ort.InferenceSession = bounded_session
    model = Kokoro(str(args.model_dir / 'kokoro-v1.0.onnx'),
                   str(args.model_dir / 'voices-v1.0.bin'))
    events = {}
    for source in sorted((ROOT / 'src/content/nexora/events').glob('*.json')):
        data = json.loads(source.read_text())
        for event in data if isinstance(data, list) else data['events']:
            events[event['id']] = event

    OUTPUT.mkdir(parents=True, exist_ok=True)
    retained = {clip['eventId']: clip for clip in json.loads((OUTPUT / 'manifest.json').read_text())} if args.event else {}
    manifest = []
    for event_id, voice, speeds, pauses in PROFILES:
        if args.event and event_id not in args.event:
            manifest.append(retained[event_id])
            continue
        event = events[event_id]
        if '{{' in event['body']:
            raise ValueError(f'Dynamic text needs a separate recording: {event_id}')
        text_parts = phrase_text(event_id, event['body'])
        if len(text_parts) != len(speeds) or len(speeds) != len(pauses):
            raise ValueError(f'Review phrasing after a transcript change: {event_id}')
        if ' '.join(text_parts) != ' '.join(event['body'].split()):
            raise ValueError(f'Phrasing changed the transcript: {event_id}')
        phrases = []
        rendered = []
        mix = VOICE_MIXES.get(voice)
        if mix and (any(weight <= 0 for weight in mix.values()) or abs(sum(mix.values()) - 1) > 1e-6):
            raise ValueError(f'Invalid stock voice mix: {voice}')
        speaker = sum(model.voices[name] * weight for name, weight in mix.items()).astype(np.float32) if mix else voice
        for text, speed, pause in zip(text_parts, speeds, pauses):
            speech, rate = model.create(text, voice=speaker, speed=speed, lang='en-gb')
            rendered.extend([speech, np.zeros(round(rate * pause), dtype=np.float32)])
            phrases.append({'text': text, 'speed': speed, 'pauseAfterSeconds': pause})
        samples = np.concatenate(rendered)
        temporary = args.model_dir / f'{event_id}.wav'
        with wave.open(str(temporary), 'wb') as out:
            out.setnchannels(1)
            out.setsampwidth(2)
            out.setframerate(rate)
            out.writeframes((samples.clip(-1, 1) * 32767).astype('<i2').tobytes())
        filename = f'{event_id}.mp3'
        mastering = MASTERING.get(voice)
        filters = ['-af', mastering] if mastering else []
        subprocess.run([
            'ffmpeg', '-v', 'error', '-y', '-i', str(temporary),
            *filters, '-ar', '24000', '-codec:a', 'libmp3lame', '-b:a', '48k', '-ac', '1',
            '-map_metadata', '-1', str(OUTPUT / filename),
        ], check=True)
        manifest.append({
            'eventId': event_id, 'subject': event['title'], 'body': event['body'],
            'file': filename, 'voice': voice, 'phrases': phrases,
            'durationSeconds': round(len(samples) / rate, 2), 'from': event['from'],
        })
        if mastering:
            manifest[-1]['mastering'] = mastering
        if mix:
            manifest[-1]['voiceMix'] = mix
        print(event_id, manifest[-1]['durationSeconds'], 'seconds', flush=True)
    (OUTPUT / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    (OUTPUT / 'event-ids.json').write_text(json.dumps([clip['eventId'] for clip in manifest], indent=2) + '\n')


if __name__ == '__main__':
    main()
