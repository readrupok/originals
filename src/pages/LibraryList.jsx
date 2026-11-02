import React, { useState } from 'react';
import { INK } from '../data/content';
import WorkCard, { pairLabel } from '../components/WorkCard';

// One kind of work, filterable by genre. Both the kind labels and the genre
// list come from the CMS.

export default function LibraryList({ lang, base, kind, library_works = [], num, t }) {
  const [genre, setGenre] = useState('all');

  const ofKind = library_works.filter(w => w.kind === kind);
  const list = ofKind.filter(w => genre === 'all' || w.genreKey === genre);

  const genres = (Array.isArray(t.libraryGenres) ? t.libraryGenres : [])
    .filter(([code]) => code === 'all' || ofKind.some(w => w.genreKey === code));

  const label = pairLabel(t.libraryKinds, kind, kind);
  const blurb = pairLabel(t.libraryKindBlurbs, kind, t.bodyLibrary);

  const chip = on => ({
    padding: '7px 15px', borderRadius: 999, border: `2px solid ${INK}`,
    background: on ? INK : '#fff', color: on ? '#fff' : INK,
    fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit'
  });

  return (
    <div style={{ color: INK }}>
      <header style={{ padding: 'clamp(24px, 4vh, 56px) clamp(12px, 1.8vw, 24px) clamp(16px, 2.5vh, 28px)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <nav style={{ fontSize: 13, color: '#6b675e', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href={`${base}/stories`} style={{ color: '#6b675e' }}>{t.h1Library}</a>
            <span aria-hidden="true">/</span>
            <span style={{ color: INK, fontWeight: 700 }}>{label}</span>
          </nav>
          <h1 style={{
            margin: 0, fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800,
            fontSize: 'clamp(34px, 4.6vw, 68px)', lineHeight: 1, letterSpacing: '-.04em'
          }}>{label}</h1>
          <p style={{ margin: 0, maxWidth: 620, fontSize: 'clamp(15px, 1.2vw, 18px)', lineHeight: 1.6, color: '#55524a' }}>
            {blurb}
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 1440, margin: '0 auto', padding: '0 clamp(12px, 1.8vw, 24px) clamp(48px, 8vh, 96px)', display: 'flex', flexDirection: 'column', gap: 22 }}>
        {genres.length > 1 && (
          <div role="group" aria-label={t.workTags} style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
            {genres.map(([code, text]) => (
              <button key={code} type="button" onClick={() => setGenre(code)} style={chip(genre === code)} aria-pressed={genre === code}>
                {text}
              </button>
            ))}
          </div>
        )}

        <span style={{ fontSize: 13.5, color: '#6b675e' }}>
          {(t.libraryCount || '{n}').replace('{n}', num(list.length, lang))}
        </span>

        {list.length === 0 ? (
          <p style={{ fontSize: 17, color: '#55524a', padding: '32px 0' }}>{t.libraryEmpty}</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 'clamp(16px, 1.8vw, 24px)' }}>
            {list.map(w => <WorkCard key={w.k} w={w} lang={lang} num={num} t={t} />)}
          </div>
        )}
      </main>
    </div>
  );
}
