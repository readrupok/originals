import React from 'react';
import { Check, Plus } from 'lucide-react';
import { useMyList } from '../lib/originals';
import { ogWords } from '../lib/ogWords';

const GOLD = '#f5c542';

/**
 * Adds a series to the reader's My List (their followed series), or takes it
 * off. `round` is the small + on a poster; otherwise a full button. A reader
 * who is not signed in is taken to the account page to sign in.
 */
export default function MyListButton({ seriesKey, user, t, lang, base = '', round = false }) {
  const w = ogWords(t, lang);
  const { has, toggle } = useMyList(user);
  const on = has(seriesKey);
  const label = !user ? w.signInToSave : on ? w.added : w.add;

  const onClick = e => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { window.location.assign(`${base}/account`); return; }
    toggle(seriesKey);
  };

  if (round) {
    return (
      <button type="button" onClick={onClick} aria-pressed={!!user && on} aria-label={label} title={label} className={`og-round${on ? ' is-on' : ''}`}>
        {on ? <Check size={17} strokeWidth={2.8} /> : <Plus size={18} strokeWidth={2.6} />}
      </button>
    );
  }
  return (
    <button
      type="button" onClick={onClick} aria-pressed={!!user && on} title={!user ? w.signInToSave : undefined}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 20px', borderRadius: 10, cursor: 'pointer',
        font: 'inherit', fontWeight: 700, fontSize: 15,
        border: `1px solid ${on ? GOLD : 'rgba(255,255,255,.28)'}`,
        background: on ? 'rgba(245,197,66,.12)' : 'rgba(255,255,255,.08)',
        color: on ? GOLD : '#fafaf9', transition: 'background .2s, border-color .2s, color .2s'
      }}
    >
      {on ? <Check size={18} strokeWidth={2.6} /> : <Plus size={18} strokeWidth={2.6} />}
      {on ? w.added : w.add}
    </button>
  );
}
