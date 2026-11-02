// What Rupok Originals remembers for a reader: the episodes they opened, the
// comic pages they reached, and the series on their list.
//
//   watch history   in this browser (localStorage); episodes play on YouTube,
//                   so there is no server-side position to keep
//   reading         the server's reading progress for a signed-in reader, and
//                   this browser's for everyone (ComicReader writes both)
//   My List         the reader's followed series (api follows), so a series on
//                   the list also brings its new-episode notifications
import { useEffect, useState } from 'react';
import { api } from '../services/api';

export const ytId = url => (String(url || '').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/) || [])[1];
export const ytThumb = (url, size = 'hqdefault') => (ytId(url) ? `https://i.ytimg.com/vi/${ytId(url)}/${size}.jpg` : null);

const WATCHED = 'rupok-og-watched';
const READ = 'rupok-og-read';
const read = key => { try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch { return {}; } };
const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private window */ } };

/** An episode was opened: series key and its index in the series' episode list. */
export function recordWatch(seriesKey, index) {
  const all = read(WATCHED);
  all[seriesKey] = { i: index, at: Date.now() };
  write(WATCHED, all);
}
export const watchedOf = seriesKey => read(WATCHED)[seriesKey] || null;

/** A comic page was reached (ComicReader). */
export function recordRead(comicKey, page, total) {
  const all = read(READ);
  all[comicKey] = { page, total, at: Date.now() };
  write(READ, all);
}

/**
 * What to pick up again, newest first: comics part-read (not finished) and the
 * last episode opened per series. Signed-in readers' server progress wins over
 * this browser's for the same issue.
 */
export function useContinue(user, series, comics) {
  const [server, setServer] = useState([]);
  useEffect(() => {
    if (!user) { setServer([]); return undefined; }
    let live = true;
    api.getProgress().then(r => { if (live && r.ok) setServer(r.data || []); });
    return () => { live = false; };
  }, [user?.id]);

  const local = read(READ);
  const byComic = {};
  Object.entries(local).forEach(([k, v]) => { byComic[k] = { page: v.page, total: v.total, at: v.at }; });
  server.forEach(p => { byComic[p.comic_key] = { page: p.page, total: p.total_pages, at: Date.parse(p.updated_at) || 0 }; });

  const reading = Object.entries(byComic)
    .map(([k, v]) => ({ kind: 'comic', c: comics.find(x => x.k === k), ...v }))
    .filter(x => x.c && x.page > 0 && (!x.total || x.page <= x.total));
  const watching = Object.entries(read(WATCHED))
    .map(([k, v]) => {
      const s = series.find(x => x.k === k);
      const ep = s?.eps?.[v.i];
      return s && ep ? { kind: 'episode', s, ep, i: v.i, at: v.at } : null;
    })
    .filter(Boolean);
  return [...reading, ...watching].sort((a, b) => b.at - a.at).slice(0, 12);
}

// ── My List ────────────────────────────────────────────────────────────────
// One store for the page, so every + button and the My List row agree.
let list = { keys: new Set(), loaded: false, user: null };
const subs = new Set();
const emit = () => subs.forEach(f => f(list));

function load(user) {
  if (!user) { list = { keys: new Set(), loaded: true, user: null }; emit(); return; }
  if (list.user === user.id && list.loaded) return;
  list = { ...list, user: user.id };
  api.myFollows().then(r => {
    if (list.user !== user.id) return;
    list = { keys: new Set((r.ok ? r.data : []).filter(f => f.type === 'series').map(f => f.key)), loaded: true, user: user.id };
    emit();
  });
}

export function useMyList(user) {
  const [state, setState] = useState(list);
  useEffect(() => {
    subs.add(setState);
    load(user);
    setState(list);
    return () => { subs.delete(setState); };
  }, [user?.id]);
  const toggle = async key => {
    const had = list.keys.has(key);
    const keys = new Set(list.keys);
    if (had) keys.delete(key); else keys.add(key);
    list = { ...list, keys };
    emit();
    const r = had ? await api.unfollow('series', key) : await api.follow('series', key);
    if (!r.ok) {
      const back = new Set(list.keys);
      if (had) back.add(key); else back.delete(key);
      list = { ...list, keys: back };
      emit();
    }
    return r.ok;
  };
  return { has: key => state.keys.has(key), keys: state.keys, loaded: state.loaded, toggle };
}

// ── Quick view ─────────────────────────────────────────────────────────────
export const PREVIEW_EVENT = 'rupok:og-preview';
export const openPreview = key => window.dispatchEvent(new CustomEvent(PREVIEW_EVENT, { detail: { key } }));
