import React, { useEffect, useState } from 'react';
import { Copy, Check, Smartphone, Landmark, ShieldCheck } from 'lucide-react';
import { INK } from '../data/content';
import AuthForm from './AuthForm';
import { errorStyle, fieldStyle, labelStyle, inkButton } from './formStyles';
import { IArrowRight, IClose, IStar } from './icons';
import { api } from '../services/api';

// Same rules as the server (lib/payments.js): wallets use a mobile number + short TrxID
const PHONE_RE = /^01[3-9]\d{8}$/;
const WALLET_TRX_RE = /^[A-Z0-9]{8,12}$/;
const REF_TRX_RE = /^[A-Z0-9][A-Z0-9\-/]{3,39}$/;

const stepTitle = { fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 10 };
const stepNum = n => (
  <span style={{ width: 26, height: 26, flex: 'none', borderRadius: 8, background: 'var(--ink-bg, #151515)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13 }}>{n}</span>
);

export default function PaymentModal({ pay, onClose, onSubmit, t, lang, series, comics, user, onAuthed, base }) {
  // pay.k may be a comic key, a series key, or (kind 'work') a Library piece,
  // whose title and price the caller passes because they are not in these lists.
  const isWork = pay.kind === 'work';
  const targetComic = isWork ? null
    : comics.find(c => c.k === pay.k) || (pay.kind === 'series' ? null : comics.find(c => c.seriesKey === pay.k && c.locked)) || null;
  const targetSeries = isWork ? {} : series.find(s => s.k === pay.k) || series.find(s => s.k === targetComic?.seriesKey) || {};
  const accent = (isWork ? pay.accent : targetSeries.ac) || INK;

  const plans = [
    isWork && {
      kind: 'work', key: pay.k, h: `${t.planWork} · ${pay.title}`, b: t.planWorkB, price: pay.price, pending: false
    },
    targetComic && targetComic.paid && targetComic.locked && {
      kind: 'comic', key: targetComic.k, h: `${t.planComic} · ${targetComic.issue}`, b: t.planComicB,
      price: targetComic.price_bdt, pending: targetComic.pending
    },
    targetSeries.paid && targetSeries.locked && {
      kind: 'series', key: targetSeries.k, h: t.planPass, b: t.planPassB,
      price: targetSeries.pass_price_bdt, pending: targetSeries.pending
    }
  ].filter(Boolean);

  const [planIdx, setPlanIdx] = useState(() => {
    const wanted = plans.findIndex(p => p.kind === (pay.kind === 'series' || pay.kind === 'work' ? pay.kind : 'comic') && !p.pending);
    return wanted >= 0 ? wanted : Math.max(0, plans.findIndex(p => !p.pending));
  });
  const [methods, setMethods] = useState(null);
  const [methodIdx, setMethodIdx] = useState(0);
  const [sender, setSender] = useState('');
  const [trx, setTrx] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getPaymentMethods().then(r => setMethods(r.ok ? r.data : []));
  }, []);

  const plan = plans[planIdx];
  const method = methods?.[methodIdx];
  const typeLabel = type => (t.payTypes || []).find(([k]) => k === type)?.[1] || type;
  const instructions = method
    ? (lang === 'bn' ? method.instructions_bn || method.instructions_en : method.instructions_en || '')
        .split('\n').filter(Boolean)
        .map(line => line.split('{number}').join(method.account_number).split('{amount}').join(plan?.price || ''))
    : [];

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(method.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const mobile = method ? method.is_mobile !== false : true;

  const submit = async e => {
    e.preventDefault();
    const cleanSender = mobile ? sender.replace(/[\s-]/g, '') : sender.trim();
    const cleanTrx = trx.trim().toUpperCase().replace(/\s+/g, '');
    if (mobile ? !PHONE_RE.test(cleanSender) : cleanSender.length < 3) { setError(mobile ? t.paySenderHint : t.paySenderBankHint); return; }
    if (!(mobile ? WALLET_TRX_RE : REF_TRX_RE).test(cleanTrx)) { setError(mobile ? t.payTrxHint : t.payTrxBankHint); return; }
    setBusy(true);
    setError(null);
    const res = await onSubmit({ key: plan.key, kind: plan.kind, methodId: method.id, senderNumber: cleanSender, transactionId: cleanTrx });
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(res.error);
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 80, display: 'grid', placeItems: 'center', padding: 16, background: 'rgba(21, 21, 21, 0.55)', backdropFilter: 'blur(6px)', animation: 'rs-in 0.25s ease-out' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${t.unlock} ${isWork ? pay.title : targetSeries.title || ''}`}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', width: 'min(540px, 100%)', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', scrollbarWidth: 'none',
          display: 'flex', flexDirection: 'column', gap: 18, padding: 'clamp(20px, 3vw, 32px)', borderRadius: 24,
          background: 'var(--card, var(--card, #fff))', border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, boxShadow: `calc(10px * var(--shk, 1)) calc(10px * var(--shk, 1)) 0 ${accent}`, color: INK
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ position: 'absolute', right: 14, top: 14, width: 40, height: 40, borderRadius: 12, border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, background: 'var(--card, var(--card, #fff))', fontSize: 20, cursor: 'pointer', display: 'grid', placeItems: 'center', color: INK }}
        >
          <IClose />
        </button>

        {/* Title */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', paddingRight: 44 }}>
          <div style={{ flex: 'none', width: 56, aspectRatio: '2/3', border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, borderRadius: 6, background: isWork ? (pay.cover ? `${accent} url(${pay.cover}) center/cover` : accent) : `${accent} url(${targetSeries.poster}) center/cover` }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, background: '#f5c542', border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, fontSize: 13, fontWeight: 800 }}>
              <IStar /> {t.premium}
            </span>
            <span style={{ fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800, fontSize: 22, lineHeight: 1.1 }}>
              {t.unlock} {isWork ? pay.title : targetSeries.title}
            </span>
          </div>
        </div>

        {done ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-testid="payment-submitted">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontWeight: 800, fontSize: 24 }}>
              <ShieldCheck size={28} strokeWidth={2.4} aria-hidden="true" /> {t.paySubmittedH}
            </span>
            <span style={{ fontSize: 16, color: 'var(--muted-2, #55524a)', lineHeight: 1.55 }}>{t.paySubmittedB}</span>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href={`${base}/account`} onClick={onClose} style={{ ...inkButton(accent), textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {t.payViewOrders} <IArrowRight />
              </a>
            </div>
          </div>
        ) : !user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ fontSize: 15, color: 'var(--muted-2, #55524a)', lineHeight: 1.5 }}>{t.acc.buyNote}</span>
            <AuthForm t={t} base={base} accent={accent} onAuthed={onAuthed} initialMode="signup" />
          </div>
        ) : methods === null ? (
          <span className="rs-spinner" aria-label="Loading" style={{ alignSelf: 'center' }} />
        ) : methods.length === 0 ? (
          <div role="alert" style={errorStyle}>{t.payNoMethods}</div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* 1 · What */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={stepTitle}>{stepNum(1)} {t.payStepChoose}</span>
              {plans.map((p, i) => {
                const on = planIdx === i;
                return (
                  <button
                    type="button"
                    key={p.kind}
                    disabled={p.pending}
                    onClick={() => setPlanIdx(i)}
                    aria-pressed={on}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 14,
                      border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, background: on ? accent : 'var(--card, var(--card, #fff))', color: on ? '#fff' : INK, cursor: p.pending ? 'not-allowed' : 'pointer',
                      font: 'inherit', boxShadow: on ? `calc(4px * var(--shk, 1)) calc(4px * var(--shk, 1)) 0 ${INK}` : 'none', opacity: p.pending ? 0.55 : 1, textAlign: 'left'
                    }}
                  >
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 800, fontSize: 16 }}>{p.h}</span>
                      <span style={{ fontSize: 14, opacity: 0.85 }}>{p.pending ? t.payPendingH : p.b}</span>
                    </span>
                    <span style={{ fontFamily: "var(--font-display, 'Sora', sans-serif)", fontWeight: 800, fontSize: 20 }}>{p.price}</span>
                  </button>
                );
              })}
            </div>

            {plan && !plan.pending && (
              <>
                {/* 2 · Send */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <span style={stepTitle}>{stepNum(2)} {t.payStepSend}</span>
                  {methods.length > 1 && (
                    <div role="radiogroup" aria-label={t.payWith} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {methods.map((m, i) => (
                        <button
                          type="button"
                          role="radio"
                          aria-checked={methodIdx === i}
                          key={m.id}
                          onClick={() => { setMethodIdx(i); setSender(''); setTrx(''); setError(null); }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 12, border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
                            background: methodIdx === i ? 'var(--ink-bg, #151515)' : 'var(--card, var(--card, #fff))', color: methodIdx === i ? '#fff' : INK, font: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer'
                          }}
                        >
                          {m.is_mobile === false ? <Landmark size={15} strokeWidth={2.4} aria-hidden="true" /> : <Smartphone size={15} strokeWidth={2.4} aria-hidden="true" />} {m.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, borderRadius: 16, border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, background: 'var(--card-2, #f9f7f1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted, #6b675e)' }}>
                          {method.name} · {typeLabel(method.account_type)}{method.account_name ? ` · ${method.account_name}` : ''}
                        </span>
                        <span data-testid="pay-number" style={{ fontFamily: "var(--font-display, 'Sora', sans-serif)", fontWeight: 800, fontSize: 26, letterSpacing: '.02em' }}>{method.account_number}</span>
                      </div>
                      <button
                        type="button"
                        onClick={copyNumber}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, background: 'var(--card, var(--card, #fff))', font: 'inherit', fontWeight: 800, fontSize: 13, cursor: 'pointer', color: INK }}
                      >
                        {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />} {copied ? t.payCopied : t.payCopy}
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1.5px dashed rgba(21,21,21,.25)', paddingTop: 10 }}>
                      <span style={{ fontWeight: 700 }}>{t.payAmount}</span>
                      <span data-testid="pay-amount" style={{ fontFamily: "var(--font-display, 'Sora', sans-serif)", fontWeight: 800, fontSize: 22 }}>{plan.price}</span>
                    </div>
                    {instructions.length > 0 && (
                      <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14, lineHeight: 1.5 }}>
                        {instructions.map((line, i) => <li key={i}>{line}</li>)}
                      </ol>
                    )}
                  </div>
                </div>

                {/* 3 · Confirm */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <span style={stepTitle}>{stepNum(3)} {t.payStepConfirm}</span>
                  <label style={labelStyle}>
                    {mobile ? t.paySender : t.paySenderBank}
                    <input
                      style={fieldStyle}
                      type={mobile ? 'tel' : 'text'}
                      inputMode={mobile ? 'numeric' : 'text'}
                      autoComplete={mobile ? 'tel' : 'off'}
                      placeholder={mobile ? '01XXXXXXXXX' : ''}
                      value={sender}
                      onChange={e => { setSender(e.target.value); setError(null); }}
                      required
                    />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted, #6b675e)' }}>{mobile ? t.paySenderHint : t.paySenderBankHint}</span>
                  </label>
                  <label style={labelStyle}>
                    {mobile ? t.payTrx : t.payTrxBank}
                    <input
                      style={{ ...fieldStyle, textTransform: 'uppercase', letterSpacing: '.06em' }}
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      placeholder={mobile ? '8N7A6D5C4B' : ''}
                      value={trx}
                      onChange={e => { setTrx(e.target.value); setError(null); }}
                      required
                    />
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted, #6b675e)' }}>{mobile ? t.payTrxHint : t.payTrxBankHint}</span>
                  </label>
                  <span style={{ fontSize: 14, color: 'var(--muted-2, #55524a)' }}>
                    {t.acc.receipt} <b style={{ color: INK }}>{user.email}</b>
                  </span>
                  {error && <div role="alert" style={errorStyle}>{error}</div>}
                  <button type="submit" disabled={busy} style={{ ...inkButton(accent), opacity: busy ? 0.7 : 1, textAlign: 'left' }}>
                    {busy ? t.paySubmitting : t.paySubmit} {!busy && <IArrowRight />}
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
