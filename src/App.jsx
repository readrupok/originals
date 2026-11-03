import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ScrollRail from './components/ScrollRail';
import PaymentModal from './components/PaymentModal';
import LinkAccount from './components/LinkAccount';
import { IAlert } from './components/icons';

import Home from './pages/Home';
import Series from './pages/Series';
import SeriesDetail from './pages/SeriesDetail';
import Comics from './pages/Comics';
import ComicReader from './pages/ComicReader';
import Authors from './pages/Authors';
import Watch from './pages/Watch';
import Studio from './pages/Studio';
import Contact from './pages/Contact';
import Account from './pages/Account';
import NotFound from './pages/NotFound';
import SearchPanel from './components/SearchPanel';
import Partners from './pages/Partners';
import Legal from './pages/Legal';

import Writers from './pages/Library';
import LibraryList from './pages/LibraryList';
import AuthorProfile from './pages/AuthorProfile';
import WorkReader from './pages/WorkReader';
import AuthorDesk from './pages/AuthorDesk';

// The dedicated sites' own pages and frame (lib/sites.js)
import SiteNav from './components/SiteNav';
import SiteFooter from './components/SiteFooter';
import StoriesHome, { kindLabel } from './pages/StoriesHome';
import StoriesShelf from './pages/StoriesShelf';
import OriginalsHome from './pages/OriginalsHome';
import OriginalsBrowse from './pages/OriginalsBrowse';
import OriginalsSeries from './pages/OriginalsSeries';
import OriginalsWatch from './pages/OriginalsWatch';
import OgPreview from './components/OgPreview';
import { booksUrlOf } from './components/BooksPromo';

import { ACC0, num, pad, WORK_KINDS, LEGAL_PAGES } from './data/content';
import { api, getUserToken } from './services/api';
import { applySeoHead } from './lib/seoHead';
import { SITE, SITE_BASE, SITE_URLS, onThisSite, siteOfPath, ownerOf, servesLocally, toLogical, toPhysical, installLinkRewriter } from './lib/sites';
import { installReveal, installPow } from './lib/motion';
import { openSearch } from './lib/search';

// Bangla at the clean path, English under /en — the same rule as the server's seo.js
const langPath = (lang, parts) => `${lang === 'en' ? '/en' : ''}/${parts.length ? parts.join('/') : ''}`.replace(/^\/en\/$/, '/en');
// A page's path as this site reads it (without the site's own /stories prefix)…
const localPath = (lang, parts) => langPath(lang, toPhysical(SITE, parts));
// …and its full address on this host
const sitePath = (lang, parts) => onThisSite(localPath(lang, parts));

// How each site looks around its pages
const SITE_FRAME = {
  main: { bg: '#f4f1ea', fg: '#151515', dots: true, theme: '#f4f1ea' },
  stories: { bg: '#faf6ee', fg: '#1c1917', dots: false, theme: '#faf6ee' },
  originals: { bg: '#0b0b0b', fg: '#f5f5f4', dots: false, theme: '#0b0b0b' }
};
// Search engines read every URL in its own language and are never moved to another
const IS_BOT = typeof navigator !== 'undefined' && /bot|crawl|spider|slurp|lighthouse|google|bing|yandex|baidu|duckduck/i.test(navigator.userAgent);
// The language of the head the server rendered into this page (<html lang>), read before the app changes it
const SSR_LANG = typeof document !== 'undefined' ? document.documentElement.lang : '';

const coinPrice = (value, lang) => { const digits='০১২৩৪৫৬৭৮৯'; const n=Number(String(value||'0').replace(/[০-৯]/g,d=>digits.indexOf(d)).replace(/[^0-9.]/g,'')); return `${Math.ceil(n)} ${lang==='bn'?'কয়েন':'coins'}`; };
// ─── Transform raw API series/comics data into the exact shape all pages use ─
function buildSeriesList(rawSeries, rawComics, lang, t, base, unlockedSeries, pendingSeries = {}) {
  return rawSeries.map((x, i) => {
    const isLocked = !!x.paid && !unlockedSeries[x.k];
    const passPrice = x.paid ? coinPrice(x.pass_price_bdt,lang) : '';

    return {
      k: x.k,
      i,
      num: num(pad(i + 1), lang),
      title: x.title,
      sub: x.sub,
      genre: x.genre,
      gk: x.gk,
      tags: x.tags || [],
      log: x.log,
      prod: !!x.prod,
      status: x.prod ? t.prod : t.dev,
      eps: (x.episodes || []).map(e => ({
        n: num(pad(e.num), lang),
        t: e.title,
        live: !!e.live,
        url: e.youtube_url
      })),
      epRaw: (x.episodes || []).length,
      epCount: num((x.episodes || []).length, lang),
      runtime: num((x.episodes || []).length * 3, lang),
      ac: x.ac,
      poster: x.poster || `/assets/series/${x.k}-poster.jpg?v=5`,
      hasBanner: !!x.hasBanner,
      banner: x.banner,
      href: `${base}/series/${x.k}`,
      // First issue of the series (comics arrive ordered by issue); none → no "Read the comic" link
      comicHref: (k => (k ? `${base}/comics/${k}` : null))(rawComics.find(c => c.series_key === x.k)?.k),
      paid: !!x.paid,
      locked: isLocked,
      pending: isLocked && !!pendingSeries[x.k],
      access: x.paid ? t.premium : t.free,
      passPrice,
      pass_price_bdt: x.pass_price_bdt,
      pass_price_usd: x.pass_price_usd
    };
  });
}

