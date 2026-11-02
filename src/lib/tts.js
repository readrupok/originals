// ---------------------------------------------------------------------------
// Reading a piece aloud with the device's own voice (speechSynthesis).
//
// Nothing leaves the reader's device: the phone or computer reads the text
// with a voice it already has. Where it has no voice for the language (many
// computers lack Bangla), ListenBar says so instead of reading Bangla with an
// English voice. Engines are quirky — some stop mid-way without a word — so the
// narrator watches for that and the caller can pick up from the same paragraph.
// ---------------------------------------------------------------------------

export const STATE = {
  unsupported: 'unsupported', // no speechSynthesis, or no voice for the language
  preparing: 'preparing',     // waiting for the voice list
  idle: 'idle',
  speaking: 'speaking',
  paused: 'paused',
  failed: 'failed'
};

const synth = () => (typeof window !== 'undefined' ? window.speechSynthesis : null);

export const isSupported = () => !!synth() && typeof window.SpeechSynthesisUtterance === 'function';

// Chrome populates the voice list asynchronously and returns [] on the first
// call, so wait for `voiceschanged` — but never hang if it does not fire.
let voicesPromise = null;
export function loadVoices(timeout = 1500) {
  const s = synth();
  if (!s) return Promise.resolve([]);
  if (voicesPromise) return voicesPromise;

  voicesPromise = new Promise(resolve => {
    const ready = s.getVoices();
    if (ready.length) return resolve(ready);

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      s.removeEventListener('voiceschanged', finish);
      resolve(s.getVoices());
    };
    s.addEventListener('voiceschanged', finish);
    setTimeout(finish, timeout);
  });
  return voicesPromise;
}

/**
 * The best voice for a language, or null.
 *
 * Returning null matters: reading Bangla with an en-US voice produces
 * gibberish, so the caller disables the control rather than falling back to
 * the default voice.
 */
export function pickVoice(voices, lang) {
  const want = String(lang || 'en').toLowerCase().slice(0, 2);
  const matches = voices.filter(v => String(v.lang || '').toLowerCase().replace('_', '-').startsWith(want));
  if (!matches.length) return null;
  // The online neural voices (Edge's "Natural", Chrome's "Google …") sound far better than
  // the basic offline ones; Bangladeshi Bangla before Indian Bangla when both exist.
  const score = v => (/natural|online|google/i.test(v.name) ? 4 : 0) + (/-bd$/i.test(v.lang) ? 2 : 0) + (v.localService ? 0 : 1);
  return [...matches].sort((a, b) => score(b) - score(a))[0];
}

// Long utterances are truncated or dropped by several engines; sentence-sized
// chunks also make seeking and highlighting feel responsive.
const MAX_CHUNK = 200;

// `।` is the Bangla full stop and must end a sentence just like `.` does.
const SENTENCE_END = /(?<=[.!?।;:])\s+/;

export function chunkParagraph(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= MAX_CHUNK) return [clean];

  const out = [];
  let buffer = '';
  for (const sentence of clean.split(SENTENCE_END)) {
    if ((buffer + ' ' + sentence).trim().length > MAX_CHUNK && buffer) {
      out.push(buffer.trim());
      buffer = sentence;
    } else {
      buffer = buffer ? `${buffer} ${sentence}` : sentence;
    }
  }
  if (buffer.trim()) out.push(buffer.trim());

  // A single sentence longer than the limit still has to be split somewhere.
  // A single sentence longer than the limit still has to be split somewhere: at a space if there is one.
  return out.flatMap(part => {
    if (part.length <= MAX_CHUNK) return [part];
    const pieces = [];
    let rest = part;
    while (rest.length > MAX_CHUNK) {
      const cut = rest.lastIndexOf(' ', MAX_CHUNK);
      const at = cut > MAX_CHUNK / 2 ? cut : MAX_CHUNK;
      pieces.push(rest.slice(0, at).trim());
      rest = rest.slice(at).trim();
    }
    if (rest) pieces.push(rest);
    return pieces;
  });
}

