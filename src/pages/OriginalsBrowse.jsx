import React, { useEffect, useMemo, useState } from 'react';
import { Poster, ORIGINALS_STYLE, ogCopy, NIGHT, TEXT, DIM, GOLD, DISPLAY } from './OriginalsHome';
import { fill } from '../lib/ogWords';

// /series and /comics on Rupok Originals: the whole catalogue as a poster
// wall, narrowed as the reader chooses — series by genre and status, comics by
// series and by free or paid — and sorted. The choices live in the address
// (?genre=…&status=…), so a narrowed wall can be shared or reloaded.

const readQuery = () => {
  try { return Object.fromEntries(new URLSearchParams(window.location.search)); } catch { return {}; }
};

export default function OriginalsBrowse({ lang, base, mode, t, num, user, series = [], comics = [] }) {
  const c = ogCopy(t, lang);
  const isComics = mode === 'comics';
  const [f, setF] = useState(readQuery);
  useEffect(() => { setF(readQuery()); }, [mode]);

  const set = (k, v) => {
    const next = { ...f, [k]: v };
    Object.keys(next).forEach(key => { if (!next[key] || next[key] === 'all') delete next[key]; });
    setF(next);
    const qs = new URLSearchParams(next).toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  };
  const clear = () => { setF({}); window.history.replaceState(null, '', window.location.pathname); };

  const genres = useMemo(() => [...new Set(series.map(s => s.genre).filter(Boolean))], [series]);
  const withComics = series.filter(s => comics.some(x => x.seriesKey === s.k));

  const items = useMemo(() => {
    if (isComics) {
      let list = comics.filter(x => (!f.series || x.seriesKey === f.series) && (!f.access || (f.access === 'free' ? !x.paid : x.paid)));
      if (f.sort === 'newest') list = [...list].sort((a, b) => (b.issueNumber || 0) - (a.issueNumber || 0) || a.i - b.i);
      return list;
    }
    let list = series.filter(s => (!f.genre || s.genre === f.genre) && (!f.status || (f.status === 'prod' ? s.prod : !s.prod)));
    if (f.sort === 'az') list = [...list].sort((a, b) => String(a.title).localeCompare(String(b.title), lang === 'bn' ? 'bn' : 'en'));
    return list;
  }, [isComics, comics, series, f, lang]);

  const active = Object.keys(f).filter(k => k !== 'sort').length > 0;
  const ctx = { user, t, lang, base };

  const chip = (on, onClick, label, key) => (
    <button key={key} type="button" onClick={onClick} aria-pressed={on} className={`ogb-chip${on ? ' is-on' : ''}`}>{label}</button>
  );
  const group = (label, children) => (
    <div className="ogb-group" role="group" aria-label={label}>
      <span className="ogb-label">{label}</span>
      <div className="ogb-chips">{children}</div>
    </div>
  );

  return (
    <div style={{ background: NIGHT, color: TEXT, minHeight: '70vh', paddingBottom: 'clamp(48px, 6vw, 80px)' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: 'clamp(32px, 5vw, 64px) clamp(16px, 2.4vw, 32px) 0' }}>
        <nav style={{ display: 'flex', gap: 8, marginBottom: 24 }} aria-label={lang === 'bn' ? 'ক্যাটালগ' : 'Catalogue'}>
          <a href={`${base}/series`} aria-current={!isComics ? 'page' : undefined} className={`ogb-chip ogb-big${!isComics ? ' is-on' : ''}`}>{t.nav?.[2] || 'Series'}</a>
          <a href={`${base}/comics`} aria-current={isComics ? 'page' : undefined} className={`ogb-chip ogb-big${isComics ? ' is-on' : ''}`}>{t.nav?.[3] || 'Comics'}</a>
        </nav>

        <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px 32px', marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(40px, 5.5vw, 76px)', lineHeight: .95, letterSpacing: '-.045em' }}>
            {isComics ? t.h1Comics : t.h1Series}
          </h1>
          <p style={{ margin: 0, maxWidth: 560, color: DIM, fontSize: 16.5, lineHeight: 1.6 }}>{isComics ? t.bodyComics : t.bodySeries}</p>
        </header>

        {/* The filters */}
        <div className="ogb-bar">
          {isComics ? (
            <>
              {withComics.length > 1 && group(c.series, [
                chip(!f.series, () => set('series', ''), c.all, 'all'),
                ...withComics.map(s => chip(f.series === s.k, () => set('series', s.k), s.title, s.k))
              ])}
              {group(c.filterAccess, [
                chip(!f.access, () => set('access', ''), c.all, 'all'),
                chip(f.access === 'free', () => set('access', 'free'), c.free, 'free'),
                chip(f.access === 'paid', () => set('access', 'paid'), c.paid, 'paid')
              ])}
            </>
          ) : (
            <>
              {genres.length > 1 && group(c.filterGenre, [
                chip(!f.genre, () => set('genre', ''), c.all, 'all'),
                ...genres.map(g => chip(f.genre === g, () => set('genre', g), g, g))
              ])}
              {group(c.filterStatus, [
                chip(!f.status, () => set('status', ''), c.all, 'all'),
                chip(f.status === 'prod', () => set('status', 'prod'), c.inProduction, 'prod'),
                chip(f.status === 'dev', () => set('status', 'dev'), c.inDevelopment, 'dev')
              ])}
            </>
          )}
          <label className="ogb-group ogb-sort">
            <span className="ogb-label">{c.sort}</span>
            <select value={f.sort || ''} onChange={e => set('sort', e.target.value)}>
              {isComics
                ? [['', c.sortIssue], ['newest', c.sortNewest]].map(([v, l]) => <option key={v} value={v}>{l}</option>)
                : [['', c.sortFeatured], ['az', c.sortAZ]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '4px 0 20px', minHeight: 28 }}>
          <span aria-live="polite" style={{ color: DIM, fontSize: 14 }}>{fill(items.length === 1 ? c.resultsOne : c.results, { n: num ? num(items.length, lang) : items.length })}</span>
          {active && <button type="button" onClick={clear} className="ogb-clear">{c.clear}</button>}
        </div>

        {items.length === 0 ? (
          <div style={{ padding: '56px 0', textAlign: 'center', color: DIM, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 17 }}>{c.noMatch}</span>
            <button type="button" onClick={clear} className="ogb-chip is-on">{c.clear}</button>
          </div>
        ) : (
          <div className="ogb-wall">
            {isComics
              ? items.map(x => (
                <Poster key={x.k} item={x} label={x.title} sub={x.sub || x.issue}
                  badge={x.paid ? (x.locked ? x.price : null) : c.free} locked={x.locked} />
              ))
              : items.map(s => <Poster key={s.k} item={s} label={s.title} sub={s.sub} badge={s.status} locked={s.locked} seriesKey={s.k} ctx={ctx} />)}
          </div>
        )}
      </div>
      <style>{`
        ${ORIGINALS_STYLE}
        .ogb-bar { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 16px 28px; padding: 16px 0; border-top: 1px solid rgba(255,255,255,.08); border-bottom: 1px solid rgba(255,255,255,.08); }
        .ogb-group { display: flex; flex-direction: column; gap: 8px; }
        .ogb-label { font-size: 11.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: ${DIM}; }
        .ogb-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .ogb-chip {
          padding: 7px 14px; border-radius: 999px; font: inherit; font-size: 13.5px; font-weight: 700; cursor: pointer; text-decoration: none;
          border: 1px solid rgba(255,255,255,.18); background: transparent; color: ${TEXT}; transition: background .15s, border-color .15s, color .15s;
        }
        .ogb-chip:hover { border-color: rgba(255,255,255,.4); }
        .ogb-chip.is-on { background: ${TEXT}; color: #111; border-color: ${TEXT}; }
        .ogb-big { padding: 8px 16px; font-size: 14px; }
        .ogb-sort { margin-left: auto; }
        .ogb-sort select {
          appearance: none; -webkit-appearance: none; padding: 8px 34px 8px 14px; border-radius: 10px; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer;
          border: 1px solid rgba(255,255,255,.2); color: ${TEXT};
          background: rgba(255,255,255,.05) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23f5c542' stroke-width='3'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center;
        }
        .ogb-sort select option { background: #161514; color: ${TEXT}; }
        .ogb-clear { border: 0; background: none; color: ${GOLD}; font: inherit; font-weight: 700; font-size: 14px; cursor: pointer; padding: 4px 0; }
        .ogb-clear:hover { text-decoration: underline; }
        .ogb-wall { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(46%, 180px), 1fr)); gap: clamp(16px, 2vw, 28px); animation: rs-in .3s ease-out; }
        @media (max-width: 640px) { .ogb-sort { margin-left: 0; } }
      `}</style>
    </div>
  );
}
