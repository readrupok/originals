import React from 'react';
import { IArrowRight, IExternal, IMail } from '../components/icons';

const AC = ['#b45309', '#1d6fa5', '#0f766e', '#6d28d9'];
const ROLE_ACCENTS = ['#b45309', '#1d6fa5', '#0f766e', '#6d28d9', '#c43c29'];

const ROLES_INFO = [
  {
    key: 'ep',
    color: '#b45309',
    bg: '#fef3c7',
    deptEn: 'Vision, leadership and production',
    deptBn: 'ভাবনা, নেতৃত্ব আর নির্মাণ',
    defaultBioEn: 'A software developer and creative technologist who founded Rupok to bring Bengal’s sultans, rebels and folk tales to a new generation — on screen, on the page and in Stories.',
    defaultBioBn: 'সফটওয়্যার ডেভেলপার ও ক্রিয়েটিভ টেকনোলজিস্ট। বাংলার সুলতান, বিদ্রোহী আর লোককথাকে নতুন প্রজন্মের কাছে পৌঁছে দিতে — পর্দায়, পাতায় আর গল্পে — তিনি গড়ে তুলেছেন রূপক।',
    image: '/assets/founder.jpg',
    rotate: '-2.5deg'
  },
  {
    key: 'pm',
    color: '#1d6fa5',
    bg: '#e0f2fe',
    deptEn: 'Schedules, coordination and delivery',
    deptBn: 'সময়সূচি, সমন্বয় আর সময়মতো প্রকাশ',
    defaultBioEn: 'Keeps every episode, comic issue and release on schedule, and the team moving together.',
    defaultBioBn: 'প্রতিটি পর্ব, কমিকসের সংখ্যা আর প্রকাশ যেন সময়মতো হয়, দল যেন একসঙ্গে এগোয় — সেটা দেখেন তিনি।',
    rotate: '1.8deg'
  },
  {
    key: 'nl',
    color: '#0f766e',
    bg: '#ccfbf1',
    deptEn: 'Research, scripts and dialogue',
    deptBn: 'গবেষণা, চিত্রনাট্য আর সংলাপ',
    defaultBioEn: 'Digs through Bengal’s history and folklore, and shapes what turns up into scripts, dialogue and comic stories.',
    defaultBioBn: 'বাংলার ইতিহাস আর লোককথা ঘেঁটে যা পান, তা দিয়ে গড়েন চিত্রনাট্য, সংলাপ আর কমিকসের কাহিনি।',
    rotate: '-1.5deg'
  },
  {
    key: 'ad',
    color: '#6d28d9',
    bg: '#f3e8ff',
    deptEn: 'Look, colour and art',
    deptBn: 'চেহারা, রং আর আঁকা',
    defaultBioEn: 'Decides how Rupok looks — characters, worlds, light and colour, down to every comic cover.',
    defaultBioBn: 'রূপক দেখতে কেমন হবে, তা ঠিক করেন — চরিত্র, জগৎ, আলো আর রং, এমনকি প্রতিটি কমিকসের প্রচ্ছদ।',
    rotate: '2.2deg'
  },
  {
    key: 'pl',
    color: '#c43c29',
    bg: '#ffe4df',
    deptEn: 'Stories, its writers and readers',
    deptBn: 'গল্প, লেখক আর পাঠক',
    defaultBioEn: 'Looks after Stories and its writers: finding new voices, editing, and getting their work in front of readers.',
    defaultBioBn: 'গল্প বিভাগ আর তার লেখকদের দেখভাল করেন — নতুন কণ্ঠ খুঁজে আনা, সম্পাদনা, আর লেখা পাঠকের কাছে পৌঁছে দেওয়া।',
    rotate: '-2deg'
  }
];

