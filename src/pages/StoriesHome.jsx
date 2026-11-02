import React from 'react';
import { ArrowRight, BookOpen, Feather, Layers, PenLine } from 'lucide-react';
import { api } from '../services/api';
import BooksPromo from '../components/BooksPromo';
import RupokStoriesMark from '../components/RupokStoriesMark';
import { SOCIAL_ICONS } from '../components/SocialIcons';
import { WORK_KINDS } from '../data/content';

// The home page of Rupok Stories (stories.<domain>): the writing on its own,
// laid out like a literary magazine rather than the studio's comic-book look.

export const PAPER = '#faf6ee';
export const INK = '#1c1917';
export const MUTED = '#6b625a';
export const LINE = '#e7dfd2';
export const ACCENT = '#9a3412';
export const SERIF = "'Literata', 'Noto Serif Bengali', Georgia, serif";
export const SANS = "'DM Sans', 'Hind Siliguri', sans-serif";

const COPY = {
  en: {
    eyebrow: 'New writing in Bangla and English',
    h1a: 'Stories worth',
    h1b: 'staying up for.',
    start: 'Start reading',
    write: 'Write with us',
    featured: 'Featured',
    continue: 'Continue reading',
    popular: 'Popular this week',
    newest: 'Just published',
    serials: 'Serials, chapter by chapter',
    browse: 'Browse by form',
    authors: 'The authors',
    allAuthors: 'All authors',
    writeH: 'Your story belongs here.',
    writeB: 'Publish short stories, serials and poetry on Rupok Stories, in Bangla or English. Write chapter by chapter, publish when you are ready, and earn when readers unlock your work.',
    writeCta: 'Apply to publish',
    empty: 'The first stories are on their way.',
    seeAll: 'See all',
    works: '{n} works'
  },
  bn: {
    eyebrow: 'বাংলা ও ইংরেজিতে নতুন লেখা',
    h1a: 'রাত জেগে পড়ার',
    h1b: 'মতো গল্প।',
    start: 'পড়া শুরু করুন',
    write: 'আমাদের সঙ্গে লিখুন',
    featured: 'বাছাই করা',
    continue: 'যেখানে থেমেছিলেন',
    popular: 'এই সপ্তাহে জনপ্রিয়',
    newest: 'সদ্য প্রকাশিত',
    serials: 'ধারাবাহিক, অধ্যায় ধরে',
    browse: 'ধরন অনুযায়ী',
    authors: 'লেখকেরা',
    allAuthors: 'সব লেখক',
    writeH: 'আপনার গল্পের জায়গা এখানে।',
    writeB: 'রূপক গল্পে প্রকাশ করুন ছোটগল্প, ধারাবাহিক আর কবিতা — বাংলায় বা ইংরেজিতে। অধ্যায় ধরে লিখুন, যখন খুশি প্রকাশ করুন, এবং পৌঁছে দিন দেশ-বিদেশের হাজারো পাঠকের কাছে।',
    writeCta: 'প্রকাশের আবেদন করুন',
    empty: 'প্রথম গল্পগুলো আসছে।',
    seeAll: 'সব দেখুন',
    works: '{n}টি লেখা'
  }
};

// Fallbacks for CMS → Page content → Stories (stories.kindStory …)
export const KIND_LABEL = {
  en: { story: 'Short stories', series: 'Serials', poetry: 'Poetry' },
  bn: { story: 'ছোটগল্প', series: 'ধারাবাহিক', poetry: 'কবিতা' }
};
/** A form of writing's name on Stories: the CMS copy, else the built-in label. */
export const kindLabel = (t, lang, kind) =>
  t.stories?.[`kind${kind[0].toUpperCase()}${kind.slice(1)}`] || KIND_LABEL[lang][kind] || kind;

const KIND_ICON = { story: BookOpen, series: Layers, poetry: Feather };

export const readLabel = (w, t, num, lang) => (w.kind === 'series' && w.chapters
  ? (t.workChapters || '{n} chapters').replace('{n}', num(w.chapters, lang))
  : (t.workReadTime || '{n} min read').replace('{n}', num(w.minutes || 1, lang)));

const newestFirst = (a, b) => new Date(b.published || 0) - new Date(a.published || 0);

function Cover({ w, ratio = '3 / 4', title = true, radius = 10 }) {
  const ac = w.ac || ACCENT;
  return (
    <div style={{
      aspectRatio: ratio, borderRadius: radius, overflow: 'hidden', position: 'relative',
      background: w.cover ? `${ac} url(${w.cover}) center/cover` : `linear-gradient(160deg, ${ac}, ${ac}bb)`,
      boxShadow: '0 1px 2px rgba(28, 25, 23, .08), 0 8px 24px -12px rgba(28, 25, 23, .35)'
    }}>
      {!w.cover && (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', opacity: 0.18 }}>
          <RupokStoriesMark height={90} color="#ffffff" />
        </div>
      )}
      {!w.cover && title && (
        <span style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: '0 14%',
          textAlign: 'center', color: '#fff', fontFamily: SERIF, fontWeight: 600,
          fontSize: 'clamp(16px, 1.6vw, 22px)', lineHeight: 1.2
        }}>{w.title}</span>
      )}
    </div>
  );
}

