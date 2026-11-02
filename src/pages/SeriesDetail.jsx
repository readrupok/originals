import React, { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { IArrowLeft, IArrowRight, IFlip, IPlay, IStar } from '../components/icons';
import FollowButton from '../components/FollowButton';
import ShareBar from '../components/ShareBar';

const face = {
  position: 'absolute',
  inset: 0,
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: 18,
  borderRadius: 16,
  border: '2px solid #f4f1ea'
};

export default function SeriesDetail({ lang, base, series, sid, num, openPay, t, user }) {
  const [ep, setEp] = useState(-1);
  const heroRef = useRef(null);

  const all = series || [];
  const i = Math.max(0, all.findIndex(x => x.k === sid));
  const s = all[i] || { tags: [], eps: [] };

  const prev = all[(i - 1 + all.length) % all.length] || {};
  const next = all[(i + 1) % all.length] || {};

  useEffect(() => {
    setEp(-1);
    if (s.ac) {
      document.documentElement.style.setProperty('--acc', s.ac);
    }
  }, [sid, s.ac]);

  const move = e => {
    const el = heroRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    el.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };

  const leave = () => {
    const el = heroRef.current;
    if (el) {
      el.style.setProperty('--mx', 0);
      el.style.setProperty('--my', 0);
    }
  };

  const cardStyle = c => ({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '28px 30px',
    minHeight: 150,
    borderRadius: 16,
    background: 'var(--card, var(--card, #fff))',
    border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
    boxShadow: `calc(6px * var(--shk, 1)) calc(6px * var(--shk, 1)) 0 ${c}`,
    color: 'var(--ink, var(--ink, #151515))',
    textDecoration: 'none',
    overflow: 'hidden',
    transition: 'transform 0.2s'
  });

  const foldStyle = c => ({
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 56,
    height: 56,
    background: `linear-gradient(135deg, #fff 0 50%, ${c} 50%)`,
    borderTopLeftRadius: 8,
    boxShadow: '-3px -3px 0 rgba(21, 21, 21, 0.08)'
  });

  const burstText = s.prod ? t.burstP : t.burstD;

  return (
    <div style={{ color: 'var(--ink, var(--ink, #151515))' }}>
      {/* Hero */}
      <header
        ref={heroRef}
        onMouseMove={move}
        onMouseLeave={leave}
        data-screen-label="Series detail — Hero"
        style={{
          position: 'relative',
          padding: 'clamp(24px, 3vw, 40px) clamp(12px, 1.8vw, 24px) clamp(56px, 6vw, 88px)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 25% 55%, color-mix(in srgb, var(--acc) 22%, transparent), transparent 60%)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.16,
            backgroundImage: 'radial-gradient(var(--acc) 1.4px, transparent 1.8px)',
            backgroundSize: '10px 10px',
            WebkitMaskImage: 'linear-gradient(90deg, #000, transparent 55%)',
            maskImage: 'linear-gradient(90deg, #000, transparent 55%)'
          }}
        />

        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%', position: 'relative' }}>
          {/* Breadcrumb */}
          <nav style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 'clamp(24px, 3vw, 40px)', fontSize: 14, fontWeight: 700 }}>
            <a href={`${base}/series`} style={{ padding: '6px 12px', border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)', borderRadius: 10, background: 'var(--card, var(--card, #fff))', textDecoration: 'none' }}>
              <IArrowLeft /> {t.crumbSeries}
            </a>
            <span style={{ color: 'var(--muted, #6b675e)' }}>/</span>
            <span>{s.title}</span>
          </nav>

          <div className="series-detail-hero-layout" style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 'clamp(36px, 5vw, 80px)', alignItems: 'center' }}>
            {/* 3D Tilted Poster with Starburst */}
            <div className="series-detail-cover-container" style={{ position: 'relative', flex: '0 1 420px', minWidth: 'min(100%, 260px)', perspective: 1200 }}>
              <div
                style={{
                  position: 'relative',
                  aspectRatio: '2/3',
                  border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                  borderRadius: 18,
                  overflow: 'hidden',
                  background: 'var(--ink-bg, #151515)',
                  boxShadow: 'calc(14px * var(--shk, 1)) calc(14px * var(--shk, 1)) 0 var(--acc)',
                  transform: 'rotateY(calc(var(--mx, 0) * 12deg)) rotateX(calc(var(--my, 0) * -10deg)) rotate(-2deg)',
                  transition: 'transform 0.25s ease-out, box-shadow 0.7s'
                }}
              >
                <img src={s.poster} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background: 'linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.25) 50%, transparent 62%)',
                    transform: 'translateX(calc(var(--mx, 0) * 50%))',
                    mixBlendMode: 'screen'
                  }}
                />
              </div>

              {/* Comic Starburst Badge */}
              <span
                style={{
                  position: 'absolute',
                  right: 'max(-18px, -1.2vw)',
                  top: -22,
                  width: 'clamp(104px, 28vw, 128px)',
                  height: 'clamp(104px, 28vw, 128px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: 22,
                  background: s.prod ? 'var(--acc)' : 'var(--card, var(--card, #fff))',
                  color: s.prod ? '#fff' : 'var(--ink, var(--ink, #151515))',
                  clipPath:
                    'polygon(50% 0, 61% 20%, 83% 10%, 79% 34%, 100% 42%, 82% 58%, 94% 80%, 70% 78%, 60% 100%, 47% 82%, 26% 96%, 25% 72%, 2% 70%, 16% 52%, 0 32%, 24% 28%, 20% 6%, 40% 18%)',
                  fontFamily: "'Bangers', 'Hind Siliguri', cursive",
                  fontSize: 17,
                  lineHeight: 1,
                  letterSpacing: '.03em',
                  transform: 'rotate(10deg)',
                  animation: 'rs-wig 3.4s ease-in-out infinite',
                  filter: 'drop-shadow(calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 var(--ink, #151515))'
                }}
              >
                {burstText}
              </span>
            </div>

            {/* Details Content */}
            <div style={{ flex: '1 1 440px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <span style={{ fontFamily: "'Bangers', cursive", fontSize: 'clamp(40px, 4vw, 60px)', lineHeight: 0.9, color: 'var(--acc)' }}>
                #{s.num}
              </span>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
                  fontWeight: 800,
                  fontSize: 'clamp(40px, 5.5vw, 84px)',
                  lineHeight: 0.98,
                  letterSpacing: '-.045em',
                  textWrap: 'balance'
                }}
              >
                {s.title}
              </h1>
              <span
                style={{
                  alignSelf: 'flex-start',
                  padding: '7px 14px',
                  borderRadius: 10,
                  background: 'var(--acc)',
                  color: '#fff',
                  border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                  fontWeight: 700,
                  fontSize: 'clamp(15px, 1.3vw, 18px)',
                  boxShadow: 'calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 var(--ink, #151515)'
                }}
              >
                {s.sub}
              </span>

              {/* Premium Note Banner if applicable */}
              {s.paid && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                    border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                    borderRadius: 14,
                    background: '#fff8dc',
                    boxShadow: 'calc(4px * var(--shk, 1)) calc(4px * var(--shk, 1)) 0 #f5c542'
                  }}
                >
                  <span style={{ padding: '4px 11px', borderRadius: 999, background: '#f5c542', border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)', fontWeight: 800, fontSize: 13 }}>
                    <IStar /> {t.premium}
                  </span>
                  <span style={{ flex: 1, minWidth: 200, fontSize: 15, lineHeight: 1.45 }}>
                    {s.locked ? t.noteLocked : t.noteOpen}
                  </span>
                  {s.locked && (
                    <button
                      onClick={() => openPay && openPay(s.k, 'series')}
                      style={{
                        padding: '11px 16px',
                        borderRadius: 12,
                        border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                        background: 'var(--ink-bg, #151515)',
                        color: '#fff',
                        font: 'inherit',
                        fontWeight: 800,
                        fontSize: 14,
                        cursor: 'pointer',
                        boxShadow: 'calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 #f5c542'
                      }}
                    >
                      {t.unlockPass} · {s.passPrice}
                    </button>
                  )}
                </div>
              )}

              <p style={{ margin: 0, maxWidth: 640, fontSize: 'clamp(17px, 1.4vw, 19px)', lineHeight: 1.65, textWrap: 'pretty' }}>
                {s.log}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {s.tags?.map(g => (
                  <span key={g} style={{ padding: '6px 13px', border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)', borderRadius: 999, background: 'var(--card, var(--card, #fff))', fontSize: 14, fontWeight: 700 }}>
                    {g}
                  </span>
                ))}
              </div>

              {/* Quick Facts Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginTop: 6 }}>
                {[
                  { v: s.epCount, l: t.eps },
                  { v: num(3, lang), l: t.perEp },
                  { v: s.runtime, l: t.total }
                ].map(f => (
                  <div key={f.l} style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 16px', border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)', borderRadius: 14, background: 'var(--card, var(--card, #fff))', boxShadow: 'calc(4px * var(--shk, 1)) calc(4px * var(--shk, 1)) 0 var(--ink, #151515)' }}>
                    <span style={{ fontFamily: "var(--font-display, 'Sora', sans-serif)", fontWeight: 800, fontSize: 30, lineHeight: 1 }}>
                      {f.v}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted-2, #55524a)' }}>
                      {f.l}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
                <a
                  href={t.ytUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => api.track('video_view')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '15px 24px',
                    borderRadius: 14,
                    background: 'var(--ink-bg, #151515)',
                    color: '#fff',
                    border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                    boxShadow: 'calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 var(--acc)',
                    fontWeight: 700,
                    fontSize: 15,
                    textDecoration: 'none',
                    transition: 'transform 0.15s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translate(-2px, -2px)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.color = '#fff';
                  }}
                >
                  <IPlay /> {t.watch}
                </a>
                {s.comicHref && (
                  <a
                    href={s.comicHref}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '15px 24px',
                      borderRadius: 14,
                      background: 'var(--card, var(--card, #fff))',
                      color: 'var(--ink, var(--ink, #151515))',
                      border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                      boxShadow: 'calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 var(--ink, #151515)',
                      fontWeight: 700,
                      fontSize: 15,
                      textDecoration: 'none'
                    }}
                  >
                    {t.readComic} <IArrowRight />
                  </a>
                )}
              </div>

              {/* Follow for the next episode or issue; share to bring someone along */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 10, paddingTop: 18, borderTop: '2px solid rgba(21,21,21,.12)' }}>
                <FollowButton type="series" targetKey={s.k} user={user} t={t} num={num} lang={lang} base={base} />
                <ShareBar path={`/series/${s.k}`} title={s.title} t={t} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Banner Section if series has banner */}
      {s.hasBanner && (
        <section data-screen-label="Series detail — Banner" style={{ padding: '0 clamp(12px, 1.8vw, 24px) clamp(48px, 6vw, 80px)' }}>
          <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
            <div style={{ position: 'relative', aspectRatio: '16/9', maxHeight: 'min(440px, 48vh)', border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)', borderRadius: 20, overflow: 'hidden', boxShadow: 'calc(8px * var(--shk, 1)) calc(8px * var(--shk, 1)) 0 var(--ink, #151515)' }}>
              <img src={s.banner.startsWith('/') || /^https:\/\//.test(s.banner) ? s.banner : `/${s.banner}`} alt={`${s.title} banner`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          </div>
        </section>
      )}

      {/* Episode Guide Section */}
      <section data-screen-label="Series detail — Episodes" style={{ padding: 'clamp(48px, 6vw, 88px) clamp(12px, 1.8vw, 24px)', background: 'var(--ink-bg, #151515)', color: '#f4f1ea' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800, fontSize: 'clamp(36px, 4.6vw, 68px)', lineHeight: 1, letterSpacing: '-.04em' }}>
              {t.epGuide}
            </h2>
            <span style={{ padding: '7px 14px', borderRadius: 10, background: 'var(--acc)', color: '#fff', fontWeight: 700, fontSize: 15 }}>
              {t.fmt(s.epCount, num(3, lang))}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: 16 }}>
            {s.eps?.map((e, j) => {
              const on = ep === j;
              const isLocked = s.locked && j > 0;
              const episodeStatus = isLocked ? t.lockedEp : e.live ? t.live : s.paid && j === 0 ? t.freeEp : t.scripted;

              return (
                <div
                  key={j}
                  onClick={() => setEp(curr => (curr === j ? -1 : j))}
                  onMouseEnter={() => setEp(j)}
                  onMouseLeave={() => setEp(-1)}
                  role="button"
                  tabIndex={0}
                  style={{
                    perspective: 900,
                    height: 170,
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.55s cubic-bezier(.2,.8,.2,1)',
                      transform: on ? 'rotateX(-180deg)' : 'none'
                    }}
                  >
                    {/* FRONT FACE */}
                    <div
                      style={{
                        ...face,
                        background: e.live ? 'rgba(244, 241, 234, 0.12)' : 'rgba(244, 241, 234, 0.04)',
                        visibility: on ? 'hidden' : 'visible',
                        transition: 'visibility 0s 0.22s'
                      }}
                    >
                      <span style={{ fontFamily: "'Bangers', cursive", fontSize: 52, lineHeight: 0.9, color: 'var(--acc)' }}>
                        {e.n}
                      </span>
                      <span style={{ fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>
                        {e.t}
                      </span>
                      <span
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: 12,
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          fontWeight: 800,
                          background: isLocked ? '#f5c542' : 'rgba(244, 241, 234, 0.14)',
                          color: isLocked ? 'var(--ink, var(--ink, #151515))' : '#f4f1ea',
                          border: '2px solid ' + (isLocked ? 'var(--ink, var(--ink, #151515))' : 'rgba(244, 241, 234, 0.3)')
                        }}
                      >
                        {isLocked ? <IStar /> : <IFlip />}
                      </span>
                    </div>

                    {/* BACK FACE */}
                    <div
                      style={{
                        ...face,
                        transform: 'rotateX(180deg)',
                        background: isLocked ? '#f5c542' : e.live ? 'var(--acc)' : 'var(--paper, var(--paper, #f4f1ea))',
                        color: e.live && !isLocked ? '#fff' : 'var(--ink, var(--ink, #151515))',
                        borderColor: 'var(--edge, #151515)',
                        visibility: on ? 'visible' : 'hidden',
                        transition: 'visibility 0s 0.22s'
                      }}
                    >
                      <span style={{ fontFamily: "'Bangers', 'Hind Siliguri', cursive", fontSize: 30, letterSpacing: '.03em', lineHeight: 1 }}>
                        {episodeStatus}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>
                        {t.ep} {e.n} · {num(3, lang)} {t.min}
                      </span>
                      {e.live && e.url && !isLocked && (
                        <a
                          href={e.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={ev => { ev.stopPropagation(); api.track('video_view'); }}
                          style={{
                            alignSelf: 'flex-start',
                            marginTop: 4,
                            padding: '6px 12px',
                            borderRadius: 10,
                            background: 'var(--paper, var(--paper, #f4f1ea))',
                            color: 'var(--ink, var(--ink, #151515))',
                            fontWeight: 800,
                            fontSize: 13,
                            textDecoration: 'none'
                          }}
                        >
                          <IPlay /> {t.watch}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Turn the page navigation cards */}
      <section
        data-screen-label="Series detail — Turn the page"
        style={{
          padding: 'clamp(48px, 6vw, 88px) clamp(12px, 1.8vw, 24px) clamp(72px, 8vw, 112px)'
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
            gap: 20
          }}
        >
          <a
            href={prev.href}
            style={cardStyle(prev.ac || 'var(--ink, var(--ink, #151515))')}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translate(-3px, -3px) rotate(-.5deg)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted, #6b675e)' }}>
              <IArrowLeft /> {t.prevSeries}
            </span>
            <span style={{ fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800, fontSize: 'clamp(24px, 2.4vw, 34px)', lineHeight: 1.05, letterSpacing: '-.03em' }}>
              {prev.title}
            </span>
            <span style={foldStyle(prev.ac || 'var(--ink, var(--ink, #151515))')} />
          </a>

          <a
            href={next.href}
            style={cardStyle(next.ac || 'var(--ink, var(--ink, #151515))')}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translate(-3px, -3px) rotate(.5deg)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted, #6b675e)' }}>
              {t.nextSeries} <IArrowRight />
            </span>
            <span style={{ fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800, fontSize: 'clamp(24px, 2.4vw, 34px)', lineHeight: 1.05, letterSpacing: '-.03em' }}>
              {next.title}
            </span>
            <span style={foldStyle(next.ac || 'var(--ink, var(--ink, #151515))')} />
          </a>
        </div>
      </section>
    </div>
  );
}
