import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WORDS, WEEKS, ALL_SIGHT, CVC_PICS, SOUNDS, graphemes, interleave, newOrder, reviewWords, cardInfo,
} from '../public/deck.js';
import {
  currentWeek, startDateFor, counts, nextCard, newCards, distractors, trickyWords, dayStats, findGrade,
} from '../public/queue.js';
import { newCard, schedule, AGAIN, HARD, GOOD, EASY, MIN, DAY } from '../public/srs.js';

const FRY_50 = 'the of and a to in is you that it he was for on are as with his they I at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if'.split(' ');
const DOLCH_PP = 'a and away big blue can come down find for funny go help here I in is it jump little look make me my not one play red run said see the three to two up we where yellow you'.split(' ');

test('the plan covers every Fry First 50 and Dolch Pre-Primer word exactly once', () => {
  assert.equal(new Set(ALL_SIGHT).size, ALL_SIGHT.length, 'a word is taught twice');
  const union = new Set([...FRY_50, ...DOLCH_PP]);
  assert.deepEqual([...union].sort(), [...ALL_SIGHT].sort());
  assert.equal(ALL_SIGHT.length, 75);
  assert.deepEqual(Object.keys(WORDS).sort(), [...ALL_SIGHT].sort());
});

test('list tags match the source lists', () => {
  for (const w of ALL_SIGHT) {
    const fry = FRY_50.includes(w);
    const dolch = DOLCH_PP.includes(w);
    assert.equal(WORDS[w].list, fry && dolch ? 'both' : fry ? 'fry' : 'dolch', w);
  }
});

test('every example sentence uses its word, and every phonics word has a picture and sounds', () => {
  for (const w of ALL_SIGHT) assert.match(WORDS[w].ex, new RegExp(`\\b${w}\\b`, 'i'), w);
  for (const wk of WEEKS) {
    for (const w of wk.cvc) {
      assert.ok(CVC_PICS[w], `no picture for ${w}`);
      for (const g of graphemes(w)) assert.ok(SOUNDS[g], `no sound for ${g} in ${w}`);
    }
  }
});

test('review weeks 15 and 16 together cover all words', () => {
  assert.deepEqual([...reviewWords(WEEKS[14]), ...reviewWords(WEEKS[15])], ALL_SIGHT);
  for (const wk of WEEKS.slice(12)) for (const w of reviewWords(wk)) assert.ok(WORDS[w], `${w} isn't a sight word`);
});

// A sentence card should only use words he can read by that week: sight words introduced so far,
// phonics words so far, or regular CVC/VC words whose short vowel has been taught.
test('sentences are decodable in their week', () => {
  const VOWEL_WEEK = { a: 1, e: 3, i: 5, o: 9, u: 11 };
  const EXTRA = { egg: 3 };
  const decodable = (w, n) => {
    const m = w.match(/^[bcdfghjklmnprstvwz]?([aeiou])[bcdfgklmnprstvxz]$/);
    if (m) return VOWEL_WEEK[m[1]] <= n;
    return EXTRA[w] <= n;
  };
  for (const wk of WEEKS) {
    const sight = new Set(WEEKS.filter((x) => x.n <= wk.n).flatMap((x) => x.sight).map((x) => x.toLowerCase()));
    const cvc = new Set(WEEKS.filter((x) => x.n <= wk.n).flatMap((x) => x.cvc));
    for (const s of wk.sentences) {
      for (const raw of s.toLowerCase().match(/[a-z]+/g)) {
        const ok = (w) => sight.has(w) || cvc.has(w) || decodable(w, wk.n);
        assert.ok(ok(raw) || (raw.endsWith('s') && ok(raw.slice(0, -1))), `week ${wk.n}: “${raw}” in “${s}” isn't readable yet`);
      }
    }
  }
});

test('new words alternate abstract and concrete', () => {
  assert.deepEqual(interleave(['the', 'a', 'and', 'big', 'little', 'red']), ['the', 'big', 'a', 'little', 'and', 'red']);
  assert.deepEqual(interleave(WEEKS[3].sight), ['we', 'run', 'can', 'jump', 'said', 'play', 'not']);
});

test('card ids round-trip', () => {
  assert.deepEqual(cardInfo('s:I'), { kind: 's', word: 'I', week: 2 });
  assert.equal(cardInfo('c:chip').week, 13);
  assert.equal(cardInfo('p:2.0').text, 'I am in a blue hat.');
  assert.equal(newOrder(1).p.length, WEEKS[0].sentences.length);
});

test('graphemes keep digraphs together', () => {
  assert.deepEqual(graphemes('cat'), ['c', 'a', 't']);
  assert.deepEqual(graphemes('ship'), ['sh', 'i', 'p']);
  assert.deepEqual(graphemes('bath'), ['b', 'a', 'th']);
});

test('current week counts from the start date and is clamped', () => {
  const now = new Date(2026, 9, 13, 10).getTime();
  assert.equal(currentWeek('2026-10-13', now), 1);
  assert.equal(currentWeek('2026-10-07', now), 1);
  assert.equal(currentWeek('2026-10-06', now), 2);
  assert.equal(currentWeek('2027-01-01', now), 1);
  assert.equal(currentWeek('2025-01-01', now), 16);
  for (let n = 1; n <= 16; n++) assert.equal(currentWeek(startDateFor(n, now), now), n);
  // Before 04:00 still counts as the previous study day.
  assert.equal(currentWeek('2026-10-13', new Date(2026, 9, 20, 3).getTime()), 1);
  assert.equal(currentWeek('2026-10-13', new Date(2026, 9, 20, 5).getTime()), 2);
});

