// The 16-week blended Fry First 50 + Dolch Pre-Primer plan, as data.
// Pure module (no DOM) so scripts/sight-words.test.mjs can check it in Node.

// Every sight word: which list it's from, whether it's concrete (has a picture) or
// abstract, a picture for concrete words, and an example sentence read aloud on the back.
// list: both = on Fry First 50 and Dolch Pre-Primer, fry = Fry only, dolch = Dolch only.
export const WORDS = {
  the: { list: 'both', ex: 'The cat is big.', say: 'thuh' },
  a: { list: 'both', ex: 'I see a red hat.', say: 'uh' },
  and: { list: 'both', ex: 'A cat and a bat.' },
  big: { list: 'dolch', pic: '🐘', ex: 'The pig is big.' },
  little: { list: 'dolch', pic: '🐭', ex: 'A little cat.' },
  red: { list: 'dolch', pic: '🔴', ex: 'I have a red hat.' },
  I: { list: 'both', ex: 'I can run.' },
  to: { list: 'both', ex: 'We go to bed.' },
  in: { list: 'both', ex: 'The cat is in the box.' },
  is: { list: 'both', ex: 'It is a dog.' },
  blue: { list: 'dolch', pic: '🔵', ex: 'The cup is blue.' },
  yellow: { list: 'dolch', pic: '🟡', ex: 'The sun is yellow.' },
  it: { list: 'both', ex: 'Can you see it?' },
  for: { list: 'both', ex: 'This is for you.' },
  you: { list: 'both', ex: 'I see you!' },
  of: { list: 'fry', ex: 'A cup of milk.' },
  that: { list: 'fry', ex: 'Look at that dog!' },
  we: { list: 'both', ex: 'We can play.' },
  can: { list: 'both', ex: 'I can jump.' },
  said: { list: 'both', ex: 'Mom said yes.' },
  not: { list: 'both', ex: 'It is not hot.' },
  run: { list: 'dolch', pic: '🏃', ex: 'I can run fast.' },
  jump: { list: 'dolch', pic: '🦘', ex: 'Jump up high!' },
  play: { list: 'dolch', pic: '⚽', ex: 'Let us play.' },
  he: { list: 'fry', ex: 'He is my dad.' },
  was: { list: 'fry', ex: 'It was fun.' },
  on: { list: 'fry', ex: 'The cat is on the mat.' },
  are: { list: 'fry', ex: 'We are here.' },
  go: { list: 'dolch', pic: '🟢', ex: 'Go, go, go!' },
  come: { list: 'dolch', pic: '👋', ex: 'Come and see.' },
  help: { list: 'dolch', pic: '🤝', ex: 'Can you help me?' },
  as: { list: 'fry', ex: 'As big as a bus.' },
  with: { list: 'fry', ex: 'Come with me.' },
  his: { list: 'fry', ex: 'That is his hat.' },
  they: { list: 'fry', ex: 'They can run.' },
  look: { list: 'dolch', pic: '👀', ex: 'Look at me!' },
  see: { list: 'dolch', pic: '👁️', ex: 'I see a bug.' },
  find: { list: 'dolch', pic: '🔍', ex: 'Can you find it?' },
  at: { list: 'fry', ex: 'Look at the sun.' },
  be: { list: 'fry', ex: 'I will be good.' },
  this: { list: 'fry', ex: 'This is my dog.' },
  have: { list: 'fry', ex: 'I have a cat.' },
  make: { list: 'dolch', pic: '🎨', ex: 'Let us make a cake.' },
  me: { list: 'dolch', pic: '🙋', ex: 'Look at me!' },
  my: { list: 'dolch', pic: '🎒', ex: 'This is my bag.' },
  from: { list: 'fry', ex: 'A gift from Mom.' },
  or: { list: 'fry', ex: 'Red or blue?' },
  had: { list: 'fry', ex: 'I had fun.' },
  by: { list: 'fry', ex: 'Sit by me.' },
  here: { list: 'dolch', pic: '📍', ex: 'Come here!' },
  where: { list: 'dolch', pic: '🗺️', ex: 'Where is my hat?' },
  away: { list: 'dolch', pic: '✈️', ex: 'The bird flew away.' },
  word: { list: 'fry', ex: 'Read the word.' },
  but: { list: 'fry', ex: 'It is big but not red.' },
  what: { list: 'fry', ex: 'What is that?' },
  all: { list: 'fry', ex: 'We all like cake.' },
  one: { list: 'both', pic: '1️⃣', ex: 'I have one dog.' },
  two: { list: 'dolch', pic: '2️⃣', ex: 'I see two cats.' },
  three: { list: 'dolch', pic: '3️⃣', ex: 'One, two, three!' },
  were: { list: 'fry', ex: 'We were at the park.' },
  when: { list: 'fry', ex: 'When can we go?' },
  your: { list: 'fry', ex: 'Is this your cup?' },
  there: { list: 'fry', ex: 'Look over there!' },
  up: { list: 'dolch', pic: '⬆️', ex: 'Look up!' },
  down: { list: 'dolch', pic: '⬇️', ex: 'Sit down.' },
  funny: { list: 'dolch', pic: '😂', ex: 'That is funny!' },
  use: { list: 'fry', ex: 'Use a pen.' },
  an: { list: 'fry', ex: 'I had an egg.' },
  each: { list: 'fry', ex: 'We each get one.' },
  which: { list: 'fry', ex: 'Which one is yours?' },
  she: { list: 'fry', ex: 'She is my mom.' },
  do: { list: 'fry', ex: 'What do you see?' },
  how: { list: 'fry', ex: 'How are you?' },
  their: { list: 'fry', ex: 'That is their dog.' },
  if: { list: 'fry', ex: 'Hop if you can!' },
};

