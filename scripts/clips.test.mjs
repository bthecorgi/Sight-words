import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { clipKey } from '../public/clips.js';

const audio = new URL('../public/audio/', import.meta.url);

test('clip keys are file-safe', () => {
  assert.equal(clipKey('Hello! Let’s read.'), 'hello-lets-read');
  assert.equal(clipKey('I'), 'i');
  assert.equal(clipKey('The big red cat.'), 'the-big-red-cat');
});

test('every phrase the app speaks has a recording', () => {
  const items = JSON.parse(execFileSync('node', [new URL('./speech-texts.mjs', import.meta.url).pathname]));
  const listed = new Set(JSON.parse(readFileSync(new URL('clips.json', audio))));
  const missing = items.filter((i) => !listed.has(i.key) || !existsSync(new URL(`${i.key}.mp3`, audio)));
  assert.deepEqual(missing.map((i) => i.key), [], 'run scripts/make-audio.py to record them');
});
