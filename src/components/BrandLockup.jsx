import React from 'react';
import RupokStoriesMark from './RupokStoriesMark';

// How a Rupok platform signs its name. "Rupok" is the brand, so it is always
// the Rupok logo itself; the platform's own word sits beside it after a rule,
// set in that platform's type and colour — never as one run of text, which
// read as if "Rupok Stories" were a single name.
//
//   [RU/PoK logo] │ Stories      (literary serif, italic, terracotta)
//   [RU/PoK logo] │ ORIGINALS    (wide caps, gold)

export const PLATFORM_WORD = {
  stories: { en: 'Stories', bn: 'গল্প' },
  originals: { en: 'Originals', bn: 'অরিজিনালস' },
  rupok: { en: 'Rupok', bn: 'রূপক' }
};

const WORD_STYLE = {
  stories: {
    fontFamily: "'Literata', 'Noto Serif Bengali', Georgia, serif",
    fontStyle: 'italic', fontWeight: 600, letterSpacing: '-.01em', color: '#9c3a1d', scale: 1
  },
  originals: {
    fontFamily: "'Sora', 'Hind Siliguri', sans-serif",
    fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: '#f5c542', scale: 0.62
  }
};

/**
 * `tone` is the background it sits on: 'light' uses the dark logo, 'dark'
 * the white one. `size` is the logo's height in pixels.
 */
export default function BrandLockup({ site = 'main', lang = 'en', size = 34, tone = 'light', wordColor, compact = false }) {
  const logo = tone === 'dark' ? '/assets/logos/rupok-logo-white.png' : '/assets/logos/rupok-logo.png';
  const isStories = site === 'stories';
  const brandWord = PLATFORM_WORD.rupok[lang] || PLATFORM_WORD.rupok.en;
  const storiesWord = PLATFORM_WORD.stories[lang] || PLATFORM_WORD.stories.en;
  const word = PLATFORM_WORD[site]?.[lang];
  const { scale = 1, ...style } = WORD_STYLE[site] || {};

  const gap = isStories ? Math.max(6, Math.round(size * 0.28)) : Math.round(size * 0.32);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap, userSelect: 'none', verticalAlign: 'middle', lineHeight: 1, flexShrink: 0 }}>
      {isStories ? (
        <RupokStoriesMark height={size} color={tone === 'dark' ? '#ffffff' : '#9c3a1d'} />
      ) : (
        <img src={logo} alt="Rupok" style={{ display: 'block', height: size, width: 'auto' }} />
      )}
      {isStories ? (
        !compact && (
          <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, flexShrink: 0 }}>
            <span
              style={{
                fontFamily: "'DM Sans', 'Hind Siliguri', sans-serif",
                fontWeight: 600,
                fontSize: Math.round(size * 0.68),
                letterSpacing: '-.02em',
                color: tone === 'dark' ? '#fafaf9' : 'var(--ink, #1c1917)'
              }}
            >
              {brandWord}
            </span>
            <span
              style={{
                fontFamily: "'Literata', 'Noto Serif Bengali', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 600,
                letterSpacing: '-.01em',
                color: wordColor || (tone === 'dark' ? '#f2b28c' : 'var(--accent, #9c3a1d)'),
                fontSize: Math.round(size * 0.68),
                whiteSpace: 'nowrap'
              }}
            >
              {storiesWord}
            </span>
          </span>
        )
      ) : (
        word && (
          <>
            <span aria-hidden="true" style={{ alignSelf: 'stretch', width: 1.5, margin: `${Math.round(size * 0.12)}px 0`, background: tone === 'dark' ? 'rgba(255,255,255,.35)' : 'rgba(28,25,23,.25)' }} />
            <span style={{ ...style, ...(wordColor ? { color: wordColor } : {}), fontSize: Math.round(size * 0.68 * scale), lineHeight: 1, whiteSpace: 'nowrap' }}>
              {word}
            </span>
          </>
        )
      )}
    </span>
  );
}

/** The ↗ shown beside a link that opens on another Rupok platform. */
export function PlatformArrow({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none' }}>
      <path d="M7 17 17 7" /><path d="M8 7h9v9" />
    </svg>
  );
}
