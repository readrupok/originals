import React from 'react';
import { IExternal, IRss } from './icons';
import { SOCIAL_ICONS } from './SocialIcons';
import { PLATFORM_WORD, PlatformArrow } from './BrandLockup';
import RupokStoriesMark from './RupokStoriesMark';
import { BOOKS_NAME } from './BooksPromo';
import { addressOn, platformLink, SITE_URLS } from '../lib/sites';

export default function Footer({ lang, t, base, series = [], onSelectLang, booksUrl = '' }) {

  const linkStyle = {
    color: '#c9c5bb',
    textDecoration: 'none',
    fontSize: '15px',
    transition: 'color 0.2s'
  };

  const onHover = e => {
    e.currentTarget.style.color = '#fff';
    e.currentTarget.style.textDecoration = 'underline';
  };

  const onLeave = e => {
    e.currentTarget.style.color = '#c9c5bb';
    e.currentTarget.style.textDecoration = 'none';
  };

  const headingStyle = {
    fontSize: '14px',
    fontWeight: 700,
    letterSpacing: '.12em',
    textTransform: 'uppercase',
    color: '#8f8b82',
    marginBottom: '2px'
  };

  // A link as the pages write it. One that another platform now carries opens
  // there, in a new tab, marked with an arrow.
  const fLink = (path, children, style) => {
    const { href, site } = platformLink(path);
    return (
      <a key={path} href={href} {...(site ? { target: '_blank', rel: 'noopener' } : {})}
        style={{ ...linkStyle, display: 'inline-flex', alignItems: 'center', gap: 8, ...style }}
        onMouseEnter={onHover} onMouseLeave={onLeave}>
        {children}{site && <PlatformArrow size={12} />}
      </a>
    );
  };

  // A platform column's heading: its name in its own type, linking to it once it is its own site
  const platformHead = (site, fallback) => {
    if (!SITE_URLS[site]) return <span style={headingStyle}>{fallback}</span>;
    const style = site === 'stories'
      ? { fontFamily: "'Literata', 'Noto Serif Bengali', Georgia, serif", fontStyle: 'italic', fontSize: 21, fontWeight: 600, color: '#f2b28c' }
      : { fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: '#f5c542' };
    return (
      <a href={addressOn(site, base)} target="_blank" rel="noopener" style={{ ...style, display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none', marginBottom: 2 }}>
        {site === 'stories' && <RupokStoriesMark height={20} color="#f2b28c" />}
        {PLATFORM_WORD[site][lang]} <PlatformArrow size={14} />
      </a>
    );
  };

  return (
    <footer
      data-screen-label="Footer"
      data-nav-tone="dark"
      style={{
        position: 'relative',
        zIndex: 1,
        background: '#151515',
        color: '#f4f1ea',
        padding: 'clamp(56px, 6vw, 88px) clamp(12px, 1.8vw, 24px) 28px'
      }}
    >
      <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
        <div
          className="footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 175px), 1fr))',
            gap: 'clamp(32px, 3.8vw, 48px)'
          }}
        >
          {/* Brand Column */}
          <div className="footer-brand" style={{ display: 'flex', flexDirection: 'column', gap: '18px', minWidth: 0 }}>
            <img
              src="/assets/logos/rupok-logo.png"
              alt="Rupok"
              style={{
                display: 'block',
                alignSelf: 'flex-start',
                height: '56px',
                width: 'auto',
                maxWidth: '100%',
                objectFit: 'contain',
                filter: 'invert(1)'
              }}
            />
            <p style={{ margin: 0, maxWidth: '320px', fontSize: '15px', lineHeight: 1.6, color: '#c9c5bb' }}>
              {t.footTag}
            </p>
          </div>

          {/* Rupok itself: the studio's own pages */}
          <div className="footer-col" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={headingStyle}>{t.explore}</span>
            {fLink(`${base}/`, t.nav?.[0] || (lang === 'bn' ? 'হোম' : 'Home'))}
            {fLink(`${base}/studio`, t.nav?.[6] || (lang === 'bn' ? 'স্টুডিও' : 'Studio'))}
            {fLink(`${base}/partners`, t.partnersNav)}
            {fLink(`${base}/contact`, t.nav?.[7] || (lang === 'bn' ? 'যোগাযোগ' : 'Contact'))}
            {booksUrl && (
              <a href={`${booksUrl}/`} target="_blank" rel="noopener" style={{ color: '#f4f1ea', textDecoration: 'none', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {BOOKS_NAME[lang] || BOOKS_NAME.en} <PlatformArrow size={12} />
              </a>
            )}
          </div>

          {/* Stories: the writing platform */}
          <div className="footer-col" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {platformHead('stories', t.h1Library || (lang === 'bn' ? 'গল্প' : 'Stories'))}
            {fLink(`${base}/stories/story`, lang === 'bn' ? 'ছোটগল্প' : 'Short stories')}
            {fLink(`${base}/stories/series`, lang === 'bn' ? 'ধারাবাহিক' : 'Serials')}
            {fLink(`${base}/stories/poetry`, lang === 'bn' ? 'কবিতা' : 'Poetry')}
            {fLink(`${base}/authors`, lang === 'bn' ? 'লেখকেরা' : 'Writers')}
            {fLink(`${addressOn('stories', base)}/account#author`, lang === 'bn' ? 'লেখার আবেদন' : 'Write for us')}
          </div>

          {/* Originals: the studio's series and comics */}
          <div className="footer-col" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {platformHead('originals', t.seriesH)}
            {fLink(`${base}/series`, t.nav?.[2] || (lang === 'bn' ? 'সিরিজ' : 'Series'))}
            {fLink(`${base}/comics`, t.nav?.[3] || (lang === 'bn' ? 'কমিকস' : 'Comics'))}
            {fLink(`${base}/watch`, t.nav?.[5] || (lang === 'bn' ? 'ভিডিও' : 'Watch'))}
            {series.slice(0, 4).map(x => fLink(`${base}/series/${x.k}`, (
              <><span style={{ width: 9, height: 9, borderRadius: '50%', background: x.ac, flex: 'none' }} /><span>{x.title}</span></>
            ), { gap: 10 }))}
          </div>

          {/* Follow, and the language */}
          <div className="footer-col" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={headingStyle}>{lang === 'bn' ? 'রূপকের সঙ্গে থাকুন' : 'Follow Rupok'}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(t.socials || []).map(({ k, name, url }) => {
                const Icon = SOCIAL_ICONS[k];
                return (
                  <a
                    key={k}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#c9c5bb', textDecoration: 'none', fontSize: '14px' }}
                    onMouseEnter={onHover}
                    onMouseLeave={onLeave}
                  >
                    {Icon && <Icon />} {name} <IExternal />
                  </a>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: '4px', fontSize: '14px', color: '#8f8b82' }}>
              <span>{t.langH || 'Language'}:</span>
              <button
                type="button"
                onClick={() => onSelectLang?.('en')}
                style={{
                  border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 4px',
                  color: lang === 'en' ? '#fff' : '#c9c5bb',
                  fontWeight: lang === 'en' ? 700 : 400,
                  textDecoration: lang === 'en' ? 'underline' : 'none',
                  font: 'inherit', fontSize: '14px'
                }}
              >EN</button>
              <span>·</span>
              <button
                type="button"
                onClick={() => onSelectLang?.('bn')}
                style={{
                  border: 'none', background: 'transparent', cursor: 'pointer', padding: '2px 4px',
                  color: lang === 'bn' ? '#fff' : '#c9c5bb',
                  fontWeight: lang === 'bn' ? 700 : 400,
                  textDecoration: lang === 'bn' ? 'underline' : 'none',
                  font: 'inherit', fontSize: '14px'
                }}
              >বাংলা</button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginTop: '56px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(244, 241, 234, 0.15)',
            fontSize: '14px',
            color: '#8f8b82'
          }}
        >
          <span>{t.rights}</span>
          {/* The four documents a reader is entitled to find from any page */}
          <nav aria-label={t.footLegal} style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
            {(Array.isArray(t.legalNav) ? t.legalNav : []).map(([slug, label]) => (
              <a key={slug} href={`${base}/${slug}`} style={{ color: '#c9c5bb', textDecoration: 'none' }}
                onMouseEnter={onHover} onMouseLeave={onLeave}>
                {label}
              </a>
            ))}
            <a href="/feed.xml" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#c9c5bb', textDecoration: 'none' }}
              onMouseEnter={onHover} onMouseLeave={onLeave}>
              <IRss /> {t.feedLabel}
            </a>
          </nav>
          <span>{t.ytUrl ? t.ytUrl.replace(/^https?:\/\/(www\.)?/, '') : 'rupok.com'}</span>
          {/* Required by the DB-IP Lite licence (CC BY 4.0) behind the first-visit language choice */}
          <a href="https://db-ip.com" target="_blank" rel="noopener noreferrer" style={{ color: '#8f8b82', textDecoration: 'none', fontSize: 12 }}
            onMouseEnter={onHover} onMouseLeave={onLeave}>
            IP Geolocation by DB-IP
          </a>
        </div>
      </div>
    </footer>
  );
}
