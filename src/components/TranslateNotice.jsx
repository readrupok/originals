import React from 'react';
import { INK } from '../data/content';

// The banner above a piece written in the other language.
//
// The original always renders first — translation is an opt-in overlay, never
// a blocking load — so on Firefox and Safari this degrades to a plain notice
// and the reader still gets the piece.

const pairLabel = (pairs, code, fallback) =>
  (Array.isArray(pairs) ? pairs.find(p => Array.isArray(p) && p[0] === code)?.[1] : null) || fallback;

const bar = {
  display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12,
  padding: '11px 15px', border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, borderRadius: 12,
  background: 'var(--card, var(--card, #fff))', fontSize: 14, lineHeight: 1.45, color: 'var(--muted-2, #3c3a35)'
};

const button = {
  padding: '7px 14px', border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, borderRadius: 999,
  background: 'var(--ink-bg, #151515)', color: '#fff', fontWeight: 800, fontSize: 13,
  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap'
};

const ghost = { ...button, background: 'var(--card, var(--card, #fff))', color: INK };

export default function TranslateNotice({ state, from, progress, t, onTranslate, onShowOriginal, onShowTranslated }) {
  const langName = pairLabel(t.trLangNames, from, from);
  const fill = s => String(s || '').replace('{lang}', langName).replace('{n}', progress ?? 0);

  if (state === 'unsupported') {
    return <div style={bar} role="note">{t.trUnsupported}</div>;
  }
  if (state === 'unavailable') {
    return (
      <div style={bar} role="note">
        <span>{fill(t.trOriginalLang)}</span>
        <span style={{ color: 'var(--muted, #6b675e)' }}>{t.trUnavailable}</span>
      </div>
    );
  }
  if (state === 'failed') {
    return (
      <div style={bar} role="alert">
        <span>{t.trFailed}</span>
        <button type="button" style={ghost} onClick={onTranslate}>{t.trTranslate}</button>
      </div>
    );
  }
  if (state === 'downloading') {
    return <div style={bar} role="status" aria-live="polite">{fill(t.trDownloading)}</div>;
  }
  if (state === 'translating') {
    return <div style={bar} role="status" aria-live="polite">{t.trTranslating}</div>;
  }
  if (state === 'translated') {
    return (
      <div style={bar} role="note">
        <span>{fill(t.trTranslated)}</span>
        <button type="button" style={ghost} onClick={onShowOriginal}>{t.trShowOriginal}</button>
      </div>
    );
  }
  if (state === 'original-shown') {
    return (
      <div style={bar} role="note">
        <span>{fill(t.trOriginalLang)}</span>
        <button type="button" style={ghost} onClick={onShowTranslated}>{t.trShowTranslated}</button>
      </div>
    );
  }
  if (state === 'checking') {
    // The language is stated immediately; the button only appears once we know
    // this browser can actually honour it.
    return (
      <div style={bar} role="note">
        <span>{fill(t.trOriginalLang)}</span>
        <button type="button" style={{ ...ghost, opacity: 0.5, cursor: 'default' }} disabled>
          {t.trTranslate}
        </button>
      </div>
    );
  }

  // 'ready' — offered, not yet taken up.
  return (
    <div style={bar} role="note">
      <span>{fill(t.trOriginalLang)}</span>
      <button type="button" style={button} onClick={onTranslate}>{t.trTranslate}</button>
    </div>
  );
}
