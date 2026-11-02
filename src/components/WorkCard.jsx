import React from 'react';
import { INK } from '../data/content';
import { IArrowRight } from './icons';

// A cover card for one piece of work. Shared by the landing page, the kind
// listings and the author bookshelf so all three stay in step.

const pairLabel = (pairs, code, fallback) =>
  (Array.isArray(pairs) ? pairs.find(p => Array.isArray(p) && p[0] === code)?.[1] : null) || fallback;

export function tilt(e) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--tx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
  el.style.setProperty('--ty', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  el.style.setProperty('--on', 1);
}

export function untilt(e) {
  const el = e.currentTarget;
  el.style.setProperty('--tx', 0);
  el.style.setProperty('--ty', 0);
  el.style.setProperty('--on', 0);
}

export default function WorkCard({ w, lang, num, t, showWriter = true }) {
  const ac = w.ac || '#6f6758';
  const kindLabel = pairLabel(t.libraryKinds, w.kind, w.kind);

  return (
    <a
      href={w.href}
      onMouseMove={tilt}
      onMouseLeave={untilt}
      style={{
        '--tx': 0, '--ty': 0, '--on': 0,
        display: 'flex', flexDirection: 'column',
        border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, borderRadius: 16, overflow: 'hidden',
        background: 'var(--card, var(--card, #fff))', color: INK, textDecoration: 'none',
        boxShadow: `calc(6px * var(--shk, 1)) calc(6px * var(--shk, 1)) 0 ${ac}`,
        transform: 'perspective(900px) rotateY(calc(var(--tx) * 3deg)) rotateX(calc(var(--ty) * -3deg)) translateY(calc(var(--on) * -4px))',
        transition: 'transform 220ms ease, box-shadow 220ms ease'
      }}
    >
      {/* Cover. With no uploaded image the accent plus the title carries it. */}
      <div
        style={{
          aspectRatio: '3 / 4',
          borderBottom: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
          background: w.cover
            ? `${ac} url(${w.cover}) center/cover`
            : `linear-gradient(135deg, ${ac} 0%, ${ac}99 100%)`,
          display: 'grid', placeItems: 'center', position: 'relative'
        }}
      >
        {!w.cover && (
          <span style={{
            fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800,
            fontSize: 'clamp(20px, 2.2vw, 30px)', lineHeight: 1.1, color: '#fff',
            padding: '0 18px', textAlign: 'center', textShadow: 'calc(2px * var(--shk, 1)) calc(2px * var(--shk, 1)) 0 rgba(0,0,0,.25)'
          }}>{w.title}</span>
        )}
        <span style={{
          position: 'absolute', top: 10, left: 10,
          padding: '4px 10px', borderRadius: 999, border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
          background: 'var(--card, var(--card, #fff))', fontSize: 12, fontWeight: 800
        }}>{kindLabel}</span>
        {w.language && (
          <span style={{
            position: 'absolute', top: 10, right: 10,
            padding: '4px 9px', borderRadius: 999, border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
            background: 'var(--ink-bg, #151515)', color: '#fff', fontSize: 11, fontWeight: 800, textTransform: 'uppercase'
          }}>{w.language}</span>
        )}
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        <strong style={{
          fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
          fontSize: 'clamp(17px, 1.3vw, 20px)', lineHeight: 1.25
        }}>{w.title}</strong>

        {w.subtitle && (
          <span style={{ fontSize: 14, color: 'var(--muted, #6b675e)', lineHeight: 1.4 }}>{w.subtitle}</span>
        )}

        {showWriter && w.author && (
          <span style={{ fontSize: 13, fontWeight: 800, color: ac }}>
            {(t.byAuthor || '{name}').replace('{name}', w.author)}
          </span>
        )}

        {w.summary && (
          <p style={{
            margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--muted-2, #55524a)',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden'
          }}>{w.summary}</p>
        )}

        <div style={{
          marginTop: 'auto', paddingTop: 10, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 10, fontSize: 12.5, color: 'var(--muted, #6b675e)'
        }}>
          <span>
            {w.kind === 'series' && w.chapters
              ? (t.workChapters || '{n} chapters').replace('{n}', num(w.chapters, lang))
              : (t.workReadTime || '{n} min read').replace('{n}', num(w.minutes || 1, lang))}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 800, color: INK }}>
            {t.readWriting} <IArrowRight />
          </span>
        </div>
      </div>
    </a>
  );
}

export { pairLabel };
