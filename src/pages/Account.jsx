import React, { useState, useEffect, useMemo, useRef } from 'react';
import AuthForm from '../components/AuthForm';
import PasswordField, { FIELD_STYLE } from '../components/PasswordField';
import { api } from '../services/api';
import { IArrowRight, IPlay, IStar, IDownload, ITrash, ICheck, ISpinner } from '../components/icons';
import ProgressCard from '../components/ProgressCard';
import AuthorPanel from '../components/AuthorPanel';
import BrandLockup, { PlatformArrow } from '../components/BrandLockup';
import { SITE, SITE_URLS, addressOn, isLive } from '../lib/sites';
import { ytThumb, watchedOf, useMyList } from '../lib/originals';
import { ogWords, fill } from '../lib/ogWords';

// The account, on every platform. Each platform's account holds only its own
// things: Stories the writing (reading history, the author desk, its
// purchases and followed authors), Originals the comics and series (what is
// part-watched or part-read, My List, unlocked issues and passes), and the
// main site the account itself — name, language, password and data. A
// platform that is not deployed is the main site's again, as before the split.
//
// One page with a list of sections; the open one is kept in the address
// (#purchases), so it survives a reload and can be linked to. Signed out, the
// same address shows sign in (#signup to join, #forgot for a reset link).
const isMine = platform => (isLive(platform) ? SITE === platform : SITE === 'main');

