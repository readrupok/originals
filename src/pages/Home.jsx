import React, { useState, useEffect, useRef } from 'react';
import Shelf from '../components/Shelf';
import BooksPromo from '../components/BooksPromo';
import WorkCard from '../components/WorkCard';
import { INK, ACC0 } from '../data/content';
import { IArrowLeft, IArrowRight, IFlip, IPlay, IStar } from '../components/icons';
import { SocialButtons } from '../components/SocialIcons';

const face = {
  position: 'absolute',
  inset: 0,
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
  overflow: 'hidden'
};

export default function Home({ lang, base, series, comics, library_works = [], authors = [], num, openPay, setAccent, t, booksUrl = '' }) {
  // Film strip: copies of the slate per half so one half (posters ≤132px + 10px margin) spans 3000px
  const FILM_COPIES = Math.max(2, Math.ceil(3000 / (Math.max(1, series.length) * 142)));
  const [p, setP] = useState(0); // page index: 0 is cover, 1..7 are series, 8 is end
  const [flip, setFlip] = useState(null); // flipped trading card key
  const [seen, setSeen] = useState({});
  const [cp, setCp] = useState(0); // counter progress 0..1

  const heroRef = useRef(null);
  const stripRef = useRef(null);
  const statsRef = useRef(null);
  const shelfRef = useRef(null);
  const rafRef = useRef(null);

  const featured = series.find(s => s.prod) || series[0];
  const featuredEp = featured?.eps.find(e => e.live) || featured?.eps[0];
  const N = series.length + 1; // total leaves (cover + 7 series)

  // Count up animation for stats
  const countUp = () => {
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 1400);
      setCp(1 - Math.pow(1 - k, 3));
      if (k < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    // Keyboard navigation
    const onKey = e => {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);

    // Intersection observer for strip, stats, shelf
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const k = entry.target.dataset.io;
            setSeen(prev => {
              if (prev[k]) return prev;
              if (k === 'stats') countUp();
              return { ...prev, [k]: true };
            });
          }
        });
      },
      { threshold: 0.25 }
    );

    if (stripRef.current) {
      stripRef.current.dataset.io = 'strip';
      io.observe(stripRef.current);
    }
    if (statsRef.current) {
      statsRef.current.dataset.io = 'stats';
      io.observe(statsRef.current);
    }
    if (shelfRef.current) {
      shelfRef.current.dataset.io = 'shelf';
      io.observe(shelfRef.current);
    }

    return () => {
      window.removeEventListener('keydown', onKey);
      io.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Update accent color when page changes
  useEffect(() => {
    const s = series[p - 1];
    const acc = s ? s.ac : ACC0;
    document.documentElement.style.setProperty('--acc', acc);
    if (setAccent) setAccent(acc);
  }, [p, series]);

  const next = () => setP(curr => Math.min(N, curr + 1));
  const prev = () => setP(curr => Math.max(0, curr - 1));

  const handleHeroMove = e => {
    const el = heroRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    el.style.setProperty('--my', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };

  const totalEps = series.reduce((a, s) => a + s.epRaw, 0);
  const bursts = ['#151515', '#fff', '#151515', '#fff'];

  const arrowStyle = off => ({
    width: 48,
    height: 48,
    borderRadius: 14,
    border: '2px solid #151515',
    background: off ? 'transparent' : INK,
    color: off ? INK : '#f4f1ea',
    fontSize: 18,
    cursor: off ? 'default' : 'pointer',
    opacity: off ? 0.3 : 1,
    boxShadow: off ? 'none' : '3px 3px 0 var(--acc)',
    transition: 'all 0.2s'
  });

  return (
    <div style={{ color: '#151515' }}>
      {/* Home Hero & Marquee Ticker Wrapper */}
      <div className="home-hero-ticker-wrap">
        {/* Hero: 3D Comic Flip Book */}
        <header
          ref={heroRef}
          onMouseMove={handleHeroMove}
          data-screen-label="Home — Flip book"
          className="home-hero-section"
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-evenly',
            gap: 'clamp(14px, 2.2vh, 28px)',
            minHeight: '100svh',
            // The transparent bar sits over the hero's top edge
            padding: 'calc(var(--nav-h, 68px) + clamp(28px, 4vh, 56px)) clamp(12px, 1.8vw, 24px) clamp(16px, 2.2vh, 32px)',
            overflow: 'hidden',
            boxSizing: 'border-box'
          }}
        >
          {/* Ambient colored background aura */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: p === 0 ? 1 : 0.35,
              transition: 'opacity 0.8s',
              background: `radial-gradient(circle at 12% 28%, ${(series[0] || {}).ac || '#b45309'}24, transparent 26%), radial-gradient(circle at 88% 22%, ${(series[2] || {}).ac || '#1d6fa5'}22, transparent 26%), radial-gradient(circle at 82% 82%, ${(series[5] || {}).ac || '#3f7d20'}20, transparent 28%), radial-gradient(circle at 16% 86%, ${(series[6] || {}).ac || '#6d28d9'}1f, transparent 26%)`
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '56%',
              width: 'min(1400px, 140vw)',
              height: 900,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, color-mix(in srgb, var(--acc) 26%, transparent), transparent 62%)',
              pointerEvents: 'none'
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundImage:
                'repeating-conic-gradient(from 0deg at 50% 60%, color-mix(in srgb, var(--acc) 9%, transparent) 0deg 3deg, transparent 3deg 12deg)',
              WebkitMaskImage: 'radial-gradient(circle at 50% 60%, #000, transparent 70%)',
              maskImage: 'radial-gradient(circle at 50% 60%, #000, transparent 70%)'
            }}
          />

          {/* Title */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', marginBottom: 'clamp(8px, 2vh, 20px)' }}>
            <h1
              style={{
                margin: 0,
                fontFamily: "'Sora', 'Hind Siliguri', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(36px, min(5vw, 7vh), 80px)',
                lineHeight: 1,
                letterSpacing: '-.045em',
                textWrap: 'balance'
              }}
            >
              {t.homeHeroA}{' '}
              <span style={{ color: 'var(--acc)', transition: 'color 0.7s' }}>
                {t.homeHeroB}
              </span>
            </h1>
            <span style={{ fontSize: 'clamp(16px, min(1.3vw, 2.2vh), 19px)', color: '#55524a', maxWidth: 680, lineHeight: 1.55 }}>
              {t.homeHeroBody}
            </span>
          </div>

          {/* The 3D Book Container (4:3 open book container = 2:3 ratio per page) */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              width: 'min(1120px, 100%, max(300px, calc((100svh - 430px) * (4 / 3))))',
              aspectRatio: '4 / 3',
              perspective: 2600,
              containerType: 'inline-size'
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transformStyle: 'preserve-3d',
                transform: `translateX(${p === 0 ? '-25%' : p === N ? '25%' : '0'}) rotateX(12deg)`,
                transition: 'transform 0.9s cubic-bezier(.3, .7, .2, 1)'
              }}
            >
              {/* Left and Right Bases */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '50%',
                  height: '100%',
                  background: '#fffdf7',
                  borderRadius: '10px 0 0 10px',
                  boxShadow: '0 40px 70px -30px rgba(21,21,21,.55), inset 0 0 0 2px #151515',
                  opacity: p === 0 ? 0 : 1,
                  transition: 'opacity 0.4s'
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  width: '50%',
                  height: '100%',
                  background: '#fffdf7',
                  borderRadius: '0 10px 10px 0',
                  boxShadow: '0 40px 70px -30px rgba(21,21,21,.55), inset 0 0 0 2px #151515',
                  opacity: p === N ? 0 : 1,
                  transition: 'opacity 0.4s 0.5s'
                }}
              />

              {/* Turnable 3D Leaves */}
              {Array.from({ length: N }).map((_, i) => {
                const flipped = i < p;
                const s = series[i - 1]; // current leaf series on front
                const info = series[i]; // next leaf series revealed on back

                return (
                  <div
                    key={i}
                    onClick={flipped ? prev : next}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: 0,
                      width: '50%',
                      height: '100%',
                      transformStyle: 'preserve-3d',
                      transformOrigin: 'left center',
                      transform: `rotateY(${flipped ? -180 : 0}deg)`,
                      transition: 'transform 1s cubic-bezier(.45, .05, .25, 1)',
                      zIndex: flipped ? i + 1 : N - i,
                      cursor: 'pointer'
                    }}
                  >
                    {/* FRONT FACE */}
                    <div
                      style={{
                        ...face,
                        visibility: flipped ? 'hidden' : 'visible',
                        transition: 'visibility 0s 0.45s',
                        borderRadius: '0 10px 10px 0',
                        background: '#fffdf7',
                        boxShadow: 'inset 0 0 0 2px #151515',
                        backgroundImage: 'linear-gradient(90deg, rgba(21,21,21,.14), transparent 8%)'
                      }}
                    >
                      {i === 0 ? (
                        // Cover Page
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '7%',
                            background: '#1c1a24',
                            color: '#f4f1ea',
                            backgroundImage: 'radial-gradient(rgba(244,241,234,.12) 1.3px, transparent 1.7px)',
                            backgroundSize: '9px 9px'
                          }}
                        >
                          {/* Rainbow spine stripe */}
                          <span
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              bottom: 0,
                              width: '4.5%',
                              background: `linear-gradient(180deg, ${series.map((x, j) => `${x.ac} ${(j * 100) / series.length}% ${((j + 1) * 100) / series.length}%`).join(',')})`,
                              borderRight: '2px solid #151515'
                            }}
                          />
                          <span
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontFamily: "'Bangers', 'Hind Siliguri', cursive",
                              fontSize: '2.4cqw',
                              letterSpacing: '.06em'
                            }}
                          >
                            <span>{t.homeCoverNo}</span>
                            <span>EN · বাংলা</span>
                          </span>
                          <img
                            src="/assets/logos/rupok-logo.png"
                            alt="Rupok"
                            style={{ width: '68%', height: 'auto', display: 'block', alignSelf: 'center', filter: 'invert(1)' }}
                          />
                          <span style={{ display: 'flex', flexDirection: 'column', gap: '.6cqw' }}>
                            <span style={{ fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, fontSize: '3.1cqw', lineHeight: 1.05 }}>
                              {t.homeCoverTitle}
                            </span>
                            <span
                              style={{
                                alignSelf: 'flex-start',
                                padding: '.6cqw 1.2cqw',
                                borderRadius: 99,
                                background: '#f4f1ea',
                                color: '#151515',
                                fontWeight: 700,
                                fontSize: '1.45cqw',
                                animation: 'rs-bob 2.4s ease-in-out infinite'
                              }}
                            >
                              {t.homeOpen} <IArrowRight />
                            </span>
                          </span>
                        </div>
                      ) : (
                        // Poster Page
                        <>
                          {/* The frame itself is locked to 2:3 and centred on the leaf, so a
                            poster keeps its portrait proportions whatever the page box does. */}
                          <div style={{ position: 'absolute', inset: '5%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ flex: 'none', height: '100%', aspectRatio: '2 / 3', border: '2px solid #151515', borderRadius: 4, overflow: 'hidden', background: '#151515' }}>
                              <img src={s?.poster} alt={s?.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            </div>
                          </div>
                          <span
                            style={{
                              position: 'absolute',
                              right: '3%',
                              top: '3%',
                              padding: '.5cqw 1.1cqw',
                              background: s?.paid ? '#f5c542' : s?.ac || INK,
                              color: s?.paid ? INK : '#fff',
                              border: '2px solid #151515',
                              fontFamily: "'Bangers', 'Hind Siliguri', cursive",
                              fontSize: '1.9cqw',
                              letterSpacing: '.04em',
                              transform: 'rotate(6deg)',
                              boxShadow: '3px 3px 0 #151515'
                            }}
                          >
                            {s?.paid ? <><IStar /> {t.premium}</> : s?.prod ? t.homeInProd : t.homeComingSoon}
                          </span>
                        </>
                      )}
                    </div>

                    {/* BACK FACE */}
                    <div
                      style={{
                        ...face,
                        visibility: flipped ? 'visible' : 'hidden',
                        transition: 'visibility 0s 0.45s',
                        transform: 'rotateY(180deg)',
                        borderRadius: '10px 0 0 10px',
                        background: '#fffdf7',
                        boxShadow: 'inset 0 0 0 2px #151515',
                        backgroundImage:
                          'linear-gradient(270deg, rgba(21,21,21,.14), transparent 8%), radial-gradient(rgba(21,21,21,.06) 1.2px, transparent 1.6px)',
                        backgroundSize: 'auto, 9px 9px'
                      }}
                    >
                      {info ? (
                        // Series Details
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: '1.3cqw', padding: '7% 8%' }}>
                          <span style={{ fontFamily: "'Bangers', cursive", fontSize: '6.6cqw', lineHeight: 0.9, color: info.ac }}>
                            #{info.num}
                          </span>
                          <span style={{ fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, fontSize: '3.6cqw', lineHeight: 1, letterSpacing: '-.03em' }}>
                            {info.title}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '1.7cqw', color: info.ac }}>
                            {info.sub}
                          </span>
                          <span style={{ fontSize: '1.55cqw', lineHeight: 1.55, color: '#33312b' }}>
                            {info.log}
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6cqw' }}>
                            {info.tags.map(g => (
                              <span key={g} style={{ padding: '.35cqw .9cqw', border: '1.5px solid #151515', borderRadius: 99, fontSize: '1.25cqw', fontWeight: 600 }}>
                                {g}
                              </span>
                            ))}
                          </div>
                          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1cqw', paddingTop: '1.2cqw', borderTop: '2px solid #151515', fontWeight: 700, fontSize: '1.4cqw' }}>
                            <span>
                              {info.epCount} {t.homeEpisodes} · {info.status}
                            </span>
                            <a
                              href={info.href}
                              onClick={e => e.stopPropagation()}
                              style={{ padding: '.7cqw 1.3cqw', borderRadius: '.8cqw', background: info.ac, color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap' }}
                            >
                              {t.homeOpenSeries} <IArrowRight />
                            </a>
                          </div>
                        </div>
                      ) : (
                        // End Card
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.6cqw', padding: '10%', background: '#151515', color: '#f4f1ea' }}>
                          <span style={{ fontFamily: "'Bangers', 'Hind Siliguri', cursive", fontSize: '5.4cqw', lineHeight: 0.95, letterSpacing: '.03em' }}>
                            {t.homeTbc}
                          </span>
                          <span style={{ fontSize: '1.7cqw', lineHeight: 1.5, color: '#c9c5bb' }}>
                            {t.homeTbcBody}
                          </span>
                          <a
                            href={t.ytUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ alignSelf: 'flex-start', padding: '1cqw 1.6cqw', borderRadius: '1cqw', background: '#f4f1ea', color: '#151515', fontWeight: 700, fontSize: '1.5cqw', textDecoration: 'none' }}
                          >
                            <IPlay /> {t.ytHandle}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Floating Comic Speech Bubble */}
            <div
              className="hero-speech-bubble"
              style={{
                position: 'absolute',
                left: p === 0 || p === N ? (p === 0 ? '4%' : '54%') : '-1%',
                top: p === 0 || p === N ? '-4%' : '-6%',
                zIndex: 5,
                padding: '1.2cqw 1.8cqw',
                background: '#fff',
                border: '2px solid #151515',
                borderRadius: '2.4cqw',
                fontFamily: "'Sora', 'Hind Siliguri', sans-serif",
                fontWeight: 800,
                fontSize: 'max(13px, 1.7cqw)',
                lineHeight: 1.1,
                boxShadow: '4px 4px 0 #151515',
                transform: 'translate(calc(var(--mx,0) * -16px), calc(var(--my,0) * -10px)) rotate(-4deg)',
                transition: 'left 0.9s cubic-bezier(.3,.7,.2,1), top 0.4s ease-out, transform 0.3s ease-out',
                pointerEvents: 'none'
              }}
            >
              {t.homeNextPage}
            </div>

            {/* Floating BOOM! Starburst */}
            <div
              className="hero-boom-burst"
              style={{
                position: 'absolute',
                right: p === 0 || p === N ? (p === 0 ? '6%' : '56%') : '-3%',
                bottom: '12%',
                zIndex: 5,
                width: '12cqw',
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--acc)',
                color: '#fff',
                clipPath:
                  'polygon(50% 0, 61% 20%, 83% 10%, 79% 34%, 100% 42%, 82% 58%, 94% 80%, 70% 78%, 60% 100%, 47% 82%, 26% 96%, 25% 72%, 2% 70%, 16% 52%, 0 32%, 24% 28%, 20% 6%, 40% 18%)',
                fontFamily: "'Bangers', 'Hind Siliguri', cursive",
                fontSize: '3cqw',
                letterSpacing: '.04em',
                transform: 'translate(calc(var(--mx,0) * 20px), calc(var(--my,0) * 14px))',
                transition: 'right 0.9s cubic-bezier(.3,.7,.2,1), transform 0.3s ease-out, background 0.7s',
                animation: 'rs-wig 3s ease-in-out infinite',
                pointerEvents: 'none',
                filter: 'drop-shadow(3px 3px 0 #151515)'
              }}
            >
              {t.homeBoom}
            </div>
          </div>

          {/* Flip Controls and Indicators */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 14 }}>
            <button onClick={prev} aria-label="Previous page" style={arrowStyle(p === 0)}>
              <IArrowLeft />
            </button>
            <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap', justifyContent: 'center' }}>
              {Array.from({ length: N + 1 }).map((_, i) => {
                const on = i === p;
                const s = series[i - 1];
                return (
                  <button
                    key={i}
                    onClick={() => setP(i)}
                    aria-label={i === 0 ? 'Cover' : s ? s.title : 'End'}
                    title={i === 0 ? 'Cover' : s ? s.title : 'End'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 24,
                      height: 24,
                      padding: '0 2px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'block',
                        width: on ? 28 : 12,
                        height: 12,
                        borderRadius: 999,
                        border: '2px solid #151515',
                        background: on ? (s ? s.ac : INK) : s ? s.ac + '55' : '#fff',
                        transition: 'width 0.3s'
                      }}
                    />
                  </button>
                );
              })}
            </div>
            <button onClick={next} aria-label="Next page" style={arrowStyle(p === N)}>
              <IArrowRight />
            </button>
          </div>

          <span style={{ position: 'relative', zIndex: 2, fontSize: 13, fontWeight: 600, color: '#6b675e', marginTop: -4 }}>
            {t.homeFlipHint}
          </span>
        </header>

        {/* Infinite Marquee Ticker */}
        <div
          aria-hidden="true"
          data-nav-tone="dark"
          className="home-hero-ticker"
          style={{
            position: 'relative',
            zIndex: 3,
            overflow: 'hidden',
            background: '#151515',
            color: '#f4f1ea',
            borderTop: '2px solid #151515',
            borderBottom: '2px solid #151515'
          }}
        >
          <div style={{ display: 'flex', width: 'max-content', animation: 'rs-marq 36s linear infinite' }}>
            {[...series, ...series].map((s, idx) => (
              <span
                key={`${s.k}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 22,
                  padding: '14px 22px 14px 0',
                  fontFamily: "'Bangers', 'Hind Siliguri', cursive",
                  fontSize: 'clamp(22px, 2.4vw, 32px)',
                  letterSpacing: '.05em',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{s.title}</span>
                <span style={{ color: s.ac }}><IStar /></span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Rupok Library Section (replaces Now in Production episode breakdown) */}
      <section
        ref={stripRef}
        data-screen-label="Home — Stories"
        style={{
          padding: 'clamp(64px, 7vw, 104px) clamp(12px, 1.8vw, 24px) 0'
        }}
      >
        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              gap: '16px 48px',
              marginBottom: 32
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: '#6f6758',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}>
                {t.libraryEyebrow || (lang === 'bn' ? 'নতুন লেখা' : 'New writing')}
              </span>
              <h2 style={{
                margin: 0,
                fontFamily: "'Sora', 'Hind Siliguri', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(36px, 4.8vw, 72px)',
                lineHeight: 1,
                letterSpacing: '-.04em'
              }}>
                {t.h1Library || (lang === 'bn' ? 'রূপক গল্প' : 'Rupok Stories')}
              </h2>
            </div>
            <p style={{ margin: 0, maxWidth: 520, fontSize: 17, lineHeight: 1.6, color: '#55524a' }}>
              {t.bodyLibrary || (lang === 'bn' ? 'রূপকে প্রকাশিত লেখকদের ছোটগল্প, ধারাবাহিক ও কবিতা।' : 'Short stories, serials and poetry by writers who publish with Rupok.')}
            </p>
          </div>

          {/* Grid of Top Library Works with 4:3 covers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
            gap: 'clamp(18px, 2vw, 28px)'
          }}>
            {(library_works || []).slice(0, 4).map(w => (
              <WorkCard key={w.k} w={w} lang={lang} num={num} t={t} />
            ))}
          </div>

          {/* Action Links */}
          <div style={{ marginTop: 32, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <a
              href={`${base}/stories`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 24px',
                borderRadius: 14,
                background: INK,
                color: '#fff',
                border: `2px solid ${INK}`,
                boxShadow: `5px 5px 0 ${ACC0}`,
                fontWeight: 800,
                fontSize: 15,
                textDecoration: 'none',
                transition: 'transform 0.15s, box-shadow 0.15s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translate(-2px, -2px)';
                e.currentTarget.style.boxShadow = `7px 7px 0 ${INK}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = `5px 5px 0 ${ACC0}`;
              }}
            >
              {lang === 'bn' ? 'সব গল্প দেখুন' : 'See all Stories'} <IArrowRight />
            </a>

            {(Array.isArray(t.libraryKinds) ? t.libraryKinds : []).map(([kind, label]) => (
              <a
                key={kind}
                href={`${base}/stories/${kind}`}
                style={{
                  padding: '10px 18px',
                  borderRadius: 999,
                  border: `2px solid ${INK}`,
                  background: '#fff',
                  color: INK,
                  fontWeight: 800,
                  fontSize: 13.5,
                  textDecoration: 'none',
                  boxShadow: `2px 2px 0 ${INK}`,
                  transition: 'background 0.15s, transform 0.15s'
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Animated Counter Stats Section */}
      <section
        ref={statsRef}
        data-screen-label="Home — Numbers"
        style={{
          padding: 'clamp(64px, 7vw, 104px) clamp(12px, 1.8vw, 24px) 0'
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))',
            gap: 22
          }}
        >
          {[
            [series.length, t.homeStatSeries],
            [totalEps, t.homeStatEps],
            [totalEps * 3, t.homeStatMinutes],
            [comics.length, t.homeStatComics],
            [library_works.length, t.homeStatLibrary || (lang === 'bn' ? 'প্রকাশিত গল্প' : 'Stories published')],
            [authors.length, t.homeStatAuthors || (lang === 'bn' ? 'লেখক' : 'Writers')]
          ].map(([val, label], i) => (
            <div
              key={label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 6,
                minHeight: 160,
                padding: '24px 28px',
                borderRadius: 18,
                border: '2px solid #151515',
                boxShadow: `7px 7px 0 ${(series[i % Math.max(1, series.length)] || {}).ac || '#6f6758'}`,
                background: i % 2 === 0 ? INK : '#fff',
                color: i % 2 === 0 ? '#f4f1ea' : INK,
                transform: `rotate(${[-1.5, 1, -1, 1.5, -1.2, 1.2][i % 6]}deg)`
              }}
            >
              <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 'clamp(48px, 5vw, 76px)', lineHeight: 1, letterSpacing: '-.04em' }}>
                {num(Math.round(val * cp), lang)}
              </span>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Collect all seven: 3D Collectible Trading Cards */}
      <section data-screen-label="Home — Trading cards" style={{ padding: 'clamp(64px, 7vw, 104px) clamp(12px, 1.8vw, 24px) 0' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#6b675e' }}>
                {t.homeSlateKicker}
              </span>
              <h2 style={{ margin: 0, fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, fontSize: 'clamp(36px, 4.8vw, 72px)', lineHeight: 1, letterSpacing: '-.04em' }}>
                {t.homeSlateTitle}
              </h2>
            </div>
            <span style={{ padding: '8px 14px', border: '2px solid #151515', borderRadius: 12, background: '#fff', fontWeight: 700, fontSize: 14 }}>
              {t.homeSlateHint}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '28px 22px' }}>
            {series.map((s, i) => {
              const on = flip === s.k;
              return (
                <div
                  key={s.k}
                  onClick={() => setFlip(curr => (curr === s.k ? null : s.k))}
                  onMouseEnter={() => setFlip(s.k)}
                  onMouseLeave={() => setFlip(null)}
                  role="button"
                  tabIndex={0}
                  aria-label={s.title}
                  style={{
                    display: 'block',
                    perspective: 1000,
                    aspectRatio: '2/3',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  <span
                    style={{
                      position: 'relative',
                      display: 'block',
                      width: '100%',
                      height: '100%',
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.6s cubic-bezier(.2,.8,.2,1)',
                      transform: on ? 'rotateY(180deg) translateY(-6px)' : `rotate(${[-1.5, 1, -0.5, 1.5][i % 4]}deg)`
                    }}
                  >
                    {/* FRONT */}
                    <span
                      style={{
                        ...face,
                        display: 'block',
                        visibility: on ? 'hidden' : 'visible',
                        transition: 'visibility 0s 0.25s',
                        border: '2px solid #151515',
                        borderRadius: 12,
                        background: INK,
                        boxShadow: '6px 6px 0 #151515'
                      }}
                    >
                      <img src={s.poster} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      {s.paid && (
                        <span style={{ position: 'absolute', left: -2, top: 14, padding: '4px 10px', background: '#f5c542', border: '2px solid #151515', fontWeight: 800, fontSize: 12, color: '#151515' }}>
                          <IStar /> {t.premium}
                        </span>
                      )}
                      <span
                        style={{
                          position: 'absolute',
                          right: 10,
                          bottom: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: '#fff',
                          border: '2px solid #151515',
                          boxShadow: '2px 2px 0 #151515',
                          fontSize: 18,
                          fontWeight: 800,
                          color: '#151515'
                        }}
                      >
                        <IFlip />
                      </span>
                    </span>

                    {/* BACK */}
                    <span
                      style={{
                        ...face,
                        visibility: on ? 'visible' : 'hidden',
                        transition: 'visibility 0s 0.25s',
                        transform: 'rotateY(180deg)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        padding: 18,
                        border: '2px solid #151515',
                        borderRadius: 12,
                        background: s.ac,
                        backgroundImage: 'radial-gradient(rgba(255,255,255,.14) 1.2px, transparent 1.6px)',
                        backgroundSize: '8px 8px',
                        boxShadow: '6px 6px 0 #151515',
                        color: '#fff'
                      }}
                    >
                      <span style={{ fontFamily: "'Bangers', cursive", fontSize: 44, lineHeight: 1 }}>
                        #{s.num}
                      </span>
                      <span style={{ fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, fontSize: 22, lineHeight: 1.05 }}>
                        {s.title}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 700, opacity: 0.9 }}>
                        {s.genre} · {s.access}
                      </span>
                      <span style={{ flex: 1, fontSize: 14, lineHeight: 1.5, overflow: 'hidden' }}>
                        {s.log.length > 150 ? s.log.slice(0, 147) + '…' : s.log}
                      </span>
                      <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingTop: 10, borderTop: '2px solid currentColor', fontWeight: 700, fontSize: 14 }}>
                        <span>
                          {s.epCount} {t.homeEpisodes}
                        </span>
                        <a
                          href={s.href}
                          onClick={e => e.stopPropagation()}
                          style={{ padding: '7px 12px', borderRadius: 10, background: '#fff', color: '#151515', border: '2px solid #151515', textDecoration: 'none', fontWeight: 800 }}
                        >
                          {t.homeOpen} <IArrowRight />
                        </a>
                      </span>
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comics 3D Shelf Section */}
      <section
        ref={shelfRef}
        data-screen-label="Home — Comics shelf"
        style={{ padding: 'clamp(64px, 7vw, 104px) clamp(12px, 1.8vw, 24px) 0' }}
      >
        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px 48px', marginBottom: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: '#6b675e' }}>
                {t.homeComicsKicker}
              </span>
              <h2 style={{ margin: 0, fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, fontSize: 'clamp(36px, 4.8vw, 72px)', lineHeight: 1, letterSpacing: '-.04em' }}>
                {t.homeShelfTitle}
              </h2>
            </div>
            <p style={{ margin: 0, maxWidth: 520, fontSize: 17, lineHeight: 1.6, color: '#55524a' }}>
              {t.homeShelfBody}
            </p>
          </div>

          <Shelf
            lang={lang}
            comics={comics}
            series={series}
            openPay={openPay}
            t={{ pages: t.shelfPages, read: t.shelfRead, unlock: t.shelfUnlock, free: t.shelfFree, premium: t.premium, nextShelf: t.shelfNext, plate: t.shelfPlate, hintShelf: t.shelfHint }}

          />
        </div>
      </section>

      {/* Film Reel Strip Marquee */}
      <section data-screen-label="Home — Film strip" style={{ padding: 'clamp(64px, 7vw, 104px) 0 0' }}>
        <div data-nav-tone="dark" style={{ background: '#151515', color: '#f4f1ea', transform: 'rotate(-1.5deg)', margin: '0 -20px' }}>
          <a href={t.ytUrl} target="_blank" rel="noopener noreferrer" tabIndex={-1} aria-hidden="true" style={{ display: 'block' }}>
            <span
              style={{
                display: 'block',
                height: 18,
                background: 'repeating-linear-gradient(90deg, transparent 0 14px, #f4f1ea 14px 30px, transparent 30px 44px)',
                backgroundSize: '44px 10px',
                backgroundRepeat: 'repeat-x',
                backgroundPosition: '0 4px',
                opacity: 0.9
              }}
            />
            <span style={{ display: 'block', overflow: 'hidden', padding: '10px 0' }}>
              {/* The strip slides by exactly half its length, so each half must be wider than
                the widest screen (copies of the slate per half), and the spacing is a margin on
                every poster rather than a flex gap so the two halves are exactly equal. */}
              <span style={{ display: 'flex', width: 'max-content', animation: `rs-marq ${Math.max(1, series.length) * FILM_COPIES * 3.8}s linear infinite` }}>
                {Array.from({ length: FILM_COPIES * 2 }, () => series).flat().map((f, idx) => (
                  <span key={`${f.k}-${idx}`} aria-hidden={idx >= series.length || undefined} style={{ flex: 'none', marginRight: 10, width: 'clamp(96px, 9vw, 132px)', aspectRatio: '2/3', borderRadius: 6, overflow: 'hidden', background: '#2a2a2a' }}>
                    <img src={f.poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </span>
                ))}
              </span>
            </span>
            <span
              style={{
                display: 'block',
                height: 18,
                background: 'repeating-linear-gradient(90deg, transparent 0 14px, #f4f1ea 14px 30px, transparent 30px 44px)',
                backgroundSize: '44px 10px',
                backgroundRepeat: 'repeat-x',
                backgroundPosition: '0 4px',
                opacity: 0.9
              }}
            />
          </a>
          {/* The strip overhangs the screen by 20px each side, so the padding adds it back */}
          <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%', boxSizing: 'border-box', padding: '0 calc(clamp(12px, 1.8vw, 24px) + 20px)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '22px 0 28px' }}>
              <h2 style={{ margin: 0, fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, fontSize: 'clamp(24px, 3vw, 44px)', lineHeight: 1.15, letterSpacing: '-.03em' }}>
                {t.homeYtTitle}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
                <a
                  href={t.ytUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minHeight: 48, boxSizing: 'border-box', padding: '0 22px', borderRadius: 14, background: '#f4f1ea', color: '#151515', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}
                >
                  <IPlay /> {t.homeYtBtn}
                </a>
                <SocialButtons socials={t.socials} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <BooksPromo url={booksUrl} lang={lang} theme="main" />

      {/* Call To Action */}
      <section
        data-screen-label="Home — CTA"
        style={{
          padding: 'clamp(72px, 8vw, 120px) clamp(12px, 1.8vw, 24px)'
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
            gap: 'clamp(28px, 4vw, 56px)'
          }}
        >
          <h2 style={{ margin: 0, flex: '1 1 520px', maxWidth: 720, fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, fontSize: 'clamp(36px, 4.8vw, 72px)', lineHeight: 1, letterSpacing: '-.04em', textWrap: 'balance' }}>
            {t.homeCtaTitle}
          </h2>
          <div style={{ flex: '0 1 auto', display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start' }}>
            <p style={{ margin: 0, maxWidth: 460, fontSize: 17, lineHeight: 1.6, color: '#55524a' }}>
              {t.homeCtaBody}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <a
                href={`${base}/contact`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '15px 24px',
                  borderRadius: 14,
                  background: '#151515',
                  color: '#f4f1ea',
                  border: '2px solid #151515',
                  boxShadow: '5px 5px 0 var(--acc)',
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
                  e.currentTarget.style.color = '#f4f1ea';
                }}
              >
                {t.homeCtaContact} <IArrowRight />
              </a>
              <a
                href={`${base}/studio`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '15px 24px',
                  borderRadius: 14,
                  background: '#fff',
                  color: '#151515',
                  border: '2px solid #151515',
                  boxShadow: '5px 5px 0 #151515',
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none'
                }}
              >
                {t.homeCtaAbout}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
