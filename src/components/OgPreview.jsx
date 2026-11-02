import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Lock, Play, X } from 'lucide-react';
import MyListButton from './MyListButton';
import { PREVIEW_EVENT, ytId, ytThumb, recordWatch } from '../lib/originals';
import { ogCopy, watchHref, NIGHT, PANEL, TEXT, DIM, GOLD, DISPLAY } from '../pages/OriginalsHome';
import { fill } from '../lib/ogWords';

/**
 * The quick view of a series on Rupok Originals: opened by a poster's "More
 * info" (lib/originals openPreview), over whatever page the reader is on. The
 * wide picture plays the series' episode in place; below it, what the series
 * is, its episodes and its comics, the My List button, and the way to the
 * series page. Escape or the backdrop closes it, and focus goes back to the
 * button that opened it.
 */
export default function OgPreview({ series = [], comics = [], user, t, lang, base, num, openPay }) {
  const [key, setKey] = useState(null);
  const [playing, setPlaying] = useState(false);
  const opener = useRef(null);
  const panel = useRef(null);
  const c = ogCopy(t, lang);

  const close = useCallback(() => {
    setKey(null);
    setPlaying(false);
    const back = opener.current;
    if (back && document.contains(back)) setTimeout(() => back.focus?.(), 0);
  }, []);

  useEffect(() => {
    const onOpen = e => { opener.current = document.activeElement; setPlaying(false); setKey(e.detail?.key || null); };
    window.addEventListener(PREVIEW_EVENT, onOpen);
    return () => window.removeEventListener(PREVIEW_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!key) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const id = setTimeout(() => panel.current?.focus({ preventScroll: true }), 0);
    const onKey = e => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; clearTimeout(id); window.removeEventListener('keydown', onKey); };
  }, [key, close]);

  // Leaving the page (a link inside was followed) closes it
  useEffect(() => {
    if (!key) return undefined;
    const onNav = () => setKey(null);
    window.addEventListener('popstate', onNav);
    return () => window.removeEventListener('popstate', onNav);
  }, [key]);

  const s = series.find(x => x.k === key);
  if (!s) return null;

  const live = s.eps.map((e, i) => ({ e, i })).filter(({ e }) => e.live && ytId(e.url));
  const first = live[0];
  const issues = comics.filter(x => x.seriesKey === s.k);
  const more = series.filter(x => x.k !== s.k && (x.genre === s.genre || x.prod === s.prod)).slice(0, 4);
  const go = () => setKey(null);

  const play = () => { if (first) { recordWatch(s.k, first.i); setPlaying(true); } };

  return (
    <div className="ogp-root">
      <div className="ogp-scrim" onClick={close} aria-hidden="true" />
      <div ref={panel} className="ogp-panel" role="dialog" aria-modal="true" aria-label={s.title} tabIndex={-1}>
        <button type="button" className="ogp-close" onClick={close} aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}><X size={20} /></button>

        {/* The picture, or the episode playing in its place */}
        <div className="ogp-stage">
          {playing && first ? (
            <iframe
              title={first.e.t}
              src={`https://www.youtube-nocookie.com/embed/${ytId(first.e.url)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen
            />
          ) : (
            <>
              <div className="ogp-pic" style={{ background: `${s.ac} url(${s.hasBanner ? s.banner : s.poster}) center 25%/cover`, filter: s.hasBanner ? 'none' : 'blur(1px)' }} />
              <div className="ogp-shade" />
              <div className="ogp-head">
                <span style={{ color: GOLD, fontWeight: 800, fontSize: 12, letterSpacing: '.18em', textTransform: 'uppercase' }}>{c.kicker} · {s.status}</span>
                <h2 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: .95, letterSpacing: '-.04em' }}>{s.title}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
                  {first ? (
                    <button type="button" onClick={play} className="ogp-btn ogp-primary"><Play size={18} fill="currentColor" /> {c.playNow}</button>
                  ) : (
                    <a href={s.href} onClick={go} className="ogp-btn ogp-primary">{c.details} <ArrowRight size={17} /></a>
                  )}
                  {s.comicHref && <a href={s.comicHref} onClick={go} data-pow="" className="ogp-btn"><BookOpen size={18} /> {c.read}</a>}
                  <MyListButton seriesKey={s.k} user={user} t={t} lang={lang} base={base} />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="ogp-body">
          <div className="ogp-cols">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 13, color: DIM }}>
                {[s.genre, t.fmt ? t.fmt(s.epCount, num(3, lang)) : null, s.access].filter(Boolean).map(x => (
                  <span key={x} style={{ padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,.16)' }}>{x}</span>
                ))}
              </div>
              {s.sub && <strong style={{ fontSize: 17 }}>{s.sub}</strong>}
              {s.log && <p style={{ margin: 0, color: '#d6d3d1', lineHeight: 1.65 }}>{s.log}</p>}
              {s.locked && (
                <button type="button" onClick={() => { go(); openPay?.(s.k, 'series'); }} className="ogp-btn" style={{ alignSelf: 'flex-start', borderColor: GOLD, color: GOLD }}>
                  <Lock size={16} /> {t.unlockPass} · {s.passPrice}
                </button>
              )}
            </div>
            {s.tags?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignContent: 'flex-start' }}>
                {s.tags.map(g => <span key={g} style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,.07)', fontSize: 12.5, color: DIM }}>{g}</span>)}
              </div>
            )}
          </div>

          {s.eps.length > 0 && (
            <section>
              <h3 className="ogp-h">{c.tabEpisodes} <span>{num(s.eps.length, lang)}</span></h3>
              <ol className="ogp-eps">
                {s.eps.map((e, i) => {
                  const ok = e.live && ytId(e.url);
                  const Row = ok ? 'a' : 'div';
                  return (
                    <li key={e.n}>
                      <Row {...(ok ? { href: watchHref(base, s.k, i), onClick: go } : {})} className={`ogp-ep${ok ? '' : ' is-soon'}`}>
                        <span className="ogp-n">{e.n}</span>
                        <span className="ogp-thumb" style={ok ? { backgroundImage: `url(${ytThumb(e.url, 'mqdefault')})` } : { background: `${s.ac}55` }}>
                          {ok && <Play size={16} fill="currentColor" />}
                        </span>
                        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                          <strong>{e.t}</strong>
                          <span style={{ fontSize: 13, color: DIM }}>{ok ? fill(c.perEpisode, { n: num(3, lang) }) : c.comingSoon}</span>
                        </span>
                      </Row>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {issues.length > 0 && (
            <section>
              <h3 className="ogp-h">{c.tabComics} <span>{num(issues.length, lang)}</span></h3>
              <div className="ogp-issues">
                {issues.map(x => (
                  <a key={x.k} href={x.href} onClick={go} className="ogp-issue">
                    <span style={{ background: `${x.ac || PANEL} url(${x.poster}) center/cover` }}>
                      {x.locked && <i><Lock size={12} strokeWidth={2.6} /></i>}
                    </span>
                    <strong>{x.issue}</strong>
                    <em>{x.sub}</em>
                  </a>
                ))}
              </div>
            </section>
          )}

          {more.length > 0 && (
            <section>
              <h3 className="ogp-h">{c.moreLike}</h3>
              <div className="ogp-issues">
                {more.map(x => (
                  <button key={x.k} type="button" onClick={() => { setPlaying(false); setKey(x.k); panel.current?.scrollTo({ top: 0 }); }} className="ogp-issue">
                    <span style={{ background: `${x.ac || PANEL} url(${x.poster}) center/cover` }} />
                    <strong>{x.title}</strong>
                    <em>{x.status}</em>
                  </button>
                ))}
              </div>
            </section>
          )}

          <a href={s.href} onClick={go} className="ogp-more">{c.openSeries} <ArrowRight size={16} /></a>
        </div>
      </div>

      <style>{`
        .ogp-root { position: fixed; inset: 0; z-index: 100000; display: flex; justify-content: center; align-items: flex-start; overflow-y: auto; padding: clamp(0px, 4vh, 48px) 12px; }
        .ogp-scrim { position: fixed; inset: 0; background: rgba(0,0,0,.72); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); animation: ogp-fade .2s ease-out; }
        .ogp-panel {
          position: relative; width: min(900px, 100%); background: ${NIGHT}; color: ${TEXT}; border-radius: 16px; overflow: hidden; outline: none;
          box-shadow: 0 0 0 1px rgba(255,255,255,.08), 0 40px 120px -30px rgba(0,0,0,.9); animation: ogp-in .28s cubic-bezier(.2,.8,.2,1);
        }
        .ogp-close { position: absolute; top: 14px; right: 14px; z-index: 3; width: 40px; height: 40px; border-radius: 999px; display: grid; place-items: center; cursor: pointer;
          border: 1px solid rgba(255,255,255,.3); background: rgba(0,0,0,.55); color: ${TEXT}; }
        .ogp-close:hover { background: ${TEXT}; color: #111; }
        .ogp-stage { position: relative; aspect-ratio: 16 / 9; max-height: 62vh; width: 100%; background: #000; }
        .ogp-stage iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
        .ogp-pic { position: absolute; inset: 0; }
        .ogp-shade { position: absolute; inset: 0; background: linear-gradient(0deg, ${NIGHT} 0%, ${NIGHT}aa 28%, transparent 70%); }
        .ogp-head { position: absolute; left: 0; right: 0; bottom: 0; padding: clamp(18px, 3vw, 36px); display: flex; flex-direction: column; gap: 8px; }
        .ogp-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 10px; font: inherit; font-weight: 700; font-size: 15px; cursor: pointer; text-decoration: none;
          border: 1px solid rgba(255,255,255,.28); background: rgba(255,255,255,.1); color: ${TEXT}; }
        .ogp-btn:hover { background: rgba(255,255,255,.18); }
        .ogp-primary { background: ${TEXT}; color: #111; border-color: ${TEXT}; font-weight: 800; }
        .ogp-primary:hover { background: #fff; }
        .ogp-body { padding: clamp(18px, 3vw, 36px); display: flex; flex-direction: column; gap: 28px; }
        .ogp-cols { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 24px; }
        @media (max-width: 640px) { .ogp-cols { grid-template-columns: 1fr; } }
        .ogp-h { margin: 0 0 12px; font-family: ${DISPLAY}; font-size: 20px; font-weight: 800; letter-spacing: -.01em; }
        .ogp-h span { color: ${DIM}; font-weight: 600; font-size: 15px; margin-left: 6px; }
        .ogp-eps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
        .ogp-ep { display: grid; grid-template-columns: 32px 128px minmax(0, 1fr); align-items: center; gap: 14px; padding: 12px 10px; border-radius: 10px; color: ${TEXT}; text-decoration: none; border-top: 1px solid rgba(255,255,255,.07); }
        .ogp-eps li:first-child .ogp-ep { border-top: 0; }
        a.ogp-ep:hover { background: ${PANEL}; }
        .ogp-ep.is-soon { opacity: .55; }
        .ogp-n { font-family: ${DISPLAY}; font-weight: 800; font-size: 20px; color: ${DIM}; text-align: center; }
        .ogp-thumb { aspect-ratio: 16 / 9; border-radius: 8px; background-size: cover; background-position: center; display: grid; place-items: center; color: #fff; }
        .ogp-thumb svg { opacity: 0; transition: opacity .2s; filter: drop-shadow(0 1px 6px rgba(0,0,0,.8)); }
        a.ogp-ep:hover .ogp-thumb svg { opacity: 1; }
        .ogp-ep strong { font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        @media (max-width: 520px) { .ogp-ep { grid-template-columns: 26px 96px minmax(0, 1fr); gap: 10px; } }
        .ogp-issues { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 14px; }
        .ogp-issue { display: flex; flex-direction: column; gap: 6px; color: ${TEXT}; text-decoration: none; background: none; border: 0; padding: 0; font: inherit; text-align: left; cursor: pointer; }
        .ogp-issue > span { position: relative; aspect-ratio: 2 / 3; border-radius: 10px; transition: box-shadow .2s, transform .2s; }
        .ogp-issue:hover > span { box-shadow: 0 0 0 2px ${GOLD}; transform: translateY(-2px); }
        .ogp-issue i { position: absolute; top: 6px; right: 6px; width: 22px; height: 22px; border-radius: 999px; display: grid; place-items: center; background: ${GOLD}; color: #111; }
        .ogp-issue strong { font-size: 14px; }
        .ogp-issue em { font-style: normal; font-size: 12.5px; color: ${DIM}; }
        .ogp-more { align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; color: ${GOLD}; font-weight: 700; text-decoration: none; }
        .ogp-more:hover { text-decoration: underline; }
        @keyframes ogp-in { from { opacity: 0; transform: translateY(16px) scale(.98); } to { opacity: 1; transform: none; } }
        @keyframes ogp-fade { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 640px) { .ogp-root { padding: 0; } .ogp-panel { border-radius: 0; min-height: 100dvh; } }
        @media (prefers-reduced-motion: reduce) { .ogp-panel, .ogp-scrim { animation: none; } }
      `}</style>
    </div>
  );
}
