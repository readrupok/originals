import React, { useState } from 'react';
import { INK, WORK_KINDS } from '../data/content';
import { IArrowRight, IBook, IExternal } from '../components/icons';
import { pairLabel, tilt, untilt } from '../components/WorkCard';

export default function Authors({ lang, base, authors = [], library_works = [], num, t }) {
  const [query, setQuery] = useState('');

  const filteredAuthors = authors.filter(a => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (a.name || '').toLowerCase().includes(q) ||
      (a.bio || '').toLowerCase().includes(q) ||
      (a.handle || '').toLowerCase().includes(q)
    );
  });

  const totalWorks = library_works.length || authors.reduce((acc, a) => acc + (a.works || 0), 0);

  return (
    <div style={{ color: INK }}>
      {/* Header */}
      <header
        data-screen-label="Authors — Header"
        style={{
          position: 'relative',
          padding: 'clamp(28px, 4.5vh, 64px) clamp(12px, 1.8vw, 24px) clamp(20px, 3vh, 32px)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            width: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '20px clamp(24px, 3vw, 48px)'
          }}
        >
          <div style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span
              style={{
                alignSelf: 'flex-start',
                padding: '6px 14px',
                border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                borderRadius: 999,
                background: 'var(--card, var(--card, #fff))',
                fontWeight: 800,
                fontSize: 13,
                boxShadow: `calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 ${INK}`
              }}
            >
              {t.authorsEyebrow || (lang === 'bn' ? 'আমাদের লেখকেরা' : 'Our writers')}
            </span>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
                fontWeight: 800,
                fontSize: 'clamp(40px, 5.5vw, 84px)',
                lineHeight: 0.98,
                letterSpacing: '-.045em'
              }}
            >
              {t.h1Authors || (lang === 'bn' ? 'রূপকের লেখকেরা' : 'Rupok’s writers')}
            </h1>
          </div>
          <p
            style={{
              margin: 0,
              flex: '0 1 560px',
              maxWidth: 560,
              fontSize: 'clamp(16px, 1.3vw, 19px)',
              lineHeight: 1.6,
              color: 'var(--muted-2, #55524a)'
            }}
          >
            {t.bodyAuthors ||
              (lang === 'bn'
                ? 'যাঁরা রূপক গল্পে লেখেন — গল্পকার, ঔপন্যাসিক আর কবি। কারও লেখায় পুরোনো বাংলা, কারও লেখায় আজকের শহর।'
                : 'The storytellers, novelists and poets who publish on Rupok Stories — some writing old Bengal, some writing the city today.')}
          </p>
        </div>

        {/* Quick Stats Pill Strip */}
        <div
          style={{
            maxWidth: 1440,
            margin: '28px auto 0',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            alignItems: 'center'
          }}
        >
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 12,
              background: 'var(--card, var(--card, #fff))',
              border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
              boxShadow: `calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 ${INK}`,
              fontWeight: 800,
              fontSize: 13
            }}
          >
            {lang === 'bn' ? `${num(authors.length, lang)} জন লেখক` : `${num(authors.length, lang)} Active Authors`}
          </span>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 12,
              background: 'var(--card, var(--card, #fff))',
              border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
              boxShadow: `calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 #b45309`,
              fontWeight: 800,
              fontSize: 13,
              color: '#b45309'
            }}
          >
            {lang === 'bn' ? `${num(totalWorks, lang)}টি প্রকাশনা` : `${num(totalWorks, lang)} Published Works`}
          </span>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 12,
              background: 'var(--card, var(--card, #fff))',
              border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
              boxShadow: `calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 #1d6fa5`,
              fontWeight: 800,
              fontSize: 13,
              color: '#1d6fa5'
            }}
          >
            {lang === 'bn' ? 'ছোটগল্প · ধারাবাহিক · কবিতা' : 'Stories · Serials · Poetry'}
          </span>
        </div>
      </header>

      {/* Search & Filter Bar */}
      <div
        style={{
          padding: '16px clamp(12px, 1.8vw, 24px)',
          background: 'var(--paper, #f4f1ea)',
          borderTop: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
          borderBottom: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            width: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 320px', maxWidth: 460 }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={lang === 'bn' ? 'নাম বা বিষয় দিয়ে লেখক খুঁজুন…' : 'Search writers by name or subject…'}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 12,
                border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                background: 'var(--card, var(--card, #fff))',
                color: INK,
                font: 'inherit',
                fontSize: 14,
                fontWeight: 600,
                outline: 'none',
                boxShadow: 'calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 var(--ink, #151515)'
              }}
            />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted-2, #55524a)' }}>
            {lang === 'bn' ? `${num(filteredAuthors.length, lang)} জন লেখক প্রদর্শিত` : `${num(filteredAuthors.length, lang)} Authors found`}
          </span>
        </div>
      </div>

      {/* Authors Directory Grid */}
      <main
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          padding: 'clamp(36px, 5vh, 64px) clamp(12px, 1.8vw, 24px) clamp(64px, 8vh, 104px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 36
        }}
      >
        {filteredAuthors.length === 0 ? (
          <div
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              background: 'var(--card, var(--card, #fff))',
              border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
              borderRadius: 16,
              boxShadow: 'calc(6px * var(--shk, 1)) calc(6px * var(--shk, 1)) 0 var(--ink, #151515)'
            }}
          >
            <h3 style={{ margin: '0 0 8px', fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontSize: 22, fontWeight: 800 }}>
              {lang === 'bn' ? 'কোনো লেখক পাওয়া যায়নি' : 'No writers match your search'}
            </h3>
            <p style={{ margin: 0, color: 'var(--muted, #6b675e)', fontSize: 15 }}>
              {lang === 'bn' ? 'অন্য কোনো নাম বা শব্দ দিয়ে খুঁজুন, অথবা অনুসন্ধান মুছে দিন।' : 'Try a different name or keyword, or clear the search.'}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))',
              gap: 'clamp(24px, 2.5vw, 36px)',
              alignItems: 'stretch'
            }}
          >
            {filteredAuthors.map((author, i) => {
              const ac = author.ac || '#b45309';
              const authorWorks = library_works.filter(w => w.author_handle === author.handle);
              const rotation = [-1.2, 0.8, -0.6, 1.1][i % 4];

              return (
                <article
                  key={author.handle}
                  style={{
                    position: 'relative',
                    padding: '24px 22px 26px',
                    borderRadius: 18,
                    background: 'var(--card, var(--card, #fff))',
                    border: `calc(2.5px * var(--bwk, 1)) solid var(--edge, #151515)`,
                    boxShadow: `calc(7px * var(--shk, 1)) calc(7px * var(--shk, 1)) 0 ${ac}`,
                    transform: `rotate(${rotation}deg)`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 20,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'translate(-3px, -3px) rotate(0deg)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = `rotate(${rotation}deg)`)}
                >
                  {/* Top: Avatar & Meta */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <a
                        href={author.href}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                          boxShadow: `calc(4px * var(--shk, 1)) calc(4px * var(--shk, 1)) 0 ${ac}`,
                          overflow: 'hidden',
                          background: author.avatar ? `${ac} url(${author.avatar}) center/cover` : ac,
                          display: 'grid',
                          placeItems: 'center',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: 32,
                          textDecoration: 'none',
                          flex: 'none'
                        }}
                      >
                        {!author.avatar && (author.name || author.handle).trim().charAt(0).toUpperCase()}
                      </a>

                      <span
                        style={{
                          alignSelf: 'flex-start',
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: `${ac}18`,
                          color: ac,
                          border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`,
                          fontWeight: 800,
                          fontSize: 12,
                          textTransform: 'uppercase',
                          letterSpacing: '.04em'
                        }}
                      >
                        {lang === 'bn'
                          ? `${num(author.works || authorWorks.length, lang)}টি কাজ`
                          : `${num(author.works || authorWorks.length, lang)} Works`}
                      </span>
                    </div>

                    <div>
                      <h2
                        style={{
                          margin: 0,
                          fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
                          fontWeight: 800,
                          fontSize: 'clamp(22px, 2.2vw, 28px)',
                          lineHeight: 1.15
                        }}
                      >
                        <a href={author.href} style={{ color: INK, textDecoration: 'none' }}>
                          {author.name}
                        </a>
                      </h2>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted, #78716c)', marginTop: 4 }}>
                        @{author.handle}
                      </div>
                    </div>

                    {author.bio && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          lineHeight: 1.6,
                          color: '#44403c',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {author.bio}
                      </p>
                    )}
                  </div>

                  {/* Published Works Preview */}
                  {authorWorks.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 12, borderTop: '1.5px dashed rgba(21, 21, 21, 0.15)' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted, #78716c)' }}>
                        {lang === 'bn' ? 'সাম্প্রতিক লেখা' : 'Recent writing'}
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {authorWorks.slice(0, 2).map(w => (
                          <a
                            key={w.k}
                            href={w.href}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                              padding: '8px 12px',
                              borderRadius: 8,
                              background: 'var(--card-2, #fcfbf8)',
                              border: 'calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)',
                              color: INK,
                              textDecoration: 'none',
                              fontSize: 13,
                              fontWeight: 700
                            }}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {w.title}
                            </span>
                            <span style={{ fontSize: 11, color: ac, fontWeight: 800, textTransform: 'uppercase' }}>
                              {pairLabel(t.libraryKinds, w.kind, w.kind)}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Profile & Bookshelf Button */}
                  <div style={{ paddingTop: 4 }}>
                    <a
                      href={author.href}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        width: '100%',
                        padding: '11px 16px',
                        borderRadius: 12,
                        background: 'var(--ink-bg, #151515)',
                        color: '#fff',
                        fontFamily: "'Bangers', 'Hind Siliguri', cursive",
                        fontSize: 16,
                        letterSpacing: '.04em',
                        textDecoration: 'none',
                        border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                        boxShadow: `calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 ${ac}`,
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <span>{lang === 'bn' ? 'সব লেখা ও পরিচিতি দেখুন' : 'View all of this writer’s work'}</span>
                      <IArrowRight />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Join Authors / Publish Callout */}
        <section
          style={{
            marginTop: 20,
            padding: 'clamp(28px, 4vw, 44px)',
            borderRadius: 20,
            background: 'var(--ink-bg, #151515)',
            color: '#f4f1ea',
            boxShadow: 'calc(7px * var(--shk, 1)) calc(7px * var(--shk, 1)) 0 #b45309',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 24
          }}
        >
          <div style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span
              style={{
                alignSelf: 'flex-start',
                padding: '4px 10px',
                borderRadius: 6,
                background: '#b45309',
                color: '#fff',
                fontWeight: 800,
                fontSize: 12,
                textTransform: 'uppercase'
              }}
            >
              {lang === 'bn' ? 'লেখক ডেস্ক' : 'Author desk'}
            </span>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
                fontWeight: 800,
                fontSize: 'clamp(26px, 3.2vw, 42px)',
                lineHeight: 1.1,
                letterSpacing: '-.03em'
              }}
            >
              {lang === 'bn' ? 'আপনিও কি লেখেন?' : 'Are you a writer?'}
            </h2>
            <p style={{ margin: 0, color: '#c9c5bb', fontSize: 16, lineHeight: 1.6, maxWidth: 640 }}>
              {lang === 'bn'
                ? 'গল্প, ধারাবাহিক উপন্যাস বা কবিতা — রূপক গল্পে প্রকাশ করুন, পৌঁছে দিন দেশ-বিদেশের পাঠকের কাছে। পর্ব ধরে লিখুন, যখন খুশি প্রকাশ করুন।'
                : 'Short stories, serials or poetry — publish them on Rupok Stories and reach readers in Bangladesh and beyond. Write chapter by chapter, and publish when you are ready.'}
            </p>
          </div>

          <a
            href={`${base}/account#author`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 24px',
              borderRadius: 14,
              background: 'var(--card, var(--card, #fff))',
              color: INK,
              border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
              boxShadow: 'calc(4px * var(--shk, 1)) calc(4px * var(--shk, 1)) 0 #b45309',
              fontWeight: 800,
              fontSize: 15,
              textDecoration: 'none'
            }}
          >
            <span>{lang === 'bn' ? 'লেখক হতে আবেদন করুন' : 'Apply as an author'}</span>
            <IArrowRight />
          </a>
        </section>
      </main>
    </div>
  );
}