// Pictures for the CVC (consonant-vowel-consonant) words, shown on the back of the card.
export const CVC_PICS = {
  cat: '🐱', bat: '🦇', map: '🗺️', fan: '🪭',
  hat: '🎩', mat: '🧘', cap: '🧢', tap: '👆',
  bed: '🛏️', red: '🟥', net: '🥅', pen: '🖊️',
  van: '🚐', jam: '🍓', hen: '🐔', ten: '🔟',
  pig: '🐷', sit: '🪑', lip: '👄', win: '🏆',
  big: '🐘', dig: '⛏️', pin: '📌', tin: '🥫',
  six: '6️⃣', web: '🕸️', ham: '🍖', zip: '🤐',
  lid: '🫙', mix: '🥣', vet: '🩺', pan: '🍳',
  dog: '🐶', hop: '🐸', top: '🔝', box: '📦',
  pop: '🎈', hot: '🔥', pot: '🍲', dot: '⚫',
  sun: '☀️', bug: '🐛', cup: '☕', run: '🏃',
  mud: '🟤', bus: '🚌', log: '🪵', nut: '🥜',
  chip: '🍟', chop: '🪓', ship: '🚢', shop: '🏪', fish: '🐟', bath: '🛁', moth: '🦋', thin: '📏',
};

