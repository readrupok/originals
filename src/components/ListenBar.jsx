import React, { useEffect, useRef, useState } from 'react';
import { INK } from '../data/content';
import { STATE, createNarrator, isSupported, loadRate, loadVoices, pickVoice } from '../lib/tts';
import { Pause } from 'lucide-react';

// Narration with the device's own voice; the text is always read in its own language.
// Where the device lists no voice for it, Listen still tries: the device's default
// voice told the language (Android and iPhone engines often have Bangla without listing
// it), then the nearest voices. A voice that stays silent is skipped at once; only when
// none speaks does the bar say the device cannot read it aloud.

// The voices to try, best first. null = let the device choose for the language.
function voiceChain(voices, lang) {
  const own = pickVoice(voices, lang);
  if (own) return [own];
  if (lang !== 'bn') return [null];
  const near = [pickVoice(voices, 'hi'), voices.find(v => /^en[-_]IN/i.test(v.lang))];
  return [null, ...near.filter(Boolean)];
}

// How many times a voice that stops mid-way is restarted from the same paragraph
// before Listen gives up and says so
const RETRIES = 2;

const btn = (primary, disabled) => ({
  padding: '8px 15px', border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, borderRadius: 999,
  background: disabled ? '#e8e4da' : primary ? 'var(--ink-bg, #151515)' : 'var(--card, var(--card, #fff))',
  color: disabled ? '#8d8880' : primary ? '#fff' : INK,
  fontWeight: 800, fontSize: 13, fontFamily: 'inherit',
  cursor: disabled ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap'
});

export default function ListenBar({ paragraphs, lang, t, onParagraph }) {
  const [state, setState] = useState(STATE.preparing);
  const [rate, setRate] = useState(loadRate);
  const [current, setCurrent] = useState(-1);
  const narratorRef = useRef(null);

  const supported = isSupported();

  // Rebuild the narrator whenever the text or language changes, and always
  // tear the old one down so a stale narrator never talks over the new page.
  useEffect(() => {
    narratorRef.current?.destroy();
    narratorRef.current = null;
    setState(STATE.preparing);
    setCurrent(-1);
    onParagraph?.(-1);

    if (!supported || !paragraphs?.length) return undefined;
    let live = true;
    let retries = 0;
    let failedAt = -1;
    let retryTimer = null;

    const start = (chain, at) => {
      const [voice, ...rest] = chain;
      const n = createNarrator({
        paragraphs, lang, voice, onState: setState,
        onParagraph: i => {
          if (i > failedAt) retries = 0; // got past the trouble spot
          setCurrent(i);
          onParagraph?.(i);
        },
        onFail: at => {
          if (!live) return;
          // This voice never managed a sentence: it cannot read the text, so try the next one
          if (!n.spoke) {
            n.destroy();
            if (rest.length) { start(rest, at); return; }
            setState(STATE.unsupported);
            return;
          }
          // It was reading and stopped: pick up from the same paragraph
          failedAt = at;
          if (retries++ >= RETRIES) { setState(STATE.failed); return; }
          retryTimer = setTimeout(() => { if (live) n.play(at); }, 400);
        }
      });
      n.setRate(rate);
      narratorRef.current = n;
      if (Number.isInteger(at)) n.play(at);
      return n;
    };

    (async () => {
      const voices = await loadVoices();
      if (!live) return;
      start(voiceChain(voices, lang));
      setState(STATE.idle);
    })();

    return () => {
      live = false;
      clearTimeout(retryTimer);
      narratorRef.current?.destroy();
      narratorRef.current = null;
    };
    // `rate` is applied through setRate, not by rebuilding.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, lang, paragraphs]);

  if (!supported || state === STATE.unsupported) return <Notice>{t.listenUnsupported}</Notice>;
  if (state === STATE.failed) return <Notice>{t.listenFailed || 'Listening isn’t working right now. Please try again in a little while.'}</Notice>;

  const speaking = state === STATE.speaking;
  const preparing = state === STATE.preparing;
  const paused = state === STATE.paused;
  // Always reach the narrator in the ref at click time: it is made once the voice list arrives.
  const n = {
    play: () => narratorRef.current?.play(),
    pause: () => narratorRef.current?.pause(),
    resume: () => narratorRef.current?.resume(),
    stop: () => narratorRef.current?.stop(),
    setRate: r => narratorRef.current?.setRate(r)
  };

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10,
      padding: '10px 14px', border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, borderRadius: 12,
      background: 'var(--card-2, #f9f7f1)'
    }}>
      {!speaking && !paused && (
        <button type="button" style={btn(true, preparing)} disabled={preparing} onClick={() => n?.play()}>▶ {t.listenPlay}</button>
      )}
      {speaking && (
        <button type="button" style={btn(false)} onClick={() => n?.pause()}><Pause size={14} /> {t.listenPause}</button>
      )}
      {paused && (
        <button type="button" style={btn(true)} onClick={() => n?.resume()}>▶ {t.listenResume}</button>
      )}
      {(speaking || paused) && (
        <button type="button" style={btn(false)} onClick={() => n?.stop()}>■ {t.listenStop}</button>
      )}

      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--muted-2, #55524a)' }}>
        {t.listenRate}
        <input
          type="range" min="0.5" max="2" step="0.1" value={rate}
          onChange={e => {
            const next = parseFloat(e.target.value);
            setRate(next);
            n?.setRate(next);
          }}
          style={{ width: 92, accentColor: INK }}
        />
        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{rate.toFixed(1)}×</span>
      </label>

      {preparing && (
        <span aria-live="polite" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--muted, #6b675e)' }}>
          <span className="rs-spinner" aria-hidden="true" style={{ width: 14, height: 14 }} /> {t.listenLoading || '…'}
        </span>
      )}

      {current >= 0 && (
        <span aria-live="polite" style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--muted, #6b675e)' }}>
          {String(t.listenParagraph || '')
            .replace('{n}', current + 1)
            .replace('{total}', paragraphs.length)}
        </span>
      )}
    </div>
  );
}

function Notice({ children }) {
  return (
    <div style={{
      padding: '9px 14px', border: `calc(2px * var(--bwk, 1)) dashed var(--edge, #151515)`, borderRadius: 12,
      background: 'transparent', fontSize: 13, color: 'var(--muted, #6b675e)'
    }}>{children}</div>
  );
}
