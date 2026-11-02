import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, Info, Lock, Play, Volume2, VolumeX } from 'lucide-react';
import MyListButton from '../components/MyListButton';
import BooksPromo from '../components/BooksPromo';
import { ytId, ytThumb, useContinue, useMyList, openPreview } from '../lib/originals';
import { ogWords, fill } from '../lib/ogWords';

// The home page of Rupok Originals (originals.<domain>): the studio's own
// series and comics, presented like a streaming service — a rotating hero
// that plays the series' episode quietly behind its title, what the reader
// was in the middle of, their list, poster rails, the latest episodes, and
// what is still in the works.

export const NIGHT = '#0b0b0b';
export const PANEL = '#161514';
export const TEXT = '#fafaf9';
export const DIM = '#a8a29e';
export const GOLD = '#f5c542';
export const DISPLAY = "'Sora', 'Hind Siliguri', sans-serif";

const COPY = {
  en: {
    kicker: 'A Rupok Original',
    watch: 'Watch now',
    read: 'Read the comic',
    details: 'Details',
    series: 'Series',
    comics: 'Comics',
    episodes: 'Latest episodes',
    slate: 'In the works',
    slateBody: 'Series in development and production at the studio.',
    seeAll: 'See all',
    free: 'Free',
    episode: 'Episode {n}',
    prev: 'Previous',
    next: 'Next'
  },
  bn: {
    kicker: 'রূপক অরিজিনাল',
    watch: 'এখনই দেখুন',
    read: 'কমিকস পড়ুন',
    details: 'বিস্তারিত',
    series: 'সিরিজ',
    comics: 'কমিকস',
    episodes: 'সর্বশেষ পর্ব',
    slate: 'নির্মাণাধীন',
    slateBody: 'স্টুডিওতে যে সিরিজগুলোর উন্নয়ন ও নির্মাণ চলছে।',
    seeAll: 'সব দেখুন',
    free: 'ফ্রি',
    episode: 'পর্ব {n}',
    prev: 'আগের',
    next: 'পরের'
  }
};

/** The words of Originals pages: the built-in ones, then the CMS's. */
export const ogCopy = (t, lang) => ({ ...COPY[lang === 'bn' ? 'bn' : 'en'], ...ogWords(t, lang) });

/** Where an episode plays: the Watch page, at that episode. */
export const watchHref = (base, seriesKey, index) => `${base}/watch?s=${encodeURIComponent(seriesKey)}&e=${index}`;

// A poster leans toward the pointer (mouse and pen only)
const tilt = e => {
  if (e.pointerType === 'touch') return;
  const el = e.currentTarget.querySelector('.og-art');
  if (!el) return;
  const r = el.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
  el.style.setProperty('--ry', `${((x - 0.5) * 14).toFixed(1)}deg`);
  el.style.setProperty('--rx', `${((0.5 - y) * 12).toFixed(1)}deg`);
};
const untilt = e => {
  const el = e.currentTarget.querySelector('.og-art');
  el?.style.setProperty('--rx', '0deg');
  el?.style.setProperty('--ry', '0deg');
};

/**
 * A series or comic as a 2:3 poster with its badges. Given `seriesKey` and
 * `ctx` ({ user, t, lang, base }), it also carries "More info" (the quick
 * view) and the My List +, shown on hover and always on touch screens.
 */
