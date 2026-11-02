import React, { useState } from 'react';
import { api } from '../services/api';
import { IFlag, IClose, ICheck } from './icons';
import { fieldStyle, inkButton, errorStyle } from './formStyles';

const INK = 'var(--ink, var(--ink, #151515))';

/**
 * Report a piece or a comment. Signed-in readers only: an anonymous report
 * button is a spam cannon, and the server refuses it anyway.
 */
export default function ReportButton({ targetType, targetId, user, t, base = '', compact = false }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [state, setState] = useState({ busy: false, done: false, error: null });

  const reasons = Array.isArray(t.reportReasons) ? t.reportReasons : [];

  const close = () => {
    setOpen(false);
    setReason('');
    setDetails('');
    setState({ busy: false, done: false, error: null });
  };

  const submit = async e => {
    e.preventDefault();
    if (!reason) return;
    setState({ busy: true, done: false, error: null });
    const r = await api.report({ target_type: targetType, target_id: targetId, reason, details });
    // A repeat report is still a report the moderators have — say thank you.
    if (r.ok || r.status === 409) setState({ busy: false, done: true, error: null });
    else setState({ busy: false, done: false, error: r.error });
  };

  const trigger = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: compact ? '4px 8px' : '8px 12px',
    borderRadius: 10,
    border: compact ? 'none' : `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
    background: 'transparent',
    color: 'var(--muted, #6b675e)',
    font: 'inherit',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer'
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} style={trigger} aria-haspopup="dialog">
        <IFlag /> {t.reportBtn}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t.reportTitle}
          onClick={e => { if (e.target === e.currentTarget) close(); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100000, display: 'grid', placeItems: 'center',
            padding: 16, background: 'rgba(21, 21, 21, 0.55)'
          }}
        >
          <div
            style={{
              width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
              background: 'var(--paper, var(--paper, #f4f1ea))', border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, borderRadius: 18,
              boxShadow: 'calc(6px * var(--shk, 1)) calc(6px * var(--shk, 1)) 0 var(--acc, #6f6758)', padding: 'clamp(18px, 3vw, 26px)',
              display: 'flex', flexDirection: 'column', gap: 16
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <h2 style={{ margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontSize: 22, fontWeight: 800 }}>
                {t.reportTitle}
              </h2>
              <button type="button" onClick={close} aria-label={t.reportCancel}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 22, color: INK }}>
                <IClose />
              </button>
            </div>

            {!user ? (
              <>
                <p style={{ margin: 0 }}>{t.reportSignIn}</p>
                <a href={`${base}/account`} style={{ ...inkButton(), textAlign: 'center', textDecoration: 'none' }}>
                  {t.acc?.signIn}
                </a>
              </>
            ) : state.done ? (
              <>
                <p style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'center', fontWeight: 700 }}>
                  <ICheck /> {t.reportThanks}
                </p>
                <button type="button" onClick={close} style={inkButton()}>OK</button>
              </>
            ) : (
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {reasons.map(([code, label]) => (
                    <label
                      key={code}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                        borderRadius: 12, border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, cursor: 'pointer',
                        background: reason === code ? 'var(--card, var(--card, #fff))' : 'transparent', fontWeight: reason === code ? 800 : 600
                      }}
                    >
                      <input type="radio" name="reason" value={code} checked={reason === code}
                        onChange={() => setReason(code)} style={{ accentColor: INK }} />
                      {label}
                    </label>
                  ))}
                </fieldset>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 700, fontSize: 14 }}>
                  {t.reportDetails}
                  <textarea
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    maxLength={2000}
                    rows={3}
                    required={reason === 'other'}
                    style={{ ...fieldStyle, minHeight: 90, padding: 12, resize: 'vertical' }}
                  />
                  <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--muted, #6b675e)' }}>{t.reportDetailsHint}</span>
                </label>

                {state.error && <div role="alert" style={errorStyle}>{state.error}</div>}

                <button type="submit" disabled={!reason || state.busy} style={{ ...inkButton(), opacity: !reason ? 0.5 : 1 }}>
                  {t.reportSend}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
