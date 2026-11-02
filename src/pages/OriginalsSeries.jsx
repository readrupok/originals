import React, { useEffect, useState } from 'react';
import { BookOpen, Lock, Play } from 'lucide-react';
import MyListButton from '../components/MyListButton';
import ShareBar from '../components/ShareBar';
import { ytId, ytThumb, watchedOf } from '../lib/originals';
import { fill } from '../lib/ogWords';
import { ogCopy, watchHref, Poster, Rail, ORIGINALS_STYLE, NIGHT, PANEL, TEXT, DIM, GOLD, DISPLAY } from './OriginalsHome';

/**
 * A series on Rupok Originals: its picture across the whole screen with the
 * title over it, then three tabs — the episodes (with their pictures, the
 * one the viewer reached marked), the comic issues, and what the series is —
 * and other series like it. The tab is in the address (#episodes, #comics,
 * #about), so it survives a reload.
 */
export default function OriginalsSeries({ lang, base, t, num, user, series = [], comics = [], sid, openPay }) {
  const c = ogCopy(t, lang);
  const s = series.find(x => x.k === sid);
  const readTab = () => {
    const h = (typeof window !== 'undefined' ? window.location.hash : '').slice(1);
    return ['episodes', 'comics', 'about'].includes(h) ? h : 'episodes';
  };
  const [tab, setTab] = useState(readTab);

  useEffect(() => { setTab(readTab()); if (s?.ac) document.documentElement.style.setProperty('--acc', s.ac); }, [sid]);
  const choose = k => {
    setTab(k);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${k}`);
  };

  if (!s) return null;
  const issues = comics.filter(x => x.seriesKey === s.k);
  const liveIdx = s.eps.findIndex(e => e.live && ytId(e.url));
  const seen = watchedOf(s.k);
  const resumeIdx = seen && s.eps[seen.i]?.live ? seen.i : liveIdx;
  const like = [...series.filter(x => x.k !== s.k && x.genre === s.genre), ...series.filter(x => x.k !== s.k && x.genre !== s.genre)].slice(0, 12);
  const ctx = { user, t, lang, base };
  const tabs = [['episodes', c.tabEpisodes, s.eps.length], ['comics', c.tabComics, issues.length], ['about', c.tabAbout, null]].filter(([, , n]) => n !== 0);

  return (
    <div style={{ background: NIGHT, color: TEXT, paddingBottom: 'clamp(48px, 6vw, 80px)' }}>
      {/* The picture, the title over it */}
      <header className="ogs-hero">
        <div aria-hidden="true" className="ogs-pic" style={{ background: `${s.ac} url(${s.hasBanner ? s.banner : s.poster}) center 25%/cover`, filter: s.hasBanner ? 'none' : 'blur(3px) saturate(1.1)', transform: s.hasBanner ? 'none' : 'scale(1.08)' }} />
        <div aria-hidden="true" className="ogs-shade" />
        <div className="ogs-head">
          <img src={s.poster} alt="" className="ogs-poster" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, maxWidth: 720 }}>
            <a href={`${base}/series`} style={{ color: GOLD, fontWeight: 800, fontSize: 12.5, letterSpacing: '.18em', textTransform: 'uppercase', textDecoration: 'none' }}>
              {c.kicker} · {s.status}
            </a>
            <h1 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(44px, 6.5vw, 96px)', lineHeight: .92, letterSpacing: '-.045em' }}>{s.title}</h1>
            {s.sub && <span style={{ fontSize: 'clamp(17px, 1.5vw, 21px)', fontWeight: 600 }}>{s.sub}</span>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 13, color: DIM }}>
              {[s.genre, t.fmt ? t.fmt(s.epCount, num(3, lang)) : null, s.access].filter(Boolean).map(x => (
                <span key={x} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,.18)' }}>{x}</span>
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
              {resumeIdx >= 0 && (
                <a href={watchHref(base, s.k, resumeIdx)} className="ogs-btn ogs-primary">
                  <Play size={18} fill="currentColor" /> {seen ? `${c.resume} · ${fill(c.episode, { n: s.eps[resumeIdx].n })}` : c.watch}
                </a>
              )}
              {s.comicHref && <a href={s.comicHref} data-pow="" className="ogs-btn"><BookOpen size={18} /> {c.read}</a>}
              <MyListButton seriesKey={s.k} user={user} t={t} lang={lang} base={base} />
              {s.locked && (
                <button type="button" onClick={() => openPay?.(s.k, 'series')} className="ogs-btn" style={{ borderColor: GOLD, color: GOLD }}>
                  <Lock size={16} /> {t.unlockPass} · {s.passPrice}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Episodes · Comics · About */}
      <div className="ogs-wrap">
        <div role="tablist" aria-label={s.title} className="ogs-tabs">
          {tabs.map(([k, label, n]) => (
            <button key={k} type="button" role="tab" id={`ogs-tab-${k}`} aria-selected={tab === k} aria-controls={`ogs-panel-${k}`} onClick={() => choose(k)} className="ogs-tab">
              {label}{n ? <span>{num(n, lang)}</span> : null}
            </button>
          ))}
        </div>

        {tab === 'episodes' && (
          <div role="tabpanel" id="ogs-panel-episodes" aria-labelledby="ogs-tab-episodes" className="ogs-eps">
            {s.eps.map((e, i) => {
              const ok = e.live && ytId(e.url);
              const Card = ok ? 'a' : 'div';
              return (
                <Card key={e.n} {...(ok ? { href: watchHref(base, s.k, i) } : {})} className={`ogs-ep${ok ? '' : ' is-soon'}${seen?.i === i ? ' is-seen' : ''}`}>
                  <span className="ogs-thumb" style={ok ? { backgroundImage: `url(${ytThumb(e.url)})` } : { background: `linear-gradient(135deg, ${s.ac}88, ${PANEL})` }}>
                    {ok ? <span className="ogs-playbtn"><Play size={18} fill="currentColor" /></span> : <span className="ogs-soon">{c.comingSoon}</span>}
                    <span className="ogs-num">{e.n}</span>
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <strong>{e.t}</strong>
                    <span style={{ color: DIM, fontSize: 13 }}>{fill(c.episode, { n: e.n })} · {fill(c.perEpisode, { n: num(3, lang) })}</span>
                  </span>
                </Card>
              );
            })}
          </div>
        )}

        {tab === 'comics' && (
          <div role="tabpanel" id="ogs-panel-comics" aria-labelledby="ogs-tab-comics" className="ogs-grid">
            {issues.map(x => (
              <Poster key={x.k} item={x} label={x.issue} sub={x.sub} badge={x.paid ? (x.locked ? x.price : null) : c.free} locked={x.locked} />
            ))}
          </div>
        )}

        {tab === 'about' && (
          <div role="tabpanel" id="ogs-panel-about" aria-labelledby="ogs-tab-about" className="ogs-about">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {s.log && <p style={{ margin: 0, fontSize: 18, lineHeight: 1.7, color: '#e7e5e4' }}>{s.log}</p>}
              {s.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {s.tags.map(g => <span key={g} style={{ padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,.07)', fontSize: 13.5, color: '#d6d3d1' }}>{g}</span>)}
                </div>
              )}
              <ShareBar path={`/series/${s.k}`} title={s.title} t={t} />
            </div>
            <dl className="ogs-facts">
              {[[t.eps, s.epCount], [t.perEp, num(3, lang)], [t.total, s.runtime], [c.tabComics, num(issues.length, lang)], [c.filterStatus, s.status], [c.filterAccess, s.access]]
                .filter(([l]) => l).map(([l, v]) => (
                  <div key={l}><dt>{l}</dt><dd>{v}</dd></div>
                ))}
            </dl>
          </div>
        )}
      </div>

      {like.length > 0 && (
        <Rail title={c.moreLike}>
          {like.map(x => <Poster key={x.k} item={x} label={x.title} sub={x.sub} badge={x.status} locked={x.locked} seriesKey={x.k} ctx={ctx} />)}
        </Rail>
      )}

      <style>{`
        ${ORIGINALS_STYLE}
        .ogs-hero { position: relative; min-height: min(78vh, 720px); padding-top: var(--nav-h, 60px); box-sizing: border-box; display: flex; align-items: flex-end; overflow: hidden; }
        .ogs-pic { position: absolute; inset: 0; animation: rs-in .8s ease-out; }
        .ogs-shade { position: absolute; inset: 0; background: linear-gradient(90deg, ${NIGHT} 0%, ${NIGHT}d9 32%, ${NIGHT}33 72%, transparent), linear-gradient(0deg, ${NIGHT} 0%, transparent 50%); }
        .ogs-head { position: relative; width: 100%; max-width: 1440px; margin: 0 auto; padding: clamp(32px, 5vw, 64px) clamp(16px, 2.4vw, 32px); box-sizing: border-box; display: flex; align-items: flex-end; gap: clamp(20px, 3vw, 40px); }
        .ogs-poster { width: clamp(120px, 14vw, 210px); aspect-ratio: 2 / 3; object-fit: cover; border-radius: 12px; box-shadow: 0 0 0 1px rgba(255,255,255,.12), 0 30px 60px -20px #000; flex: none; }
        @media (max-width: 720px) { .ogs-poster { display: none; } }
        .ogs-btn { display: inline-flex; align-items: center; gap: 8px; padding: 13px 20px; border-radius: 10px; font: inherit; font-weight: 700; font-size: 15px; cursor: pointer; text-decoration: none;
          border: 1px solid rgba(255,255,255,.28); background: rgba(255,255,255,.08); color: ${TEXT}; }
        .ogs-btn:hover { background: rgba(255,255,255,.16); }
        .ogs-primary { background: ${TEXT}; color: #111; border-color: ${TEXT}; font-weight: 800; }
        .ogs-primary:hover { background: #fff; }
        .ogs-wrap { max-width: 1440px; margin: 0 auto; padding: 8px clamp(16px, 2.4vw, 32px) 0; }
        .ogs-tabs { display: flex; gap: 4px; border-bottom: 1px solid rgba(255,255,255,.1); margin-bottom: 24px; overflow-x: auto; scrollbar-width: none; }
        .ogs-tab { position: relative; padding: 14px 18px; border: 0; background: none; color: ${DIM}; font: inherit; font-family: ${DISPLAY}; font-weight: 700; font-size: 16px; cursor: pointer; white-space: nowrap; }
        .ogs-tab span { margin-left: 8px; padding: 1px 8px; border-radius: 999px; background: rgba(255,255,255,.08); font-size: 12px; font-family: 'DM Sans', sans-serif; }
        .ogs-tab:hover { color: ${TEXT}; }
        .ogs-tab[aria-selected="true"] { color: ${TEXT}; }
        .ogs-tab[aria-selected="true"]::after { content: ''; position: absolute; left: 12px; right: 12px; bottom: -1px; height: 3px; border-radius: 3px 3px 0 0; background: ${GOLD}; }
        .ogs-eps { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); gap: 20px; }
        .ogs-ep { display: flex; flex-direction: column; gap: 10px; color: ${TEXT}; text-decoration: none; }
        .ogs-ep strong { font-size: 15.5px; }
        .ogs-thumb { position: relative; aspect-ratio: 16 / 9; border-radius: 12px; overflow: hidden; background-size: cover; background-position: center; display: grid; place-items: center; transition: box-shadow .2s, transform .2s; }
        a.ogs-ep:hover .ogs-thumb { box-shadow: 0 0 0 2px ${GOLD}, 0 18px 40px -16px #000; transform: translateY(-2px); }
        .ogs-ep.is-soon { opacity: .6; }
        .ogs-ep.is-seen .ogs-thumb::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: ${GOLD}; }
        .ogs-playbtn { width: 46px; height: 46px; border-radius: 999px; display: grid; place-items: center; background: rgba(255,255,255,.92); color: #111; opacity: 0; transform: scale(.85); transition: opacity .2s, transform .2s; }
        a.ogs-ep:hover .ogs-playbtn, a.ogs-ep:focus-visible .ogs-playbtn { opacity: 1; transform: none; }
        .ogs-soon { font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: ${TEXT}; }
        .ogs-num { position: absolute; left: 10px; bottom: 6px; font-family: ${DISPLAY}; font-weight: 800; font-size: 34px; line-height: 1; color: #fff; text-shadow: 0 2px 12px rgba(0,0,0,.8); }
        .ogs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(46%, 180px), 1fr)); gap: clamp(16px, 2vw, 28px); }
        .ogs-about { display: grid; grid-template-columns: minmax(0, 2fr) minmax(240px, 1fr); gap: clamp(24px, 4vw, 56px); }
        @media (max-width: 820px) { .ogs-about { grid-template-columns: 1fr; } }
        .ogs-facts { margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: rgba(255,255,255,.08); border-radius: 14px; overflow: hidden; align-self: start; }
        .ogs-facts div { background: ${PANEL}; padding: 14px 16px; }
        .ogs-facts dt { font-size: 12px; color: ${DIM}; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
        .ogs-facts dd { margin: 4px 0 0; font-family: ${DISPLAY}; font-weight: 800; font-size: 19px; }
        @media (prefers-reduced-motion: reduce) { .ogs-pic { animation: none; } }
      `}</style>
    </div>
  );
}