// Desktop Chrome cuts Google's online voices off after about 15 seconds unless the queue is nudged.
// On Android the same nudge (pause) cancels speech outright, and other voices do not need it.
const needsKeepAlive = voice =>
  typeof navigator !== 'undefined' && /Chrome|Chromium/.test(navigator.userAgent) && !/Android|Mobile/i.test(navigator.userAgent) &&
  !!voice && !voice.localService && /google/i.test(voice.name);

// Speech has stalled when the engine has gone quiet for this long without saying the chunk ended
const STALL_MS = 2500;
// …or the chunk has run far past any natural reading time
const deadlineFor = (text, rate) => 8000 + (text.length * 110) / rate;

const RATE_KEY = 'rupok-tts-rate';
export function loadRate() {
  try {
    const n = parseFloat(localStorage.getItem(RATE_KEY));
    return Number.isFinite(n) && n >= 0.5 && n <= 2 ? n : 1;
  } catch {
    return 1;
  }
}
function storeRate(rate) {
  try { localStorage.setItem(RATE_KEY, String(rate)); } catch { /* private window */ }
}

/**
 * Builds a narrator over a list of paragraphs.
 *
 * `onParagraph(i)` fires as each paragraph starts; the reader uses it to
 * highlight the matching `data-par` block.
 */