export default function Studio({ lang, base, series, comics, library_works, num, t }) {
  const nSeries = num(series?.length || 7, lang);
  const nComics = num(comics?.length || 7, lang);
  const nLibrary = num(library_works?.length || 0, lang);

  const rawRoles = Array.isArray(t.studioRoles) && t.studioRoles.length ? t.studioRoles : [
    [lang === 'bn' ? 'এক্সিকিউটিভ প্রযোজক' : 'Executive Producer', t.founder || (lang === 'bn' ? 'মো. রুবায়েত ইসলাম' : 'Md. Rubayet Islam')],
    [lang === 'bn' ? 'প্রোডাকশন ম্যানেজার' : 'Production Manager', lang === 'bn' ? 'শীঘ্রই ঘোষণা করা হবে' : 'To be announced'],
    [lang === 'bn' ? 'কাহিনি প্রধান' : 'Narrative Lead', lang === 'bn' ? 'শীঘ্রই ঘোষণা করা হবে' : 'To be announced'],
    [lang === 'bn' ? 'শিল্প নির্দেশক' : 'Art Director', lang === 'bn' ? 'শীঘ্রই ঘোষণা করা হবে' : 'To be announced'],
    [lang === 'bn' ? 'প্রকাশনা প্রধান' : 'Publishing Lead', lang === 'bn' ? 'শীঘ্রই ঘোষণা করা হবে' : 'To be announced']
  ];

  const roles = rawRoles.map(([title, name], i) => {
    const meta = ROLES_INFO[i] || ROLES_INFO[0];
    const isFounder = i === 0;
    const isTba = !name || /announced|tba|শীঘ্রই|শিগগির|ঘোষিত|জানানো হবে/i.test(name);
    const customBio = Array.isArray(t.studioRoleBios) && t.studioRoleBios[i]?.[1];
    const bio = customBio || (lang === 'bn' ? meta.defaultBioBn : meta.defaultBioEn);

    return {
      index: i,
      key: meta.key,
      title: title || (lang === 'bn' ? 'ভূমিকা' : 'Role'),
      name: name || (lang === 'bn' ? 'শীঘ্রই ঘোষণা করা হবে' : 'To be announced'),
      bio,
      ac: meta.color,
      bg: meta.bg,
      dept: lang === 'bn' ? meta.deptBn : meta.deptEn,
      // Photos come from Page content → studioRoleImages, in the same order as the roles
      image: (Array.isArray(t.studioRoleImages) && t.studioRoleImages[i]) || (isFounder && !Array.isArray(t.studioRoleImages) ? '/assets/founder.jpg' : null),
      rotate: meta.rotate,
      isTba
    };
  });

  return (
    <div style={{ color: '#151515' }}>
      {/* Header */}
      <header
        data-screen-label="Studio — Header"
        style={{ padding: 'clamp(28px, 4.5vh, 64px) clamp(12px, 1.8vw, 24px) clamp(20px, 3vh, 32px)' }}
      >
        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span
            style={{
              alignSelf: 'flex-start',
              padding: '6px 14px',
              border: '2px solid #151515',
              borderRadius: 999,
              background: '#fff',
              fontWeight: 800,
              fontSize: 13,
              boxShadow: '3px 3px 0 #151515'
            }}
          >
            {t.eyebrowStudio}
          </span>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Sora', 'Hind Siliguri', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(40px, 5.5vw, 84px)',
              lineHeight: 0.98,
              letterSpacing: '-.045em',
              textWrap: 'balance'
            }}
          >
            {t.h1StudioA}{' '}
            <span
              style={{
                background: 'linear-gradient(transparent 60%, #e8e2d2 60%, #e8e2d2 92%, transparent 92%)'
              }}
            >
              {t.h1StudioB}
            </span>
          </h1>
          <p style={{ margin: 0, maxWidth: 680, fontSize: 'clamp(16px, 1.3vw, 19px)', lineHeight: 1.65, color: '#33312b' }}>
            {t.bodyStudio}
          </p>
        </div>
      </header>

      {/* Founder Spotlight: The Dedicated Permanent Founder Section */}
      <section
        data-screen-label="Studio — Founder"
        style={{ padding: '0 clamp(12px, 1.8vw, 24px) clamp(56px, 7vw, 96px)' }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: 'clamp(40px, 5vw, 80px)',
            alignItems: 'center'
          }}
        >
          {/* Left: Founder Physical Polaroid with Tape Strip */}
          <div
            style={{
              position: 'relative',
              justifySelf: 'center',
              width: 'min(100%, 420px)',
              padding: '16px 16px 68px',
              background: '#fff',
              border: '2px solid #151515',
              boxShadow: '10px 10px 0 #151515',
              transform: 'rotate(-2.5deg)'
            }}
          >
            {/* Masking Tape strip */}
            <span
              style={{
                position: 'absolute',
                left: '50%',
                top: -16,
                width: 120,
                height: 32,
                translate: '-50% 0',
                rotate: '4deg',
                background: 'rgba(232, 226, 210, 0.9)',
                border: '1px solid rgba(21, 21, 21, 0.2)',
                zIndex: 2
              }}
            />
            <div style={{ position: 'relative', aspectRatio: '4/5', background: '#e8e2d2', border: '2px solid #151515', overflow: 'hidden' }}>
              <img src={roles[0]?.image || '/assets/founder.jpg'} alt={t.founder} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
            <div
              style={{
                position: 'absolute',
                left: 12,
                right: 12,
                bottom: 14,
                textAlign: 'center'
              }}
            >
              <div
                style={{
                  fontFamily: "'Bangers', 'Hind Siliguri', cursive",
                  fontSize: 26,
                  letterSpacing: '.04em',
                  lineHeight: 1.15,
                  color: '#151515'
                }}
              >
                {t.founder}
              </div>
              {t.founderRole && (
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '.05em',
                    textTransform: 'uppercase',
                    color: '#6b675e',
                    marginTop: 4
                  }}
                >
                  {t.founderRole} · {t.founderLoc}
                </div>
              )}
            </div>
          </div>

          {/* Right: Founder Profile & Bio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: '#c43c29',
                  background: '#ffe4df',
                  padding: '4px 10px',
                  border: '1.5px solid #151515',
                  borderRadius: 4,
                  display: 'inline-block',
                  marginBottom: 8
                }}
              >
                {t.founderK || (lang === 'bn' ? 'প্রতিষ্ঠাতা' : 'The Founder')}
              </span>
              <h2
                style={{
                  margin: '4px 0 0',
                  fontFamily: "'Sora', 'Hind Siliguri', sans-serif",
                  fontWeight: 800,
                  fontSize: 'clamp(32px, 3.6vw, 52px)',
                  lineHeight: 1.05,
                  letterSpacing: '-.03em',
                  color: '#151515'
                }}
              >
                {t.founder}
              </h2>
              {t.founderRole && (
                <div style={{ fontSize: 15, fontWeight: 700, color: '#6b675e', marginTop: 6 }}>
                  {t.founderRole} — {t.founderLoc}
                </div>
              )}
            </div>

            <p style={{ margin: 0, maxWidth: 620, fontSize: 'clamp(15px, 1.15vw, 17px)', lineHeight: 1.7, color: '#33312b' }}>
              {t.founderBio || t.founderB}
            </p>

            {/* Portfolio & Contact Links */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, paddingTop: 4 }}>
              {t.founderSite && (
                <a
                  href={`https://${t.founderSite}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    background: '#151515',
                    color: '#fff',
                    fontFamily: "'Bangers', 'Hind Siliguri', cursive",
                    fontSize: 16,
                    letterSpacing: '.05em',
                    textDecoration: 'none',
                    border: '2px solid #151515',
                    boxShadow: '4px 4px 0 #c43c29',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <span>{t.founderSite}</span>
                  <span aria-hidden="true"><IExternal /></span>
                </a>
              )}
              {t.founderEmail && (
                <a
                  href={`mailto:${t.founderEmail}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    background: '#fff',
                    color: '#151515',
                    fontFamily: "'Bangers', 'Hind Siliguri', cursive",
                    fontSize: 16,
                    letterSpacing: '.05em',
                    textDecoration: 'none',
                    border: '2px solid #151515',
                    boxShadow: '4px 4px 0 #151515'
                  }}
                >
                  <span>{t.founderEmail}</span>
                  <span aria-hidden="true"><IMail /></span>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Studio Roles: 5 Physical Polaroids on the Studio Desk (Like the Founder Section) */}
      <section
        data-screen-label="Studio — Five Roles"
        style={{ padding: '0 clamp(12px, 1.8vw, 24px) clamp(56px, 7vw, 104px)' }}
      >
        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 36 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  color: '#b45309',
                  background: '#fef3c7',
                  padding: '4px 10px',
                  border: '1.5px solid #151515',
                  borderRadius: 4,
                  display: 'inline-block',
                  marginBottom: 8
                }}
              >
                {t.teamEyebrow || (lang === 'bn' ? 'নেতৃত্ব' : 'Leadership')}
              </span>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'Sora', 'Hind Siliguri', sans-serif",
                  fontWeight: 800,
                  fontSize: 'clamp(30px, 3.8vw, 54px)',
                  lineHeight: 1.05,
                  letterSpacing: '-.03em',
                  color: '#151515'
                }}
              >
                {t.teamH || (lang === 'bn' ? 'রূপকের নেপথ্যের দায়িত্বসমূহ' : 'The roles behind Rupok')}
              </h2>
            </div>
            <p style={{ margin: 0, maxWidth: 520, fontSize: 'clamp(14px, 1.1vw, 16px)', lineHeight: 1.6, color: '#6b675e' }}>
              {t.teamSub || (lang === 'bn' ? 'গবেষণা থেকে শুরু করে পর্দা, কমিকসের পাতা ও লেখার পাতা পর্যন্ত — প্রতিটি গল্পকে যাঁরা এগিয়ে নেন।' : 'The people who carry each story from research to the screen, the comic page and the written page.')}
            </p>
          </div>

          {/* 5 Physical Polaroid Cards laid out side-by-side */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))',
              gap: 'clamp(24px, 2.5vw, 32px)',
              alignItems: 'stretch'
            }}
          >
            {roles.map((r, i) => (
              <div
                key={r.title}
                style={{
                  position: 'relative',
                  padding: '16px 14px 20px',
                  background: '#fff',
                  border: '2px solid #151515',
                  boxShadow: `7px 7px 0 ${r.ac}`,
                  transform: `rotate(${r.rotate})`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  borderRadius: 2,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Masking Tape Strip */}
                <span
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: -14,
                    width: 76,
                    height: 24,
                    translate: '-50% 0',
                    rotate: i % 2 === 0 ? '3deg' : '-3.5deg',
                    background: 'rgba(232, 226, 210, 0.9)',
                    border: '1px solid rgba(21, 21, 21, 0.25)',
                    zIndex: 2
                  }}
                />

                {/* 4:5 Photo or Stylized Studio Artwork */}
                <div style={{ position: 'relative', aspectRatio: '4/5', background: '#e8e2d2', border: '1.5px solid #151515', overflow: 'hidden' }}>
                  {r.image ? (
                    <img src={r.image} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        background: `radial-gradient(${r.ac}20 1px, transparent 1.5px), #f4f1ea`,
                        backgroundSize: '10px 10px',
                        color: r.ac,
                        padding: 16,
                        textAlign: 'center'
                      }}
                    >
                      {r.key === 'pm' && (
                        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m4 11 16-5M4 11v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M4 11l16-5M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H4V6z" />
                          <path d="m8 6 2-2m4 0-2 2m4-2-2 2" />
                        </svg>
                      )}
                      {r.key === 'nl' && (
                        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                          <path d="m14 7-4 4v2h2l4-4-2-2z" />
                        </svg>
                      )}
                      {r.key === 'ad' && (
                        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                          <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                          <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                          <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                        </svg>
                      )}
                      {r.key === 'pl' && (
                        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                      )}
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#78716c' }}>
                        {lang === 'bn' ? 'শীঘ্রই ঘোষণা করা হবে' : 'To be announced'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Polaroid Text & Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        color: r.ac,
                        background: r.bg,
                        padding: '2px 8px',
                        borderRadius: 3,
                        border: '1px solid #151515'
                      }}
                    >
                      {r.title}
                    </span>
                    <span style={{ fontFamily: "'Bangers', cursive", fontSize: 15, color: '#78716c' }}>
                      {num('0' + (i + 1), lang)}
                    </span>
                  </div>

                  <div
                    style={{
                      fontFamily: "'Bangers', 'Hind Siliguri', cursive",
                      fontSize: 21,
                      letterSpacing: '.03em',
                      lineHeight: 1.15,
                      color: '#151515',
                      marginTop: 2
                    }}
                  >
                    {r.name}
                  </div>

                  <p style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.5, color: '#55524a', flex: 1 }}>
                    {r.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What we make: animation, comics and the Library */}
      <section
        data-screen-label="Studio — What we make"
        style={{ padding: '0 clamp(12px, 1.8vw, 24px) clamp(56px, 7vw, 104px)' }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: '0 auto',
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: 22
          }}
        >
          <a
            href={`${base}/series`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 40,
              minHeight: 300,
              padding: 'clamp(24px, 3vw, 40px)',
              borderRadius: 20,
              background: '#151515',
              color: '#f4f1ea',
              textDecoration: 'none',
              boxShadow: '8px 8px 0 #b45309',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translate(-3px, -3px) rotate(-.5deg)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.color = '#f4f1ea';
            }}
          >
            <span style={{ fontFamily: "'Bangers', cursive", fontSize: 'clamp(90px, 10vw, 150px)', lineHeight: 0.8 }}>
              {nSeries}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, fontSize: 'clamp(26px, 2.6vw, 36px)', lineHeight: 1.05 }}>
                {t.m1h}
              </span>
              <span style={{ fontSize: 16, color: '#c9c5bb', maxWidth: 420 }}>
                {t.m1b}
              </span>
            </span>
          </a>

          <a
            href={`${base}/comics`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 40,
              minHeight: 300,
              padding: 'clamp(24px, 3vw, 40px)',
              borderRadius: 20,
              background: '#fff',
              color: '#151515',
              border: '2px solid #151515',
              textDecoration: 'none',
              boxShadow: '8px 8px 0 #1d6fa5',
              backgroundImage: 'radial-gradient(rgba(21, 21, 21, 0.08) 1.3px, transparent 1.7px)',
              backgroundSize: '10px 10px',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translate(-3px, -3px) rotate(.5deg)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <span style={{ fontFamily: "'Bangers', cursive", fontSize: 'clamp(90px, 10vw, 150px)', lineHeight: 0.8 }}>
              {nComics}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, fontSize: 'clamp(26px, 2.6vw, 36px)', lineHeight: 1.05 }}>
                {t.m2h}
              </span>
              <span style={{ fontSize: 16, color: '#55524a', maxWidth: 420 }}>
                {t.m2b}
              </span>
            </span>
          </a>

          <a
            href={`${base}/stories`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 40,
              minHeight: 300,
              padding: 'clamp(24px, 3vw, 40px)',
              borderRadius: 20,
              background: '#f4ead8',
              color: '#151515',
              border: '2px solid #151515',
              textDecoration: 'none',
              boxShadow: '8px 8px 0 #0f766e',
              backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 27px, rgba(21, 21, 21, 0.07) 27px 28px)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translate(-3px, -3px) rotate(-.5deg)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <span style={{ fontFamily: "'Bangers', cursive", fontSize: 'clamp(90px, 10vw, 150px)', lineHeight: 0.8 }}>
              {nLibrary}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, fontSize: 'clamp(26px, 2.6vw, 36px)', lineHeight: 1.05 }}>
                {t.m3h || (lang === 'bn' ? 'গল্প' : 'Stories')}
              </span>
              <span style={{ fontSize: 16, color: '#55524a', maxWidth: 420 }}>
                {t.m3b}
              </span>
            </span>
          </a>
        </div>
      </section>

      {/* Production Process: 4 Steps */}
      <section data-screen-label="Studio — Process" style={{ padding: 'clamp(56px, 7vw, 104px) clamp(12px, 1.8vw, 24px)', borderTop: '2px solid #151515' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%' }}>
          <h2 style={{ margin: '0 0 32px', fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, fontSize: 'clamp(34px, 4.4vw, 64px)', lineHeight: 1, letterSpacing: '-.04em' }}>
            {t.processH}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 22 }}>
            {t.steps.map(([h, b], i) => (
              <div
                key={h}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: '26px 24px',
                  borderRadius: 16,
                  background: '#fff',
                  border: '2px solid #151515',
                  boxShadow: `6px 6px 0 ${AC[i % 4]}`,
                  transform: `rotate(${[-1, 0.8, -0.6, 1][i % 4]}deg)`
                }}
              >
                <span style={{ fontFamily: "'Bangers', cursive", fontSize: 48, lineHeight: 1, color: AC[i % 4] }}>
                  {num('0' + (i + 1), lang)}
                </span>
                <span style={{ fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, fontSize: 23, lineHeight: 1.1 }}>
                  {h}
                </span>
                <span style={{ fontSize: 15, lineHeight: 1.6, color: '#33312b' }}>
                  {b}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Collaboration Callout */}
      <section style={{ padding: '0 clamp(12px, 1.8vw, 24px) clamp(72px, 8vw, 112px)' }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', width: '100%', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 24 }}>
          <span style={{ fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, fontSize: 'clamp(26px, 3.2vw, 46px)', lineHeight: 1.08, letterSpacing: '-.03em', maxWidth: 760 }}>
            {t.ctaStudioH}
          </span>
          <a
            href={`${base}/contact`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '15px 24px',
              borderRadius: 14,
              background: '#151515',
              color: '#f4f1ea',
              border: '2px solid #151515',
              boxShadow: '5px 5px 0 #6d28d9',
              fontWeight: 700,
              fontSize: 15,
              textDecoration: 'none'
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#f4f1ea')}
          >
            {t.ctaStudioBtn} <IArrowRight />
          </a>
        </div>
      </section>
    </div>
  );
}
