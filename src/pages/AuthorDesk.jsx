import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { ACC0, INK, WORK_KINDS } from '../data/content';
import { api } from '../services/api';
import { errorStyle, fieldStyle, inkButton, labelStyle } from '../components/formStyles';
import { IArrowRight, IStar } from '../components/icons';
import { Wallet, BookOpen, BarChart2, User, Plus, Search, Eye, Trash2, Edit3, FileText, ArrowLeft, ArrowRight, X, Check, PenLine, Settings2, Layers, Crop, Share2, MessageSquare, ExternalLink, ArrowUpDown } from 'lucide-react';
import AvatarCropModal from '../components/AvatarCropModal';
import RupokStoriesMark from '../components/RupokStoriesMark';

const WorkEditor = lazy(() => import('../components/Editor/WorkEditor'));

const pairLabel = (pairs, code, fallback) =>
  (Array.isArray(pairs) ? pairs.find(p => Array.isArray(p) && p[0] === code)?.[1] : null) || fallback;

// The text ramp. Three steps off the ink, so every label, note and hint
// recedes by the same amount wherever it appears.
const BODY = 'var(--muted-2, #55524a)';   // paragraph copy
const MUTED = 'var(--muted, #6b675e)';  // labels, captions, metadata
const FAINT = '#8c8577';  // placeholder and empty-state marks

const card = {
  border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
  borderRadius: 20,
  background: 'var(--card, var(--card, #fff))',
  padding: 'clamp(20px, 2.5vw, 32px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  boxShadow: `calc(4px * var(--shk, 1)) calc(4px * var(--shk, 1)) 0 ${INK}`
};

const smallBtn = {
  padding: '8px 14px',
  borderRadius: 10,
  border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
  background: 'var(--card, var(--card, #fff))',
  color: INK,
  font: 'inherit',
  fontWeight: 800,
  fontSize: 13,
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  boxShadow: `calc(2px * var(--shk, 1)) calc(2px * var(--shk, 1)) 0 ${INK}`,
  transition: 'transform 0.15s ease'
};

/**
 * Hover and focus for the desk.
 *
 * The rest of the site lifts a control on hover (Home, Shelf); the desk was
 * inert, which is most of why it felt unlike the other pages. The editor
 * toolbar keeps its own quieter treatment, so it is excluded here.
 */
function DeskStyles() {
  return (
    <style>{`
      .desk button, .desk a { transition: transform .14s ease, box-shadow .14s ease, background .14s ease; }
      .desk button:not(:disabled):not(.we-tool):hover,
      .desk a:not(.we-tool):hover { transform: translate(-1px, -1px); }
      .desk button:not(:disabled):not(.we-tool):active,
      .desk a:not(.we-tool):active { transform: translate(1px, 1px); }
      .desk button:disabled { cursor: not-allowed; }
      .desk :is(button, a, input, select, textarea):focus-visible {
        outline: 3px solid var(--acc, #6f6758);
        outline-offset: 2px;
      }
      .desk-tablist::-webkit-scrollbar { display: none; }
      .desk-tablist { -ms-overflow-style: none; scrollbar-width: none; }
    `}</style>
  );
}

export default function AuthorDesk({ lang, base, t, num, user, author, wkey, onChanged }) {
  if (!user) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(32px, 5vh, 64px) clamp(16px, 2vw, 24px)' }}>
        <div style={card}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontSize: 28, fontWeight: 800 }}>
            {t.deskTitle || 'Author Desk'}
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: BODY }}>{t['acc.signInPrompt'] || t.applyBody}</p>
          <a href={`${base}/account#author`} style={{ ...smallBtn, background: 'var(--ink-bg, #151515)', color: '#fff', alignSelf: 'flex-start' }}>
            {t['acc.nav'] || 'Account'} <IArrowRight />
          </a>
        </div>
      </div>
    );
  }

  if (!author) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(32px, 5vh, 64px) clamp(16px, 2vw, 24px)' }}>
        <div style={card}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontSize: 28, fontWeight: 800 }}>
            {t.deskTitle || 'Author Desk'}
          </h1>
          <p style={{ margin: 0, fontSize: 16, color: BODY }}>{t.applyPending}</p>
          <a href={`${base}/account`} style={{ ...smallBtn, background: 'var(--ink-bg, #151515)', color: '#fff', alignSelf: 'flex-start' }}>
            {t['acc.nav'] || 'Account'} <IArrowRight />
          </a>
        </div>
      </div>
    );
  }

  if (author.status !== 'active') {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 'clamp(32px, 5vh, 64px) clamp(16px, 2vw, 24px)' }}>
        <div style={card}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontSize: 28, fontWeight: 800 }}>
            {t.deskTitle || 'Author Desk'}
          </h1>
          <div style={errorStyle}>
            {t.applySuspended}
            {author.suspend_reason && <div style={{ marginTop: 6, fontWeight: 400 }}>{author.suspend_reason}</div>}
          </div>
        </div>
      </div>
    );
  }

  return wkey
    ? <EditPiece lang={lang} base={base} t={t} num={num} author={author} wkey={wkey} onChanged={onChanged} />
    : <DeskHome lang={lang} base={base} t={t} num={num} author={author} onChanged={onChanged} />;
}

// ── Desk Home: organized with Works, Analytics, and Profile Tabs ─────────────

