// ---------------------------------------------------------------------------
// Translating a piece for a reader of the other language.
//
// A writing is written in one language. When the reader switches the site to
// the other one, we offer a translation. The default provider asks our own
// server, which works in every browser and caches each paragraph, so a piece
// is only ever translated once. The on-device browser Translator API (recent
// desktop Chrome only) is kept as a provider too.
//
// The original always renders first and translation is an opt-in overlay.
// `providers` is the seam for swapping engines without touching any page.
// ---------------------------------------------------------------------------

export const STATUS = {
  unsupported: 'unsupported',   // this browser has no translator
  unavailable: 'unavailable',   // supported, but not for this language pair
  downloadable: 'downloadable', // needs a one-time language-pack download
  ready: 'ready',
  downloading: 'downloading',
  translating: 'translating',
  done: 'done',
  failed: 'failed'
};

// Joins several text runs into one request and splits them back out. The
// separator is an invisible separator character on its own line, which
// translation engines leave intact far more reliably than punctuation.
const SEP = '\n⁣\n';

const browserProvider = {
  name: 'browser',

  supported() {
    return typeof self !== 'undefined' && 'Translator' in self;
  },

  async availability(from, to) {
    if (!this.supported()) return STATUS.unsupported;
    try {
      // Some builds never settle this promise (headless Chrome with no model
      // installed, for one). The banner must always reach a final state, so a
      // check that stalls is treated as "not available here".
      const state = await Promise.race([
        self.Translator.availability({ sourceLanguage: from, targetLanguage: to }),
        new Promise(resolve => setTimeout(() => resolve('__timeout'), 4000))
      ]);
      if (state === 'available') return STATUS.ready;
      if (state === 'downloadable' || state === 'downloading') return STATUS.downloadable;
      return STATUS.unavailable;
    } catch {
      return STATUS.unavailable;
    }
  },

  async create(from, to, { onProgress } = {}) {
    const translator = await self.Translator.create({
      sourceLanguage: from,
      targetLanguage: to,
      monitor(m) {
        m.addEventListener('downloadprogress', e => {
          // `loaded` is 0..1 in the shipped API.
          onProgress?.(Math.round((e.loaded ?? 0) * 100));
        });
      }
    });
    return {
      translate: text => translator.translate(text),
      destroy: () => translator.destroy?.()
    };
  }
};

// Our server: one request carries many paragraphs, and it never needs a download.
const BATCH = { texts: 100, chars: 30000, maxRun: 5000 };
const serverProvider = {
  name: 'server',
  supported: () => typeof fetch === 'function',
  availability: async (from, to) => (from !== to && ['bn', 'en'].includes(from) && ['bn', 'en'].includes(to) ? STATUS.ready : STATUS.unavailable),
  async create(from, to) {
    const engine = {
      async translateMany(texts) {
        const res = await fetch('/api/v1/client/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to, texts })
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(json?.data?.texts)) throw new Error(json?.message || `Translation failed (${res.status})`);
        return json.data.texts;
      },
      translate: async text => (await engine.translateMany([text]))[0],
      destroy() {}
    };
    return engine;
  }
};

export const providers = { server: serverProvider, browser: browserProvider };

let active = 'server';
export const getProvider = (name = active) => providers[name] || providers.server;
export const setProvider = name => { if (providers[name]) active = name; };

export const isSupported = () => getProvider().supported();
export const availability = (from, to) => getProvider().availability(from, to);

// ── Cache ──────────────────────────────────────────────────────────────────
// Memory first; sessionStorage so a back-and-forth in the same tab is instant.
// Both reads and writes are guarded — private windows throw on access, and a
// long novel would blow the quota.

const memory = new Map();
const MAX_STORED = 200_000;

export const cacheKey = (writingKey, chapterNum, to) =>
  `rupok-tr:${writingKey}:${chapterNum ?? 0}:${to}`;

function cacheGet(key) {
  if (memory.has(key)) return memory.get(key);
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const doc = JSON.parse(raw);
    memory.set(key, doc);
    return doc;
  } catch {
    return null;
  }
}

