import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { IBell } from './icons';

const INK = 'var(--ink, var(--ink, #151515))';
const POLL_MS = 90_000;

function ago(iso, lang) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(lang === 'bn' ? 'bn' : 'en', { numeric: 'auto' });
  if (s < 60) return rtf.format(-Math.round(s), 'second');
  if (s < 3600) return rtf.format(-Math.round(s / 60), 'minute');
  if (s < 86400) return rtf.format(-Math.round(s / 3600), 'hour');
  return rtf.format(-Math.round(s / 86400), 'day');
}

/**
 * The bell in the nav. Polls gently while the tab is visible: a payment
 * approval or a new chapter can land at any time, but nothing here is urgent
 * enough to justify a socket.
 */
export default function NotificationBell({ user, lang, t, base = '' }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ unread: 0, items: [] });
  const wrap = useRef(null);

  const load = useCallback(async () => {
    const r = await api.notifications();
    if (r.ok) setData(r.data);
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    load();
    const id = setInterval(() => { if (document.visibilityState === 'visible') load(); }, POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [user, load]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = e => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); };
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!user) return null;

  const markAll = async () => {
    const r = await api.markNotificationsRead();
    if (r.ok) setData(d => ({ unread: 0, items: d.items.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() })) }));
  };

  const openItem = n => {
    if (!n.read_at) api.markNotificationsRead(n.id);
    setOpen(false);
  };

  return (
    <div ref={wrap} style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 'none' }}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); if (!open) load(); }}
        aria-label={`${t.notifTitle}${data.unread ? ` (${data.unread})` : ''}`}
        aria-expanded={open}
        style={{
          position: 'relative', display: 'grid', placeItems: 'center', width: 36, height: 36,
          borderRadius: 10, border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, background: open ? 'var(--ink-bg, #151515)' : 'var(--card, var(--card, #fff))',
          color: open ? '#f4f1ea' : INK, cursor: 'pointer', boxShadow: `calc(2px * var(--shk, 1)) calc(2px * var(--shk, 1)) 0 ${INK}`, fontSize: 16
        }}
      >
        <IBell />
        {data.unread > 0 && (
          <span
            aria-hidden="true"
            style={{
              position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, padding: '0 4px',
              borderRadius: 9, background: '#b91c1c', color: '#fff', border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
              fontSize: 10, fontWeight: 800, display: 'grid', placeItems: 'center', lineHeight: 1
            }}
          >
            {data.unread > 9 ? '9+' : data.unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 10px)', zIndex: 60,
            width: 'min(360px, calc(100vw - 24px))', maxHeight: '70vh', overflowY: 'auto',
            background: 'var(--paper, var(--paper, #f4f1ea))', border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, borderRadius: 16,
            boxShadow: 'calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 var(--acc, #6f6758)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)` }}>
            <strong style={{ fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)" }}>{t.notifTitle}</strong>
            {data.unread > 0 && (
              <button type="button" onClick={markAll}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', font: 'inherit', fontSize: 13, fontWeight: 700, textDecoration: 'underline', color: INK }}>
                {t.notifMarkAll}
              </button>
            )}
          </div>

          {data.items.length === 0 ? (
            <p style={{ margin: 0, padding: 16, fontSize: 14, color: 'var(--muted-2, #55524a)' }}>{t.notifEmpty}</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {data.items.map(n => (
                <li key={n.id} style={{ borderBottom: '1px solid rgba(21,21,21,.15)' }}>
                  <a
                    role="menuitem"
                    href={`${base}${n.url || '/account'}`}
                    onClick={() => openItem(n)}
                    style={{
                      display: 'flex', gap: 10, padding: '12px 14px', textDecoration: 'none', color: INK,
                      background: n.read_at ? 'transparent' : 'var(--card, var(--card, #fff))'
                    }}
                  >
                    <span aria-hidden="true" style={{
                      width: 8, height: 8, marginTop: 7, borderRadius: 4, flex: 'none',
                      background: n.read_at ? 'transparent' : 'var(--acc, #6f6758)'
                    }} />
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: n.read_at ? 500 : 700, lineHeight: 1.4 }}>
                        {lang === 'bn' ? n.title_bn : n.title_en}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--muted, #6b675e)' }}>{ago(n.created_at, lang)}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
