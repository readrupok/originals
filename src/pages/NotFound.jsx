import React from 'react';
import { IArrowRight } from '../components/icons';

export default function NotFound({ base, t }) {
  return (
    <section
      data-screen-label="404"
      style={{
        minHeight: '76vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'clamp(48px, 6vh, 80px) clamp(12px, 1.8vw, 24px)',
        animation: 'rs-in 0.6s ease-out'
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 22
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 'clamp(200px, 26vw, 320px)',
            aspectRatio: '1',
            background: 'var(--ink-bg, #151515)',
            color: '#f4f1ea',
            clipPath:
              'polygon(50% 0, 61% 20%, 83% 10%, 79% 34%, 100% 42%, 82% 58%, 94% 80%, 70% 78%, 60% 100%, 47% 82%, 26% 96%, 25% 72%, 2% 70%, 16% 52%, 0 32%, 24% 28%, 20% 6%, 40% 18%)',
            fontFamily: "'Bangers', cursive",
            fontSize: 'clamp(56px, 7vw, 96px)',
            letterSpacing: '.04em',
            transform: 'rotate(-8deg)'
          }}
        >
          404
        </span>

        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
            fontWeight: 800,
            fontSize: 'clamp(34px, 4vw, 56px)',
            letterSpacing: '-.03em'
          }}
        >
          {t.nf}
        </h1>

        <p style={{ margin: 0, fontSize: 18, color: 'var(--muted-2, #55524a)' }}>
          {t.nfBody}
        </p>

        <a
          href={`${base}/`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            padding: '15px 24px',
            borderRadius: 14,
            background: 'var(--ink-bg, #151515)',
            color: '#f4f1ea',
            border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
            boxShadow: 'calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 var(--acc)',
            fontWeight: 700,
            fontSize: 16,
            textDecoration: 'none'
          }}
        >
          {t.nfBtn} <IArrowRight />
        </a>
      </div>
    </section>
  );
}
