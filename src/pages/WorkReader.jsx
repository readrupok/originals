import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { INK, fill } from '../data/content';
import { api, getUserToken } from '../services/api';
import RichText, { RichTextStyles } from '../components/RichText';
import { ArrowLeft, Check } from 'lucide-react';
import TranslateNotice from '../components/TranslateNotice';
import ListenBar from '../components/ListenBar';
import CommentsSection from '../components/CommentsSection';
import FollowButton from '../components/FollowButton';
import ShareBar from '../components/ShareBar';
import ReportButton from '../components/ReportButton';
import { IArrowRight, IStar } from '../components/icons';
import RupokStoriesMark from '../components/RupokStoriesMark';
import { STATUS, availability, isSupported, translateDoc } from '../lib/translate';
import NotFound from './NotFound';

const pairLabel = (pairs, code, fallback) =>
  (Array.isArray(pairs) ? pairs.find(p => Array.isArray(p) && p[0] === code)?.[1] : null) || fallback;

/** Top-level blocks as plain strings — the same indices RichText uses. */
function docParagraphs(doc) {
  if (!doc?.content) return [];
  const textOf = node => {
    if (!node) return '';
    if (node.type === 'text') return node.text || '';
    if (node.type === 'hardBreak') return '\n';
    return (node.content || []).map(textOf).join('');
  };
  return doc.content.map(block =>
    block.type === 'horizontalRule' || block.type === 'image' ? '' : textOf(block).trim());
}

