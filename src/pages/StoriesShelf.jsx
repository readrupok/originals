import React, { useState } from 'react';
import { WORK_KINDS } from '../data/content';
import { pairLabel } from '../components/WorkCard';
import RupokStoriesMark from '../components/RupokStoriesMark';
import { BookCard, kindLabel, PAPER, INK, MUTED, LINE, SERIF, SANS } from './StoriesHome';

// One form of writing on Rupok Stories (/story, /series, /poetry): every
// published piece of that kind, with the other forms a tab away and a genre
// filter when the pieces span more than one.

export default function StoriesShelf({ lang, base, kind, t, num, library_works = [] }) {
  const [genre, setGenre] = useState('all');
  const pieces = library_works.filter(w => w.kind === kind);
  const genres = [...new Set(pieces.map(w => w.genreKey).filter(Boolean))];
  const shown = genre === 'all' ? pieces : pieces.filter(w => w.genreKey === genre);
  const blurb = (Array.isArray(t.libraryKindBlurbs) ? t.libraryKindBlurbs : []).find(p => Array.isArray(p) && p[0] === kind)?.[1];

  const pill = on => ({
    padding: '7px 14px', borderRadius: 999, border: `1px solid ${on ? INK : LINE}`,
    background: on ? INK : '#fff', color: on ? PAPER : INK,
    font: 'inherit', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', textDecoration: 'none'
  });

  return (
    <div style={{ background: PAPER, color: INK, fontFamily: SANS, minHeight: '60vh', paddingBottom: 'clamp(48px, 6vw, 80px)' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(32px, 5vw, 64px) clamp(16px, 2.4vw, 32px) 0' }}>
        <nav aria-label={lang === 'bn' ? 'লেখার ধরন' : 'Forms of writing'} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {WORK_KINDS.map(k => (
            <a key={k} href={`${base}/stories/${k}`} aria-current={k === kind ? 'page' : undefined} style={pill(k === kind)}>
              {kindLabel(t, lang, k)}
            </a>
          ))}
        </nav>

        <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px 32px', borderBottom: `1px solid ${LINE}`, paddingBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <RupokStoriesMark height={38} color="#9a3412" />
            <h1 style={{ margin: 0, fontFamily: SERIF, fontWeight: 500, fontSize: 'clamp(40px, 5vw, 68px)', lineHeight: 1, letterSpacing: '-.03em' }}>
              {kindLabel(t, lang, kind)}
            </h1>
          </div>
          {blurb && <p style={{ margin: 0, maxWidth: 520, fontSize: 16.5, lineHeight: 1.65, color: MUTED }}>{blurb}</p>}
        </header>

        {genres.length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20 }}>
            <button type="button" onClick={() => setGenre('all')} style={pill(genre === 'all')}>{lang === 'bn' ? 'সব' : 'All'}</button>
            {genres.map(g => (
              <button key={g} type="button" onClick={() => setGenre(g)} style={pill(genre === g)}>
                {pairLabel(t.libraryGenres, g, g)}
              </button>
            ))}
          </div>
        )}

        {shown.length ? (
          <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(46%, 190px), 1fr))', gap: 'clamp(18px, 2.2vw, 32px)' }}>
            {shown.map(w => <BookCard key={w.k} w={w} t={t} num={num} lang={lang} />)}
          </div>
        ) : (
          <p style={{ marginTop: 40, fontFamily: SERIF, fontSize: 20, color: MUTED }}>{t.libraryEmpty}</p>
        )}
      </div>

      <style>{`
        .st-book > div { transition: transform .25s ease, box-shadow .25s ease; }
        .st-book:hover > div { transform: translateY(-4px); }
      `}</style>
    </div>
  );
}