const readHash = (sub) => {
  try {
    const h = decodeURIComponent(window.location.hash.slice(1));
    if (h) return h;
    const q = new URLSearchParams(window.location.search).get('tab') || new URLSearchParams(window.location.search).get('section');
    if (q) return q;
    if (sub === 'author' || sub === 'apply') return 'author';
    return '';
  } catch { return ''; }
};
const setHash = id => {
  const { pathname, search } = window.location;
  window.history.replaceState(window.history.state, '', `${pathname}${search}${id ? `#${id}` : ''}`);
};
function useHash(sub) {
  const [hash, set] = useState(() => readHash(sub));
  useEffect(() => {
    const on = () => set(readHash(sub));
    window.addEventListener('hashchange', on);
    window.addEventListener('popstate', on);
    return () => {
      window.removeEventListener('hashchange', on);
      window.removeEventListener('popstate', on);
    };
  }, [sub]);
  return [hash, id => { setHash(id); set(id); }];
}

const time = v => (typeof v === 'number' ? v : Date.parse(v) || 0);
const dateOf = (v, lang, opts) => new Date(v).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', opts || { day: 'numeric', month: 'short', year: 'numeric' });

export default function Account({ lang, base, t, num, user, comics = [], series = [], works = [], author, application, libraryHistory, onAuthed, onSignOut, onProfileSaved, onSelectLang, sub }) {
  // /account/reset?token=… — the link from the password-reset email. It works
  // whether or not this browser is signed in, since the token is the proof.
  if (sub === 'reset') return <AuthShell t={t} lang={lang} base={base} mode="reset" onAuthed={onAuthed} sub={sub} />;
  if (!user) return <AuthShell t={t} lang={lang} base={base} onAuthed={onAuthed} sub={sub} />;
  return <Dashboard {...{ lang, base, t, num, user, comics, series, works, author, application, libraryHistory, onSignOut, onProfileSaved, onSelectLang, sub }} />;
}

// ── Signed out: sign in, join, forgot, reset ───────────────────────────────

const PERKS = { main: 'perksMain', stories: 'perksStories', originals: 'perksOriginals' };

function AuthShell({ t, lang, base, mode: fixed, onAuthed, sub }) {
  const a = t.acc;
  const [hash, go] = useHash(sub);
  const isAuthorTarget = hash === 'author' || sub === 'author' || sub === 'apply';
  const mode = fixed || (['signup', 'forgot'].includes(hash) ? hash : 'signin');
  const perks = a[PERKS[SITE]] || a.perksMain || [];
  const title = isAuthorTarget
    ? (lang === 'bn' ? 'লেখক হিসেবে আবেদন' : 'Apply to Become an Author')
    : ({ signin: a.welcomeBack, signup: a.joinTitle, forgot: a.forgotTitle, reset: a.resetTitle }[mode]);
  const body = isAuthorTarget
    ? (lang === 'bn' ? 'রূপক গল্পে লিখতে চান? আপনার লেখক আবেদনপত্র জমা দিতে সাইন-ইন করুন বা একটি নতুন অ্যাকাউন্ট তৈরি করুন। সাইন-ইন সম্পন্ন হলে সরাসরি লেখক আবেদনপত্রটি খুলে যাবে।' : 'Want to publish your writing on Rupok Stories? Sign in or create an account to submit your author application. You will be taken directly to the application form once signed in.')
    : ({ signin: a.signInBody, signup: a.joinBody, forgot: a.forgotBody, reset: a.resetBody }[mode]);

  return (
    <section className="acc acc-auth" data-screen-label={`Account — ${mode}`}>
      <style>{FIELD_STYLE + ACC_STYLE}</style>
      <div className="acc-auth-intro">
        <span className="acc-pill">
          {isAuthorTarget ? (lang === 'bn' ? '✍️ লেখক রেজিস্ট্রেশন' : '✍️ Author Application') : a.kicker}
        </span>
        <h1 className="acc-h1" key={mode}>{title}</h1>
        <p className="acc-lede">{body}</p>
        {(mode === 'signin' || mode === 'signup') && perks.length > 0 && (
          <div className="acc-perks">
            <strong>{a.perksTitle}</strong>
            <ul>
              {perks.map(p => <li key={p}><span className="acc-perk-tick" aria-hidden="true"><ICheck /></span>{p}</li>)}
            </ul>
          </div>
        )}
      </div>
      <div className="acc-card acc-auth-card">
        {mode === 'reset'
          ? <ResetPasswordForm t={t} base={base} onAuthed={onAuthed} />
          : <AuthForm t={t} base={base} onAuthed={onAuthed} mode={mode} onModeChange={m => go(m === 'signin' ? '' : m)} autoFocus heading={false} />}
      </div>
    </section>
  );
}

/** Choose a new password from a reset link; signs the reader in on success. */
function ResetPasswordForm({ t, base, onAuthed }) {
  const a = t.acc;
  const [password, setPassword] = useState('');
  const [state, setState] = useState({ busy: false, error: null });
  const token = (() => {
    try { return new URLSearchParams(window.location.search).get('token') || ''; } catch { return ''; }
  })();

  if (!token) {
    return (
      <div className="af acc-stack">
        <p role="alert" className="af-error">{a.resetInvalid}</p>
        <div className="acc-row">
          <a href={`${base}/account#forgot`} className="acc-btn primary">{a.resetAgain} <IArrowRight /></a>
          <a href={`${base}/account`} className="acc-btn">{a.backToSignIn}</a>
        </div>
      </div>
    );
  }

  const submit = async e => {
    e.preventDefault();
    setState({ busy: true, error: null });
    const r = await api.resetPassword(token, password);
    if (!r.ok) { setState({ busy: false, error: r.error || a.resetInvalid }); return; }
    // Drop the token from the address bar before leaving, so it is not left in history.
    window.history.replaceState(null, '', `${base}/account`);
    await onAuthed?.(r.data.user);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <form onSubmit={submit} className="af acc-stack" aria-label={a.resetTitle}>
      {state.error && (
        <div className="acc-stack">
          <p role="alert" className="af-error">{state.error}</p>
          <a href={`${base}/account#forgot`} className="af-link">{a.resetAgain}</a>
        </div>
      )}
      <PasswordField words={a} label={a.newPw} value={password} onChange={setPassword} autoComplete="new-password" minLength={6} meter autoFocus />
      <button type="submit" className="af-submit" disabled={state.busy || password.length < 6}>
        <span>{a.resetSave}</span>{state.busy ? <ISpinner /> : <IArrowRight />}
      </button>
    </form>
  );
}

// ── Signed in ──────────────────────────────────────────────────────────────

function Dashboard({ lang, base, t, num, user, comics, series, works, author, application, libraryHistory, onSignOut, onProfileSaved, onSelectLang, sub }) {
  const a = t.acc;
  const c = ogWords(t, lang);
  const n = v => (num ? num(v, lang) : v);
  const showStories = isMine('stories');
  const showComics = isMine('originals');
  const showSettings = SITE === 'main';
  const hasReading = showStories || showComics;
  const onOriginals = SITE === 'originals';
  // Following series is My List on Originals; elsewhere it is a plain list
  const followTypes = [...(showStories ? ['author'] : []), ...(showComics && !onOriginals ? ['series'] : [])];

  const [orders, setOrders] = useState(null);
  const [progress, setProgress] = useState(null);
  const [follows, setFollows] = useState(null);
  const myList = useMyList(onOriginals ? user : null);

  useEffect(() => {
    let live = true;
    if (hasReading) {
      // A purchase belongs to the platform of what was bought: a piece of writing to Stories, the rest to Originals
      api.myOrders().then(r => live && setOrders(r.ok ? r.data.filter(o => (o.item_type === 'work' ? showStories : showComics)) : []));
      api.getProgress().then(r => live && setProgress(r.ok ? r.data : []));
    }
    if (followTypes.length) api.myFollows().then(r => live && setFollows(r.ok ? r.data.filter(x => followTypes.includes(x.type)) : []));
    return () => { live = false; };
  }, [user.id, showStories, showComics]);

  // Comics, writing and (on Originals) episodes share one history list, so a
  // reader has a single place to pick up where they left off.
  const reading = useMemo(() => {
    const comicItems = !showComics ? [] : (progress || [])
      .map(p => ({ ...p, comic: comics.find(x => x.k === p.comic_key) }))
      .filter(p => p.comic)
      .map(p => {
        const total = p.total_pages || p.comic.pages || 1;
        const page = Math.min(p.page, total);
        const done = p.page > total;
        return {
          key: `c-${p.comic_key}`, category: 'comic', isComic: true,
          title: p.comic.title, sub: p.comic.issue, cover: p.comic.poster, ac: p.comic.ac, href: p.comic.href,
          pct: done ? 100 : Math.round((page / total) * 100), done, type: a.typeComic,
          meta: done ? a.finished : a.pageOf.replace('{n}', n(page)).replace('{total}', n(total)),
          at: time(p.updated_at)
        };
      });
    const episodeItems = !showComics ? [] : series.map(s => {
      const w = watchedOf(s.k);
      const ep = w && s.eps?.[w.i];
      if (!ep) return null;
      const total = s.eps.length;
      return {
        key: `e-${s.k}`, isLibrary: true,
        title: ep.t, sub: s.title, cover: ytThumb(ep.url), ac: s.ac, href: watchHref(base, s.k, w.i),
        pct: Math.round(((w.i + 1) / total) * 100), done: false, type: fill(c.episode, { n: n(ep.n || w.i + 1) }),
        meta: `${n(w.i + 1)} / ${n(total)}`, at: time(w.at)
      };
    }).filter(Boolean);
    const libraryItems = !showStories ? [] : (libraryHistory || []).map(w => {
      const pct = w.finished ? 100 : Math.max(w.scroll_pct || 0, 1);
      const meta = w.finished
        ? a.finished
        : w.kind === 'series' && w.chapters
          ? (a.chapterOf || '{n}/{total}').replace('{n}', n(w.chapter_num || 1)).replace('{total}', n(w.chapters))
          : (a.percentRead || '{n}%').replace('{n}', n(pct));
      return {
        key: `w-${w.work_key}`, category: 'library', isLibrary: true,
        title: w.title, sub: w.author, cover: w.cover ? api.libraryImageUrl(w.cover) : null, ac: w.ac,
        href: `${base}/stories/${w.author_handle}/${w.work_key}${w.chapter_num ? `?ch=${w.chapter_num}&p=${w.scroll_pct || 0}` : (w.scroll_pct ? `?p=${w.scroll_pct}` : '')}`,
        pct, done: w.finished, type: a.typeWriting, meta, at: time(w.updated_at)
      };
    });
    // Unfinished first, then most recent
    return [...comicItems, ...episodeItems, ...libraryItems]
      .sort((x, y) => (x.done !== y.done ? (x.done ? 1 : -1) : y.at - x.at));
  }, [progress, libraryHistory, comics, series, showComics, showStories, lang, base]);

  const inProgress = reading.filter(x => !x.done);
  const ownedComics = comics.filter(x => x.paid && !x.locked);
  const ownedPasses = series.filter(s => s.paid && !s.locked);
  const unlockedCount = ownedComics.length + ownedPasses.length;

  // The sections this platform's account has, in order
  const sections = [
    { id: 'overview', label: a.secOverview },
    hasReading && { id: 'reading', label: showStories ? a.secReading : a.secWatching, count: inProgress.length },
    onOriginals && { id: 'list', label: c.myList, count: myList.keys.size },
    showComics && { id: 'unlocked', label: a.secUnlocked, count: unlockedCount },
    showStories && { id: 'author', label: a.authorNav },
    showComics && { id: 'purchases', label: a.secPurchases, count: orders?.length || 0, dot: orders?.some(o => o.status === 'pending') },
    followTypes.length > 0 && { id: 'following', label: a.follows, count: follows?.length || 0 },
    showSettings && { id: 'profile', label: a.profile },
    showSettings && { id: 'security', label: a.secSecurity },
    showSettings && { id: 'data', label: a.dataTitle }
  ].filter(Boolean);

  const [hash, setHashState] = useHash(sub);
  const active = sections.some(s => s.id === hash) ? hash : (showStories && (sub === 'author' || sub === 'apply') ? 'author' : 'overview');
  // A sign-in page's #signup, or a section this platform does not have, is dropped
  useEffect(() => { if (hash && active !== hash && !['author', 'apply'].includes(hash)) setHash(''); }, [hash, active]);
  const panelRef = useRef(null);
  const go = id => {
    setHashState(id === 'overview' ? '' : id);
    requestAnimationFrame(() => {
      panelRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  };

  useEffect(() => {
    if (active === 'author') {
      const timer = setTimeout(() => {
        panelRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [active]);

  const first = String(user.name || '').trim().split(/\s+/)[0] || user.email;
  const since = dateOf(user.created_at, lang, { year: 'numeric', month: 'long' });

  const ctx = { a, c, t, lang, base, n, go };

  const panel = {
    overview: <Overview {...ctx} {...{ reading, inProgress, showStories, showComics, showSettings, onOriginals, orders, follows, myList, unlockedCount, author }} />,
    reading: <ReadingSection {...ctx} reading={reading} showComics={showComics} showStories={showStories} />,
    list: <MyListSection {...ctx} series={series} myList={myList} />,
    unlocked: <UnlockedSection {...ctx} passes={ownedPasses} issues={ownedComics} />,
    author: <AuthorPanel base={base} t={t} author={author} application={application} />,
    purchases: <PurchasesSection {...ctx} orders={orders} comics={comics} series={series} works={works} showComics={showComics} />,
    following: <FollowingSection {...ctx} items={follows} types={followTypes} />,
    profile: <ProfileSection {...ctx} user={user} since={since} onSaved={onProfileSaved} onSelectLang={onSelectLang} />,
    security: <SecuritySection {...ctx} />,
    data: <DataSection {...ctx} onSignOut={onSignOut} />
  }[active];

  return (
    <div className="acc" data-screen-label="Account">
      <style>{FIELD_STYLE + ACC_STYLE}</style>

      <header className="acc-id">
        <span className="acc-avatar" aria-hidden="true">{first.charAt(0).toUpperCase()}</span>
        <div className="acc-id-text">
          <span className="acc-kicker">{a.kicker}</span>
          <h1 className="acc-h1 acc-h1-sm">
            {a.hello}, {first}
            {author && showStories && <span className="acc-badge">{a.authorBadge}</span>}
          </h1>
          <span className="acc-meta">{user.email} · {a.memberSince} {since}</span>
        </div>
        <div className="acc-row acc-id-actions">
          {!showSettings && SITE_URLS.main && (
            <a href={addressOn('main', base, '/account#profile')} target="_blank" rel="noopener" className="acc-btn">{a.secSettings} <PlatformArrow /></a>
          )}
          <button type="button" onClick={onSignOut} className="acc-btn">{a.signOut}</button>
        </div>
      </header>

      <div className="acc-body">
        <nav className="acc-nav" aria-label={a.sections}>
          {sections.map(s => (
            <a key={s.id} href={`#${s.id === 'overview' ? '' : s.id}`} className="acc-tab" aria-current={active === s.id ? 'page' : undefined}
              onClick={e => { e.preventDefault(); go(s.id); }}>
              <span>{s.label}</span>
              {s.dot && <span className="acc-dot" aria-hidden="true" />}
              {s.count > 0 && <span className="acc-count">{n(s.count)}</span>}
            </a>
          ))}
        </nav>
        <div className="acc-panel" ref={panelRef} key={active}>{panel}</div>
      </div>
    </div>
  );
}

/** The watch page's address; the same as OriginalsHome's, kept here so the account need not load it. */
const watchHref = (base, seriesKey, index) => `${base}/watch?s=${encodeURIComponent(seriesKey)}&e=${index}`;

function Head({ title, body, children }) {
  return (
    <div className="acc-head">
      <div className="acc-stack-sm">
        <h2 className="acc-h2">{title}</h2>
        {body && <p className="acc-body-text">{body}</p>}
      </div>
      {children && <div className="acc-row">{children}</div>}
    </div>
  );
}

/** A dashed panel for a section with nothing in it yet, with somewhere to go and find something. */
function Empty({ text, children }) {
  return (
    <div className="acc-empty">
      <p>{text}</p>
      {children && <div className="acc-row">{children}</div>}
    </div>
  );
}

const Loading = () => <div className="acc-loading" aria-busy="true"><span /><span /><span /></div>;

function Overview({ a, c, t, lang, base, n, go, reading, inProgress, showStories, showComics, showSettings, onOriginals, orders, follows, myList, unlockedCount, author }) {
  const hasReading = showStories || showComics;
  const stats = [
    hasReading && { id: 'reading', label: a.inProgress, value: inProgress.length },
    hasReading && { id: 'reading', label: a.finished, value: reading.length - inProgress.length },
    onOriginals && { id: 'list', label: c.myList, value: myList.keys.size },
    showComics && { id: 'unlocked', label: a.statUnlocked, value: unlockedCount },
    showStories && { id: 'following', label: a.follows, value: follows?.length || 0 },
    showComics && { id: 'purchases', label: a.statPurchases, value: orders?.length || 0 }
  ].filter(Boolean).slice(0, 4);

  return (
    <div className="acc-stack-lg">
      {hasReading && (
        <div className="acc-stats">
          {stats.map(s => (
            <button key={s.label} type="button" className="acc-stat" onClick={() => go(s.id)}>
              <span className="acc-stat-n">{n(s.value)}</span>
              <span className="acc-stat-l">{s.label}</span>
            </button>
          ))}
        </div>
      )}

      {hasReading && (
        <section className="acc-card">
          <Head title={showComics && !showStories ? c.continueTitle : a.continue}>
            {inProgress.length > 3 && <button type="button" className="af-link" onClick={() => go('reading')}>{a.seeAll}</button>}
          </Head>
          {inProgress.length === 0 ? (
            <Empty text={showStories ? a.nothingRead : a.nothingWatched}>
              {showStories && <a href={`${base}/stories`} className="acc-btn primary">{a.browseStories} <IArrowRight /></a>}
              {showComics && <a href={`${base}/series`} className="acc-btn primary">{a.browseSeries} <IArrowRight /></a>}
              {showComics && <a href={`${base}/comics`} className="acc-btn">{a.browse}</a>}
            </Empty>
          ) : (
            <div className="acc-grid">
              {inProgress.slice(0, 3).map(item => <ProgressCard key={item.key} item={item} resumeLabel={a.resume} />)}
            </div>
          )}
        </section>
      )}

            {showStories && (
        <section className="acc-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Head
            title={author ? (t.deskTitle || (lang === 'bn' ? 'লেখক ডেস্ক' : 'Author Desk')) : (t.applyTitle || (lang === 'bn' ? 'আপনিও কি লেখেন?' : 'Are you a writer?'))}
            body={author ? (t.deskBody || (lang === 'bn' ? 'আপনার লেখার খসড়া, অধ্যায় ও পাঠক পরিসংখ্যান।' : 'Manage your drafts, chapters, and reader stats.')) : (t.applyBody || (lang === 'bn' ? 'রূপক গল্পে প্রকাশ করুন ছোটগল্প, ধারাবাহিক আর কবিতা। পৌঁছে দিন হাজারো পাঠকের কাছে।' : 'Publish short stories, serials, and poetry on Rupok Stories.'))}
          >
            {author ? (
              <a href={`${base}/account/desk`} className="acc-btn primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {t.deskOpen || (lang === 'bn' ? 'ডেস্কে যান' : 'Open Desk')} <IArrowRight />
              </a>
            ) : (
              <button type="button" className="acc-btn primary" onClick={() => go('author')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {t.applySubmit || (lang === 'bn' ? 'প্রকাশের জন্য আবেদন' : 'Apply to publish')} <IArrowRight />
              </button>
            )}
          </Head>
        </section>
      )}

      {showSettings && <PlatformsCard a={a} lang={lang} base={base} />}

      {showSettings && (
        <div className="acc-links">
          {[['profile', a.profile, a.languageBody], ['security', a.secSecurity, a.securityBody], ['data', a.dataTitle, a.dataBody]].map(([id, label, body]) => (
            <button key={id} type="button" className="acc-card acc-link" onClick={() => go(id)}>
              <strong>{label}</strong>
              <span>{body}</span>
              <IArrowRight />
            </button>
          ))}
        </div>
      )}

    </div>
  );
}

function Chips({ value, onChange, options, label }) {
  return (
    <div className="acc-chips" role="group" aria-label={label}>
      {options.map(([id, text, count]) => (
        <button key={id} type="button" aria-pressed={value === id} className="acc-chip" onClick={() => onChange(id)}>
          {text}<span>{count}</span>
        </button>
      ))}
    </div>
  );
}

function ReadingSection({ a, c, base, n, reading, showComics, showStories }) {
  const [filter, setFilter] = useState('all');
  const done = reading.filter(x => x.done).length;
  const shown = reading.filter(x => (filter === 'all' ? true : filter === 'done' ? x.done : !x.done));
  return (
    <section className="acc-card">
      <Head title={showStories ? a.secReading : a.secWatching}>
        {reading.length > 0 && (
          <Chips label={a.secReading} value={filter} onChange={setFilter} options={[
            ['all', a.all, n(reading.length)], ['progress', a.inProgress, n(reading.length - done)], ['done', a.finished, n(done)]
          ]} />
        )}
      </Head>
      {reading.length === 0 ? (
        <Empty text={showStories ? a.nothingRead : a.nothingWatched}>
          {showStories && <a href={`${base}/stories`} className="acc-btn primary">{a.browseStories} <IArrowRight /></a>}
          {showComics && <a href={`${base}/series`} className="acc-btn primary">{a.browseSeries} <IArrowRight /></a>}
        </Empty>
      ) : shown.length === 0 ? (
        <Empty text={c.noMatch} />
      ) : (
        <div className="acc-grid">
          {shown.map(item => <ProgressCard key={item.key} item={item} resumeLabel={a.resume} />)}
        </div>
      )}
    </section>
  );
}

function MyListSection({ a, c, base, series, myList }) {
  // Removed titles stay in place, dimmed, until the reader leaves, so Undo is right there
  const [removed, setRemoved] = useState([]);
  const items = series.filter(s => myList.has(s.k) || removed.includes(s.k));
  const toggle = async (key, isRemoving) => {
    setRemoved(list => (isRemoving ? [...list, key] : list.filter(k => k !== key)));
    const ok = await myList.toggle(key);
    if (!ok) setRemoved(list => (isRemoving ? list.filter(k => k !== key) : [...list, key]));
  };
  return (
    <section className="acc-card">
      <Head title={c.myList} body={c.myListBody} />
      {!myList.loaded ? <Loading /> : items.length === 0 ? (
        <Empty text={a.noFollows}>
          <a href={`${base}/series`} className="acc-btn primary">{a.browseSeries} <IArrowRight /></a>
        </Empty>
      ) : (
        <div className="acc-posters">
          {items.map(s => {
            const gone = !myList.has(s.k);
            return (
              <div key={s.k} className={`acc-poster${gone ? ' is-removed' : ''}`}>
                <a href={s.href} className="acc-poster-art" style={{ background: `${s.ac || '#222'} url(${s.poster}) center/cover` }} aria-label={s.title} />
                <strong className="acc-poster-t">{s.title}</strong>
                <div className="acc-row acc-row-sm">
                  {gone ? (
                    <>
                      <span className="acc-muted" role="status">{a.removed}</span>
                      <button type="button" className="af-link" onClick={() => toggle(s.k, false)}>{a.undo}</button>
                    </>
                  ) : (
                    <>
                      {s.eps?.length > 0 && <a href={watchHref(base, s.k, 0)} className="acc-btn sm primary"><IPlay /> {a.watch}</a>}
                      <button type="button" className="acc-btn sm" onClick={() => toggle(s.k, true)}>{a.remove}</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function UnlockedSection({ a, t, base, n, passes, issues }) {
  const owned = [
    ...passes.map(s => ({ key: `s-${s.k}`, title: s.title, cover: s.poster, ac: s.ac, badge: a.pass, meta: `${n(s.epCount || s.eps?.length || 0)} ${t.eps || ''}`.trim(), href: s.href, action: <><IPlay /> {a.watch}</> })),
    ...issues.map(x => ({ key: `c-${x.k}`, title: x.title, cover: x.poster, ac: x.ac, badge: x.issue, meta: t.premium, href: x.href, action: <>{a.read} <IArrowRight /></> }))
  ];
  return (
    <section className="acc-card">
      <Head title={a.secUnlocked} body={a.unlockedBody} />
      {owned.length === 0 ? (
        <Empty text={a.noUnlocked}>
          <a href={`${base}/comics`} className="acc-btn primary">{a.browse} <IArrowRight /></a>
          <a href={`${base}/series`} className="acc-btn">{a.browseSeries}</a>
        </Empty>
      ) : (
        <div className="acc-grid">
          {owned.map(x => (
            <a key={x.key} href={x.href} className="acc-owned">
              <span className="acc-owned-art" style={{ background: `${x.ac || '#222'} url(${x.cover}) center/cover` }} />
              <span className="acc-stack-sm" style={{ minWidth: 0, flex: 1 }}>
                <span className="acc-gold"><IStar /> {x.badge}</span>
                <strong className="acc-clip">{x.title}</strong>
                <span className="acc-muted">{x.meta}</span>
              </span>
              <span className="acc-btn sm primary">{x.action}</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

const STATUS_TONE = { completed: '#16a34a', pending: '#ca8a04', refunded: '#0284c7', failed: '#dc2626', rejected: '#dc2626' };

function PurchasesSection({ a, t, lang, base, n, orders, comics, series, works, showComics }) {
  const list = (orders || []).slice().sort((x, y) => (
    (x.status === 'pending') !== (y.status === 'pending') ? (x.status === 'pending' ? -1 : 1) : time(y.created_at) - time(x.created_at)
  ));
  const describe = o => {
    if (o.item_type === 'work') {
      const w = works.find(x => x.k === o.item_key);
      return { label: w?.title || o.item_key, sub: w?.author, cover: w?.cover, ac: w?.ac };
    }
    if (o.item_type === 'series_pass') {
      const s = series.find(x => x.k === o.item_key);
      return { label: s?.title || o.item_key, sub: a.pass, cover: s?.poster, ac: s?.ac };
    }
    const comic = comics.find(x => x.k === o.item_key);
    return { label: comic?.title || o.item_key, sub: comic?.issue, cover: comic?.poster, ac: comic?.ac };
  };
  return (
    <section className="acc-card">
      <Head title={a.orders} body={list.some(o => o.status === 'pending') ? a.pendingNote : null} />
      {orders === null ? <Loading /> : list.length === 0 ? (
        <Empty text={a.noOrders}>
          <a href={showComics ? `${base}/comics` : `${base}/stories`} className="acc-btn primary">{showComics ? a.browse : a.browseStories} <IArrowRight /></a>
        </Empty>
      ) : (
        <ul className="acc-orders">
          {list.map(o => {
            const d = describe(o);
            const tone = STATUS_TONE[o.status] || '#78716c';
            const statusLabel = (t.orderStatus || []).find(([k]) => k === o.status)?.[1] || o.status;
            return (
              <li key={o.order_id} data-testid="order-row" className={`acc-order${o.status === 'pending' ? ' is-pending' : ''}`}>
                <span className="acc-order-art" style={{ background: d.cover ? `${d.ac || '#222'} url(${d.cover}) center/cover` : (d.ac || 'var(--card-2)') }} />
                <div className="acc-order-main">
                  <strong className="acc-clip">{d.label}</strong>
                  {d.sub && <span className="acc-muted">{d.sub}</span>}
                  <span className="acc-order-meta">
                    {dateOf(o.created_at, lang)} · {a.paidWith} {o.gateway} · {a.orderId} <code>{o.order_id}</code>
                  </span>
                  {o.status === 'rejected' && o.reject_reason && <span className="acc-order-reject">{a.rejectReason}: {o.reject_reason}</span>}
                </div>
                <div className="acc-order-side">
                  <span className="acc-amount">{o.amount}</span>
                  <span className="acc-status" style={{ '--tone': tone }}>{statusLabel}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function FollowingSection({ a, t, lang, base, items: loaded, types }) {
  const [gone, setGone] = useState([]);
  const items = loaded || [];
  const id = x => `${x.type}:${x.key}`;
  const keyOf = x => (x.type === 'author' ? x.handle : x.key);
  const unfollow = async x => {
    setGone(g => [...g, id(x)]);
    const r = await api.unfollow(x.type, keyOf(x));
    if (!r.ok) setGone(g => g.filter(k => k !== id(x)));
  };
  const refollow = async x => {
    setGone(g => g.filter(k => k !== id(x)));
    const r = await api.follow(x.type, keyOf(x));
    if (!r.ok) setGone(g => [...g, id(x)]);
  };
  return (
    <section className="acc-card">
      <Head title={a.follows} />
      {loaded === null ? <Loading /> : items.length === 0 ? (
        <Empty text={a.noFollows}>
          {types.includes('author') && <a href={`${base}/authors`} className="acc-btn primary">{a.browseAuthors} <IArrowRight /></a>}
          {types.includes('series') && <a href={`${base}/series`} className="acc-btn">{a.browseSeries}</a>}
        </Empty>
      ) : (
        <ul className="acc-follows">
          {items.map(x => {
            const title = lang === 'bn' ? x.title_bn || x.title_en : x.title_en || x.title_bn;
            const off = gone.includes(id(x));
            return (
              <li key={id(x)} className={off ? 'is-removed' : undefined}>
                <span className="acc-initial" aria-hidden="true">{String(title || '?').charAt(0)}</span>
                <a href={`${base}${x.url}`} className="acc-follow-name">{title}</a>
                {off ? (
                  <span className="acc-row acc-row-sm">
                    <span className="acc-muted" role="status">{a.removed}</span>
                    <button type="button" className="af-link" onClick={() => refollow(x)}>{a.undo}</button>
                  </span>
                ) : (
                  <button type="button" className="acc-btn sm acc-following" onClick={() => unfollow(x)} aria-label={`${a.remove}: ${title}`}>
                    <span className="acc-following-on"><ICheck /> {t.following}</span>
                    <span className="acc-following-off">{a.remove}</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** On the main site: where the rest of the account lives, one card per platform. */
function PlatformsCard({ a, lang, base }) {
  const live = ['stories', 'originals'].filter(p => SITE_URLS[p]);
  if (!live.length) return null;
  const about = { stories: a.aboutStories, originals: a.aboutOriginals };
  return (
    <section className="acc-card">
      <Head title={a.secPlatforms} body={a.platformsBody} />
      <div className="acc-platforms">
        {live.map(p => (
          <a key={p} href={addressOn(p, base, '/account')} target="_blank" rel="noopener" className={`acc-platform is-${p}`}>
            <span className="acc-platform-top">
              <BrandLockup site={p} lang={lang} size={28} tone={p === 'originals' ? 'dark' : 'light'} />
              <PlatformArrow size={16} />
            </span>
            <span className="acc-platform-body">{about[p]}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function SaveButton({ busy, disabled, children }) {
  return (
    <button type="submit" className="acc-btn primary" disabled={busy || disabled}>
      {busy && <ISpinner />} {children}
    </button>
  );
}

function ProfileSection({ a, lang, user, since, onSaved, onSelectLang }) {
  const [name, setName] = useState(user.name);
  const [state, setState] = useState({ busy: false, msg: null });
  const changed = name.trim() && name.trim() !== user.name;

  useEffect(() => {
    if (!state.msg?.ok) return undefined;
    const id = setTimeout(() => setState(s => ({ ...s, msg: null })), 3000);
    return () => clearTimeout(id);
  }, [state.msg]);

  const submit = async e => {
    e.preventDefault();
    setState({ busy: true, msg: null });
    const r = await api.updateProfile({ name: name.trim() });
    if (r.ok) { onSaved(r.data); setState({ busy: false, msg: { ok: true, text: a.saved } }); } else setState({ busy: false, msg: { ok: false, text: r.error } });
  };

  const pickLang = l => {
    if (l === lang || !onSelectLang) return;
    onSelectLang(l);
    setHash('profile');
  };

  return (
    <div className="acc-stack-lg">
      <section className="acc-card">
        <Head title={a.profile} body={`${a.memberSince} ${since}`} />
        <form onSubmit={submit} className="acc-form" aria-label={a.profile}>
          <div className="af-field">
            <label className="af-label" htmlFor="acc-name">{a.name}</label>
            <input id="acc-name" className="af-input" value={name} onChange={e => { setName(e.target.value); setState({ busy: false, msg: null }); }} required autoComplete="name" />
          </div>
          <div className="af-field">
            <label className="af-label" htmlFor="acc-email">{a.email}</label>
            <input id="acc-email" className="af-input" value={user.email} readOnly aria-describedby="acc-email-note" />
            <span className="af-hint" id="acc-email-note">{a.emailNote}</span>
          </div>
          <div className="acc-row">
            <SaveButton busy={state.busy} disabled={!changed}>{a.save}</SaveButton>
            {state.msg && <span role="status" className={state.msg.ok ? 'acc-saved' : 'af-error'}>{state.msg.ok && <ICheck />} {state.msg.text}</span>}
          </div>
        </form>
      </section>

      <section className="acc-card">
        <Head title={a.language} body={a.languageBody} />
        <div className="acc-seg" role="radiogroup" aria-label={a.language}>
          {[['en', 'English'], ['bn', 'বাংলা']].map(([l, label]) => (
            <button key={l} type="button" role="radio" aria-checked={lang === l} lang={l} onClick={() => pickLang(l)}>{label}</button>
          ))}
        </div>
      </section>

      <EmailPrefs a={a} user={user} onSaved={onSaved} />
    </div>
  );
}

/** The two kinds of email a reader can turn off; each switch saves on its own. */
function EmailPrefs({ a, user, onSaved }) {
  const [prefs, setPrefs] = useState({ email_updates: user.email_updates !== false, email_activity: user.email_activity !== false });
  const [state, setState] = useState({ busy: null, msg: null });

  useEffect(() => {
    if (!state.msg?.ok) return undefined;
    const id = setTimeout(() => setState(s => ({ ...s, msg: null })), 2500);
    return () => clearTimeout(id);
  }, [state.msg]);

  const flip = async key => {
    const next = !prefs[key];
    setPrefs(p => ({ ...p, [key]: next }));
    setState({ busy: key, msg: null });
    const r = await api.updateProfile({ [key]: next });
    if (r.ok) {
      onSaved(r.data);
      setState({ busy: null, msg: { ok: true, text: a.saved } });
    } else {
      setPrefs(p => ({ ...p, [key]: !next }));
      setState({ busy: null, msg: { ok: false, text: r.error } });
    }
  };

  return (
    <section className="acc-card">
      <Head title={a.emailPrefsTitle} body={a.emailPrefsBody} />
      <div className="acc-switches">
        {[['email_updates', a.emailUpdates, a.emailUpdatesBody], ['email_activity', a.emailActivity, a.emailActivityBody]].map(([key, label, body]) => (
          <div key={key} className="acc-switch-row">
            <span className="acc-stack-sm" id={`pref-${key}`}>
              <strong>{label}</strong>
              <span className="acc-muted">{body}</span>
            </span>
            <button type="button" role="switch" aria-checked={prefs[key]} aria-labelledby={`pref-${key}`}
              className="acc-switch" disabled={state.busy === key} onClick={() => flip(key)}>
              <span />
            </button>
          </div>
        ))}
      </div>
      {state.msg && <span role="status" className={state.msg.ok ? 'acc-saved' : 'af-error'}>{state.msg.ok && <ICheck />} {state.msg.text}</span>}
    </section>
  );
}

function SecuritySection({ a }) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [state, setState] = useState({ busy: false, msg: null });
  const submit = async e => {
    e.preventDefault();
    setState({ busy: true, msg: null });
    const r = await api.changePassword({ current_password: cur, new_password: next });
    if (r.ok) { setCur(''); setNext(''); setState({ busy: false, msg: { ok: true, text: a.pwSavedOthers || a.pwSaved } }); } else setState({ busy: false, msg: { ok: false, text: r.error } });
  };
  return (
    <section className="acc-card">
      <Head title={a.changePw} body={a.securityBody} />
      <form onSubmit={submit} className="acc-form" aria-label={a.changePw}>
        {state.msg && <p role={state.msg.ok ? 'status' : 'alert'} className={state.msg.ok ? 'af-ok' : 'af-error'}>{state.msg.text}</p>}
        <PasswordField words={a} label={a.currentPw} value={cur} onChange={v => { setCur(v); setState(s => ({ ...s, msg: null })); }} autoComplete="current-password" />
        <PasswordField words={a} label={a.newPw} value={next} onChange={v => { setNext(v); setState(s => ({ ...s, msg: null })); }} autoComplete="new-password" minLength={6} meter hint={a.passwordHint} />
        <div className="acc-row">
          <SaveButton busy={state.busy} disabled={!cur || next.length < 6}>{a.changePw}</SaveButton>
        </div>
      </form>
    </section>
  );
}

/** Download everything, or delete the account. */
function DataSection({ a, t, base, onSignOut }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, setState] = useState({ busy: false, error: null, done: false });
  const [exporting, setExporting] = useState(false);

  const download = async () => {
    setExporting(true);
    const r = await api.exportMyData();
    setExporting(false);
    if (!r.ok) return;
    const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rupok-my-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const remove = async e => {
    e.preventDefault();
    setState({ busy: true, error: null, done: false });
    const r = await api.deleteAccount(password, confirm);
    if (!r.ok) { setState({ busy: false, error: r.error, done: false }); return; }
    setState({ busy: false, error: null, done: true });
    setTimeout(() => { onSignOut?.(); window.location.assign(`${base}/`); }, 1800);
  };

  if (state.done) return <section className="acc-card"><p role="status" className="af-ok">{a.deleted}</p></section>;

  return (
    <div className="acc-stack-lg">
      <section className="acc-card">
        <Head title={a.dataTitle} body={a.dataBody}>
          <a href={`${base}/privacy`} className="af-link">{t.privacyTitle}</a>
        </Head>
        <div className="acc-row">
          <button type="button" onClick={download} disabled={exporting} className="acc-btn">
            {exporting ? <ISpinner /> : <IDownload />} {a.export}
          </button>
        </div>
      </section>

      {/* Folded away by default so the danger zone does not dominate the page */}
      <details className="acc-card acc-danger">
        <summary><ITrash /> {a.deleteTitle}</summary>
        <form onSubmit={remove} className="acc-form" aria-label={a.deleteTitle}>
          <p className="acc-body-text">{a.deleteBody}</p>
          {state.error && <p role="alert" className="af-error">{state.error}</p>}
          <PasswordField words={a} label={a.password} value={password} onChange={setPassword} autoComplete="current-password" />
          <div className="af-field">
            <label className="af-label" htmlFor="acc-del">{a.deleteConfirm}</label>
            <input id="acc-del" className="af-input" value={confirm} onChange={e => setConfirm(e.target.value)} required autoComplete="off" spellCheck={false} autoCapitalize="characters" />
          </div>
          <div className="acc-row">
            <button type="submit" className="acc-btn danger" disabled={state.busy || confirm !== 'DELETE' || !password}>
              {state.busy ? <ISpinner /> : <ITrash />} {a.deleteBtn}
            </button>
          </div>
        </form>
      </details>
    </div>
  );
}

const ACC_STYLE = `
  .acc {
    max-width: 1440px; margin: 0 auto; box-sizing: border-box; color: var(--ink, #151515);
    padding: clamp(28px, 4.5vh, 56px) clamp(16px, 2.4vw, 32px) clamp(56px, 8vh, 96px);
  }
  .acc *, .acc *::before, .acc *::after { box-sizing: border-box; }
  .acc-h1 {
    margin: 0; font-family: var(--font-display, 'Sora', 'Hind Siliguri', sans-serif); font-weight: 800;
    font-size: clamp(38px, 5vw, 72px); line-height: 1; letter-spacing: -.045em; text-wrap: balance; animation: rs-in .3s ease-out;
  }
  .acc-h1-sm { font-size: clamp(28px, 3.4vw, 44px); display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; animation: none; }
  .acc-h2 { margin: 0; font-family: var(--font-display, 'Sora', 'Hind Siliguri', sans-serif); font-weight: 800; font-size: clamp(21px, 2vw, 26px); letter-spacing: -.02em; }
  .acc-h3 { margin: 0; font-family: var(--font-display, 'Sora', 'Hind Siliguri', sans-serif); font-weight: 800; font-size: 19px; letter-spacing: -.01em; }
  .acc-lede { margin: 0; max-width: 460px; font-size: clamp(16px, 1.3vw, 19px); line-height: 1.6; color: var(--muted-2, #55524a); }
  .acc-body-text { margin: 0; max-width: 620px; font-size: 15px; line-height: 1.6; color: var(--muted-2, #55524a); }
  .acc-muted { font-size: 13px; color: var(--muted, #6b675e); font-weight: 600; }
  .acc-clip { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .acc-stack, .acc-stack-sm, .acc-stack-lg, .acc-form { display: flex; flex-direction: column; }
  .acc-stack { gap: 14px; } .acc-stack-sm { gap: 6px; } .acc-stack-lg { gap: clamp(18px, 2vw, 28px); } .acc-form { gap: 18px; max-width: 560px; }
  .acc-row { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
  .acc-row-sm { gap: 8px; }
  .acc-pill {
    align-self: flex-start; padding: 6px 14px; border-radius: 999px; font-weight: 800; font-size: 13px;
    border: calc(2px * var(--bwk, 1)) solid var(--edge, #151515); background: var(--card, #fff);
    box-shadow: calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 var(--ink, #151515);
  }
  .acc-kicker { font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--muted, #6b675e); }
  .acc-badge { padding: 3px 10px; border-radius: 999px; font-family: 'DM Sans', 'Hind Siliguri', sans-serif; font-size: 12px; font-weight: 800; letter-spacing: .02em; background: var(--acc-ui); color: var(--acc-ui-on); }

  .acc-card {
    display: flex; flex-direction: column; gap: 18px; min-width: 0; padding: clamp(18px, 2.2vw, 28px); border-radius: 20px;
    border: calc(2px * var(--bwk, 1)) solid var(--edge, #151515); background: var(--card, #fff);
    box-shadow: calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 var(--ink, #151515);
  }
  :root[data-site] .acc-card { box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 12px 32px -20px rgba(0,0,0,.35); }
  .acc-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 12px 20px; }

  .acc-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 42px; padding: 0 16px; border-radius: 12px;
    border: calc(2px * var(--bwk, 1)) solid var(--edge, #151515); background: var(--card, #fff); color: var(--ink, #151515);
    font: inherit; font-size: 14.5px; font-weight: 800; text-decoration: none; cursor: pointer; white-space: nowrap;
    transition: background .15s, border-color .15s, transform .15s, opacity .15s;
  }
  .acc-btn:hover:not(:disabled) { border-color: color-mix(in srgb, var(--ink, #151515) 45%, transparent); transform: translateY(-1px); }
  .acc-btn:disabled { opacity: .5; cursor: not-allowed; }
  .acc-btn.primary { background: var(--ink-bg, #151515); color: #fff; box-shadow: calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 var(--acc-ui); }
  :root[data-site] .acc-btn.primary { background: var(--acc-ui); color: var(--acc-ui-on); border-color: transparent; }
  .acc-btn.danger { background: #b91c1c; color: #fff; border-color: #7f1d1d; }
  .acc-btn.sm { min-height: 34px; padding: 0 12px; font-size: 13px; border-radius: 10px; }

  /* Signed out */
  .acc-auth { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 480px); gap: clamp(28px, 5vw, 88px); align-items: center; min-height: min(78vh, 760px); }
  .acc-auth-intro { display: flex; flex-direction: column; gap: 18px; }
  .acc-auth-card { padding: clamp(20px, 2.6vw, 32px); }
  .acc-perks { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
  .acc-perks strong { font-size: 13px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--muted, #6b675e); }
  .acc-perks ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
  .acc-perks li { display: flex; align-items: flex-start; gap: 12px; font-size: 16px; line-height: 1.5; font-weight: 600; }
  .acc-perk-tick { flex: none; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; font-size: 13px; background: var(--acc-ui); color: var(--acc-ui-on); margin-top: 1px; }

  /* Signed in */
  .acc-id { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 20px; margin-bottom: clamp(22px, 3vw, 36px); }
  .acc-avatar {
    flex: none; width: clamp(56px, 6vw, 72px); aspect-ratio: 1; border-radius: 50%; display: grid; place-items: center;
    font-family: var(--font-display, 'Sora', 'Hind Siliguri', sans-serif); font-weight: 800; font-size: clamp(24px, 2.6vw, 32px);
    background: var(--acc-ui); color: var(--acc-ui-on); border: calc(2px * var(--bwk, 1)) solid var(--edge, #151515);
  }
  .acc-id-text { display: flex; flex-direction: column; gap: 6px; min-width: 0; flex: 1 1 280px; }
  .acc-meta { font-size: 14px; color: var(--muted, #6b675e); overflow-wrap: anywhere; }
  .acc-id-actions { margin-left: auto; }

  .acc-body { display: grid; grid-template-columns: 232px minmax(0, 1fr); gap: clamp(20px, 2.6vw, 40px); align-items: start; }
  .acc-nav { position: sticky; top: calc(var(--nav-h, 68px) + 16px); display: flex; flex-direction: column; gap: 2px; }
  .acc-tab {
    position: relative; display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 14px; border-radius: 12px;
    color: var(--muted-2, #55524a); font-weight: 700; font-size: 15px; text-decoration: none; transition: background .15s, color .15s;
  }
  .acc-tab > span:first-child { flex: 1; }
  .acc-tab:hover { background: color-mix(in srgb, var(--ink, #151515) 6%, transparent); color: var(--ink, #151515); }
  .acc-tab[aria-current] { background: color-mix(in srgb, var(--acc-ui) 14%, transparent); color: var(--ink, #151515); font-weight: 800; }
  .acc-tab[aria-current]::before { content: ''; position: absolute; left: 0; top: 10px; bottom: 10px; width: 3px; border-radius: 3px; background: var(--acc-ui); }
  .acc-count { min-width: 22px; padding: 1px 7px; border-radius: 999px; font-size: 12px; font-weight: 800; text-align: center; background: color-mix(in srgb, var(--ink, #151515) 9%, transparent); color: var(--ink, #151515); }
  .acc-dot { width: 7px; height: 7px; border-radius: 50%; background: #ca8a04; }
  .acc-panel { min-width: 0; scroll-margin-top: calc(var(--nav-h, 68px) + 16px); animation: rs-in .25s ease-out; }

  .acc-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
  .acc-stat {
    display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 18px 20px; border-radius: 18px; cursor: pointer; text-align: left;
    border: calc(2px * var(--bwk, 1)) solid var(--edge, #151515); background: var(--card, #fff); color: var(--ink, #151515); font: inherit;
    box-shadow: calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 var(--ink, #151515); transition: transform .15s, border-color .15s;
  }
  .acc-stat:hover { transform: translateY(-2px); border-color: var(--acc-ui); }
  .acc-stat-n { font-family: var(--font-display, 'Sora', 'Hind Siliguri', sans-serif); font-weight: 800; font-size: clamp(28px, 3vw, 38px); line-height: 1; letter-spacing: -.03em; }
  .acc-stat-l { font-size: 13.5px; font-weight: 700; color: var(--muted, #6b675e); }

  .acc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr)); gap: 14px; }
  .acc-empty {
    display: flex; flex-direction: column; align-items: flex-start; gap: 14px; padding: clamp(18px, 2vw, 26px); border-radius: 16px;
    border: calc(2px * var(--bwk, 1)) dashed color-mix(in srgb, var(--ink, #151515) 25%, transparent); background: var(--card-2, #faf8f3);
  }
  .acc-empty p { margin: 0; max-width: 560px; font-size: 15.5px; line-height: 1.6; color: var(--muted-2, #55524a); }
  .acc-loading { display: flex; flex-direction: column; gap: 10px; }
  .acc-loading span { height: 64px; border-radius: 14px; background: linear-gradient(90deg, var(--card-2, #f4f1ea) 0%, color-mix(in srgb, var(--ink, #151515) 7%, var(--card-2, #f4f1ea)) 50%, var(--card-2, #f4f1ea) 100%); background-size: 200% 100%; animation: acc-shimmer 1.2s linear infinite; }
  @keyframes acc-shimmer { to { background-position: -200% 0; } }

  .acc-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .acc-chip {
    display: inline-flex; align-items: center; gap: 7px; min-height: 34px; padding: 0 13px; border-radius: 999px; cursor: pointer;
    border: calc(2px * var(--bwk, 1)) solid var(--edge, #151515); background: transparent; color: var(--ink, #151515); font: inherit; font-size: 13.5px; font-weight: 700;
  }
  .acc-chip span { font-size: 12px; opacity: .6; }
  .acc-chip[aria-pressed='true'] { background: var(--ink, #151515); color: var(--card, #fff); border-color: var(--ink, #151515); }

  .acc-links { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
  .acc-link { position: relative; align-items: flex-start; gap: 8px; text-align: left; font: inherit; color: var(--ink, #151515); cursor: pointer; padding-right: 48px; transition: transform .15s, border-color .15s; }
  .acc-link strong { font-size: 17px; font-weight: 800; }
  .acc-link span { font-size: 14px; line-height: 1.55; color: var(--muted-2, #55524a); }
  .acc-link > svg { position: absolute; right: 20px; top: 22px; transition: transform .15s; }
  .acc-link:hover { transform: translateY(-2px); border-color: var(--acc-ui); }
  .acc-link:hover > svg { transform: translateX(3px); }

  .acc-platforms { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; }
  .acc-platform { display: flex; flex-direction: column; gap: 12px; padding: 18px; border-radius: 16px; text-decoration: none; border: calc(2px * var(--bwk, 1)) solid var(--edge, #151515); transition: transform .15s; }
  .acc-platform:hover { transform: translateY(-2px); }
  .acc-platform.is-stories { background: #faf6ee; color: #1c1917; }
  .acc-platform.is-originals { background: #0b0b0b; color: #fafaf9; }
  .acc-platform-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .acc-platform-body { font-size: 14px; line-height: 1.55; opacity: .78; }

  .acc-posters { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(46%, 168px), 1fr)); gap: clamp(14px, 1.6vw, 22px); }
  .acc-poster { display: flex; flex-direction: column; gap: 10px; min-width: 0; transition: opacity .2s; }
  .acc-poster.is-removed .acc-poster-art, .acc-poster.is-removed .acc-poster-t { opacity: .35; }
  .acc-poster-art { display: block; aspect-ratio: 2 / 3; border-radius: 12px; transition: transform .2s; }
  .acc-poster-art:hover { transform: translateY(-3px); }
  .acc-poster-t { font-size: 15px; line-height: 1.3; }

  .acc-owned {
    display: flex; align-items: center; gap: 14px; padding: 12px; border-radius: 16px; text-decoration: none; color: var(--ink, #151515);
    border: calc(2px * var(--bwk, 1)) solid var(--edge, #151515); background: var(--card-2, #faf8f3); transition: transform .15s, border-color .15s;
  }
  .acc-owned:hover { transform: translateY(-2px); border-color: var(--acc-ui); }
  .acc-owned-art { flex: none; width: 58px; aspect-ratio: 2 / 3; border-radius: 8px; }
  .acc-gold { align-self: flex-start; display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 999px; font-size: 11.5px; font-weight: 800; background: #f5c542; color: #151515; }

  .acc-orders { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
  .acc-order { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-top: 1px solid color-mix(in srgb, var(--ink, #151515) 10%, transparent); }
  .acc-order:first-child { border-top: 0; padding-top: 0; }
  .acc-order-art { flex: none; width: 44px; aspect-ratio: 2 / 3; border-radius: 6px; }
  .acc-order-main { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
  .acc-order-meta { font-size: 12.5px; color: var(--muted, #6b675e); overflow-wrap: anywhere; }
  .acc-order-meta code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
  .acc-order-reject { font-size: 13px; font-weight: 600; color: color-mix(in srgb, #dc2626 75%, var(--ink, #151515)); }
  .acc-order-side { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex: none; }
  .acc-amount { font-family: var(--font-display, 'Sora', 'Hind Siliguri', sans-serif); font-weight: 800; font-size: 16px; }
  .acc-status {
    padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 800;
    background: color-mix(in srgb, var(--tone) 15%, transparent); color: color-mix(in srgb, var(--tone) 78%, var(--ink, #151515));
  }

  .acc-follows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
  .acc-follows li { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid color-mix(in srgb, var(--ink, #151515) 10%, transparent); transition: opacity .2s; }
  .acc-follows li:first-child { border-top: 0; padding-top: 0; }
  .acc-follows li.is-removed .acc-follow-name, .acc-follows li.is-removed .acc-initial { opacity: .4; }
  .acc-initial { flex: none; width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; background: color-mix(in srgb, var(--acc-ui) 18%, transparent); }
  .acc-follow-name { flex: 1; min-width: 0; color: var(--ink, #151515); font-weight: 800; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .acc-follow-name:hover { text-decoration: underline; }
  .acc-following .acc-following-off { display: none; }
  .acc-following:hover .acc-following-on, .acc-following:focus-visible .acc-following-on { display: none; }
  .acc-following:hover .acc-following-off, .acc-following:focus-visible .acc-following-off { display: inline; }
  .acc-following:hover { border-color: #dc2626; color: color-mix(in srgb, #dc2626 80%, var(--ink, #151515)); }

  .acc-saved { display: inline-flex; align-items: center; gap: 6px; font-weight: 800; color: color-mix(in srgb, #16a34a 75%, var(--ink, #151515)); animation: rs-in .2s ease-out; }
  .acc-seg { display: inline-grid; grid-auto-flow: column; grid-auto-columns: 1fr; align-self: flex-start; padding: 4px; gap: 4px; border-radius: 14px; border: calc(2px * var(--bwk, 1)) solid var(--edge, #151515); background: color-mix(in srgb, var(--ink, #151515) 5%, transparent); }
  .acc-seg button { min-height: 42px; min-width: 120px; padding: 0 18px; border: 0; border-radius: 10px; background: transparent; color: var(--muted-2, #55524a); font: inherit; font-weight: 800; font-size: 15px; cursor: pointer; }
  .acc-seg button[aria-checked='true'] { background: var(--acc-ui); color: var(--acc-ui-on); }

  .acc-switches { display: flex; flex-direction: column; }
  .acc-switch-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 14px 0; border-top: 1px solid color-mix(in srgb, var(--ink, #151515) 10%, transparent); }
  .acc-switch-row:first-child { border-top: 0; padding-top: 0; }
  .acc-switch-row .acc-muted { font-weight: 500; font-size: 14px; line-height: 1.5; }
  .acc-switch {
    flex: none; position: relative; width: 50px; height: 30px; border-radius: 999px; cursor: pointer; padding: 0;
    border: calc(2px * var(--bwk, 1)) solid var(--edge, #151515); background: color-mix(in srgb, var(--ink, #151515) 14%, transparent); transition: background .2s;
  }
  .acc-switch span { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: var(--card, #fff); box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: transform .2s; }
  .acc-switch[aria-checked='true'] { background: var(--acc-ui); }
  .acc-switch[aria-checked='true'] span { transform: translateX(20px); }
  .acc-switch:disabled { opacity: .6; cursor: wait; }
  .acc-danger { border-color: color-mix(in srgb, #dc2626 50%, var(--edge, #151515)); }
  .acc-danger summary { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 16px; color: color-mix(in srgb, #dc2626 80%, var(--ink, #151515)); cursor: pointer; list-style: none; }
  .acc-danger summary::-webkit-details-marker { display: none; }
  .acc-danger summary::after { content: '+'; margin-left: auto; font-size: 22px; font-weight: 600; line-height: 1; }
  .acc-danger[open] summary::after { content: '−'; }
  .acc-danger:not([open]) { box-shadow: none; }

  @media (max-width: 860px) {
    .acc-auth { grid-template-columns: 1fr; min-height: 0; align-items: start; }
    .acc-auth .acc-perks { display: none; }
    .acc-body { grid-template-columns: 1fr; }
    .acc-nav {
      position: static; flex-direction: row; gap: 6px; overflow-x: auto; scrollbar-width: none;
      margin: 0 calc(-1 * clamp(16px, 2.4vw, 32px)); padding: 0 clamp(16px, 2.4vw, 32px) 4px;
      /* Fades at the screen's edges say the row scrolls sideways */
      -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 14px, #000 calc(100% - 28px), transparent);
      mask-image: linear-gradient(90deg, transparent 0, #000 14px, #000 calc(100% - 28px), transparent);
    }
    .acc-nav::-webkit-scrollbar { display: none; }
    .acc-tab { flex: none; min-height: 40px; border: calc(2px * var(--bwk, 1)) solid var(--edge, #151515); border-radius: 999px; font-size: 14px; }
    .acc-tab[aria-current] { background: var(--ink, #151515); color: var(--card, #fff); border-color: var(--ink, #151515); }
    .acc-tab[aria-current]::before { display: none; }
    .acc-tab[aria-current] .acc-count { background: color-mix(in srgb, var(--card, #fff) 22%, transparent); color: inherit; }
    .acc-id-actions { margin-left: 0; width: 100%; }
    .acc-id-actions .acc-btn { flex: 1; }
  }
  @media (max-width: 520px) {
    .acc-order { align-items: flex-start; }
    .acc-order-art { display: none; }
    .acc-stats { grid-template-columns: 1fr 1fr; }
  }
`;