export default function WorkReader({ lang, base, handle, wkey, chapter, num, t, user, onProgress, myAuthor, openPay, ownership }) {
  const [piece, setPiece] = useState(undefined);
  const [chapterData, setChapterData] = useState(undefined);
  const [reading, setReading] = useState(-1);

  // Translation is strictly an overlay on top of the original.
  const [trState, setTrState] = useState(null);
  const [trDoc, setTrDoc] = useState(null);
  const [trProgress, setTrProgress] = useState(0);
  const [showTranslated, setShowTranslated] = useState(false);
  const abortRef = useRef(null);

  // ── Load the piece ───────────────────────────────────────────────────────
  useEffect(() => {
    let live = true;
    setPiece(undefined);
    api.getWork(wkey).then(res => {
      if (!live) return;
      // The handle in the URL has to match, or /authors/someone-else/key would
      // present another author's work under the wrong profile.
      setPiece(res.ok && res.data.author_handle === handle ? res.data : null);
    });
    return () => { live = false; };
    // ownership changes when the reader signs in, pays, or is approved — the
    // moments a paid piece's lock (and its pending notice) can change.
  }, [wkey, handle, ownership]);

  useEffect(() => { api.track('library_read'); }, [wkey]);

  const searchParams = useMemo(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''), []);
  const urlChapter = searchParams.get('ch') ? parseInt(searchParams.get('ch'), 10) : null;
  const urlPct = searchParams.get('p') !== null ? parseInt(searchParams.get('p'), 10) : null;
  const scrollRestoredRef = useRef(false);

  // ── Load a chapter when the piece is serialized ──────────────────────────
  const activeChapter = useMemo(() => {
    if (!piece || piece.kind !== 'series') return null;
    const list = piece.chapters || [];
    if (!list.length) return null;
    const target = chapter || urlChapter;
    return target && list.some(c => c.n === target) ? target : list[0].n;
  }, [piece, chapter, urlChapter]);

  useEffect(() => {
    if (!piece || piece.kind !== 'series' || !activeChapter) { setChapterData(null); return undefined; }
    let live = true;
    setChapterData(undefined);
    api.getWorkChapter(wkey, activeChapter).then(res => {
      if (live) setChapterData(res.ok ? res.data : null);
    });
    return () => { live = false; };
  }, [piece, wkey, activeChapter]);

  const originalDoc = piece?.kind === 'series' ? chapterData?.body : piece?.body;

  // ── Translation ──────────────────────────────────────────────────────────
  const needsTranslation = !!piece && piece.language !== lang;

  useEffect(() => {
    setTrDoc(null);
    setShowTranslated(false);
    setTrProgress(0);
    abortRef.current?.abort();

    if (!needsTranslation) { setTrState(null); return; }
    if (!isSupported()) { setTrState('unsupported'); return; }

    let live = true;
    // Say straight away that the piece is in another language. Working out
    // whether this browser can translate it takes a moment (and on some builds
    // the check never settles), and a reader should not stare at nothing
    // meanwhile.
    setTrState('checking');
    availability(piece.language, lang).then(state => {
      if (!live) return;
      if (state === STATUS.unsupported) setTrState('unsupported');
      else if (state === STATUS.unavailable) setTrState('unavailable');
      else setTrState('ready');
    });
    return () => { live = false; };
  }, [needsTranslation, piece?.language, lang, wkey, activeChapter]);

  const runTranslation = useCallback(async () => {
    if (!originalDoc || !piece) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setTrProgress(0);
    setTrState('translating');
    try {
      const out = await translateDoc(originalDoc, piece.language, lang, {
        onProgress: setTrProgress,
        onStatus: s => setTrState(s === STATUS.downloading ? 'downloading' : 'translating'),
        signal: controller.signal,
        workKey: wkey,
        chapterNum: activeChapter
      });
      if (controller.signal.aborted) return;
      setTrDoc(out);
      setShowTranslated(true);
      setTrState('translated');
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setTrState(err?.status === STATUS.unsupported ? 'unsupported'
        : err?.status === STATUS.unavailable ? 'unavailable' : 'failed');
    }
  }, [originalDoc, piece, lang, wkey, activeChapter]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const doc = showTranslated && trDoc ? trDoc : originalDoc;

  // All writings on Rupok Stories are 100% free and accessible to all readers.
  const paragraphs = useMemo(() => docParagraphs(doc).filter(p => p !== null), [doc]);

  // ── Reading progress is measured over the prose alone ────────────────────
  // Everything after it — chapter nav, comments, footer — is not part of the
  // piece, so a reader who reaches the last paragraph is at 100%.
  const proseRef = useRef(null);
  const [isFinishedLocal, setIsFinishedLocal] = useState(false);

  /** Where the viewport bottom sits inside the prose, as 0..100. */
  const proseProgress = useCallback(() => {
    const el = proseRef.current;
    const windowH = window.innerHeight;
    if (!el || !el.offsetHeight) {
      const max = document.documentElement.scrollHeight - windowH;
      return max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 100;
    }
    const rect = el.getBoundingClientRect();
    if (rect.bottom <= windowH) return 100;
    if (rect.top >= windowH) return 0;
    return Math.max(0, Math.min(100, Math.round(((windowH - rect.top) / rect.height) * 100)));
  }, []);

  // ── Scroll position restoration ──────────────────────────────────────────
  useEffect(() => {
    if (!piece || scrollRestoredRef.current) return;
    if (paragraphs.length === 0) return;

    const doScrollTo = (pct) => {
      if (pct > 0) {
        setTimeout(() => {
          const el = proseRef.current;
          if (el && el.offsetHeight) {
            // Inverse of proseProgress(): put the viewport bottom at pct of the prose.
            const absTop = el.getBoundingClientRect().top + window.scrollY;
            const targetY = Math.round(absTop - window.innerHeight + (pct / 100) * el.offsetHeight);
            window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
          } else {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            if (max > 0) window.scrollTo({ top: Math.round((pct / 100) * max), behavior: 'smooth' });
          }
          scrollRestoredRef.current = true;
        }, 180);
      } else {
        scrollRestoredRef.current = true;
      }
    };

    if (urlPct !== null && urlPct > 0) {
      doScrollTo(urlPct);
    } else if (getUserToken()) {
      api.getLibraryProgress(lang).then(res => {
        if (res.ok && Array.isArray(res.data)) {
          const item = res.data.find(x => x.work_key === wkey);
          // A piece already finished keeps its badge on a later visit.
          if (item?.finished) setIsFinishedLocal(true);
          if (item?.scroll_pct > 0) {
            doScrollTo(item.scroll_pct);
            return;
          }
        }
        scrollRestoredRef.current = true;
      }).catch(() => {
        scrollRestoredRef.current = true;
      });
    } else {
      scrollRestoredRef.current = true;
    }
  }, [piece, paragraphs, urlPct, wkey, lang]);

  // ── Reading progress ─────────────────────────────────────────────────────
  const articleRef = useRef(null);
  const saveTimer = useRef(null);
  const lastSaved = useRef(null);

  const sendProgress = useCallback((pct, finished) => {
    if (!piece || !getUserToken()) return;
    const stamp = `${activeChapter || 0}:${pct}:${finished}`;
    if (stamp === lastSaved.current) return;
    lastSaved.current = stamp;
    if (finished) setIsFinishedLocal(true);
    api.saveLibraryProgress(wkey, { chapter_num: activeChapter || 0, scroll_pct: pct, finished })
      .then(() => onProgress?.());
  }, [piece, activeChapter, wkey, onProgress]);

  useEffect(() => {
    if (!piece || !getUserToken()) return undefined;

    const computeProgress = proseProgress;

    const isLastChapter = piece.kind !== 'series'
      || activeChapter === (piece.chapters?.[piece.chapters.length - 1]?.n ?? activeChapter);

    const onScroll = () => {
      if (!scrollRestoredRef.current) return;
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const pct = computeProgress();
        sendProgress(pct, pct >= 97 && isLastChapter);
      }, 500);
    };

    // A piece short enough to fit on one screen never fires a scroll event, so
    // take one reading once the restore has settled.
    const firstTick = setTimeout(() => {
      if (!scrollRestoredRef.current) return;
      const pct = computeProgress();
      sendProgress(pct, pct >= 97 && isLastChapter);
    }, 1200);

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(firstTick);
      clearTimeout(saveTimer.current);
      window.removeEventListener('scroll', onScroll);
      if (scrollRestoredRef.current) {
        const pct = computeProgress();
        sendProgress(pct, pct >= 97 && isLastChapter);
      }
    };
  }, [piece, wkey, activeChapter, sendProgress, proseProgress]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (piece === undefined) {
    return <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', color: 'var(--muted, #6b675e)' }}>…</div>;
  }
  if (piece === null) return <NotFound base={base} t={t} />;

  const ac = piece.ac || piece.author_ac || '#6f6758';
  const authorAvatarUrl = piece.author_avatar ? api.libraryImageUrl(piece.author_avatar) : null;
  const authorAc = piece.author_ac || ac;
  const chapters = piece.chapters || [];
  const idx = chapters.findIndex(c => c.n === activeChapter);
  const prev = idx > 0 ? chapters[idx - 1] : null;
  const next = idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null;
  const chapterHref = n => `${base}/stories/${handle}/${wkey}/${n}`;

  const published = piece.published
    ? new Date(piece.published).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB',
      { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const postUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${base}/stories/${handle}/${wkey}${activeChapter && activeChapter > 1 ? `?ch=${activeChapter}` : ''}`
    : `${base}/stories/${handle}/${wkey}`;

  const currentChapterObj = activeChapter && chapters.length ? chapters.find(c => c.n === activeChapter) : null;
  const postTitle = currentChapterObj
    ? `${piece.title}: ${currentChapterObj.t || (lang === 'bn' ? `অধ্যায় ${num(activeChapter, lang)}` : `Chapter ${activeChapter}`)} — ${piece.author}`
    : `${piece.title} — ${piece.author}`;

  return (
    <div style={{ color: INK }}>
      <RichTextStyles />

      <article ref={articleRef} style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(24px, 4vh, 56px) clamp(16px, 2vw, 24px) clamp(56px, 9vh, 110px)' }}>
        <nav style={{ fontSize: 13, color: 'var(--muted, #6b675e)', display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          <a href={`${base}/stories`} style={{ color: 'var(--muted, #6b675e)' }}>{t.h1Library}</a>
          <span aria-hidden="true">/</span>
          <a href={`${base}/stories/${handle}`} style={{ color: 'var(--muted, #6b675e)' }}>{piece.author}</a>
        </nav>

        {/* Work Header with cover on one side */}
        <header style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 'clamp(18px, 3.5vw, 32px)',
          alignItems: 'flex-start',
          marginBottom: 28,
          flexWrap: 'wrap'
        }}>
          {/* Cover container in 3:4 portrait ratio */}
          <div style={{
            width: 'clamp(140px, 28vw, 190px)',
            aspectRatio: '3 / 4',
            flexShrink: 0,
            borderRadius: 14,
            border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
            boxShadow: `calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 ${ac}`,
            overflow: 'hidden',
            background: piece.cover
              ? `${ac} url(${api.libraryImageUrl(piece.cover)}) center/cover`
              : `linear-gradient(135deg, ${ac} 0%, ${ac}cc 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {piece.cover ? (
              <img
                src={api.libraryImageUrl(piece.cover)}
                alt={piece.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <>
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', opacity: 0.18 }}>
                  <RupokStoriesMark height={110} color="#ffffff" />
                </div>
                <span style={{
                  position: 'relative',
                  zIndex: 1,
                  fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
                  fontWeight: 800,
                  fontSize: 'clamp(16px, 1.8vw, 22px)',
                  color: '#fff',
                  padding: '0 12px',
                  textAlign: 'center',
                  lineHeight: 1.2,
                  textShadow: 'calc(2px * var(--shk, 1)) calc(2px * var(--shk, 1)) 0 rgba(0,0,0,.3)'
                }}>
                  {piece.title}
                </span>
              </>
            )}
          </div>

          {/* Title, metadata, and synopsis */}
          <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            <span style={{
              alignSelf: 'flex-start', padding: '4px 11px', border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
              borderRadius: 999, background: ac, color: '#fff', fontWeight: 800, fontSize: 12
            }}>{pairLabel(t.libraryKinds, piece.kind, piece.kind)}</span>

            <h1 style={{
              margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800,
              fontSize: 'clamp(28px, 3.8vw, 48px)', lineHeight: 1.08, letterSpacing: '-.03em'
            }}>{piece.title}</h1>

            {piece.subtitle && (
              <p style={{ margin: 0, fontSize: 'clamp(15px, 1.3vw, 18px)', color: 'var(--muted-2, #55524a)', lineHeight: 1.45 }}>
                {piece.subtitle}
              </p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', alignItems: 'center', fontSize: 13.5, color: 'var(--muted, #6b675e)' }}>
              <a href={`${base}/stories/${handle}`} style={{ color: INK, fontWeight: 800 }}>
                {(t.byAuthor || '{name}').replace('{name}', piece.author)}
              </a>
              {published && <span>{(t.workPublishedOn || '{date}').replace('{date}', published)}</span>}
              <span>{(t.workReadTime || '{n} min read').replace('{n}', num(piece.minutes || 1, lang))}</span>
              {piece.words > 0 && <span>{(t.workWords || '{n} words').replace('{n}', num(piece.words, lang))}</span>}
            </div>

            {piece.summary && (
              <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--muted, #6b675e)', fontStyle: 'italic', lineHeight: 1.5 }}>
                {piece.summary}
              </p>
            )}
          </div>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 26 }}>
          {needsTranslation && trState && (
            <TranslateNotice
              state={showTranslated ? 'translated' : trDoc ? 'original-shown' : trState}
              from={piece.language}
              progress={trProgress}
              t={t}
              onTranslate={runTranslation}
              onShowOriginal={() => setShowTranslated(false)}
              onShowTranslated={() => setShowTranslated(true)}
            />
          )}

          {paragraphs.some(Boolean) && (
            <ListenBar
              paragraphs={paragraphs}
              lang={showTranslated && trDoc ? lang : piece.language}
              t={t}
              onParagraph={setReading}
            />
          )}
        </div>

        {/* Chapter picker, above the prose so a returning reader finds it fast */}
        {piece.kind === 'series' && chapters.length > 0 && (
          <nav aria-label={t.workAllChapters} style={{
            display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 26,
            paddingBottom: 18, borderBottom: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`
          }}>
            {chapters.map(c => {
              const on = c.n === activeChapter;
              const locked = piece.locked && c.n > (piece.free_chapters || 0);
              return (
                <a key={c.n} href={chapterHref(c.n)} title={locked ? t.chapterLocked : undefined} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 13px', borderRadius: 999, border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                  background: on ? 'var(--ink-bg, #151515)' : 'var(--card, var(--card, #fff))', color: on ? '#fff' : INK,
                  textDecoration: 'none', fontWeight: 800, fontSize: 13
                }}>
                  {(t.workChapter || 'Chapter {n}').replace('{n}', num(c.n, lang))}
                  {locked && <Lock size={12} strokeWidth={2.8} aria-label={t.chapterLocked} />}
                </a>
              );
            })}
          </nav>
        )}

        {piece.kind === 'series' && chapterData?.title && (
          <h2 style={{
            margin: '0 0 18px', fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
            fontSize: 'clamp(21px, 2.2vw, 28px)', fontWeight: 800, letterSpacing: '-.02em'
          }}>{chapterData.title}</h2>
        )}

        {/* proseRef bounds the piece itself — reading progress is measured over
            this box, not the whole page. */}
        <div ref={proseRef}>
          {doc === undefined ? (
            <p style={{ color: 'var(--muted, #6b675e)' }}>…</p>
          ) : (
            <RichText doc={doc} reading={reading} />
          )}

          {piece.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 36 }}>
              {piece.tags.map(tag => (
                <span key={tag} style={{
                  padding: '4px 11px', borderRadius: 999, border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                  background: 'var(--card, var(--card, #fff))', fontSize: 12.5, fontWeight: 700
                }}>{tag}</span>
              ))}
            </div>
          )}
        </div>

        {piece.kind === 'series' && (prev || next) && (
          <nav style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 40, paddingTop: 22, borderTop: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)` }}>
            {prev ? (
              <a href={chapterHref(prev.n)} style={navBtn}><ArrowLeft size={15} /> {t.workPrevChapter}</a>
            ) : <span />}
            {next && (
              <a href={chapterHref(next.n)} style={{ ...navBtn, background: 'var(--ink-bg, #151515)', color: '#fff' }}>
                {t.workNextChapter} <IArrowRight />
              </a>
            )}
          </nav>
        )}

        {/* Finished reading button */}
        {getUserToken() && (
          isFinishedLocal ? (
            <div style={{
              marginTop: 36,
              padding: '14px 18px',
              borderRadius: 14,
              background: '#dcfce7',
              border: '2px solid #16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}>
              <span style={{ fontWeight: 800, color: '#15803d', fontSize: 14 }}>
                <Check size={16} /> {lang === 'bn' ? 'আপনি লেখাটি পড়া শেষ করেছেন।' : 'You have finished reading this piece.'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#166534' }}>
                100%
              </span>
            </div>
          ) : (
            <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => sendProgress(100, true)}
                style={{
                  ...navBtn,
                  background: 'var(--card, var(--card, #fff))',
                  cursor: 'pointer',
                  fontSize: 13,
                  boxShadow: `calc(2px * var(--shk, 1)) calc(2px * var(--shk, 1)) 0 ${INK}`
                }}
              >
                <Check size={15} /> {lang === 'bn' ? 'পঠিত হিসেবে চিহ্নিত করুন' : 'Mark as finished'}
              </button>
            </div>
          )
        )}

        {/* Author card & reader actions */}
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            margin: '40px 0 20px',
            padding: 'clamp(18px, 2.5vw, 24px)',
            border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
            borderRadius: 18,
            background: 'var(--card, #fff)',
            boxShadow: `calc(4px * var(--shk, 1)) calc(4px * var(--shk, 1)) 0 ${INK}`
          }}
        >
          {/* Top row: Author profile snippet & Follow button */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16
            }}
          >
            <a
              href={`${base}/stories/${handle}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 14,
                textDecoration: 'none',
                color: INK
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                  background: authorAvatarUrl
                    ? `url(${authorAvatarUrl}) center/cover`
                    : authorAc,
                  display: 'grid',
                  placeItems: 'center',
                  color: '#fff',
                  fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
                  fontWeight: 800,
                  fontSize: 20,
                  flexShrink: 0,
                  boxShadow: `calc(2px * var(--shk, 1)) calc(2px * var(--shk, 1)) 0 ${INK}`
                }}
              >
                {!authorAvatarUrl && (piece.author || handle || 'A').trim().charAt(0).toUpperCase()}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <strong
                    style={{
                      fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
                      fontSize: 'clamp(17px, 1.4vw, 20px)',
                      lineHeight: 1.2
                    }}
                  >
                    {piece.author}
                  </strong>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: 'var(--ink-bg, #151515)',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 800
                    }}
                  >
                    {lang === 'bn' ? 'লেখক' : 'Author'}
                  </span>
                </div>
                <span style={{ fontSize: 13, color: 'var(--muted, #6b675e)', fontWeight: 600 }}>
                  @{handle}
                </span>
              </div>
            </a>

            <FollowButton
              type="author"
              targetKey={handle}
              user={user}
              t={t}
              num={num}
              lang={lang}
              base={base}
              hint={false}
              isSelf={myAuthor?.handle === handle}
            />
          </div>

          {/* Divider */}
          <div
            style={{
              height: `calc(1.5px * var(--bwk, 1))`,
              background: 'var(--edge, #151515)',
              opacity: 0.14
            }}
          />

          {/* Bottom row: ShareBar on left, ReportButton cleanly on right */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14
            }}
          >
            <ShareBar url={postUrl} path={`/stories/${handle}/${wkey}`} title={postTitle} t={t} />
            <ReportButton targetType="work" targetId={piece.id} user={user} t={t} base={base} />
          </div>
        </section>

        <CommentsSection workKey={wkey} chapterNum={activeChapter} user={user} lang={lang} base={base} t={t} />

        <footer style={{ marginTop: 44, paddingTop: 22, borderTop: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)` }}>
          <a href={`${base}/stories/${handle}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, color: INK,
            textDecoration: 'none', fontWeight: 800
          }}>
            {piece.author} · {t.authorWorks} <IArrowRight />
          </a>
        </footer>
      </article>
    </div>
  );
}



const navBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px',
  border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, borderRadius: 999, background: 'var(--card, var(--card, #fff))',
  color: INK, textDecoration: 'none', fontWeight: 800, fontSize: 14
};
