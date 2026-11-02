import React, { useState } from 'react';
import { IStar } from '../components/icons';

export default function Series({ lang, series, num, t }) {
  const [filter, setFilter] = useState('all');

  const all = series || [];
  const list = all.filter(s => filter === 'all' || s.gk === filter);
  const totalEps = all.reduce((a, s) => a + s.epRaw, 0) || 1;

  const tilt = e => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--tx', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    el.style.setProperty('--ty', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
    el.style.setProperty('--on', 1);
  };

  const untilt = e => {
    const el = e.currentTarget;
    el.style.setProperty('--tx', 0);
    el.style.setProperty('--ty', 0);
    el.style.setProperty('--on', 0);
  };

  const countLabel =
    t.seriesCount.replace('{n}', num(list.length, lang));

  return (
    <div style={{ color: '#151515' }}>
      {/* Header */}
      <header
        data-screen-label="Series — Header"
        style={{ position: 'relative', padding: 'clamp(28px, 4.5vh, 64px) clamp(12px, 1.8vw, 24px) clamp(20px, 3vh, 32px)', overflow: 'hidden' }}
      >
        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%', position: 'relative', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px clamp(24px, 3vw, 48px)' }}>
          <div style={{ flex: '1 1 480px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span
              style={{
                alignSelf: 'flex-start',
                padding: '6px 14px',
                border: '2px solid #151515',
                borderRadius: 999,
                background: '#fff',
                fontWeight: 800,
                fontSize: 13,
                boxShadow: '3px 3px 0 #151515'
              }}
            >
              {t.eyebrowSeries}
            </span>
            <h1
              style={{
                margin: 0,
                fontFamily: "'Sora', 'Hind Siliguri', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(40px, 5.5vw, 84px)',
                lineHeight: 0.98,
                letterSpacing: '-.045em'
              }}
            >
              {t.h1Series}
            </h1>
          </div>
          <p style={{ margin: 0, flex: '0 1 560px', maxWidth: 560, fontSize: 'clamp(16px, 1.3vw, 19px)', lineHeight: 1.6, color: '#55524a' }}>
            {t.bodySeries}
          </p>
        </div>

        {/* Color Distribution Bar */}
        <div style={{ maxWidth: 1440, margin: '28px auto 0', position: 'relative', display: 'flex', gap: 6, height: 14, border: '2px solid #151515', borderRadius: 99, overflow: 'hidden' }}>
          {all.map(s => (
            <span
              key={s.k}
              title={s.title}
              style={{
                flex: s.epRaw / totalEps,
                background: s.ac,
                opacity: list.includes(s) ? 1 : 0.2,
                transition: 'opacity 0.3s'
              }}
            />
          ))}
        </div>
      </header>

      {/* Filter Bar */}
      <div
        style={{
          padding: '16px clamp(12px, 1.8vw, 24px)',
          background: 'var(--paper, #f4f1ea)',
          borderTop: '2px solid #151515',
          borderBottom: '2px solid #151515'
        }}
      >
        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {t.fSeries.filter(([k]) => k === 'all' || all.some(x => x.gk === k)).map(([k, l]) => {
              const on = filter === k;
              return (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  style={{
                    padding: '8px 15px',
                    borderRadius: 12,
                    font: 'inherit',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '2px solid #151515',
                    background: on ? '#151515' : '#fff',
                    color: on ? '#f4f1ea' : '#151515',
                    boxShadow: on ? 'none' : '3px 3px 0 #151515',
                    transition: 'all 0.15s'
                  }}
                >
                  {l}
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{countLabel}</span>
        </div>
      </div>

      {/* Grid of 3D Tilt Cards */}
      <section
        data-screen-label="Series — Grid"
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 270px), 1fr))',
          gap: '36px 26px',
          padding: '40px clamp(12px, 1.8vw, 24px) clamp(72px, 8vw, 112px)',
          perspective: 1400
        }}
      >
        {list.map(s => (
          <a
            key={s.k}
            href={s.href}
            onMouseMove={tilt}
            onMouseLeave={untilt}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 16,
              overflow: 'hidden',
              background: '#fff',
              border: '2px solid #151515',
              color: '#151515',
              textDecoration: 'none',
              boxShadow: `calc(6px + var(--on, 0) * 4px) calc(6px + var(--on, 0) * 4px) 0 ${s.ac}`,
              transform: 'rotateY(calc(var(--tx, 0) * 10deg)) rotateX(calc(var(--ty, 0) * -10deg))',
              transition: 'transform 0.2s ease-out, box-shadow 0.2s',
              transformStyle: 'preserve-3d'
            }}
          >
            <span
              style={{
                position: 'relative',
                display: 'block',
                aspectRatio: '2/3',
                borderBottom: '2px solid #151515',
                overflow: 'hidden',
                background: '#151515'
              }}
            >
              <img
                src={s.poster}
                alt={s.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transform: 'translate(calc(var(--tx, 0) * -10px), calc(var(--ty, 0) * -10px)) scale(1.06)',
                  transition: 'transform 0.2s ease-out'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.28) 48%, transparent 60%)',
                  transform: 'translateX(calc(var(--tx, 0) * 60%))',
                  mixBlendMode: 'screen',
                  pointerEvents: 'none'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  top: 10,
                  padding: '5px 11px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 700,
                  background: s.prod ? s.ac : '#fff',
                  color: s.prod ? '#fff' : '#151515',
                  border: '2px solid #151515'
                }}
              >
                {s.status}
              </span>
              {s.paid && (
                <span
                  style={{
                    position: 'absolute',
                    right: -2,
                    top: 12,
                    padding: '4px 10px',
                    background: '#f5c542',
                    border: '2px solid #151515',
                    fontWeight: 800,
                    fontSize: 13,
                    color: '#151515'
                  }}
                >
                  <IStar /> {s.access}
                </span>
              )}
            </span>

            <span style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 16px 16px' }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: "'Bangers', cursive", fontSize: 26, lineHeight: 1, color: s.ac }}>
                  #{s.num}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#6b675e' }}>
                  {s.epCount} {t.eps}
                </span>
              </span>
              <span style={{ fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, fontSize: 22, lineHeight: 1.1, letterSpacing: '-.02em' }}>
                {s.title}
              </span>
              <span style={{ fontSize: 14, lineHeight: 1.45, color: '#55524a' }}>
                {s.sub}
              </span>
            </span>
          </a>
        ))}
      </section>
    </div>
  );
}
