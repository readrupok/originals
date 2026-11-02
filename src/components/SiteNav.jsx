import React, { useState } from 'react';
import { Menu, X, UserRound, ChevronRight } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { ISearch } from './icons';
import BrandLockup, { PLATFORM_WORD, PlatformArrow } from './BrandLockup';
import { SOCIAL_ICONS } from './SocialIcons';
import { addressOn, SITE_URLS } from '../lib/sites';
import { openSearch } from '../lib/search';
import useNavBar from './useNavBar';

// The navigation bar of the two dedicated platforms (Stories, Originals). Each
// passes its own links and theme; the behaviour — language toggle, search,
// notifications, account, and the drawer on small screens — is the same as
// the main site's Navigation. Beside its own pages it carries "More from
// Rupok": the main site and the other platform, each opening in a new tab.
// It behaves like the main bar (useNavBar): transparent at the top, the
// platform's frosted bar once scrolled, hidden while scrolling down.
// `overlay` runs the page's first section up underneath it (the Originals hero).

export const NAV_THEMES = {
  stories: {
    bar: 'rgba(250, 246, 238, 0.92)', fg: '#1c1917', muted: '#78716c', line: '#e7dfd2',
    accent: '#9a3412', onAccent: '#fff', pill: '#f1e8da', drawer: '#faf6ee', tone: 'light', hover: 'rgba(28, 25, 23, .06)',
    linkFont: "'Literata', 'Noto Serif Bengali', Georgia, serif"
  },
  originals: {
    bar: 'rgba(8, 8, 8, 0.86)', fg: '#fafaf9', muted: '#a8a29e', line: 'rgba(255, 255, 255, 0.1)',
    accent: '#f5c542', onAccent: '#151515', pill: 'rgba(255, 255, 255, 0.1)', drawer: '#0b0b0b', tone: 'dark', hover: 'rgba(255, 255, 255, .07)',
    linkFont: "'Sora', 'Hind Siliguri', sans-serif"
  }
};

