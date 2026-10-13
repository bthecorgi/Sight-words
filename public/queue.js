// Which card comes next. Pure functions over a profile's state, so they can be tested in Node.
import { LEARN_AHEAD, DAY, dayKey, dayStart } from './srs.js';
import { newOrder, WEEKS } from './deck.js';

export const LAST_WEEK = WEEKS.length;

export const isLearning = (c) => c && (c.state === 'learning' || c.state === 'relearning');

// The plan week for `now`, counted from the profile's start date (week 1 = the first 7 days).
export function currentWeek(startDate, now) {
  const [y, m, d] = startDate.split('-').map(Number);
  const start = dayStart(new Date(y, m - 1, d, 12).getTime());
  const days = Math.round((dayStart(now) - start) / DAY);
  return Math.min(LAST_WEEK, Math.max(1, Math.floor(days / 7) + 1));
}

// The start date that puts `now` on the first day of `week`.
export function startDateFor(week, now) {
  const d = new Date(dayStart(now));
  d.setDate(d.getDate() - (week - 1) * 7);
  return dayKey(d.getTime() + 12 * 3600 * 1000);
}

// Daily counters: new cards introduced per deck, and reviews done.
export function dayStats(p, now) {
  const k = dayKey(now);
  p.days[k] ||= { new: {}, rev: 0, stars: 0 };
  p.days[k].new ||= {};
  return p.days[k];
}

const DECKS = ['s', 'c', 'f', 'p'];
// Round-robin order for introducing new cards: sight words get the most turns.
const NEW_TURNS = ['s', 'c', 's', 'f', 'p'];

export function newLimit(settings, deck) {
  return { s: settings.newSight, f: settings.newSight, c: settings.newCvc, p: settings.newSentences }[deck];
}

// New cards still to introduce, per deck, in teaching order. A "find it" card only
// unlocks once he can read the word: its read card graduated on an earlier day.
export function newCards(p, week, now = Date.now()) {
  const st = p.settings;
  const order = newOrder(week, { find: st.findCards, cvc: st.cvcCards, sentences: st.sentenceCards });
  const fresh = (id) => !p.cards[id] || p.cards[id].state === 'new';
  return {
    s: order.s.filter(fresh),
    f: order.f.filter((id) => {
      const read = p.cards[`s:${id.slice(2)}`];
      return fresh(id) && read?.state === 'review' && read.last < dayStart(now);
    }),
    c: order.c.filter(fresh),
    p: order.p.filter(fresh),
  };
}

// Cards that belong to decks switched off in Settings are skipped (but keep their progress).
function enabled(p, id) {
  const st = p.settings;
  const k = id[0];
  return k === 's' || (k === 'f' && st.findCards) || (k === 'c' && st.cvcCards) || (k === 'p' && st.sentenceCards);
}

export function counts(p, week, now) {
  const day = dayStats(p, now);
  let learn = 0; let due = 0;
  for (const [id, c] of Object.entries(p.cards)) {
    if (!enabled(p, id)) continue;
    if (isLearning(c)) { if (c.due <= now + LEARN_AHEAD) learn++; } else if (c.state === 'review' && c.due <= now) due++;
  }
  due = Math.min(due, Math.max(0, p.settings.maxReviews - (day.rev || 0)));
  const nc = newCards(p, week, now);
  let fresh = 0;
  for (const d of DECKS) fresh += Math.min(nc[d].length, Math.max(0, newLimit(p.settings, d) - (day.new[d] || 0)));
  return { learn, due, fresh };
}

// session: { sinceNew, newTurn, last } — mutable session bookkeeping owned by the caller.
export function nextCard(p, week, now, session) {
  const day = dayStats(p, now);
  const entries = Object.entries(p.cards).filter(([id]) => enabled(p, id));
  const learning = entries.filter(([, c]) => isLearning(c)).sort((a, b) => a[1].due - b[1].due);
  const learnNow = learning.find(([id, c]) => c.due <= now && id !== session.last);
  if (learnNow) return learnNow[0];

  const reviewsLeft = p.settings.maxReviews - (day.rev || 0);
  const reviews = reviewsLeft > 0
    ? entries.filter(([, c]) => c.state === 'review' && c.due <= now).sort((a, b) => a[1].due - b[1].due)
    : [];

  const nc = newCards(p, week, now);
  let fresh = null;
  for (let i = 0; i < NEW_TURNS.length && !fresh; i++) {
    const d = NEW_TURNS[(session.newTurn + i) % NEW_TURNS.length];
    if (nc[d].length && (day.new[d] || 0) < newLimit(p.settings, d)) {
      fresh = nc[d][0];
      session.pendingTurn = (session.newTurn + i + 1) % NEW_TURNS.length;
    }
  }

  // One new card after every two reviews keeps old words warm while new ones come in.
  if (fresh && (!reviews.length || session.sinceNew >= 2)) return fresh;
  if (reviews.length) return reviews[0][0];
  if (fresh) return fresh;

  const learnSoon = learning.find(([id, c]) => c.due <= now + LEARN_AHEAD && id !== session.last);
  if (learnSoon) return learnSoon[0];
  // Only the card just answered is left: show it again if it's due rather than stopping.
  const only = learning.find(([, c]) => c.due <= now);
  return only ? only[0] : null;
}

// The learning card that will be due next, if the session is waiting on one.
export function nextLearningDue(p, now) {
  return Object.entries(p.cards)
    .filter(([id, c]) => enabled(p, id) && isLearning(c) && c.due <= now + LEARN_AHEAD)
    .sort((a, b) => a[1].due - b[1].due)[0]?.[1].due ?? null;
}

// Status used for the word garden: seed (not started), sprout (learning),
// bud (reviewing), flower (known well, 21+ day interval).
export function wordStatus(card) {
  if (!card || card.state === 'new') return 'seed';
  if (card.state !== 'review') return 'sprout';
  return card.ivl >= 21 ? 'flower' : 'bud';
}

// Most-missed words first, for "tricky words" practice.
export function trickyWords(p, words, n = 10) {
  return words
    .map((w) => ({ w, c: p.cards[`s:${w}`] }))
    .filter(({ c }) => c && c.state !== 'new')
    .sort((a, b) => (b.c.lapses - a.c.lapses) || (a.c.ease - b.c.ease) || (a.c.ivl - b.c.ivl))
    .slice(0, n)
    .map(({ w }) => w);
}

// Three wrong answers for a "find it" card: other words he has met, preferring ones that
// look alike (same first letter or length) so he has to actually read.
export function distractors(word, pool, rng = Math.random) {
  const others = [...new Set(pool)].filter((w) => w.toLowerCase() !== word.toLowerCase());
  const score = (w) => (w[0].toLowerCase() === word[0].toLowerCase() ? 2 : 0) + (Math.abs(w.length - word.length) <= 1 ? 1 : 0) + rng();
  return others.sort((a, b) => score(b) - score(a)).slice(0, 3);
}

export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
