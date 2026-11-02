import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { ISearch, ISpinner, IArrowRight } from './icons';
import { PlatformArrow } from './BrandLockup';
import { platformLink } from '../lib/sites';
import { SEARCH_EVENT } from '../lib/search';

const EMPTY = { series: [], comics: [], works: [], authors: [] };
const RECENT_KEY = 'rupok-recent-search';

// Which results each site shows as its own, in order. The rest are listed
// after, under "Elsewhere on Rupok", and open on their own platform (↗).
const OWN = {
  main: ['series', 'comics', 'works', 'authors'],
  stories: ['works', 'authors'],
  originals: ['series', 'comics']
};

const readRecent = () => {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').filter(x => typeof x === 'string').slice(0, 5); } catch { return []; }
};
const saveRecent = q => {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...readRecent().filter(x => x !== q)].slice(0, 5))); } catch { /* private window */ }
};

/**
 * Search, as a panel over whatever page the reader is on — on every site, in
 * that site's own colours (the theme tokens in index.css). Opens from the
 * search button in the bar, "/" or Ctrl/⌘ K, or an old /search?q= address
 * (lib/search.js). Both languages are searched at once. Arrow keys move
 * through the results, Enter opens one, Escape closes.
 */
export default function SearchPanel({ lang, base, t, site = 'main', shortcuts = [], disabled = false }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState(EMPTY);
  const [state, setState] = useState('idle');
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState([]);
  const input = useRef(null);
  const list = useRef(null);
  const seq = useRef(0);
  const opener = useRef(null);
  const bn = lang === 'bn';

  const show = useCallback(start => {
    opener.current = document.activeElement;
    setQ(start || '');
    setRecent(readRecent());
    setActive(0);
    setOpen(true);
  }, []);
  const close = useCallback(() => {
    setOpen(false);
    // Focus goes back where it came from
    const back = opener.current;
    if (back && document.contains(back)) setTimeout(() => back.focus?.(), 0);
  }, []);

  // Opened from anywhere: the event, "/" or Ctrl/⌘ K
  useEffect(() => {
    const onEvent = e => { if (!disabled) show(e.detail?.q); };
    const onKey = e => {
      if (disabled) return;
      const typing = /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || '') || e.target?.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); show(); return; }
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); show(); }
    };
    window.addEventListener(SEARCH_EVENT, onEvent);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener(SEARCH_EVENT, onEvent); window.removeEventListener('keydown', onKey); };
  }, [show, disabled]);

  // While open: the page behind is still, and the box has focus
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const id = setTimeout(() => input.current?.focus(), 0);
    return () => { document.body.style.overflow = prev; clearTimeout(id); };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const term = q.trim();
    setActive(0);
    if (term.length < 2) { setResults(EMPTY); setState('idle'); return undefined; }
    setState('loading');
    const mine = ++seq.current;
    const id = setTimeout(async () => {
      const r = await api.search(term);
      if (mine !== seq.current) return;            // a newer keystroke won
      setResults(r.ok ? { ...EMPTY, ...r.data } : EMPTY);
      setState('done');
    }, 220);
    return () => clearTimeout(id);
  }, [q, open]);

  const pick = (row, field) => (bn ? row[`${field}_bn`] || row[`${field}_en`] : row[`${field}_en`] || row[`${field}_bn`]);
  const groupLabel = Object.fromEntries(Array.isArray(t.searchGroups) ? t.searchGroups : []);

  // Every result as a link written the way the pages write it, then sent to
  // its real address — another platform's opens there, in a new tab
  const groups = useMemo(() => {
    const rows = {
      series: results.series.map(s => ({
        key: s.key, path: `${base}/series/${s.key}`, title: pick(s, 'title'), sub: pick(s, 'log'),
        accent: s.accent_color, image: s.poster_url
      })),
      comics: results.comics.map(c => ({
        key: c.key, path: `${base}/comics/${c.key}`,
        title: `${pick(c, 'title')} #${String(c.issue_number).padStart(2, '0')}`, sub: pick(c, 'sub')
      })),
      works: results.works.map(w => ({
        key: w.key, path: `${base}/stories/${w.handle}/${w.key}`, title: w.title,
        sub: [bn ? w.pen_name_bn || w.pen_name_en : w.pen_name_en || w.pen_name_bn, w.summary].filter(Boolean).join(' — ')
      })),
      authors: results.authors.map(a => ({
        key: a.handle, path: `${base}/authors/${a.handle}`,
        title: bn ? a.pen_name_bn || a.pen_name_en || a.handle : a.pen_name_en || a.pen_name_bn || a.handle,
        sub: bn ? a.bio_bn || a.bio_en : a.bio_en || a.bio_bn
      }))
    };
    const own = OWN[site] || OWN.main;
    const order = [...own, ...OWN.main.filter(g => !own.includes(g))];
    return order
      .map(g => ({ g, own: own.includes(g), items: rows[g].map(x => ({ ...x, ...platformLink(x.path) })) }))
      .filter(x => x.items.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, base, site, lang]);

  const flat = groups.flatMap(x => x.items);
  const total = flat.length;
  const term = q.trim();
  // With nothing typed: recent searches, then this site's own sections
  const idleRows = term.length < 2
    ? [...recent.map(r => ({ kind: 'recent', key: `r:${r}`, title: r })), ...shortcuts.map(s => ({ kind: 'jump', key: `j:${s.href}`, ...s }))]
    : [];
  const count = term.length < 2 ? idleRows.length : total;

  const onKeyDown = e => {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!count) return;
      const next = (active + (e.key === 'ArrowDown' ? 1 : -1) + count) % count;
      setActive(next);
      list.current?.querySelector(`[data-row="${next}"]`)?.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (e.key === 'Enter' && e.target === input.current) {
      const row = list.current?.querySelector(`[data-row="${active}"]`);
      if (row) { e.preventDefault(); row.click(); }
      return;
    }
    // Tab stays inside the panel
    if (e.key === 'Tab') {
      const f = [...e.currentTarget.querySelectorAll('input, button, a[href]')];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };

  if (!open) return null;

  const chosen = () => { if (term.length >= 2) saveRecent(term); setOpen(false); };
  let n = -1;
  const rowProps = i => ({
    'data-row': i,
    className: `sp-row${i === active ? ' is-active' : ''}`,
    onMouseMove: () => { if (active !== i) setActive(i); }
  });

  return (
    <div className="sp-root" onKeyDown={onKeyDown}>
      <div className="sp-scrim" onClick={close} aria-hidden="true" />
      <div className="sp-panel" role="dialog" aria-modal="true" aria-label={t.searchH1 || 'Search'}>
        <form role="search" onSubmit={e => e.preventDefault()} className="sp-head">
          <span className="sp-icon" aria-hidden="true">{state === 'loading' ? <ISpinner /> : <ISearch />}</span>
          <input
            ref={input}
            type="search"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchH1 || 'Search'}
            aria-controls="sp-results"
            aria-activedescendant={count ? `sp-row-${active}` : undefined}
            maxLength={80}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="sp-esc" onClick={close} aria-label={bn ? 'বন্ধ করুন' : 'Close'}>
            <kbd>Esc</kbd>
          </button>
        </form>

        <div ref={list} id="sp-results" className="sp-body" role="listbox" aria-label={t.searchH1 || 'Search'}>
          {term.length < 2 && (
            <>
              {recent.length > 0 && <p className="sp-label">{bn ? 'সাম্প্রতিক' : 'Recent'}</p>}
              {recent.map(r => {
                n += 1;
                const i = n;
                return (
                  <button key={`r:${r}`} id={`sp-row-${i}`} type="button" role="option" aria-selected={i === active} {...rowProps(i)} onClick={() => setQ(r)}>
                    <span className="sp-dot" aria-hidden="true"><ISearch /></span>
                    <span className="sp-text"><strong>{r}</strong></span>
                  </button>
                );
              })}
              {shortcuts.length > 0 && <p className="sp-label">{bn ? 'সরাসরি যান' : 'Jump to'}</p>}
              {shortcuts.map(s => {
                n += 1;
                const i = n;
                return (
                  <a key={`j:${s.href}`} id={`sp-row-${i}`} href={s.href} role="option" aria-selected={i === active} {...rowProps(i)} onClick={() => setOpen(false)}>
                    <span className="sp-dot" aria-hidden="true"><IArrowRight /></span>
                    <span className="sp-text"><strong>{s.label}</strong></span>
                  </a>
                );
              })}
              <p className="sp-hint">{t.searchHint}</p>
            </>
          )}

          {term.length >= 2 && state === 'done' && total === 0 && (
            <p className="sp-empty">{(t.searchEmpty || '').replace('{q}', term)}</p>
          )}

          {term.length >= 2 && groups.map(({ g, own, items }, gi) => (
            <div key={g} role="group" aria-label={groupLabel[g] || g}>
              {!own && (gi === 0 || groups[gi - 1].own) && (
                <p className="sp-label sp-elsewhere">{bn ? 'রূপকের অন্য জায়গায়' : 'Elsewhere on Rupok'}</p>
              )}
              <p className="sp-label">{groupLabel[g] || g} <span>{items.length}</span></p>
              {items.map(item => {
                n += 1;
                const i = n;
                return (
                  <a
                    key={item.key} id={`sp-row-${i}`} href={item.href} role="option" aria-selected={i === active}
                    {...(item.site ? { target: '_blank', rel: 'noopener' } : {})}
                    {...rowProps(i)} onClick={chosen}
                  >
                    {item.image
                      ? <img className="sp-thumb" src={item.image} alt="" loading="lazy" />
                      : <span className="sp-dot" aria-hidden="true" style={item.accent ? { background: item.accent, color: '#fff' } : undefined}>{(item.title || '?').charAt(0)}</span>}
                    <span className="sp-text">
                      <strong>{item.title}</strong>
                      {item.sub && <span>{item.sub}</span>}
                    </span>
                    <span className="sp-go" aria-hidden="true">{item.site ? <PlatformArrow size={14} /> : <IArrowRight />}</span>
                  </a>
                );
              })}
            </div>
          ))}
        </div>

        <div className="sp-foot" aria-hidden="true">
          <span><kbd>↑</kbd><kbd>↓</kbd> {bn ? 'বাছাই' : 'move'}</span>
          <span><kbd>↵</kbd> {bn ? 'খুলুন' : 'open'}</span>
          <span><kbd>Esc</kbd> {bn ? 'বন্ধ' : 'close'}</span>
          <span className="sp-count" aria-live="polite">
            {term.length >= 2 && state === 'done' ? (bn ? `${total}টি ফল` : `${total} result${total === 1 ? '' : 's'}`) : ''}
          </span>
        </div>
      </div>

      <style>{`
        .sp-root { position: fixed; inset: 0; z-index: 100001; display: flex; justify-content: center; align-items: flex-start; padding: clamp(12px, 9vh, 96px) 12px 12px; }
        .sp-scrim { position: absolute; inset: 0; background: rgba(12, 10, 9, .5); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); animation: sp-fade .18s ease-out; }
        .sp-panel {
          position: relative; width: min(680px, 100%); max-height: min(640px, calc(100dvh - 24px));
          display: flex; flex-direction: column; overflow: hidden;
          background: var(--card, #fff); color: var(--ink, #151515);
          border: calc(2px * var(--bwk, 1)) solid var(--edge, #151515); border-radius: 18px;
          box-shadow: calc(6px * var(--shk, 1)) calc(6px * var(--shk, 1)) 0 var(--acc, #6f6758), 0 30px 80px -30px rgba(0, 0, 0, .55);
          animation: sp-in .22s cubic-bezier(.2, .8, .2, 1);
        }
        .sp-head { display: flex; align-items: center; gap: 12px; padding: 6px 10px 6px 18px; border-bottom: 1px solid color-mix(in srgb, var(--ink, #151515) 14%, transparent); }
        .sp-icon { display: grid; place-items: center; font-size: 20px; color: var(--muted-2, #55524a); flex: none; }
        .sp-head input {
          flex: 1; min-width: 0; height: 56px; border: 0; outline: 0; background: transparent; color: inherit;
          font: inherit; font-size: 18px; font-weight: 600;
        }
        .sp-head input::placeholder { color: var(--muted, #8a857a); font-weight: 500; }
        .sp-head input::-webkit-search-cancel-button { display: none; }
        .sp-esc { flex: none; border: 0; background: transparent; padding: 6px; cursor: pointer; color: inherit; }
        .sp-root kbd {
          display: inline-grid; place-items: center; min-width: 22px; height: 22px; padding: 0 6px; box-sizing: border-box;
          font: 700 11px/1 'DM Sans', system-ui, sans-serif; color: var(--muted-2, #55524a);
          border: 1px solid color-mix(in srgb, var(--ink, #151515) 22%, transparent); border-bottom-width: 2px; border-radius: 6px;
          background: color-mix(in srgb, var(--ink, #151515) 4%, transparent);
        }
        .sp-body { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 6px 8px 10px; }
        .sp-label {
          margin: 12px 10px 4px; display: flex; gap: 8px; align-items: baseline;
          font-size: 11.5px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--muted, #8a857a);
        }
        .sp-label span { font-weight: 600; letter-spacing: 0; }
        .sp-elsewhere { margin-top: 18px; padding-top: 12px; border-top: 1px dashed color-mix(in srgb, var(--ink, #151515) 18%, transparent); }
        .sp-row {
          width: 100%; box-sizing: border-box; display: flex; align-items: center; gap: 12px;
          padding: 8px 10px; border: 0; border-radius: 10px; background: transparent;
          color: inherit; text-decoration: none; text-align: left; font: inherit; cursor: pointer;
        }
        .sp-row.is-active { background: color-mix(in srgb, var(--acc, #6f6758) 16%, transparent); }
        .sp-row.is-active .sp-go { opacity: 1; transform: none; }
        .sp-thumb { width: 34px; height: 44px; flex: none; object-fit: cover; border-radius: 6px; }
        .sp-dot {
          width: 34px; height: 34px; flex: none; display: grid; place-items: center; border-radius: 8px;
          font-weight: 800; font-size: 15px; color: var(--muted-2, #55524a);
          background: color-mix(in srgb, var(--ink, #151515) 7%, transparent);
        }
        .sp-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
        .sp-text strong { font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sp-text span { font-size: 13px; color: var(--muted-2, #55524a); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sp-go { flex: none; display: grid; place-items: center; color: var(--muted-2, #55524a); opacity: 0; transform: translateX(-4px); transition: opacity .15s, transform .15s; }
        .sp-hint, .sp-empty { margin: 14px 10px 6px; font-size: 14px; line-height: 1.5; color: var(--muted-2, #55524a); }
        .sp-empty { font-size: 15px; }
        .sp-foot {
          display: flex; align-items: center; gap: 16px; padding: 9px 16px; font-size: 12px; color: var(--muted, #8a857a);
          border-top: 1px solid color-mix(in srgb, var(--ink, #151515) 12%, transparent);
        }
        .sp-foot span { display: inline-flex; align-items: center; gap: 4px; }
        .sp-count { margin-left: auto; }
        @keyframes sp-in { from { opacity: 0; transform: translateY(-8px) scale(.98); } to { opacity: 1; transform: none; } }
        @keyframes sp-fade { from { opacity: 0; } to { opacity: 1; } }
        /* On a phone: a full sheet, keys hidden */
        @media (max-width: 640px) {
          .sp-root { padding: 0; }
          .sp-panel { width: 100%; max-height: none; height: 100dvh; border: 0; border-radius: 0; box-shadow: none; }
          .sp-foot { display: none; }
          .sp-go { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) { .sp-panel, .sp-scrim { animation: none; } }
      `}</style>
    </div>
  );
}
