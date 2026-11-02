import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, ExternalLink, Maximize2, Minimize2, Play, SkipBack, SkipForward } from 'lucide-react';
import MyListButton from '../components/MyListButton';
import ShareBar from '../components/ShareBar';
import { ytId, ytThumb, recordWatch, watchedOf, openPreview } from '../lib/originals';
import { fill } from '../lib/ogWords';
import { ogCopy, NIGHT, PANEL, TEXT, DIM, GOLD, DISPLAY } from './OriginalsHome';

const AUTOPLAY_KEY = 'rupok-og-autoplay';
const COUNTDOWN = 5;

/**
 * Watch on Rupok Originals: one episode playing large, the queue of what comes
 * next beside it. The episode is in the address (?s=series&e=index), so it can
 * be shared or reloaded. When an episode ends the next one starts after a
 * five-second countdown the viewer can cancel (autoplay can be turned off).
 * Theater mode gives the player the whole width. Keys: N next, P previous,
 * T theater.
 */
export default function OriginalsWatch({ lang, base, t, num, user, series = [] }) {
  const c = ogCopy(t, lang);
  // Every episode that can play, each series' in order, the series in catalogue order
  const all = useMemo(() => series.flatMap(s => s.eps.map((e, i) => ({ s, e, i })).filter(({ e }) => e.live && ytId(e.url))), [series]);

  const pickFromUrl = () => {
    let q;
    try { q = new URLSearchParams(window.location.search); } catch { q = new URLSearchParams(); }
    const sk = q.get('s');
    const ei = parseInt(q.get('e'), 10);
    let at = all.findIndex(x => x.s.k === sk && x.i === ei);
    if (at < 0 && sk) {
      // The series given: where the viewer left it, else its first episode
      const seen = watchedOf(sk);
      at = all.findIndex(x => x.s.k === sk && (!seen || x.i === seen.i));
      if (at < 0) at = all.findIndex(x => x.s.k === sk);
    }
    return Math.max(0, at);
  };

  const [at, setAt] = useState(pickFromUrl);
  const [theater, setTheater] = useState(false);
  const [autoplay, setAutoplay] = useState(() => { try { return localStorage.getItem(AUTOPLAY_KEY) !== 'off'; } catch { return true; } });
  const [countdown, setCountdown] = useState(null);
  const frame = useRef(null);
  const queueRef = useRef(null);
  const cur = all[at];
  const next = all[at + 1] || null;

  // The address and the history follow the episode on screen
  useEffect(() => {
    if (!cur) return;
    const url = `${window.location.pathname}?s=${encodeURIComponent(cur.s.k)}&e=${cur.i}`;
    if (url !== window.location.pathname + window.location.search) window.history.replaceState(null, '', url);
    recordWatch(cur.s.k, cur.i);
    setCountdown(null);
    document.documentElement.style.setProperty('--acc', cur.s.ac || GOLD);
    queueRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [at, cur?.s.k, cur?.i]);

  useEffect(() => { try { localStorage.setItem(AUTOPLAY_KEY, autoplay ? 'on' : 'off'); } catch { /* private window */ } }, [autoplay]);

  // A link to another episode followed while already here (the page stays
  // mounted): the address changed under us, so follow it
  useEffect(() => {
    if (!cur) return;
    const want = pickFromUrl();
    const here = `?s=${encodeURIComponent(cur.s.k)}&e=${cur.i}`;
    if (window.location.search !== here && want !== at) setAt(want);
  });

  // The YouTube player reports its state once asked to; 0 is "ended"
  useEffect(() => {
    const onMsg = e => {
      if (!/youtube(-nocookie)?\.com$/.test(new URL(e.origin).hostname)) return;
      let data;
      try { data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data; } catch { return; }
      const ended = (data?.event === 'onStateChange' && data.info === 0) || (data?.event === 'infoDelivery' && data.info?.playerState === 0);
      if (ended && next && autoplay) setCountdown(COUNTDOWN);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [next, autoplay]);

  useEffect(() => {
    if (countdown == null) return undefined;
    if (countdown <= 0) { setAt(a => Math.min(all.length - 1, a + 1)); return undefined; }
    const id = setTimeout(() => setCountdown(n => n - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown, all.length]);

  useEffect(() => {
    const onKey = e => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '') || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === 'n' && at < all.length - 1) setAt(at + 1);
      else if (k === 'p' && at > 0) setAt(at - 1);
      else if (k === 't') setTheater(v => !v);
      else if (k === 'escape' && countdown != null) setCountdown(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [at, all.length, countdown]);

  // Ask the player to report its state (needs enablejsapi=1)
  const listen = () => {
    const w = frame.current?.contentWindow;
    if (!w) return;
    w.postMessage(JSON.stringify({ event: 'listening', id: 'og-watch', channel: 'widget' }), '*');
  };

  if (!cur) {
    return (
      <div style={{ background: NIGHT, color: TEXT, minHeight: '70vh', display: 'grid', placeItems: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', maxWidth: 520 }}>
          <h1 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-.03em' }}>{t.h1Watch}</h1>
          <p style={{ margin: 0, color: DIM, lineHeight: 1.6 }}>{c.noVideo}</p>
          <a href={`${base}/series`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: GOLD, fontWeight: 700, textDecoration: 'none' }}>{c.series} <ArrowRight size={16} /></a>
        </div>
      </div>
    );
  }

  const vid = ytId(cur.e.url);
  const origin = encodeURIComponent(window.location.origin);
  const btn = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,.22)', background: 'rgba(255,255,255,.06)', color: TEXT, font: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer', textDecoration: 'none' };

  return (
    <div className={`ogw${theater ? ' is-theater' : ''}`} style={{ background: NIGHT, color: TEXT }}>
      <div className="ogw-grid">
        <div className="ogw-main">
          <div className="ogw-player">
            <iframe
              key={vid}
              ref={frame}
              title={cur.e.t}
              src={`https://www.youtube-nocookie.com/embed/${vid}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${origin}`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              onLoad={() => { listen(); setTimeout(listen, 1500); }}
            />
            {countdown != null && next && (
              <div className="ogw-next" role="status">
                <span className="ogw-next-pic" style={{ backgroundImage: `url(${ytThumb(next.e.url)})` }} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <span style={{ color: GOLD, fontWeight: 800, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase' }}>{fill(c.nextIn, { n: num(countdown, lang) })}</span>
                  <strong style={{ fontSize: 18 }}>{next.e.t}</strong>
                  <span style={{ color: DIM, fontSize: 13 }}>{next.s.title} · {fill(c.episode, { n: next.e.n })}</span>
                  <span style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button type="button" onClick={() => setAt(at + 1)} style={{ ...btn, background: TEXT, color: '#111', borderColor: TEXT }}><Play size={15} fill="currentColor" /> {c.playNow}</button>
                    <button type="button" onClick={() => setCountdown(null)} style={btn}>{c.cancel}</button>
                  </span>
                </span>
                <svg className="ogw-ring" viewBox="0 0 36 36" aria-hidden="true">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke={GOLD} strokeWidth="3" strokeLinecap="round"
                    strokeDasharray="100.5" strokeDashoffset={100.5 * (countdown / COUNTDOWN)} style={{ transition: 'stroke-dashoffset 1s linear', transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
                </svg>
              </div>
            )}
          </div>

          <div className="ogw-info">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <span style={{ color: GOLD, fontWeight: 800, fontSize: 12.5, letterSpacing: '.16em', textTransform: 'uppercase' }}>
                {cur.s.title} · {fill(c.episode, { n: cur.e.n })}
              </span>
              <h1 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(24px, 2.6vw, 36px)', lineHeight: 1.1, letterSpacing: '-.025em' }}>{cur.e.t}</h1>
            </div>
            <div className="ogw-controls">
              <button type="button" onClick={() => setAt(at - 1)} disabled={at === 0} style={{ ...btn, opacity: at === 0 ? 0.4 : 1 }} aria-label={c.prev} title={`${c.prev} (P)`}><SkipBack size={16} /></button>
              <button type="button" onClick={() => setAt(at + 1)} disabled={!next} style={{ ...btn, opacity: next ? 1 : 0.4 }} aria-label={c.next} title={`${c.next} (N)`}><SkipForward size={16} /></button>
              <button type="button" onClick={() => setTheater(v => !v)} aria-pressed={theater} style={{ ...btn, ...(theater ? { borderColor: GOLD, color: GOLD } : {}) }} title={`${c.theater} (T)`}>
                {theater ? <Minimize2 size={16} /> : <Maximize2 size={16} />} <span className="ogw-hide-sm">{c.theater}</span>
              </button>
              <a href={cur.e.url} target="_blank" rel="noopener noreferrer" style={btn} title={c.onYouTube}><ExternalLink size={16} /> <span className="ogw-hide-sm">{c.onYouTube}</span></a>
            </div>
          </div>

          <div className="ogw-about">
            <button type="button" className="ogw-series" onClick={() => openPreview(cur.s.k)} title={c.info}>
              <span style={{ background: `${cur.s.ac} url(${cur.s.poster}) center/cover` }} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, textAlign: 'left' }}>
                <strong style={{ fontFamily: DISPLAY, fontSize: 17 }}>{cur.s.title}</strong>
                <em style={{ fontStyle: 'normal', color: DIM, fontSize: 13.5 }}>{cur.s.sub}</em>
              </span>
            </button>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
              <MyListButton seriesKey={cur.s.k} user={user} t={t} lang={lang} base={base} />
              {cur.s.comicHref && <a href={cur.s.comicHref} data-pow="" style={{ ...btn, padding: '13px 18px', fontSize: 15 }}><BookOpen size={17} /> {c.read}</a>}
            </div>
            {cur.s.log && <p style={{ margin: 0, color: '#d6d3d1', lineHeight: 1.65, maxWidth: 760 }}>{cur.s.log}</p>}
            <ShareBar path={`/watch?s=${cur.s.k}&e=${cur.i}`} title={`${cur.s.title} — ${cur.e.t}`} t={t} />
          </div>
        </div>

        {/* Up next */}
        <aside className="ogw-queue" aria-label={c.upNext}>
          <div className="ogw-queue-head">
            <h2 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 18, fontWeight: 800 }}>{c.upNext}</h2>
            <label className="ogw-switch">
              <input type="checkbox" checked={autoplay} onChange={e => setAutoplay(e.target.checked)} />
              <span aria-hidden="true" />
              {c.autoplay}
            </label>
          </div>
          <ol ref={queueRef} className="ogw-list">
            {all.map((x, n) => (
              <li key={`${x.s.k}-${x.i}`}>
                <button type="button" onClick={() => setAt(n)} aria-current={n === at ? 'true' : undefined} className="ogw-item">
                  <span className="ogw-thumb" style={{ backgroundImage: `url(${ytThumb(x.e.url, 'mqdefault')})` }}>
                    {n === at && <span className="ogw-eq" aria-hidden="true"><i /><i /><i /></span>}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    <strong>{x.e.t}</strong>
                    <span>{x.s.title} · {fill(c.episode, { n: x.e.n })}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <span style={{ fontSize: 12, color: DIM, padding: '10px 4px 0' }}>{c.watchKeys}</span>
        </aside>
      </div>

      <style>{`
        .ogw-grid { max-width: 1600px; margin: 0 auto; padding: clamp(16px, 2.4vw, 32px); display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: clamp(18px, 2vw, 28px); align-items: start; }
        .ogw.is-theater .ogw-grid { grid-template-columns: 1fr; max-width: none; padding-top: 0; padding-inline: 0; }
        .ogw.is-theater .ogw-info, .ogw.is-theater .ogw-about, .ogw.is-theater .ogw-queue { margin-inline: clamp(16px, 2.4vw, 32px); }
        @media (max-width: 1080px) { .ogw-grid { grid-template-columns: 1fr; } }
        .ogw-main { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
        .ogw-player { position: relative; aspect-ratio: 16 / 9; background: #000; border-radius: 14px; overflow: hidden; box-shadow: 0 30px 80px -40px var(--acc, ${GOLD}); }
        .ogw.is-theater .ogw-player { border-radius: 0; max-height: calc(100vh - var(--nav-h, 60px)); width: 100%; aspect-ratio: auto; height: min(56.25vw, calc(100vh - var(--nav-h, 60px))); }
        .ogw-player iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
        .ogw-info { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px; }
        .ogw-controls { display: flex; flex-wrap: wrap; gap: 8px; }
        .ogw-controls button:not(:disabled):hover, .ogw-controls a:hover { background: rgba(255,255,255,.14) !important; }
        .ogw-about { display: flex; flex-direction: column; gap: 16px; padding: 20px; border-radius: 14px; background: ${PANEL}; }
        .ogw-series { display: flex; align-items: center; gap: 14px; padding: 0; border: 0; background: none; color: ${TEXT}; font: inherit; cursor: pointer; align-self: flex-start; }
        .ogw-series > span:first-child { width: 48px; aspect-ratio: 2 / 3; border-radius: 6px; flex: none; transition: box-shadow .2s; }
        .ogw-series:hover > span:first-child { box-shadow: 0 0 0 2px ${GOLD}; }
        .ogw-next { position: absolute; right: 16px; bottom: 16px; display: flex; gap: 14px; align-items: center; max-width: min(460px, calc(100% - 32px)); padding: 14px; border-radius: 14px;
          background: rgba(11,11,11,.9); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,.12); animation: rs-in .3s ease-out; }
        .ogw-next-pic { width: 128px; aspect-ratio: 16 / 9; border-radius: 8px; background-size: cover; background-position: center; flex: none; }
        .ogw-ring { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; }
        @media (max-width: 560px) { .ogw-next-pic { display: none; } }
        .ogw-queue { position: sticky; top: calc(var(--nav-h, 60px) + 16px); display: flex; flex-direction: column; max-height: calc(100vh - var(--nav-h, 60px) - 32px); border-radius: 14px; background: ${PANEL}; padding: 14px; box-sizing: border-box; }
        .ogw.is-theater .ogw-queue, .ogw-grid > .ogw-queue:only-child { position: static; max-height: none; }
        @media (max-width: 1080px) { .ogw-queue { position: static; max-height: none; } }
        .ogw-queue-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 4px 4px 12px; }
        .ogw-switch { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: ${DIM}; cursor: pointer; user-select: none; }
        .ogw-switch input { position: absolute; opacity: 0; width: 1px; height: 1px; }
        .ogw-switch span { width: 34px; height: 20px; border-radius: 999px; background: rgba(255,255,255,.18); position: relative; transition: background .2s; }
        .ogw-switch span::after { content: ''; position: absolute; top: 3px; left: 3px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform .2s; }
        .ogw-switch input:checked + span { background: ${GOLD}; }
        .ogw-switch input:checked + span::after { transform: translateX(14px); background: #111; }
        .ogw-switch input:focus-visible + span { outline: 2px solid ${GOLD}; outline-offset: 2px; }
        .ogw-list { list-style: none; margin: 0; padding: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
        .ogw-item { width: 100%; display: grid; grid-template-columns: 136px minmax(0, 1fr); gap: 12px; align-items: center; padding: 6px; border: 0; border-radius: 10px; background: none; color: ${TEXT}; font: inherit; text-align: left; cursor: pointer; }
        .ogw-item:hover { background: rgba(255,255,255,.06); }
        .ogw-item[aria-current="true"] { background: rgba(245,197,66,.12); box-shadow: inset 0 0 0 1px rgba(245,197,66,.45); }
        .ogw-item strong { font-size: 14px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
        .ogw-item span span { font-size: 12.5px; color: ${DIM}; }
        .ogw-thumb { position: relative; aspect-ratio: 16 / 9; border-radius: 8px; background-size: cover; background-position: center; }
        .ogw-eq { position: absolute; inset: 0; display: flex; align-items: flex-end; justify-content: center; gap: 3px; padding-bottom: 10px; background: rgba(0,0,0,.45); border-radius: inherit; }
        .ogw-eq i { width: 4px; background: ${GOLD}; border-radius: 2px; animation: ogw-eq 1s ease-in-out infinite; }
        .ogw-eq i:nth-child(2) { animation-delay: -.3s; } .ogw-eq i:nth-child(3) { animation-delay: -.6s; }
        @keyframes ogw-eq { 0%, 100% { height: 8px; } 50% { height: 22px; } }
        @media (max-width: 640px) { .ogw-hide-sm { display: none; } }
        @media (prefers-reduced-motion: reduce) { .ogw-eq i { animation: none; height: 14px; } }
      `}</style>
    </div>
  );
}