function buildComicsList(rawComics, seriesList, lang, t, base, unlockedComics, unlockedSeries, pendingComics = {}, pendingSeries = {}) {
  return rawComics.map((c, i) => {
    const s = seriesList.find(x => x.k === c.series_key) || {};
    const paid = !!c.is_paid;
    // A comic unlocks by buying it directly or by owning its series pass
    const locked = paid && !unlockedComics[c.k] && !unlockedSeries[c.series_key];
    const price = paid ? coinPrice(c.price_bdt,lang) : '';

    return {
      k: c.k,
      i,
      seriesKey: c.series_key,
      title: s.title,
      seriesHref: s.href,
      sub: c.sub,
      syn: c.syn,
      pages: c.pages,
      issueNumber: c.issue,
      issue: (t.issueLabel || '{n}').replace('{n}', num(pad(c.issue || 1), lang)),
      status: t.soon,
      ac: s.ac,
      // The issue's own cover in the reader's language, else the series poster
      poster: c.cover || s.poster,
      href: `${base}/comics/${c.k}`,
      paid,
      locked,
      pending: locked && !!(pendingComics[c.k] || pendingSeries[c.series_key]),
      access: paid ? t.premium : t.free,
      price,
      price_bdt: c.price_bdt,
      price_usd: c.price_usd,
      hasPages: !!c.hasPages,
      pagesLang: c.pagesLang || null,
      pagesLabel: num(c.pages, lang)
    };
  });
}

// ─── Build the UI strings from DB content (CMS → Page Content) + site settings ─
// ─── Writings and authors → the shape the Library pages consume ─────────────
function buildLibraryList(rawLibrary, lang, base) {
  if (!Array.isArray(rawLibrary)) return [];
  return rawLibrary.map(w => ({
    ...w,
    paid: false,
    locked: false,
    price_bdt: null,
    price_usd: null,
    // Drives the translate banner: the piece is in one language, the reader
    // may be browsing in the other.
    needsTranslation: w.language !== lang,
    cover: w.cover ? api.libraryImageUrl(w.cover) : null,
    href: `${base}/stories/${w.author_handle}/${w.k}`,
    authorHref: `${base}/authors/${w.author_handle}`,
    ac: w.ac || w.author_ac || ACC0
  }));
}

function buildAuthorsList(rawAuthors, base) {
  if (!Array.isArray(rawAuthors)) return [];
  return rawAuthors.map(w => ({
    ...w,
    avatar: w.avatar ? api.libraryImageUrl(w.avatar) : null,
    href: `${base}/authors/${w.handle}`,
    ac: w.ac || ACC0
  }));
}

