import React, { useEffect, useId, useRef, useState } from 'react';
import { api } from '../services/api';
import PasswordField, { FIELD_STYLE } from './PasswordField';
import { IArrowRight, IArrowLeft, IMail, ISpinner } from './icons';

// Sign in, create an account, or ask for a reset link: shared by the account
// page and the checkout modal. The account page drives `mode` itself (it
// keeps it in the address, #signup / #forgot); the modal leaves it here.

const fill = (text, values) => String(text || '').replace(/\{(\w+)\}/g, (m, k) => (values[k] ?? m));

// "name@gmial.com" → "name@gmail.com": one or two letters off a common provider
const DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'live.com', 'ymail.com', 'proton.me'];
function distance(x, y) {
  const row = Array.from({ length: y.length + 1 }, (_, i) => i);
  for (let i = 1; i <= x.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= y.length; j++) {
      const cur = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (x[i - 1] === y[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return row[y.length];
}
export function suggestEmail(email) {
  const m = String(email).trim().toLowerCase().match(/^([^@\s]+)@([^@\s]+\.[^@\s]+)$/);
  if (!m || DOMAINS.includes(m[2])) return null;
  const best = DOMAINS.map(d => [d, distance(m[2], d)]).sort((x, y) => x[1] - y[1])[0];
  return best[1] > 0 && best[1] <= 2 ? `${m[1]}@${best[0]}` : null;
}

const RESEND_WAIT = 30;

const AUTH_STYLE = `
  .af { display: flex; flex-direction: column; gap: 18px; }
  .af-tabs {
    display: grid; grid-template-columns: 1fr 1fr; padding: 4px; gap: 4px; border-radius: 14px;
    background: color-mix(in srgb, var(--ink, #151515) 6%, transparent); border: calc(2px * var(--bwk, 1)) solid var(--edge, #151515);
  }
  .af-tab {
    min-height: 42px; border: 0; border-radius: 10px; background: transparent; color: var(--muted-2, #55524a);
    font: inherit; font-size: 15px; font-weight: 800; cursor: pointer; transition: background .15s, color .15s;
  }
  .af-tab:hover { color: var(--ink, #151515); }
  .af-tab[aria-selected='true'] { background: var(--card, #fff); color: var(--ink, #151515); box-shadow: 0 1px 3px rgba(0,0,0,.12); }
  :root[data-site='originals'] .af-tab[aria-selected='true'] { background: #2a2826; }
  .af-form { display: flex; flex-direction: column; gap: 16px; }
  .af-suggest { align-self: flex-start; padding: 0; border: 0; background: none; font: inherit; font-size: 13.5px; color: var(--muted-2, #55524a); cursor: pointer; text-align: left; }
  .af-suggest b { color: var(--ink, #151515); text-decoration: underline; text-underline-offset: 3px; }
  .af-title { margin: 0; font-family: var(--font-display, 'Sora', 'Hind Siliguri', sans-serif); font-size: 22px; font-weight: 800; letter-spacing: -.02em; color: var(--ink, #151515); }
  .af-body { margin: 0; color: var(--muted-2, #55524a); font-size: 15px; line-height: 1.6; }
  .af-agree { margin: 0; font-size: 13px; line-height: 1.6; color: var(--muted, #6b675e); }
  .af-agree a { color: inherit; font-weight: 700; }
  .af-back { display: inline-flex; align-items: center; gap: 6px; text-decoration: none; }
  .af-sent { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; padding: 20px; border-radius: 16px; background: var(--card-2, #f9f7f1); border: calc(2px * var(--bwk, 1)) solid var(--edge, #151515); }
  .af-sent-icon { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; font-size: 20px; background: color-mix(in srgb, var(--acc-ui) 18%, transparent); color: var(--ink, #151515); }
  .af-sent p { margin: 0; line-height: 1.6; }
  .af-sent .af-to { font-weight: 800; word-break: break-all; }
  .af-sent .af-hint { font-size: 13.5px; }
`;

export default function AuthForm({ t, base = '', onAuthed, accent, initialMode = 'signin', mode: modeProp, onModeChange, autoFocus, heading = true }) {
  const a = t.acc;
  const [ownMode, setOwnMode] = useState(initialMode);
  const mode = modeProp || ownMode;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState(null);
  const [wait, setWait] = useState(0);
  const [suggestion, setSuggestion] = useState(null);
  const errorRef = useRef(null);
  const tabsId = useId();
  const isSignUp = mode === 'signup';
  const isForgot = mode === 'forgot';

  const switchTo = next => {
    setError(null);
    setSentTo(null);
    if (onModeChange) onModeChange(next); else setOwnMode(next);
  };

  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  // The resend button waits a little, so a second email is not sent by accident
  useEffect(() => {
    if (wait <= 0) return undefined;
    const id = setTimeout(() => setWait(w => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  const sendReset = async () => {
    setBusy(true);
    setError(null);
    // The server answers the same whether or not the email has an account,
    // so this always ends in the same "check your inbox" message.
    const res = await api.forgotPassword(email.trim());
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    setSentTo(email.trim());
    setWait(RESEND_WAIT);
  };

  const submit = async e => {
    e.preventDefault();
    if (isForgot) { sendReset(); return; }
    setBusy(true);
    setError(null);
    const res = isSignUp
      ? await api.register({ name: name.trim(), email: email.trim(), password })
      : await api.login({ email: email.trim(), password });
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    onAuthed(res.data.user);
  };

  const emailField = (
    <div className="af-field">
      <label className="af-label" htmlFor={`${tabsId}-email`}>{a.email}</label>
      <input
        id={`${tabsId}-email`} className="af-input" type="email" value={email} required autoComplete="email" inputMode="email"
        autoFocus={autoFocus && !isSignUp} spellCheck={false} autoCapitalize="none"
        onChange={e => { setEmail(e.target.value); setSuggestion(null); }}
        onBlur={() => setSuggestion(suggestEmail(email))}
      />
      {suggestion && (
        <button type="button" className="af-suggest" onClick={() => { setEmail(suggestion); setSuggestion(null); }}>
          {fill(a.didYouMean, { email: '\u0000' }).split('\u0000').reduce((out, part, i) => (i ? [...out, <b key={i}>{suggestion}</b>, part] : [part]), [])}
        </button>
      )}
    </div>
  );

  const submitButton = label => (
    <button type="submit" className="af-submit" disabled={busy}>
      <span>{label}</span>
      {busy ? <ISpinner /> : <IArrowRight />}
    </button>
  );

  const errorBox = error && <p ref={errorRef} tabIndex={-1} role="alert" className="af-error">{error}</p>;

  if (isForgot) {
    return (
      <div className="af" style={accent ? { '--acc-ui': accent } : undefined}>
        <style>{FIELD_STYLE + AUTH_STYLE}</style>
        <button type="button" onClick={() => switchTo('signin')} className="af-link is-quiet af-back"><IArrowLeft /> {a.backToSignIn}</button>
        {heading && <h2 className="af-title">{a.forgotTitle}</h2>}
        {sentTo ? (
          <div className="af-sent" role="status">
            <span className="af-sent-icon" aria-hidden="true"><IMail /></span>
            <p>{a.forgotSent}</p>
            <p className="af-to">{fill(a.sentTo, { email: sentTo })}</p>
            <span className="af-hint">{a.checkSpam}</span>
            {errorBox}
            {wait > 0
              ? <span className="af-hint" aria-live="polite">{fill(a.resendIn, { n: wait })}</span>
              : <button type="button" className="af-link" onClick={sendReset} disabled={busy}>{busy ? <ISpinner /> : a.resend}</button>}
          </div>
        ) : (
          <form onSubmit={submit} className="af-form" aria-label={a.forgotTitle}>
            {heading && <p className="af-body">{a.forgotBody}</p>}
            {errorBox}
            {emailField}
            {submitButton(a.forgotSend)}
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="af" style={accent ? { '--acc-ui': accent } : undefined}>
      <style>{FIELD_STYLE + AUTH_STYLE}</style>
      <div className="af-tabs" role="tablist" aria-label={`${a.signIn} / ${a.signUp}`}>
        {[['signin', a.signIn], ['signup', a.signUp]].map(([m, label]) => (
          <button key={m} type="button" role="tab" id={`${tabsId}-${m}`} aria-selected={mode === m} aria-controls={`${tabsId}-form`}
            className="af-tab" onClick={() => mode !== m && switchTo(m)}>{label}</button>
        ))}
      </div>

      <form id={`${tabsId}-form`} role="tabpanel" aria-labelledby={`${tabsId}-${mode}`} onSubmit={submit} className="af-form">
        {errorBox}
        {isSignUp && (
          <div className="af-field">
            <label className="af-label" htmlFor={`${tabsId}-name`}>{a.name}</label>
            <input id={`${tabsId}-name`} className="af-input" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" autoFocus={autoFocus} />
          </div>
        )}
        {emailField}
        <PasswordField
          words={a} label={a.password} value={password} onChange={setPassword}
          autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={isSignUp ? 6 : undefined}
          meter={isSignUp} hint={isSignUp ? a.passwordHint : null}
          labelAside={!isSignUp && <button type="button" className="af-link is-quiet" onClick={() => switchTo('forgot')}>{a.forgot}</button>}
        />
        {submitButton(isSignUp ? a.signUp : a.signIn)}
        {isSignUp && (
          <p className="af-agree">
            {fill(a.agree, { terms: '\u0001', privacy: '\u0002' }).split(/([\u0001\u0002])/).map((part, i) => (
              part === '\u0001' ? <a key={i} href={`${base}/terms`} target="_blank" rel="noopener">{t.termsTitle}</a>
                : part === '\u0002' ? <a key={i} href={`${base}/privacy`} target="_blank" rel="noopener">{t.privacyTitle}</a>
                  : part
            ))}
          </p>
        )}
      </form>
    </div>
  );
}
