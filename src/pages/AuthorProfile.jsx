import React, { useEffect, useState } from 'react';
import { Globe, ExternalLink, Languages, BookOpen, Edit3, Camera } from 'lucide-react';
import { INK, WORK_KINDS } from '../data/content';
import { api } from '../services/api';
import WorkCard, { pairLabel } from '../components/WorkCard';
import NotFound from './NotFound';
import FollowButton from '../components/FollowButton';
import ShareBar from '../components/ShareBar';

// An author's public page: who they are, then a bookshelf per kind of work.

export default function AuthorProfile({ lang, base, handle, num, t, user, myAuthor }) {
  const [author, setWriter] = useState(undefined); // undefined = loading, null = missing

  useEffect(() => {
    let live = true;
    setWriter(undefined);
    api.getAuthor(handle, lang).then(res => {
      if (live) setWriter(res.ok ? res.data : null);
    });
    return () => { live = false; };
  }, [handle, lang]);

  if (author === undefined) {
    return <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', color: 'var(--muted, #6b675e)' }}>…</div>;
  }
  if (author === null) return <NotFound base={base} t={t} />;

  const isSelf = Boolean(
    myAuthor && (
      myAuthor.handle === handle ||
      myAuthor.handle === author.handle ||
      (myAuthor.id && author.id && myAuthor.id === author.id)
    )
  );
  const editProfileUrl = `${base}/account/desk#profile`;

  const ac = author.ac || '#6f6758';
  const works = (author.works || []).map(w => ({
    ...w,
    cover: w.cover ? api.libraryImageUrl(w.cover) : null,
    href: `${base}/stories/${author.handle}/${w.k}`,
    ac: w.ac || ac
  }));

  const since = author.since
    ? new Date(author.since).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { year: 'numeric', month: 'long' })
    : '';

  const altName = author.pen_name_en && author.pen_name_bn && author.pen_name_en !== author.pen_name_bn
    ? (author.name === author.pen_name_bn ? author.pen_name_en : author.pen_name_bn)
    : null;

  return (
    <div style={{ color: INK }}>
      <header style={{ padding: 'clamp(24px, 4vh, 56px) clamp(12px, 1.8vw, 24px) clamp(20px, 3vh, 36px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <nav style={{ fontSize: 13, color: 'var(--muted, #6b675e)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href={`${base}/stories`} style={{ color: 'var(--muted, #6b675e)' }}>{t.h1Library}</a>
            <span aria-hidden="true">/</span>
            <span style={{ color: INK, fontWeight: 700 }}>{author.name}</span>
          </nav>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(18px, 2.4vw, 32px)', alignItems: 'flex-start' }}>
            {isSelf ? (
              <a
                href={editProfileUrl}
                title={lang === 'bn' ? 'প্রোফাইল ছবি পরিবর্তন ও সম্পাদনা করুন' : 'Change profile photo & edit profile'}
                style={{
                  flex: 'none',
                  display: 'block',
                  position: 'relative',
                  width: 'clamp(84px, 9vw, 120px)',
                  aspectRatio: '1',
                  borderRadius: '50%',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
              >
                <span style={{
                  display: 'grid', placeItems: 'center', width: '100%', height: '100%',
                  borderRadius: '50%', border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                  boxShadow: `calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 ${ac}`,
                  background: author.avatar ? `${ac} url(${api.libraryImageUrl(author.avatar)}) center/cover` : ac,
                  color: '#fff', fontWeight: 800,
                  fontSize: 'clamp(30px, 3.4vw, 44px)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {!author.avatar && (author.name || author.handle).trim().charAt(0).toUpperCase()}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'rgba(21, 21, 21, 0.72)',
                      color: '#fff',
                      padding: '4px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)"
                    }}
                  >
                    <Camera size={13} />
                    <span>{lang === 'bn' ? 'এডিট' : 'Edit'}</span>
                  </span>
                </span>
              </a>
            ) : (
              <span style={{
                flex: 'none', width: 'clamp(84px, 9vw, 120px)', aspectRatio: '1',
                borderRadius: '50%', border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, boxShadow: `calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 ${ac}`,
                background: author.avatar ? `${ac} url(${api.libraryImageUrl(author.avatar)}) center/cover` : ac,
                display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800,
                fontSize: 'clamp(30px, 3.4vw, 44px)'
              }}>
                {!author.avatar && (author.name || author.handle).trim().charAt(0).toUpperCase()}
              </span>
            )}

            <div style={{ flex: '1 1 420px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span style={{
                  padding: '4px 11px', border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                  borderRadius: 999, background: 'var(--card, #fff)', fontWeight: 800, fontSize: 12
                }}>{t.authorEyebrow || 'লেখক'}</span>

                <span style={{
                  padding: '4px 11px', border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`,
                  borderRadius: 999, background: 'var(--paper, #f4f1ea)', color: 'var(--muted-2, #55524a)',
                  fontWeight: 700, fontSize: 12
                }}>@{author.handle}</span>

                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                  borderRadius: 999, background: 'var(--paper, #f4f1ea)', color: 'var(--muted, #6b675e)',
                  fontSize: 12, fontWeight: 700
                }}>
                  <Languages size={13} />
                  {author.language === 'en'
                    ? (lang === 'bn' ? 'ইংরেজিতে লেখেন' : 'Writes in English')
                    : (lang === 'bn' ? 'বাংলায় লেখেন' : 'Writes in Bengali')}
                </span>

                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                  borderRadius: 999, background: 'var(--paper, #f4f1ea)', color: 'var(--muted, #6b675e)',
                  fontSize: 12, fontWeight: 700
                }}>
                  <BookOpen size={13} />
                  {num(works.length, lang)} {lang === 'bn' ? 'টি লেখা' : 'works'}
                </span>
              </div>

              <div>
                <h1 style={{
                  margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800,
                  fontSize: 'clamp(30px, 4vw, 56px)', lineHeight: 1.05, letterSpacing: '-.04em'
                }}>
                  {isSelf ? (
                    <a
                      href={editProfileUrl}
                      title={lang === 'bn' ? 'লেখক প্রোফাইল সম্পাদনা করুন' : 'Edit author profile'}
                      style={{
                        color: 'inherit',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 10,
                        cursor: 'pointer'
                      }}
                    >
                      <span>{author.name}</span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 10px',
                          borderRadius: 999,
                          border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`,
                          background: 'var(--card, #fff)',
                          color: 'var(--muted-2, #55524a)',
                          fontSize: 13,
                          fontWeight: 700,
                          verticalAlign: 'middle',
                          letterSpacing: 'normal'
                        }}
                      >
                        <Edit3 size={13} />
                        {lang === 'bn' ? 'সম্পাদনা' : 'Edit'}
                      </span>
                    </a>
                  ) : (
                    author.name
                  )}
                </h1>
                {altName && (
                  <div style={{ fontSize: 'clamp(15px, 1.3vw, 19px)', color: 'var(--muted, #6b675e)', fontWeight: 600, marginTop: 4 }}>
                    {altName}
                  </div>
                )}
              </div>

              {author.bio && (
                <p style={{ margin: 0, maxWidth: 680, fontSize: 'clamp(15px, 1.2vw, 17px)', lineHeight: 1.65, color: 'var(--muted-2, #55524a)', whiteSpace: 'pre-wrap' }}>
                  {author.bio}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', fontSize: 13, color: 'var(--muted, #6b675e)' }}>
                {since && <span>{(t.authorSince || '{date}').replace('{date}', since)}</span>}
                
                {author.website_url && (
                  <a
                    href={author.website_url}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 12px', borderRadius: 999,
                      border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`,
                      background: 'var(--card, #fff)', color: INK, fontSize: 12.5, fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    <Globe size={13} />
                    {(() => {
                      try { return new URL(author.website_url).hostname.replace(/^www\./, ''); }
                      catch { return t.deskWebsite || 'Website'; }
                    })()}
                  </a>
                )}

                {author.social_url && (
                  <a
                    href={author.social_url}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '4px 12px', borderRadius: 999,
                      border: `calc(1.5px * var(--bwk, 1)) solid var(--edge, #151515)`,
                      background: 'var(--card, #fff)', color: INK, fontSize: 12.5, fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    <ExternalLink size={13} />
                    {t.deskSocial || 'Social'}
                  </a>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 6 }}>
                {isSelf ? (
                  <a
                    href={editProfileUrl}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 18px',
                      borderRadius: 'var(--r-btn, 999px)',
                      border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                      background: 'var(--card, #fff)',
                      color: INK,
                      fontWeight: 800,
                      fontSize: 14,
                      textDecoration: 'none',
                      width: 'fit-content',
                      boxShadow: `calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 var(--edge, #151515)`,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Edit3 size={15} />
                    {lang === 'bn' ? 'লেখক প্রোফাইল সম্পাদনা করুন' : 'Edit author profile'}
                  </a>
                ) : (
                  <FollowButton
                    type="author" targetKey={handle} user={user} t={t} num={num} lang={lang} base={base}
                    isSelf={false}
                  />
                )}
                <ShareBar path={`/authors/${handle}`} title={author.name} t={t} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(12px, 1.8vw, 24px) clamp(48px, 8vh, 96px)', display: 'flex', flexDirection: 'column', gap: 'clamp(32px, 5vh, 56px)' }}>
        {works.length === 0 && (
          <p style={{ fontSize: 17, color: 'var(--muted-2, #55524a)' }}>{t.authorNoWorks}</p>
        )}

        

        {WORK_KINDS.filter(k => works.some(w => w.kind === k)).map(kind => (
          <section key={kind} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h2 style={{
              margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)",
              fontSize: 'clamp(20px, 2.2vw, 28px)', fontWeight: 800, letterSpacing: '-.03em',
              color: INK
            }}>{pairLabel(t.libraryKinds, kind, kind)}</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))',
              gap: 'clamp(14px, 2vw, 22px)'
            }}>
              {works.filter(w => w.kind === kind).map(w => (
                <WorkCard key={w.k} w={w} lang={lang} num={num} t={t} showWriter={false} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
