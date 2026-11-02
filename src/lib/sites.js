// ── The three Rupok sites ───────────────────────────────────────────────────
// The main site carries everything. Beside it, two dedicated sites each carry
// one part of it with their own home page, navigation and look:
//   Stories    (<domain>/stories)   — the writing: stories, serials, poetry, authors
//   Originals  (<domain>/originals) — the studio's own series and comics
// (or each on a host of its own: stories.<domain>, originals.<domain>)
// All three are this one build talking to one API, so an account, a purchase
// and reading progress are the same everywhere.
//
// Pages are written against one set of paths — the main site's (/stories/...,
// /series/..., /comics/...). This module maps those to the address on the
// site the reader is on, and sends the reader to the right site for a page
// this one does not carry.
//
// server/src/lib/sites.js holds the same rules — keep the two in step
// (server/tests/unit/sites.test.mjs checks they agree).

export const SITE_KEYS = ['main', 'stories', 'originals'];
const LEGAL_PAGES = ['terms', 'privacy', 'refunds', 'guidelines'];

// Which dedicated site a section belongs to, by its first path segment
const OWNER = { stories: 'stories', authors: 'stories', author: 'stories', series: 'originals', comics: 'originals', watch: 'originals' };
// Pages every site renders itself: the reader's account, search, and the policies
const EVERYWHERE = ['account', 'search', ...LEGAL_PAGES];
// On the Stories site the section is the whole site, so its pages drop the
// /stories prefix (/story, /:handle/:key). These first segments keep their
// usual meaning there. `series` is not among them: on Stories it is the
// serials listing, not the studio's series.
const STORIES_KEEP = ['authors', 'author', 'account', 'search', ...LEGAL_PAGES, 'comics', 'watch', 'studio', 'contact', 'partners'];

// The dedicated site a page belongs to, if any. The author desk sits under
// /account but is the writing side of Stories, so it belongs there.
const sectionOf = parts => (parts[0] === 'account' && parts[1] === 'desk' ? 'stories' : OWNER[parts[0]]);

/** The rules, for a given set of site addresses ('' = that site is not deployed). */
export function siteRules(urls) {
  const isLive = site => site === 'main' || !!urls[site];

  const ownerOf = (parts, here) => {
    const p0 = parts[0];
    if (!p0) return here;
    if (p0 === 'account' && here === 'main') return 'stories';
    const site = sectionOf(parts);
    return site && isLive(site) ? site : 'main';
  };

  // Once a dedicated site is live, the main site no longer carries its
  // sections: it links to them instead.
  const servesLocally = (here, parts) => {
    const p0 = parts[0];
    if (!p0) return true;
    if (p0 === 'account' && here === 'main') return false;
    const site = sectionOf(parts);
    if (site) return here === 'main' ? !isLive(site) : site === here;
    return here === 'main' || EVERYWHERE.includes(p0);
  };

  const toPhysical = (here, parts) => (here === 'stories' && parts[0] === 'stories' ? parts.slice(1) : parts);

  const toLogical = (here, physical) => {
    let parts = physical;
    let canonical = true;
    if (parts[0] === 'library') {
      parts = ['stories', ...parts.slice(1)];
      canonical = false;
    }
    if (here === 'stories' && parts.length) {
      if (parts[0] === 'stories') canonical = false;
      else if (!STORIES_KEEP.includes(parts[0])) parts = ['stories', ...parts];
      // The section's own landing page is the Stories home
      if (parts.length === 1 && parts[0] === 'stories') parts = [];
    }
    return { parts, canonical };
  };

  return { isLive, ownerOf, servesLocally, toPhysical, toLogical };
}

// ── This page's site ────────────────────────────────────────────────────────

const trimUrl = u => String(u || '').trim().replace(/\/+$/, '');
const hasDom = typeof document !== 'undefined' && typeof window !== 'undefined';

/**
 * The addresses come from the server, which writes them into every page it
 * renders (<meta name="rupok-sites">). The Vite dev server renders nothing,
 * so in development they come from VITE_SITE_URL / VITE_STORIES_URL /
 * VITE_ORIGINALS_URL instead (e.g. http://localhost:5173/stories).
 */
