import React, { useState } from 'react';
import { INK } from '../data/content';
import { IArrowRight, IBook } from './icons';

// ---------------------------------------------------------------------------
// 3D Interactive Bookshelf for Authors (styled similarly to the Comics Shelf)
//
// Left: Prominent 3D Active Work Showcase on a wooden display stand.
// Right: Physical Wooden Bookshelf with tactile spines, hover lifts, and brass brackets.
// ---------------------------------------------------------------------------

const H = [120, 110, 126, 106, 118, 112, 122];
const W = [52, 48, 56, 44, 50, 46, 52];

export default function Bookshelf({ items = [], label, lang, base }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [hoverIdx, setHoverIdx] = useState(-1);

  if (!items || !items.length) return null;

  const active = items[selectedIdx] || items[0];
  const ac = active.ac || '#6f6758';

  return (
    <section aria-label={label} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h2 style={{
            margin: 0,
            fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
            fontSize: 'clamp(22px, 2.5vw, 32px)',
            fontWeight: 800,
            letterSpacing: '-.03em',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <IBook /> {label}
          </h2>
          <span style={{
            padding: '3px 10px',
            borderRadius: 999,
            border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
            background: 'var(--card, var(--card, #fff))',
            fontWeight: 800,
            fontSize: 12
          }}>
            {items.length} {lang === 'bn' ? 'টি লেখা' : 'pieces'}
          </span>
        </div>
      )}

      {/* 2-Column Shelf Grid */}
      <div
        className="shelf-grid-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
          gap: 'clamp(24px, 3vw, 48px)',
          alignItems: 'center',
          color: INK,
          width: '100%',
          border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
          borderRadius: 20,
          background: 'linear-gradient(180deg, #f9f6ee 0%, #efebe0 100%)',
          padding: 'clamp(20px, 3vw, 36px)',
          boxShadow: `calc(6px * var(--shk, 1)) calc(6px * var(--shk, 1)) 0 ${INK}`
        }}
      >
        {/* Left: Active Work 3D Showcase */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '10px 0 16px',
              perspective: 1000
            }}
          >
            {/* 3D 3:4 Book Cover Display */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                width: 'min(240px, 70vw)',
                maxWidth: 260
              }}
            >
              <a
                href={active.href}
                style={{
                  position: 'relative',
                  display: 'block',
                  width: '100%',
                  aspectRatio: '3 / 4',
                  border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                  borderRadius: '4px 10px 10px 4px',
                  overflow: 'hidden',
                  background: active.cover ? 'var(--ink-bg, #151515)' : ac,
                  boxShadow: `calc(10px * var(--shk, 1)) calc(10px * var(--shk, 1)) 0 ${ac}`,
                  transform: 'rotateY(-6deg) rotate(-1deg)',
                  transformOrigin: 'bottom center',
                  transition: 'box-shadow 0.35s ease, transform 0.3s ease',
                  textDecoration: 'none'
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'rotateY(0deg) scale(1.02)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'rotateY(-6deg) rotate(-1deg)')}
              >
                {active.cover ? (
                  <img
                    src={active.cover}
                    alt={active.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(135deg, ${ac} 0%, ${ac}dd 100%)`,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 16,
                    color: '#fff',
                    boxSizing: 'border-box'
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', opacity: 0.9 }}>
                      {active.kind || 'BOOK'}
                    </span>
                    <strong style={{
                      fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
                      fontWeight: 800,
                      fontSize: 'clamp(18px, 2vw, 24px)',
                      lineHeight: 1.2,
                      textShadow: 'calc(2px * var(--shk, 1)) calc(2px * var(--shk, 1)) 0 rgba(0,0,0,0.3)'
                    }}>
                      {active.title}
                    </strong>
                  </div>
                )}

                {/* Left book spine gradient highlight */}
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 14,
                    background: 'linear-gradient(90deg, rgba(0,0,0,.45), rgba(255,255,255,.12) 60%, transparent)',
                    pointerEvents: 'none'
                  }}
                />

                {/* Subtle book sheen */}
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(120deg, transparent 40%, rgba(255,255,255,.22) 52%, transparent 64%)',
                    mixBlendMode: 'screen',
                    pointerEvents: 'none'
                  }}
                />

                {/* Kind badge */}
                {active.kind && (
                  <span
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 12,
                      padding: '4px 10px',
                      background: 'var(--card, var(--card, #fff))',
                      border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                      fontWeight: 800,
                      fontSize: 11.5,
                      borderRadius: 999,
                      boxShadow: `calc(2px * var(--shk, 1)) calc(2px * var(--shk, 1)) 0 ${INK}`
                    }}
                  >
                    {active.kind}
                  </span>
                )}
              </a>

              {/* Wooden shelf ledge supporting the book */}
              <span
                style={{
                  display: 'block',
                  position: 'relative',
                  height: 14,
                  width: 'calc(100% + 24px)',
                  margin: '4px -12px 0',
                  background: 'linear-gradient(180deg, #c7924c 0%, #8b5523 50%, #5c3514 100%)',
                  border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                  borderRadius: 3,
                  boxShadow: `0 4px 6px rgba(0,0,0,.25)`
                }}
              />
            </div>
          </div>

          {/* Details below showcase */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h3
              style={{
                margin: 0,
                fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
                fontWeight: 800,
                fontSize: 'clamp(22px, 2.4vw, 30px)',
                lineHeight: 1.15
              }}
            >
              {active.title}
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--muted, #6b675e)', fontWeight: 700 }}>
              {active.minutes && <span>{active.minutes} min read</span>}
              {active.chapters > 0 && <span>· {active.chapters} chapters</span>}
              {active.language && <span>· {active.language.toUpperCase()}</span>}
            </div>

            {active.summary && (
              <p style={{
                margin: 0,
                fontSize: 14.5,
                lineHeight: 1.6,
                color: 'var(--muted-2, #55524a)',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {active.summary}
              </p>
            )}

            <a
              href={active.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                alignSelf: 'flex-start',
                marginTop: 6,
                padding: '10px 18px',
                borderRadius: 12,
                border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                background: 'var(--ink-bg, #151515)',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: 14,
                boxShadow: `calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 ${ac}`,
                transition: 'transform 0.15s, box-shadow 0.15s'
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translate(-2px, -2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
            >
              {lang === 'bn' ? 'পড়ুন' : 'Read'} <IArrowRight />
            </a>
          </div>
        </div>

        {/* Right: Physical Wooden Bookshelf with Spines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              position: 'relative',
              border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
              borderRadius: 16,
              background: '#231f1c',
              padding: '30px clamp(16px, 2.5vw, 28px) 0',
              overflow: 'hidden',
              boxShadow: `inset 0 10px 24px rgba(0,0,0,.6), calc(6px * var(--shk, 1)) calc(6px * var(--shk, 1)) 0 ${INK}`
            }}
          >
            {/* Row of Spines */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 'clamp(8px, 1.2vw, 14px)',
                minHeight: 150,
                overflowX: 'auto',
                paddingBottom: 4,
                scrollbarWidth: 'thin'
              }}
            >
              {items.map((item, i) => {
                const itemAc = item.ac || '#6f6758';
                const isSelected = selectedIdx === i;
                const isHovered = hoverIdx === i;
                const h = H[i % H.length] + (isSelected ? 16 : isHovered ? 8 : 0);
                const w = W[i % W.length];

                return (
                  <button
                    key={item.k ?? i}
                    type="button"
                    title={item.title}
                    onClick={() => { setSelectedIdx(i); }}
                    onMouseEnter={() => setHoverIdx(i)}
                    onMouseLeave={() => setHoverIdx(-1)}
                    onFocus={() => setHoverIdx(i)}
                    onBlur={() => setHoverIdx(-1)}
                    style={{
                      flex: 'none',
                      width: w,
                      height: h,
                      border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                      borderRadius: '4px 4px 2px 2px',
                      background: item.cover
                        ? `${itemAc} url(${item.cover}) center/cover`
                        : `linear-gradient(170deg, ${itemAc} 0%, ${itemAc}cc 100%)`,
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      padding: 0,
                      transition: 'height 180ms ease, transform 180ms ease, box-shadow 180ms ease',
                      boxShadow: isSelected
                        ? `0 -6px 0 ${INK}, 0 0 14px ${itemAc}99`
                        : isHovered
                          ? `0 -4px 0 var(--ink, #151515), 0 0 8px ${itemAc}55`
                          : 'none',
                      transform: isSelected ? 'scale(1.04) translateY(-2px)' : isHovered ? 'scale(1.02)' : 'none'
                    }}
                  >
                    {/* Spine Title text running vertically */}
                    <span
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
                        fontWeight: 800,
                        fontSize: 12,
                        lineHeight: 1.1,
                        letterSpacing: '.01em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxHeight: '86%',
                        padding: '6px 2px',
                        textShadow: '0 1px 3px rgba(0,0,0,.7)',
                        background: 'rgba(0,0,0,.35)',
                        borderRadius: 3,
                        boxSizing: 'border-box'
                      }}
                    >
                      {item.title}
                    </span>

                    {/* Active book marker dot */}
                    {isSelected && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 4,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#f5c542',
                          boxShadow: '0 0 4px #f5c542'
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Heavy Timber Wooden Shelf Board */}
            <div
              style={{
                height: 16,
                background: 'linear-gradient(180deg, #b07d3b 0%, #7d4d20 50%, #4a2d12 100%)',
                borderTop: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                margin: '0 -28px',
                position: 'relative',
                boxShadow: '0 4px 8px rgba(0,0,0,.5)'
              }}
            >
              {/* Brass angle shelf brackets */}
              <span style={{ position: 'absolute', left: 40, top: 0, bottom: -6, width: 8, background: '#eab308', border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`, borderRadius: '0 0 2px 2px' }} />
              <span style={{ position: 'absolute', right: 40, top: 0, bottom: -6, width: 8, background: '#eab308', border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`, borderRadius: '0 0 2px 2px' }} />
            </div>

            {/* Bottom shelf status strip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 4px 14px',
                fontSize: 13,
                color: '#a8a29e'
              }}
            >
              <span style={{ color: '#f4f1ea', fontWeight: 700 }}>
                {lang === 'bn' ? 'সংক্ষিপ্ত বিবরণ দেখতে যেকোনো বইয়ের পিঠে ক্লিক করুন' : 'Select any spine to see a preview'}
              </span>
              <span style={{ fontSize: 12, opacity: 0.8 }}>
                {selectedIdx + 1} / {items.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
