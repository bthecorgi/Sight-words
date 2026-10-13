import test from 'node:test';
import assert from 'node:assert/strict';
import { rankVoices, isNovelty } from '../public/voices.js';

const v = (name, lang, voiceURI) => ({ name, lang, voiceURI });
// Shaped like iOS: alphabetical, novelty and Eloquence voices tagged en-US alongside real ones.
const IOS = [
  v('Albert', 'en-US', 'com.apple.speech.synthesis.voice.Albert'),
  v('Bad News', 'en-US', 'com.apple.speech.synthesis.voice.BadNews'),
  v('Daniel', 'en-GB', 'com.apple.voice.compact.en-GB.Daniel'),
  v('Eddy (English (US))', 'en-US', 'com.apple.eloquence.en-US.Eddy'),
  v('Fred', 'en-US', 'com.apple.speech.synthesis.voice.Fred'),
  v('Grandma (English (US))', 'en-US', 'com.apple.eloquence.en-US.Grandma'),
  v('Karen', 'en-AU', 'com.apple.voice.compact.en-AU.Karen'),
  v('Rishi', 'en-IN', 'com.apple.voice.compact.en-IN.Rishi'),
  v('Samantha', 'en-US', 'com.apple.voice.compact.en-US.Samantha'),
  v('Trinoids', 'en-US', 'com.apple.speech.synthesis.voice.Trinoids'),
  v('Zarvox', 'en-US', 'com.apple.speech.synthesis.voice.Zarvox'),
  v('Tingting', 'zh-CN', 'com.apple.voice.compact.zh-CN.Tingting'),
];

test('novelty and robotic voices are never offered', () => {
  const names = rankVoices(IOS).map((x) => x.name);
  for (const bad of ['Albert', 'Bad News', 'Fred', 'Trinoids', 'Zarvox', 'Eddy (English (US))', 'Grandma (English (US))', 'Tingting']) {
    assert.ok(!names.includes(bad), bad);
  }
  assert.ok(isNovelty(v('Albert', 'en-US', 'x')));
});

test('automatic picks Samantha on a stock iPhone', () => {
  assert.equal(rankVoices(IOS)[0].name, 'Samantha');
});

test('a downloaded Enhanced or Premium voice wins', () => {
  const withEnhanced = [...IOS, v('Ava (Enhanced)', 'en-US', 'com.apple.voice.enhanced.en-US.Ava')];
  assert.equal(rankVoices(withEnhanced)[0].name, 'Ava (Enhanced)');
  const withPremium = [...withEnhanced, v('Zoe (Premium)', 'en-US', 'com.apple.voice.premium.en-US.Zoe')];
  assert.equal(rankVoices(withPremium)[0].name, 'Zoe (Premium)');
});

test('desktop Chrome prefers the Google US voice', () => {
  const chrome = [v('Google UK English Male', 'en-GB', 'Google UK English Male'), v('Google US English', 'en-US', 'Google US English')];
  assert.equal(rankVoices(chrome)[0].name, 'Google US English');
});