function buildStrings(content, cfg, lang) {
  const pick = (enKey, bnKey) => (lang === 'bn' ? cfg[bnKey] || cfg[enKey] : cfg[enKey]) || '';
  const bio = pick('founder_bio', 'founder_bio_bn');
  const handle = cfg.youtube_handle || '';
  const fill = v => (typeof v === 'string' ? v.split('{handle}').join(handle) : Array.isArray(v) ? v.map(fill) : v);

  // Namespaced keys (acc.…, stories.…, originals.…) become t.acc, t.stories, t.originals
  const strings = { acc: {}, stories: {}, originals: {} };
  for (const [key, value] of Object.entries(content)) {
    const dot = key.indexOf('.');
    if (dot > 0 && strings[key.slice(0, dot)]) strings[key.slice(0, dot)][key.slice(dot + 1)] = fill(value);
    else strings[key] = fill(value);
  }
  const epFormat = strings.epFormat || '{a} × {b}';
  const founderName = pick('founder_name', 'founder_name_bn') || (lang === 'bn' ? 'মো. রুবায়েত ইসলাম' : 'Md. Rubayet Islam');
  const founderRole = pick('founder_role', 'founder_role_bn') || (lang === 'bn' ? 'প্রতিষ্ঠাতা ও এক্সিকিউটিভ প্রযোজক' : 'Founder & Executive Producer');

  const defaultRoles = [
    [lang === 'bn' ? 'এক্সিকিউটিভ প্রযোজক' : 'Executive Producer', founderName],
    [lang === 'bn' ? 'প্রোডাকশন ম্যানেজার' : 'Production Manager', pick('role_production_manager', 'role_production_manager_bn') || (lang === 'bn' ? 'শীঘ্রই ঘোষণা করা হবে' : 'To be announced')],
    [lang === 'bn' ? 'কাহিনি প্রধান' : 'Narrative Lead', pick('role_narrative_lead', 'role_narrative_lead_bn') || (lang === 'bn' ? 'শীঘ্রই ঘোষণা করা হবে' : 'To be announced')],
    [lang === 'bn' ? 'শিল্প নির্দেশক' : 'Art Director', pick('role_art_director', 'role_art_director_bn') || (lang === 'bn' ? 'শীঘ্রই ঘোষণা করা হবে' : 'To be announced')],
    [lang === 'bn' ? 'প্রকাশনা প্রধান' : 'Publishing Lead', pick('role_publishing_lead', 'role_publishing_lead_bn') || (lang === 'bn' ? 'শীঘ্রই ঘোষণা করা হবে' : 'To be announced')]
  ];

  const studioRoles = Array.isArray(strings.studioRoles) && strings.studioRoles.length
    ? strings.studioRoles
    : defaultRoles;

  return {
    ...strings,
    fmt: (a, b) => epFormat.replace('{a}', a).replace('{b}', b),
    founder: founderName,
    founderRole,
    founderLoc: pick('founder_location', 'founder_location_bn'),
    founderBio: bio,
    founderB: bio,
    studioRoles,
    founderSite: cfg.founder_site || '',
    founderEmail: cfg.studio_email || '',
    ytUrl: cfg.youtube_channel || '#',
    ytHandle: cfg.youtube_handle || '',
    // Social profiles set in CMS → Site Settings; empty ones are hidden
    socials: [
      ['youtube', 'YouTube', cfg.youtube_channel],
      ['facebook', 'Facebook', cfg.facebook_url],
      ['instagram', 'Instagram', cfg.instagram_url],
      ['tiktok', 'TikTok', cfg.tiktok_url]
    ].filter(([, , url]) => /^https:\/\//.test(url || '')).map(([k, name, url]) => ({ k, name, url }))
  };
}

// ─── Minimal loading skeleton ────────────────────────────────────────────────
function Loader() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f4f1ea', flexDirection: 'column', gap: 20
    }}>
      <div style={{
        width: 56, height: 56, border: '4px solid #151515',
        borderTopColor: 'transparent', borderRadius: '50%',
        animation: 'rs-spin 0.7s linear infinite'
      }} />
      <span style={{ fontWeight: 700, fontSize: 15, color: '#6f6758', letterSpacing: '0.05em' }}>
        RUPOK
      </span>
    </div>
  );
}