function cacheSet(key, doc) {
  memory.set(key, doc);
  try {
    const raw = JSON.stringify(doc);
    if (raw.length <= MAX_STORED) sessionStorage.setItem(key, raw);
  } catch {
    // Quota or a private window — the memory cache still serves this tab.
  }
}

// ── Document walking ───────────────────────────────────────────────────────

/** Every text node, in document order. Structure is never touched. */
function collectTextNodes(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (node.type === 'text' && node.text) out.push(node);
  for (const child of node.content || []) collectTextNodes(child, out);
  return out;
}

/**
 * Translates a Tiptap document.
 *
 * Only `node.text` is ever replaced, so marks, headings, list nesting and the
 * hard breaks that hold a poem's lines together survive by construction.
 */
export async function translateDoc(doc, from, to, { onProgress, onStatus, signal, writingKey, chapterNum } = {}) {
  if (!doc) return doc;
  if (from === to) return doc;

  const key = writingKey ? cacheKey(writingKey, chapterNum, to) : null;
  if (key) {
    const hit = cacheGet(key);
    if (hit) return hit;
  }

  const provider = getProvider();
  if (!provider.supported()) {
    const err = new Error(STATUS.unsupported);
    err.status = STATUS.unsupported;
    throw err;
  }

  const state = await provider.availability(from, to);
  if (state === STATUS.unavailable || state === STATUS.unsupported) {
    const err = new Error(state);
    err.status = state;
    throw err;
  }

  if (state === STATUS.downloadable) onStatus?.(STATUS.downloading);
  const translator = await provider.create(from, to, { onProgress });
  onStatus?.(STATUS.translating);

  try {
    const clone = structuredClone(doc);
    const nodes = collectTextNodes(clone);
    if (!nodes.length) return clone;

    // An engine that takes many texts at once gets them in a few large requests:
    // every run is sent as its own item, so nothing has to be split back apart.
    if (typeof translator.translateMany === 'function') {
      let done = 0;
      // A run longer than the server accepts stays in the original language
      const sendable = nodes.filter(n => n.text.length <= BATCH.maxRun);
      done = nodes.length - sendable.length;
      for (let start = 0; start < sendable.length;) {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        const batch = [];
        let chars = 0;
        while (start < sendable.length && batch.length < BATCH.texts && (!batch.length || chars + sendable[start].text.length <= BATCH.chars)) {
          chars += sendable[start].text.length;
          batch.push(sendable[start++]);
        }
        const parts = await translator.translateMany(batch.map(n => n.text));
        if (Array.isArray(parts) && parts.length === batch.length) batch.forEach((n, i) => { n.text = parts[i]; });
        done += batch.length;
        onProgress?.(Math.round((done / nodes.length) * 100));
      }
      if (key) cacheSet(key, clone);
      return clone;
    }

    // Batch per top-level block so one request carries a whole paragraph.
    const batches = [];
    for (const block of clone.content || []) {
      const texts = collectTextNodes(block);
      if (texts.length) batches.push(texts);
    }

    let done = 0;
    for (const batch of batches) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

      const joined = batch.map(n => n.text).join(SEP);
      let parts;
      try {
        const result = await translator.translate(joined);
        parts = result.split(SEP);
      } catch {
        parts = null;
      }

      if (parts && parts.length === batch.length) {
        batch.forEach((n, i) => { n.text = parts[i]; });
      } else {
        // The engine dropped or merged the separator — fall back to one call
        // per run for this block rather than scrambling the text.
        for (const n of batch) {
          if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
          try {
            n.text = await translator.translate(n.text);
          } catch {
            // Leave this run in the original language rather than losing it.
          }
        }
      }
      done += batch.length;
      onProgress?.(Math.round((done / nodes.length) * 100));
    }

    if (key) cacheSet(key, clone);
    return clone;
  } finally {
    translator.destroy?.();
  }
}

/** Translates a list of plain strings — used for the narration text. */
export async function translateParagraphs(list, from, to, opts = {}) {
  const doc = {
    type: 'doc',
    content: list.map(text => ({ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }))
  };
  const out = await translateDoc(doc, from, to, opts);
  return (out.content || []).map(p => (p.content || []).map(n => n.text || '').join(''));
}
