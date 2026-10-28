"""Records every phrase the app speaks into public/audio/<key>.mp3 with the Kokoro voice model.

Setup (once):
  python3 -m venv .venv && .venv/bin/pip install kokoro-onnx soundfile
  Model: model_quantized.onnx from onnx-community/Kokoro-82M-v1.0-ONNX (also on npm as the
         6 parts of kokoro-q8-shards; cat them together).
  Voices: an .npz of the voices/*.bin files from the kokoro-js npm package, each reshaped to
          (-1, 1, 256) float32.

Run:
  node scripts/speech-texts.mjs > /tmp/texts.json
  .venv/bin/python scripts/make-audio.py /tmp/texts.json MODEL.onnx VOICES.npz [--force]

Existing clips are kept unless --force, so adding words only records the new ones.
Needs ffmpeg for the mp3 encoding.
"""
import json
import os
import subprocess
import sys
import tempfile

import soundfile as sf
from kokoro_onnx import Kokoro

VOICE = 'af_heart'
SPEED = 0.85  # a little slower than conversation, for a beginning reader
SOUND_SPEED = 0.7

texts, model, voices = sys.argv[1:4]
force = '--force' in sys.argv
out_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
os.makedirs(out_dir, exist_ok=True)
kokoro = Kokoro(model, voices)

items = json.load(open(texts))
for n, item in enumerate(items, 1):
    path = os.path.join(out_dir, f"{item['key']}.mp3")
    if os.path.exists(path) and not force:
        continue
    if 'ipa' in item:
        speed = SOUND_SPEED if item['key'].startswith('sound-') else SPEED
        audio, sr = kokoro.create(item['ipa'], voice=VOICE, speed=speed, is_phonemes=True)
    else:
        audio, sr = kokoro.create(item['text'], voice=VOICE, speed=SPEED, lang='en-us')
    with tempfile.NamedTemporaryFile(suffix='.wav') as wav:
        sf.write(wav.name, audio, sr)
        # Mono 48 kbps, trimmed of leading/trailing silence so taps feel instant.
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav.name, '-af',
                        'silenceremove=start_periods=1:start_threshold=-50dB,areverse,'
                        'silenceremove=start_periods=1:start_threshold=-50dB,areverse',
                        '-ac', '1', '-b:a', '48k', path], check=True)
    print(f"{n}/{len(items)} {item['key']}", file=sys.stderr)

keys = sorted(i['key'] for i in items)
with open(os.path.join(out_dir, 'clips.json'), 'w') as f:
    json.dump(keys, f, separators=(',', ':'))
print(f'{len(keys)} clips', file=sys.stderr)
