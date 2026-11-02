import React from 'react';
import { ArrowRight, Download } from 'lucide-react';

// Rupok Books, the reading app (its own product, at the address set in CMS →
// Settings → books_url), told in the look of whichever site shows it: the main
// site's comic paper, Stories' literary page, Originals' screening room.
// Hidden while books_url is empty.

export const BOOKS_NAME = { en: 'Rupok Books', bn: 'রূপক বুকস' };

/** The app's address from the site settings, or '' when it is not set. */
export const booksUrlOf = cfg => {
  const url = String(cfg?.books_url || '').trim().replace(/\/+$/, '');
  return /^https?:\/\//.test(url) ? url : '';
};

const COPY = {
  en: {
    eyebrow: { main: 'New from Rupok', stories: 'For whole books', originals: 'From the studio' },
    title: 'Read it, hear it, ask it.',
    body: 'Our reading app: Bangla classics and your own books, read aloud sentence by sentence, with a companion that answers only from the book — and only up to where you have read. In your browser, or on Windows, macOS, Android and iPhone.',
    open: 'Open Rupok Books',
    apps: 'Get the apps'
  },
  bn: {
    eyebrow: { main: 'রূপকের নতুন', stories: 'পুরো বই পড়ার জন্য', originals: 'স্টুডিও থেকে' },
    title: 'পড়ুন, শুনুন, জিজ্ঞেস করুন।',
    body: 'আমাদের পড়ার অ্যাপ: বাংলা ক্লাসিক আর আপনার নিজের বই, বাক্যে বাক্যে পড়ে শোনানো, আর এক জন সঙ্গী যে শুধু বই থেকেই উত্তর দেয় — আপনি যতটুকু পড়েছেন, ততটুকুই। ব্রাউজারে, অথবা উইন্ডোজ, ম্যাকওএস, অ্যান্ড্রয়েড ও আইফোনে।',
    open: 'রূপক বুকস খুলুন',
    apps: 'অ্যাপ নিন'
  }
};

// The demo page: Bangla whatever the reader's language, one sentence lit as if spoken
const SAMPLE = ['আষাঢ়ের প্রথম দিনে মেঘ নামল গাঁয়ের ওপর।', 'নদীর জল সকাল থেকেই ফুলে উঠছিল।', 'ঘাটের সিঁড়িতে বসে মিনু গুনছিল কটা নৌকা ফিরল।'];

const LOOKS = {
  main: {
    card: { background: '#fff', border: '2px solid #151515', borderRadius: 24, boxShadow: '8px 8px 0 #151515' },
    fg: '#151515', muted: '#55524a', eyebrow: '#6f6758',
    title: { fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, letterSpacing: '-.03em' },
    primary: { background: '#151515', color: '#f4f1ea', border: '2px solid #151515', boxShadow: '4px 4px 0 #f5c542' },
    secondary: { background: '#fff', color: '#151515', border: '2px solid #151515' },
    page: { background: '#f4f1ea', border: '2px solid #151515', color: '#151515' }
  },
  stories: {
    card: { background: '#fff', border: '1px solid #e2d8c8', borderRadius: 18, boxShadow: '0 1px 2px rgba(0,0,0,.06), 0 12px 32px -20px rgba(0,0,0,.35)' },
    fg: '#1c1917', muted: '#6b625a', eyebrow: '#9a3412',
    title: { fontFamily: "'Literata', 'Noto Serif Bengali', Georgia, serif", fontWeight: 600, letterSpacing: '-.01em' },
    primary: { background: '#9a3412', color: '#fff', border: '1px solid #9a3412' },
    secondary: { background: 'transparent', color: '#1c1917', border: '1px solid #d6ccbb' },
    page: { background: '#faf6ee', border: '1px solid #e2d8c8', color: '#1c1917' }
  },
  originals: {
    card: { background: '#161514', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, boxShadow: '0 30px 60px -30px rgba(0,0,0,.8)' },
    fg: '#f5f5f4', muted: '#a8a29e', eyebrow: '#f5c542',
    title: { fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, letterSpacing: '-.02em' },
    primary: { background: '#f5c542', color: '#111', border: '1px solid #f5c542' },
    secondary: { background: 'rgba(255,255,255,.08)', color: '#f5f5f4', border: '1px solid rgba(255,255,255,.2)' },
    page: { background: '#fbfaf7', border: '1px solid rgba(255,255,255,.1)', color: '#151515' }
  }
};

export default function BooksPromo({ url, lang, theme = 'main' }) {
  if (!url) return null;
  const c = COPY[lang] || COPY.en;
  const L = LOOKS[theme] || LOOKS.main;
  const btn = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 20px', borderRadius: theme === 'main' ? 14 : 10, fontWeight: 700, fontSize: 15, textDecoration: 'none' };
  const ext = { target: '_blank', rel: 'noopener' };

  return (
    <section data-screen-label="Rupok Books" aria-labelledby={`books-${theme}`} style={{ padding: 'clamp(48px, 6vw, 88px) clamp(12px, 1.8vw, 24px) 0', position: 'relative', zIndex: 1 }}>
      <div style={{ ...L.card, maxWidth: theme === 'main' ? 1440 : 1240, margin: '0 auto', padding: 'clamp(24px, 4vw, 52px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 'clamp(24px, 4vw, 56px)', alignItems: 'center', color: L.fg }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: L.eyebrow }}>
            {c.eyebrow[theme] || c.eyebrow.main} · {BOOKS_NAME[lang] || BOOKS_NAME.en}
          </span>
          <h2 id={`books-${theme}`} style={{ ...L.title, margin: 0, fontSize: 'clamp(30px, 3.6vw, 48px)', lineHeight: 1.1, textWrap: 'balance' }}>{c.title}</h2>
          <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.7, color: L.muted, maxWidth: 560 }}>{c.body}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
            <a href={`${url}/`} {...ext} style={{ ...btn, ...L.primary }}>{c.open} <ArrowRight size={17} aria-hidden="true" /></a>
            <a href={`${url}/download`} {...ext} style={{ ...btn, ...L.secondary }}><Download size={17} aria-hidden="true" /> {c.apps}</a>
          </div>
        </div>
        <div aria-hidden="true" style={{ ...L.page, borderRadius: 16, padding: 'clamp(18px, 2.4vw, 28px)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', opacity: 0.6 }}>{lang === 'bn' ? 'শুনছেন · অধ্যায় ১' : 'Listening · Chapter 1'}</span>
          <p lang="bn" style={{ margin: 0, fontFamily: "'Hind Siliguri', 'Noto Serif Bengali', serif", fontSize: 'clamp(17px, 1.5vw, 20px)', lineHeight: 1.9 }}>
            {SAMPLE.map((s, i) => (
              <span key={i} style={i === 1 ? { background: '#f5c542', color: '#151515', borderRadius: 4, boxShadow: '0 0 0 3px #f5c542' } : undefined}>{s} </span>
            ))}
          </p>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#151515', flex: 'none' }} />
            <span style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(0,0,0,.1)', overflow: 'hidden' }}>
              <span style={{ display: 'block', width: '45%', height: '100%', background: '#151515' }} />
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