function readUrls() {
  let meta = {};
  try { meta = JSON.parse(document.querySelector('meta[name="rupok-sites"]')?.content || '{}'); } catch { /* none */ }
  const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
  const origin = hasDom && window.location ? window.location.origin : '';
  const pick = (key, envKey) => {
    const u = trimUrl(meta[key] || env[envKey]);
    return /^https?:\/\//.test(u) ? u : '';
  };
  const main = pick('main', 'VITE_SITE_URL') || origin;
  return {
    main,
    stories: pick('stories', 'VITE_STORIES_URL') || (origin ? `${origin}/stories` : ''),
    originals: pick('originals', 'VITE_ORIGINALS_URL') || (origin ? `${origin}/originals` : '')
  };
}

const hostOf = u => { try { return new URL(u).host.toLowerCase(); } catch { return ''; } };
const pathOf = u => { try { return new URL(u).pathname.replace(/\/+$/, ''); } catch { return ''; } };

const urls = hasDom ? readUrls() : { main: '', stories: '', originals: '' };

/**
 * The site an address belongs to. A platform lives on a host of its own
 * (stories.rupok.com) or under a path of the main one (rupok.com/stories);
 * on a shared host the longest matching path wins, and anything else is main.
 */
function siteOfAddress(host, pathname) {
  const h = String(host || '').toLowerCase();
  const p = String(pathname || '/');
  let best = null;
  for (const site of ['stories', 'originals']) {
    if (!urls[site] || hostOf(urls[site]) !== h) continue;
    const base = pathOf(urls[site]);
    if (base && p !== base && !p.startsWith(`${base}/`)) continue;
    if (!best || base.length > pathOf(urls[best]).length) best = site;
  }
  return best || 'main';
}

/** Which site this page is: 'main', 'stories' or 'originals'. */
export const SITE = !hasDom ? 'main' : siteOfAddress(window.location.host, window.location.pathname);

/** This site's path on its host: '/stories' when it lives under the main site's address, else ''. */
export const SITE_BASE = SITE === 'main' ? '' : pathOf(urls[SITE]);

// The platform's theme tokens (index.css) hang off <html data-site>, set
// before the first render so a platform never flashes the main site's look.
if (hasDom && SITE !== 'main') document.documentElement.dataset.site = SITE;

// The main site's address: from the server, else this page's own origin when
// that is the main site (or a platform under a path of it), else this host
// without its stories./originals. label.
if (hasDom && !urls.main) {
  urls.main = SITE === 'main' || SITE_BASE
    ? window.location.origin
    : `${window.location.protocol}//${window.location.host.replace(/^(stories|originals)\./i, '')}`;
}

/** A path on this site, with the site's own prefix: '/en/series' → '/originals/en/series'. */
export const onThisSite = path => (SITE_BASE && path === '/' ? SITE_BASE : SITE_BASE + path);

/**
 * An address on another Rupok site. `base` is a page's own link base (this
 * site's prefix and the language, '/stories/en'); only its language carries
 * over: addressOn('main', '/stories/en', '/account') → https://rupok.com/en/account.
 */
export function addressOn(site, base = '', path = '/') {
  const lang = SITE_BASE && base.startsWith(SITE_BASE) ? base.slice(SITE_BASE.length) : base;
  const rest = `${lang}${path}`.replace(/\/$/, '');
  return urls[site] + (rest || (pathOf(urls[site]) ? '' : '/'));
}

/** Every site's address ('' for a dedicated site that is not deployed). */
export const SITE_URLS = urls;
/** True once at least one dedicated site is deployed. */
export const HAS_SUBSITES = !!(urls.stories || urls.originals);

const rules = siteRules(urls);
export const { isLive, ownerOf, servesLocally, toPhysical, toLogical } = rules;

/**
 * A link as the pages write it (/en/stories/ana/first-light?ch=2) → where it
 * goes from this site: a path here, or the full address on the site that
 * carries the page. Anything that is not a plain in-site path is left alone.
 */
