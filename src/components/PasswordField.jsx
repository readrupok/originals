import React, { useId, useState } from 'react';

// The form fields of signing in, joining and the account settings: one look
// on every platform, drawn from the site's theme tokens. --acc-ui is the
// platform's accent: the main site's colour, Stories' rust, Originals' gold.
export const FIELD_STYLE = `
  .af, .acc { --acc-ui: var(--acc, #6f6758); --acc-ui-on: var(--acc-on, #fff); }
  :root[data-site='stories'] .af, :root[data-site='stories'] .acc { --acc-ui: #9a3412; --acc-ui-on: #fff; }
  :root[data-site='originals'] .af, :root[data-site='originals'] .acc { --acc-ui: #f5c542; --acc-ui-on: #151515; }
  .af-field { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
  .af-label-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
  .af-label { font-size: 14px; font-weight: 700; color: var(--ink, #151515); }
  .af-input {
    min-height: 50px; width: 100%; box-sizing: border-box; padding: 0 14px; border-radius: 12px;
    border: calc(2px * var(--bwk, 1)) solid var(--edge, #151515); background: var(--card-2, #f9f7f1);
    font: inherit; font-size: 16px; color: var(--ink, #151515); transition: border-color .15s, box-shadow .15s;
  }
  .af-input:focus { outline: none; border-color: var(--acc-ui); box-shadow: 0 0 0 3px color-mix(in srgb, var(--acc-ui) 28%, transparent); }
  .af-input[readonly] { color: var(--muted, #6b675e); cursor: default; }
  .af-input[readonly]:focus { box-shadow: none; border-color: var(--edge, #151515); }
  .af-input[aria-invalid='true'] { border-color: #dc2626; }
  .af-hint { font-size: 13px; color: var(--muted, #6b675e); line-height: 1.5; }
  .af-pw { position: relative; }
  .af-pw .af-input { padding-right: 76px; }
  .af-eye {
    position: absolute; right: 6px; top: 50%; transform: translateY(-50%); min-height: 36px; padding: 0 12px; border-radius: 9px;
    border: 0; background: transparent; color: var(--muted-2, #55524a); font: inherit; font-size: 13px; font-weight: 800; cursor: pointer;
  }
  .af-eye:hover { background: color-mix(in srgb, var(--ink, #151515) 8%, transparent); color: var(--ink, #151515); }
  .af-caps { font-size: 13px; font-weight: 700; color: #c2410c; }
  .af-meter { display: flex; align-items: center; gap: 10px; }
  .af-bars { flex: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
  .af-bars span { height: 4px; border-radius: 4px; background: color-mix(in srgb, var(--ink, #151515) 12%, transparent); transition: background .2s; }
  .af-meter-l { min-width: 64px; text-align: right; font-size: 12.5px; font-weight: 800; }
  .af-error, .af-ok { margin: 0; padding: 11px 14px; border-radius: 12px; font-size: 14px; font-weight: 600; line-height: 1.5; }
  .af-error {
    border: 1px solid color-mix(in srgb, #dc2626 55%, transparent);
    background: color-mix(in srgb, #dc2626 10%, var(--card, #fff)); color: color-mix(in srgb, #dc2626 72%, var(--ink, #151515));
  }
  .af-ok {
    border: 1px solid color-mix(in srgb, #16a34a 55%, transparent);
    background: color-mix(in srgb, #16a34a 10%, var(--card, #fff)); color: color-mix(in srgb, #16a34a 70%, var(--ink, #151515));
  }
  .af-submit {
    display: inline-flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 52px; padding: 0 20px; border-radius: 14px;
    border: calc(2px * var(--bwk, 1)) solid var(--edge, #151515); background: var(--ink-bg, #151515); color: #fff;
    font: inherit; font-size: 16px; font-weight: 800; cursor: pointer;
    box-shadow: calc(4px * var(--shk, 1)) calc(4px * var(--shk, 1)) 0 var(--acc-ui);
    transition: transform .15s, box-shadow .15s, opacity .15s;
  }
  :root[data-site] .af-submit { background: var(--acc-ui); color: var(--acc-ui-on); border-color: transparent; }
  .af-submit:hover:not(:disabled) { transform: translate(-1px, -1px); box-shadow: calc(6px * var(--shk, 1)) calc(6px * var(--shk, 1)) 0 var(--acc-ui); }
  .af-submit:disabled { opacity: .55; cursor: not-allowed; }
  .af-link {
    align-self: flex-start; min-height: 32px; padding: 4px 0; border: 0; background: none; font: inherit; font-size: 14.5px; font-weight: 700;
    color: var(--ink, #151515); text-decoration: underline; text-underline-offset: 3px; text-decoration-color: color-mix(in srgb, currentColor 35%, transparent); cursor: pointer;
  }
  .af-link:hover { text-decoration-color: currentColor; }
  .af-link.is-quiet { color: var(--muted-2, #55524a); font-size: 13.5px; }
`;

/**
 * 0 empty · 1 too short · 2 weak · 3 good · 4 strong. Length counts most;
 * mixed case, digits and symbols each add a step.
 */
export function pwScore(v) {
  if (!v) return 0;
  if (v.length < 6) return 1;
  const extras = [v.length >= 10, /[a-z]/.test(v) && /[A-Z]/.test(v), /\d/.test(v), /[^A-Za-z0-9]/.test(v)].filter(Boolean).length;
  return extras <= 1 ? 2 : extras === 2 ? 3 : 4;
}

const LEVEL_COLOR = ['transparent', '#dc2626', '#ea580c', '#65a30d', '#16a34a'];

/** A password input with Show/Hide, a Caps Lock warning and, for a new password, a strength meter. */
export default function PasswordField({ words, label, labelAside, value, onChange, autoComplete, minLength, hint, meter, autoFocus, invalid }) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const [caps, setCaps] = useState(false);
  const level = meter ? pwScore(value) : 0;
  const levelLabel = [null, words.pwTooShort, words.pwWeak, words.pwOk, words.pwStrong][level];
  const onKey = e => setCaps(Boolean(e.getModifierState?.('CapsLock')));

  return (
    <div className="af-field">
      <div className="af-label-row">
        <label className="af-label" htmlFor={id}>{label}</label>
        {labelAside}
      </div>
      <div className="af-pw">
        <input
          id={id} className="af-input" type={shown ? 'text' : 'password'} value={value}
          onChange={e => onChange(e.target.value)} onKeyDown={onKey} onKeyUp={onKey} onBlur={() => setCaps(false)}
          required minLength={minLength} autoComplete={autoComplete} autoFocus={autoFocus}
          aria-invalid={invalid ? 'true' : undefined} aria-describedby={hint || meter ? `${id}-d` : undefined}
          spellCheck={false} autoCapitalize="none"
        />
        <button type="button" className="af-eye" onClick={() => setShown(s => !s)} aria-pressed={shown} aria-controls={id}>
          {shown ? words.hide : words.show}
        </button>
      </div>
      {caps && <span className="af-caps" role="status">{words.capsLock}</span>}
      {meter && value ? (
        <div className="af-meter" id={`${id}-d`} aria-live="polite">
          <span className="af-bars" aria-hidden="true">
            {[1, 2, 3, 4].map(n => <span key={n} style={n <= level ? { background: LEVEL_COLOR[level] } : undefined} />)}
          </span>
          <span className="af-meter-l" style={{ color: LEVEL_COLOR[level] }}>{levelLabel}</span>
        </div>
      ) : hint ? <span className="af-hint" id={`${id}-d`}>{hint}</span> : null}
    </div>
  );
}
