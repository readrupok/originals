import React, { useCallback, useEffect, useState } from 'react';
import { INK, fill } from '../data/content';
import { api } from '../services/api';
import { errorStyle, fieldStyle, inkButton, labelStyle } from './formStyles';
import { ICheck, ISpinner } from './icons';

// The desk's Earnings tab: the Author Programme from the author's side
// (README.md → Author Programme). It walks an invited author through the three steps —
// agreement, payout details, then pricing in the editor — and afterwards shows
// what they have earned and been paid.

const card = {
  display: 'flex', flexDirection: 'column', gap: 14, padding: 'clamp(18px, 2.2vw, 26px)',
  border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, borderRadius: 18, background: 'var(--card, var(--card, #fff))', boxShadow: `calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 ${INK}`
};
const h3 = { margin: 0, fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontSize: 20, fontWeight: 800 };
const pairs = v => (Array.isArray(v) ? v : []);
const labelOf = (list, code) => pairs(list).find(([k]) => k === code)?.[1] || code;

export default function AuthorEarnings({ lang, t, num }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const r = await api.myProgramme();
    if (r.ok) setData(r.data);
    else setError(r.error);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <div role="alert" style={errorStyle}>{error}</div>;
  if (!data) return <p style={{ color: 'var(--muted, #6b675e)' }}><ISpinner /></p>;

  const s = data.settings;
  const money = n => `৳${num(Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 }), lang)}`;
  const vars = { share: num(s.sharePct, lang), hold: num(s.holdDays, lang), min: num(s.payoutMinimum, lang), max: num(s.priceMax, lang) };
  const date = d => new Date(d).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const hasHistory = data.earnings.length > 0 || data.payouts.length > 0;
  const needsAgreement = data.enabled && data.agreement.accepted !== data.agreement.current;
  const needsPayout = data.enabled && !data.payout_details;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Where the author stands */}
      {!data.enabled && !data.note && (
        <div style={card}>
          <h3 style={h3}>{t.progTitle}</h3>
          <p style={{ margin: 0, lineHeight: 1.65 }}>{fill(t.progIntro, vars)}</p>
        </div>
      )}
      {!data.enabled && data.note && (
        <div role="status" style={{ ...card, borderColor: '#b91c1c', boxShadow: 'calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 #b91c1c' }}>
          <p style={{ margin: 0, lineHeight: 1.65 }}>{fill(t.progRemoved, { note: data.note })}</p>
        </div>
      )}
      {data.enabled && (needsAgreement || needsPayout) && (
        <div style={{ ...card, boxShadow: 'calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 var(--acc, #6f6758)' }}>
          <h3 style={h3}>{t.progTitle}</h3>
          <p style={{ margin: 0, lineHeight: 1.65 }}>{t.progInvited}</p>
        </div>
      )}
      {data.enabled && !needsAgreement && !needsPayout && (
        <p style={{ margin: 0, fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center' }}><ICheck /> {t.progReady}</p>
      )}
      {data.blockers.includes('suspended') && (
        <div role="alert" style={errorStyle}>{t.progSuspended}</div>
      )}

      {/* Step 1 — the agreement */}
      {data.enabled && (
        <Agreement t={t} vars={vars} data={data} date={date} onAccepted={load} />
      )}

      {/* Step 2 — where to send the money */}
      {data.enabled && !needsAgreement && (
        <PayoutDetails t={t} details={data.payout_details} onSaved={load} />
      )}

      {/* The money */}
      {(data.enabled || hasHistory) && (
        <>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            {pairs(t.progBalances).map(([key, label]) => (
              <div key={key} style={{ ...card, gap: 4, boxShadow: key === 'available' ? 'calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 var(--acc, #6f6758)' : `calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 ${INK}` }}>
                <span style={{ fontFamily: "var(--font-display, 'Sora', sans-serif)", fontWeight: 800, fontSize: 26 }}>{money(data.balance[key])}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted-2, #55524a)' }}>{label}</span>
              </div>
            ))}
          </div>

          <RequestPayout t={t} data={data} vars={vars} money={money} onDone={load} />

          <section style={card} aria-labelledby="prog-sales">
            <h3 id="prog-sales" style={h3}>{t.progSales}</h3>
            {data.earnings.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--muted-2, #55524a)' }}>{t.progNoSales}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr>
                      {pairs(t.progSaleCols).map(([k, label]) => (
                        <th key={k} style={{ textAlign: k === 'price' || k === 'share' ? 'right' : 'left', padding: '8px 10px', borderBottom: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, whiteSpace: 'nowrap' }}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.earnings.map(e => {
                      const state = e.reversed_at ? 'reversed' : new Date(e.available_at) > new Date() ? 'held' : 'available';
                      return (
                        <tr key={e.id} style={{ opacity: e.reversed_at ? 0.55 : 1 }}>
                          <td style={td}>{date(e.created_at)}</td>
                          <td style={td}>{e.work_title}</td>
                          <td style={{ ...td, textAlign: 'right' }}>{money(e.gross)}</td>
                          <td style={{ ...td, textAlign: 'right', fontWeight: 800 }}>{money(e.amount)}</td>
                          <td style={td}>{labelOf(t.progSaleStatus, state)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {data.payouts.length > 0 && (
            <section style={card} aria-labelledby="prog-payouts">
              <h3 id="prog-payouts" style={h3}>{t.progPayouts}</h3>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.payouts.map(p => (
                  <li key={p.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, paddingBottom: 10, borderBottom: '1px solid rgba(21,21,21,.12)' }}>
                    <span><strong>{money(p.amount)}</strong> · {labelOf(t.progProviders, p.provider)} {p.account}</span>
                    <span style={{ fontSize: 14 }}>
                      {labelOf(t.progPayoutStatus, p.status)} · {date(p.decided_at || p.requested_at)}
                      {p.transaction_id && <> · <code>{p.transaction_id}</code></>}
                      {p.reject_reason && <span style={{ display: 'block', color: '#991b1b' }}>{p.reject_reason}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

const td = { padding: '9px 10px', borderBottom: '1px solid rgba(21,21,21,.12)', verticalAlign: 'top' };

function Agreement({ t, vars, data, date, onAccepted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const accepted = data.agreement.accepted === data.agreement.current;
  const [open, setOpen] = useState(!accepted);

  const accept = async () => {
    setBusy(true);
    setError('');
    const r = await api.acceptAgreement(data.agreement.current);
    setBusy(false);
    if (r.ok) onAccepted();
    else setError(r.error);
  };

  return (
    <section style={card} aria-labelledby="prog-agreement">
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <h3 id="prog-agreement" style={h3}>{t.progAgreementTitle}</h3>
        {accepted && (
          <button type="button" onClick={() => setOpen(o => !o)}
            style={{ border: 'none', background: 'none', font: 'inherit', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>
            {fill(t.progAccepted, { date: date(data.agreement.accepted_at) })}
          </button>
        )}
      </div>
      {data.agreement.accepted && !accepted && <div role="alert" style={errorStyle}>{t.progNewVersion}</div>}
      {open && (
        <ol style={{ margin: 0, paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 12, lineHeight: 1.65 }}>
          {pairs(t.progAgreement).map(([h, b]) => (
            <li key={h}><strong>{h}.</strong> {fill(b, vars)}</li>
          ))}
        </ol>
      )}
      {error && <div role="alert" style={errorStyle}>{error}</div>}
      {!accepted && (
        <button type="button" onClick={accept} disabled={busy} style={{ ...inkButton(), alignSelf: 'flex-start' }}>
          {busy ? <ISpinner /> : t.progAccept}
        </button>
      )}
    </section>
  );
}

function PayoutDetails({ t, details, onSaved }) {
  const [provider, setProvider] = useState(details?.provider || 'bkash');
  const [account, setAccount] = useState(details?.account || '');
  const [name, setName] = useState(details?.account_name || '');
  const [state, setState] = useState({ busy: false, error: '', saved: false });

  const save = async e => {
    e.preventDefault();
    setState({ busy: true, error: '', saved: false });
    const r = await api.savePayoutDetails({ provider, account, account_name: name });
    if (!r.ok) { setState({ busy: false, error: r.error, saved: false }); return; }
    setState({ busy: false, error: '', saved: true });
    onSaved();
  };

  return (
    <form onSubmit={save} style={card} aria-labelledby="prog-payout">
      <h3 id="prog-payout" style={h3}>{t.progPayoutTitle}</h3>
      <label style={labelStyle}>
        {t.progProvider}
        <select value={provider} onChange={e => setProvider(e.target.value)} style={fieldStyle}>
          {pairs(t.progProviders).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </label>
      <label style={labelStyle}>
        {t.progAccount}
        <input value={account} onChange={e => setAccount(e.target.value)} required style={fieldStyle} inputMode={provider === 'bank' ? 'text' : 'numeric'} />
        {provider !== 'bank' && <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted, #6b675e)' }}>{t.progAccountHint}</span>}
      </label>
      <label style={labelStyle}>
        {t.progAccountName}
        <input value={name} onChange={e => setName(e.target.value)} required={provider === 'bank'} style={fieldStyle} />
      </label>
      {state.error && <div role="alert" style={errorStyle}>{state.error}</div>}
      <button type="submit" disabled={state.busy} style={{ ...inkButton(), alignSelf: 'flex-start' }}>
        {state.saved ? <><ICheck /> {t.progSaved}</> : t.progSavePayout}
      </button>
    </form>
  );
}

function RequestPayout({ t, data, vars, money, onDone }) {
  const [state, setState] = useState({ busy: false, error: '', done: false });
  const open = data.payouts.some(p => p.status === 'requested');
  const can = data.balance.available >= data.settings.payoutMinimum && data.balance.available > 0
    && !open && !!data.payout_details && !data.blockers.includes('suspended');

  const request = async () => {
    setState({ busy: true, error: '', done: false });
    const r = await api.requestPayout();
    if (!r.ok) { setState({ busy: false, error: r.error, done: false }); return; }
    setState({ busy: false, error: '', done: true });
    onDone();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        type="button"
        onClick={request}
        disabled={!can || state.busy}
        style={{ ...inkButton(), alignSelf: 'flex-start', opacity: can ? 1 : 0.45, cursor: can ? 'pointer' : 'not-allowed' }}
      >
        {state.busy ? <ISpinner /> : fill(t.progRequest, { amount: money(Math.max(0, data.balance.available)) })}
      </button>
      <span style={{ fontSize: 13, color: 'var(--muted-2, #55524a)' }}>{fill(t.progRules, vars)}</span>
      {state.done && <span role="status" style={{ fontWeight: 700 }}>{t.progRequested}</span>}
      {state.error && <div role="alert" style={errorStyle}>{state.error}</div>}
    </div>
  );
}
