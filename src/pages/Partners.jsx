import React from 'react';
import PageHeader from '../components/PageHeader';
import { IArrowRight } from '../components/icons';

const INK = '#151515';

/**
 * For broadcasters, publishers and co-producers: the slate presented as
 * something to license. Built from the live catalogue, so it never goes stale
 * — a new series in the CMS appears here the moment it is created.
 */
export default function Partners({ lang, base, series, comics, num, t }) {
  const offers = Array.isArray(t.partnersOffers) ? t.partnersOffers : [];
  const facts = Object.fromEntries((Array.isArray(t.partnersFacts) ? t.partnersFacts : []).map(([k, v]) => [k, v]));
  const issuesOf = k => comics.filter(c => c.seriesKey === k).length;
  const contactHref = `${base}/contact?topic=licensing`;

  return (
    <div style={{ color: INK }}>
      <PageHeader label="Partners" eyebrow={t.partnersEyebrow} title={t.partnersH1} body={t.partnersBody} />

      <div style={{ padding: '0 clamp(12px, 1.8vw, 24px) clamp(56px, 8vh, 96px)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(40px, 6vh, 72px)' }}>

          {/* Ways to work together */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h2 style={{ margin: 0, fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontSize: 'clamp(24px, 2.4vw, 34px)', fontWeight: 800 }}>
              {t.partnersOffersH}
            </h2>
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' }}>
              {offers.map(([h, b], i) => (
                <div key={h} style={{ padding: 20, border: `2px solid ${INK}`, borderRadius: 16, background: '#fff', boxShadow: `5px 5px 0 ${INK}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={{ fontFamily: "'Bangers', cursive", fontSize: 28, color: 'var(--acc, #6f6758)', letterSpacing: '.04em' }}>
                    {num(String(i + 1).padStart(2, '0'), lang)}
                  </span>
                  <strong style={{ fontSize: 19, fontFamily: "'Sora', 'Hind Siliguri', sans-serif" }}>{h}</strong>
                  <p style={{ margin: 0, lineHeight: 1.6, color: '#3c3a35' }}>{b}</p>
                </div>
              ))}
            </div>
          </section>

          {/* The slate */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h2 style={{ margin: 0, fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontSize: 'clamp(24px, 2.4vw, 34px)', fontWeight: 800 }}>
                {t.partnersCatalogueH}
              </h2>
              <p style={{ margin: 0, color: '#55524a' }}>{t.partnersCatalogueBody}</p>
            </div>
            <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))' }}>
              {series.map(s => (
                <article key={s.k} style={{ display: 'flex', gap: 16, padding: 16, border: `2px solid ${INK}`, borderRadius: 18, background: '#fff', boxShadow: `5px 5px 0 ${s.ac}` }}>
                  <img
                    src={s.poster}
                    alt=""
                    loading="lazy"
                    style={{ width: 110, aspectRatio: '2 / 3', alignSelf: 'flex-start', objectFit: 'cover', borderRadius: 10, border: `2px solid ${INK}`, flex: 'none', background: s.ac }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
                    <strong style={{ fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontSize: 20, lineHeight: 1.2 }}>{s.title}</strong>
                    {s.genre && <span style={{ fontSize: 13, fontWeight: 700, color: '#6b675e' }}>{s.genre}</span>}
                    {s.log && <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55 }}>{s.log}</p>}
                    <dl style={{ margin: '4px 0 0', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: 13 }}>
                      <dt style={{ fontWeight: 800 }}>{facts.status}</dt><dd style={{ margin: 0 }}>{s.status}</dd>
                      <dt style={{ fontWeight: 800 }}>{facts.episodes}</dt><dd style={{ margin: 0 }}>{s.epCount}</dd>
                      <dt style={{ fontWeight: 800 }}>{facts.issues}</dt><dd style={{ margin: 0 }}>{num(issuesOf(s.k), lang)}</dd>
                      <dt style={{ fontWeight: 800 }}>{facts.languages}</dt><dd style={{ margin: 0 }}>{t.partnersLanguages}</dd>
                    </dl>
                    <a href={s.href} style={{ marginTop: 'auto', alignSelf: 'flex-start', color: INK, fontWeight: 800, fontSize: 14 }}>
                      {s.title} <IArrowRight />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Call to action */}
          <section style={{ padding: 'clamp(24px, 4vw, 48px)', border: `2px solid ${INK}`, borderRadius: 22, background: INK, color: '#f4f1ea', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 640 }}>
              <h2 style={{ margin: 0, fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 800 }}>
                {t.partnersCtaH}
              </h2>
              <p style={{ margin: 0, opacity: 0.85 }}>{t.partnersCtaBody}</p>
            </div>
            <a
              href={contactHref}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 24px', borderRadius: 14, background: '#f4f1ea', color: INK, border: '2px solid #f4f1ea', boxShadow: '5px 5px 0 var(--acc, #6f6758)', fontWeight: 800, textDecoration: 'none' }}
            >
              {t.partnersCtaBtn} <IArrowRight />
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
