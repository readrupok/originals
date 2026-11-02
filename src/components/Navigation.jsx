import React, { useState } from 'react';
import { Menu, X, UserRound, ChevronRight } from 'lucide-react';
import { ROUTES } from '../data/content';
import { ISearch } from './icons';
import { PLATFORM_WORD, PlatformArrow } from './BrandLockup';
import RupokStoriesMark from './RupokStoriesMark';
import { BOOKS_NAME } from './BooksPromo';
import { addressOn, platformLink, SITE_URLS } from '../lib/sites';
import { openSearch } from '../lib/search';
import useNavBar from './useNavBar';

const INK = '#151515';

// The bar's states — transparent at the top, frosted once scrolled, ink over a
// dark band, hidden while scrolling down — come from useNavBar, shared with
// the platforms' SiteNav. `overlay` lets the page's first section run up
// underneath the bar (the home hero); the open menu makes it solid.
export default function Navigation({ lang, currentRoute, t, base, restPath, user, onSelectLang, overlay = false, booksUrl = '' }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(prev => !prev);
  const closeMenu = () => setMenuOpen(false);
  const { navRef, bar } = useNavBar({ routeKey: `${currentRoute}/${restPath}`, menuOpen, setMenuOpen });

  const active = currentRoute.startsWith('series') ? 'series'
    : currentRoute.startsWith('comics') ? 'comics'
      : currentRoute.startsWith('stories') ? 'stories'
        : (currentRoute === 'authors' || currentRoute === 'author') ? 'authors'
          : currentRoute;
  const onAccount = currentRoute === 'account';
  const accountLabel = user ? t.acc.nav : t.acc.signIn;
  const linkOf = (path = '') => (path ? (base ? `${base}/${path}` : `/${path}`) : (base ? `${base}/` : '/'));

  // The menu: this site's own pages, and one entry per platform that now
  // carries a section (Stories, Originals) in place of that section's pages.
  const items = [];
  ROUTES.forEach((k, i) => {
    const { site } = platformLink(linkOf(k));
    if (!site) return items.push({ key: k || 'home', href: linkOf(k), label: t.nav[i], on: active === k });
    if (!items.some(x => x.key === site)) {
      items.push({ key: site, href: addressOn(site, base), label: PLATFORM_WORD[site][lang], site });
    }
  });
  // Rupok Books, the reading app, is a product of its own: it opens in a new tab like a platform
  if (booksUrl) items.push({ key: 'books', href: `${booksUrl}/`, label: BOOKS_NAME[lang] || BOOKS_NAME.en, site: 'books' });
  const newTab = { target: '_blank', rel: 'noopener' };
  const searchHint = lang === 'bn' ? 'খুঁজতে / চাপুন' : 'Press / to search';

  const state = [
    'rnav',
    overlay && 'is-overlay',
    (bar.scrolled || menuOpen) && 'is-scrolled',
    bar.dark && !menuOpen && 'is-dark',
    bar.hidden && !menuOpen && 'is-hidden',
    menuOpen && 'is-open'
  ].filter(Boolean).join(' ');

  // Quiet text toggle: the current language is bold + underlined, the other is a plain button
  const LangToggle = ({ className }) => (
    <div className={className} role="group" aria-label={t.acc.language} style={{ alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
      {[['en', 'EN'], ['bn', 'বাংলা']].map(([code, label], i) => (
        <React.Fragment key={code}>
          {i > 0 && <span aria-hidden="true" style={{ color: 'var(--nav-muted)' }}>·</span>}
          <button
            type="button"
            onClick={() => {
              closeMenu();
              onSelectLang?.(code);
            }}
            lang={code}
            aria-current={lang === code ? 'true' : undefined}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: lang === code ? 'var(--nav-fg)' : 'var(--nav-muted)',
              fontWeight: lang === code ? 800 : 600,
              textDecoration: lang === code ? 'underline' : 'none',
              textDecorationThickness: 2,
              textUnderlineOffset: 5,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 32,
              minWidth: 32,
              padding: '4px 6px',
              font: 'inherit',
              transition: 'color .3s'
            }}
          >
            {label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );

  const Avatar = ({ size = 24 }) => (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        flex: 'none',
        borderRadius: 8,
        display: 'grid',
        placeItems: 'center',
        background: 'var(--acc)',
        color: '#fff',
        fontFamily: "'Sora', sans-serif",
        fontSize: size * 0.48,
        fontWeight: 800
      }}
    >
      {user ? user.name.charAt(0).toUpperCase() : <UserRound size={size * 0.6} strokeWidth={2.4} />}
    </span>
  );

  return (
    <>
      <nav ref={navRef} data-screen-label="Nav" className={state}>
        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.6vw, 20px)' }}>
          <a
            href={linkOf('')}
            aria-label="Rupok"
            onClick={closeMenu}
            className="rnav-brand"
            style={{ display: 'flex', alignItems: 'center', marginRight: 'auto' }}
          >
            <img
              src="/assets/logos/rupok-logo.png"
              alt="Rupok"
              className="nav-brand-logo"
              style={{ display: 'block', width: 'auto' }}
            />
          </a>

          {/* Desktop links */}
          <div className="desktop-nav" style={{ display: 'none', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 15 }}>
            {items.map(({ key, href, label, on, site }) => (
              <a
                key={key}
                href={href}
                {...(site ? newTab : {})}
                aria-current={on ? 'page' : undefined}
                title={site ? `${label} — ${lang === 'bn' ? 'নতুন ট্যাবে খোলে' : 'opens in a new tab'}` : undefined}
                className={`rnav-link${site ? ` nav-platform nav-platform-${site}` : ''}`}
              >
                {site === 'stories' && <RupokStoriesMark height={16} color="currentColor" style={{ marginRight: 6 }} />}
                {label}
                {site && <PlatformArrow />}
              </a>
            ))}
          </div>

          <LangToggle className="nav-lang" />

          {/* Search and notifications: icon buttons, on every screen size */}
          <button
            type="button"
            onClick={() => { closeMenu(); openSearch(); }}
            aria-label={t.searchNav}
            aria-haspopup="dialog"
            title={`${t.searchNav} — ${searchHint}`}
            className="rnav-chip"
            style={{
              display: 'grid', placeItems: 'center', width: 36, height: 36, flex: 'none', padding: 0, cursor: 'pointer',
              borderRadius: 10, border: `2px solid ${INK}`, background: '#fff', color: INK,
              boxShadow: `2px 2px 0 ${INK}`, fontSize: 16
            }}
          >
            <ISearch />
          </button>



          {/* Mobile menu button */}
          <button
            className="mobile-menu-btn rnav-chip"
            onClick={toggleMenu}
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="rnav-drawer"
            style={{
              display: 'grid',
              placeItems: 'center',
              width: 36,
              height: 36,
              flex: 'none',
              borderRadius: 10,
              border: `2px solid ${INK}`,
              background: menuOpen ? INK : '#fff',
              color: menuOpen ? '#f4f1ea' : INK,
              cursor: 'pointer',
              boxShadow: `2px 2px 0 ${INK}`
            }}
          >
            {menuOpen ? <X size={20} strokeWidth={2.4} /> : <Menu size={20} strokeWidth={2.4} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer: links + account */}
      {menuOpen && (
        <div
          id="rnav-drawer"
          className="rnav-drawer"
          style={{
            position: 'fixed',
            inset: 'var(--nav-h, 64px) 0 0',
            zIndex: 39,
            display: 'flex',
            flexDirection: 'column',
            padding: '20px clamp(12px, 1.8vw, 24px)',
            background: '#f4f1ea',
            overflowY: 'auto',
            overscrollBehavior: 'contain'
          }}
        >
          {items.map(({ key, href, label, on, site }, i) => (
            <a
              key={key}
              href={href}
              {...(site ? newTab : {})}
              onClick={closeMenu}
              aria-current={on ? 'page' : undefined}
              className={site ? `nav-platform nav-platform-${site}` : undefined}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 4px',
                borderBottom: `2px solid ${INK}`,
                color: INK,
                textDecoration: 'none',
                fontFamily: site === 'stories' ? undefined : "'Sora', 'Hind Siliguri', sans-serif",
                fontWeight: 800,
                fontSize: 'clamp(24px, 5vw, 32px)',
                animation: `rnav-drop .42s cubic-bezier(.2,.8,.2,1) ${0.04 * i}s both`
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                {on && <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--acc)', border: `2px solid ${INK}` }} />}
                {site === 'stories' && <RupokStoriesMark height={22} color="currentColor" />}
                {label}
              </span>
              {site ? <PlatformArrow size={20} /> : <ChevronRight size={22} strokeWidth={2.6} />}
            </a>
          ))}


          {/* On a phone the language switch lives here rather than in the bar */}
          <div className="rnav-drawer-lang" style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontWeight: 800 }}>
            <span>{t.acc.language}</span>
            <LangToggle className="nav-lang-drawer" />
          </div>
        </div>
      )}

      <style>{`
        .rnav {
          --nav-fg: ${INK}; --nav-inv: #f4f1ea; --nav-muted: #6b675e; --nav-hover: rgba(21, 21, 21, .07);
          position: relative; z-index: 40;
          padding: 12px clamp(12px, 1.8vw, 24px);
          color: var(--nav-fg);
          background: transparent;
          border-bottom: 2px solid transparent;
          transition: transform .38s cubic-bezier(.2,.8,.2,1), background-color .3s, border-color .3s, padding .3s, color .3s;
        }
        .rnav.is-overlay { margin-bottom: calc(-1 * var(--nav-h, 68px)); }
        .rnav.is-scrolled {
          padding-block: 8px;
          background: rgba(244, 241, 234, .82);
          border-bottom-color: ${INK};
          -webkit-backdrop-filter: blur(14px) saturate(1.5); backdrop-filter: blur(14px) saturate(1.5);
        }
        .rnav.is-dark { --nav-fg: #f4f1ea; --nav-inv: ${INK}; --nav-muted: #a8a397; --nav-hover: rgba(244, 241, 234, .1); }
        .rnav.is-dark.is-scrolled { background: rgba(21, 21, 21, .78); border-bottom-color: rgba(244, 241, 234, .2); }
        .rnav.is-dark .nav-brand-logo { filter: invert(1); }
        .rnav.is-hidden { transform: translateY(calc(-100% - 6px)); }
        .rnav.is-open { background: #f4f1ea; }

        .rnav-link {
          position: relative; display: inline-flex; align-items: center; gap: 5px;
          padding: 8px 14px; border-radius: 10px; text-decoration: none;
          color: var(--nav-fg); transition: background .2s, color .3s;
        }
        .rnav-link:hover { background: var(--nav-hover); }
        .rnav-link[aria-current="page"] { background: var(--nav-fg); color: var(--nav-inv); }
        /* An ink underline that draws in on hover, from the left */
        .rnav-link:not([aria-current="page"])::after {
          content: ''; position: absolute; left: 14px; right: 14px; bottom: 4px; height: 2px;
          background: var(--acc); transform: scaleX(0); transform-origin: left; transition: transform .25s ease;
        }
        .rnav-link:not([aria-current="page"]):hover::after { transform: scaleX(1); }
        .rnav-chip { transition: transform .15s, box-shadow .15s; }
        .rnav-chip:hover { transform: translate(-1px, -1px); }

        .rnav-brand { transition: transform .2s; }
        .rnav-brand:hover { transform: rotate(-3deg) scale(1.05); }
        .nav-brand-logo { height: 42px; transition: height .3s ease, filter .3s; }
        .rnav.is-scrolled .nav-brand-logo { height: 38px; }

        .nav-lang, .nav-lang-drawer { display: flex; }
        /* A phone's bar keeps the logo, search, notifications and the menu */
        @media (max-width: 639px) { .rnav .nav-lang { display: none; } }
        @media (min-width: 640px) { .rnav-drawer-lang { display: none !important; } }
        /* A platform's name is set in its own type, so it reads as a different place */
        .nav-platform-stories { font-family: 'Literata', 'Noto Serif Bengali', Georgia, serif; font-style: italic; }
        .nav-platform-originals { font-family: 'Sora', 'Hind Siliguri', sans-serif; letter-spacing: .08em; text-transform: uppercase; font-size: .86em; }

        .rnav-drawer { animation: rs-in .3s ease-out; }
        @keyframes rnav-drop { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }

        @media (min-width: 980px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
          .nav-brand-logo { height: 46px; }
          .rnav.is-scrolled .nav-brand-logo { height: 40px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .rnav, .rnav-link::after, .nav-brand-logo { transition: none !important; }
          .rnav-drawer, .rnav-drawer a { animation: none !important; }
        }
      `}</style>
    </>
  );
}
