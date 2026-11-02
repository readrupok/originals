import React from 'react';

// The eyebrow-pill, headline and lede that open every content page, so new
// pages read as part of the same site as Series, Comics and the Library.
export default function PageHeader({ eyebrow, title, body, label, children }) {
  return (
    <header
      data-screen-label={label}
      style={{ position: 'relative', padding: 'clamp(28px, 4.5vh, 64px) clamp(12px, 1.8vw, 24px) clamp(20px, 3vh, 32px)' }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px clamp(24px, 3vw, 48px)' }}>
        <div style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {eyebrow && (
            <span
              style={{
                alignSelf: 'flex-start', padding: '6px 14px', border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)', borderRadius: 999,
                background: 'var(--card, var(--card, #fff))', fontWeight: 800, fontSize: 13, boxShadow: 'calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 var(--ink, #151515)'
              }}
            >
              {eyebrow}
            </span>
          )}
          <h1
            style={{
              margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800,
              fontSize: 'clamp(36px, 5vw, 72px)', lineHeight: 1.02, letterSpacing: '-.04em'
            }}
          >
            {title}
          </h1>
        </div>
        {body && (
          <p style={{ margin: 0, flex: '0 1 560px', maxWidth: 560, fontSize: 'clamp(16px, 1.3vw, 19px)', lineHeight: 1.6, color: 'var(--muted-2, #55524a)' }}>
            {body}
          </p>
        )}
      </div>
      {children && <div style={{ maxWidth: 1440, margin: '24px auto 0', width: '100%' }}>{children}</div>}
    </header>
  );
}
