import React, { useState, useMemo } from 'react';
import { Search, X, BookOpen, Feather, ArrowRight } from 'lucide-react';
import { INK, WORK_KINDS } from '../data/content';
import { IArrowRight } from '../components/icons';
import WorkCard, { pairLabel, tilt, untilt } from '../components/WorkCard';

// The Writers landing page: one poster block per kind of work, search, and authors.
export default function Writers({ lang, base, library_works = [], authors = [], num, t }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKind, setSelectedKind] = useState('all');

  const trimmed = searchQuery.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!trimmed && selectedKind === 'all') {
      return null;
    }

    const filteredWorks = library_works.filter(w => {
      const matchKind = selectedKind === 'all' || w.kind === selectedKind;
      if (!matchKind) return false;

      if (!trimmed) return true;

      const title = (w.title || '').toLowerCase();
      const summary = (w.summary || '').toLowerCase();
      const author = (w.author_name || w.pen_name_en || w.pen_name_bn || w.author_handle || '').toLowerCase();
      const genre = (w.genreKey || w.genreLabel || '').toLowerCase();
      const tags = Array.isArray(w.tags) ? w.tags.join(' ').toLowerCase() : '';

      return title.includes(trimmed) || summary.includes(trimmed) || author.includes(trimmed) || genre.includes(trimmed) || tags.includes(trimmed);
    });

    const filteredAuthors = trimmed
      ? authors.filter(a => {
          const name = (a.name || a.pen_name_en || a.pen_name_bn || a.handle || '').toLowerCase();
          const bio = (a.bio || a.bio_en || a.bio_bn || '').toLowerCase();
          return name.includes(trimmed) || bio.includes(trimmed);
        })
      : [];

    return { works: filteredWorks, authors: filteredAuthors };
  }, [library_works, authors, trimmed, selectedKind]);

  const byKind = kind => library_works.filter(w => w.kind === kind);
  const liveKinds = WORK_KINDS.filter(k => byKind(k).length);
  const accents = library_works.map(w => w.ac).filter(Boolean);

  const isSearching = searchResults !== null;

  return (
    <div style={{ color: INK }}>
      <header
        data-screen-label="Writers — Header"
        style={{ position: 'relative', padding: 'clamp(28px, 4.5vh, 64px) clamp(12px, 1.8vw, 24px) clamp(20px, 3vh, 32px)', overflow: 'hidden' }}
      >
        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px clamp(24px, 3vw, 48px)' }}>
          <div style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{
              alignSelf: 'flex-start', padding: '6px 14px', border: `2px solid ${INK}`,
              borderRadius: 999, background: '#fff', fontWeight: 800, fontSize: 13,
              boxShadow: `3px 3px 0 ${INK}`
            }}>{t.libraryEyebrow}</span>
            <h1 style={{
              margin: 0, fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800,
              fontSize: 'clamp(40px, 5.5vw, 84px)', lineHeight: 0.98, letterSpacing: '-.045em'
            }}>{t.h1Library}</h1>
          </div>
          <p style={{ margin: 0, flex: '0 1 560px', maxWidth: 560, fontSize: 'clamp(16px, 1.3vw, 19px)', lineHeight: 1.6, color: '#55524a' }}>
            {t.bodyLibrary}
          </p>
        </div>

        {/* Search Bar & Filter Strip */}
        <div style={{ maxWidth: 1440, margin: 'clamp(24px, 3.5vh, 36px) auto 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            maxWidth: 720
          }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: 18,
                color: '#6b675e',
                pointerEvents: 'none',
                zIndex: 2
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'bn' ? 'গল্প, ধারাবাহিক, কবিতা বা লেখকের নাম খুঁজুন…' : 'Search stories, serials, poems or writers…'}
              style={{
                width: '100%',
                padding: '14px 48px 14px 48px',
                border: `2px solid ${INK}`,
                borderRadius: 16,
                background: '#fff',
                color: INK,
                fontFamily: "'Sora', 'Hind Siliguri', sans-serif",
                fontSize: 16,
                fontWeight: 600,
                outline: 'none',
                boxShadow: '4px 4px 0 rgba(21, 21, 21, 0.15)',
                transition: 'box-shadow 0.2s, border-color 0.2s'
              }}
              onFocus={e => (e.currentTarget.style.boxShadow = `5px 5px 0 ${INK}`)}
              onBlur={e => (e.currentTarget.style.boxShadow = '4px 4px 0 rgba(21, 21, 21, 0.15)')}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={lang === 'bn' ? 'অনুসন্ধান মুছুন' : 'Clear search'}
                style={{
                  position: 'absolute',
                  right: 14,
                  display: 'grid',
                  placeItems: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: `2px solid ${INK}`,
                  background: '#f4f1ea',
                  cursor: 'pointer',
                  color: INK,
                  padding: 0
                }}
              >
                <X size={15} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Quick kind selector pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6b675e', marginRight: 4 }}>
              {lang === 'bn' ? 'ফিল্টার:' : 'Filter:'}
            </span>
            <button
              type="button"
              onClick={() => setSelectedKind('all')}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                border: `2px solid ${INK}`,
                background: selectedKind === 'all' ? INK : '#fff',
                color: selectedKind === 'all' ? '#f4f1ea' : INK,
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: selectedKind === 'all' ? 'none' : `2px 2px 0 ${INK}`,
                transition: 'all 0.15s'
              }}
            >
              {lang === 'bn' ? 'সব লেখা' : 'Everything'}
            </button>
            {WORK_KINDS.map(k => {
              const on = selectedKind === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelectedKind(prev => (prev === k ? 'all' : k))}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: `2px solid ${INK}`,
                    background: on ? INK : '#fff',
                    color: on ? '#f4f1ea' : INK,
                    fontFamily: 'inherit',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: on ? 'none' : `2px 2px 0 ${INK}`,
                    transition: 'all 0.15s'
                  }}
                >
                  {pairLabel(t.libraryKinds, k, k)}
                </button>
              );
            })}
          </div>
        </div>

        {accents.length > 1 && (
          <div style={{ maxWidth: 1440, margin: 'clamp(20px, 3vh, 34px) auto 0', display: 'flex', height: 10, border: `2px solid ${INK}`, borderRadius: 999, overflow: 'hidden' }}>
            {accents.slice(0, 12).map((c, i) => (
              <span key={i} style={{ flex: 1, background: c }} />
            ))}
          </div>
        )}
      </header>

      <main style={{ maxWidth: 1440, margin: '0 auto', padding: '0 clamp(12px, 1.8vw, 24px) clamp(48px, 8vh, 96px)', display: 'flex', flexDirection: 'column', gap: 'clamp(40px, 6vh, 72px)' }}>
        {isSearching ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, borderBottom: `2px solid ${INK}`, paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ margin: 0, fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontSize: 'clamp(24px, 2.6vw, 36px)', fontWeight: 800 }}>
                  {lang === 'bn' ? 'অনুসন্ধানের ফলাফল' : 'Results'}
                </h2>
                <span style={{ padding: '4px 10px', borderRadius: 999, background: INK, color: '#f4f1ea', fontSize: 13, fontWeight: 800 }}>
                  {num(searchResults.works.length + searchResults.authors.length, lang)}
                </span>
              </div>

              {(searchQuery || selectedKind !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedKind('all');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6b675e',
                    textDecoration: 'underline',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  {lang === 'bn' ? 'ফিল্টার মুছে দিন' : 'Clear filters'}
                </button>
              )}
            </div>

            {/* Matching Authors if any */}
            {searchResults.authors.length > 0 && (
              <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6b675e' }}>
                  {lang === 'bn' ? 'সংশ্লিষ্ট লেখক' : 'Matching writers'}
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: 'clamp(14px, 1.6vw, 20px)' }}>
                  {searchResults.authors.map(w => (
                    <a
                      key={w.handle}
                      href={w.href}
                      onMouseMove={tilt}
                      onMouseLeave={untilt}
                      style={{
                        '--tx': 0, '--ty': 0, '--on': 0,
                        display: 'flex', gap: 14, alignItems: 'center', padding: 14,
                        border: `2px solid ${INK}`, borderRadius: 16, background: '#f9f7f1',
                        color: INK, textDecoration: 'none', boxShadow: `5px 5px 0 ${w.ac || INK}`,
                        transform: 'translateY(calc(var(--on) * -3px))', transition: 'transform 200ms ease'
                      }}
                    >
                      <span style={{
                        flex: 'none', width: 52, height: 52, borderRadius: '50%',
                        border: `2px solid ${INK}`,
                        background: w.avatar ? `${w.ac} url(${w.avatar}) center/cover` : (w.ac || '#6f6758'),
                        display: 'grid', placeItems: 'center',
                        color: '#fff', fontWeight: 800, fontSize: 19
                      }}>{!w.avatar && (w.name || w.handle).trim().charAt(0).toUpperCase()}</span>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                        <strong style={{ fontSize: 16, lineHeight: 1.2 }}>{w.name}</strong>
                        <span style={{ fontSize: 12.5, color: '#6b675e' }}>
                          {(t.libraryCount || '{n}').replace('{n}', num(w.works || 0, lang))}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Matching Works */}
            {searchResults.works.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 'clamp(16px, 1.8vw, 24px)' }}>
                {searchResults.works.map(w => (
                  <WorkCard key={w.k} w={w} lang={lang} num={num} t={t} />
                ))}
              </div>
            ) : searchResults.authors.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 16,
                padding: '64px 20px',
                borderRadius: 20,
                border: `2px dashed ${INK}`,
                background: '#fff'
              }}>
                <BookOpen size={48} strokeWidth={1.7} style={{ color: '#8f8b82' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 440 }}>
                  <strong style={{ fontSize: 20, fontFamily: "'Sora', 'Hind Siliguri', sans-serif" }}>
                    {lang === 'bn' ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No results found'}
                  </strong>
                  <span style={{ fontSize: 15, color: '#6b675e', lineHeight: 1.5 }}>
                    {lang === 'bn'
                      ? `"${searchQuery}" এর সাথে মিলে এমন কিছু পাওয়া যায়নি। বানান পরীক্ষা করুন বা অন্য কোনো শব্দ দিয়ে খুঁজুন।`
                      : `We couldn't find any writings or authors matching "${searchQuery}". Check your spelling or try different keywords.`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedKind('all');
                  }}
                  style={{
                    marginTop: 8,
                    padding: '10px 20px',
                    borderRadius: 12,
                    border: `2px solid ${INK}`,
                    background: INK,
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  {lang === 'bn' ? 'সব লেখা দেখুন' : 'Show all'}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            {!library_works.length && (
              <p style={{ fontSize: 18, color: '#55524a', padding: '40px 0' }}>{t.libraryEmpty}</p>
            )}

            {liveKinds.map(kind => {
              const list = byKind(kind);
              return (
                <section key={kind} aria-labelledby={`authors-${kind}`} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, borderBottom: `2px solid ${INK}`, paddingBottom: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <h2 id={`authors-${kind}`} style={{
                        margin: 0, fontFamily: "'Sora', 'Hind Siliguri', sans-serif",
                        fontSize: 'clamp(24px, 2.6vw, 36px)', fontWeight: 800, letterSpacing: '-.03em'
                      }}>{pairLabel(t.libraryKinds, kind, kind)}</h2>
                      <span style={{ fontSize: 14, color: '#6b675e' }}>
                        {pairLabel(t.libraryKindBlurbs, kind, '')}
                      </span>
                    </div>
                    <a href={`${base}/stories/${kind}`} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                      border: `2px solid ${INK}`, borderRadius: 999, background: '#fff',
                      color: INK, textDecoration: 'none', fontWeight: 800, fontSize: 13
                    }}>
                      {(t.libraryCount || '{n}').replace('{n}', num(list.length, lang))} <IArrowRight />
                    </a>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 'clamp(16px, 1.8vw, 24px)' }}>
                    {list.slice(0, 4).map(w => (
                      <WorkCard key={w.k} w={w} lang={lang} num={num} t={t} />
                    ))}
                  </div>
                </section>
              );
            })}

            {authors.length > 0 && (
              <section aria-labelledby="authors-people" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, borderBottom: `2px solid ${INK}`, paddingBottom: 10 }}>
                  <h2 id="authors-people" style={{
                    margin: 0, fontFamily: "'Sora', 'Hind Siliguri', sans-serif",
                    fontSize: 'clamp(24px, 2.6vw, 36px)', fontWeight: 800, letterSpacing: '-.03em'
                  }}>
                    {lang === 'bn' ? 'লেখকেরা' : 'Writers'}
                  </h2>
                  <a
                    href={`${base}/authors`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 14px',
                      border: `2px solid ${INK}`,
                      borderRadius: 999,
                      background: '#fff',
                      color: INK,
                      textDecoration: 'none',
                      fontWeight: 800,
                      fontSize: 13,
                      boxShadow: `2px 2px 0 ${INK}`
                    }}
                  >
                    {lang === 'bn' ? 'সব লেখক দেখুন' : 'See all writers'} <IArrowRight />
                  </a>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: 'clamp(14px, 1.6vw, 20px)' }}>
                  {authors.map(w => (
                    <a
                      key={w.handle}
                      href={w.href}
                      onMouseMove={tilt}
                      onMouseLeave={untilt}
                      style={{
                        '--tx': 0, '--ty': 0, '--on': 0,
                        display: 'flex', gap: 14, alignItems: 'center', padding: 14,
                        border: `2px solid ${INK}`, borderRadius: 16, background: '#f9f7f1',
                        color: INK, textDecoration: 'none', boxShadow: `5px 5px 0 ${w.ac}`,
                        transform: 'translateY(calc(var(--on) * -3px))', transition: 'transform 200ms ease'
                      }}
                    >
                      <span style={{
                        flex: 'none', width: 56, height: 56, borderRadius: '50%',
                        border: `2px solid ${INK}`,
                        background: w.avatar ? `${w.ac} url(${w.avatar}) center/cover` : w.ac,
                        display: 'grid', placeItems: 'center',
                        color: '#fff', fontWeight: 800, fontSize: 20
                      }}>{!w.avatar && (w.name || w.handle).trim().charAt(0).toUpperCase()}</span>
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                        <strong style={{ fontSize: 16, lineHeight: 1.2 }}>{w.name}</strong>
                        <span style={{ fontSize: 12.5, color: '#6b675e' }}>
                          {(t.workChapters && w.works === 1
                            ? t.readWriting
                            : (t.libraryCount || '{n}').replace('{n}', num(w.works, lang)))}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
