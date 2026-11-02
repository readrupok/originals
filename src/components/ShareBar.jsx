import React, { useState } from 'react';
import { IShare, ILink, ICheck } from './icons';
import { siteHref } from '../lib/sites';
import { api } from '../services/api';

const INK = 'var(--ink, var(--ink, #151515))';

// Facebook and WhatsApp are where Rupok's readers actually share things, in
// Bangladesh and in the diaspora, so they get their own buttons. Everything
// else is covered by the phone's own share sheet when there is one.
//
// Link previews are already server-rendered for every page, so each of these
// produces a proper card with the title, description and image.

const chip = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 40,
  padding: '0 14px',
  borderRadius: 12,
  border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
  background: 'var(--card, var(--card, #fff))',
  color: INK,
  font: 'inherit',
  fontWeight: 800,
  fontSize: 14,
  cursor: 'pointer',
  textDecoration: 'none',
  boxShadow: `calc(3px * var(--shk, 1)) calc(3px * var(--shk, 1)) 0 ${INK}`,
  whiteSpace: 'nowrap'
};

function FacebookMark() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ flex: 'none' }}>
      <path fill="currentColor" d="M13.5 22v-8.2h2.8l.4-3.2h-3.2V8.5c0-.9.3-1.6 1.6-1.6h1.7V4.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.3v3.2h2.8V22h3.4z" />
    </svg>
  );
}

function WhatsAppMark() {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ flex: 'none' }}>
      <path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.2-.2-.5-.3z" />
    </svg>
  );
}

export default function ShareBar({ path, url: explicitUrl, title, t, style }) {
  const [copied, setCopied] = useState(false);
  // If an explicit absolute or relative URL is passed, honor it; else resolve `path` via siteHref
  const href = explicitUrl || (path ? siteHref(path) : (typeof window !== 'undefined' ? window.location.href : ''));
  const url = /^https?:\/\//.test(href) || typeof window === 'undefined' ? href : `${window.location.origin}${href}`;
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const track = platform => {
    try {
      api.trackShare({ path: href || path || (typeof window !== 'undefined' ? window.location.pathname : '/'), platform }).catch(() => {});
    } catch { }
  };

  const nativeShare = async () => {
    track('native');
    try {
      await navigator.share({ title, url });
    } catch {
      // The reader closed the sheet — nothing to do.
    }
  };

  const copy = async () => {
    track('copy');
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older browsers: select-and-copy fallback.
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      try { document.execCommand('copy'); } catch { /* nothing else to try */ }
      input.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const enc = encodeURIComponent;

  return (
    <div
      role="group"
      aria-label={t.shareLabel}
      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, ...style }}
    >
      <span style={{ fontWeight: 800, fontSize: 14, marginRight: 2 }}>{t.shareLabel}</span>

      {canNativeShare && (
        <button type="button" onClick={nativeShare} style={chip} aria-label={t.shareLabel}>
          <IShare />
        </button>
      )}

      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`}
        target="_blank" rel="noopener noreferrer"
        onClick={() => track('facebook')}
        style={chip} aria-label="Facebook"
      >
        <FacebookMark /> Facebook
      </a>

      <a
        href={`https://wa.me/?text=${enc(`${title} ${url}`)}`}
        target="_blank" rel="noopener noreferrer"
        onClick={() => track('whatsapp')}
        style={chip} aria-label="WhatsApp"
      >
        <WhatsAppMark /> WhatsApp
      </a>

      <button type="button" onClick={copy} style={chip} aria-live="polite">
        {copied ? <><ICheck /> {t.shareCopied}</> : <><ILink /> {t.shareCopy}</>}
      </button>
    </div>
  );
}
