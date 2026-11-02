import React, { useState } from 'react';
import { IArrowRight } from './icons';
import { Check } from 'lucide-react';

// One row of reading history.
//
// Neutral by shape — { key, title, sub, cover, ac, href, pct, done, meta, type, isLibrary, isComic }
// — with proper aspect ratios (4:3 for library works, 2:3 for comics) and spacious UI.

const INK = 'var(--ink, var(--ink, #151515))';

export default function ProgressCard({ item, resumeLabel }) {
  const ac = item.ac || '#6f6758';
  const isLibrary = Boolean(item.isLibrary || item.category === 'library' || item.key?.startsWith('w-'));
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={item.href}
      data-testid="reading-item"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        padding: '14px 16px',
        border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
        borderRadius: 16,
        background: 'var(--card, var(--card, #fff))',
        color: INK,
        textDecoration: 'none',
        boxShadow: hovered ? `calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 ${ac}` : `calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 ${INK}`,
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
        position: 'relative'
      }}
    >
      {/* Cover Showcase: 4:3 for Library, 2:3 for Comics */}
      <div
        style={{
          flex: 'none',
          width: isLibrary ? 68 : 62,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            width: '100%',
            aspectRatio: isLibrary ? '3 / 4' : '2 / 3',
            borderRadius: 8,
            border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
            overflow: 'hidden',
            background: item.cover ? 'var(--ink-bg, #151515)' : ac,
            position: 'relative',
            boxShadow: `calc(2px * var(--shk, 1)) calc(2px * var(--shk, 1)) 0 rgba(0,0,0,0.15)`
          }}
        >
          {item.cover ? (
            <img
              src={item.cover}
              alt={item.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(135deg, ${ac} 0%, ${ac}dd 100%)`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '6px 8px',
                color: '#fff',
                position: 'relative',
                boxSizing: 'border-box'
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 3,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: 'rgba(255,255,255,0.4)'
                }}
              />
              <span
                style={{
                  fontSize: 8.5,
                  fontWeight: 800,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  opacity: 0.9,
                  paddingLeft: 3
                }}
              >
                {item.type || 'WORK'}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
                  fontWeight: 800,
                  fontSize: 10.5,
                  lineHeight: 1.15,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  paddingLeft: 3,
                  textShadow: 'calc(1px * var(--shk, 1)) calc(1px * var(--shk, 1)) 0 rgba(0,0,0,0.3)'
                }}
              >
                {item.title}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content details */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minWidth: 0,
          flex: 1,
          gap: 6
        }}
      >
        {/* Top row: Type badge + Sub/Author + Circle Resume Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}>
            {item.type && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`,
                  background: isLibrary ? 'var(--card, var(--card, #fff))' : '#fef08a',
                  color: '#151515',
                  fontSize: 10.5,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '.03em',
                  flex: 'none'
                }}
              >
                {item.type}
              </span>
            )}
            {item.sub && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--muted, #6b675e)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {item.sub}
              </span>
            )}
          </div>

          <span
            aria-hidden="true"
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
              background: hovered ? ac : 'var(--ink-bg, #151515)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              flex: 'none',
              fontSize: 13,
              boxShadow: hovered ? `calc(1px * var(--shk, 1)) calc(1px * var(--shk, 1)) 0 ${INK}` : 'none',
              transform: hovered ? 'translateX(2px)' : 'none',
              transition: 'transform 0.18s ease, background 0.18s ease'
            }}
          >
            <IArrowRight />
          </span>
        </div>

        {/* Title: with ample width to not break unnecessarily */}
        <h3
          style={{
            margin: 0,
            fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
            fontWeight: 800,
            fontSize: 'clamp(15px, 1.15vw, 17px)',
            lineHeight: 1.25,
            color: INK,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {item.title}
        </h3>

        {/* Progress row */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: 'var(--muted-2, #55524a)' }}>
              {item.meta}
            </span>
            <span style={{ fontFamily: "var(--font-display, 'Sora', sans-serif)", fontWeight: 800, color: item.done ? '#16a34a' : ac, fontSize: 12 }}>
              {item.done ? <Check size={13} /> : `${item.pct}%`}
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={item.pct}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              height: 6,
              borderRadius: 99,
              border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`,
              background: '#ede8de',
              overflow: 'hidden'
            }}
          >
            <span
              style={{
                display: 'block',
                height: '100%',
                width: `${item.pct}%`,
                background: item.done ? '#16a34a' : ac,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
      </div>
    </a>
  );
}

