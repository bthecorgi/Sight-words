// Recorded speech. iOS 27 home-screen apps stopped speaking through speechSynthesis (the engine
// starts, then hangs silently), so every word, sentence and sound the app says ships as an mp3
// in audio/, made by scripts/make-audio.py. Anything without a clip falls back to the device voice.

// Phrases spoken outside the word lists.
export const EXTRA_PHRASES = ['Yes!', 'Try again!', 'Look! I can read the big red cat.', 'Hello! Let’s read.'];

// File name for a phrase: "Let’s read!" → "lets-read".
export const clipKey = (text) => String(text).toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Plays clips through Web Audio. Once the context has been resumed inside a tap, iOS lets it
// play later from timers too, which an <audio> element doesn't reliably allow.
export function createPlayer(base = 'audio/') {
  let ctx = null;
  let keys = null;
  let current = null;
  const buffers = new Map();
  const ready = fetch(`${base}clips.json`).then((r) => (r.ok ? r.json() : [])).then((list) => { keys = new Set(list); }).catch(() => { keys = new Set(); });

  const context = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      // Play even with the ring/silent switch on, like the device voice did.
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* older Safari */ }
      ctx = new AC();
    }
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    return ctx;
  };

  const load = (key) => {
    if (!buffers.has(key)) {
      const p = fetch(`${base}${key}.mp3`).then((r) => {
        if (!r.ok) throw new Error(`clip ${key}: ${r.status}`);
        return r.arrayBuffer();
      }).then((data) => new Promise((resolve, reject) => context().decodeAudioData(data, resolve, reject)));
      p.catch(() => buffers.delete(key));
      buffers.set(key, p);
    }
    return buffers.get(key);
  };

  return {
    ready,
    // Call from a tap: starts (or restarts) the audio context.
    unlock() { context(); },
    has(key) { return !!keys?.has(key); },
    stop() {
      if (current) { current.handle.stopped = true; current.source?.stop(); current = null; }
    },
    // Plays clips one after another. Returns a handle whose onend (set by the caller) fires when
    // the last one finishes; onerror fires if a clip can't be played.
    play(list, { rate = 1 } = {}) {
      this.stop();
      const handle = { onend: null, onerror: null, stopped: false };
      const me = { handle, source: null };
      current = me;
      const next = (i) => {
        if (handle.stopped) return;
        if (i === list.length) { if (current === me) current = null; handle.onend?.(); return; }
        load(list[i]).then((buf) => {
          if (handle.stopped) return;
          const c = context();
          const src = c.createBufferSource();
          src.buffer = buf;
          src.playbackRate.value = rate;
          src.connect(c.destination);
          src.onended = () => next(i + 1);
          me.source = src;
          src.start();
        }).catch((e) => { if (!handle.stopped) handle.onerror?.(e); });
      };
      next(0);
      return handle;
    },
    get state() { return ctx?.state || 'none'; },
  };
}
