import { newCard, schedule, previewIntervals, dayKey, AGAIN, HARD, GOOD, EASY } from './srs.js';
import {
  WORDS, WEEKS, ALL_SIGHT, CVC_PICS, SOUNDS, graphemes, cardInfo, reviewWords, weekOfSight,
} from './deck.js';
import {
  currentWeek, startDateFor, dayStats, counts, nextCard, nextLearningDue, wordStatus,
  trickyWords, distractors, shuffle, findGrade, LAST_WEEK,
} from './queue.js';
import { rankVoices, qualityLabel } from './voices.js';

const STORE_KEY = 'sight-words-v1';
const DEFAULT_SETTINGS = {
  startDate: '',
  newSight: 3,
  newCvc: 2,
  newSentences: 1,
  maxReviews: 40,
  findCards: true,
  cvcCards: true,
  sentenceCards: true,
  fourButtons: false,
  autoplay: true,
  sessionMinutes: 15,
  voice: '',
  rate: 0.8,
};
const MONTHS = [...new Set(WEEKS.map((w) => w.month))];
const PLANT = { seed: '·', sprout: '🌱', bud: '🌷', flower: '🌻' };

// ---------- state ----------

let store = loadStore();
let route = { name: 'home' };
let session = null;

function newProfile(name) {
  return { name, cards: {}, days: {}, stars: 0, settings: { ...DEFAULT_SETTINGS, startDate: dayKey(Date.now()) } };
}

function loadStore() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(STORE_KEY)); } catch { /* corrupt or unavailable */ }
  if (!s?.profiles || !Object.keys(s.profiles).length) s = { current: 'p1', profiles: { p1: newProfile('') } };
  for (const p of Object.values(s.profiles)) {
    p.settings = { ...DEFAULT_SETTINGS, ...p.settings };
    p.settings.startDate ||= dayKey(Date.now());
    p.cards ||= {}; p.days ||= {}; p.stars ||= 0;
  }
  if (!s.profiles[s.current]) s.current = Object.keys(s.profiles)[0];
  return s;
}

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    toast('Could not save progress: storage is full or blocked.');
  }
}

const P = () => store.profiles[store.current];
const S = () => P().settings;
const week = () => currentWeek(S().startDate, Date.now());
const kid = () => P().name || 'Reader';

// ---------- helpers ----------

const $ = (sel, el = document) => el.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 2400);
}

const status = (w) => wordStatus(P().cards[`s:${w}`]);
const unlocked = (w) => weekOfSight(w) <= week();
const metWords = () => ALL_SIGHT.filter((w) => status(w) !== 'seed');

// Example sentence with the word highlighted.
function exampleHtml(w) {
  const ex = WORDS[w].ex;
  const re = new RegExp(`\\b(${w})\\b`, 'i');
  return esc(ex).replace(re, '<mark>$1</mark>');
}