/** One piece as a book on a shelf: cover, title, author, length. */
export function BookCard({ w, t, num, lang }) {
  return (
    <a href={w.href} className="st-book" style={{ display: 'flex', flexDirection: 'column', gap: 10, color: INK, textDecoration: 'none' }}>
      <Cover w={w} />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <strong style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 17, lineHeight: 1.3 }}>{w.title}</strong>
        <span style={{ fontSize: 13.5, color: MUTED }}>{w.author}</span>
        <span style={{ fontSize: 12.5, color: MUTED }}>
          {kindLabel(t, lang, w.kind)} · {readLabel(w, t, num, lang)}
        </span>
      </span>
    </a>
  );
}

function SectionHead({ title, href, more }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, borderBottom: `1px solid ${LINE}`, paddingBottom: 12, marginBottom: 24 }}>
      <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(24px, 2.4vw, 32px)', letterSpacing: '-.01em' }}>{title}</h2>
      {href && (
        <a href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: ACCENT, fontWeight: 700, fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap' }}>
          {more} <ArrowRight size={15} />
        </a>
      )}
    </div>
  );
}

const section = { maxWidth: 1240, margin: '0 auto', padding: 'clamp(36px, 5vw, 64px) clamp(16px, 2.4vw, 32px) 0' };