export function Poster({ item, label, sub, badge, locked, seriesKey, ctx }) {
  const w = ctx ? ogWords(ctx.t, ctx.lang) : null;
  return (
    <div className="og-card" onPointerMove={tilt} onPointerLeave={untilt}>
      <a href={item.href} className="og-poster" style={{ display: 'flex', flexDirection: 'column', gap: 10, color: TEXT, textDecoration: 'none' }}>
        <span className="og-art" style={{
          position: 'relative', aspectRatio: '2 / 3', borderRadius: 12, overflow: 'hidden',
          background: `${item.ac || PANEL} url(${item.poster}) center/cover`, display: 'block'
        }}>
          {badge && (
            <span style={{
              position: 'absolute', top: 8, left: 8, padding: '3px 9px', borderRadius: 6,
              background: 'rgba(0,0,0,.72)', color: TEXT, fontSize: 11, fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase'
            }}>{badge}</span>
          )}
          {locked && (
            <span aria-hidden="true" style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 999, display: 'grid', placeItems: 'center', background: GOLD, color: '#151515' }}>
              <Lock size={13} strokeWidth={2.6} />
            </span>
          )}
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <strong style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{label}</strong>
          {sub && <span style={{ fontSize: 13, color: DIM }}>{sub}</span>}
        </span>
      </a>
      {seriesKey && ctx && (
        <span className="og-actions">
          <button type="button" className="og-round" aria-label={`${w.info}: ${label}`} title={w.info} onClick={() => openPreview(seriesKey)}>
            <Info size={18} strokeWidth={2.4} />
          </button>
          <MyListButton round seriesKey={seriesKey} user={ctx.user} t={ctx.t} lang={ctx.lang} base={ctx.base} />
        </span>
      )}
    </div>
  );
}

export function Rail({ title, body, href, more, children }) {
  const rail = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: false });
  const measure = () => {
    const el = rail.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
  };
  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  const page = dir => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.85, behavior: 'smooth' });
  return (
    <section className="og-railbox" style={{ maxWidth: 1440, margin: '0 auto', padding: 'clamp(28px, 4vw, 48px) clamp(16px, 2.4vw, 32px) 0' }}>
      <div data-reveal="" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2 className="og-title" style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(22px, 2.2vw, 30px)', letterSpacing: '-.02em' }}>{title}</h2>
          {body && <span style={{ color: DIM, fontSize: 14.5, lineHeight: 1.5 }}>{body}</span>}
        </span>
        {href && (
          <a href={href} className="og-more" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: GOLD, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            {more} <ArrowRight size={15} />
          </a>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <div ref={rail} className={`og-rail${edge.start ? '' : ' fade-start'}${edge.end ? '' : ' fade-end'}`} onScroll={measure}>{children}</div>
        {!edge.start && <button type="button" className="og-page og-page-prev" aria-label="Previous" onClick={() => page(-1)}><ChevronLeft size={22} /></button>}
        {!edge.end && <button type="button" className="og-page og-page-next" aria-label="Next" onClick={() => page(1)}><ChevronRight size={22} /></button>}
      </div>
    </section>
  );
}

/** A wide card in a rail (an episode, or something to pick up again): picture, a bar, two lines. */
export function WideCard({ href, image, fallback, title, sub, progress, play = true }) {
  return (
    <a href={href} className="og-ep" style={{ display: 'flex', flexDirection: 'column', gap: 10, color: TEXT, textDecoration: 'none', gridColumn: 'span 2' }}>
      <span style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden', display: 'block', background: `${fallback || PANEL} ${image ? `url(${image}) center 20%/cover` : ''}` }}>
        {play && (
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(0deg, rgba(0,0,0,.55), transparent 60%)' }}>
            <span className="og-play" style={{ width: 44, height: 44, borderRadius: 999, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.9)', color: '#111' }}><Play size={20} fill="currentColor" /></span>
          </span>
        )}
        {progress != null && (
          <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: 'rgba(255,255,255,.22)' }}>
            <span style={{ display: 'block', height: '100%', width: `${Math.round(progress * 100)}%`, background: GOLD }} />
          </span>
        )}
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <strong style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 15 }}>{title}</strong>
        <span style={{ fontSize: 13, color: DIM }}>{sub}</span>
      </span>
    </a>
  );
}