function streak() {
  const days = P().days;
  let n = 0;
  const d = new Date();
  if (!days[dayKey(d.getTime())]?.rev) d.setDate(d.getDate() - 1); // today not done yet: count from yesterday
  for (;;) {
    const k = dayKey(d.getTime());
    if (!days[k]?.rev) break;
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// ---------- speech ----------

const speech = {
  voices: [],
  load() {
    if (!('speechSynthesis' in window)) return;
    this.voices = speechSynthesis.getVoices();
  },
  list() { return rankVoices(this.voices); },
  pick() {
    const list = this.list();
    return list.find((v) => v.voiceURI === S().voice) || list[0] || null;
  },
  say(text, { queue = false, rate } = {}) {
    if (!('speechSynthesis' in window)) { toast('Speech is not available on this device.'); return; }
    if (!queue) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = this.pick();
    if (v) u.voice = v;
    u.lang = v?.lang || 'en-US';
    u.rate = rate ?? S().rate;
    speechSynthesis.speak(u);
    return u;
  },
  word(w) { return this.say(WORDS[w]?.say || w); },
};
if ('speechSynthesis' in window) {
  speech.load();
  speechSynthesis.addEventListener?.('voiceschanged', () => {
    speech.load();
    if (route.name === 'settings') render();
  });
}

// Any element with data-say speaks its text; data-sound speaks a phonics tile.
document.addEventListener('click', (e) => {
  const snd = e.target.closest('[data-sound]');
  if (snd) {
    e.stopPropagation();
    snd.classList.remove('lit'); void snd.offsetWidth; snd.classList.add('lit');
    speech.say(SOUNDS[snd.dataset.sound] || snd.dataset.sound, { rate: 0.7 });
    return;
  }
  const b = e.target.closest('[data-say]');
  if (!b) return;
  e.stopPropagation();
  const t = b.dataset.say;
  if (WORDS[t]) speech.word(t); else speech.say(t);
});

const speakBtn = (text, label = 'Play') => `<button class="speak" data-say="${esc(text)}" aria-label="${esc(label)}">🔊</button>`;

// ---------- navigation ----------

function setTitle(text, back = null) {
  const bar = $('.topbar');
  bar.innerHTML = `${back ? `<button class="back" data-back="${back}">‹ Back</button>` : ''}<h1>${esc(text)}</h1>
    <span class="stars" title="Stars">⭐ ${P().stars}</span>`;
  const b = $('[data-back]', bar);
  if (b) b.onclick = () => go(b.dataset.back);
}

function go(name, extra = {}) {
  if (route.name === 'study' && name !== 'study') {
    clearTimeout(session?.wait);
    session = null;
    window.speechSynthesis?.cancel();
  }
  route = { name, ...extra };
  document.body.classList.toggle('studying', name === 'study');
  document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  render();
  window.scrollTo(0, 0);
}

function render() {
  const v = $('#view');
  switch (route.name) {
    case 'home': return renderHome(v);
    case 'plan': return renderPlan(v);
    case 'words': return renderWords(v);
    case 'settings': return renderSettings(v);
    case 'study': return renderStudy(v);
  }
}

// ---------- today ----------

function chipHtml(w) {
  const st = status(w);
  return `<button class="chip w-${st}" data-word="${esc(w)}">${esc(w)}${st !== 'seed' ? `<i>${PLANT[st]}</i>` : ''}</button>`;
}

function renderHome(v) {
  setTitle(P().name ? `Hi, ${P().name}!` : 'Sight Words');
  const wk = WEEKS[week() - 1];
  const c = counts(P(), week(), Date.now());
  const total = c.learn + c.due + c.fresh;
  const known = ALL_SIGHT.filter((w) => ['bud', 'flower'].includes(status(w))).length;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  const words = wk.sight.length ? wk.sight : reviewWords(wk);

  v.innerHTML = `
    ${isIOS && !standalone ? `<div class="card install-hint"><b>Install on iPhone / iPad</b>
      <p class="small">In Safari, tap <b>Share</b>, then <b>Add to Home Screen</b>. The app then works offline and opens full screen.</p></div>` : ''}
    ${wk.n > 1 && (P().checkedWeek || 0) < wk.n && seedsUpTo(wk.n - 1).length >= 5 ? `<div class="card install-hint"><b>Starting at week ${wk.n}?</b>
      <p class="small">${seedsUpTo(wk.n - 1).length} words${cvcSeedsUpTo(wk.n - 1).length ? ` and ${cvcSeedsUpTo(wk.n - 1).length} phonics words` : ''} from earlier weeks haven’t started yet. If he already knows some, a quick check marks them green so he skips those lessons.</p>
      <button class="btn" id="check-home" style="margin-top:8px">📝 Quick check</button></div>` : ''}
    <div class="card hero">
      <div class="counts">
        <div class="n-new"><b>${c.fresh}</b><span>New</span></div>
        <div class="n-learn"><b>${c.learn}</b><span>Learning</span></div>
        <div class="n-due"><b>${c.due}</b><span>Review</span></div>
      </div>
      <button class="btn primary block play" id="study" ${total ? '' : 'disabled'}>${total ? '▶ Let’s read!' : 'All done for today 🎉'}</button>
      ${total ? '' : '<button class="btn block" id="practice-week" style="margin-top:10px">🎯 Extra practice: this week’s words</button>'}
    </div>
    <div class="card">
      <div class="row"><h2 style="margin:0">Week ${wk.n} · ${esc(wk.title)}</h2></div>
      <p class="small muted" style="margin:2px 0 10px">${esc(wk.month)} · ${wk.sight.length ? 'New sight words' : esc(wk.reviewLabel)}</p>
      <div class="chips">${words.map(chipHtml).join('')}</div>
      ${wk.cvc.length ? `<p class="small muted" style="margin:12px 0 6px">Phonics: <b>${esc(wk.cvcFocus)}</b></p>
        <div class="chips">${wk.cvc.map((w) => `<button class="chip cvc" data-say="${esc(w)}">${CVC_PICS[w] || ''} ${esc(w)}</button>`).join('')}</div>`
        : `<p class="small muted" style="margin:12px 0 0">Focus: <b>${esc(wk.cvcFocus)}</b></p>`}
      <p class="tip">💡 ${esc(wk.application)}</p>
      ${total ? '<button class="btn" id="practice-week">🎯 Practice these words</button>' : ''}
    </div>
    <div class="card">
      <div class="stats">
        <div><b>⭐ ${P().stars}</b><span>Stars</span></div>
        <div><b>🔥 ${streak()}</b><span>Day streak</span></div>
        <div><b>🌷 ${known}</b><span>Words known / ${ALL_SIGHT.length}</span></div>
        <div><b>${dayStats(P(), Date.now()).rev}</b><span>Cards today</span></div>
      </div>
    </div>`;
  $('#study').onclick = () => startStudy();
  $('#practice-week').onclick = () => startPractice(words, `Week ${wk.n} words`);
  const ch = $('#check-home');
  if (ch) ch.onclick = () => checkUpTo(week());
  bindChips(v);
}

function bindChips(el) {
  el.querySelectorAll('[data-word]').forEach((b) => { b.onclick = () => showWord(b.dataset.word); });
  el.querySelectorAll('[data-cvc]').forEach((b) => { b.onclick = () => showCvc(b.dataset.cvc); });
}

// ---------- plan ----------

function renderPlan(v) {
  setTitle('16-Week Plan');
  const cur = week();
  v.innerHTML = `
    <p class="small muted" style="margin-top:0">Fry First 50 + Dolch Pre-Primer blended: ${ALL_SIGHT.length} words. New words unlock each week; tap a week for details.</p>
    ${MONTHS.map((m) => `<h3 class="month">${esc(m)}</h3>${WEEKS.filter((w) => w.month === m).map((w) => {
      const words = w.sight.length ? w.sight : reviewWords(w);
      const done = w.sight.length && w.sight.every((x) => ['bud', 'flower'].includes(status(x)));
      return `<details class="card week${w.n === cur ? ' current' : ''}${w.n > cur ? ' locked' : ''}" ${w.n === cur ? 'open' : ''}>
        <summary><span class="wk-n">${w.n}</span><span class="grow"><b>${esc(w.title)}</b>
          <small>${w.sight.length ? `${w.sight.length} new words` : 'Review'} · ${esc(w.cvcFocus)}</small></span>
          <span>${w.n === cur ? '📍' : done ? '✅' : w.n > cur ? '🔒' : ''}</span></summary>
        <div class="wk-body">
          ${w.review ? `<p class="small muted">${esc(w.reviewLabel)}</p>` : ''}
          <div class="chips">${words.map(chipHtml).join('')}</div>
          ${w.cvc.length ? `<div class="chips" style="margin-top:8px">${w.cvc.map((x) => `<button class="chip cvc" data-say="${esc(x)}">${CVC_PICS[x] || ''} ${esc(x)}</button>`).join('')}</div>` : ''}
          <p class="tip">💡 ${esc(w.application)}</p>
          <ul class="sentences">${w.sentences.map((t) => `<li data-say="${esc(t)}">🔊 ${esc(t)}</li>`).join('')}</ul>
          <div class="btn-row">
            <button class="btn" data-practice="${w.n}">🎯 Practice</button>
            <button class="btn" data-check="${w.n}">📝 Test this week</button>
            ${w.n !== cur ? `<button class="btn" data-setweek="${w.n}">${w.n > cur ? '🔓 Start this week now' : '↩︎ Go back to this week'}</button>` : ''}
          </div>
        </div></details>`;
    }).join('')}`).join('')}`;
  bindChips(v);
  v.querySelectorAll('[data-practice]').forEach((b) => {
    b.onclick = () => { const w = WEEKS[b.dataset.practice - 1]; startPractice(w.sight.length ? w.sight : reviewWords(w), `Week ${w.n}`); };
  });
  v.querySelectorAll('[data-check]').forEach((b) => {
    b.onclick = () => {
      const w = WEEKS[b.dataset.check - 1];
      const ids = [...(w.sight.length ? w.sight : reviewWords(w)).map((x) => `s:${x}`), ...(S().cvcCards ? w.cvc.map((x) => `c:${x}`) : [])];
      testFrom(ids, ids[0], `Week ${w.n}`);
    };
  });
  v.querySelectorAll('[data-setweek]').forEach((b) => {
    b.onclick = () => {
      const n = Number(b.dataset.setweek);
      if (!confirm(`Make week ${n} the current week? ${n > cur ? 'Its new words start appearing in today’s session.' : 'Later weeks’ new words pause until you get there again; words already started keep being reviewed.'}`)) return;
      S().startDate = startDateFor(n, Date.now());
      save();
      toast(`Now on week ${n}`);
      render();
    };
  });
}

// ---------- words ----------

function renderWords(v) {
  setTitle('Word Garden');
  const met = metWords();
  const tricky = trickyWords(P(), ALL_SIGHT);
  v.innerHTML = `
    <div class="card">
      <h2>Practice games</h2>
      <p class="small muted" style="margin-top:-4px">Extra rounds that don’t change the schedule.</p>
      <div class="btn-row">
        <button class="btn" id="pr-tricky" ${tricky.length ? '' : 'disabled'}>😬 Tricky words</button>
        <button class="btn" id="pr-all" ${met.length ? '' : 'disabled'}>📖 All my words</button>
        <button class="btn" id="pr-find" ${met.length ? '' : 'disabled'}>👂 Find-it game</button>
      </div>
    </div>
    <div class="card">
      <h2>📝 Quick check</h2>
      <p class="small muted" style="margin-top:-4px">Already knows some words? Flash everything he hasn’t started (up to week ${week()}) and tap ✅ for the ones he can do. Those turn green and skip the lessons. Sight words first, then phonics words.</p>
      <button class="btn" id="check-all" ${seedsUpTo(week()).length + cvcSeedsUpTo(week()).length ? '' : 'disabled'}>Check ${plural(seedsUpTo(week()).length, 'word')}${cvcSeedsUpTo(week()).length ? ` + ${cvcSeedsUpTo(week()).length} phonics` : ''}</button>
    </div>
    <div class="legend"><span>· not yet</span><span>🌱 learning</span><span>🌷 knows it</span><span>🌻 knows it well</span><span>🔒 later week</span></div>
    <p class="small muted" style="margin:10px 4px 0">Tap any word to hear it, or to test him starting from that word.</p>
    <h2 class="section">Sight words</h2>
    ${WEEKS.filter((w) => w.sight.length).map((w) => `<h3 class="month">Week ${w.n}</h3>
      <div class="garden">${w.sight.map((x) => {
        const st = status(x);
        const lock = !unlocked(x) && st === 'seed';
        return `<button class="w-${st}${lock ? ' lock' : ''}" data-word="${esc(x)}"><span>${esc(x)}</span><i>${lock ? '🔒' : PLANT[st]}</i></button>`;
      }).join('')}</div>`).join('')}
    ${S().cvcCards ? `<h2 class="section">Phonics words</h2>
    ${WEEKS.filter((w) => w.cvc.length).map((w) => `<h3 class="month">Week ${w.n} · ${esc(w.cvcFocus)}</h3>
      <div class="garden">${w.cvc.map((x) => {
        const st = cvcStatus(x);
        const lock = w.n > week() && st === 'seed';
        return `<button class="w-${st}${lock ? ' lock' : ''}" data-cvc="${esc(x)}"><span>${esc(x)}</span><i>${lock ? '🔒' : PLANT[st]}</i></button>`;
      }).join('')}</div>`).join('')}` : ''}`;
  bindChips(v);
  $('#pr-tricky').onclick = () => startPractice(tricky, 'Tricky words');
  $('#pr-all').onclick = () => startPractice(met, 'All my words');
  $('#pr-find').onclick = () => startPractice(met, 'Find-it game', 'f');
  $('#check-all').onclick = () => checkUpTo(week());
}

function showWord(w) {
  const d = WORDS[w];
  const card = P().cards[`s:${w}`];
  const st = status(w);
  const label = { seed: unlocked(w) ? 'Not started yet' : `Comes in week ${weekOfSight(w)}`, sprout: 'Learning', bud: 'Knows it', flower: 'Knows it well' }[st];
  const list = { both: 'Fry & Dolch', fry: 'Fry First 50', dolch: 'Dolch Pre-Primer' }[d.list];
  const next = card && card.state !== 'new' ? new Date(card.due).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : null;
  const sheet = $('#sheet');
  sheet.innerHTML = `<div class="sheet-body">
    <button class="sheet-close" aria-label="Close">✕</button>
    <div class="word" style="margin-top:8px">${esc(w)}</div>
    ${d.pic ? `<div class="pic">${d.pic}</div>` : ''}
    <div class="row" style="justify-content:center">${speakBtn(w, `Say ${w}`)}</div>
    <p class="ex" data-say="${esc(d.ex)}">🔊 ${exampleHtml(w)}</p>
    <p class="small muted">${PLANT[st] === '·' ? '' : PLANT[st]} ${esc(label)} · Week ${weekOfSight(w)} · ${list} · ${d.pic ? 'concrete' : 'abstract'}</p>
    ${card && card.state !== 'new' ? `<p class="small muted">Seen ${card.reps}× · missed ${card.lapses}× · next review ${esc(next)}</p>` : ''}
    ${testButtons()}
  </div>`;
  openSheet(sheet, () => testFrom(ALL_SIGHT.map((x) => `s:${x}`), `s:${w}`, 'Sight words'));
  speech.word(w);
}

function showCvc(w) {
  const card = P().cards[`c:${w}`];
  const st = cvcStatus(w);
  const wk = WEEKS.find((x) => x.cvc.includes(w));
  const label = { seed: wk.n <= week() ? 'Not started yet' : `Comes in week ${wk.n}`, sprout: 'Learning', bud: 'Can sound it out', flower: 'Sounds it out easily' }[st];
  const sheet = $('#sheet');
  sheet.innerHTML = `<div class="sheet-body">
    <button class="sheet-close" aria-label="Close">✕</button>
    <div class="tiles" style="margin-top:12px">${graphemes(w).map((g) => `<button class="tile${/^[aeiou]$/.test(g) ? ' vowel' : ''}" data-sound="${g}">${g}</button>`).join('')}</div>
    <div class="pic">${CVC_PICS[w] || ''}</div>
    <div class="row" style="justify-content:center">${speakBtn(w, `Say ${w}`)}</div>
    <p class="small muted">${PLANT[st] === '·' ? '' : PLANT[st]} ${esc(label)} · Week ${wk.n} · ${esc(wk.cvcFocus)}</p>
    ${card && card.state !== 'new' ? `<p class="small muted">Seen ${card.reps}× · missed ${card.lapses}×</p>` : ''}
    ${testButtons()}
  </div>`;
  openSheet(sheet, () => testFrom(ALL_CVC.map((x) => `c:${x}`), `c:${w}`, 'Phonics'));
}

const testButtons = () => `<div class="btn-row" style="justify-content:center;margin-top:14px">
    <button class="btn primary" id="test-from">📝 Test from here</button></div>
  <p class="small muted" style="margin-top:6px">Starts at this word and goes on through the list. Tap ‹ Back whenever you want to stop.</p>`;

function openSheet(sheet, onTest) {
  $('.sheet-close', sheet).onclick = () => sheet.close();
  sheet.onclick = (e) => { if (e.target === sheet) sheet.close(); };
  $('#test-from', sheet).onclick = () => { sheet.close(); onTest(); };
  sheet.showModal();
}

// A test over `ids`, starting at `fromId`. Unlike the unstarted-only Quick check this covers every
// card, and the answers count: ✅ moves a card on, ❌ sends a started card back to learning.
function testFrom(ids, fromId, label) {
  const queue = ids.slice(Math.max(0, ids.indexOf(fromId)));
  session = newSession({ practice: { label, kind: 's', check: true, known: 0, queue, total: queue.length, mixed: isMixed(queue) } });
  go('study');
}

// ---------- study ----------

function newSession(extra = {}) {
  return { current: null, revealed: false, sinceNew: 0, newTurn: 0, done: 0, stars: 0, undo: null, started: Date.now(), ...extra };
}

function startStudy() {
  session = newSession();
  go('study');
}

// Practice: a shuffled drill of `words` that doesn't touch the schedule. Missed words come back later in the round.
function startPractice(words, label, kind = 's') {
  if (!words.length) return;
  session = newSession({ practice: { label, kind, queue: shuffle(words).map((w) => `${kind}:${w}`), total: words.length } });
  go('study');
}

// Quick check: flash words he hasn't started, and mark the ones he can already read as known,
// so a child who starts mid-plan doesn't sit through introductions for words he knows.
// Phonics words come after the sight words, judged on sounding out rather than recognition.
function startCheck(words, label, cvc = []) {
  const todo = [
    ...words.filter((w) => status(w) === 'seed').map((w) => `s:${w}`),
    ...(S().cvcCards ? cvc.filter((w) => cvcStatus(w) === 'seed').map((w) => `c:${w}`) : []),
  ];
  if (!todo.length) { toast('Nothing unstarted to check here.'); return; }
  session = newSession({ practice: { label, kind: 's', check: true, known: 0, queue: todo, total: todo.length, mixed: isMixed(todo) } });
  go('study');
}

const ALL_CVC = WEEKS.flatMap((x) => x.cvc);
const isMixed = (ids) => ids.some((id) => id[0] === 's') && ids.some((id) => id[0] === 'c');
const cvcStatus = (w) => wordStatus(P().cards[`c:${w}`]);
const seedsUpTo = (n) => ALL_SIGHT.filter((w) => weekOfSight(w) <= n && status(w) === 'seed');
const cvcSeedsUpTo = (n) => (S().cvcCards ? WEEKS.filter((x) => x.n <= n).flatMap((x) => x.cvc).filter((w) => cvcStatus(w) === 'seed') : []);
const checkUpTo = (n) => startCheck(seedsUpTo(n), `Weeks 1–${n}`, cvcSeedsUpTo(n));
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function headHtml() {
  const mins = Math.floor((Date.now() - session.started) / 60000);
  let left;
  if (session.practice) left = `<span>${esc(session.practice.label)} · ${session.practice.queue.length} left</span>`;
  else {
    const c = counts(P(), week(), Date.now());
    left = `<span class="q"><b class="c-new">${c.fresh}</b> + <b class="c-learn">${c.learn}</b> + <b class="c-due">${c.due}</b></span>`;
  }
  return `<div class="study-head">${left}<span class="spacer"></span>
    <span>⭐ ${session.stars}</span><span>⏱ ${mins}m</span>
    ${session.undo || session.checkUndo ? '<button class="btn" id="undo" style="padding:4px 10px">↶</button>' : ''}</div>
    ${!session.timeNoted && mins >= S().sessionMinutes ? `<div class="time-up"><span>⏰ ${mins} minutes. Great work! You can stop here.</span>
      <button class="btn" id="finish">Finish</button><button class="btn" id="keep-going">Keep going</button></div>` : ''}`;
}

function renderStudy(v) {
  setTitle(session?.practice ? (session.practice.check ? 'Test' : 'Practice') : 'Let’s read!', 'home');
  if (!session) session = newSession();
  clearTimeout(session.wait);
  const now = Date.now();
  const p = P();

  if (!session.current) {
    session.revealed = false;
    session.miss = 0;
    session.picked = [];
    if (session.practice) session.current = session.practice.queue[0] || null;
    else session.current = nextCard(p, week(), now, session);
    session.choices = null;
    if (session.current) onShow();
  }

  if (!session.current) {
    const due = session.practice ? null : nextLearningDue(p, now);
    if (due) {
      const ms = Math.max(0, due - now);
      session.wait = setTimeout(() => { if (route.name === 'study') render(); }, ms + 500);
      v.innerHTML = `<div class="study">${headHtml()}<div class="done"><div class="big">⏳</div>
        <h2>One more card in ${Math.max(1, Math.round(ms / 60000))} min</h2>
        <p class="muted">A word you just practised comes back in a moment. Keep this screen open, or stop here for today.</p>
        <button class="btn primary" id="home">I’m done</button></div></div>`;
      $('#home').onclick = () => go('home');
      bindHead();
      return;
    }
    v.innerHTML = `<div class="study">${headHtml()}<div class="done">
      <div class="confetti" aria-hidden="true">${'🎉⭐🌟✨🎈'.repeat(4).match(/./gu).map((e, i) => `<i style="--x:${(i * 37) % 100}%;--d:${(i % 7) * 0.15}s">${e}</i>`).join('')}</div>
      <div class="big">🏆</div>
      <h2>Great job${p.name ? `, ${esc(p.name)}` : ''}!</h2>
      <p class="muted">${session.practice?.check
        ? `He knew ${session.practice.known} of ${session.done} 🌷. Those come back for review in a few days. ${session.done - session.practice.known ? 'The rest will be taught (or re-taught) in regular sessions.' : ''}`
        : `You did ${session.done} card${session.done === 1 ? '' : 's'} and earned ${session.stars} star${session.stars === 1 ? '' : 's'}.${streak() > 1 ? ` 🔥 ${streak()} days in a row!` : ''}`}</p>
      <button class="btn primary" id="home">Back home</button></div></div>`;
    $('#home').onclick = () => go('home');
    bindHead();
    return;
  }

  const id = session.current;
  const info = cardInfo(id);
  const card = p.cards[id] || newCard();
  const intro = !session.practice && info.kind === 's' && card.state === 'new';
  let body;
  let actions;

  if (info.kind === 'f') {
    session.choices ||= shuffle([info.word, ...distractors(info.word, ALL_SIGHT.filter((w) => w !== info.word && status(w) !== 'seed').concat(ALL_SIGHT.filter(unlocked)))]);
    body = `<div class="prompt">Find the word you hear</div>
      <button class="speak huge" data-say="${esc(info.word)}" aria-label="Hear the word again">🔊</button>
      <div class="choices">${session.choices.map((w) => {
        const picked = session.picked.includes(w);
        const right = w === info.word;
        const cls = picked ? (right ? ' right' : ' wrong') : (session.miss >= 2 && right ? ' hint' : '');
        return `<button class="choice${cls}" data-choice="${esc(w)}" ${picked ? 'disabled' : ''}>${esc(w)}</button>`;
      }).join('')}</div>`;
    actions = '';
  } else {
    const revealed = session.revealed || intro;
    body = frontHtml(info, revealed, intro);
    if (session.practice?.check) {
      const cvc = info.kind === 'c';
      actions = `<div class="ratings two"><button class="r1" data-check="0">❌ Not yet</button><button class="r3" data-check="1">✅ ${cvc ? 'Sounds it out' : 'Knows it'}</button></div>
        ${cvc && session.practice.mixed ? '<button class="btn block skip" id="skip-phonics">Skip the phonics check</button>' : ''}`;
    } else if (intro) {
      actions = '<button class="btn primary block" id="intro">I’ll remember it! ▶</button>';
    } else if (!revealed) {
      actions = '<button class="btn primary block" id="reveal">Show me</button>';
    } else if (session.practice) {
      actions = `<div class="ratings two"><button class="r1" data-prate="0">🔁 Again</button><button class="r3" data-prate="1">👍 Got it</button></div>`;
    } else {
      const prev = previewIntervals(card, Date.now());
      const btn = (r, cls, label) => `<button class="${cls}" data-rate="${r}">${label}<small>${prev[r]}</small></button>`;
      actions = `<div class="ratings${S().fourButtons ? '' : ' three'}">
        ${btn(AGAIN, 'r1', '🔁 Again')}${S().fourButtons ? btn(HARD, 'r2', '😬 Hard') : ''}${btn(GOOD, 'r3', '👍 Good')}${btn(EASY, 'r4', '⭐ Easy')}</div>`;
    }
  }

  const pct = session.practice
    ? 100 * (session.practice.total - session.practice.queue.length) / session.practice.total
    : null;
  v.innerHTML = `<div class="study">${headHtml()}
    ${pct !== null ? `<div class="bar"><i class="young" style="width:${pct}%"></i></div>` : ''}
    <div class="flash kind-${info.kind}${session.revealed || intro ? ' revealed' : ''}">${body}</div>
    <div class="actions">${actions}</div></div>`;

  const reveal = $('#reveal');
  if (reveal) {
    reveal.onclick = doReveal;
    const flash = $('.flash', v);
    flash.classList.add('tap');
    flash.onclick = (e) => { if (!e.target.closest('button, [data-say], [data-sound]')) doReveal(); };
  }
  const introBtn = $('#intro');
  if (introBtn) introBtn.onclick = () => rate(AGAIN);
  v.querySelectorAll('[data-rate]').forEach((b) => { b.onclick = () => rate(Number(b.dataset.rate)); });
  v.querySelectorAll('[data-prate]').forEach((b) => { b.onclick = () => practiceRate(b.dataset.prate === '1'); });
  v.querySelectorAll('[data-check]').forEach((b) => { b.onclick = () => checkRate(b.dataset.check === '1'); });
  const skip = $('#skip-phonics');
  if (skip) skip.onclick = () => { session.practice.total -= session.practice.queue.length; session.practice.queue = []; P().checkedWeek = week(); save(); session.current = null; render(); };
  v.querySelectorAll('[data-choice]').forEach((b) => { b.onclick = () => choose(b.dataset.choice, b); });
  bindHead();
}

function frontHtml(info, revealed, intro) {
  if (info.kind === 's') {
    const w = info.word;
    const d = WORDS[w];
    return `${intro ? '<div class="badge-new">✨ New word!</div>' : ''}
      <div class="word">${esc(w)}</div>
      ${revealed ? `${d.pic ? `<div class="pic">${d.pic}</div>` : ''}
        <div class="row" style="justify-content:center">${speakBtn(w, `Say ${w}`)}</div>
        <p class="ex" data-say="${esc(d.ex)}">🔊 ${exampleHtml(w)}</p>`
        : '<div class="prompt">Can you read it?</div>'}`;
  }
  if (info.kind === 'c') {
    const w = info.word;
    const tiles = graphemes(w).map((g) => `<button class="tile${/^[aeiou]$/.test(g) ? ' vowel' : ''}" data-sound="${g}">${g}</button>`).join('');
    return `<div class="tiles">${tiles}</div>
      ${revealed ? `<div class="pic">${CVC_PICS[w] || ''}</div>
        <div class="row" style="justify-content:center">${speakBtn(w, `Say ${w}`)}</div>`
        : `<div class="prompt">${session?.practice?.check
          ? 'Can he sound it out by himself, smoothly? Instant recognition doesn’t count.'
          : 'Sound it out! Tap a letter to hear it.'}</div>`}`;
  }
  // sentence
  const words = info.text.split(' ').map((t) => {
    const bare = t.replace(/[^A-Za-z']/g, '');
    return `<span data-say="${esc(WORDS[bare] ? bare : WORDS[bare.toLowerCase()] ? bare.toLowerCase() : bare)}">${esc(t)}</span>`;
  }).join(' ');
  return `<div class="sentence">${words}</div>
    ${revealed ? `<div class="row" style="justify-content:center;margin-top:16px">${speakBtn(info.text, 'Read the sentence')}</div>`
      : '<div class="prompt">Read the sentence! Tap a word for help.</div>'}`;
}

// Speak whatever the card needs as it appears.
function onShow() {
  const info = cardInfo(session.current);
  const card = P().cards[session.current];
  if (info.kind === 'f') {
    // The answer clock starts when he has heard the word, not while it's still being spoken.
    const id = session.current;
    session.shownAt = Date.now();
    session.heardAt = null;
    const u = speech.word(info.word);
    if (u) u.onend = () => { if (session?.current === id) session.heardAt ||= Date.now(); };
  } else if (info.kind === 's' && !session.practice && (!card || card.state === 'new') && S().autoplay) speech.word(info.word);
}

function doReveal() {
  session.revealed = true;
  render();
  if (!S().autoplay) return;
  const info = cardInfo(session.current);
  if (info.kind === 'p') speech.say(info.text);
  else speech.word(info.word);
}

function bindHead() {
  const f = $('#finish');
  if (f) f.onclick = () => go('home');
  const k = $('#keep-going');
  if (k) k.onclick = () => { session.timeNoted = true; $('.time-up').remove(); };
  const u = $('#undo');
  if (!u) return;
  u.onclick = () => {
    if (session.checkUndo) {
      const { id, prevCard, knows, prevStars, sessionStars } = session.checkUndo;
      if (prevCard) P().cards[id] = prevCard; else delete P().cards[id];
      P().stars = prevStars;
      session.stars = sessionStars;
      if (knows) session.practice.known--;
      session.practice.queue.unshift(id);
      session.done = Math.max(0, session.done - 1);
      session.checkUndo = null;
      session.current = null;
      save();
      render();
      return;
    }
    const { id, prevCard, prevDay, prev } = session.undo;
    const p = P();
    if (prevCard) p.cards[id] = prevCard; else delete p.cards[id];
    p.days[dayKey(Date.now())] = prevDay;
    p.stars -= 1;
    Object.assign(session, prev);
    session.done = Math.max(0, session.done - 1);
    session.stars = Math.max(0, session.stars - 1);
    session.undo = null;
    session.current = id;
    session.revealed = cardInfo(id).kind !== 'f';
    session.choices = null; session.picked = []; session.miss = 0;
    save();
    render();
  };
}

function starBurst() {
  const s = document.createElement('div');
  s.className = 'star-pop';
  s.textContent = '⭐';
  document.body.append(s);
  setTimeout(() => s.remove(), 900);
}

function award() {
  P().stars++;
  session.stars++;
  dayStats(P(), Date.now()).stars++;
  starBurst();
}

function rate(r) {
  const id = session.current;
  const p = P();
  const prevCard = p.cards[id];
  const card = prevCard || newCard();
  const day = dayStats(p, Date.now());
  session.undo = { id, prevCard, prevDay: JSON.parse(JSON.stringify(day)), prev: { sinceNew: session.sinceNew, newTurn: session.newTurn } };
  if (card.state === 'new') {
    day.new[id[0]] = (day.new[id[0]] || 0) + 1;
    session.sinceNew = 0;
    session.newTurn = session.pendingTurn ?? session.newTurn;
  } else session.sinceNew++;
  day.rev++;
  p.cards[id] = schedule(card, r, Date.now());
  award();
  save();
  session.done++;
  session.last = id;
  session.current = null;
  render();
}

function practiceRate(ok) {
  const q = session.practice.queue;
  const id = q.shift();
  if (!ok) q.splice(Math.min(q.length, 3), 0, id); // comes back a few cards later
  else award();
  save();
  session.done++;
  session.current = null;
  render();
}

function checkRate(knows) {
  const id = session.practice.queue.shift();
  const w = id.slice(2);
  const prevCard = P().cards[id];
  const card = prevCard || newCard();
  session.checkUndo = { id, prevCard, knows, prevStars: P().stars, sessionStars: session.stars };
  // ✅ on a new or learning card is like Easy: straight to review in about 4 days, without using
  // today's new-word quota. On a review card it counts as Good. ❌ leaves a new card for the
  // regular lessons and sends a started one back to learning.
  if (knows) {
    P().cards[id] = schedule(card, card.state === 'review' ? GOOD : EASY, Date.now());
    session.practice.known++;
    award();
  } else if (card.state !== 'new') {
    P().cards[id] = schedule(card, AGAIN, Date.now());
  }
  speech.word(w);
  if (!session.practice.queue.length) P().checkedWeek = week(); // stop suggesting a check on Today
  save();
  session.done++;
  session.current = null;
  render();
}

function choose(w, btn) {
  const info = cardInfo(session.current);
  if (session.picked.includes(w) || session.locked) return;
  session.picked.push(w);
  if (w !== info.word) {
    session.miss++;
    btn.classList.add('wrong', 'shake');
    btn.disabled = true;
    if (session.miss >= 2) $(`#view .choice[data-choice="${CSS.escape(info.word)}"]`)?.classList.add('hint');
    speech.say('Try again!');
    setTimeout(() => speech.word(info.word), 700);
    return;
  }
  // If the browser never reports the end of speech, assume the word took about 1.5 s to say.
  const ms = Math.max(0, Date.now() - (session.heardAt ?? (session.shownAt ?? Date.now()) + 1500));
  const grade = findGrade(ms, session.miss);
  btn.classList.add('right');
  if (grade === EASY) btn.insertAdjacentHTML('beforeend', '<small class="fast">⚡ Fast!</small>');
  speech.say(`Yes! ${WORDS[info.word]?.say || info.word}`);
  session.locked = true;
  setTimeout(() => {
    session.locked = false;
    if (route.name !== 'study' || !session) return;
    if (session.practice) practiceRate(session.miss === 0);
    else rate(grade);
  }, 900);
}

document.addEventListener('keydown', (e) => {
  if (route.name !== 'study' || !session?.current || e.target.matches('input, select, textarea')) return;
  if (cardInfo(session.current).kind === 'f' || session.practice?.check) return;
  if (!session.revealed && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); $('#intro') ? rate(AGAIN) : doReveal(); }
  else if (session.revealed && !session.practice && ['1', '2', '3', '4'].includes(e.key)) rate(Number(e.key));
  else if (session.revealed && e.key === ' ') { e.preventDefault(); session.practice ? practiceRate(true) : rate(GOOD); }
});

// ---------- settings ----------

const toggle = (id, on) => `<span class="toggle"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><span></span></span>`;
const num = (id, val, min, max) => `<input type="number" id="${id}" value="${val}" min="${min}" max="${max}" inputmode="numeric">`;

function renderSettings(v) {
  setTitle('Settings');
  const st = S();
  const voices = speech.list();
  const wk = week();
  const profiles = Object.entries(store.profiles);
  v.innerHTML = `
    <div class="card">
      <h2>Reader</h2>
      <div class="field"><label for="name">Name</label><input type="text" id="name" value="${esc(P().name)}" placeholder="Child’s name" autocomplete="off"></div>
      <div class="field"><label for="profile">Profile<small>Each child keeps their own progress.</small></label>
        <select id="profile">${profiles.map(([k, x]) => `<option value="${k}" ${k === store.current ? 'selected' : ''}>${esc(x.name || 'Reader')}</option>`).join('')}
          <option value="+">＋ Add a child…</option></select></div>
      ${profiles.length > 1 ? '<div class="btn-row"><button class="btn danger" id="del-profile">Delete this profile</button></div>' : ''}
    </div>
    <div class="card">
      <h2>Plan</h2>
      <div class="field"><label for="week">Current week<small>Started ${esc(st.startDate)}. Moves on by itself every 7 days.</small></label>
        <select id="week">${WEEKS.map((w) => `<option value="${w.n}" ${w.n === wk ? 'selected' : ''}>Week ${w.n}: ${esc(w.title)}</option>`).join('')}</select></div>
      <div class="field"><label for="newSight">New sight words a day<small>4–7 come in each week; 3 a day gets through them in 2–3 days.</small></label>${num('newSight', st.newSight, 0, 10)}</div>
      <div class="field"><label for="newCvc">New phonics words a day</label>${num('newCvc', st.newCvc, 0, 10)}</div>
      <div class="field"><label for="newSentences">New sentences a day</label>${num('newSentences', st.newSentences, 0, 5)}</div>
      <div class="field"><label for="maxReviews">Most reviews a day<small>Keeps sessions short.</small></label>${num('maxReviews', st.maxReviews, 5, 200)}</div>
      <div class="field"><label for="sessionMinutes">Session reminder (minutes)<small>Shows a “great work, you can stop” note.</small></label>${num('sessionMinutes', st.sessionMinutes, 5, 60)}</div>
    </div>
    <div class="card">
      <h2>Cards</h2>
      <div class="field"><label for="findCards">“Find it” listening cards<small>Hear a word and tap it. Unlocks once he can read the word.</small></label>${toggle('findCards', st.findCards)}</div>
      <div class="field"><label for="cvcCards">Phonics (CVC) cards<small>Sound out cat, bed, pig…</small></label>${toggle('cvcCards', st.cvcCards)}</div>
      <div class="field"><label for="sentenceCards">Sentence cards<small>Short sentences using words he knows.</small></label>${toggle('sentenceCards', st.sentenceCards)}</div>
      <div class="field"><label for="fourButtons">Show “Hard” button<small>Anki’s four buttons instead of three.</small></label>${toggle('fourButtons', st.fourButtons)}</div>
    </div>
    <div class="card">
      <h2>Sound</h2>
      <div class="field"><label for="autoplay">Say the word when the answer shows</label>${toggle('autoplay', st.autoplay)}</div>
      <div class="field"><label for="voice">Voice<small>${voices.length ? 'For the most natural voice on iPhone, download <b>Ava (Premium)</b> or <b>Samantha (Enhanced)</b>: Settings → Accessibility → Read & Speak (Spoken Content) → Voices → English. The app picks it automatically.' : 'No English voices found yet.'}</small></label>
        <select id="voice"><option value="">Automatic</option>${voices.map((x) => `<option value="${esc(x.voiceURI)}" ${x.voiceURI === st.voice ? 'selected' : ''}>${esc(x.name)}${qualityLabel(x) ? ` · ${qualityLabel(x)}` : ''} (${esc(x.lang)})</option>`).join('')}</select></div>
      ${speech.pick() ? `<p class="small muted" style="margin:6px 0 0">Now using: <b>${esc(speech.pick().name)}${qualityLabel(speech.pick()) ? ` · ${qualityLabel(speech.pick())}` : ''}</b>. Just downloaded a voice? Close the app fully and reopen it.</p>` : ''}
      <div class="field"><label for="rate">Speed <small>${st.rate.toFixed(2)}×</small></label><input type="range" id="rate" min="0.5" max="1.2" step="0.05" value="${st.rate}"></div>
      <div class="btn-row"><button class="btn" data-say="Look! I can read the big red cat.">🔊 Test voice</button></div>
    </div>
    <div class="card">
      <h2>Backup</h2>
      <p class="small muted" style="margin-top:-4px">Progress is saved on this device only.</p>
      <div class="btn-row">
        <button class="btn" id="export">Export backup</button>
        <label class="btn" for="import">Import backup</label>
        <input id="import" type="file" accept="application/json,.json" hidden>
        <button class="btn danger" id="reset">Reset progress</button>
      </div>
    </div>
    <p class="small muted" style="text-align:center">Words: Fry First 50 + Dolch Pre-Primer. Font: Andika (SIL OFL).</p>`;

  $('#name').onchange = (e) => { P().name = e.target.value.trim(); save(); render(); };
  $('#profile').onchange = (e) => {
    if (e.target.value === '+') {
      const name = prompt('Child’s name?');
      if (!name?.trim()) { render(); return; }
      const key = `p${Date.now()}`;
      store.profiles[key] = newProfile(name.trim());
      store.current = key;
    } else store.current = e.target.value;
    save();
    render();
  };
  const del = $('#del-profile');
  if (del) {
    del.onclick = () => {
      if (!confirm(`Delete ${kid()}’s profile and all their progress?`)) return;
      delete store.profiles[store.current];
      store.current = Object.keys(store.profiles)[0];
      save();
      render();
    };
  }
  $('#week').onchange = (e) => { st.startDate = startDateFor(Number(e.target.value), Date.now()); save(); render(); };
  for (const id of ['newSight', 'newCvc', 'newSentences', 'maxReviews', 'sessionMinutes']) {
    $(`#${id}`).onchange = (e) => {
      const el = e.target;
      const n = Math.round(Number(el.value));
      if (Number.isFinite(n)) st[id] = Math.min(Number(el.max), Math.max(Number(el.min), n));
      el.value = st[id];
      save();
    };
  }
  for (const id of ['findCards', 'cvcCards', 'sentenceCards', 'fourButtons', 'autoplay']) {
    $(`#${id}`).onchange = (e) => { st[id] = e.target.checked; save(); };
  }
  $('#voice').onchange = (e) => { st.voice = e.target.value; save(); speech.say('Hello! Let’s read.'); };
  $('#rate').oninput = (e) => { st.rate = Number(e.target.value); $('label[for=rate] small').textContent = `${st.rate.toFixed(2)}×`; };
  $('#rate').onchange = () => save();
  $('#export').onclick = exportBackup;
  $('#import').onchange = importBackup;
  $('#reset').onclick = () => {
    if (!confirm(`Delete all of ${kid()}’s progress and stars? This cannot be undone.`)) return;
    Object.assign(P(), { cards: {}, days: {}, stars: 0 });
    save();
    toast('Progress reset');
    render();
  };
}

async function exportBackup() {
  const json = JSON.stringify({ app: 'sight-words', version: 1, exported: new Date().toISOString(), ...store });
  const name = `sight-words-backup-${dayKey(Date.now())}.json`;
  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function importBackup(e) {
  const f = e.target.files[0];
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (data.app !== 'sight-words' || typeof data.profiles !== 'object') throw new Error('not a Sight Words backup');
    if (!confirm(`Replace all progress on this device with this backup (${Object.keys(data.profiles).length} profile(s))?`)) return;
    localStorage.setItem(STORE_KEY, JSON.stringify({ current: data.current, profiles: data.profiles }));
    store = loadStore();
    save();
    toast('Backup restored');
    render();
  } catch (err) {
    toast(`Import failed: ${err.message}`);
  } finally {
    e.target.value = '';
  }
}

// ---------- boot ----------

// iOS Safari only shows :active (press) styles when a touch listener is registered.
document.addEventListener('touchstart', () => {}, { passive: true });
document.querySelectorAll('.tabbar button').forEach((b) => { b.onclick = () => go(b.dataset.tab); });

// Show the session reminder once the time is up, even mid-card.
setInterval(() => {
  if (route.name !== 'study' || !session || session.timeNoted || $('.time-up')) return;
  if (Date.now() - session.started >= S().sessionMinutes * 60000) render();
}, 15000);

render();
save();
navigator.storage?.persist?.();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
  if (navigator.serviceWorker.controller) {
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded || route.name === 'study') return;
      reloaded = true;
      location.reload();
    });
  }
}
