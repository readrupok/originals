import React, { useState, useEffect, useRef } from 'react';
import { api, getUserToken } from '../services/api';
import { fetchPageImage } from '../services/comicPages';
import { recordRead } from '../lib/originals';
import { ogWords } from '../lib/ogWords';
import { IArrowLeft, IArrowRight, IBook, IClose, IExpand, IFlag, IPlay, IStar } from '../components/icons';
import ShareBar from '../components/ShareBar';

const INK = 'var(--ink, var(--ink, #151515))';
// One server-rendered comic page (cached per comic so flipping back is instant).
// Right-click / drag / long-press saving is suppressed; the PDF itself never reaches the browser.
const blockSave = e => e.preventDefault();
function PageImage({ comicKey, n, lang, cache, alt }) {
  const [url, setUrl] = useState(() => cache.get(n) || null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    if (cache.has(n)) { setUrl(cache.get(n)); return undefined; }
    setUrl(null);
    setFailed(false);
    fetchPageImage(comicKey, n, lang)
      .then(r => {
        if (r.url) { cache.set(n, r.url); if (alive) setUrl(r.url); } else if (alive) setFailed(true);
      })
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [comicKey, n, lang, cache]);
  if (!url) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'var(--card-2, #fffdf7)' }}>
        {failed ? <span style={{ fontWeight: 700, color: 'var(--muted, #6b675e)' }}>—</span> : <span className="rs-spinner" aria-label="Loading page" />}
      </div>
    );
  }
  return (
    <div className="rs-page-guard" onContextMenu={blockSave} onDragStart={blockSave} style={{ position: 'absolute', inset: 0, background: 'var(--card, var(--card, #fff))' }}>
      <img
        src={url}
        alt={alt}
        draggable={false}
        onContextMenu={blockSave}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
      />
    </div>
  );
}

// One page in the page grid: its picture is fetched (or taken from the
// reader's cache) only once the tile scrolls into view
function PageThumb({ comicKey, n, lang, cache, locked }) {
  const ref = useRef(null);
  const [url, setUrl] = useState(() => cache.get(n) || null);
  useEffect(() => {
    if (locked || url || !ref.current) return undefined;
    let alive = true;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      if (cache.has(n)) { setUrl(cache.get(n)); return; }
      fetchPageImage(comicKey, n, lang).then(r => {
        if (r.url) { cache.set(n, r.url); if (alive) setUrl(r.url); }
      }).catch(() => {});
    }, { rootMargin: '200px' });
    io.observe(ref.current);
    return () => { alive = false; io.disconnect(); };
  }, [comicKey, n, lang, cache, locked, url]);
  return (
    <span ref={ref} className="rs-thumb-pic" style={url ? { backgroundImage: `url(${url})` } : undefined}>
      {locked ? <IStar /> : !url ? <span className="rs-spinner" aria-hidden="true" /> : null}
    </span>
  );
}