export const ORIGINALS_STYLE = `
  .og-rail { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(150px, 1fr); gap: 16px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 8px; scrollbar-width: none; }
  .og-rail::-webkit-scrollbar { display: none; }
  .og-rail > * { scroll-snap-align: start; }
  @media (min-width: 700px) { .og-rail { grid-auto-columns: calc((100% - 5 * 16px) / 6); } }
  /* Room on every side for a poster that grows and leans on hover, so the scroll
     area never clips it; the negative margin keeps the posters in line with the title */
  .og-rail { padding: 14px 14px 12px; margin: -14px -14px 0; scroll-padding-inline: 14px; }
  .og-rail.fade-start { -webkit-mask-image: linear-gradient(90deg, transparent, #000 64px); mask-image: linear-gradient(90deg, transparent, #000 64px); }
  .og-rail.fade-end { -webkit-mask-image: linear-gradient(90deg, #000 calc(100% - 64px), transparent); mask-image: linear-gradient(90deg, #000 calc(100% - 64px), transparent); }
  .og-rail.fade-start.fade-end { -webkit-mask-image: linear-gradient(90deg, transparent, #000 64px, #000 calc(100% - 64px), transparent); mask-image: linear-gradient(90deg, transparent, #000 64px, #000 calc(100% - 64px), transparent); }

  /* Rail arrows: on wide screens, shown while the pointer is over the rail */
  .og-page {
    position: absolute; top: 34%; z-index: 2; width: 46px; height: 46px; border-radius: 999px; display: none; place-items: center;
    border: 1px solid rgba(245,197,66,.5); background: rgba(11,11,11,.82); color: ${GOLD}; cursor: pointer;
    -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); opacity: 0; transition: opacity .2s, transform .2s;
  }
  .og-page-prev { left: -10px; } .og-page-next { right: -10px; }
  .og-page:hover { transform: scale(1.08); background: ${GOLD}; color: #111; }
  @media (hover: hover) and (min-width: 700px) {
    .og-page { display: grid; }
    .og-railbox:hover .og-page, .og-page:focus-visible { opacity: 1; }
  }

  /* Posters lean toward the pointer */
  .og-card { position: relative; }
  .og-art {
    --rx: 0deg; --ry: 0deg;
    transform: perspective(700px) rotateX(var(--rx)) rotateY(var(--ry));
    transition: transform .3s ease-out, box-shadow .25s ease;
  }
  .og-card:hover .og-art, .og-poster:focus-visible .og-art {
    transform: perspective(700px) rotateX(var(--rx)) rotateY(var(--ry)) scale(1.04);
    box-shadow: 0 0 0 2px ${GOLD}, 0 22px 44px -16px rgba(0,0,0,.95);
    transition: transform .08s linear, box-shadow .25s ease;
  }
  .og-poster strong { transition: color .2s; }
  .og-card:hover .og-poster strong { color: ${GOLD}; }

  /* A poster's info and My List buttons, at the foot of the picture */
  .og-actions {
    position: absolute; left: 0; right: 0; top: 0; aspect-ratio: 2 / 3; box-sizing: border-box;
    display: flex; align-items: flex-end; justify-content: flex-end; gap: 6px; padding: 10px;
    pointer-events: none; opacity: 0; transform: translateY(6px); transition: opacity .2s, transform .2s;
  }
  .og-actions > * { pointer-events: auto; }
  .og-card:hover .og-actions, .og-card:focus-within .og-actions { opacity: 1; transform: none; }
  @media (hover: none) { .og-actions { opacity: 1; transform: none; } }
  .og-round {
    width: 36px; height: 36px; border-radius: 999px; display: grid; place-items: center; padding: 0; cursor: pointer;
    border: 1px solid rgba(255,255,255,.4); background: rgba(11,11,11,.78); color: ${TEXT};
    -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); transition: background .2s, color .2s, border-color .2s, transform .15s;
  }
  .og-round:hover { background: ${TEXT}; color: #111; transform: scale(1.06); }
  .og-round.is-on { background: ${GOLD}; border-color: ${GOLD}; color: #111; }

  /* Wide cards: the picture eases in, the play button rings */
  .og-ep > span:first-child { transition: background-size .5s ease, transform .25s ease, box-shadow .25s; }
  .og-ep:hover > span:first-child { box-shadow: 0 0 0 2px ${GOLD}, 0 18px 40px -16px rgba(0,0,0,.9); }
  .og-play { position: relative; transition: transform .2s; }
  .og-ep:hover .og-play { transform: scale(1.1); }
  .og-ep:hover .og-play::after { content: ''; position: absolute; inset: -6px; border-radius: 999px; border: 2px solid ${GOLD}; animation: og-ring 1.2s ease-out infinite; }
  @keyframes og-ring { from { opacity: 1; transform: scale(.9); } to { opacity: 0; transform: scale(1.35); } }

  /* The gold rule under a section title draws in as it scrolls into view */
  .og-title { position: relative; padding-bottom: 8px; }
  .og-title::after { content: ''; position: absolute; left: 0; bottom: 0; width: 42px; height: 3px; border-radius: 3px; background: ${GOLD}; transform-origin: left; transition: transform .7s cubic-bezier(.2,.8,.2,1) .25s; }
  .can-reveal [data-reveal]:not([data-revealed]) .og-title::after { transform: scaleX(0); }
  .og-more svg { transition: transform .2s; }
  .og-more:hover svg { transform: translateX(4px); }
  @media (prefers-reduced-motion: reduce) {
    .og-art { transform: none !important; transition: none; }
    .og-ep:hover .og-play::after { animation: none; }
  }
`;