function DeskHome({ lang, base, t, num, author: initialAuthor, onChanged }) {
  const [author, setAuthor] = useState(initialAuthor);

  useEffect(() => {
    setAuthor(initialAuthor);
  }, [initialAuthor]);

  const reloadAuthor = useCallback(async () => {
    const res = await api.myAuthor();
    if (res.ok && res.data) {
      setAuthor(prev => ({ ...prev, ...res.data }));
    }
  }, []);

  useEffect(() => {
    reloadAuthor();
  }, [reloadAuthor]);

  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const hash = (window.location.hash || '').replace('#', '').toLowerCase();
      if (['works', 'analytics', 'profile'].includes(hash)) return hash;
      const qTab = new URLSearchParams(window.location.search).get('tab');
      if (['works', 'analytics', 'profile'].includes(qTab)) return qTab;
    }
    return 'works';
  };
  const [activeTab, setActiveTabState] = useState(getInitialTab);

  const setActiveTab = useCallback((tabId) => {
    setActiveTabState(tabId);
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      const hash = tabId === 'works' ? '' : `#${tabId}`;
      const url = `${window.location.pathname}${window.location.search}${hash}`;
      window.history.replaceState(null, '', url);
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const hash = (window.location.hash || '').replace('#', '').toLowerCase();
      if (['works', 'analytics', 'profile'].includes(hash)) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const [works, setWorks] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsSort, setAnalyticsSort] = useState('views'); // 'views' | 'shares' | 'comments' | 'readers' | 'newest'
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'draft' | 'taken_down'
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newKind, setNewKind] = useState('story');
  const [newLang, setNewLang] = useState(author.language || lang || 'bn');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const reloadWorks = useCallback(async () => {
    const res = await api.myWorks();
    setWorks(res.ok ? res.data || [] : []);
  }, []);

  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    const res = await api.myAuthorAnalytics();
    if (res.ok) setAnalytics(res.data);
    setLoadingAnalytics(false);
  }, []);

  useEffect(() => {
    reloadWorks();
  }, [reloadWorks]);

  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeTab, loadAnalytics]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setError('');
    const res = await api.createWork({
      title: newTitle.trim(),
      kind: newKind,
      language: newLang
    });
    setCreating(false);

    if (!res.ok) {
      setError(res.error || 'Failed to create work');
      return;
    }

    setShowNewModal(false);
    setNewTitle('');
    window.history.pushState(null, '', `${base}/account/desk/${res.data.key}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const handleDeleteWork = async (workKey, title) => {
    if (!window.confirm((t.deskConfirmDelete || 'Are you sure you want to delete this work?').replace('{title}', title))) {
      return;
    }
    const res = await api.deleteWork(workKey);
    if (res.ok) {
      reloadWorks();
      if (activeTab === 'analytics') loadAnalytics();
    } else {
      alert(res.error || 'Failed to delete work');
    }
  };

  const handleTogglePublish = async (work) => {
    const res = work.is_published
      ? await api.unpublishWork(work.key)
      : await api.publishWork(work.key);
    if (res.ok) {
      reloadWorks();
      if (activeTab === 'analytics') loadAnalytics();
      onChanged?.();
    } else {
      alert(res.error || 'Failed to update publication status');
    }
  };

  // Filtered works
  const filteredWorks = (works || []).filter(w => {
    if (statusFilter === 'published' && (!w.is_published || w.is_taken_down)) return false;
    if (statusFilter === 'draft' && (w.is_published || w.is_taken_down)) return false;
    if (statusFilter === 'taken_down' && !w.is_taken_down) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (w.title || '').toLowerCase().includes(q) || (w.subtitle || '').toLowerCase().includes(q);
    }
    return true;
  });

  const liveCount = (works || []).filter(w => w.is_published && !w.is_taken_down).length;
  const draftCount = (works || []).filter(w => !w.is_published && !w.is_taken_down).length;
  const takenDownCount = (works || []).filter(w => w.is_taken_down).length;

  return (
    <div className="desk" style={{ maxWidth: 1140, margin: '0 auto', padding: 'clamp(24px, 4vh, 48px) clamp(16px, 2vw, 24px) clamp(56px, 8vh, 96px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <DeskStyles />
      {/* Top Header Card */}
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 20,
          background: 'var(--card, var(--card, #fff))',
          border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
          borderRadius: 20,
          padding: '24px 28px',
          boxShadow: `calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 ${INK}`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
              background: (author.avatar || author.avatar_image_id)
                ? `${author.accent_color || '#6f6758'} url(${api.libraryImageUrl(author.avatar || author.avatar_image_id)}) center/cover`
                : (author.accent_color || '#6f6758'),
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: 22,
              boxShadow: `calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 ${INK}`
            }}
          >
            {!(author.avatar || author.avatar_image_id) && (author.pen_name_bn || author.pen_name_en || author.handle || '').charAt(0).toUpperCase()}
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <RupokStoriesMark height={26} color="#9a3412" />
              <h1 style={{ margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 800 }}>
                {t.deskTitle || (lang === 'bn' ? 'লেখক ডেস্ক' : 'Author desk')}
              </h1>
              <span style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--ink-bg, #151515)', color: '#fff', fontSize: 11.5, fontWeight: 800 }}>
                {t['acc.authorBadge'] || (lang === 'bn' ? 'লেখক' : 'Author')}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, fontSize: 13, color: MUTED }}>
              <span>@{author.handle}</span>
              <span>·</span>
              <a href={`${base}/stories/${author.handle}`} style={{ color: INK, fontWeight: 700, textDecoration: 'none' }}>
                {t.deskViewProfile || (lang === 'bn' ? 'আপনার প্রোফাইল দেখুন' : 'View public profile')}
                <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            style={{
              ...smallBtn,
              background: 'var(--ink-bg, #151515)',
              color: '#fff',
              padding: '10px 18px',
              fontSize: 14,
              boxShadow: `calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 var(--acc)`
            }}
          >
            <Plus size={18} />
            {t.deskNew || (lang === 'bn' ? 'নতুন লেখা শুরু করুন' : 'Start a new piece')}
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div
        role="tablist"
        className="desk-tablist"
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
          paddingBottom: 2,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          maxWidth: '100%',
          flexWrap: 'nowrap'
        }}
      >
        {[
          { id: 'works', label: lang === 'bn' ? 'আমার লেখা' : 'My writing', icon: BookOpen, count: works ? works.length : null },
          { id: 'analytics', label: lang === 'bn' ? 'পাঠক-পরিসংখ্যান' : 'Reader statistics', icon: BarChart2 },
          { id: 'profile', label: lang === 'bn' ? 'লেখক প্রোফাইল' : 'Author profile', icon: User }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '10px clamp(12px, 2.5vw, 18px)',
                borderRadius: '12px 12px 0 0',
                border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                borderBottom: active ? '2px solid #fff' : `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                marginBottom: -4,
                background: active ? 'var(--card, var(--card, #fff))' : '#ece7dc',
                color: active ? INK : BODY,
                fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
                fontWeight: active ? 800 : 700,
                fontSize: 'clamp(13px, 1.2vw, 14.5px)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              <span>{tab.label}</span>
              {tab.count !== null && tab.count !== undefined && (
                <span
                  style={{
                    padding: '1px 7px',
                    borderRadius: 999,
                    background: active ? 'var(--ink-bg, #151515)' : '#ded8ca',
                    color: active ? '#fff' : INK,
                    fontSize: 11.5,
                    fontWeight: 800,
                    marginLeft: 2
                  }}
                >
                  {num(tab.count, lang)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      {/* ── WORKS TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'works' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Controls: Search and Status Filters */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 14
            }}
          >
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: lang === 'bn' ? 'সব লেখা' : 'All', count: works ? works.length : 0 },
                { id: 'published', label: t.deskPublishedList || (lang === 'bn' ? 'প্রকাশিত' : 'Published'), count: liveCount },
                { id: 'draft', label: t.deskDrafts || (lang === 'bn' ? 'খসড়া' : 'Drafts'), count: draftCount },
                ...(takenDownCount > 0 ? [{ id: 'taken_down', label: t.deskStateTakenDown || 'Taken down', count: takenDownCount }] : [])
              ].map(f => {
                const on = statusFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setStatusFilter(f.id)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 999,
                      border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                      background: on ? 'var(--ink-bg, #151515)' : 'var(--card, var(--card, #fff))',
                      color: on ? '#fff' : INK,
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <span>{f.label}</span>
                    <span style={{ opacity: 0.85, fontSize: 11.5 }}>({num(f.count, lang)})</span>
                  </button>
                );
              })}
            </div>

            <div style={{ position: 'relative', width: 'min(100%, 280px)' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={lang === 'bn' ? 'শিরোনাম দিয়ে খুঁজুন…' : 'Search by title…'}
                style={{
                  ...fieldStyle,
                  padding: '8px 14px 8px 36px',
                  borderRadius: 999,
                  fontSize: 13.5
                }}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: MUTED }}>
                <Search size={16} />
              </span>
            </div>
          </div>

          {/* Works Grid */}
          {works === null ? (
            <div style={{ padding: 40, textAlign: 'center', color: MUTED }}>
              {lang === 'bn' ? 'আপনার লেখা লোড করা হচ্ছে…' : 'Loading your writing…'}
            </div>
          ) : filteredWorks.length === 0 ? (
            <div
              style={{
                ...card,
                textAlign: 'center',
                padding: '48px 24px',
                alignItems: 'center',
                gap: 14
              }}
            >
              <FileText size={48} strokeWidth={1.5} color={FAINT} />
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                {searchQuery ? (lang === 'bn' ? 'এই শিরোনামে কোনো লেখা নেই' : 'No pieces match that title') : (t.deskNoWorks || 'Nothing here yet. Start something.')}
              </div>
              <p style={{ margin: 0, color: BODY, maxWidth: 440, fontSize: 14.5 }}>
                {lang === 'bn'
                  ? 'প্রথম লেখাটা শুরু করুন — গল্প, ধারাবাহিক বা কবিতা।'
                  : 'Start your first piece — a story, a serial or a poem.'}
              </p>
              <button
                type="button"
                onClick={() => setShowNewModal(true)}
                style={{
                  ...smallBtn,
                  background: 'var(--ink-bg, #151515)',
                  color: '#fff',
                  padding: '10px 20px',
                  fontSize: 14,
                  marginTop: 6
                }}
              >
                <Plus size={17} /> {t.deskNew || (lang === 'bn' ? 'নতুন লেখা শুরু করুন' : 'Start a new piece')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 18 }}>
              {filteredWorks.map(w => {
                const isLive = w.is_published && !w.is_taken_down;
                const isDraft = !w.is_published && !w.is_taken_down;
                const isRemoved = w.is_taken_down;
                const workAc = w.accent_color || '#6f6758';

                return (
                  <div
                    key={w.key}
                    style={{
                      border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                      borderRadius: 16,
                      background: 'var(--card, var(--card, #fff))',
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: 14,
                      boxShadow: `calc(4px * var(--shk, 1)) calc(4px * var(--shk, 1)) 0 ${INK}`,
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <div>
                      {/* Top status bar & kind */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 999,
                            border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`,
                            background: 'var(--paper, var(--paper, #f4f1ea))',
                            fontSize: 12,
                            fontWeight: 800,
                            textTransform: 'uppercase'
                          }}
                        >
                          {pairLabel(t.libraryKinds, w.kind, w.kind)}
                        </span>

                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 999,
                            border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`,
                            fontSize: 12,
                            fontWeight: 800,
                            background: isLive ? '#dcfce7' : isDraft ? '#fef9c3' : '#fee2e2',
                            color: isLive ? '#15803d' : isDraft ? '#854d0e' : '#991b1b'
                          }}
                        >
                          {isLive ? (t.deskStatePublished || 'Published') : isDraft ? (t.deskStateDraft || 'Draft') : (t.deskStateTakenDown || 'Taken down')}
                        </span>
                      </div>

                      {/* Content details with cover */}
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <span
                          style={{
                            flex: 'none',
                            width: 58,
                            aspectRatio: '3/4',
                            borderRadius: 10,
                            border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                            background: w.cover_image_id
                              ? `${workAc} url(${api.libraryImageUrl(w.cover_image_id)}) center/cover`
                              : `linear-gradient(135deg, ${workAc} 0%, ${workAc}cc 100%)`,
                            boxShadow: `calc(2px * var(--shk, 1)) calc(2px * var(--shk, 1)) 0 ${INK}`
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, flex: 1 }}>
                          <strong style={{ fontSize: 16, lineHeight: 1.25, color: INK }}>
                            {w.title}
                          </strong>
                          {w.subtitle && (
                            <span style={{ fontSize: 13, color: BODY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {w.subtitle}
                            </span>
                          )}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', fontSize: 12, color: MUTED, marginTop: 4 }}>
                            <span>{num(w.word_count || 0, lang)} {lang === 'bn' ? 'শব্দ' : 'words'}</span>
                            <span>·</span>
                            <span>{num(w.read_minutes || 0, lang)} {lang === 'bn' ? 'মিনিট' : 'min'}</span>
                            {w.kind === 'series' && w.chapter_count !== undefined && (
                              <>
                                <span>·</span>
                                <span>{num(w.chapter_count || 0, lang)} {lang === 'bn' ? 'অধ্যায়' : 'chapters'}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {isRemoved && w.takedown_reason && (
                        <div style={{ marginTop: 10, padding: 8, borderRadius: 8, background: '#fee2e2', border: '1px solid #ef4444', fontSize: 12, color: '#991b1b', fontWeight: 600 }}>
                          {(t.deskTakedownReason || 'Reason: {reason}').replace('{reason}', w.takedown_reason)}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingTop: 12, borderTop: `1.5px solid #ded8ca` }}>
                      <a
                        href={`${base}/account/desk/${w.key}`}
                        style={{
                          ...smallBtn,
                          background: 'var(--ink-bg, #151515)',
                          color: '#fff',
                          flex: '1 1 auto',
                          justifyContent: 'center'
                        }}
                      >
                        <Edit3 size={14} />
                        {t.deskEdit || 'Edit'}
                      </a>

                      {isLive && (
                        <a
                          href={`${base}/stories/${author.handle}/${w.key}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View live piece on website"
                          style={{ ...smallBtn, padding: '8px 10px' }}
                        >
                          <Eye size={15} />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => handleTogglePublish(w)}
                        title={w.is_published ? (t.deskUnpublish || 'Unpublish') : (t.deskPublish || 'Publish')}
                        style={{
                          ...smallBtn,
                          padding: '8px 12px',
                          background: w.is_published ? 'var(--card, var(--card, #fff))' : '#dcfce7',
                          color: w.is_published ? INK : '#15803d'
                        }}
                      >
                        {w.is_published ? (lang === 'bn' ? 'প্রকাশ প্রত্যাহার করুন' : 'Unpublish') : (lang === 'bn' ? 'প্রকাশ করুন' : 'Publish')}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteWork(w.key, w.title)}
                        title="Delete work"
                        style={{
                          ...smallBtn,
                          padding: '8px 10px',
                          color: '#991b1b',
                          borderColor: '#ef4444'
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {loadingAnalytics || !analytics ? (
            <div style={{ padding: 48, textAlign: 'center', color: MUTED }}>
              {lang === 'bn' ? 'পরিসংখ্যান লোড করা হচ্ছে…' : 'Loading your statistics…'}
            </div>
          ) : (
            <>
              {/* Top Overview Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                  gap: 16
                }}
              >
                {[
                  {
                    title: lang === 'bn' ? 'মোট ভিউ / ভিজিটর' : 'Views & Visitors',
                    value: analytics.totalViews,
                    sub: analytics.views7d > 0
                      ? `+${num(analytics.views7d, lang)} ${lang === 'bn' ? 'গত ৭ দিনে' : 'in last 7 days'}`
                      : (lang === 'bn' ? 'সব লেখা মিলিয়ে' : 'all-time views')
                  },
                  {
                    title: lang === 'bn' ? 'মোট শেয়ার' : 'Total Shares',
                    value: analytics.totalShares || 0,
                    sub: (analytics.shares7d || 0) > 0
                      ? `+${num(analytics.shares7d, lang)} ${lang === 'bn' ? 'গত ৭ দিনে' : 'in last 7 days'}`
                      : (lang === 'bn' ? 'সোশ্যাল ও ডিরেক্ট শেয়ার' : 'social & direct shares')
                  },
                  {
                    title: lang === 'bn' ? 'মন্তব্য' : 'Comments',
                    value: analytics.totalComments || 0,
                    sub: lang === 'bn' ? 'পাঠকদের প্রতিক্রিয়া' : 'reader feedback'
                  },
                  {
                    title: lang === 'bn' ? 'পাঠক' : 'Unique Readers',
                    value: analytics.uniqueReaders || 0,
                    sub: `${num(analytics.totalReads || 0, lang)} ${lang === 'bn' ? 'বার পড়া হয়েছে' : 'total reads'}`
                  },
                  {
                    title: lang === 'bn' ? 'সমাপ্তির হার' : 'Completion Rate',
                    value: `${analytics.uniqueReaders > 0 ? Math.round((analytics.totalCompletions / analytics.uniqueReaders) * 100) : 0}%`,
                    sub: `${num(analytics.totalCompletions || 0, lang)} ${lang === 'bn' ? 'জন শেষ পর্যন্ত পড়েছেন' : 'read to the end'}`
                  },
                  {
                    title: lang === 'bn' ? 'মোট লেখা ও শব্দ' : 'Works & Words',
                    value: analytics.totalWords,
                    sub: `${num(analytics.publishedWorks || 0, lang)} ${lang === 'bn' ? 'প্রকাশিত' : 'published'} · ${num(analytics.draftWorks || 0, lang)} ${lang === 'bn' ? 'খসড়া' : 'drafts'}`
                  }
                ].map((item, idx) => (
                  <div key={idx} style={{ ...card, padding: '18px 20px', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>{item.title}</span>
                    <div style={{ fontFamily: "var(--font-display, 'Sora', sans-serif)", fontSize: 32, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', color: INK }}>
                      {typeof item.value === 'number' ? num(item.value, lang) : item.value}
                    </div>
                    <div style={{ borderTop: `2px solid ${ACC0}`, paddingTop: 9, fontSize: 12.5, color: MUTED, fontWeight: 500 }}>
                      {item.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* Works Performance Breakdown Table */}
              <section style={card}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <h2 style={{ margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontSize: 20, fontWeight: 800 }}>
                        {lang === 'bn' ? 'প্রতিটি লেখার পারফরম্যান্স ও পরিসংখ্যান' : 'Performance for Each Post'}
                      </h2>
                      <p style={{ margin: '4px 0 0', fontSize: 13, color: MUTED }}>
                        {lang === 'bn'
                          ? 'প্রতিটি লেখার মোট ভিউ, শেয়ার, মন্তব্য ও সমাপ্তির বিস্তারিত তথ্য'
                          : 'Visitor views, shares, comments, and reader engagement for each piece'}
                      </p>
                    </div>
                    <span style={{ fontSize: 13, color: MUTED, fontWeight: 700 }}>
                      {num(analytics.works?.length || 0, lang)} {lang === 'bn' ? 'টি লেখা' : 'pieces'}
                    </span>
                  </div>

                  {/* Search and Sort Filter Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', paddingTop: 8 }}>
                    <div style={{ position: 'relative', width: 'clamp(200px, 40vw, 320px)' }}>
                      <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: MUTED }} />
                      <input
                        type="text"
                        placeholder={lang === 'bn' ? 'লেখার শিরোনাম দিয়ে খুঁজুন…' : 'Filter by title…'}
                        value={analyticsSearch}
                        onChange={e => setAnalyticsSearch(e.target.value)}
                        style={{
                          ...fieldStyle,
                          paddingLeft: 36,
                          paddingTop: 8,
                          paddingBottom: 8,
                          fontSize: 13
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: MUTED, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ArrowUpDown size={14} />
                        {lang === 'bn' ? 'সাজান:' : 'Sort by:'}
                      </span>
                      {[
                        { id: 'views', label: lang === 'bn' ? 'ভিউ' : 'Views' },
                        { id: 'shares', label: lang === 'bn' ? 'শেয়ার' : 'Shares' },
                        { id: 'comments', label: lang === 'bn' ? 'মন্তব্য' : 'Comments' },
                        { id: 'readers', label: lang === 'bn' ? 'পাঠক' : 'Readers' },
                        { id: 'newest', label: lang === 'bn' ? 'নতুন' : 'Newest' }
                      ].map(s => {
                        const active = analyticsSort === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setAnalyticsSort(s.id)}
                            style={{
                              padding: '5px 11px',
                              borderRadius: 8,
                              border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`,
                              background: active ? 'var(--ink-bg, #151515)' : 'var(--paper, #f4f1ea)',
                              color: active ? '#fff' : INK,
                              fontWeight: active ? 800 : 600,
                              fontSize: 12.5,
                              cursor: 'pointer'
                            }}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ overflowX: 'auto', margin: '0 -10px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
                    <thead>
                      <tr style={{ borderBottom: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, color: MUTED, fontSize: 12.5 }}>
                        <th style={{ padding: '12px 14px' }}>{lang === 'bn' ? 'শিরোনাম ও ধরন' : 'Title and form'}</th>
                        <th style={{ padding: '12px 14px' }}>{lang === 'bn' ? 'অবস্থা' : 'Status'}</th>
                        <th style={{ padding: '12px 14px' }}>{lang === 'bn' ? 'ভিউ / ভিজিটর' : 'Views'}</th>
                        <th style={{ padding: '12px 14px' }}>{lang === 'bn' ? 'শেয়ার' : 'Shares'}</th>
                        <th style={{ padding: '12px 14px' }}>{lang === 'bn' ? 'মন্তব্য' : 'Comments'}</th>
                        <th style={{ padding: '12px 14px' }}>{lang === 'bn' ? 'পাঠক' : 'Readers'}</th>
                        <th style={{ padding: '12px 14px' }}>{lang === 'bn' ? 'সমাপ্তি' : 'Finished'}</th>
                        <th style={{ padding: '12px 14px' }}>{lang === 'bn' ? 'শব্দসংখ্যা' : 'Words'}</th>
                        <th style={{ padding: '12px 14px', textAlign: 'right' }}>{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const list = (analytics.works || []).filter(w => {
                          if (!analyticsSearch.trim()) return true;
                          return (w.title || '').toLowerCase().includes(analyticsSearch.trim().toLowerCase());
                        });

                        list.sort((a, b) => {
                          if (analyticsSort === 'views') return (b.view_count || 0) - (a.view_count || 0);
                          if (analyticsSort === 'shares') return (b.share_count || 0) - (a.share_count || 0);
                          if (analyticsSort === 'comments') return (b.comments_count || 0) - (a.comments_count || 0);
                          if (analyticsSort === 'readers') return (b.readers_count || 0) - (a.readers_count || 0);
                          if (analyticsSort === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                          return 0;
                        });

                        if (list.length === 0) {
                          return (
                            <tr>
                              <td colSpan={9} style={{ padding: 32, textAlign: 'center', color: MUTED }}>
                                {lang === 'bn' ? 'কোনো লেখা পাওয়া যায়নি' : 'No pieces match your search.'}
                              </td>
                            </tr>
                          );
                        }

                        return list.map(w => {
                          const isLive = w.is_published && !w.is_taken_down;
                          const isDraft = !w.is_published && !w.is_taken_down;
                          const completionRate = w.completion_rate !== undefined ? w.completion_rate : (w.readers_count > 0 ? Math.round((w.completions_count / w.readers_count) * 100) : 0);

                          return (
                            <tr
                              key={w.id}
                              style={{
                                borderBottom: '1px solid #e5e0d3',
                                transition: 'background 0.15s ease'
                              }}
                            >
                              <td style={{ padding: '14px' }}>
                                <div style={{ fontWeight: 800, color: INK }}>{w.title}</div>
                                <div style={{ fontSize: 12, color: MUTED, textTransform: 'capitalize' }}>
                                  {pairLabel(t.libraryKinds, w.kind, w.kind)}
                                </div>
                              </td>
                              <td style={{ padding: '14px' }}>
                                <span
                                  style={{
                                    padding: '3px 8px',
                                    borderRadius: 999,
                                    fontSize: 11.5,
                                    fontWeight: 800,
                                    border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`,
                                    background: isLive ? '#dcfce7' : isDraft ? '#fef9c3' : '#fee2e2',
                                    color: isLive ? '#15803d' : isDraft ? '#854d0e' : '#991b1b'
                                  }}
                                >
                                  {isLive ? (t.deskStatePublished || 'Published') : isDraft ? (t.deskStateDraft || 'Draft') : (t.deskStateTakenDown || 'Taken down')}
                                </span>
                              </td>
                              <td style={{ padding: '14px' }}>
                                <div style={{ fontWeight: 800, color: INK }}>{num(w.view_count || 0, lang)}</div>
                                {w.views_7d > 0 && (
                                  <span style={{ fontSize: 11, color: '#15803d', fontWeight: 700 }}>
                                    +{num(w.views_7d, lang)} 7d
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '14px', fontWeight: 700, color: INK }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <Share2 size={13} style={{ color: MUTED }} />
                                  <span>{num(w.share_count || 0, lang)}</span>
                                </div>
                              </td>
                              <td style={{ padding: '14px', fontWeight: 700, color: INK }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <MessageSquare size={13} style={{ color: MUTED }} />
                                  <span>{num(w.comments_count || 0, lang)}</span>
                                </div>
                              </td>
                              <td style={{ padding: '14px', fontWeight: 700 }}>
                                {num(w.readers_count || 0, lang)}
                              </td>
                              <td style={{ padding: '14px' }}>
                                <div style={{ fontWeight: 700 }}>{completionRate}%</div>
                                <div style={{ fontSize: 11, color: MUTED }}>{num(w.completions_count || 0, lang)} {lang === 'bn' ? 'শেষ করেছেন' : 'finished'}</div>
                              </td>
                              <td style={{ padding: '14px', fontWeight: 600 }}>
                                {num(w.word_count || 0, lang)}
                              </td>
                              <td style={{ padding: '14px', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                  {isLive && (
                                    <a
                                      href={`${base}/stories/${author.handle}/${w.key}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        ...smallBtn,
                                        padding: '5px 8px',
                                        fontSize: 12
                                      }}
                                      title={lang === 'bn' ? 'সাইটে দেখুন' : 'View on site'}
                                    >
                                      <ExternalLink size={13} />
                                    </a>
                                  )}
                                  <a
                                    href={`${base}/account/desk/${w.key}`}
                                    style={{
                                      ...smallBtn,
                                      padding: '5px 12px',
                                      fontSize: 12.5
                                    }}
                                  >
                                    {t.deskEdit || 'Edit'}
                                  </a>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>
      )}
      {activeTab === 'profile' && (
        <ProfileForm lang={lang} t={t} author={author} onSaved={() => { reloadAuthor(); onChanged?.(); }} />
      )}

      {/* ── NEW WORK MODAL ─────────────────────────────────────────────────── */}
      {showNewModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(21,21,21,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => !creating && setShowNewModal(false)}
        >
          <div
            style={{
              ...card,
              width: '100%',
              maxWidth: 500,
              boxShadow: `calc(8px * var(--shk, 1)) calc(8px * var(--shk, 1)) 0 ${INK}`
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontSize: 22, fontWeight: 800 }}>
                {t.deskNew || (lang === 'bn' ? 'নতুন লেখা শুরু করুন' : 'Start a new piece')}
              </h2>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                disabled={creating}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: 22,
                  cursor: 'pointer',
                  fontWeight: 800,
                  color: INK
                }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label style={labelStyle}>
                {t.deskTitleField || (lang === 'bn' ? 'শিরোনাম' : 'Title')} *
                <input
                  type="text"
                  required
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder={lang === 'bn' ? 'লেখার শিরোনাম…' : 'Title of the piece…'}
                  style={fieldStyle}
                />
              </label>

              <label style={labelStyle}>
                {lang === 'bn' ? 'রচনার ধরন' : 'Form of writing'}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 4 }}>
                  {WORK_KINDS.map(k => {
                    const selected = newKind === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setNewKind(k)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: 12,
                          border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                          background: selected ? 'var(--ink-bg, #151515)' : 'var(--card-2, #fdfbf7)',
                          color: selected ? '#fff' : INK,
                          fontWeight: 800,
                          fontSize: 13,
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <span>{pairLabel(t.libraryKinds, k, k)}</span>
                      </button>
                    );
                  })}
                </div>
              </label>

              <label style={labelStyle}>
                {t.deskLanguage || (lang === 'bn' ? 'ভাষা' : 'Language')}
                <select
                  value={newLang}
                  onChange={e => setNewLang(e.target.value)}
                  style={fieldStyle}
                >
                  <option value="bn">বাংলা (Bengali)</option>
                  <option value="en">English</option>
                </select>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  disabled={creating}
                  style={smallBtn}
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  style={{
                    ...smallBtn,
                    background: 'var(--ink-bg, #151515)',
                    color: '#fff',
                    opacity: creating || !newTitle.trim() ? 0.6 : 1,
                    boxShadow: `calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 var(--acc)`
                  }}
                >
                  {creating ? (lang === 'bn' ? 'তৈরি হচ্ছে…' : 'Creating…') : (lang === 'bn' ? 'লেখা শুরু করুন' : 'Start writing')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Edit Piece (Editor + Metadata + Chapters) ────────────────────────────────

function EditPiece({ lang, base, t, num, author, wkey, onChanged }) {
  const [piece, setPiece] = useState(undefined);
  const [body, setBody] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState('');
  const [error, setError] = useState('');
  const [chapter, setChapter] = useState(null);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [activeEditTab, setActiveEditTab] = useState('prose'); // 'prose' | 'metadata' | 'chapters'
  const coverRef = useRef(null);

  const load = useCallback(async () => {
    const res = await api.myWork(wkey);
    if (!res.ok) { setPiece(null); return; }
    setPiece(res.data);
    if (res.data.kind !== 'series') setBody(res.data.body_json || null);
  }, [wkey]);

  useEffect(() => { load(); }, [load]);

  // The work payload lists chapters without their bodies, so the chapter being
  // opened is fetched on its own — otherwise the editor would start empty and
  // autosave would overwrite the chapter with a blank document. Loaded once per
  // chapter: a save reloads the work, and that must not reset what is on screen.
  const loadedChapter = useRef(null);
  useEffect(() => {
    if (!piece || piece.kind !== 'series' || chapter === null) return undefined;
    if (!(piece.chapters || []).some(c => c.chapter_num === chapter)) return undefined;
    const stamp = `${wkey}:${chapter}`;
    if (loadedChapter.current === stamp) return undefined;
    loadedChapter.current = stamp;

    let live = true;
    setBody(null);
    api.myChapter(wkey, chapter).then(res => {
      if (!live) return;
      if (!res.ok) { loadedChapter.current = null; return; }
      setBody(res.data?.body_json || { type: 'doc', content: [{ type: 'paragraph' }] });
    });
    return () => { live = false; };
  }, [piece, chapter, wkey]);

  // Debounced autosave
  const timer = useRef(null);
  const lastSent = useRef('');
  useEffect(() => {
    if (!dirty || !body || !piece) return undefined;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const payload = JSON.stringify(body);
      if (payload === lastSent.current) return;
      lastSent.current = payload;
      setSaveState('saving');
      const res = piece.kind === 'series' && chapter !== null
        ? await api.saveChapterBody(wkey, chapter, body)
        : await api.saveWorkBody(wkey, body);
      setSaveState(res.ok ? 'saved' : 'error');
      if (!res.ok) setError(res.error);
      else { setDirty(false); setError(''); }
    }, 4000);
    return () => clearTimeout(timer.current);
  }, [body, dirty, piece, chapter, wkey]);

  const saveNow = async () => {
    clearTimeout(timer.current);
    if (!body) return;
    setSaveState('saving');
    const res = piece.kind === 'series' && chapter !== null
      ? await api.saveChapterBody(wkey, chapter, body)
      : await api.saveWorkBody(wkey, body);
    lastSent.current = JSON.stringify(body);
    setSaveState(res.ok ? 'saved' : 'error');
    if (res.ok) { setDirty(false); setError(''); await load(); } else setError(res.error);
  };

  /** Leaving a chapter saves it first, so switching never drops a paragraph. */
  const switchChapter = async n => {
    if (n === chapter) return;
    if (dirty) await saveNow();
    setDirty(false);
    setSaveState('');
    setChapter(n);
  };

  const saveMeta = async patch => {
    const res = await api.updateWork(wkey, patch);
    if (!res.ok) { setError(res.error); return; }
    setError('');
    await load();
  };

  const togglePublish = async () => {
    if (dirty) await saveNow();
    const res = piece.is_published ? await api.unpublishWork(wkey) : await api.publishWork(wkey);
    if (!res.ok) { setError(res.error); return; }
    setError('');
    await load();
    onChanged?.();
  };

  const remove = async () => {
    if (!window.confirm(t.deskConfirmDelete || 'Are you sure you want to delete this piece?')) return;
    const res = await api.deleteWork(wkey);
    if (!res.ok) { setError(res.error); return; }
    window.history.pushState(null, '', `${base}/account/desk`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const uploadCover = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setSaveState('saving');
    const res = await api.uploadLibraryImage(file, { purpose: 'cover', workKey: wkey });
    if (!res.ok) { setError(res.error); setSaveState('error'); return; }
    await saveMeta({ cover_image_id: res.data.id });
    setSaveState('saved');
  };

  const handleAddChapterSubmit = async (e) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;
    const res = await api.createChapter(wkey, { title: newChapterTitle.trim() });
    if (!res.ok) { setError(res.error); return; }
    setShowAddChapter(false);
    setNewChapterTitle('');
    loadedChapter.current = null;
    await load();
    setChapter(res.data.chapter_num);
    setActiveEditTab('prose');
  };

  const toggleChapterPublish = async (n, published) => {
    const res = await api.publishChapter(wkey, n, published);
    if (!res.ok) { setError(res.error); return; }
    await load();
  };

  const removeChapter = async n => {
    if (!window.confirm(t.deskConfirmDelete || 'Delete this chapter?')) return;
    await api.deleteChapter(wkey, n);
    loadedChapter.current = null;
    if (chapter === n) { setChapter(null); setBody(null); setDirty(false); }
    await load();
  };

  if (piece === undefined) {
    return <div style={{ maxWidth: 1000, margin: '0 auto', padding: 48, textAlign: 'center', color: MUTED }}>…</div>;
  }
  if (piece === null) {
    return (
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 48 }}>
        <div style={errorStyle}>{t.workNotFound || 'Work not found'}</div>
      </div>
    );
  }

  const isLive = piece.is_published && !piece.is_taken_down;
  // Everything the author has written, drafts included.
  const deskWordCount = piece.kind === 'series'
    ? (piece.chapters || []).reduce((n, c) => n + (c.word_count || 0), 0)
    : (piece.word_count || 0);

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: 'clamp(20px, 3.4vh, 44px) clamp(16px, 2vw, 24px) clamp(48px, 8vh, 90px)', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          background: 'var(--card, var(--card, #fff))',
          border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
          borderRadius: 16,
          padding: '14px 20px',
          boxShadow: `calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 ${INK}`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href={`${base}/account/desk`} style={smallBtn}>
            <ArrowLeft size={16} /> {t.deskBack || 'Back'}
          </a>
          <div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontSize: 18, fontWeight: 800 }}>
              {piece.title}
            </h1>
            <span style={{ fontSize: 12, color: MUTED }}>
              {/* A serial's stored total counts published chapters only — that is the
                  right number for readers, but an author drafting one would see 0. */}
              {pairLabel(t.libraryKinds, piece.kind, piece.kind)} · {num(deskWordCount, lang)} {lang === 'bn' ? 'শব্দ' : 'words'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: saveState === 'error' ? '#991b1b' : MUTED }}>
            {saveState === 'saving'
              ? (t.deskSaving || 'Saving…')
              : dirty
                ? (t.deskUnsaved || 'Unsaved')
                : saveState === 'saved'
                  ? <><Check size={13} /> {t.deskSaved || 'Saved'}</>
                  : ''}
          </span>

          <button type="button" onClick={saveNow} style={smallBtn}>
            {t.deskSaveNow || 'Save Now'}
          </button>

          <button
            type="button"
            onClick={togglePublish}
            style={{
              ...smallBtn,
              background: isLive ? 'var(--card, var(--card, #fff))' : 'var(--ink-bg, #151515)',
              color: isLive ? INK : '#fff',
              boxShadow: `calc(2px * var(--shk, 1)) calc(2px * var(--shk, 1)) 0 var(--acc)`
            }}
          >
            {piece.is_published ? (t.deskUnpublish || 'Unpublish') : (t.deskPublish || 'Publish')}
          </button>

          {isLive && (
            <a
              href={`${base}/stories/${author.handle}/${piece.key}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...smallBtn, background: 'var(--paper, var(--paper, #f4f1ea))' }}
            >
              <Eye size={15} /> {t.readWriting || 'View Live'}
            </a>
          )}
        </div>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      {/* Editor Section Tabs */}
      <div
        className="desk-tablist"
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          maxWidth: '100%',
          flexWrap: 'nowrap'
        }}
        role="tablist"
      >
        {[
          { id: 'prose', icon: PenLine, label: lang === 'bn' ? 'লেখা' : 'Writing' },
          { id: 'metadata', icon: Settings2, label: lang === 'bn' ? 'প্রচ্ছদ ও তথ্য' : 'Cover & details' },
          ...(piece.kind === 'series'
            ? [{ id: 'chapters', icon: Layers, label: lang === 'bn' ? 'অধ্যায়' : 'Chapters', count: (piece.chapters || []).length }]
            : [])
        ].map(tab => {
          const on = activeEditTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActiveEditTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px clamp(12px, 2vw, 18px)',
                borderRadius: '10px 10px 0 0',
                border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                borderBottom: on ? '2px solid #fff' : `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                marginBottom: -2,
                background: on ? 'var(--card, var(--card, #fff))' : '#eae5da',
                color: on ? INK : MUTED,
                fontWeight: on ? 800 : 600,
                fontSize: 'clamp(13px, 1.2vw, 14px)',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                cursor: 'pointer'
              }}
            >
              <Icon size={15} />
              {tab.label}
              {tab.count !== undefined && ' (' + num(tab.count, lang) + ')'}
            </button>
          );
        })}
      </div>

      {/* PROSE TAB */}
      {activeEditTab === 'prose' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {piece.kind === 'series' && (
            <div style={{ ...card, padding: 16, background: 'var(--card-2, #fcfbf8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 14.5 }}>
                  {chapter !== null
                    ? (t.workChapter || 'Chapter {n}').replace('{n}', num(chapter, lang)) + `: ${(piece.chapters || []).find(c => c.chapter_num === chapter)?.title || ''}`
                    : (lang === 'bn' ? 'কোনো অধ্যায় নির্বাচন করা হয়নি' : 'No chapter selected')}
                </strong>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(piece.chapters || []).map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => switchChapter(c.chapter_num)}
                      style={{
                        padding: '5px 12px',
                        borderRadius: 999,
                        border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`,
                        background: chapter === c.chapter_num ? 'var(--ink-bg, #151515)' : 'var(--card, var(--card, #fff))',
                        color: chapter === c.chapter_num ? '#fff' : INK,
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {num(c.chapter_num, lang)}. {c.title}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowAddChapter(true)}
                    style={{ ...smallBtn, padding: '5px 10px', fontSize: 12 }}
                  >
                    + {t.deskNewChapter || 'New Chapter'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {piece.kind === 'series' && chapter !== null && body === null ? (
            // The chapter's prose is still on the way. Mounting the editor now
            // would start it on an empty document and leave it there, since it
            // takes its content once per chapter.
            <div style={{ ...card, color: MUTED, padding: 40, textAlign: 'center' }}>
              {lang === 'bn' ? 'অধ্যায় লোড করা হচ্ছে…' : 'Loading chapter…'}
            </div>
          ) : (piece.kind !== 'series' || chapter !== null) ? (
            <Suspense fallback={<div style={{ ...card, color: MUTED }}>Loading Editor…</div>}>
              <WorkEditor
                key={`${wkey}:${chapter ?? 'main'}`}
                docKey={`${wkey}:${chapter ?? 'main'}`}
                workKey={wkey}
                value={body || { type: 'doc', content: [{ type: 'paragraph' }] }}
                onChange={setBody}
                onDirty={setDirty}
                t={t}
              />
            </Suspense>
          ) : (
            <div style={{ ...card, padding: 40, textAlign: 'center', alignItems: 'center', gap: 12 }}>
              <strong style={{ fontSize: 17 }}>
                {lang === 'bn' ? 'লেখা শুরু করতে একটি অধ্যায় নির্বাচন করুন' : 'Select a chapter to begin writing'}
              </strong>
              <button
                type="button"
                onClick={() => setShowAddChapter(true)}
                style={{ ...smallBtn, background: 'var(--ink-bg, #151515)', color: '#fff', marginTop: 8 }}
              >
                + {t.deskNewChapter || 'Add Chapter'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* METADATA TAB */}
      {activeEditTab === 'metadata' && (
        <section style={card}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontSize: 20, fontWeight: 800 }}>
            {lang === 'bn' ? 'লেখার তথ্য ও প্রচ্ছদ' : 'Details & cover'}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
            <label style={labelStyle}>
              {t.deskTitleField || 'Title'}
              <input
                style={fieldStyle}
                defaultValue={piece.title}
                onBlur={e => {
                  if (e.target.value.trim() && e.target.value !== piece.title) saveMeta({ title: e.target.value.trim() });
                }}
              />
            </label>

            <label style={labelStyle}>
              {t.deskSubtitle || 'Subtitle'}
              <input
                style={fieldStyle}
                defaultValue={piece.subtitle || ''}
                onBlur={e => {
                  if (e.target.value !== (piece.subtitle || '')) saveMeta({ subtitle: e.target.value });
                }}
              />
            </label>

            <label style={labelStyle}>
              {t.deskGenre || 'Genre'}
              <select style={fieldStyle} defaultValue={piece.genre_key || ''} onChange={e => saveMeta({ genre_key: e.target.value })}>
                <option value="">—</option>
                {(Array.isArray(t.libraryGenres) ? t.libraryGenres : []).filter(([c]) => c !== 'all').map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
            </label>

            <label style={labelStyle}>
              {t.deskLanguage || 'Language'}
              <select style={fieldStyle} defaultValue={piece.language} onChange={e => saveMeta({ language: e.target.value })}>
                <option value="bn">বাংলা (Bengali)</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>

          <label style={labelStyle}>
            {t.deskSummary || 'Summary / Synopsis'}
            <textarea
              rows={3}
              style={{ ...fieldStyle, minHeight: 80, padding: 12, resize: 'vertical' }}
              defaultValue={piece.summary || ''}
              onBlur={e => { if (e.target.value !== (piece.summary || '')) saveMeta({ summary: e.target.value }); }}
            />
          </label>

          <label style={labelStyle}>
            {t.deskTags || 'Tags (comma separated)'}
            <input
              style={fieldStyle}
              defaultValue={(piece.tags || []).join(', ')}
              onBlur={e => {
                const tags = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                saveMeta({ tags });
              }}
            />
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', paddingTop: 10, borderTop: `1.5px solid #ded8ca` }}>
            <span style={{
              width: 75, aspectRatio: '3/4', borderRadius: 10, border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, flex: 'none',
              background: piece.cover_image_id
                ? `${piece.accent_color} url(${api.libraryImageUrl(piece.cover_image_id)}) center/cover`
                : piece.accent_color || '#6f6758',
              boxShadow: `calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 ${INK}`
            }} />
            <div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <button type="button" onClick={() => coverRef.current?.click()} style={smallBtn}>
                  {piece.cover_image_id ? (t.deskCoverReplace || 'Change Cover') : (t.deskCoverUpload || 'Upload Cover')}
                </button>
                {piece.cover_image_id && (
                  <button type="button" onClick={() => saveMeta({ cover_image_id: null })} style={{ ...smallBtn, color: '#991b1b' }}>
                    {t.deskCoverRemove || 'Remove'}
                  </button>
                )}
              </div>
              <span style={{ fontSize: 12.5, color: MUTED }}>{t.deskImageHint || 'Recommended: 4:3 or 2:3 ratio image. Max 10MB.'}</span>
            </div>
            <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={uploadCover} />
          </div>

          <div style={{ paddingTop: 16, borderTop: `1.5px solid #ded8ca`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#991b1b', fontWeight: 600 }}>
              {lang === 'bn' ? 'মুছে ফেলার পর লেখাটি আর পুনরুদ্ধার করা যাবে না' : 'Once deleted, this piece cannot be recovered.'}
            </span>
            <button type="button" onClick={remove} style={{ ...smallBtn, borderColor: '#b91c1c', color: '#991b1b' }}>
              <Trash2 size={15} /> {t.deskDelete || 'Delete Work'}
            </button>
          </div>
        </section>
      )}



      {/* CHAPTERS TAB (Series only) */}
      {activeEditTab === 'chapters' && piece.kind === 'series' && (
        <section style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontSize: 20, fontWeight: 800 }}>
              {t.deskChapters || 'Chapters'}
            </h2>
            <button
              type="button"
              onClick={() => setShowAddChapter(true)}
              style={{ ...smallBtn, background: 'var(--ink-bg, #151515)', color: '#fff' }}
            >
              + {t.deskNewChapter || 'New Chapter'}
            </button>
          </div>

          {(piece.chapters || []).length === 0 ? (
            <p style={{ margin: 0, color: BODY }}>{t.deskNoChapters || 'No chapters created yet.'}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {piece.chapters.map(c => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                    padding: '12px 16px',
                    border: `2px solid ${chapter === c.chapter_num ? INK : '#ded8ca'}`,
                    borderRadius: 14,
                    background: chapter === c.chapter_num ? 'var(--paper, var(--paper, #f4f1ea))' : 'var(--card-2, #f9f7f1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <strong style={{ fontSize: 15 }}>
                      {(t.workChapter || 'Chapter {n}').replace('{n}', num(c.chapter_num, lang))}: {c.title}
                    </strong>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, background: c.is_published ? '#dcfce7' : '#fef9c3', fontWeight: 800 }}>
                      {c.is_published ? (t.deskStatePublished || 'Published') : (t.deskStateDraft || 'Draft')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => { switchChapter(c.chapter_num); setActiveEditTab('prose'); }}
                      style={{ ...smallBtn, padding: '6px 12px' }}
                    >
                      {t.deskEdit || 'Write/Edit'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleChapterPublish(c.chapter_num, !c.is_published)}
                      style={{ ...smallBtn, padding: '6px 12px' }}
                    >
                      {c.is_published ? (t.deskUnpublish || 'Unpublish') : (t.deskPublish || 'Publish')}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeChapter(c.chapter_num)}
                      style={{ ...smallBtn, padding: '6px 10px', color: '#991b1b', borderColor: '#ef4444' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ADD CHAPTER MODAL */}
      {showAddChapter && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(21,21,21,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setShowAddChapter(false)}
        >
          <div
            style={{ ...card, width: '100%', maxWidth: 440 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontSize: 20, fontWeight: 800 }}>
                {t.deskNewChapter || 'Add Chapter'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddChapter(false)}
                style={{ border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', fontWeight: 800 }}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddChapterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={labelStyle}>
                {t.deskChapterTitle || 'Chapter Title'}
                <input
                  type="text"
                  required
                  autoFocus
                  value={newChapterTitle}
                  onChange={e => setNewChapterTitle(e.target.value)}
                  placeholder="e.g. The Awakening"
                  style={fieldStyle}
                />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowAddChapter(false)} style={smallBtn}>
                  Cancel
                </button>
                <button type="submit" style={{ ...smallBtn, background: 'var(--ink-bg, #151515)', color: '#fff' }}>
                  Create Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Profile Form ─────────────────────────────────────────────────────────────

function ProfileForm({ lang, t, author, onSaved }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const avatarRef = useRef(null);
  const [avatar, setAvatar] = useState(author.avatar || author.avatar_image_id || null);
  const [pendingFile, setPendingFile] = useState(null);
  const [rawFile, setRawFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [croppingSrc, setCroppingSrc] = useState(null);

  useEffect(() => {
    setAvatar(author.avatar || author.avatar_image_id || null);
  }, [author.avatar, author.avatar_image_id]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (croppingSrc) URL.revokeObjectURL(croppingSrc);
    };
  }, [previewUrl, croppingSrc]);

  useEffect(() => {
    api.myAuthor().then(res => {
      if (res.ok && res.data) {
        if (res.data.avatar || res.data.avatar_image_id) {
          setAvatar(res.data.avatar || res.data.avatar_image_id);
        }
      }
    });
  }, []);

  const handleAvatarSelect = event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setRawFile(file);
    const rawUrl = URL.createObjectURL(file);
    setCroppingSrc(rawUrl);
  };

  const handleCropApply = (croppedFile, croppedPreviewUrl) => {
    setPendingFile(croppedFile);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(croppedPreviewUrl);
    if (croppingSrc) URL.revokeObjectURL(croppingSrc);
    setCroppingSrc(null);
    setSaved(false);
  };

  const handleCropClose = () => {
    if (croppingSrc) URL.revokeObjectURL(croppingSrc);
    setCroppingSrc(null);
  };

  const submit = async e => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError('');

    let newAvatarId = undefined;
    if (pendingFile) {
      const up = await api.uploadLibraryImage(pendingFile, { purpose: 'avatar' });
      if (!up.ok) {
        setBusy(false);
        setError(up.error || 'Failed to upload avatar image');
        setSaved(false);
        return;
      }
      newAvatarId = up.data.id;
    }

    const payload = {
      pen_name_en: f.get('pen_name_en'),
      pen_name_bn: f.get('pen_name_bn'),
      bio_en: f.get('bio_en'),
      bio_bn: f.get('bio_bn'),
      language: f.get('language'),
      website_url: f.get('website_url'),
      social_url: f.get('social_url'),
      accent_color: f.get('accent_color')
    };

    if (newAvatarId !== undefined) {
      payload.avatar_image_id = newAvatarId;
    }

    const res = await api.updateAuthorProfile(payload);
    setBusy(false);
    if (!res.ok) { setError(res.error); setSaved(false); return; }

    if (newAvatarId !== undefined) {
      setAvatar(newAvatarId);
      setPendingFile(null);
      setRawFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }

    setError('');
    setSaved(true);
    onSaved?.();
  };

  return (
    <form onSubmit={submit} style={card}>
      {croppingSrc && (
        <AvatarCropModal
          imageSrc={croppingSrc}
          lang={lang}
          t={t}
          onApply={handleCropApply}
          onClose={handleCropClose}
        />
      )}

      <h2 style={{ margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontSize: 20, fontWeight: 800 }}>
        {t.deskProfile || 'Author Profile'}
      </h2>
      {error && <div style={errorStyle}>{error}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <span style={{
          width: 68, height: 68, borderRadius: '50%', border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, flex: 'none',
          background: previewUrl
            ? `${author.accent_color || '#6f6758'} url(${previewUrl}) center/cover`
            : (avatar
              ? `${author.accent_color || '#6f6758'} url(${api.libraryImageUrl(avatar)}) center/cover`
              : (author.accent_color || '#6f6758')),
          boxShadow: `calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 ${INK}`,
          display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 24
        }}>
          {!previewUrl && !avatar && (author.pen_name_bn || author.pen_name_en || author.handle || '').charAt(0).toUpperCase()}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => avatarRef.current?.click()} style={smallBtn}>
              {previewUrl || avatar
                ? (t.deskCoverReplace || (lang === 'bn' ? 'ছবি পরিবর্তন' : 'Change Avatar'))
                : (t.deskCoverUpload || (lang === 'bn' ? 'ছবি আপলোড' : 'Upload Avatar'))}
            </button>
          </div>
          <div style={{ fontSize: 13, color: MUTED }}>
            @{author.handle}
            {pendingFile && <span style={{ marginLeft: 6, color: '#b45309', fontWeight: 700 }}>({t.deskCoverPending || (lang === 'bn' ? 'সংরক্ষিত নয়' : 'Unsaved')})</span>}
          </div>
        </div>
        <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleAvatarSelect} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14 }}>
        <label style={labelStyle}>{t.applyPenName || 'Pen Name'} (English)
          <input name="pen_name_en" style={fieldStyle} defaultValue={author.pen_name_en || ''} key={`en-${author.pen_name_en || ''}`} />
        </label>
        <label style={labelStyle}>{t.applyPenName || 'কলম নাম'} (বাংলা)
          <input name="pen_name_bn" style={fieldStyle} defaultValue={author.pen_name_bn || ''} key={`bn-${author.pen_name_bn || ''}`} />
        </label>
        <label style={labelStyle}>{t.applyLanguage || 'লেখার প্রধান ভাষা'}
          <select name="language" style={fieldStyle} defaultValue={author.language || 'bn'} key={`lang-${author.language || 'bn'}`}>
            <option value="bn">বাংলা (Bengali)</option>
            <option value="en">English</option>
          </select>
        </label>
        <label style={labelStyle}>{t.deskWebsite || 'Website'}
          <input name="website_url" type="url" placeholder="https://" style={fieldStyle} defaultValue={author.website_url || ''} key={`web-${author.website_url || ''}`} />
        </label>
        <label style={labelStyle}>{t.deskSocial || 'Social Link'}
          <input name="social_url" type="url" placeholder="https://" style={fieldStyle} defaultValue={author.social_url || ''} key={`soc-${author.social_url || ''}`} />
        </label>
      </div>

      <label style={labelStyle}>{t.applyBio || 'Bio'} (English)
        <textarea name="bio_en" rows={3} style={{ ...fieldStyle, minHeight: 90, padding: 12, resize: 'vertical' }} defaultValue={author.bio_en || ''} key={`bio-en-${author.bio_en || ''}`} />
      </label>
      <label style={labelStyle}>{t.applyBio || 'পরিচিতি / বায়ো'} (বাংলা)
        <textarea name="bio_bn" rows={3} style={{ ...fieldStyle, minHeight: 90, padding: 12, resize: 'vertical' }} defaultValue={author.bio_bn || ''} key={`bio-bn-${author.bio_bn || ''}`} />
      </label>

      <label style={{ ...labelStyle, maxWidth: 200 }}>{t.deskAccent || 'Accent Color'}
        <input name="accent_color" type="color" style={{ ...fieldStyle, padding: 4, height: 46 }} defaultValue={author.accent_color || '#6f6758'} key={`ac-${author.accent_color || '#6f6758'}`} />
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button type="submit" disabled={busy} style={{ ...inkButton(author.accent_color || '#6f6758'), opacity: busy ? 0.6 : 1 }}>
          {busy ? (t.deskSaving || (t.deskSaveNow ? `${t.deskSaveNow}…` : 'Saving…')) : (t.deskSaveNow || 'Save Profile')}
        </button>
        {saved && (
          <span style={{ color: '#166534', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Check size={15} /> {t.deskProfileSaved || 'Saved'}
          </span>
        )}
      </div>
    </form>
  );
}
