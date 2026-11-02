import React, { useState } from 'react';
import { IArrowRight, IStar } from './icons';

const H = [96, 88, 100, 84, 92, 90, 94];
const W = [52, 48, 58, 46, 50, 48, 54];
// Upcoming spines stand nearly full height so their titles fit
const UP_H = [96, 91, 99, 93, 97, 90];

export default function Shelf({ lang, comics, series = [], openPay, t }) {
  const [sel, setSel] = useState(null);

  const c = comics.find(x => x.k === sel) || comics[0] || {};
  const accessLabel = c.paid ? `${t.premium} · ${c.price}` : t.free;
  // Series with no released issues yet sit on the right of the shelf as "coming soon" spines
  const upcoming = series.filter(s => !comics.some(x => x.seriesKey === s.k));

  return (
    <div
      data-screen-label="Bookshelf"
      className="shelf-grid-layout"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
        gap: 'clamp(20px, 2.5vw, 44px)',
        alignItems: 'center',
        color: '#151515',
        maxWidth: 1440,
        margin: '0 auto',
        width: '100%'
      }}
    >
      {/* Active Comic Showcase */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div
          className="shelf-active-showcase-wrap"
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: '10px 0 16px',
            perspective: 1200
          }}
        >
          {/* Left-aligned Book + Stand Container */}
          <div
            className="shelf-book-stand-container"
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              width: 'min(260px, 72vw)',
              maxWidth: 280,
              margin: '0 0 0 10px'
            }}
          >
            <a
              href={c.href}
              className="shelf-active-poster"
              style={{
                position: 'relative',
                display: 'block',
                width: '100%',
                aspectRatio: '2/3',
                border: '2px solid #151515',
                borderRadius: '4px 10px 10px 4px',
                overflow: 'hidden',
                background: '#151515',
                boxShadow: `10px 10px 0 ${c.ac || '#151515'}`,
                transform: 'rotateY(-6deg) rotate(-1deg)',
                transformOrigin: 'bottom center',
                transition: 'box-shadow 0.4s ease, transform 0.3s ease',
                textDecoration: 'none'
              }}
            >
              <img src={c.poster} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 14,
                  background: 'linear-gradient(90deg, rgba(0,0,0,.45), rgba(255,255,255,.12) 60%, transparent)'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(120deg, transparent 40%, rgba(255,255,255,.22) 52%, transparent 64%)',
                  mixBlendMode: 'screen',
                  pointerEvents: 'none'
                }}
              />
              {c.paid && (
                <span
                  style={{
                    position: 'absolute',
                    right: -8,
                    top: 14,
                    padding: '5px 12px',
                    background: '#f5c542',
                    border: '2px solid #151515',
                    fontWeight: 800,
                    fontSize: 13,
                    boxShadow: '3px 3px 0 #151515'
                  }}
                >
                  <IStar /> {c.access || accessLabel}
                </span>
              )}
            </a>

            {/* Wooden shelf ledge locked and aligned with the book */}
            <span
              style={{
                display: 'block',
                width: 'calc(100% + 22px)',
                height: 18,
                marginTop: 6,
                marginLeft: -10,
                background: 'linear-gradient(#3b3630, #151515)',
                border: '2px solid #151515',
                borderRadius: 4,
                boxShadow: '0 8px 16px -6px rgba(21,21,21,.55)'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                padding: '4px 11px',
                borderRadius: 999,
                border: '2px solid #151515',
                fontSize: 13,
                fontWeight: 800,
                background: c.paid ? '#f5c542' : '#fff',
                color: '#151515'
              }}
            >
              {accessLabel}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#55524a' }}>
              {c.issue} · {c.pagesLabel} {t.pages}
            </span>
          </span>

          <span
            style={{
              fontFamily: "'Sora', 'Hind Siliguri', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(28px, 3vw, 40px)',
              lineHeight: 1.02,
              letterSpacing: '-.03em'
            }}
          >
            {c.title}
          </span>

          <span style={{ fontSize: 16, lineHeight: 1.55, color: '#33312b', maxWidth: 460 }}>
            {c.sub}
          </span>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
            <a
              href={c.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '13px 18px',
                borderRadius: 12,
                background: '#151515',
                color: '#fff',
                border: '2px solid #151515',
                boxShadow: `4px 4px 0 ${c.ac || '#6f6758'}`,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none'
              }}
            >
              {t.read} <IArrowRight />
            </a>

            {c.locked && c.pending && <span data-testid="pending-badge" style={{ display: 'inline-flex', alignItems: 'center', padding: '13px 18px', borderRadius: 10, border: '2px dashed #151515', background: '#fef9c3', color: '#151515', fontWeight: 800, fontSize: 15 }}>{t.payPendingH}</span>}
            {c.locked && !c.pending && (
              <button
                type="button"
                onClick={() => openPay && openPay(c.k, 'comic')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '13px 18px',
                  borderRadius: 12,
                  background: '#f5c542',
                  border: '2px solid #151515',
                  boxShadow: '4px 4px 0 #151515',
                  font: 'inherit',
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: 'pointer'
                }}
              >
                <IStar /> {t.unlock} · {c.price}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* The 3D Wooden Shelf */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: 0 }}>
        <div
          style={{
            position: 'relative',
            padding: '26px 18px 0',
            border: '2px solid #151515',
            borderRadius: '18px 18px 8px 8px',
            backgroundColor: '#e9e2d2',
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(21,21,21,.05) 0 2px, transparent 2px 70px), linear-gradient(180deg, rgba(21,21,21,.10), transparent 30%)',
            boxShadow: '8px 8px 0 #151515',
            overflow: 'hidden'
          }}
        >
          {/* Top shelf trim */}
          <span
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: 12,
              background: 'linear-gradient(#4a443b, #26231f)',
              borderBottom: '2px solid #151515'
            }}
          />

          {/* Book Row on Shelf */}
          <div
            className="shelf-book-row"
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 5,
              height: 'clamp(250px, 26vw, 320px)',
              padding: '0 4px',
              overflowX: 'auto',
              scrollbarWidth: 'none'
            }}
          >
            {/* Left bookend */}
            <span
              style={{
                flex: 'none',
                width: 18,
                height: '46%',
                background: 'linear-gradient(90deg, #3b3630, #151515)',
                border: '2px solid #151515',
                borderRadius: '4px 4px 0 0'
              }}
            />

            {comics.map((b, i) => {
              const on = b.k === c.k;
              const issueNo = (b.issue || '').replace(/[^\d০-৯]/g, '');
              return (
                <button
                  key={b.k}
                  onClick={() => setSel(b.k)}
                  aria-label={b.title}
                  style={{
                    flex: 'none',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    width: W[i % 7],
                    height: `${H[i % 7]}%`,
                    padding: 0,
                    cursor: 'pointer',
                    color: '#fff',
                    font: 'inherit',
                    background: `linear-gradient(90deg, rgba(0,0,0,.28), rgba(255,255,255,.14) 30%, rgba(255,255,255,0) 55%, rgba(0,0,0,.32)), ${b.ac}`,
                    border: '2px solid #151515',
                    borderRadius: '5px 5px 2px 2px',
                    boxShadow: on ? '0 0 0 3px #fff, 0 0 0 5px #151515' : 'inset 0 -6px 0 rgba(0,0,0,.2)',
                    transform: on ? 'translateY(-22px)' : 'none',
                    transition: 'transform 0.35s cubic-bezier(.2,.8,.2,1.2), box-shadow 0.2s',
                    borderTop: b.paid ? '4px solid #f5c542' : '2px solid #151515'
                  }}
                  onMouseEnter={e => {
                    if (!on) e.currentTarget.style.transform = 'translateY(-10px)';
                  }}
                  onMouseLeave={e => {
                    if (!on) e.currentTarget.style.transform = 'none';
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 18,
                      background: 'rgba(0,0,0,.35)',
                      borderBottom: '2px solid rgba(0,0,0,.4)',
                      marginBottom: 6
                    }}
                  >
                    {b.paid && <span style={{ color: '#f5c542', fontSize: 12 }}><IStar /></span>}
                  </span>

                  <span
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 0,
                      overflow: 'hidden'
                    }}
                  >
                    <span
                      style={{
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed',
                        fontFamily: "'Sora', 'Hind Siliguri', sans-serif",
                        fontWeight: 800,
                        fontSize: 'clamp(12px, 1.1vw, 14px)',
                        letterSpacing: '.02em',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {b.title}
                    </span>
                  </span>

                  <span style={{ fontFamily: "'Bangers', cursive", fontSize: 16, lineHeight: 1 }}>
                    {issueNo}
                  </span>

                  <img
                    src="/assets/logos/rupok-logo.png"
                    alt=""
                    style={{
                      width: '70%',
                      height: 'auto',
                      display: 'block',
                      filter: 'invert(1)',
                      opacity: 0.9,
                      margin: '4px auto 8px'
                    }}
                  />
                </button>
              );
            })}

            {/* Right bookend — closes the released issues */}
            <span
              style={{
                flex: 'none',
                width: 18,
                height: '46%',
                marginLeft: 6,
                background: 'linear-gradient(90deg, #151515, #3b3630)',
                border: '2px solid #151515',
                borderRadius: '4px 4px 0 0'
              }}
            />

            {/* Upcoming series — right side of the shelf, each links to its series page */}
            {upcoming.length > 0 && (
              <div
                data-testid="shelf-upcoming"
                style={{ flex: '1 0 auto', display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', height: '100%', paddingLeft: 24 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      border: '2px dashed #151515',
                      borderRadius: 999,
                      background: 'rgba(255,255,255,.7)',
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '.04em',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {t.nextShelf}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: '88%' }}>
                    {upcoming.map((s, i) => (
                      <a
                        key={s.k}
                        href={s.href}
                        aria-label={`${s.title} · ${t.nextShelf}`}
                        title={`${s.title} · ${t.nextShelf}`}
                        style={{
                          flex: 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          width: 42,
                          height: `${UP_H[i % UP_H.length]}%`,
                          color: '#fff',
                          textDecoration: 'none',
                          background: `linear-gradient(90deg, rgba(0,0,0,.28), rgba(255,255,255,.14) 30%, rgba(255,255,255,0) 55%, rgba(0,0,0,.32)), ${s.ac}`,
                          border: '2px solid #151515',
                          borderTop: '2px dashed #151515',
                          borderRadius: '5px 5px 2px 2px',
                          filter: 'saturate(.55)',
                          opacity: 0.82,
                          transition: 'transform 0.3s cubic-bezier(.2,.8,.2,1.2), opacity 0.2s, filter 0.2s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.opacity = '1'; e.currentTarget.style.filter = 'none'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.opacity = '0.82'; e.currentTarget.style.filter = 'saturate(.55)'; }}
                      >
                        <span style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minHeight: 0, overflow: 'hidden', padding: '10px 0 4px' }}>
                          <span
                            style={{
                              writingMode: 'vertical-rl',
                              textOrientation: 'mixed',
                              fontFamily: "'Sora', 'Hind Siliguri', sans-serif",
                              fontWeight: 800,
                              fontSize: 12, maxHeight: '100%', overflow: 'hidden', textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {s.title}
                          </span>
                        </span>
                        <img
                          src="/assets/logos/rupok-logo.png"
                          alt=""
                          style={{ width: '64%', height: 'auto', display: 'block', filter: 'invert(1)', opacity: 0.8, margin: '4px auto 8px' }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Wooden Base with Brass Nameplate */}
          <div
            style={{
              position: 'relative',
              margin: '0 -18px',
              height: 30,
              background: 'linear-gradient(#5a534a, #2b2723 40%, #151515)',
              borderTop: '2px solid #151515',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <span
              style={{
                padding: '2px 12px',
                background: '#f5c542',
                border: '2px solid #151515',
                borderRadius: 3,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '.08em',
                textTransform: 'uppercase'
              }}
            >
              {t.plate}
            </span>
          </div>
        </div>

        <span style={{ fontSize: 14, fontWeight: 600, color: '#6b675e' }}>
          {t.hintShelf}
        </span>
      </div>
    </div>
  );
}
