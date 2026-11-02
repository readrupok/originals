import React, { useState } from 'react';
import { IPlay, IStar } from '../components/icons';
import { SocialButtons } from '../components/SocialIcons';

export default function Watch({ lang, series, t }) {
  const [hoverRow, setHoverRow] = useState(null);

  const featured = series.find(s => s.prod) || series[0] || {};
  const bansher = featured.title;
  const liveEp = (featured.eps || []).find(e => e.live && e.url);

  return (
    <div style={{ color: 'var(--ink, var(--ink, #151515))' }}>
      {/* Header */}
      <header
        data-screen-label="Watch — Header"
        style={{ padding: 'clamp(28px, 4.5vh, 64px) clamp(12px, 1.8vw, 24px) clamp(20px, 3vh, 32px)' }}
      >
        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px clamp(24px, 3vw, 48px)' }}>
          <div style={{ flex: '1 1 460px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span
              style={{
                alignSelf: 'flex-start',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                borderRadius: 999,
                background: 'var(--card, var(--card, #fff))',
                fontWeight: 800,
                fontSize: 13,
                boxShadow: 'calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 var(--ink, #151515)'
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#e11d48',
                  animation: 'rs-bob 1.2s ease-in-out infinite'
                }}
              />
              {t.eyebrowWatch}
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
              {t.h1Watch}
            </h1>
          </div>
          <p style={{ margin: 0, flex: '0 1 540px', maxWidth: 540, fontSize: 'clamp(16px, 1.3vw, 19px)', lineHeight: 1.6, color: 'var(--muted-2, #55524a)' }}>
            {t.bodyWatch}
          </p>
        </div>
      </header>

      {/* Featured Video Screen */}
      <section data-screen-label="Watch — Screen" style={{ padding: '4px clamp(12px, 1.8vw, 24px) 0' }}>
        <div
          style={{
            position: 'relative',
            maxWidth: 960,
            width: '100%',
            margin: '0 auto',
            padding: 'clamp(6px, 1vw, 10px)',
            borderRadius: 16,
            background: 'var(--ink-bg, #151515)',
            boxShadow: 'calc(6px * var(--shk, 1)) calc(6px * var(--shk, 1)) 0 #b45309'
          }}
        >
          <a
            href={liveEp?.url || t.ytUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: 'relative',
              display: 'block',
              width: '100%',
              aspectRatio: '16/9',
              borderRadius: 12,
              overflow: 'hidden',
              color: '#fff',
              textDecoration: 'none'
            }}
          >
            <div style={{ position: 'absolute', inset: 0 }}>
              {featured.banner ? (
                <img src={featured.banner} alt="Trailer thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                // No wide banner: show the whole 2:3 poster over a blurred copy of itself, never a crop
                <>
                  <img src={featured.poster} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(24px) brightness(.55)', transform: 'scale(1.15)' }} />
                  <img src={featured.poster} alt="Trailer thumbnail" style={{ position: 'relative', height: '100%', aspectRatio: '2/3', margin: '0 auto', objectFit: 'cover', display: 'block' }} />
                </>
              )}
            </div>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background:
                  'linear-gradient(0deg, rgba(0,0,0,.85), rgba(0,0,0,0) 55%), repeating-linear-gradient(0deg, rgba(0,0,0,.08) 0 2px, transparent 2px 4px)'
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'clamp(48px, 4.5vw, 64px)',
                aspectRatio: '1',
                borderRadius: '50%',
                background: 'var(--card, var(--card, #fff))',
                color: 'var(--ink, var(--ink, #151515))',
                border: 'calc(3px * var(--bwk, 1)) solid var(--edge, #151515)',
                fontSize: 'clamp(18px, 1.8vw, 24px)',
                boxShadow: 'calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 #b45309',
                transition: 'transform 0.25s'
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.1)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)')}
            >
              <IPlay />
            </span>
            <span
              style={{
                position: 'absolute',
                left: 'clamp(12px, 2vw, 24px)',
                bottom: 'clamp(12px, 2vw, 20px)',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <span
                style={{
                  alignSelf: 'flex-start',
                  padding: '2px 8px',
                  borderRadius: 5,
                  background: '#b45309',
                  fontWeight: 700,
                  fontSize: 11
                }}
              >
                {t.trailerK}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
                  fontWeight: 800,
                  fontSize: 'clamp(16px, 2vw, 28px)',
                  lineHeight: 1.05,
                  letterSpacing: '-.03em'
                }}
              >
                {bansher}
              </span>
            </span>
          </a>

          <span
            style={{
              position: 'absolute',
              right: 18,
              top: -10,
              padding: '3px 9px',
              borderRadius: 6,
              background: '#e11d48',
              color: '#fff',
              border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
              fontFamily: "'Bangers', cursive",
              fontSize: 13,
              letterSpacing: '.06em'
            }}
          >
            ON AIR SOON
          </span>
        </div>
      </section>

      {/* Release Board */}
      <section data-screen-label="Watch — Release board" style={{ padding: 'clamp(36px, 5vh, 64px) clamp(12px, 1.8vw, 24px)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
          <h2 style={{ margin: '0 0 20px', fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800, fontSize: 'clamp(26px, 3.2vw, 42px)', lineHeight: 1.1, letterSpacing: '-.035em' }}>
            {t.board}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))', gap: 12 }}>
            {series.map(s => {
              const on = hoverRow === s.k;
              return (
                <a
                  key={s.k}
                  href={s.href}
                  onMouseEnter={() => setHoverRow(s.k)}
                  onMouseLeave={() => setHoverRow(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 16px',
                    borderRadius: 14,
                    border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                    background: on ? s.ac : 'var(--card, var(--card, #fff))',
                    color: on ? '#fff' : 'var(--ink, var(--ink, #151515))',
                    textDecoration: 'none',
                    boxShadow: on ? 'calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 var(--ink, #151515)' : 'calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 var(--ink, #151515)',
                    transform: on ? 'translate(-2px, -2px)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <span
                    style={{
                      flex: 'none',
                      width: on ? 54 : 0,
                      aspectRatio: '2/3',
                      borderRadius: 6,
                      overflow: 'hidden',
                      border: on ? 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)' : '0 solid var(--ink, #151515)',
                      transition: 'width 0.25s'
                    }}
                  >
                    <img src={s.poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </span>
                  <span
                    style={{
                      flex: 'none',
                      width: 38,
                      fontFamily: "'Bangers', cursive",
                      fontSize: 26,
                      lineHeight: 1,
                      color: on ? '#fff' : s.ac
                    }}
                  >
                    {s.num}
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                    <span style={{ fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800, fontSize: 'clamp(16px, 1.4vw, 20px)', lineHeight: 1.2 }}>
                      {s.title}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.epCount} {t.eps} · {s.genre} · {s.paid ? <><IStar />{' '}</> : ''}{s.access}
                    </span>
                  </span>
                  <span
                    style={{
                      flex: 'none',
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      background: s.prod ? (on ? 'var(--card, var(--card, #fff))' : s.ac) : 'transparent',
                      color: s.prod ? (on ? s.ac : '#fff') : 'inherit',
                      border: '2px solid currentColor'
                    }}
                  >
                    {s.status}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* YouTube Subscribe Callout */}
      <section style={{ padding: '0 clamp(12px, 1.8vw, 24px) clamp(48px, 6vh, 80px)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 20,
              padding: 'clamp(20px, 3vw, 36px)',
              borderRadius: 20,
              background: 'var(--ink-bg, #151515)',
              color: '#f4f1ea',
              boxShadow: 'calc(6px * var(--shk, 1)) calc(6px * var(--shk, 1)) 0 #e11d48'
            }}
          >
            <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800, fontSize: 'clamp(24px, 2.8vw, 42px)', lineHeight: 1.1, letterSpacing: '-.03em' }}>
                {t.subH}
              </span>
              <span style={{ fontSize: 15, color: '#c9c5bb' }}>{t.subB}</span>
            </span>
            <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              <a
                href={t.ytUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 48, boxSizing: 'border-box', padding: '0 20px', borderRadius: 12, background: '#e11d48', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
              >
                <IPlay /> {t.subBtn}
              </a>
              <SocialButtons socials={t.socials} />
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