export default function SiteNav({ theme, links, lang, t, base, user, currentRoute, routeKey, onSelectLang, overlay = false }) {
  const th = NAV_THEMES[theme];
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const { navRef, bar } = useNavBar({ routeKey: routeKey ?? currentRoute, menuOpen, setMenuOpen, wideAt: 1100 });
  const onAccount = currentRoute === 'account';
  const state = [
    'snav',
    overlay && 'is-overlay',
    (bar.scrolled || menuOpen) && 'is-scrolled',
    bar.hidden && !menuOpen && 'is-hidden'
  ].filter(Boolean).join(' ');
  const newTabNote = lang === 'bn' ? 'নতুন ট্যাবে খোলে' : 'opens in a new tab';

  // The main site and the other platform
  const elsewhere = [
    { site: 'main', label: lang === 'bn' ? 'রূপক' : 'Rupok', href: addressOn('main', base) },
    ...['stories', 'originals'].filter(s => s !== theme && SITE_URLS[s])
      .map(s => ({ site: s, label: PLATFORM_WORD[s][lang], href: addressOn(s, base) }))
  ];

  const iconBtn = on => ({
    display: 'grid', placeItems: 'center', width: 36, height: 36, flex: 'none',
    borderRadius: 999, border: `1px solid ${th.line}`,
    background: on ? th.fg : 'transparent', color: on ? th.bar : th.fg, cursor: 'pointer'
  });

  const langToggle = (
    <div role="group" aria-label={t.acc.language} className="site-nav-lang" style={{ alignItems: 'center', gap: 2, fontSize: 13, fontWeight: 700 }}>
      {[['en', 'EN'], ['bn', 'বাংলা']].map(([code, label]) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-current={lang === code ? 'true' : undefined}
          onClick={() => { closeMenu(); onSelectLang?.(code); }}
          style={{
            border: 'none', borderRadius: 999, cursor: 'pointer', font: 'inherit',
            padding: '5px 10px', minHeight: 30,
            background: lang === code ? th.pill : 'transparent',
            color: lang === code ? th.fg : th.muted
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <nav ref={navRef} data-screen-label={`${theme} — Nav`} className={state}>
        <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.4vw, 18px)' }}>
          <a href={`${base}/`} onClick={closeMenu} aria-label={`Rupok ${PLATFORM_WORD[theme].en}`} style={{ display: 'flex', alignItems: 'center', marginRight: 'auto', textDecoration: 'none' }}>
            <BrandLockup site={theme} lang={lang} tone={th.tone} size={34} />
          </a>

          <div className="site-nav-links" style={{ alignItems: 'center', gap: 2, fontWeight: 600, fontSize: 15 }}>
            {links.map(l => (
              <a
                key={l.href}
                href={l.href}
                aria-current={l.active ? 'page' : undefined}
                className="snav-link"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* More from Rupok — separate platforms, so they open in a new tab */}
          <div className="site-nav-links" aria-label={lang === 'bn' ? 'রূপকের আরও' : 'More from Rupok'} role="group"
            style={{ alignItems: 'center', gap: 2, paddingLeft: 10, borderLeft: `1px solid ${th.line}`, fontSize: 13, fontWeight: 700 }}>
            {elsewhere.map(x => (
              <a key={x.site} href={x.href} target="_blank" rel="noopener" title={`${x.label} — ${newTabNote}`}
                className="site-nav-elsewhere"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 9px', borderRadius: 999, color: th.muted, textDecoration: 'none' }}>
                {x.label} <PlatformArrow size={11} />
              </a>
            ))}
          </div>

          {langToggle}

          <button
            type="button" onClick={() => { closeMenu(); openSearch(); }}
            aria-label={t.searchNav} aria-haspopup="dialog"
            title={`${t.searchNav} — ${lang === 'bn' ? 'খুঁজতে / চাপুন' : 'Press / to search'}`}
            className="snav-icon" style={iconBtn(false)}
          >
            <ISearch />
          </button>
          <NotificationBell user={user} lang={lang} t={t} base={base} />

          <a
            href={`${base}/account`}
            className="site-nav-links"
            aria-label={user ? `${t.acc.nav}: ${user.name}` : t.acc.signIn}
            title={user ? user.email : t.acc.signIn}
            style={{
              alignItems: 'center', gap: 8, height: 36, padding: '0 14px 0 4px', borderRadius: 999,
              background: th.accent, color: th.onAccent, textDecoration: 'none',
              fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
              outline: onAccount ? `2px solid ${th.fg}` : 'none', outlineOffset: 2
            }}
          >
            <span aria-hidden="true" style={{
              width: 28, height: 28, borderRadius: 999, display: 'grid', placeItems: 'center',
              background: 'rgba(0, 0, 0, 0.18)', fontWeight: 800, fontSize: 13
            }}>
              {user ? user.name.charAt(0).toUpperCase() : <UserRound size={16} strokeWidth={2.4} />}
            </span>
            {user ? t.acc.nav : t.acc.signIn}
          </a>

          <button
            type="button"
            className="site-nav-menu"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            style={iconBtn(false)}
          >
            {menuOpen ? <X size={19} strokeWidth={2.4} /> : <Menu size={19} strokeWidth={2.4} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div style={{
          position: 'fixed', inset: 'var(--nav-h, 58px) 0 0', zIndex: 39, overscrollBehavior: 'contain', display: 'flex', flexDirection: 'column',
          padding: '16px clamp(12px, 1.8vw, 24px)', background: th.drawer, color: th.fg,
          overflowY: 'auto', animation: 'rs-in 0.3s ease-out'
        }}>
          {[...links, { href: `${base}/account`, label: user ? user.name : t.acc.signIn, active: onAccount }].map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={closeMenu}
              aria-current={l.active ? 'page' : undefined}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 4px', borderBottom: `1px solid ${th.line}`,
                color: l.active ? th.accent : th.fg, textDecoration: 'none',
                fontFamily: th.linkFont, fontWeight: 700, fontSize: 'clamp(22px, 5vw, 28px)'
              }}
            >
              <span>{l.label}</span>
              <ChevronRight size={20} strokeWidth={2.4} />
            </a>
          ))}

          <span style={{ marginTop: 28, fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: th.muted }}>
            {lang === 'bn' ? 'রূপকের আরও' : 'More from Rupok'}
          </span>
          {elsewhere.map(x => (
            <a key={x.site} href={x.href} target="_blank" rel="noopener" onClick={closeMenu}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 4px', borderBottom: `1px solid ${th.line}`, color: th.fg, textDecoration: 'none', fontWeight: 700, fontSize: 18 }}>
              <span>{x.label}</span>
              <PlatformArrow size={18} />
            </a>
          ))}

          {(t?.socials || []).length > 0 && (
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: th.muted }}>
                {lang === 'bn' ? 'সামাজিক মাধ্যম' : 'Follow Us'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {t.socials.map(({ k, name, url }) => {
                  const Icon = SOCIAL_ICONS[k];
                  if (!Icon) return null;
                  return (
                    <a
                      key={k}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer me"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 14px',
                        borderRadius: 999,
                        background: th.pill,
                        color: th.fg,
                        textDecoration: 'none',
                        fontSize: 14,
                        fontWeight: 600,
                        border: `1px solid ${th.line}`
                      }}
                    >
                      <Icon /> <span>{name}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* On a phone the language switch lives here rather than in the bar */}
          <div className="snav-drawer-lang" style={{ marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontWeight: 700 }}>
            <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: th.muted }}>{t.acc.language}</span>
            {langToggle}
          </div>
        </div>
      )}

      <style>{`
        .snav {
          position: relative; z-index: 40;
          padding: 12px clamp(12px, 1.8vw, 24px);
          color: ${th.fg}; background: transparent; border-bottom: 1px solid transparent;
          transition: transform .38s cubic-bezier(.2,.8,.2,1), background-color .3s, border-color .3s, padding .3s;
        }
        .snav.is-overlay { margin-bottom: calc(-1 * var(--nav-h, 60px)); }
        /* Over a picture at the top, a soft shade keeps the bar readable */
        /* Drawn edge to edge: inside the padding only, the shade would repeat into
           the bottom border as a dark line */
        .snav.is-overlay:not(.is-scrolled) {
          background: linear-gradient(180deg, ${th.tone === 'dark' ? 'rgba(0,0,0,.78)' : 'rgba(250,246,238,.7)'}, transparent) border-box no-repeat;
        }
        .snav.is-overlay:not(.is-scrolled) .snav-link,
        .snav.is-overlay:not(.is-scrolled) .site-nav-elsewhere { color: ${th.fg} !important; text-shadow: 0 1px 10px rgba(0, 0, 0, .6); }
        .snav.is-scrolled {
          padding-block: 8px; background: ${th.bar}; border-bottom-color: ${th.line};
          -webkit-backdrop-filter: blur(14px) saturate(1.4); backdrop-filter: blur(14px) saturate(1.4);
        }
        .snav.is-hidden { transform: translateY(calc(-100% - 4px)); }
        .snav-link {
          position: relative; padding: 8px 14px; border-radius: 999px; text-decoration: none;
          color: ${th.muted}; transition: color .2s, background .2s;
        }
        .snav-link:hover { color: ${th.fg}; background: ${th.hover}; }
        .snav-link[aria-current="page"] { color: ${th.fg}; background: ${th.pill}; }
        .snav-link:not([aria-current="page"])::after {
          content: ''; position: absolute; left: 50%; bottom: 3px; width: 4px; height: 4px; border-radius: 50%;
          background: ${th.accent}; transform: translateX(-50%) scale(0); transition: transform .2s;
        }
        .snav-link:not([aria-current="page"]):hover::after { transform: translateX(-50%) scale(1); }
        .snav-icon { transition: background .2s, border-color .2s; }
        .snav-icon:hover { background: ${th.hover} !important; }
        @media (prefers-reduced-motion: reduce) { .snav, .snav-link, .snav-link::after { transition: none !important; } }
        .site-nav-links { display: none !important; }
        .site-nav-lang { display: flex; }
        /* A phone's bar keeps the logo, search, notifications and the menu */
        @media (max-width: 639px) { .snav .site-nav-lang { display: none; } }
        @media (min-width: 640px) { .snav-drawer-lang { display: none !important; } }
        .site-nav-elsewhere:hover { color: ${th.fg} !important; background: ${th.pill}; }
        @media (min-width: 1100px) {
          .site-nav-links { display: flex !important; }
          .site-nav-menu { display: none !important; }
        }
      `}</style>
    </>
  );
}