export function siteHref(href) {
  if (typeof href !== 'string' || !href.startsWith('/') || href.startsWith('//')) return href;
  const m = href.match(/^([^?#]*)(.*)$/);
  // The /api, the CMS and files (/feed.xml) are not pages
  if (/^\/(api|cms)(\/|$)/.test(m[1]) || /\.[a-z0-9]{2,5}$/i.test(m[1])) return href;
  // A path already carrying this site's prefix (/stories/...) is written as it
  // reads here; any other is written against the main site's paths.
  let path = m[1];
  let writtenOn = 'main';
  if (SITE_BASE && (path === SITE_BASE || path.startsWith(`${SITE_BASE}/`))) {
    path = path.slice(SITE_BASE.length) || '/';
    writtenOn = SITE;
  }
  let segs = path.split('/').filter(Boolean);
  const prefix = segs[0] === 'en' ? '/en' : '';
  if (prefix) segs = segs.slice(1);
  // Stored links (notifications) can still carry the old /library prefix
  const { parts } = toLogical(writtenOn, segs);
  const target = servesLocally(SITE, parts) ? SITE : ownerOf(parts, SITE);
  const local = (prefix + '/' + toPhysical(target, parts).join('/')).replace(/^\/en\/$/, '/en');
  if (target === SITE) return onThisSite(local) + m[2];
  return (local === '/' && pathOf(urls[target]) ? urls[target] : urls[target] + local) + m[2];
}

/** The Rupok site an absolute address belongs to, when it is one other than this. */
export function otherSiteOf(href) {
  if (!/^https?:\/\//.test(String(href || ''))) return null;
  let u;
  try { u = new URL(href); } catch { return null; }
  const isOurs = SITE_KEYS.some(s => urls[s] && hostOf(urls[s]) === u.host.toLowerCase());
  if (!isOurs) return null;
  const site = siteOfAddress(u.host, u.pathname);
  return site === SITE ? null : site;
}

/** The Rupok site a same-origin path belongs to ('main', 'stories' or 'originals'). */
export const siteOfPath = pathname => (hasDom ? siteOfAddress(window.location.host, pathname) : 'main');

/**
 * A link as the pages write it → { href, site }: `site` is the other Rupok
 * site it opens on, or null when it stays on this one. Headers and footers use
 * it to mark such links with an arrow.
 */
export function platformLink(path) {
  const href = siteHref(path);
  return { href, site: otherSiteOf(href) };
}

/**
 * Keeps every link's href pointing where it really goes, so hovering, copying
 * or opening a link in a new tab all see the true address. A link to another
 * Rupok site opens in a new tab. React writes the pages' own links; this
 * rewrites each one once, and again only when React gives it a new value.
 */
export function installLinkRewriter() {
  if (!hasDom || typeof MutationObserver === 'undefined') return () => {};
  const written = new WeakMap();
  const fix = a => {
    const href = a.getAttribute('href');
    if (!href || written.get(a) === href) return;
    const next = siteHref(href);
    written.set(a, next);
    if (next !== href) a.setAttribute('href', next);
    if (otherSiteOf(next) && !a.hasAttribute('target')) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    }
  };
  const scan = node => {
    if (node.nodeType !== 1) return;
    if (node.tagName === 'A' && node.hasAttribute('href')) fix(node);
    node.querySelectorAll?.('a[href]').forEach(fix);
  };
  const observer = new MutationObserver(records => {
    for (const r of records) {
      if (r.type === 'attributes') fix(r.target);
      else r.addedNodes.forEach(scan);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['href'] });
  scan(document.body);
  return () => observer.disconnect();
}

/**
 * The domain a cookie can share between the sites (rupokstudio.com for
 * rupokstudio.com and stories.rupokstudio.com), or '' when there is nothing
 * to share or no domain to share it on (localhost, an IP address).
 */
export function sharedCookieDomain() {
  if (!hasDom || !HAS_SUBSITES) return '';
  const hosts = [urls.main, urls.stories, urls.originals].filter(Boolean)
    .map(u => { try { return new URL(u).hostname.toLowerCase(); } catch { return ''; } }).filter(Boolean);
  if (!hosts.length) return '';
  const labels = hosts.map(h => h.split('.').reverse());
  const common = [];
  for (let i = 0; labels.every(l => l[i] !== undefined && l[i] === labels[0][i]); i++) common.push(labels[0][i]);
  const domain = common.reverse().join('.');
  if (!domain.includes('.') || /^[\d.]+$/.test(domain)) return '';
  return window.location.hostname.toLowerCase().endsWith(domain) ? domain : '';
}
