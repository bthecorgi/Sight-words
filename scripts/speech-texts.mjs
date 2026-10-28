// Prints, as JSON, every clip the app needs: [{ key, text }] or [{ key, ipa }] for phonics
// sounds. scripts/make-audio.py turns this into public/audio/<key>.mp3.
import { WORDS, WEEKS, SOUNDS } from '../public/deck.js';
import { clipKey, EXTRA_PHRASES } from '../public/clips.js';

// Sound tiles as IPA, so the voice makes the sound instead of reading letters like "sss".
const IPA = {
  a: 'ˈæ', e: 'ˈɛ', i: 'ˈɪ', o: 'ˈɑ', u: 'ˈʌ',
  b: 'bə', c: 'kə', d: 'də', f: 'fːː', g: 'ɡə', h: 'hə', j: 'ʤə', k: 'kə', l: 'lːː',
  m: 'mːː', n: 'nːː', p: 'pə', r: 'ɹːː', s: 'sːː', t: 'tə', v: 'vːː', w: 'wə', x: 'ks',
  y: 'jə', z: 'zːː', ch: 'ʧə', sh: 'ʃːː', th: 'θːː', ck: 'kə',
};

// Respellings in deck.js ("thuh") steer device voices; give the recording the real sounds.
const SAY_IPA = { thuh: 'ðˈʌ', uh: 'ˈʌ' };

const out = new Map();
const add = (text) => {
  const key = clipKey(text);
  if (key && !out.has(key)) out.set(key, SAY_IPA[text] ? { key, ipa: SAY_IPA[text] } : { key, text });
};

for (const [w, d] of Object.entries(WORDS)) { add(d.say || w); add(d.ex); }
for (const wk of WEEKS) {
  wk.cvc.forEach(add);
  for (const s of wk.sentences) {
    add(s);
    // Each word in a sentence can be tapped on its own (see frontHtml in app.js).
    for (const t of s.split(' ')) {
      const bare = t.replace(/[^A-Za-z']/g, '');
      const w = WORDS[bare] ? bare : WORDS[bare.toLowerCase()] ? bare.toLowerCase() : bare;
      add(WORDS[w]?.say || w);
    }
  }
}
EXTRA_PHRASES.forEach(add);
for (const g of Object.keys(SOUNDS)) out.set(`sound-${g}`, { key: `sound-${g}`, ipa: IPA[g] });

process.stdout.write(JSON.stringify([...out.values()], null, 1));