export default function StoriesHome({ lang, base, t, num, library_works = [], authors = [], libraryHistory = [], featuredKey, booksUrl = '' }) {
  // The CMS copy (Page content → Stories), over the built-in words
  const c = { ...COPY[lang], ...t.stories };
  // The piece chosen in CMS → Settings, else the most read this week (the list arrives in that order)
  const featured = library_works.find(w => w.k === featuredKey) || library_works[0];
  const candidateWorks = library_works.filter(w => w.k !== featured?.k);
  const popular = (candidateWorks.length >= 6 ? candidateWorks : library_works).slice(0, 6);
  const newest = [...library_works].sort(newestFirst).slice(0, 10);
  const serials = library_works.filter(w => w.kind === 'series').slice(0, 4);
  const kinds = WORK_KINDS.map(k => ({ k, n: library_works.filter(w => w.kind === k).length }));
  const blurbs = Object.fromEntries((Array.isArray(t.libraryKindBlurbs) ? t.libraryKindBlurbs : []).filter(Array.isArray));
  const people = authors.filter(a => a.works > 0).slice(0, 8);
  const reading = (libraryHistory || []).filter(h => !h.finished).slice(0, 3);

  return (
    <div style={{ background: PAPER, color: INK, fontFamily: SANS, paddingBottom: 'clamp(48px, 6vw, 80px)' }}>
      {/* Masthead + the featured piece */}
      <header style={{ ...section, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 'clamp(28px, 4vw, 64px)', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: ACCENT, fontWeight: 700, fontSize: 13, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            <RupokStoriesMark height={22} color={ACCENT} />
            {c.eyebrow}
          </span>
          <h1 style={{ margin: 0, fontFamily: SERIF, fontWeight: 500, fontSize: 'clamp(44px, 6vw, 84px)', lineHeight: 1.02, letterSpacing: '-.03em' }}>
            {c.h1a}<br /><em style={{ fontStyle: 'italic', color: ACCENT }}>{c.h1b}</em>
          </h1>
          <p style={{ margin: 0, maxWidth: 520, fontSize: 'clamp(16px, 1.3vw, 18.5px)', lineHeight: 1.7, color: MUTED }}>{t.bodyLibrary}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
            {featured && (
              <a href={featured.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 999, background: INK, color: PAPER, fontWeight: 700, textDecoration: 'none' }}>
                {c.start} <ArrowRight size={17} />
              </a>
            )}
            <a href={`${base}/account#author`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 21px', borderRadius: 999, border: `1px solid ${INK}`, color: INK, fontWeight: 700, textDecoration: 'none' }}>
              <PenLine size={16} /> {c.write}
            </a>
          </div>
        </div>

        {featured ? (
          <a href={featured.href} className="st-feature" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 5fr) minmax(0, 6fr)', gap: 'clamp(16px, 2vw, 28px)', alignItems: 'end', padding: 'clamp(18px, 2.4vw, 28px)', borderRadius: 20, background: '#fff', border: `1px solid ${LINE}`, color: INK, textDecoration: 'none' }}>
            <Cover w={featured} radius={12} />
            <span style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ color: ACCENT, fontWeight: 700, fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase' }}>{c.featured} · {kindLabel(t, lang, featured.kind)}</span>
              <strong style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 'clamp(22px, 2.2vw, 30px)', lineHeight: 1.2 }}>{featured.title}</strong>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{featured.author}</span>
              {featured.summary && (
                <span style={{ fontSize: 14.5, lineHeight: 1.65, color: MUTED, display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{featured.summary}</span>
              )}
              <span style={{ fontSize: 13, color: MUTED }}>{readLabel(featured, t, num, lang)}</span>
            </span>
          </a>
        ) : (
          <p style={{ fontFamily: SERIF, fontSize: 22, color: MUTED }}>{c.empty}</p>
        )}
      </header>

      {/* Where the signed-in reader left off */}
      {reading.length > 0 && (
        <section style={section}>
          <SectionHead title={c.continue} href={`${base}/account`} more={c.seeAll} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 16 }}>
            {reading.map(h => {
              const pct = Math.max(h.scroll_pct || 0, 1);
              const q = h.chapter_num ? `?ch=${h.chapter_num}&p=${h.scroll_pct || 0}` : (h.scroll_pct ? `?p=${h.scroll_pct}` : '');
              const w = { ...h, cover: h.cover ? api.libraryImageUrl(h.cover) : null };
              return (
                <a key={h.work_key} href={`${base}/stories/${h.author_handle}/${h.work_key}${q}`} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 14, alignItems: 'center', padding: 14, borderRadius: 14, background: '#fff', border: `1px solid ${LINE}`, color: INK, textDecoration: 'none' }}>
                  <Cover w={w} title={false} radius={6} />
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                    <strong style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</strong>
                    <span style={{ fontSize: 13, color: MUTED }}>{h.author}</span>
                    <span style={{ height: 4, borderRadius: 4, background: LINE, overflow: 'hidden' }}>
                      <span style={{ display: 'block', height: '100%', width: `${pct}%`, background: ACCENT }} />
                    </span>
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Most read this week, as a numbered list */}
      {popular.length > 1 && (
        <section style={section}>
          <SectionHead title={c.popular} />
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', columnGap: 'clamp(24px, 4vw, 56px)' }}>
            {popular.map((w, i) => (
              <li key={w.k} style={{ borderBottom: `1px solid ${LINE}` }}>
                <a href={w.href} style={{ display: 'grid', gridTemplateColumns: '44px 1fr', gap: 14, alignItems: 'baseline', padding: '16px 0', color: INK, textDecoration: 'none' }}>
                  <span style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 500, color: ACCENT, lineHeight: 1 }}>{num(i + 1, lang)}</span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <strong style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 18, lineHeight: 1.3 }}>{w.title}</strong>
                    <span style={{ fontSize: 13.5, color: MUTED }}>{w.author} · {readLabel(w, t, num, lang)}</span>
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Newest pieces */}
      {newest.length > 0 && (
        <section style={section}>
          <SectionHead title={c.newest} href={`${base}/stories/story`} more={c.seeAll} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(46%, 180px), 1fr))', gap: 'clamp(16px, 2vw, 28px)' }}>
            {newest.map(w => <BookCard key={w.k} w={w} t={t} num={num} lang={lang} />)}
          </div>
        </section>
      )}

      {/* Serials */}
      {serials.length > 0 && (
        <section style={section}>
          <SectionHead title={c.serials} href={`${base}/stories/series`} more={c.seeAll} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
            {serials.map(w => (
              <a key={w.k} href={w.href} style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 16, padding: 16, borderRadius: 16, background: '#fff', border: `1px solid ${LINE}`, color: INK, textDecoration: 'none' }}>
                <Cover w={w} title={false} radius={8} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <strong style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 18, lineHeight: 1.25 }}>{w.title}</strong>
                  <span style={{ fontSize: 13.5, color: MUTED }}>{w.author}</span>
                  {w.summary && <span style={{ fontSize: 13.5, lineHeight: 1.55, color: MUTED, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{w.summary}</span>}
                  <span style={{ marginTop: 'auto', fontSize: 12.5, fontWeight: 700, color: ACCENT }}>{readLabel(w, t, num, lang)}</span>
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* The three forms */}
      <section style={section}>
        <SectionHead title={c.browse} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 16 }}>
          {kinds.map(({ k, n }) => {
            const Icon = KIND_ICON[k] || BookOpen;
            return (
              <a key={k} href={`${base}/stories/${k}`} className="st-kind" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 24, borderRadius: 18, background: '#fff', border: `1px solid ${LINE}`, color: INK, textDecoration: 'none' }}>
                <Icon size={24} color={ACCENT} />
                <strong style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 22 }}>{kindLabel(t, lang, k)}</strong>
                {blurbs[k] && <span style={{ fontSize: 14.5, lineHeight: 1.6, color: MUTED }}>{blurbs[k]}</span>}
                <span style={{ marginTop: 'auto', fontSize: 13, fontWeight: 700, color: ACCENT }}>{c.works.replace('{n}', num(n, lang))}</span>
              </a>
            );
          })}
        </div>
      </section>

      {/* Community & Social Links */}
      {(t?.socials || []).length > 0 && (
        <section style={section}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px 32px',
            padding: '24px clamp(20px, 3.5vw, 36px)',
            borderRadius: 20,
            background: '#f1e8da',
            border: `1px solid ${LINE}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <RupokStoriesMark height={32} color={ACCENT} />
              <div>
                <strong style={{ display: 'block', fontFamily: SERIF, fontWeight: 600, fontSize: 17, color: INK }}>
                  {lang === 'bn' ? 'রূপকের সঙ্গে যুক্ত থাকুন' : 'Stay Connected with Rupok'}
                </strong>
                <span style={{ fontSize: 13.5, color: MUTED }}>
                  {lang === 'bn' ? 'নতুন গল্প, ধারাবাহিক ও সাহিত্য আপডেটের জন্য' : 'Follow our official channels for new stories and updates'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {t.socials.map(({ k, name, url }) => {
                const Icon = SOCIAL_ICONS[k];
                if (!Icon) return null;
                return (
                  <a
                    key={k}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    title={name}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '9px 18px',
                      borderRadius: 999,
                      background: '#fff',
                      border: `1px solid ${LINE}`,
                      color: INK,
                      fontWeight: 700,
                      fontSize: 13.5,
                      textDecoration: 'none',
                      boxShadow: '0 1px 3px rgba(28,25,23,.06)',
                      transition: 'transform 0.15s ease, border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = ACCENT;
                      e.currentTarget.style.color = ACCENT;
                      e.currentTarget.style.boxShadow = '0 4px 12px -2px rgba(156,58,29,.2)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.borderColor = LINE;
                      e.currentTarget.style.color = INK;
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(28,25,23,.06)';
                    }}
                  >
                    <Icon />
                    <span>{name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Authors */}
      {people.length > 0 && (
        <section style={section}>
          <SectionHead title={c.authors} href={`${base}/authors`} more={c.allAuthors} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(46%, 150px), 1fr))', gap: 20 }}>
            {people.map(a => (
              <a key={a.handle} href={a.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', color: INK, textDecoration: 'none' }}>
                <span aria-hidden="true" style={{
                  width: 88, height: 88, borderRadius: 999, display: 'grid', placeItems: 'center',
                  background: a.avatar ? `${a.ac} url(${a.avatar}) center/cover` : a.ac, color: '#fff',
                  fontFamily: SERIF, fontSize: 32, fontWeight: 600, boxShadow: `0 0 0 3px ${PAPER}, 0 0 0 4px ${LINE}`
                }}>{a.avatar ? '' : (a.name || a.handle).charAt(0)}</span>
                <strong style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 16 }}>{a.name}</strong>
                <span style={{ fontSize: 12.5, color: MUTED }}>{c.works.replace('{n}', num(a.works, lang))}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      <BooksPromo url={booksUrl} lang={lang} theme="stories" />

      {/* For writers */}
      <section style={section}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 24, alignItems: 'center', padding: 'clamp(28px, 4vw, 56px)', borderRadius: 24, background: '#2b211b', color: PAPER }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <RupokStoriesMark height={46} color="#f2b28c" style={{ flexShrink: 0 }} />
            <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 500, fontSize: 'clamp(30px, 3.6vw, 48px)', lineHeight: 1.1, letterSpacing: '-.02em' }}>{c.writeH}</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start' }}>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: '#d9cbb9' }}>{c.writeB}</p>
            <a href={`${base}/account#author`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 999, background: '#f2b28c', color: '#2b211b', fontWeight: 700, textDecoration: 'none' }}>
              {c.writeCta} <ArrowRight size={17} />
            </a>
          </div>
        </div>
      </section>

      <style>{`
        .st-book > div { transition: transform .25s ease, box-shadow .25s ease; }
        .st-book:hover > div { transform: translateY(-4px); box-shadow: 0 2px 4px rgba(28,25,23,.08), 0 18px 32px -14px rgba(28,25,23,.45); }
        .st-feature, .st-kind { transition: border-color .2s, box-shadow .2s; }
        .st-feature:hover, .st-kind:hover { border-color: ${ACCENT}55; box-shadow: 0 12px 32px -18px rgba(154,52,18,.45); }
      `}</style>
    </div>
  );
}