/** Every page of the issue at a glance; picking one goes there. G or Escape closes it. */
function PageGrid({ c, P, FREE, cache, lang, num, t, pg, onPick, onClose }) {
  const w = ogWords(t, lang);
  const panel = useRef(null);
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape' || e.key === 'g' || e.key === 'G') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    panel.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'center' });
    panel.current?.focus({ preventScroll: true });
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);
  return (
    <div className="rs-grid-root" role="dialog" aria-modal="true" aria-label={w.allPages}>
      <div className="rs-grid-scrim" onClick={onClose} aria-hidden="true" />
      <div ref={panel} className="rs-grid-panel" tabIndex={-1}>
        <div className="rs-grid-head">
          <strong>{c.title} · {c.issue}</strong>
          <button type="button" onClick={onClose} aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Close'} className="rs-grid-x"><IClose /></button>
        </div>
        <div className="rs-grid">
          {Array.from({ length: P }, (_, i) => i + 1).map(k => {
            const locked = c.locked && k > FREE;
            const on = k === pg || k === pg + 1;
            return (
              <button key={k} type="button" onClick={() => onPick(k)} aria-current={k === pg ? 'true' : undefined}
                className={`rs-thumb${on ? ' is-on' : ''}${locked ? ' is-locked' : ''}`} aria-label={`${t.page} ${num(k, lang)}`}>
                {c.hasPages
                  ? <PageThumb comicKey={c.k} n={k} lang={c.pagesLang} cache={cache} locked={locked} />
                  : <span className="rs-thumb-pic">{locked ? <IStar /> : null}</span>}
                <span className="rs-thumb-n">{num(k, lang)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Plain page used while pages load, or for pages that have no content yet
function PageMessage({ c, title, body, num, k, P, lang }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 'clamp(6px, 2.5cqw, 18px)', background: 'var(--card-2, #fffdf7)', color: 'var(--ink, var(--ink, #151515))', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: 'calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)', paddingBottom: 'clamp(2px, 0.8cqw, 5px)', fontSize: 'clamp(9px, 1.8cqw, 12px)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em' }}>
        <span>{c.title}</span>
        <span>{c.issue}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(4px, 1.2cqw, 10px)', textAlign: 'center', padding: '8%', border: '2px dashed rgba(21,21,21,.25)', borderRadius: 8, margin: 'clamp(4px, 1cqw, 10px) 0' }}>
        <span style={{ fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800, fontSize: 'clamp(13px, 2.6cqw, 22px)', lineHeight: 1.15 }}>{title}</span>
        {body && <span style={{ fontSize: 'clamp(10px, 1.9cqw, 15px)', color: 'var(--muted, #6b675e)', lineHeight: 1.45 }}>{body}</span>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 'clamp(9px, 1.8cqw, 13px)', fontWeight: 800, color: 'var(--muted, #6b675e)' }}>
        <span>{num(k, lang)} / {num(P, lang)}</span>
      </div>
    </div>
  );
}


const face = {
  position: 'absolute',
  inset: 0,
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
  overflow: 'hidden',
  background: 'var(--card-2, #fffdf7)'
};

export default function ComicReader({ lang, base, comics, sid, num, openPay, t, full = false, setFull, fetchComicPages, getComicPageData, freePages = 2 }) {
  const FREE = freePages;
  const all = comics || [];
  const c = all.find(x => x.k === sid) || all[0] || { pages: 8 };
  const P = c.pages || 8;
  const E = P + 1; // page index of end screen
  const L = Math.ceil((E + 1) / 2); // number of spread leaves
  // Spread index that shows the end screen. When E is even the end screen sits on the
  // right-hand page of spread E/2, so there is no further leaf to turn after it.
  const LAST_SPREAD = Math.ceil(E / 2);

  const [pg, setPg] = useState(0);
  const [grid, setGrid] = useState(false);
  const [mode, setMode] = useState('spread'); // 'spread' | 'single'
  const [saved, setSaved] = useState(0);

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768 || window.innerHeight <= 768;
  });

  const [isPortrait, setIsPortrait] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerHeight > window.innerWidth;
  });

  const [showHUD, setShowHUD] = useState(true);
  const hudTimeoutRef = useRef(null);

  const resetHUDTimer = () => {
    setShowHUD(true);
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    if (full) {
      hudTimeoutRef.current = setTimeout(() => {
        setShowHUD(false);
      }, 2600);
    }
  };

  useEffect(() => {
    resetHUDTimer();
    return () => {
      if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    };
  }, [full, pg, mode]);

  const readerRef = useRef(null);
  const swipeStartX = useRef(null);

  const storageKey = `rupok-read-${c.k}-${lang}`;

  // Rendered page images, cached per comic; reset when the comic or its access changes
  const pageCache = useRef(new Map());
  const [cacheVersion, setCacheVersion] = useState(0);
  useEffect(() => {
    const cache = new Map();
    pageCache.current = cache;
    setCacheVersion(v => v + 1);
    return () => { for (const u of cache.values()) URL.revokeObjectURL(u); };
  }, [c.k, c.locked, c.pagesLang]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768 || window.innerHeight <= 768);
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  useEffect(() => {
    let v = 0;
    try {
      v = +(localStorage.getItem(storageKey) || 0);
    } catch (e) {}
    setSaved(v);
    setPg(0);
    if (getUserToken()) {
      api.getProgress().then(r => {
        const entry = r.ok ? r.data.find(p => p.comic_key === c.k) : null;
        if (entry) setSaved(entry.page);
      });
    }
    setMode(window.innerWidth < 760 ? 'single' : 'spread');

    if (c.ac) {
      document.documentElement.style.setProperty('--acc', c.ac);
    }

    // Fetch page story content from API
    if (fetchComicPages) fetchComicPages(c.k);
  }, [c.k, lang, storageKey]);

  useEffect(() => {
    if (pg <= 0) return undefined;
    try {
      localStorage.setItem(storageKey, String(pg));
    } catch (e) {}
    // Also for Originals' "Continue" row, in this browser
    recordRead(c.k, pg, P);
    // Signed-in readers: save the position to their account (debounced while flipping)
    if (!getUserToken()) return undefined;
    const id = setTimeout(() => api.saveProgress(c.k, pg), 600);
    return () => clearTimeout(id);
  }, [pg, storageKey, c.k]);

  useEffect(() => {
    const onKey = e => {
      if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'f' || e.key === 'F') toggleFull();
      if ((e.key === 'g' || e.key === 'G') && !grid) setGrid(true);
      if (e.key === 'Escape' && full) {
        if (setFull) setFull(false);
      }
    };

    const onFs = () => {
      if (!document.fullscreenElement && full) {
        if (setFull) setFull(false);
      }
    };

    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFs);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFs);
    };
  }, [full, pg, mode, grid]);

  useEffect(() => {
    return () => {
      if (setFull) setFull(false);
      try {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      } catch (e) {}
    };
  }, []);

  const handleModeChange = async targetMode => {
    setMode(targetMode);

    // Landscape orientation lock only applies when ALREADY in fullscreen mode on mobile
    if (full && isMobile) {
      if (targetMode === 'spread') {
        try {
          if (screen.orientation && screen.orientation.lock) {
            await screen.orientation.lock('landscape');
          }
        } catch (e) {}
      } else if (targetMode === 'single') {
        try {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
        } catch (e) {}
      }
    }
  };

  const setPage = pNum => setPg(Math.max(0, Math.min(E, pNum)));

  const next = () => {
    resetHUDTimer();
    if (mode === 'single') {
      return setPage(pg + 1);
    }
    const spreadIdx = Math.ceil(pg / 2);
    if (spreadIdx < LAST_SPREAD) {
      setPage(Math.min(E, 2 * spreadIdx + 1));
    }
  };

  const prev = () => {
    resetHUDTimer();
    if (mode === 'single') {
      return setPage(pg - 1);
    }
    const spreadIdx = Math.ceil(pg / 2);
    setPage(spreadIdx <= 1 ? 0 : 2 * (spreadIdx - 1) - 1);
  };

  const toggleFull = () => {
    const nextFull = !full;
    if (setFull) setFull(nextFull);

    try {
      if (nextFull) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
        if (mode === 'spread' && isMobile && screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(() => {});
        }
      } else {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      }
    } catch (e) {}
  };

  const spread = mode === 'spread';
  const forceLandscape = full && isMobile && spread && isPortrait;
  const p = Math.ceil(pg / 2);

  const shown = spread
    ? [2 * p - 1, 2 * p].filter(k => k >= 1 && k <= P)
    : pg >= 1 && pg <= P
    ? [pg]
    : [];

  const countLabel =
    pg === 0
      ? t.cover
      : (spread ? p >= L || 2 * p - 1 >= E : pg >= E)
      ? t.endL
      : `${t.page} ${shown.map(x => num(x, lang)).join('–')} ${t.of} ${num(P, lang)}`;

  const ni = (all.findIndex(x => x.k === c.k) + 1) % Math.max(1, all.length);
  // Prefer the next issue of the same series; otherwise the next comic in the catalogue
  const nextIssue = all.find(x => x.seriesKey === c.seriesKey && x.issueNumber === (c.issueNumber || 1) + 1) || null;
  const nextC = nextIssue || all[ni] || {};

  const arrowStyle = off => ({
    width: 52,
    height: 52,
    borderRadius: 14,
    border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
    background: off ? 'transparent' : 'var(--ink-bg, #151515)',
    color: off ? INK : '#fff',
    fontSize: 20,
    cursor: off ? 'default' : 'pointer',
    opacity: off ? 0.3 : 1,
    boxShadow: off ? 'none' : `calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 ${c.ac || '#6f6758'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    font: 'inherit',
    transition: 'all 0.15s'
  });

  const atStart = pg === 0;
  const atEnd = spread ? p >= LAST_SPREAD : pg >= E;
  const vh = full ? '100vh - 190px' : '100vh - 260px';

  // Story panel renderer for each page
  const renderComicPageContent = k => {
    if (k === 0) {
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: 'var(--ink-bg, #151515)' }}>
          {/* The page matches the 2:3 cover ratio */}
          <img src={c.poster} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 14, background: 'linear-gradient(90deg, rgba(0,0,0,.5), transparent)' }} />
        </div>
      );
    }

    if (c.hasPages && k <= P) {
      return <PageImage key={`${c.k}-${cacheVersion}-${k}`} comicKey={c.k} n={k} lang={c.pagesLang} cache={pageCache.current} alt={`${c.title} — ${t.page} ${num(k, lang)}`} />;
    }

    // Story content from the CMS (Comics Vault → Story pages)
    const pageStory = getComicPageData ? getComicPageData(c.k, k) : null;
    if (!pageStory) return <PageMessage c={c} title={t.readerSoonH} body={t.readerSoonB} num={num} k={k} P={P} lang={lang} />;

    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 'clamp(6px, 2.5cqw, 18px)',
          background: 'var(--card-2, #fffdf7)',
          color: 'var(--ink, var(--ink, #151515))',
          boxSizing: 'border-box'
        }}
      >
        {/* Comic Header Strip */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: 'calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)',
            paddingBottom: 'clamp(2px, 0.8cqw, 5px)',
            fontSize: 'clamp(9px, 1.8cqw, 12px)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '.06em'
          }}
        >
          <span>{c.title}</span>
          <span>{c.issue}</span>
        </div>

        {/* Comic Action Artwork Panels */}
        <div
          style={{
            flex: 1,
            display: 'grid',
            gridTemplateRows: '1fr 1fr',
            gap: 'clamp(5px, 1.4cqw, 10px)',
            margin: 'clamp(4px, 1cqw, 10px) 0',
            minHeight: 0
          }}
        >
          {/* Panel 1 */}
          <div
            style={{
              position: 'relative',
              border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
              borderRadius: 8,
              overflow: 'hidden',
              background: '#1c1917',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 'clamp(6px, 1.8cqw, 12px)',
              minHeight: 0
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.38,
                backgroundImage: `url(${c.poster})`,
                backgroundSize: 'cover',
                backgroundPosition: k % 2 === 0 ? 'top center' : 'bottom center',
                filter: 'grayscale(20%) contrast(140%)'
              }}
            />
            <span
              style={{
                position: 'relative',
                alignSelf: 'flex-start',
                padding: 'clamp(2px, 0.6cqw, 4px) clamp(5px, 1.2cqw, 10px)',
                background: '#f5c542',
                color: '#151515',
                border: 'calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)',
                fontFamily: "'Bangers', 'Hind Siliguri', cursive",
                fontSize: 'clamp(9px, 1.8cqw, 13px)',
                letterSpacing: '.05em',
                borderRadius: 4
              }}
            >
              {pageStory.caption}
            </span>

            <p
              style={{
                position: 'relative',
                margin: 0,
                fontSize: 'clamp(10px, 2.2cqw, 15px)',
                fontWeight: 600,
                lineHeight: 1.35,
                background: 'rgba(15, 15, 15, 0.88)',
                color: '#f4f1ea',
                padding: 'clamp(4px, 1.2cqw, 8px) clamp(6px, 1.8cqw, 12px)',
                borderRadius: 6,
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              {pageStory.panel1}
            </p>
          </div>

          {/* Panel 2 */}
          <div
            style={{
              position: 'relative',
              border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
              borderRadius: 8,
              overflow: 'hidden',
              background: '#292524',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 'clamp(6px, 1.8cqw, 12px)',
              minHeight: 0
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.42,
                backgroundImage: `url(${c.poster})`,
                backgroundSize: 'cover',
                backgroundPosition: k % 2 === 0 ? 'center' : 'top right',
                filter: 'contrast(150%)'
              }}
            />

            {/* Sound FX burst */}
            <span
              style={{
                position: 'absolute',
                right: 'clamp(4px, 1.2cqw, 10px)',
                top: 'clamp(4px, 1.2cqw, 10px)',
                padding: 'clamp(2px, 0.8cqw, 5px) clamp(6px, 1.6cqw, 12px)',
                background: c.ac || '#b45309',
                color: '#fff',
                fontFamily: "'Bangers', cursive",
                fontSize: 'clamp(11px, 2.6cqw, 20px)',
                letterSpacing: '.06em',
                transform: 'rotate(-7deg)',
                border: 'calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)',
                boxShadow: 'calc(2px * var(--shk, 1)) calc(2px * var(--shk, 1)) 0 var(--ink, #151515)',
                zIndex: 2,
                borderRadius: 4
              }}
            >
              {pageStory.sound}
            </span>

            {/* Speech bubble */}
            <div
              style={{
                position: 'relative',
                margin: 'auto 0 0 0',
                background: 'var(--card, var(--card, #fff))',
                color: 'var(--ink, var(--ink, #151515))',
                border: 'calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)',
                borderRadius: 8,
                padding: 'clamp(4px, 1.2cqw, 9px) clamp(6px, 1.8cqw, 12px)',
                fontSize: 'clamp(10px, 2.2cqw, 15px)',
                fontWeight: 700,
                lineHeight: 1.35,
                boxShadow: 'calc(2px * var(--shk, 1)) calc(2px * var(--shk, 1)) 0 var(--ink, #151515)',
                zIndex: 2
              }}
            >
              {pageStory.speech || pageStory.panel2}
            </div>
          </div>
        </div>

        {/* Page Footer Number */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 'clamp(9px, 1.8cqw, 13px)', fontWeight: 800, color: 'var(--muted, #6b675e)' }}>
          <span>{num(k, lang)} / {num(P, lang)}</span>
        </div>
      </div>
    );
  };

  const getPageModel = k => {
    if (k > E) return { blank: true };
    if (k === E) return { end: true };
    const lock = c.locked && k > FREE;
    if (lock) return { lock: true };
    return { show: true, num: k === 0 ? '' : num(k, lang), content: renderComicPageContent(k) };
  };

  const renderSingleOrSpreadFace = model => {
    if (model.lock) {
      return (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.6cqw',
            padding: '10%',
            textAlign: 'center',
            background: 'var(--stage-stripes, repeating-linear-gradient(45deg, #f4efe2 0 12px, #ece5d4 12px 24px))'
          }}
        >
          <span style={{ fontSize: '4cqw' }}><IStar /></span>
          <span style={{ fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800, fontSize: '2.4cqw', lineHeight: 1.1 }}>
            {c.pending ? t.payPendingH : t.lockedH}
          </span>
          <span style={{ fontSize: '1.4cqw', color: 'var(--muted-2, #55524a)' }}>
            {c.pending ? t.payPendingB : t.lockedB}
          </span>
          {!c.pending && <button
            onClick={e => {
              e.stopPropagation();
              if (openPay) openPay(c.k, 'comic');
            }}
            style={{
              padding: '1cqw 1.8cqw',
              borderRadius: '1cqw',
              border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
              background: '#f5c542',
              font: 'inherit',
              fontWeight: 800,
              fontSize: '1.5cqw',
              cursor: 'pointer',
              boxShadow: 'calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 var(--ink, #151515)'
            }}
          >
            {t.unlock} · {c.price}
          </button>}
        </div>
      );
    }

    if (model.end) {
      return (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '1.8cqw',
            padding: '10%',
            background: '#1c1a24',
            color: '#f4f1ea'
          }}
        >
          <span style={{ fontFamily: "'Bangers', 'Hind Siliguri', cursive", fontSize: '5.4cqw', lineHeight: 0.95 }}>
            {t.end}
          </span>
          <span style={{ fontSize: '1.6cqw', lineHeight: 1.5, color: '#c9c5bb' }}>
            {nextIssue ? (t.endNextIssue || '').replace('{issue}', nextIssue.issue) : t.endBody}
          </span>
          <a
            href={nextC.href}
            onClick={e => e.stopPropagation()}
            style={{
              alignSelf: 'flex-start',
              padding: '1cqw 1.6cqw',
              borderRadius: '1cqw',
              background: 'var(--paper, var(--paper, #f4f1ea))',
              color: 'var(--ink, var(--ink, #151515))',
              fontWeight: 800,
              fontSize: '1.5cqw',
              textDecoration: 'none'
            }}
          >
            {t.nextUp}: {nextC.title} · {nextC.issue} <IArrowRight />
          </a>
        </div>
      );
    }

    if (model.show) {
      return (
        <div style={{ position: 'absolute', inset: full ? '0.6%' : '2%', border: 'calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)', overflow: 'hidden', background: 'var(--card, var(--card, #fff))' }}>
          {model.content}
        </div>
      );
    }

    return null;
  };

  const startReading = () => {
    setPage(saved || 1);
    if (readerRef.current) {
      window.scrollTo({
        top: readerRef.current.getBoundingClientRect().top + window.scrollY - 80,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div style={{ color: 'var(--ink, var(--ink, #151515))' }}>
      {/* Header Info */}
      {!full && (
        <header
          data-screen-label="Comic — Header"
          style={{ position: 'relative', padding: 'clamp(24px, 3vw, 40px) clamp(12px, 1.8vw, 24px) clamp(32px, 4vw, 56px)' }}
        >
          <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
            <nav style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 28, fontSize: 14, fontWeight: 700 }}>
          <a href={`${base}/comics`} style={{ padding: '6px 12px', border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)', borderRadius: 10, background: 'var(--card, var(--card, #fff))', textDecoration: 'none' }}>
            <IArrowLeft /> {t.crumbComic}
          </a>
          <span style={{ color: 'var(--muted, #6b675e)' }}>/</span>
          <span>{c.title}</span>
        </nav>

        <div className="comic-detail-hero-layout" style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(28px, 4vw, 64px)', alignItems: 'center' }}>
          {/* Cover Display */}
          <div className="comic-detail-cover-container" style={{ flex: '0 1 260px', minWidth: 180, perspective: 1000 }}>
            <div
              className="comic-detail-cover-book"
              style={{
                position: 'relative',
                aspectRatio: '2/3',
                border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                borderRadius: '4px 10px 10px 4px',
                overflow: 'hidden',
                background: 'var(--ink-bg, #151515)',
                boxShadow: `calc(12px * var(--shk, 1)) calc(12px * var(--shk, 1)) 0 ${c.ac || INK}`,
                transform: 'rotateY(-14deg) rotate(-2deg)'
              }}
            >
              <img src={c.poster} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 12, background: 'linear-gradient(90deg, rgba(0,0,0,.45), transparent)' }} />
            </div>
          </div>

          <div style={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span style={{ padding: '4px 11px', borderRadius: 999, border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)', fontSize: 13, fontWeight: 800, background: c.paid ? '#f5c542' : 'var(--card, var(--card, #fff))' }}>
                {c.paid ? <><IStar /> {t.premium} · {c.price}</> : t.free}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted-2, #55524a)' }}>
                {c.issue} · {c.pagesLabel} {t.pages} · EN / বাংলা
              </span>
            </span>

            <h1 style={{ margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800, fontSize: 'clamp(40px, 5.5vw, 84px)', lineHeight: 0.98, letterSpacing: '-.045em' }}>
              {c.title}
            </h1>

            <p style={{ margin: 0, maxWidth: 600, fontSize: 'clamp(16px, 1.3vw, 19px)', lineHeight: 1.6, color: 'var(--muted-2, #55524a)' }}>
              {c.syn}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <button
                onClick={startReading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 20px',
                  borderRadius: 14,
                  background: 'var(--ink-bg, #151515)',
                  color: '#fff',
                  border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                  boxShadow: `calc(4px * var(--shk, 1)) calc(4px * var(--shk, 1)) 0 ${c.ac || '#6f6758'}`,
                  font: 'inherit',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer'
                }}
              >
                <IPlay /> {saved > 0 ? `${t.resume} ${num(saved, lang)}` : t.start}
              </button>

              {c.locked && c.pending && (
                <span
                  data-testid="pending-badge"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 20px', borderRadius: 14, background: '#fef9c3', border: 'calc(2px * var(--bwk, 1)) dashed var(--edge, #151515)', fontWeight: 800, fontSize: 15 }}
                >
                  {t.payPendingH}
                </span>
              )}

              {c.locked && !c.pending && (
                <button
                  onClick={() => openPay && openPay(c.k, 'comic')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '14px 20px',
                    borderRadius: 14,
                    background: '#f5c542',
                    border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                    boxShadow: 'calc(4px * var(--shk, 1)) calc(4px * var(--shk, 1)) 0 var(--ink, #151515)',
                    font: 'inherit',
                    fontWeight: 800,
                    fontSize: 15,
                    cursor: 'pointer'
                  }}
                >
                  <IStar /> {t.unlock} · {c.price}
                </button>
              )}

              <a
                href={c.seriesHref}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '14px 20px',
                  borderRadius: 14,
                  background: 'transparent',
                  border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none'
                }}
              >
                {t.watchSeries} <IArrowRight />
              </a>
            </div>

            {/* The preview pages are free, so a shared link always opens onto something readable */}
            <ShareBar path={`/comics/${c.k}`} title={`${c.title} · ${c.issue}`} t={t} />

            {/* Issue Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {all.filter(x => x.seriesKey === c.seriesKey).map(o => {
                const on = o.k === c.k;
                return (
                  <a
                    key={o.k}
                    href={o.href}
                    aria-current={on ? 'page' : undefined}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '7px 12px',
                      borderRadius: 10,
                      border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                      background: on ? 'var(--ink-bg, #151515)' : 'var(--card, var(--card, #fff))',
                      color: on ? '#fff' : INK,
                      fontSize: 14,
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    {o.issue}{o.paid && o.locked ? <> <IStar /></> : null}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  )}

      {/* Reader Container */}
      <section
        ref={readerRef}
        data-screen-label="Comic — Reader"
        onMouseMove={resetHUDTimer}
        onTouchStart={resetHUDTimer}
        className={full ? (forceLandscape ? 'reader-fullscreen-stage reader-stage-forced-landscape' : 'reader-fullscreen-stage') : ''}
        style={
          full
            ? {
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                background: '#151413',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'clamp(6px, 1.2vh, 14px) clamp(8px, 1.5vw, 20px)',
                boxSizing: 'border-box'
              }
            : {
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                padding: 'clamp(32px, 4vw, 56px) clamp(12px, 1.8vw, 24px) clamp(48px, 6vw, 80px)',
                background: 'var(--stage, #efe9dc)',
                borderTop: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                borderBottom: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                justifyContent: 'center'
              }
        }
      >
        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 'min(1300px, 130vw)',
            height: 800,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, color-mix(in srgb, var(--acc) 22%, transparent), transparent 62%)',
            pointerEvents: 'none'
          }}
        />

        {/* FULLSCREEN FLOATING OVERLAY CONTROLS */}
        {full && (
          <>
            {/* Top Controls: Single Page Mode Toggle + Exit Fullscreen Cross */}
            <div
              className={`reader-hud-overlay reader-hud-pill ${showHUD ? '' : 'hud-hidden hud-top'}`}
              style={{
                position: 'absolute',
                top: 'clamp(8px, 1.4vh, 16px)',
                right: 'clamp(8px, 1.6vw, 18px)',
                zIndex: 100,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(21, 20, 19, 0.88)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255, 255, 255, 0.18)',
                padding: '4px 6px',
                borderRadius: 999,
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                color: '#f4f1ea'
              }}
            >
              {/* Single Mode Toggle Button */}
              <button
                onClick={() => handleModeChange(spread ? 'single' : 'spread')}
                aria-label={spread ? t.single : t.spread}
                title={spread ? t.single : t.spread}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 999,
                  border: 0,
                  background: 'var(--acc)',
                  color: '#fff',
                  font: 'inherit',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s, transform 0.15s'
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {spread ? t.single : t.spread}
              </button>

              {/* Cross button to exit fullscreen */}
              <button
                onClick={toggleFull}
                aria-label="Exit fullscreen (Esc)"
                title="Exit fullscreen (Esc)"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '1.5px solid rgba(255, 255, 255, 0.25)',
                  background: 'var(--card, var(--card, #fff))',
                  color: 'var(--ink, var(--ink, #151515))',
                  fontSize: 15,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  transition: 'transform 0.15s'
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <IClose />
              </button>
            </div>

            {/* Floating Left Arrow */}
            <button
              onClick={() => { prev(); resetHUDTimer(); }}
              disabled={atStart}
              aria-label={t.prevL}
              className={`reader-floating-nav reader-floating-nav-prev reader-hud-overlay ${showHUD ? '' : 'hud-hidden'}`}
              style={{
                cursor: atStart ? 'default' : 'pointer',
                opacity: atStart ? 0.2 : 0.88
              }}
              onMouseEnter={e => { if (!atStart) e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={e => { if (!atStart) e.currentTarget.style.opacity = '0.88'; }}
            >
              ‹
            </button>

            {/* Floating Right Arrow */}
            <button
              onClick={() => { next(); resetHUDTimer(); }}
              disabled={atEnd}
              aria-label={t.nextL}
              className={`reader-floating-nav reader-floating-nav-next reader-hud-overlay ${showHUD ? '' : 'hud-hidden'}`}
              style={{
                cursor: atEnd ? 'default' : 'pointer',
                opacity: atEnd ? 0.2 : 0.88
              }}
              onMouseEnter={e => { if (!atEnd) e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={e => { if (!atEnd) e.currentTarget.style.opacity = '0.88'; }}
            >
              ›
            </button>
          </>
        )}

        {/* Reader Top Controls Bar — Only in standard (non-fullscreen) mode */}
        {!full && (
          <>
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                width: 'min(1120px, 100%)',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12
              }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800, fontSize: 18 }}>
                  {c.title} · {c.issue}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted-2, #55524a)' }}>
                  {countLabel}
                </span>
              </span>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)', borderRadius: 12, overflow: 'hidden', background: 'var(--card, var(--card, #fff))' }}>
                  <button
                    onClick={() => handleModeChange('spread')}
                    style={{
                      padding: '9px 14px',
                      border: 0,
                      background: spread ? 'var(--ink-bg, #151515)' : 'var(--card, var(--card, #fff))',
                      color: spread ? '#fff' : INK,
                      font: 'inherit',
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: 'pointer'
                    }}
                  >
                    {t.spread}
                  </button>
                  <button
                    onClick={() => handleModeChange('single')}
                    style={{
                      padding: '9px 14px',
                      border: 0,
                      background: !spread ? 'var(--ink-bg, #151515)' : 'var(--card, var(--card, #fff))',
                      color: !spread ? '#fff' : INK,
                      font: 'inherit',
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: 'pointer'
                    }}
                  >
                    {t.single}
                  </button>
                </div>

                <button
                  onClick={toggleFull}
                  aria-label={t.full}
                  title={t.full}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                    background: 'var(--card, var(--card, #fff))',
                    fontSize: 18,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: 'calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 var(--ink, #151515)'
                  }}
                >
                  {full ? <IClose /> : <IExpand />}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ position: 'relative', zIndex: 2, width: 'min(1120px, 100%)', height: 8, border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)', borderRadius: 99, background: 'var(--card, var(--card, #fff))', overflow: 'hidden' }}>
              <span
                style={{
                  display: 'block',
                  height: '100%',
                  width: `${Math.round(((spread ? Math.min(2 * p, E) : pg) / E) * 100)}%`,
                  background: 'var(--acc)',
                  transition: 'width 0.5s'
                }}
              />
            </div>
          </>
        )}

        {/* SPREAD MODE - UNIFIED 3D FLIP BOOK (DESKTOP & MOBILE) */}
        {spread && (
          <div
            onPointerDown={e => {
              swipeStartX.current = e.clientX;
            }}
            onPointerUp={e => {
              const dx = e.clientX - (swipeStartX.current || e.clientX);
              if (dx < -30) { next(); resetHUDTimer(); }
              else if (dx > 30) { prev(); resetHUDTimer(); }
            }}
            style={{
              position: 'relative',
              zIndex: 1,
              width: full
                ? (forceLandscape ? 'min(calc(100vh - 4px), calc(98vw * (4 / 3)))' : 'min(calc(100vw - 8px), calc(98vh * (4 / 3)))')
                : `min(1120px, 100%, calc((${vh}) * (4 / 3)))`,
              aspectRatio: '4 / 3',
              maxHeight: full ? (forceLandscape ? '98vw' : '98vh') : 'none',
              perspective: 2600,
              containerType: 'inline-size',
              userSelect: 'none'
            }}
          >
            {/* Invisible Tap Zones: Left 28% (Prev), Center 44% (Toggle HUD), Right 28% (Next) */}
            <div
              onClick={e => { e.stopPropagation(); prev(); resetHUDTimer(); }}
              aria-label="Previous Page"
              disabled={atStart}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '28%',
                zIndex: 60,
                cursor: 'pointer'
              }}
            />
            <div
              onClick={e => { e.stopPropagation(); setShowHUD(v => !v); }}
              aria-label="Toggle Controls"
              style={{
                position: 'absolute',
                left: '28%',
                right: '28%',
                top: 0,
                bottom: 0,
                zIndex: 60,
                cursor: 'pointer'
              }}
            />
            <div
              onClick={e => { e.stopPropagation(); next(); resetHUDTimer(); }}
              aria-label="Next Page"
              disabled={atEnd}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '28%',
                zIndex: 60,
                cursor: 'pointer'
              }}
            />

            <div
              style={{
                position: 'absolute',
                inset: 0,
                transformStyle: 'preserve-3d',
                WebkitTransformStyle: 'preserve-3d',
                transform: `translateX(${p === 0 ? '-25%' : 2 * p > E ? '25%' : '0'}) rotateX(${full ? '0deg' : '8deg'})`,
                transition: 'transform 0.8s cubic-bezier(.3,.7,.2,1)'
              }}
            >
              {/* Left Base */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '50%',
                  height: '100%',
                  background: 'var(--card-2, #fffdf7)',
                  borderRadius: '8px 0 0 8px',
                  boxShadow: '0 40px 70px -30px rgba(21,21,21,.55), inset 0 0 0 2px var(--ink, #151515)',
                  opacity: p === 0 ? 0 : 1,
                  transition: 'opacity 0.4s'
                }}
              />

              {/* Right Base */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  width: '50%',
                  height: '100%',
                  background: 'var(--card-2, #fffdf7)',
                  borderRadius: '0 8px 8px 0',
                  boxShadow: '0 40px 70px -30px rgba(21,21,21,.55), inset 0 0 0 2px var(--ink, #151515)',
                  opacity: 2 * p > E ? 0 : 1,
                  transition: 'opacity 0.4s 0.5s'
                }}
              />

              {/* Leaves */}
              {Array.from({ length: L }).map((_, i) => {
                const flipped = i < p;
                const fModel = getPageModel(2 * i);
                const bModel = getPageModel(2 * i + 1);

                return (
                  <div
                    key={i}
                    onClick={flipped ? prev : next}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: 0,
                      width: '50%',
                      height: '100%',
                      transformStyle: 'preserve-3d',
                      WebkitTransformStyle: 'preserve-3d',
                      transformOrigin: 'left center',
                      transform: `rotateY(${flipped ? -180 : 0}deg)`,
                      transition: 'transform 0.8s cubic-bezier(.45, .05, .25, 1)',
                      zIndex: flipped ? i + 1 : L - i,
                      cursor: 'pointer',
                      willChange: 'transform'
                    }}
                  >
                    {/* Front Face */}
                    <div
                      style={{
                        ...face,
                        visibility: flipped ? 'hidden' : 'visible',
                        transition: 'visibility 0s 0.4s',
                        borderRadius: '0 8px 8px 0',
                        boxShadow: 'inset 0 0 0 2px var(--ink, #151515)',
                        backgroundImage: 'linear-gradient(90deg, rgba(21,21,21,.14), transparent 8%)',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden'
                      }}
                    >
                      {renderSingleOrSpreadFace(fModel)}
                    </div>

                    {/* Back Face */}
                    <div
                      style={{
                        ...face,
                        visibility: flipped ? 'visible' : 'hidden',
                        transition: 'visibility 0s 0.4s',
                        transform: 'rotateY(180deg)',
                        borderRadius: '8px 0 0 8px',
                        boxShadow: 'inset 0 0 0 2px var(--ink, #151515)',
                        backgroundImage: 'linear-gradient(270deg, rgba(21,21,21,.14), transparent 8%)',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden'
                      }}
                    >
                      {renderSingleOrSpreadFace(bModel)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SINGLE PAGE MODE (MOBILE FRIENDLY WITH 3D PAGE TURN ANIMATION) */}
        {!spread && (
          <div
            onPointerDown={e => {
              swipeStartX.current = e.clientX;
            }}
            onPointerUp={e => {
              const dx = e.clientX - (swipeStartX.current || e.clientX);
              if (dx < -25) { next(); resetHUDTimer(); }
              else if (dx > 25) { prev(); resetHUDTimer(); }
            }}
            style={{
              position: 'relative',
              zIndex: 1,
              width: full
                ? 'min(calc(100vw - 8px), calc(97vh * (2 / 3)))'
                : `min(580px, 100%, calc((${vh}) * (2 / 3)))`,
              aspectRatio: '2 / 3',
              maxHeight: full ? '97vh' : 'none',
              minHeight: 0,
              perspective: 1600,
              touchAction: 'pan-y',
              userSelect: 'none',
              cursor: 'pointer'
            }}
          >
            {/* Invisible Tap Zones: Left 28% (Prev), Center 44% (Toggle HUD), Right 28% (Next) */}
            <div
              onClick={e => { e.stopPropagation(); prev(); resetHUDTimer(); }}
              aria-label="Previous Page"
              disabled={atStart}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '28%',
                zIndex: 50,
                cursor: 'pointer'
              }}
            />
            <div
              onClick={e => { e.stopPropagation(); setShowHUD(v => !v); }}
              aria-label="Toggle Controls"
              style={{
                position: 'absolute',
                left: '28%',
                right: '28%',
                top: 0,
                bottom: 0,
                zIndex: 50,
                cursor: 'pointer'
              }}
            />
            <div
              onClick={e => { e.stopPropagation(); next(); resetHUDTimer(); }}
              aria-label="Next Page"
              disabled={atEnd}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '28%',
                zIndex: 50,
                cursor: 'pointer'
              }}
            />

            {/* 3D Animated Single Page Stack */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transformStyle: 'preserve-3d',
                WebkitTransformStyle: 'preserve-3d'
              }}
            >
              {Array.from({ length: E + 1 }).map((_, k) => {
                if (k < pg - 1 || k > pg + 1) return null;
                const isCurrent = k === pg;
                const isPast = k < pg;

                return (
                  <div
                    key={k}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      transformOrigin: 'left center',
                      transform: isPast
                        ? 'translateX(-104%) rotateY(-24deg)'
                        : isCurrent
                        ? 'translateX(0) rotateY(0deg)'
                        : 'translateX(0) scale(0.97)',
                      opacity: isPast ? 0 : 1,
                      zIndex: isCurrent ? 10 : isPast ? 15 : 5,
                      transition: 'transform 0.65s cubic-bezier(0.25, 1, 0.4, 1), opacity 0.5s ease',
                      boxShadow: isCurrent ? `calc(8px * var(--shk, 1)) calc(8px * var(--shk, 1)) 0 ${c.ac || INK}` : 'none',
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: 'var(--card-2, #fffdf7)',
                      border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      willChange: 'transform, opacity'
                    }}
                  >
                    {renderSingleOrSpreadFace(getPageModel(k))}
                    {/* Shadow overlay when curling/turning */}
                    {isPast && (
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to right, rgba(0,0,0,0.22), transparent 45%)',
                          pointerEvents: 'none'
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Pagination & Page Dots — Single Responsive Row */}
        {!full && (
          <>
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                width: 'min(580px, 100%)',
                padding: '0 4px'
              }}
            >
              <button onClick={prev} aria-label={t.prevL} disabled={atStart} style={arrowStyle(atStart)}>
                <IArrowLeft />
              </button>

              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  overflowX: 'auto',
                  scrollbarWidth: 'none',
                  WebkitOverflowScrolling: 'touch',
                  padding: '4px 2px',
                  flex: 1,
                  justifyContent: 'flex-start',
                  alignItems: 'center'
                }}
              >
                {Array.from({ length: E + 1 }).map((_, k) => {
                  const on = shown.includes(k) || (k === 0 && pg === 0) || (k === E && countLabel === t.endL);
                  const isLocked = c.locked && k > FREE && k < E;

                  return (
                    <button
                      key={k}
                      onClick={() => setPage(k)}
                      aria-label={k === 0 ? t.cover : k === E ? t.endL : `${t.page} ${num(k, lang)}`}
                      title={k === 0 ? t.cover : k === E ? t.endL : `${t.page} ${num(k, lang)}`}
                      style={{
                        flex: 'none',
                        minWidth: 36,
                        height: 36,
                        padding: '0 6px',
                        borderRadius: 8,
                        border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                        background: on ? 'var(--ink-bg, #151515)' : isLocked ? '#f5c542' : 'var(--card, var(--card, #fff))',
                        color: on ? '#fff' : INK,
                        font: 'inherit',
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {k === 0 ? <IBook /> : k === E ? <IFlag /> : isLocked ? <IStar /> : num(k, lang)}
                    </button>
                  );
                })}
              </div>

              <button onClick={next} aria-label={t.nextL} disabled={atEnd} style={arrowStyle(atEnd)}>
                <IArrowRight />
              </button>
            </div>

            <span style={{ position: 'relative', zIndex: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 14, fontSize: 14, fontWeight: 600, color: 'var(--muted, #6b675e)' }}>
              <button type="button" onClick={() => setGrid(true)} className="rs-grid-open" title={`${ogWords(t, lang).allPages} (G)`}>
                <IBook /> {ogWords(t, lang).allPages}
              </button>
              {t.keys}
            </span>
            {grid && (
              <PageGrid
                c={c} P={P} FREE={FREE} cache={pageCache.current} lang={lang} num={num} t={t} pg={pg}
                onPick={k => { setGrid(false); setPage(k); }} onClose={() => setGrid(false)}
              />
            )}
            <style>{GRID_STYLE}</style>
          </>
        )}
      </section>

      {/* More Comics Carousel */}
      {!full && (
        <section data-screen-label="Comic — More" style={{ padding: 'clamp(48px, 6vw, 80px) clamp(12px, 1.8vw, 24px) clamp(72px, 8vw, 112px)' }}>
          <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
            <h2 style={{ margin: '0 0 20px', fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800, fontSize: 'clamp(28px, 3vw, 42px)', letterSpacing: '-.03em' }}>
              {t.more}
            </h2>
            <div style={{ display: 'flex', gap: 18, overflowX: 'auto', scrollbarWidth: 'none', padding: '4px 10px 14px 4px' }}>
              {all
                .filter(x => x.k !== c.k)
                .map(o => (
                  <a
                    key={o.k}
                    href={o.href}
                    style={{
                      flex: 'none',
                      width: 150,
                      display: 'block',
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: 'var(--card, var(--card, #fff))',
                      border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)',
                      boxShadow: `calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 ${o.ac}`,
                      color: INK,
                      textDecoration: 'none',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translate(-3px, -3px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                  >
                    <span style={{ position: 'relative', display: 'block', aspectRatio: '2/3', borderBottom: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)', overflow: 'hidden' }}>
                      <img src={o.poster} alt={o.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      {o.paid && (
                        <span style={{ position: 'absolute', left: 8, top: 8, padding: '3px 8px', background: '#f5c542', border: 'calc(2px * var(--bwk, 1)) solid var(--edge, #151515)', fontSize: 12, fontWeight: 800 }}>
                          <IStar />
                        </span>
                      )}
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 12px 12px' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted, #6b675e)' }}>{o.issue}</span>
                      <span style={{ fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800, fontSize: 16, lineHeight: 1.15 }}>
                        {o.title}
                      </span>
                    </span>
                  </a>
                ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// The page grid, in the site's own colours (theme tokens)
const GRID_STYLE = `
  .rs-grid-open { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 999px; cursor: pointer; font: inherit; font-weight: 700; font-size: 13.5px;
    border: calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515); background: var(--card, #fff); color: var(--ink, #151515); }
  .rs-grid-open:hover { background: var(--ink-bg, #151515); color: #fff; }
  .rs-grid-root { position: fixed; inset: 0; z-index: 100000; display: flex; justify-content: center; align-items: flex-start; padding: clamp(0px, 5vh, 56px) 12px; }
  .rs-grid-scrim { position: fixed; inset: 0; background: rgba(0,0,0,.7); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
  .rs-grid-panel { position: relative; width: min(1100px, 100%); max-height: calc(100dvh - 2 * clamp(0px, 5vh, 56px)); display: flex; flex-direction: column; outline: none;
    background: var(--paper, #f4f1ea); color: var(--ink, #151515); border-radius: 16px; overflow: hidden; box-shadow: 0 40px 120px -30px rgba(0,0,0,.8); animation: rs-in .25s ease-out; }
  .rs-grid-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px; border-bottom: 1px solid color-mix(in srgb, var(--ink, #151515) 12%, transparent); }
  .rs-grid-x { width: 36px; height: 36px; border-radius: 999px; display: grid; place-items: center; cursor: pointer; border: 0; background: color-mix(in srgb, var(--ink, #151515) 8%, transparent); color: inherit; font-size: 18px; }
  .rs-grid { overflow-y: auto; padding: 18px; display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 14px; }
  .rs-thumb { display: flex; flex-direction: column; gap: 6px; padding: 0; border: 0; background: none; cursor: pointer; color: inherit; font: inherit; }
  .rs-thumb-pic { position: relative; aspect-ratio: 2 / 3; border-radius: 8px; display: grid; place-items: center; background: var(--card, #fff) center / cover no-repeat;
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--ink, #151515) 15%, transparent); transition: box-shadow .15s, transform .15s; }
  .rs-thumb:hover .rs-thumb-pic { transform: translateY(-2px); box-shadow: 0 0 0 2px var(--acc, #f5c542); }
  .rs-thumb.is-on .rs-thumb-pic { box-shadow: 0 0 0 3px var(--acc, #f5c542); }
  .rs-thumb.is-locked .rs-thumb-pic { background: #f5c542; color: #151515; }
  .rs-thumb-n { font-size: 13px; font-weight: 800; text-align: center; }
  @media (max-width: 640px) { .rs-grid-root { padding: 0; } .rs-grid-panel { border-radius: 0; max-height: 100dvh; height: 100dvh; } .rs-grid { grid-template-columns: repeat(3, 1fr); } }
`;
