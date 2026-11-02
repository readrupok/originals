import React from 'react';
import PageHeader from '../components/PageHeader';

/**
 * Terms, Privacy, Refunds and Community Guidelines. All four are the same
 * shape — a title, an introduction and numbered sections — and all of their
 * text lives in Page Content, so the studio can revise them without a deploy.
 */
export default function Legal({ page, base, t }) {
  const title = t[`${page}Title`];
  const intro = t[`${page}Intro`];
  const sections = Array.isArray(t[`${page}Sections`]) ? t[`${page}Sections`] : [];
  const nav = Array.isArray(t.legalNav) ? t.legalNav : [];

  return (
    <div style={{ color: 'var(--ink, var(--ink, #151515))' }}>
      <PageHeader label={`Legal — ${page}`} eyebrow={t.footLegal} title={title} body={intro} />

      <div style={{ padding: '0 clamp(12px, 1.8vw, 24px) clamp(56px, 8vh, 96px)' }}>
        <div
          className="legal-grid"
          style={{ maxWidth: 1440, margin: '0 auto', display: 'grid', gap: 'clamp(24px, 4vw, 64px)', alignItems: 'start' }}
        >
          {/* The four documents, so a reader can move between them */}
          <nav aria-label={t.footLegal} className="legal-nav" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {nav.map(([slug, label]) => {
              const on = slug === page;
              return (
                <a
                  key={slug}
                  href={`${base}/${slug}`}
                  aria-current={on ? 'page' : undefined}
                  style={{
                    padding: '10px 14px', borderRadius: 12, border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                    background: on ? 'var(--ink-bg, #151515)' : 'var(--card, var(--card, #fff))', color: on ? '#f4f1ea' : 'var(--ink, var(--ink, #151515))',
                    fontWeight: 800, fontSize: 14, textDecoration: 'none'
                  }}
                >
                  {label}
                </a>
              );
            })}
          </nav>

          <article style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 28 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--muted, #6b675e)' }}>{t.legalUpdated}</p>
            {sections.map(([heading, body], i) => (
              <section key={heading} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h2 style={{ margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontSize: 'clamp(20px, 1.8vw, 24px)', fontWeight: 800 }}>
                  <span style={{ color: 'var(--acc, #6f6758)', marginRight: 10 }}>{String(i + 1).padStart(2, '0')}</span>
                  {heading}
                </h2>
                <p style={{ margin: 0, fontSize: 'clamp(16px, 1.15vw, 18px)', lineHeight: 1.75 }}>{body}</p>
              </section>
            ))}
            <p style={{ margin: '12px 0 0', padding: '14px 16px', border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)', borderRadius: 14, background: 'var(--card, var(--card, #fff))', fontSize: 15 }}>
              {t.legalQuestions}{' '}
              <a href={`${base}/contact`} style={{ color: 'var(--ink, var(--ink, #151515))', fontWeight: 800 }}>{t.nav?.[7]}</a>
            </p>
          </article>
        </div>
      </div>

      <style>{`
        @media (min-width: 980px) {
          .legal-grid { grid-template-columns: 260px 1fr; }
          .legal-nav { flex-direction: column; position: sticky; top: 96px; }
        }
      `}</style>
    </div>
  );
}