const profile = (settings = {}) => ({
  cards: {},
  days: {},
  stars: 0,
  settings: {
    newSight: 3, newCvc: 2, newSentences: 1, maxReviews: 40,
    findCards: true, cvcCards: true, sentenceCards: true, ...settings,
  },
});

test('only unlocked weeks feed new cards, and find-it cards wait for the read card', () => {
  const p = profile();
  let nc = newCards(p, 1);
  assert.deepEqual(nc.s, ['s:the', 's:big', 's:a', 's:little', 's:and', 's:red']);
  assert.deepEqual(nc.f, []);
  assert.equal(nc.c.length, 4);
  p.cards['s:the'] = { ...newCard(), state: 'learning' };
  assert.deepEqual(newCards(p, 1).f, []);
  const now = Date.now();
  p.cards['s:the'] = { ...newCard(), state: 'review', ivl: 1, due: now + DAY, last: now };
  assert.deepEqual(newCards(p, 1, now).f, [], 'not on the day it graduated');
  nc = newCards(p, 1, now + DAY);
  assert.deepEqual(nc.f, ['f:the']);
  assert.ok(newCards(p, 2).s.includes('s:I'));
});

test('a study session respects daily limits and brings missed cards back', () => {
  const p = profile();
  const session = { sinceNew: 0, newTurn: 0 };
  let now = new Date(2026, 9, 13, 18).getTime();
  const seen = [];
  // Simulate: introduce everything available today, answering Good, with time passing.
  for (let i = 0; i < 100; i++) {
    const id = nextCard(p, 1, now, session);
    if (!id) {
      now += 10 * MIN;
      if (!nextCard(p, 1, now, session)) break;
      continue;
    }
    const card = p.cards[id] || newCard();
    const day = dayStats(p, now);
    if (card.state === 'new') { day.new[id[0]] = (day.new[id[0]] || 0) + 1; session.newTurn = session.pendingTurn; session.sinceNew = 0; } else session.sinceNew++;
    day.rev++;
    p.cards[id] = schedule(card, GOOD, now, () => 0.5);
    session.last = id;
    seen.push(id);
    now += 20 * 1000;
  }
  const introduced = new Set(seen);
  assert.equal([...introduced].filter((x) => x[0] === 's').length, 3);
  assert.equal([...introduced].filter((x) => x[0] === 'c').length, 2);
  assert.equal([...introduced].filter((x) => x[0] === 'p').length, 1);
  assert.equal([...introduced].filter((x) => x[0] === 'f').length, 0, 'find-it waits until words graduate');
  // Each new card was seen twice (1m and 10m learning steps) and then graduated.
  for (const id of introduced) assert.equal(p.cards[id].state, 'review', id);
  assert.deepEqual(counts(p, 1, now), { learn: 0, due: 0, fresh: 0 });

  // Next day: the graduated words are due, find-it cards unlock, and 3 more sight words come in.
  now += DAY;
  const c = counts(p, 1, now);
  assert.equal(c.due, 6);
  assert.equal(c.fresh, 3 + 2 + 1 + 3);
});

test('a missed review comes back in the same session', () => {
  const p = profile({ cvcCards: false, sentenceCards: false, findCards: false, newSight: 0 });
  const now = Date.now();
  p.cards['s:the'] = { ...newCard(), state: 'review', ivl: 3, due: now - 1000 };
  const session = { sinceNew: 0, newTurn: 0 };
  assert.equal(nextCard(p, 1, now, session), 's:the');
  p.cards['s:the'] = schedule(p.cards['s:the'], AGAIN, now);
  session.last = 's:the';
  assert.equal(p.cards['s:the'].state, 'relearning');
  // The only card left was just answered: nothing until it's due, then it returns.
  assert.equal(nextCard(p, 1, now + 1000, session), null);
  assert.equal(nextCard(p, 1, now + 11 * MIN, session), 's:the');
});

test('switching a deck off hides its cards', () => {
  const p = profile({ cvcCards: false });
  p.cards['c:cat'] = { ...newCard(), state: 'review', ivl: 1, due: 0 };
  assert.equal(newCards(p, 1).c.length, 0);
  assert.equal(counts(p, 1, Date.now()).due, 0);
});

test('distractors and tricky words', () => {
  const d = distractors('the', ['the', 'they', 'to', 'big', 'a', 'red'], () => 0);
  assert.equal(d.length, 3);
  assert.ok(!d.includes('the'));
  assert.deepEqual(d.slice(0, 2).sort(), ['they', 'to']);
  const p = profile();
  p.cards['s:of'] = { ...newCard(), state: 'review', lapses: 3, ease: 1.9, ivl: 2 };
  p.cards['s:big'] = { ...newCard(), state: 'review', lapses: 0, ease: 2.5, ivl: 9 };
  assert.deepEqual(trickyWords(p, ALL_SIGHT), ['of', 'big']);
});

test('find-it grades by speed, and any miss is Again', () => {
  assert.equal(findGrade(1200, 0), EASY);
  assert.equal(findGrade(3000, 0), EASY);
  assert.equal(findGrade(3001, 0), GOOD);
  assert.equal(findGrade(8000, 0), GOOD);
  assert.equal(findGrade(15000, 0), HARD);
  assert.equal(findGrade(500, 1), AGAIN);
});