export default function App() {
  const [lang, setLangState] = useState('bn');
  const [parts, setParts] = useState([]);
  // Signed-in reader and what their account has unlocked (from completed orders)
  const [user, setUser] = useState(null);
  const [needsAccountLink, setNeedsAccountLink] = useState(false);
  const [unlocks, setUnlocks] = useState({ comics: {}, series: {}, works: {}, pendingComics: {}, pendingSeries: {}, pendingWorks: {} });
  const [payModal, setPayModal] = useState(null);
  const [homeAcc, setHomeAcc] = useState(ACC0);
  const [readerFull, setReaderFull] = useState(false);

  // API data state
  const [rawSeries, setRawSeries] = useState([]);
  const [rawComics, setRawComics] = useState([]);
  const [rawLibrary, setRawWritings] = useState([]);
  const [rawAuthors, setRawWriters] = useState([]);
  // The signed-in reader's author state (null until approved) and their
  // latest application, both of which ride along on /auth/me.
  const [author, setAuthor] = useState(null);
  const [application, setApplication] = useState(null);
  const [libraryHistory, setWritingHistory] = useState([]);
  const [siteConfig, setSiteConfig] = useState({});
  const [content, setContent] = useState(null);
  const [comicPages, setComicPages] = useState({});  // { [comicKey_lang]: [...pages] }
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const langRef = useRef(lang);
  langRef.current = lang;

  // Count one visit per page load
  useEffect(() => { api.track('visit'); }, []);

  const toMap = keys => Object.fromEntries((keys || []).map(k => [k, true]));

  const loadAccount = useCallback(async () => {
    if (!getUserToken()) {
      setUser(null);
      setUnlocks({ comics: {}, series: {}, works: {}, pendingComics: {}, pendingSeries: {}, pendingWorks: {} });
      setAuthor(null);
      setApplication(null);
      setWritingHistory([]);
      return;
    }
    const res = await api.me();
    if (res.ok) {
      setNeedsAccountLink(false);
      setUser(res.data.user);
      setUnlocks({
        comics: toMap(res.data.unlocks.comics),
        series: toMap(res.data.unlocks.series),
        works: toMap(res.data.unlocks.works),
        pendingComics: toMap(res.data.pending?.comics),
        pendingSeries: toMap(res.data.pending?.series),
        pendingWorks: toMap(res.data.pending?.works)
      });
      setAuthor(res.data.author || null);
      setApplication(res.data.application || null);
      const history = await api.getLibraryProgress(langRef.current);
      setWritingHistory(history.ok ? history.data || [] : []);
    } else if (res.status === 409) {
      setNeedsAccountLink(true);
    } else if (res.status === 401) {
      api.logout();
      setUser(null);
      setUnlocks({ comics: {}, series: {}, works: {}, pendingComics: {}, pendingSeries: {}, pendingWorks: {} });
      setAuthor(null);
      setApplication(null);
      setWritingHistory([]);
    }
  }, []);

  useEffect(() => { loadAccount(); }, [loadAccount]);

  const signOut = useCallback(() => {
    api.logout();
    loadAccount();
  }, [loadAccount]);

  // ── Fetch data from API ──────────────────────────────────────────────────
  const fetchData = useCallback(async (targetLang) => {
    setLoading(true);
    setApiError(null);
    try {
      const [homeResult, configResult, contentResult, writingsResult, writersResult] = await Promise.all([
        api.getHome(targetLang),
        api.getConfig(),
        api.getContent(targetLang),
        api.getLibrary({ lang: targetLang }),
        api.getAuthors(targetLang)
      ]);
      if (writingsResult.ok) setRawWritings(writingsResult.data || []);
      if (writersResult.ok) setRawWriters(writersResult.data || []);
      if (contentResult.ok && contentResult.data) setContent(contentResult.data);
      else setApiError(contentResult.error || 'Failed to load content');
      if (homeResult.ok && homeResult.data) {
        const d = homeResult.data;
        setRawSeries(d.series || []);
        setRawComics(d.comics || []);
      } else {
        setApiError(homeResult.error || 'Failed to load content');
      }
      if (configResult.ok && configResult.data) {
        setSiteConfig(configResult.data);
      }
    } catch (e) {
      setApiError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Path router (clean URLs: /series/bansher) ─────────────────────────
  const parseRoute = useCallback(() => {
    // Old #/en/... or #/... links still work: rewritten to clean path
    const legacy = (window.location.hash || '').match(/^#\/(.*)$/);
    // A platform under a path of the main host reads its addresses without that prefix
    const full = legacy ? legacy[1] : window.location.pathname;
    const raw = SITE_BASE && (full === SITE_BASE || full.startsWith(`${SITE_BASE}/`)) ? full.slice(SITE_BASE.length) : full;
    let p = raw.split('/').filter(Boolean).map(decodeURIComponent);

    // Each language has its own URL so search engines index both: Bangla at the
    // clean path, English under /en. A URL with /en is followed as it is. On a clean
    // path a returning visitor keeps their language, and a first visit follows the
    // server's guess from their location (Bangla in Bangladesh and West Bengal,
    // English elsewhere) — except for search engines, which read the URL as it is.
    let urlLang = null;
    if (p[0] === 'en' || p[0] === 'bn') {
      urlLang = p[0];
      p = p.slice(1);
    }
    // The address as this site writes it → the path the pages are written against
    const { parts: logical, canonical } = toLogical(SITE, p);
    let lang = urlLang;
    if (!lang && IS_BOT) lang = 'bn';
    if (!lang) {
      let stored = null;
      try { stored = localStorage.getItem('rupok-lang'); } catch (e) { }
      const geoLang = document.querySelector('meta[name="rupok-geo-lang"]')?.content;
      lang = stored === 'en' || stored === 'bn' ? stored : geoLang === 'en' ? 'en' : 'bn';
    }

    // A page another site carries: the reader is sent there
    const owner = servesLocally(SITE, logical) ? null : ownerOf(logical, SITE);
    return {
      lang,
      parts: logical,
      away: owner ? SITE_URLS[owner] + langPath(lang, toPhysical(owner, logical)) + window.location.search : null,
      // Already at this language's own URL (Bangla never carries /bn), in this site's form
      ok: !legacy && canonical && urlLang !== 'bn' && (urlLang === 'en') === (lang === 'en')
    };
  }, []);

  const canonicalPath = r => sitePath(r.lang, r.parts);

  const syncRoute = useCallback(() => {
    const r = parseRoute();
    if (r.away) return window.location.replace(r.away);
    if (!r.ok) {
      window.history.replaceState(null, '', canonicalPath(r) + window.location.search + window.location.hash);
    }

    try { localStorage.setItem('rupok-lang', r.lang); } catch (e) { }

    document.documentElement.lang = r.lang;

    // Only refetch if language actually changed
    const prevLang = langRef.current;
    setLangState(r.lang);
    setParts(r.parts);
    window.scrollTo(0, 0);

    if (r.lang !== prevLang) {
      fetchData(r.lang);
    }

    // Analytics: Record page view and visitor metrics
    try {
      api.trackPageView(window.location.pathname, document.referrer).catch(() => {});
    } catch { }
  }, [parseRoute, fetchData]);

  // Switching language moves to the same page's URL in that language
  const changeLang = useCallback((newLang) => {
    try { localStorage.setItem('rupok-lang', newLang); } catch (e) { }
    const r = parseRoute();
    // Replaced, not pushed: Back would only bounce off the remembered language
    window.history.replaceState(null, '', sitePath(newLang, r.parts) + window.location.search + window.location.hash);
    document.documentElement.lang = newLang;
    setLangState(newLang);
    fetchData(newLang);
  }, [fetchData, parseRoute]);

  useEffect(() => {
    const r = parseRoute();
    if (r.away) {
      window.location.replace(r.away);
      return undefined;
    }
    const initialLang = r.lang;
    if (!r.ok) {
      window.history.replaceState(null, '', canonicalPath(r) + window.location.search + window.location.hash);
    }
    try { localStorage.setItem('rupok-lang', initialLang); } catch (e) { }
    document.documentElement.lang = initialLang;
    setLangState(initialLang);
    setParts(r.parts);
    fetchData(initialLang);

    // In-app links are plain <a href="/..."> — handle them without a page reload
    const onClick = e => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname.startsWith('/api') || url.pathname.startsWith('/cms')) return;
      // Another platform on this host is another app: load it, don't route it here
      if (siteOfPath(url.pathname) !== SITE) return;
      // A file (/feed.xml, /sitemap.xml) is served by the server, not a page of this app.
      if (/\.[a-z0-9]{2,5}$/i.test(url.pathname)) return;
      e.preventDefault();
      // syncRoute moves a clean path to /en when the reader is reading in English
      const cleanPath = url.pathname.replace(/\/+$/, '') || '/';
      const curPath = window.location.pathname.replace(/\/+$/, '') || '/';
      const next = cleanPath + url.search + url.hash;
      const current = curPath + window.location.search + window.location.hash;
      const pathChanged = cleanPath !== curPath || url.search !== window.location.search;
      const hashChanged = url.hash !== window.location.hash;

      if (next !== current) {
        window.history.pushState(null, '', next);
      }
      if (pathChanged) {
        syncRoute();
      }
      if (hashChanged) {
        window.dispatchEvent(new Event('hashchange'));
      }
    };
    document.addEventListener('click', onClick);
    window.addEventListener('popstate', syncRoute);
    // On a dedicated site, every link's href is kept at its real address
    const stopRewriting = installLinkRewriter();
    return () => {
      document.removeEventListener('click', onClick);
      window.removeEventListener('popstate', syncRoute);
      stopRewriting();
    };
  }, [parseRoute, syncRoute, fetchData]);

  // ── Page head (title, description, canonical, structured data) ──────────
  // Skipped on the first render when the server already sent this page's head in
  // this language (not when the reader's language moved them to the other URL).
  const seoFirst = useRef(true);
  useEffect(() => {
    const first = seoFirst.current;
    seoFirst.current = false;
    if (first && SSR_LANG === lang) return;
    const path = localPath(lang, parts);
    let live = true;
    api.getSeo(path, SITE).then(r => { if (live && r.ok) applySeoHead(r.data); });
    return () => { live = false; };
  }, [lang, parts]);

  // ── Accent color ─────────────────────────────────────────────────────────
  useEffect(() => {
    const [p0 = '', p1, p2] = parts;
    let targetAcc = ACC0;

    if ((p0 === 'series' || p0 === 'comics') && p1) {
      const seriesKey = p0 === 'comics' ? rawComics.find(c => c.k === p1)?.series_key : p1;
      const s = rawSeries.find(x => x.k === seriesKey);
      if (s) targetAcc = s.ac;
    } else if (p0 === 'stories' && p1) {
      // A piece's own accent, else its author's.
      const piece = p2 && rawLibrary.find(w => w.k === p2);
      const author = rawAuthors.find(w => w.handle === p1);
      targetAcc = piece?.ac || piece?.author_ac || author?.ac || targetAcc;
    } else if (p0 === '') {
      targetAcc = homeAcc;
    }

    document.documentElement.style.setProperty('--acc', targetAcc);
  }, [parts, homeAcc, rawSeries, rawComics, rawLibrary, rawAuthors]);

  // The browser's own chrome takes each site's colour (Originals is dark)
  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', SITE_FRAME[SITE].theme);
  }, []);

  // Originals: sections that fade up into view, and the comic burst on its
  // comic buttons (lib/motion.js)
  useEffect(() => {
    if (SITE !== 'originals') return undefined;
    const stopReveal = installReveal();
    const stopPow = installPow();
    return () => { stopReveal(); stopPow(); };
  }, []);

  // ── Payment handlers ──────────────────────────────────────────────────────
  // Lazy-load comic pages from API when reader opens
  const fetchComicPages = useCallback(async (comicKey) => {
    const cacheKey = `${comicKey}_${langRef.current}`;
    if (comicPages[cacheKey]) return; // already loaded
    if (!Object.keys(comicPages).some(k => k.startsWith(`${comicKey}_`))) api.track('comic_read');
    const result = await api.getComicPages(comicKey, langRef.current);
    if (result.ok && result.data) {
      const pageMap = {};
      for (const p of result.data) pageMap[p.page] = p;
      setComicPages(prev => ({ ...prev, [cacheKey]: pageMap }));
    }
  }, [comicPages]);

  const getComicPageData = useCallback((comicKey, pageNum) => {
    const cacheKey = `${comicKey}_${langRef.current}`;
    return comicPages[cacheKey]?.[pageNum] || null;
  }, [comicPages]);

  // extra carries what the modal cannot look up itself (a Library piece's title and price)
  const openPay = (k, kind = 'comic', extra = {}) => setPayModal({ k, kind, ...extra });
  const closePay = () => setPayModal(null);

  // Confirm a server-priced shared-wallet purchase and refresh access.
  const submitOrder = useCallback(async payload => {
    const res = await api.submitOrder(payload);
    if (res.ok) await loadAccount();
    return res;
  }, [loadAccount]);

  // ── Reader fullscreen ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isComicReader(parts)) setReaderFull(false);
  }, [parts]);

  useEffect(() => {
    if (readerFull) {
      document.body.classList.add('reader-fullscreen');
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('reader-fullscreen');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('reader-fullscreen');
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [readerFull]);

  // ── Derived data ─────────────────────────────────────────────────────────
  const t = content ? buildStrings(content, siteConfig, lang) : null;
  // Rupok Books, the reading app: promoted on every site once CMS → Settings → books_url is set
  const booksUrl = booksUrlOf(siteConfig);
  // Links on this site: its own prefix (/stories) and the language (/en)
  const base = SITE_BASE + (lang === 'en' ? '/en' : '');
  // p2/p3 reach the author, piece and chapter segments of /authors/:handle/:key/:n
  const [p0 = '', p1 = '', p2 = '', p3 = ''] = parts;
  const restPath = parts.join('/');

  // Lists need the UI strings; before content loads they stay empty (the loader is shown)
  const seriesList = t ? buildSeriesList(rawSeries, rawComics, lang, t, base, unlocks.series, unlocks.pendingSeries) : [];
  const comicsList = t ? buildComicsList(rawComics, seriesList, lang, t, base, unlocks.comics, unlocks.series, unlocks.pendingComics, unlocks.pendingSeries) : [];
  const libraryList = buildLibraryList(rawLibrary, lang, base);
  const authorsList = buildAuthorsList(rawAuthors, base);

  const sExists = seriesList.some(x => x.k === p1);
  const cExists = comicsList.some(x => x.k === p1);

  const isHome = p0 === '';
  const isSeries = p0 === 'series' && !p1;
  const isSeriesDetail = p0 === 'series' && sExists;
  const isComicsPage = p0 === 'comics' && !p1;
  const isComicReaderPage = p0 === 'comics' && cExists;
  const isAuthors = (p0 === 'authors' || p0 === 'author') && !p1;
  const isWatch = p0 === 'watch';
  const isStudio = p0 === 'studio';
  const isContact = p0 === 'contact';
  const isAccount = SITE !== 'main' && p0 === 'account';
  // An old /search?q= address opens the search panel over the home page (effect below)
  const isSearch = p0 === 'search' && !p1;
  const isPartners = p0 === 'partners' && !p1;
  const isLegal = LEGAL_PAGES.includes(p0) && !p1;

  // Writers. A kind listing wins over a profile, which is why those words are
  // reserved handles server-side.
  const isLibrary = p0 === 'stories' && !p1;
  const isLibraryKind = p0 === 'stories' && WORK_KINDS.includes(p1) && !p2;
  // Author profile: /authors/:handle  (canonical) or legacy /stories/:handle
  const isAuthorProfile = (p0 === 'authors' && !!p1 && !p2) ||
    (p0 === 'stories' && !!p1 && !isLibraryKind && !p2);
  const isWorkRead = p0 === 'stories' && !!p1 && !!p2;
  // The dedicated sites have their own home and listing pages; the rest are shared
  const onStories = SITE === 'stories';
  const onOriginals = SITE === 'originals';
  const frame = SITE_FRAME[SITE];
  // A dedicated site's own sections, for its navigation and footer (null on the main site)
  const siteLinks = !t ? null
    : onStories ? [
      { href: `${base}/`, label: t.stories.navDiscover || (lang === 'bn' ? 'আবিষ্কার' : 'Discover'), active: p0 === '' },
      ...WORK_KINDS.map(k => ({ href: `${base}/stories/${k}`, label: kindLabel(t, lang, k), active: p0 === 'stories' && p1 === k })),
      { href: `${base}/authors`, label: t.nav?.[4] || 'Authors', active: p0 === 'authors' || p0 === 'author' }
    ]
      : onOriginals ? [
        { href: `${base}/`, label: t.nav?.[0] || 'Home', active: p0 === '' },
        { href: `${base}/series`, label: t.nav?.[2] || 'Series', active: p0 === 'series' },
        { href: `${base}/comics`, label: t.nav?.[3] || 'Comics', active: p0 === 'comics' },
        { href: `${base}/watch`, label: t.nav?.[5] || 'Watch', active: p0 === 'watch' }
      ]
        : null;

  // Search has no page: /search?q=… moves to the home page and opens the panel there
  useEffect(() => {
    if (!isSearch || loading || !t) return;
    let q = '';
    try { q = new URLSearchParams(window.location.search).get('q') || ''; } catch { /* no query */ }
    window.history.replaceState(null, '', sitePath(lang, []));
    setParts([]);
    setTimeout(() => openSearch(q), 0);
  }, [isSearch, loading, t, lang]);

  useEffect(() => {
    if (onStories) {
      const link = document.querySelector("link[rel*='icon']");
      if (link) link.href = '/assets/logos/rupok-stories-mark.svg';
    }
  }, [onStories]);

  const isNotFound = !isHome && !isSeries && !isSeriesDetail && !isComicsPage &&
    !isComicReaderPage && !isAuthors && !isWatch && !isStudio && !isContact && !isAccount &&
    !isLibrary && !isLibraryKind && !isAuthorProfile && !isWorkRead &&
    !isSearch && !isPartners && !isLegal;

  if (loading) return <Loader />;
  if (!t) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f4f1ea', color: '#151515', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <strong style={{ fontFamily: "'Sora', sans-serif", fontSize: 24 }}>Rupok is briefly unavailable</strong>
          <span style={{ color: '#55524a' }}>{apiError || 'Please try again in a moment.'}</span>
          <button onClick={() => fetchData(lang)} style={{ padding: '10px 18px', borderRadius: 12, border: '2px solid #151515', background: '#151515', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: frame.bg,
        color: frame.fg,
        overflowX: readerFull ? 'hidden' : 'clip',
        overflowY: readerFull ? 'hidden' : 'visible',
        height: readerFull ? '100vh' : 'auto',
        position: 'relative'
      }}
    >
      {/* Background Dots Pattern */}
      {!readerFull && frame.dots && (
        <div
          style={{
            position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
            opacity: 0.05,
            backgroundImage: 'radial-gradient(#151515 1px, transparent 1.3px)',
            backgroundSize: '7px 7px'
          }}
        />
      )}

      {/* API error banner (non-blocking, shows stale or empty state) */}
      {apiError && (
        <div style={{
          position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
          padding: '10px 18px', borderRadius: 12, background: '#151515', color: '#f4f1ea',
          fontSize: 13, fontWeight: 600, boxShadow: '4px 4px 0 #6f6758', maxWidth: 320
        }}>
          <IAlert /> {t?.apiOffline}
        </div>
      )}


      {!readerFull && !siteLinks && (
        <Navigation lang={lang} currentRoute={p0} t={t} base={base} restPath={restPath} user={user} onSelectLang={changeLang} overlay={isHome} booksUrl={booksUrl} />
      )}
      {!readerFull && siteLinks && (
        <SiteNav
          theme={SITE} links={siteLinks}
          lang={lang} t={t} base={base} user={user} currentRoute={p0} routeKey={`${p0}/${restPath}`} onSelectLang={changeLang}
          overlay={(isHome || isSeriesDetail) && onOriginals}
        />
      )}

      <main
        style={
          readerFull
            ? { position: 'fixed', inset: 0, zIndex: 999999, width: '100vw', height: '100vh', overflow: 'hidden', background: '#151413' }
            : { position: 'relative', zIndex: 1, flex: 1 }
        }
      >
        {isHome && SITE === 'main' && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <Home
              lang={lang} base={base} series={seriesList} comics={comicsList}
              library_works={libraryList} authors={authorsList}
              num={num} openPay={openPay} setAccent={setHomeAcc} t={t} booksUrl={booksUrl}
            />
          </div>
        )}

        {isHome && onStories && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <StoriesHome
              lang={lang} base={base} t={t} num={num}
              library_works={libraryList} authors={authorsList} libraryHistory={libraryHistory}
              featuredKey={siteConfig.stories_featured_work} booksUrl={booksUrl}
            />
          </div>
        )}

        {isHome && onOriginals && (
          <OriginalsHome lang={lang} base={base} t={t} num={num} user={user} series={seriesList} comics={comicsList} heroKeys={siteConfig.originals_hero_series} booksUrl={booksUrl} />
        )}

        {isSeries && !onOriginals && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <Series lang={lang} base={base} series={seriesList} num={num} t={t} />
          </div>
        )}

        {(isSeries || isComicsPage) && onOriginals && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <OriginalsBrowse
              lang={lang} base={base} t={t} num={num} user={user} mode={isComicsPage ? 'comics' : 'series'}
              series={seriesList} comics={comicsList}
            />
          </div>
        )}

        {isSeriesDetail && onOriginals && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <OriginalsSeries
              lang={lang} base={base} t={t} num={num} user={user} sid={p1}
              series={seriesList} comics={comicsList} openPay={openPay}
            />
          </div>
        )}

        {isSeriesDetail && !onOriginals && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <SeriesDetail
              lang={lang} base={base} series={seriesList} sid={p1}
              num={num} openPay={openPay} t={t} user={user}
            />
          </div>
        )}

        {isComicsPage && !onOriginals && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <Comics lang={lang} base={base} series={seriesList} comics={comicsList} openPay={openPay} num={num} t={t} />
          </div>
        )}

        {isComicReaderPage && (
          <div style={readerFull ? { width: '100%', height: '100%', overflow: 'hidden' } : { animation: 'rs-in 0.6s ease-out' }}>
            <ComicReader
              lang={lang} base={base} comics={comicsList} sid={p1}
              num={num} openPay={openPay} t={t}
              full={readerFull} setFull={setReaderFull}
              fetchComicPages={fetchComicPages}
              getComicPageData={getComicPageData}
              freePages={Math.max(0, parseInt(siteConfig.free_preview_pages, 10) || 2)}
            />
          </div>
        )}

        {isLibrary && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <Writers lang={lang} base={base} library_works={libraryList} authors={authorsList} num={num} t={t} />
          </div>
        )}

        {isLibraryKind && !onStories && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <LibraryList lang={lang} base={base} kind={p1} library_works={libraryList} num={num} t={t} />
          </div>
        )}

        {isLibraryKind && onStories && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <StoriesShelf lang={lang} base={base} kind={p1} library_works={libraryList} num={num} t={t} />
          </div>
        )}

        {isAuthorProfile && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <AuthorProfile lang={lang} base={base} handle={p1} num={num} t={t} user={user} myAuthor={author} />
          </div>
        )}

        {isWorkRead && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <WorkReader
              lang={lang} base={base} handle={p1} wkey={p2}
              chapter={p3 ? parseInt(p3, 10) : null}
              num={num} t={t} user={user}
              onProgress={loadAccount} myAuthor={author} openPay={openPay}
              ownership={`${user?.id || ''}|${!!unlocks.works?.[p2]}|${!!unlocks.pendingWorks?.[p2]}`}
            />
          </div>
        )}

        {isAuthors && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <Authors
              lang={lang} base={base} authors={authorsList} library_works={libraryList}
              num={num} t={t}
            />
          </div>
        )}

        {isWatch && onOriginals && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <OriginalsWatch lang={lang} base={base} t={t} num={num} user={user} series={seriesList} />
          </div>
        )}

        {isWatch && !onOriginals && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <Watch lang={lang} base={base} series={seriesList} t={t} />
          </div>
        )}

        {isStudio && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <Studio lang={lang} base={base} series={seriesList} comics={comicsList} library_works={libraryList} num={num} t={t} />
          </div>
        )}

        {isContact && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <Contact lang={lang} base={base} t={t} />
          </div>
        )}

        {isAccount && p1 === 'desk' && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <AuthorDesk
              lang={lang} base={base} t={t} num={num}
              user={user} author={author} wkey={p2}
              onChanged={loadAccount}
            />
          </div>
        )}

        {isAccount && p1 !== 'desk' && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <Account
              lang={lang} base={base} t={t} num={num}
              user={user} comics={comicsList} series={seriesList} works={libraryList}
              author={author} application={application} libraryHistory={libraryHistory}
              onAuthed={loadAccount} onSignOut={signOut} onProfileSaved={setUser} onSelectLang={changeLang}
              sub={p1}
            />
          </div>
        )}

        {isPartners && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <Partners lang={lang} base={base} series={seriesList} comics={comicsList} num={num} t={t} />
          </div>
        )}

        {isLegal && (
          <div style={{ animation: 'rs-in 0.6s ease-out' }}>
            <Legal page={p0} base={base} t={t} />
          </div>
        )}

        {isNotFound && <NotFound base={base} t={t} />}
      </main>

      {!readerFull && !siteLinks && (
        <Footer lang={lang} t={t} base={base} series={seriesList} onSelectLang={changeLang} booksUrl={booksUrl} />
      )}
      {!readerFull && siteLinks && (
        <SiteFooter
          theme={SITE} links={siteLinks}
          tagline={onStories ? t.stories.tagline || t.bodyLibrary : t.originals.tagline || t.bodySeries}
          lang={lang} t={t} base={base} booksUrl={booksUrl}
          onSelectLang={changeLang}
        />
      )}

      {!readerFull && <ScrollRail />}

      {/* Originals: a series' quick view, opened from any poster's "More info" */}
      {onOriginals && (
        <OgPreview series={seriesList} comics={comicsList} user={user} t={t} lang={lang} base={base} num={num} openPay={openPay} />
      )}

      {/* Search: a panel over the page, on every site (no page of its own) */}
      <SearchPanel
        lang={lang} base={base} t={t} site={SITE} disabled={readerFull}
        shortcuts={siteLinks || [
          { href: `${base}/`, label: t.nav?.[0] || 'Home' },
          { href: `${base}/studio`, label: t.nav?.[6] || 'Studio' },
          { href: `${base}/partners`, label: t.partnersNav || 'Partners' },
          { href: `${base}/contact`, label: t.nav?.[7] || 'Contact' }
        ]}
      />

      {needsAccountLink && SITE !== 'main' && <LinkAccount lang={lang} onLinked={loadAccount} onCancel={() => { setNeedsAccountLink(false); loadAccount(); }} />}

      {payModal && (
        <PaymentModal
          pay={payModal}
          onClose={closePay}
          onSubmit={submitOrder}
          base={base}
          t={t}
          lang={lang}
          series={seriesList}
          comics={comicsList}
          user={user}
          onAuthed={loadAccount}
        />
      )}
    </div>
  );
}

function isComicReader(parts) {
  return parts[0] === 'comics' && !!parts[1];
}
