import React, { useState } from 'react';
import Shelf from '../components/Shelf';
import { ICheck, IStar } from '../components/icons';

const AC = ['#b45309', '#1d6fa5', '#0f766e', '#6d28d9'];

export default function Comics({ lang, series, comics, openPay, num, t }) {
  const [filter, setFilter] = useState('all');

  const list = comics.filter(c =>
    filter === 'all' ? true : filter === 'paid' ? c.paid : !c.paid
  );

  return (
    <div style={{ color: '#151515' }}>
      {/* Comics Hero: Header + 3D Shelf (Full screen on desktop) */}
      <div className="comics-hero-section">
        {/* Header */}
        <header
          data-screen-label="Comics — Header"
          className="comics-hero-header"
          style={{ padding: 'clamp(28px, 4.5vh, 64px) clamp(12px, 1.8vw, 24px) clamp(12px, 2vh, 24px)' }}
        >
          <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px clamp(24px, 3vw, 48px)' }}>
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
                {t.eyebrowComics}
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
                {t.h1Comics}
              </h1>
            </div>
            <p style={{ margin: 0, flex: '0 1 540px', maxWidth: 540, fontSize: 'clamp(16px, 1.3vw, 19px)', lineHeight: 1.6, color: '#55524a' }}>
              {t.bodyComics}
            </p>
          </div>
        </header>

        {/* 3D Interactive Bookshelf Section */}
        <section
          data-screen-label="Comics — Shelf"
          className="comics-hero-shelf"
          style={{ padding: '0 clamp(12px, 1.8vw, 24px) clamp(24px, 4vh, 48px)' }}
        >
          <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
            <Shelf
              lang={lang}
            comics={comics}
            series={series}
            openPay={openPay}
            t={{
              pages: t.pages,
              read: t.read,
              unlock: t.unlock,
              free: t.free,
              premium: t.premium,
              nextShelf: t.nextShelf,
              plate: t.plate,
              hintShelf: t.hintShelf
            }}
          />
        </div>
      </section>
    </div>

      {/* Library Grid */}
      <section data-screen-label="Comics — Library" style={{ padding: 'clamp(48px, 6vw, 80px) clamp(12px, 1.8vw, 24px)', background: '#151515', color: '#f4f1ea' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <h2 style={{ margin: 0, fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, fontSize: 'clamp(34px, 4.4vw, 64px)', lineHeight: 1, letterSpacing: '-.04em' }}>
            {t.library}
          </h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {t.fComics.map(([k, l]) => {
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
                    border: '2px solid #f4f1ea',
                    background: on ? '#f4f1ea' : 'transparent',
                    color: on ? '#151515' : '#f4f1ea',
                    transition: 'all 0.15s'
                  }}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 18 }}>
          {list.map(c => {
            const tag = c.paid ? <><IStar /> {t.premium}{c.locked ? null : <> <ICheck /></>}</> : t.free;

            return (
              <div
                key={c.k}
                style={{
                  display: 'flex',
                  gap: 16,
                  padding: 14,
                  borderRadius: 16,
                  background: '#221f1b',
                  border: '2px solid #3b3630',
                  boxShadow: `5px 5px 0 ${c.ac}`
                }}
              >
                <a
                  href={c.href}
                  style={{
                    flex: 'none',
                    // flex-start: a stretched flex item ignores aspect-ratio and grows with the card
                    alignSelf: 'flex-start',
                    position: 'relative',
                    width: 96,
                    aspectRatio: '2/3',
                    border: '2px solid #f4f1ea',
                    borderRadius: 6,
                    overflow: 'hidden'
                  }}
                >
                  <img src={c.poster} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </a>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      alignSelf: 'flex-start',
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 800,
                      background: c.paid ? '#f5c542' : c.ac,
                      color: c.paid ? '#151515' : '#fff',
                      border: '2px solid #151515'
                    }}
                  >
                    {tag}
                  </span>

                  <a
                    href={c.href}
                    style={{
                      fontFamily: "'Sora', 'Hind Siliguri', sans-serif",
                      fontWeight: 800,
                      fontSize: 20,
                      lineHeight: 1.1,
                      color: '#f4f1ea',
                      textDecoration: 'none',
                      paddingBlock: 3
                    }}
                  >
                    {c.title}
                  </a>

                  <span style={{ fontSize: 14, color: '#c9c5bb' }}>
                    {c.issue} · {c.pagesLabel} {t.pages}
                  </span>

                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', flexWrap: 'wrap' }}>
                    <a
                      href={c.href}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 10,
                        background: '#f4f1ea',
                        color: '#151515',
                        fontWeight: 800,
                        fontSize: 14,
                        textDecoration: 'none'
                      }}
                    >
                      {t.readBtn}
                    </a>

                    {c.locked && c.pending && <span data-testid="pending-badge" style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 12px', borderRadius: 10, border: '2px dashed #151515', background: '#fef9c3', color: '#151515', fontWeight: 800, fontSize: 14 }}>{t.payPendingH}</span>}
                    {c.locked && !c.pending && (
                      <button
                        onClick={() => openPay && openPay(c.k, 'comic')}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 10,
                          border: '2px solid #151515',
                          background: '#f5c542',
                          color: '#151515',
                          font: 'inherit',
                          fontWeight: 800,
                          fontSize: 14,
                          cursor: 'pointer'
                        }}
                      >
                        <IStar /> {c.price}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </section>

      {/* How It Works Section */}
      <section data-screen-label="Comics — How it works" style={{ padding: 'clamp(56px, 7vw, 96px) clamp(12px, 1.8vw, 24px) clamp(72px, 8vw, 112px)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 18 }}>
          {t.formats.map(([h, b], i) => (
            <div
              key={h}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                padding: '26px 24px',
                borderRadius: 16,
                border: '2px solid #151515',
                background: '#fff',
                boxShadow: `6px 6px 0 ${AC[i % 4]}`,
                transform: `rotate(${[-1, 0.8, -0.6, 1][i % 4]}deg)`
              }}
            >
              <span style={{ fontFamily: "'Bangers', cursive", fontSize: 40, lineHeight: 1, color: AC[i % 4] }}>
                {num('0' + (i + 1), lang)}
              </span>
              <span style={{ fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, fontSize: 21 }}>
                {h}
              </span>
              <span style={{ fontSize: 15, lineHeight: 1.6, color: '#33312b' }}>
                {b}
              </span>
            </div>
          ))}
        </div>
        </div>
      </section>
    </div>
  );
}