// sight: new sight words, in the order the plan lists them.
// cvc: new phonics words. sentences: reading cards that only use words he can read by that week
// (sight words so far, plus decodable CVC words with vowels already taught; the test checks this).
// review: for weeks 13–16, the words that week's focus practice drills.
export const WEEKS = [
  {
    n: 1, month: 'August', title: 'The Core Overlap',
    sight: ['the', 'a', 'and', 'big', 'little', 'red'],
    cvcFocus: 'Short A', cvc: ['cat', 'bat', 'map', 'fan'],
    application: 'Read and write phrases like “The big red cat.”',
    sentences: ['The big red cat.', 'A little bat and a big cat.', 'The red fan and the map.'],
  },
  {
    n: 2, month: 'August', title: 'Pronouns & Colors',
    sight: ['I', 'to', 'in', 'is', 'blue', 'yellow'],
    cvcFocus: 'The -at and -ap families', cvc: ['hat', 'mat', 'cap', 'tap'],
    application: 'Read and write phrases like “I am in a blue hat.”',
    sentences: ['I am in a blue hat.', 'The cat is in the yellow hat.', 'I tap the big blue map.'],
  },
  {
    n: 3, month: 'August', title: 'Introducing Abstract Fry Words',
    sight: ['it', 'for', 'you', 'of', 'that'],
    cvcFocus: 'Short E', cvc: ['bed', 'red', 'net', 'pen'],
    application: 'Point out “of” and “that” in your daily reading books.',
    sentences: ['That is a red pen for you.', 'It is in the net.', 'A map of the big red bed.'],
  },
  {
    n: 4, month: 'August', title: 'Action Verbs & Mixed Practice',
    sight: ['we', 'can', 'said', 'not', 'run', 'jump', 'play'],
    cvcFocus: 'Mixed Short A & Short E', cvc: ['van', 'jam', 'hen', 'ten'],
    application: 'Act out the action words (run, jump, play) to make them stick.',
    sentences: ['We can run and jump.', 'Dad said we can play.', 'The hen said, “I can not jump.”'],
  },
  {
    n: 5, month: 'September', title: 'Core Connectors & Action Verbs',
    sight: ['he', 'was', 'on', 'are', 'go', 'come', 'help'],
    cvcFocus: 'Short I', cvc: ['pig', 'sit', 'lip', 'win'],
    application: 'Read short sentences together; let him find the new words.',
    sentences: ['He was on the big red bed.', 'Come and help the little pig!', 'The pigs are in the pen.'],
  },
  {
    n: 6, month: 'September', title: 'Pronouns & Discovery',
    sight: ['as', 'with', 'his', 'they', 'look', 'see', 'find'],
    cvcFocus: 'The -ig and -in families', cvc: ['big', 'dig', 'pin', 'tin'],
    application: 'Play “find it”: hide word cards around the room.',
    sentences: ['Look! I see his big pig.', 'Can you find his tin cap?', 'They dig with a red pen.'],
  },
  {
    n: 7, month: 'September', title: 'More Connectors & Personal Pronouns',
    sight: ['at', 'be', 'this', 'have', 'make', 'me', 'my'],
    cvcFocus: 'Mixed A, E & I', cvc: ['six', 'web', 'ham', 'zip'],
    application: 'Make a “me and my” book: one sentence and a drawing per page.',
    sentences: ['This is my big blue hat.', 'Look at me! I can be a cat.', 'I have six red pens.'],
  },
  {
    n: 8, month: 'September', title: 'Prepositions & Directions',
    sight: ['from', 'or', 'had', 'by', 'here', 'where', 'away'],
    cvcFocus: 'Decodable books (e.g. Bob Books)', cvc: ['lid', 'mix', 'vet', 'pan'],
    application: 'Start decodable readers and spot this week’s words in them.',
    sentences: ['Where is my red hat?', 'The bat is here, by the bed.', 'The cat ran away from the big pig.'],
  },
  {
    n: 9, month: 'October', title: 'Question Words & Numbers',
    sight: ['word', 'but', 'what', 'all', 'one', 'two', 'three'],
    cvcFocus: 'Short O', cvc: ['dog', 'hop', 'top', 'box'],
    application: 'Count things around the house and read the number words.',
    sentences: ['What is in the box?', 'One, two, three, hop!', 'All the dogs can hop, but not the cat.'],
  },
  {
    n: 10, month: 'October', title: 'Abstract Concepts & Directions',
    sight: ['were', 'when', 'your', 'there', 'up', 'down', 'funny'],
    cvcFocus: 'The -op and -ot families', cvc: ['pop', 'hot', 'pot', 'dot'],
    application: 'Play “up and down”: he moves as he reads the word.',
    sentences: ['Your dog is funny!', 'When were you up there?', 'The pot was hot.'],
  },
  {
    n: 11, month: 'October', title: 'The Final Fry Push',
    sight: ['use', 'an', 'each', 'which'],
    cvcFocus: 'Short U', cvc: ['sun', 'bug', 'cup', 'run'],
    application: 'Ask “which one?” questions at snack time and point to the word.',
    sentences: ['Which cup is your cup?', 'Use the red cup in the sun.', 'We each had an egg and a bun.'],
  },
  {
    n: 12, month: 'October', title: 'Wrapping up the First 50',
    sight: ['she', 'do', 'how', 'their', 'if'],
    cvcFocus: 'Mixed: all five short vowels', cvc: ['mud', 'bus', 'log', 'nut'],
    application: 'Celebrate: every Fry First 50 word has been introduced.',
    sentences: ['She can run in the mud.', 'How do you get on the bus?', 'If it is hot, we can play in the sun.', 'Their dog sat on a log.'],
  },
  {
    n: 13, month: 'November', title: 'Consolidation',
    sight: [], review: ['of', 'that', 'was', 'said', 'they', 'were', 'their', 'there', 'where', 'what', 'which', 'when', 'your', 'from', 'each'],
    reviewLabel: 'The 15 hardest abstract words',
    cvcFocus: 'Consonant blends: ch, sh, th', cvc: ['chip', 'chop', 'ship', 'shop', 'fish', 'bath', 'moth', 'thin'],
    application: 'Practice the tricky words daily; hunt for ch, sh and th in books.',
    sentences: ['The fish is on the ship.', 'Dad and I go to the shop.', 'A thin moth is in the bath.'],
  },
  {
    n: 14, month: 'November', title: 'Writing Integration',
    sight: [], review: ['red', 'blue', 'yellow', 'one', 'two', 'three', 'run', 'jump', 'play', 'go', 'come', 'help', 'look', 'see', 'find', 'make'],
    reviewLabel: 'Dolch color, number & action words',
    cvcFocus: 'Write one sentence a day: a sight word + a CVC word', cvc: [],
    application: 'Write one complete sentence a day. Check the capital letter and the period.',
    sentences: ['I can see three red dogs.', 'Come and help me dig.'],
  },
  {
    n: 15, month: 'November', title: 'Comprehension Focus',
    sight: [], review: 'first35', reviewLabel: 'Words 1–35',
    cvcFocus: 'Reading comprehension', cvc: [],
    application: 'After a decodable book, ask: Where does it happen? Who is it about?',
    sentences: ['Where are the three funny dogs?', 'Look! What is down there by the bus?'],
  },
  {
    n: 16, month: 'November', title: 'The Final Milestone',
    sight: [], review: 'rest', reviewLabel: 'The remaining words (36–75)',
    cvcFocus: 'Celebrate!', cvc: [],
    application: 'He now has the sight-word vocabulary of an early 1st grader. 🎉',
    sentences: ['They were all up on the big red bus.', 'Which one is your word? I can find it!'],
  },
];

