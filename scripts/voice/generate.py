"""Regenerate the six pilot clips offline; see src/assets/voice/README.md."""
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
]
MODEL_HASHES = {
    'kokoro-v1.0.onnx': '7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5',
    'voices-v1.0.bin': 'bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d',
}


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
    manifest = []
    for event_id, voice, speeds, pauses in PROFILES:
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
        for text, speed, pause in zip(text_parts, speeds, pauses):
            speech, rate = model.create(text, voice=voice, speed=speed, lang='en-gb')
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
        subprocess.run([
            'ffmpeg', '-v', 'error', '-y', '-i', str(temporary),
            '-codec:a', 'libmp3lame', '-b:a', '48k', '-ac', '1',
            '-map_metadata', '-1', str(OUTPUT / filename),
        ], check=True)
        manifest.append({
            'eventId': event_id, 'subject': event['title'], 'body': event['body'],
            'file': filename, 'voice': voice, 'phrases': phrases,
            'durationSeconds': round(len(samples) / rate, 2), 'from': event['from'],
        })
        print(event_id, manifest[-1]['durationSeconds'], 'seconds', flush=True)
    (OUTPUT / 'manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')


if __name__ == '__main__':
    main()