// The hero's moving picture: after a few seconds on a slide, its episode plays
// silently behind the title, filling the frame. It stops when the hero leaves
// the screen or the tab is hidden, and never starts on a phone, on a metered
// connection or for a reader who asked for less motion.
function HeroTrailer({ videoId, onPlaying, w }) {
  const box = useRef(null);
  const frame = useRef(null);
  const [state, setState] = useState({ on: false, shown: false, muted: true });

  useEffect(() => {
    setState({ on: false, shown: false, muted: true });
    if (!videoId) return undefined;
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const small = window.matchMedia?.('(max-width: 760px)').matches;
    if (calm || small || navigator.connection?.saveData) return undefined;
    let visible = true;
    let timer = 0;
    // Starts after a pause on the slide, and again whenever the hero comes back into view
    const start = delay => {
      if (timer) return;
      timer = setTimeout(() => { timer = 0; if (visible && !document.hidden) setState(s => ({ ...s, on: true })); }, delay);
    };
    const stop = () => {
      clearTimeout(timer);
      timer = 0;
      setState(s => (s.on ? { ...s, on: false, shown: false } : s));
    };
    start(3500);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && e.intersectionRatio > 0.35;
      if (visible) start(1500); else stop();
    }, { threshold: [0, 0.35, 1] });
    if (box.current) io.observe(box.current);
    const onHidden = () => { if (document.hidden) stop(); else if (visible) start(1500); };
    document.addEventListener('visibilitychange', onHidden);
    return () => { clearTimeout(timer); io.disconnect(); document.removeEventListener('visibilitychange', onHidden); };
  }, [videoId]);

  useEffect(() => { onPlaying?.(state.on); }, [state.on, onPlaying]);

  const command = func => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
  const toggleSound = () => {
    command(state.muted ? 'unMute' : 'mute');
    setState(s => ({ ...s, muted: !s.muted }));
  };

  const origin = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : '';
  return (
    <>
      <div ref={box} aria-hidden="true" className="og-trailer" style={{ opacity: state.shown ? 1 : 0 }}>
        {state.on && (
          <iframe
            ref={frame}
            title="trailer"
            tabIndex={-1}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&enablejsapi=1&origin=${origin}`}
            allow="autoplay; encrypted-media; picture-in-picture"
            // The player draws its own black frame first; show it once it has had time to start
            onLoad={() => setTimeout(() => setState(s => (s.on ? { ...s, shown: true } : s)), 1200)}
          />
        )}
      </div>
      {state.shown && (
        <button type="button" className="og-sound" onClick={toggleSound} aria-label={state.muted ? w.unmute : w.mute} title={state.muted ? w.unmute : w.mute}>
          {state.muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      )}
    </>
  );
}

export default function OriginalsHome({ lang, base, t, num, user, series = [], comics = [], heroKeys = '', booksUrl = '' }) {
  // The CMS copy (Page content → Originals), over the built-in words
  const c = ogCopy(t, lang);
  const ctx = { user, t, lang, base };
  // The hero: the series chosen in CMS → Settings, in that order; else every series in production
  const chosen = String(heroKeys || '').split(',').map(k => series.find(s => s.k === k.trim())).filter(Boolean);
  const producing = series.filter(s => s.prod);
  const heroes = chosen.length ? chosen : producing.length ? producing : series;
  const [at, setAt] = useState(0);
  const [paused, setPaused] = useState(false);
  const [trailer, setTrailer] = useState(false);
  const hero = heroes[at % Math.max(heroes.length, 1)];

  const pickUp = useContinue(user, series, comics);
  const myList = useMyList(user);
  const listed = series.filter(s => myList.has(s.k));

  // The hero turns over every 8 seconds: when the gold fill in the active dot
  // runs out (below). It stops while the reader is on the hero or its episode
  // is playing, and never runs for a reader who asked for less motion (the fill
  // does not animate then).

  const episodes = series
    .flatMap(s => s.eps.map((e, i) => ({ s, e, i })).filter(({ e }) => e.live && ytId(e.url)))
    .slice(-8).reverse();
  const slate = series.filter(s => !s.prod);
  const liveIndex = hero ? hero.eps.findIndex(e => e.live && ytId(e.url)) : -1;
  const heroVideo = liveIndex >= 0 ? ytId(hero.eps[liveIndex].url) : null;

  return (
    <div style={{ background: NIGHT, color: TEXT, paddingBottom: 'clamp(48px, 6vw, 80px)' }}>
      {hero && (
        <section
          aria-roledescription="carousel"
          className="og-hero"
          onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
          style={{ position: 'relative', minHeight: 'min(88vh, 820px)', paddingTop: 'var(--nav-h, 60px)', boxSizing: 'border-box', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}
        >
          <div key={hero.k} aria-hidden="true" className="og-hero-bg" style={{
            position: 'absolute', inset: 0,
            background: `${hero.ac} url(${hero.hasBanner ? hero.banner : hero.poster}) center 25%/cover`,
            filter: hero.hasBanner ? 'none' : 'blur(2px) saturate(1.1)', transform: hero.hasBanner ? 'none' : 'scale(1.06)'
          }} />
          <HeroTrailer key={hero.k} videoId={heroVideo} onPlaying={setTrailer} w={c} />
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `linear-gradient(90deg, ${NIGHT} 0%, ${NIGHT}e6 30%, ${NIGHT}33 70%, transparent), linear-gradient(0deg, ${NIGHT} 0%, transparent 45%)` }} />
          <div aria-hidden="true" className="og-grain" />

          <div style={{ position: 'relative', width: '100%', maxWidth: 1440, margin: '0 auto', padding: 'clamp(40px, 6vw, 80px) clamp(16px, 2.4vw, 32px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 32, alignItems: 'end' }}>
            <div key={hero.k} style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640, animation: 'rs-in .6s ease-out' }}>
              <span style={{ color: GOLD, fontWeight: 800, fontSize: 12.5, letterSpacing: '.18em', textTransform: 'uppercase' }}>
                {c.kicker} · {hero.status}
              </span>
              <h1 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(48px, 7.5vw, 108px)', lineHeight: .92, letterSpacing: '-.045em' }}>{hero.title}</h1>
              <span style={{ fontSize: 'clamp(17px, 1.5vw, 21px)', fontWeight: 600 }}>{hero.sub}</span>
              {hero.log && <p className="og-hero-log" style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: '#d6d3d1', maxWidth: 560 }}>{hero.log}</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 13, color: DIM }}>
                {[hero.genre, t.fmt ? t.fmt(hero.epCount, num(3, lang)) : null, hero.access].filter(Boolean).map(x => (
                  <span key={x} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,.18)' }}>{x}</span>
                ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
                <a href={liveIndex >= 0 ? watchHref(base, hero.k, liveIndex) : hero.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 10, background: TEXT, color: '#111', fontWeight: 800, textDecoration: 'none' }}>
                  <Play size={18} fill="currentColor" /> {liveIndex >= 0 ? c.watch : c.details}
                </a>
                {hero.comicHref && (
                  <a href={hero.comicHref} data-pow="" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 10, background: 'rgba(255,255,255,.14)', color: TEXT, fontWeight: 700, textDecoration: 'none', backdropFilter: 'blur(6px)' }}>
                    <BookOpen size={18} /> {c.read}
                  </a>
                )}
              </div>
            </div>

            {heroes.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" aria-label={c.prev} onClick={() => setAt(i => (i - 1 + heroes.length) % heroes.length)} className="og-arrow"><ChevronLeft size={20} /></button>
                {heroes.map((s, i) => {
                  const on = i === at % heroes.length;
                  return (
                    <button
                      key={s.k} type="button" onClick={() => setAt(i)}
                      aria-label={s.title} aria-current={on ? 'true' : undefined}
                      className="og-dot"
                      style={{ width: on ? 44 : 10, background: on ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.35)' }}
                    >
                      {/* The slide's time running out, paused while the reader is on the hero or it plays */}
                      {on && (
                        <span
                          key={at} className="og-dot-fill"
                          style={{ animationPlayState: paused || trailer ? 'paused' : 'running' }}
                          onAnimationEnd={() => setAt(n => (n + 1) % heroes.length)}
                        />
                      )}
                    </button>
                  );
                })}
                <button type="button" aria-label={c.next} onClick={() => setAt(i => (i + 1) % heroes.length)} className="og-arrow"><ChevronRight size={20} /></button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* What the reader was in the middle of */}
      {pickUp.length > 0 && (
        <Rail title={c.continueTitle}>
          {pickUp.map(x => (x.kind === 'comic' ? (
            <WideCard
              key={`c-${x.c.k}`} href={x.c.href} image={x.c.poster} fallback={x.c.ac} play={false}
              title={`${x.c.title} · ${x.c.issue}`}
              sub={x.total ? fill(c.pageOf, { n: num(x.page, lang), t: num(x.total, lang) }) : c.resume}
              progress={x.total ? Math.min(1, x.page / x.total) : null}
            />
          ) : (
            <WideCard
              key={`e-${x.s.k}`} href={watchHref(base, x.s.k, x.i)} image={ytThumb(x.ep.url)} fallback={x.s.ac}
              title={x.ep.t} sub={`${x.s.title} · ${fill(c.episode, { n: x.ep.n })}`}
            />
          )))}
        </Rail>
      )}

      {user && listed.length > 0 && (
        <Rail title={c.myList} body={c.myListBody}>
          {listed.map(s => <Poster key={s.k} item={s} label={s.title} sub={s.sub} badge={s.status} locked={s.locked} seriesKey={s.k} ctx={ctx} />)}
        </Rail>
      )}

      {series.length > 0 && (
        <Rail title={c.series} href={`${base}/series`} more={c.seeAll}>
          {series.map(s => <Poster key={s.k} item={s} label={s.title} sub={s.sub} badge={s.status} locked={s.locked} seriesKey={s.k} ctx={ctx} />)}
        </Rail>
      )}

      {comics.length > 0 && (
        <Rail title={c.comics} href={`${base}/comics`} more={c.seeAll}>
          {comics.map(x => (
            <Poster key={x.k} item={x} label={x.title} sub={x.sub || x.issue} badge={x.paid ? (x.locked ? x.price : null) : c.free} locked={x.locked} />
          ))}
        </Rail>
      )}

      {episodes.length > 0 && (
        <Rail title={c.episodes} href={`${base}/watch`} more={c.seeAll}>
          {episodes.map(({ s, e, i }) => (
            <WideCard
              key={`${s.k}-${e.n}`} href={watchHref(base, s.k, i)} image={ytThumb(e.url)} fallback={s.ac}
              title={e.t} sub={`${s.title} · ${fill(c.episode, { n: e.n })}`}
            />
          ))}
        </Rail>
      )}

      {/* In the works: a row like the others; each poster's status sits under its
          title, since a badge saying the same on every poster would cover the art */}
      {slate.length > 0 && (
        <Rail title={c.slate} body={c.slateBody}>
          {slate.map(s => <Poster key={s.k} item={s} label={s.title} sub={s.status} seriesKey={s.k} ctx={ctx} />)}
        </Rail>
      )}

      <BooksPromo url={booksUrl} lang={lang} theme="originals" />

      <style>{`
        ${ORIGINALS_STYLE}
        .og-arrow { width: 40px; height: 40px; border-radius: 999px; display: grid; place-items: center; cursor: pointer;
          border: 1px solid rgba(255,255,255,.25); background: rgba(0,0,0,.35); color: ${TEXT}; }
        .og-arrow:hover { background: rgba(255,255,255,.15); }
        .og-hero-bg { animation: rs-in .8s ease-out, og-push 9s ease-out forwards; }
        @keyframes og-push { from { scale: 1; } to { scale: 1.08; } }
        /* The trailer fills the frame (a 16:9 player cropped to cover) and fades in over the picture */
        .og-trailer { position: absolute; inset: 0; overflow: hidden; pointer-events: none; container-type: size; transition: opacity 1.2s ease; }
        .og-trailer iframe {
          position: absolute; left: 50%; top: 50%; border: 0;
          width: max(100cqw, 177.78cqh); height: max(100cqh, 56.25cqw); transform: translate(-50%, -50%) scale(1.02);
        }
        .og-sound { position: absolute; right: clamp(16px, 2.4vw, 32px); top: calc(var(--nav-h, 60px) + 20px); z-index: 2; }
        .og-sound { width: 42px; height: 42px; border-radius: 999px; display: grid; place-items: center; cursor: pointer;
          border: 1px solid rgba(255,255,255,.35); background: rgba(0,0,0,.45); color: ${TEXT}; -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
        .og-sound:hover { background: ${TEXT}; color: #111; }
        .og-grain {
          position: absolute; inset: -50%; pointer-events: none; opacity: .09;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          animation: og-grain 1.2s steps(4) infinite;
        }
        @keyframes og-grain { 0% { transform: translate(0, 0); } 25% { transform: translate(-3%, 2%); } 50% { transform: translate(2%, -3%); } 75% { transform: translate(-2%, -1%); } 100% { transform: translate(0, 0); } }
        .og-dot { position: relative; height: 10px; border-radius: 999px; border: none; cursor: pointer; padding: 0; overflow: hidden; transition: width .3s; }
        .og-dot-fill { position: absolute; inset: 0; border-radius: inherit; background: ${GOLD}; transform-origin: left; animation: og-fill 8s linear forwards; }
        @keyframes og-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @media (prefers-reduced-motion: reduce) {
          .og-hero-bg, .og-grain, .og-dot-fill { animation: none !important; }
          .og-dot-fill { transform: none; }
        }
      `}</style>
    </div>
  );
}
