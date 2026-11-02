import React from 'react';
import { addressOn, SITE_URLS } from '../lib/sites';
import BrandLockup, { PLATFORM_WORD, PlatformArrow } from './BrandLockup';
import { BOOKS_NAME } from './BooksPromo';
import { SOCIAL_ICONS } from './SocialIcons';

// The footer of the two dedicated platforms: the platform's own sections,
// "More from Rupok" (the main site and the other platform, each opening in a
// new tab), and the policies, which every Rupok site shows.

const THEMES = {
  stories: { bg: '#f1e8da', fg: '#1c1917', muted: '#6b625a', line: '#e0d5c4', tone: 'light' },
  originals: { bg: '#050505', fg: '#fafaf9', muted: '#8a8580', line: 'rgba(255,255,255,.08)', tone: 'dark' }
};

export default function SiteFooter({ theme, tagline, links, lang, t, base, booksUrl = '', onSelectLang }) {
  const th = THEMES[theme] || THEMES.stories;
  const other = theme === 'stories' ? 'originals' : 'stories';
  const head = { fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: th.muted, marginBottom: 2 };
  const link = { color: th.fg, textDecoration: 'none', fontSize: 14.5, opacity: 0.88, display: 'inline-flex', alignItems: 'center', gap: 6, paddingBlock: '3px', wordBreak: 'break-word' };
  const ext = { target: '_blank', rel: 'noopener' };

  // The rest of Rupok: written with their full addresses, so they open there
  const elsewhere = [
    [addressOn('main', base), lang === 'bn' ? 'রূপক' : 'Rupok'],
    SITE_URLS[other] ? [addressOn(other, base), PLATFORM_WORD[other][lang]] : null,
    booksUrl ? [`${booksUrl}/`, BOOKS_NAME[lang] || BOOKS_NAME.en] : null,
    [addressOn('main', base, '/studio'), t.nav?.[6] || 'Studio'],
    [addressOn('main', base, '/contact'), t.nav?.[7] || 'Contact']
  ].filter(Boolean);
  const legal = Array.isArray(t.legalNav) ? t.legalNav : [];

  return (
    <footer style={{ position: 'relative', zIndex: 1, background: th.bg, color: th.fg, borderTop: `1px solid ${th.line}` }}>
      <div
        className="site-footer-grid footer-grid"
        style={{
          display: 'grid',
          gap: 'clamp(24px, 3vw, 44px)',
          maxWidth: 1240,
          margin: '0 auto',
          padding: 'clamp(36px, 5vw, 56px) clamp(16px, 2.4vw, 32px)'
        }}
      >
        <div className="site-footer-brand footer-brand" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <BrandLockup site={theme} lang={lang} tone={th.tone} size={40} />
          <span style={{ color: th.muted, fontSize: 14, lineHeight: 1.6, maxWidth: 320 }}>{tagline}</span>
          {(t?.socials || []).length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
              {t.socials.map(({ k, name, url }) => {
                const Icon = SOCIAL_ICONS[k];
                if (!Icon) return null;
                return (
                  <a
                    key={k}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    title={name}
                    aria-label={name}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: th.tone === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(28,25,23,0.05)',
                      border: `1px solid ${th.line}`,
                      color: th.fg,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 17,
                      textDecoration: 'none',
                      transition: 'transform 0.15s ease, color 0.15s ease, border-color 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.color = theme === 'stories' ? '#9c3a1d' : th.fg;
                      e.currentTarget.style.borderColor = theme === 'stories' ? '#9c3a1d' : th.fg;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.color = th.fg;
                      e.currentTarget.style.borderColor = th.line;
                    }}
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          )}
        </div>
        <nav className="site-footer-col footer-col" style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-label={PLATFORM_WORD[theme][lang]}>
          <span style={head}>{PLATFORM_WORD[theme][lang]}</span>
          {links.map(l => <a key={l.href} href={l.href} style={link}>{l.label}</a>)}
        </nav>
        <nav className="site-footer-col footer-col" style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-label={lang === 'bn' ? 'রূপকের আরও' : 'More from Rupok'}>
          <span style={head}>{lang === 'bn' ? 'রূপকের আরও' : 'More from Rupok'}</span>
          {elsewhere.map(([href, label]) => (
            <a key={href} href={href} {...ext} style={link}>{label} <PlatformArrow size={12} /></a>
          ))}
        </nav>
        {legal.length > 0 && (
          <nav className="site-footer-col footer-col" style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-label={t.footLegal || 'Policies'}>
            <span style={head}>{t.footLegal || (lang === 'bn' ? 'আইনি তথ্য' : 'Policies')}</span>
            {legal.map(([slug, label]) => <a key={slug} href={`${base}/${slug}`} style={link}>{label}</a>)}
          </nav>
        )}
        <nav className="site-footer-col footer-col" style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-label={lang === 'bn' ? 'অ্যাকাউন্ট ও ভাষা' : 'Account & Language'}>
          <span style={head}>{lang === 'bn' ? 'অ্যাকাউন্ট ও ভাষা' : 'Account & Language'}</span>
          <a href={`${base}/account`} style={link}>
            {t.acc?.nav || (lang === 'bn' ? 'অ্যাকাউন্ট' : 'Account')}
          </a>
          {theme === 'stories' && (
            <a href={`${base}/account#author`} style={link}>
              {lang === 'bn' ? 'লেখার আবেদন' : 'Write for us'}
            </a>
          )}
          {onSelectLang && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 13.5, color: th.muted }}>
              <span>{t.acc?.language || (lang === 'bn' ? 'ভাষা' : 'Language')}:</span>
              <button
                type="button"
                onClick={() => onSelectLang('en')}
                style={{
                  border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 4px',
                  color: lang === 'en' ? th.fg : th.muted,
                  fontWeight: lang === 'en' ? 800 : 400,
                  textDecoration: lang === 'en' ? 'underline' : 'none',
                  font: 'inherit'
                }}
              >EN</button>
              <span>·</span>
              <button
                type="button"
                onClick={() => onSelectLang('bn')}
                style={{
                  border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 4px',
                  color: lang === 'bn' ? th.fg : th.muted,
                  fontWeight: lang === 'bn' ? 800 : 400,
                  textDecoration: lang === 'bn' ? 'underline' : 'none',
                  font: 'inherit'
                }}
              >বাংলা</button>
            </div>
          )}
        </nav>
      </div>
      <style>{`
        .site-footer-grid > * {
          min-width: 0;
        }
        @media (min-width: 768px) {
          .site-footer-grid {
            grid-template-columns: 1.4fr 1fr 1fr 1fr 1.1fr !important;
          }
          .site-footer-brand {
            grid-column: auto !important;
          }
        }
      `}</style>
      <div style={{ borderTop: `1px solid ${th.line}`, padding: '16px clamp(16px, 2.4vw, 32px)', textAlign: 'center', color: th.muted, fontSize: 13 }}>
        {t.rights || `© ${new Date().getFullYear()} Rupok`}
      </div>
    </footer>
  );
}
