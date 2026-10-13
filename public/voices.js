// Picks a natural-sounding English voice. Pure functions over SpeechSynthesisVoice-like
// objects ({ name, lang, voiceURI }), so they can be tested in Node.

// Apple ships joke and robotic voices tagged en-US. They sort first alphabetically
// (Albert, Bad News, Bahh…), so without this list "Automatic" would pick one.
const NOVELTY = new Set([
  'albert', 'bad news', 'bahh', 'bells', 'boing', 'bubbles', 'cellos', 'deranged', 'fred',
  'good news', 'hysterical', 'jester', 'junior', 'kathy', 'organ', 'pipe organ', 'princess',
  'ralph', 'superstar', 'trinoids', 'whisper', 'wobble', 'zarvox',
  // Eloquence voices: older synthesiser, clearly robotic.
  'eddy', 'flo', 'grandma', 'grandpa', 'reed', 'rocko', 'sandy', 'shelley',
]);

// Clear, natural voices that work well for a child, best first.
const PREFERRED = ['ava', 'samantha', 'allison', 'zoe', 'susan', 'nicky', 'evan', 'tom', 'joelle', 'noelle',
  'google us english', 'microsoft aria', 'microsoft jenny', 'karen', 'daniel', 'serena', 'moira', 'tessa'];

const baseName = (v) => v.name.toLowerCase().replace(/\s*\((enhanced|premium|compact|[a-z]{2}[-_][a-z]{2,})\)\s*$/, '')
  .replace(/\s*(enhanced|premium)$/, '').trim();
const lang = (v) => v.lang.replace('_', '-').toLowerCase();

export function isNovelty(v) {
  const id = (v.voiceURI || '').toLowerCase();
  return NOVELTY.has(baseName(v)) || id.includes('eloquence') || id.includes('speech.synthesis.voice.');
}

export function quality(v) {
  const id = `${v.voiceURI} ${v.name}`.toLowerCase();
  if (id.includes('premium')) return 3;
  if (id.includes('enhanced') || id.includes('natural') || id.includes('neural')) return 2;
  if (id.includes('compact')) return 0;
  return 1;
}

function score(v) {
  const pref = PREFERRED.findIndex((p) => baseName(v).startsWith(p));
  // Compact vs unlabelled says little across platforms; only Enhanced/Premium earn a higher tier.
  return Math.max(1, quality(v)) * 100
    + (pref === -1 ? 0 : 50 - pref)
    + (lang(v) === 'en-us' ? 5 : 0);
}

// English voices without the novelty ones, best first.
export function rankVoices(voices) {
  return voices.filter((v) => lang(v).startsWith('en') && !isNovelty(v))
    .sort((a, b) => score(b) - score(a));
}