export function createNarrator({ paragraphs = [], lang = 'en', voice = null, onParagraph, onState, onEnd, onFail } = {}) {
  const s = synth();
  const speakable = t => /[\p{L}\p{N}]/u.test(t); // a "* * *" scene break has nothing to say
  const blocks = paragraphs.map((text, index) => ({ index, chunks: chunkParagraph(text).filter(speakable) }))
    .filter(b => b.chunks.length);

  let state = STATE.idle;
  let parIndex = 0;
  let chunkIndex = 0;
  let rate = loadRate();
  let keepAlive = null;
  let stopped = true;
  let watchdog = null; // fails over a voice that never starts speaking
  let monitor = null;  // catches a voice that stops mid-way without an end event
  // The utterance being spoken. Holding it keeps Chrome from garbage-collecting it mid-sentence,
  // which silently drops its end event and with it the rest of the narration.
  let current = null;
  let spoke = false; // a chunk has been read out in full: this voice really can read the text

  const setState = next => {
    state = next;
    onState?.(next);
  };

  // Pausing and resuming on a timer keeps desktop Chrome's online Google voices going past
  // their ~15 second cut-off. Only those voices get it (see needsKeepAlive).
  function startKeepAlive() {
    if (!needsKeepAlive(voice) || keepAlive) return;
    keepAlive = setInterval(() => {
      if (s && s.speaking && !s.paused) {
        s.pause();
        s.resume();
      }
    }, 10_000);
  }
  function stopKeepAlive() {
    if (keepAlive) clearInterval(keepAlive);
    keepAlive = null;
    clearInterval(monitor);
    monitor = null;
  }

  function speakCurrent() {
    if (stopped || !s) return;
    const block = blocks[parIndex];
    if (!block) return finish();

    if (chunkIndex === 0) onParagraph?.(block.index);

    const utterance = new window.SpeechSynthesisUtterance(block.chunks[chunkIndex]);
    current = utterance;
    utterance.lang = voice?.lang || (lang === 'bn' ? 'bn-BD' : 'en-GB');
    if (voice) utterance.voice = voice;
    utterance.rate = rate;

    // Some device voices are listed but silent: no start event, or an "end" that comes at
    // once without a sound. Either counts as a failure, so the caller can try again from this paragraph.
    const failOver = () => {
      if (stopped) return;
      clearTimeout(watchdog);
      if (onFail) { stopped = true; stopKeepAlive(); s.cancel(); onFail(block.index); } else finish();
    };
    let startedAt = 0;
    clearTimeout(watchdog);
    watchdog = setTimeout(() => { if (!startedAt && state === STATE.speaking) failOver(); }, 4000);
    utterance.onstart = () => { startedAt = Date.now(); clearTimeout(watchdog); };

    // Some engines stop mid-way (a dropped network voice, a phone reclaiming audio) and never
    // say so. Watch for silence or an overrun, and report it so the caller can pick up from the same paragraph.
    const deadline = Date.now() + 4000 + deadlineFor(utterance.text, rate);
    let quietSince = 0;
    clearInterval(monitor);
    monitor = setInterval(() => {
      if (stopped || current !== utterance || state !== STATE.speaking) return;
      if (Date.now() > deadline) return failOver();
      if (!startedAt) return;
      if (s.speaking || s.pending) { quietSince = 0; return; }
      if (!quietSince) quietSince = Date.now();
      else if (Date.now() - quietSince > STALL_MS) failOver();
    }, 1000);

    utterance.onend = () => {
      if (stopped || current !== utterance) return;
      clearTimeout(watchdog);
      clearInterval(monitor);
      const text = block.chunks[chunkIndex];
      if (text.length > 30 && (!startedAt || Date.now() - startedAt < 300)) return failOver();
      if (startedAt && Date.now() - startedAt >= 300) spoke = true;
      chunkIndex++;
      if (chunkIndex >= block.chunks.length) {
        chunkIndex = 0;
        parIndex++;
      }
      if (parIndex >= blocks.length) return finish();
      speakCurrent();
    };
    utterance.onerror = event => {
      // `interrupted` and `canceled` are what a deliberate stop looks like.
      if (stopped || current !== utterance || event.error === 'interrupted' || event.error === 'canceled') return;
      clearTimeout(watchdog);
      clearInterval(monitor);
      // A real failure: let the caller pick up from this paragraph
      if (onFail) { stopped = true; stopKeepAlive(); onFail(block.index); } else finish();
    };

    s.speak(utterance);
  }

  function finish() {
    stopped = true;
    current = null;
    stopKeepAlive();
    parIndex = 0;
    chunkIndex = 0;
    setState(STATE.idle);
    onParagraph?.(-1);
    onEnd?.();
  }

  return {
    get state() { return state; },
    get rate() { return rate; },
    get paragraph() { return blocks[parIndex]?.index ?? -1; },
    get length() { return blocks.length; },
    get spoke() { return spoke; },

    play(from) {
      if (!s || !blocks.length) return;
      s.cancel();
      stopped = false;
      if (Number.isInteger(from)) {
        const at = blocks.findIndex(b => b.index === from);
        parIndex = at >= 0 ? at : 0;
      }
      chunkIndex = 0;
      setState(STATE.speaking);
      startKeepAlive();
      speakCurrent();
    },

    // Pausing cancels and resuming re-speaks the current chunk (a sentence or two): Android
    // treats speechSynthesis.pause() as a cancel, and some voices never come back from resume().
    pause() {
      clearTimeout(watchdog);
      if (!s || state !== STATE.speaking) return;
      stopped = true;
      current = null;
      s.cancel();
      stopKeepAlive();
      setState(STATE.paused);
    },

    resume() {
      if (!s || state !== STATE.paused) return;
      stopped = false;
      setState(STATE.speaking);
      startKeepAlive();
      speakCurrent();
    },

    stop() {
      clearTimeout(watchdog);
      if (!s) return;
      stopped = true;
      current = null;
      s.cancel();
      stopKeepAlive();
      parIndex = 0;
      chunkIndex = 0;
      setState(STATE.idle);
      onParagraph?.(-1);
    },

    seekTo(paragraph) {
      this.play(paragraph);
    },

    setRate(next) {
      rate = Math.min(2, Math.max(0.5, Number(next) || 1));
      storeRate(rate);
      // The rate of an utterance already queued cannot change, so restart the
      // current paragraph at the new speed.
      if (state === STATE.speaking) this.play(blocks[parIndex]?.index);
      return rate;
    },

    destroy() {
      clearTimeout(watchdog);
      stopped = true;
      current = null;
      stopKeepAlive();
      s?.cancel();
    }
  };
}

/** Belt and braces: speechSynthesis is global, so a reload must silence it. */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    try { window.speechSynthesis?.cancel(); } catch { /* nothing to do */ }
  });
}