// All sight words in teaching order (week order, then the plan's order within a week).
export const ALL_SIGHT = WEEKS.flatMap((w) => w.sight);

export const weekOfSight = (w) => WEEKS.find((x) => x.sight.includes(w))?.n;

// Words a review week drills, resolved to a list.
export function reviewWords(week) {
  const r = week.review;
  if (!r) return week.sight;
  if (r === 'first35') return ALL_SIGHT.slice(0, 35);
  if (r === 'rest') return ALL_SIGHT.slice(35);
  return r;
}

// The plan's "pair concrete with abstract" rule: when new words come in, alternate
// abstract (no picture) and concrete (picture) words within each week.
export function interleave(words) {
  const abs = words.filter((w) => !WORDS[w].pic);
  const con = words.filter((w) => WORDS[w].pic);
  const out = [];
  while (abs.length || con.length) {
    if (abs.length) out.push(abs.shift());
    if (con.length) out.push(con.shift());
  }
  return out;
}

// Splits a word into sound tiles, keeping ch/sh/th together.
export function graphemes(word) {
  const out = [];
  for (let i = 0; i < word.length; i++) {
    const two = word.slice(i, i + 2);
    if (['ch', 'sh', 'th', 'ck'].includes(two)) { out.push(two); i++; } else out.push(word[i]);
  }
  return out;
}

// What the speech engine says for each sound tile. These are approximations: built-in
// voices can't make isolated phonemes, so model the sounds yourself where they're off.
export const SOUNDS = {
  a: 'aah', e: 'eh', i: 'ih', o: 'aw', u: 'uh',
  b: 'buh', c: 'kuh', d: 'duh', f: 'fff', g: 'guh', h: 'huh', j: 'juh', k: 'kuh', l: 'lll',
  m: 'mmm', n: 'nnn', p: 'puh', r: 'rrr', s: 'sss', t: 'tuh', v: 'vvv', w: 'wuh', x: 'ks',
  y: 'yuh', z: 'zzz', ch: 'chuh', sh: 'shhh', th: 'thh', ck: 'kuh',
};

// Card ids: s:<word> read a sight word, f:<word> hear it and find it, c:<word> sound out a
// CVC word, p:<week>.<i> read a sentence.
export function cardInfo(id) {
  const [kind, rest] = [id.slice(0, 1), id.slice(2)];
  if (kind === 'p') {
    const [wk, i] = rest.split('.').map(Number);
    return { kind, week: wk, text: WEEKS[wk - 1].sentences[i] };
  }
  if (kind === 'c') return { kind, word: rest, week: WEEKS.find((w) => w.cvc.includes(rest)).n };
  return { kind, word: rest, week: weekOfSight(rest) };
}

// New cards in the order they should be introduced, for every week up to `week`.
export function newOrder(week, { find = true, cvc = true, sentences = true } = {}) {
  const out = { s: [], f: [], c: [], p: [] };
  for (const w of WEEKS.filter((x) => x.n <= week)) {
    for (const word of interleave(w.sight)) {
      out.s.push(`s:${word}`);
      if (find) out.f.push(`f:${word}`);
    }
    if (cvc) out.c.push(...w.cvc.map((x) => `c:${x}`));
    if (sentences) out.p.push(...w.sentences.map((_, i) => `p:${w.n}.${i}`));
  }
  return out;
}
