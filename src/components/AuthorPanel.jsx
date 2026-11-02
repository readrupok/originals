import React, { useState } from 'react';
import { api } from '../services/api';
import { errorStyle, fieldStyle, inkButton, labelStyle } from './formStyles';
import { IArrowRight } from './icons';
import { X } from 'lucide-react';

// The account page's author section. It has three states: an invitation to
// apply, the status of an application in flight (including why one was turned
// down), and the way in to the author desk once approved.
//
// There is no email in this platform, so every message to an applicant has to
// surface here — this card is the whole notification channel.

const INK = 'var(--ink, var(--ink, #151515))';

const card = {
  display: 'flex', flexDirection: 'column', gap: 16,
  padding: 'clamp(20px, 2.4vw, 32px)', borderRadius: 22,
  border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, background: 'var(--card, var(--card, #fff))', boxShadow: `calc(6px * var(--shk, 1)) calc(6px * var(--shk, 1)) 0 ${INK}`
};
const h2 = { margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontSize: 'clamp(20px, 2vw, 26px)', fontWeight: 800 };
const smallBtn = {
  padding: '11px 17px', borderRadius: 999, border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, background: 'var(--card, var(--card, #fff))',
  color: INK, font: 'inherit', fontWeight: 800, fontSize: 14, cursor: 'pointer',
  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7
};

export default function AuthorPanel({ base, t, author, application }) {
  const [applying, setApplying] = useState(true);

  // Approved and active — straight to the desk.
  if (author && author.status === 'active') {
    return (
      <section style={card} aria-labelledby="acc-author">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
          <h2 id="acc-author" style={h2}>{t.deskTitle}</h2>
          <span style={{
            padding: '4px 11px', borderRadius: 999, border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
            background: 'var(--ink-bg, #151515)', color: '#fff', fontWeight: 800, fontSize: 12
          }}>{t['acc.authorBadge']}</span>
        </div>
        <p style={{ margin: 0, color: 'var(--muted-2, #55524a)', fontSize: 16, lineHeight: 1.6 }}>{t.deskBody}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <a href={`${base}/account/desk`} style={{ ...smallBtn, background: 'var(--ink-bg, #151515)', color: '#fff' }}>
            {t.deskOpen} <IArrowRight />
          </a>
          <a href={`${base}/stories/${author.handle}`} style={smallBtn}>
            {t.deskViewProfile} <IArrowRight />
          </a>
        </div>
      </section>
    );
  }

  if (author && author.status !== 'active') {
    return (
      <section style={card} aria-labelledby="acc-author">
        <h2 id="acc-author" style={h2}>{t.deskTitle}</h2>
        <div style={errorStyle}>
          {t.applySuspended}
          {author.suspend_reason && <div style={{ marginTop: 6, fontWeight: 400 }}>{author.suspend_reason}</div>}
        </div>
      </section>
    );
  }

  if (application?.status === 'pending') {
    return (
      <section style={card} aria-labelledby="acc-author">
        <h2 id="acc-author" style={h2}>{t.applyTitle}</h2>
        <p style={{ margin: 0, color: 'var(--muted-2, #55524a)', fontSize: 16, lineHeight: 1.6 }}>{t.applyPending}</p>
      </section>
    );
  }

  if (applying) {
    return (
      <section style={card} aria-labelledby="acc-author">
        <h2 id="acc-author" style={h2}>{t.applyTitle}</h2>
        <ApplyForm t={t} onDone={() => window.location.reload()} onCancel={() => setApplying(false)} />
      </section>
    );
  }

  return (
    <section style={card} aria-labelledby="acc-author">
      <h2 id="acc-author" style={h2}>{t.applyCta}</h2>
      {application?.status === 'rejected' && (
        <div style={{
          padding: '12px 15px', borderRadius: 12, border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
          background: '#fdf6e3', fontSize: 14.5, lineHeight: 1.55
        }}>
          <strong>{t.applyRejected}</strong>
          {application.reject_reason && (
            <div style={{ marginTop: 6 }}>
              <span style={{ fontWeight: 700 }}>{t.applyRejectReason}: </span>
              {application.reject_reason}
            </div>
          )}
        </div>
      )}
      <p style={{ margin: 0, color: 'var(--muted-2, #55524a)', fontSize: 16, lineHeight: 1.6 }}>{t.applyBody}</p>
      <button type="button" onClick={() => setApplying(true)} style={{ ...inkButton(), alignSelf: 'flex-start' }}>
        {application?.status === 'rejected' ? t.applyResubmit : t.applySubmit}
      </button>
    </section>
  );
}

function ApplyForm({ t, onDone, onCancel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    const res = await api.applyAsAuthor({
      pen_name: f.get('pen_name'),
      handle: String(f.get('handle') || '').toLowerCase().trim(),
      language: f.get('language'),
      bio: f.get('bio'),
      // One link per line is easier to type than a comma-separated list.
      sample_links: String(f.get('sample_links') || '').split('\n').map(s => s.trim()).filter(Boolean),
      sample_text: f.get('sample_text')
    });
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    onDone();
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && <div style={errorStyle}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: 14 }}>
        <label style={labelStyle}>
          {t.applyPenName}
          <input name="pen_name" required maxLength={80} style={fieldStyle} />
        </label>
        <label style={labelStyle}>
          {t.applyHandle}
          <input name="handle" required pattern="[a-z0-9][a-z0-9-]{1,39}" style={fieldStyle} />
          <span style={{ fontSize: 12.5, fontWeight: 400, color: 'var(--muted, #6b675e)' }}>{t.applyHandleHint}</span>
        </label>
      </div>

      <label style={{ ...labelStyle, maxWidth: 240 }}>
        {t.applyLanguage}
        <select name="language" defaultValue="bn" style={fieldStyle}>
          <option value="bn">বাংলা</option>
          <option value="en">English</option>
        </select>
      </label>

      <label style={labelStyle}>
        {t.applyBio}
        <textarea name="bio" required minLength={40} rows={4}
          style={{ ...fieldStyle, minHeight: 110, padding: 12, resize: 'vertical' }} />
        <span style={{ fontSize: 12.5, fontWeight: 400, color: 'var(--muted, #6b675e)' }}>{t.applyBioHint}</span>
      </label>

      <label style={labelStyle}>
        {t.applyLinks}
        <textarea name="sample_links" rows={3} placeholder="https://"
          style={{ ...fieldStyle, minHeight: 86, padding: 12, resize: 'vertical' }} />
        <span style={{ fontSize: 12.5, fontWeight: 400, color: 'var(--muted, #6b675e)' }}>{t.applyLinksHint}</span>
      </label>

      <label style={labelStyle}>
        {t.applySample}
        <textarea name="sample_text" rows={5}
          style={{ ...fieldStyle, minHeight: 130, padding: 12, resize: 'vertical' }} />
      </label>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button type="submit" disabled={busy} style={{ ...inkButton(), opacity: busy ? 0.6 : 1 }}>
          {t.applySubmit}
        </button>
        <button type="button" onClick={onCancel} style={smallBtn} aria-label="Cancel"><X size={15} /></button>
      </div>
    </form>
  );
}
