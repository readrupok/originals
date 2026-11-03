import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import AuthForm from './AuthForm';
import RupokCoin from './RupokCoin';
import './storiesCommerce.css';
export default function PaymentModal({
  pay,
  onClose,
  onSubmit,
  t,
  lang,
  series,
  comics,
  user,
  onAuthed,
  base
}) {
  const bn = lang === 'bn',
    comic = comics.find((c) => c.k === pay.k),
    parent = series.find((s) => s.k === (comic?.seriesKey || pay.k));
  const options = [
    comic?.paid &&
      comic.locked && {
        kind: 'comic',
        key: comic.k,
        title: comic.sub || comic.title
      },
    parent?.paid &&
      parent.locked && { kind: 'series', key: parent.k, title: parent.title }
  ].filter(Boolean);
  const [selected, setSelected] = useState(
      () => options.find((x) => x.kind === pay.kind) || options[0]
    ),
    [quote, setQuote] = useState(null),
    [balance, setBalance] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  useEffect(() => {
    let active = true;
    if (user && selected && !done) {
      setQuote(null);
      setError('');
      Promise.all([
        api.commerce('/platform-quote', {
          platform: 'originals',
          kind: selected.kind,
          key: selected.key
        }),
        api.commerce('/account')
      ]).then(([q, w]) => {
        if (!active) return;
        if (q.ok) setQuote(q.data);
        else setError(q.error);
        if (w.ok) setBalance(w.data.balance);
      });
    }
    return () => {
      active = false;
    };
  }, [user, selected, done]);
  async function buy() {
    setBusy(true);
    const r = await onSubmit({
      ...quote,
      platform: 'originals',
      kind: selected.kind,
      key: selected.key
    });
    setBusy(false);
    if (r.ok) setDone(true);
    else setError(r.error);
  }
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: '#000a',
        display: 'grid',
        placeItems: 'center',
        padding: 16
      }}
    >
      <section
        className="sc-panel"
        role="dialog"
        aria-modal="true"
        aria-label={bn ? 'কয়েন দিয়ে কিনুন' : 'Unlock with coins'}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(520px,100%)',
          boxSizing: 'border-box',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#fffaf0',
          color: '#282018'
        }}
      >
        <button onClick={onClose} aria-label="Close" style={{ float: 'right' }}>
          ×
        </button>
        <RupokCoin size="feature" />
        <h2>{bn ? 'রূপক কয়েনে পড়ুন' : 'Unlock with Rupok Coins'}</h2>
        {!user ? (
          <AuthForm t={t} lang={lang} onAuthed={onAuthed} />
        ) : done ? (
          <>
            <h3>{bn ? 'কেনা সম্পূর্ণ' : 'Purchase complete'}</h3>
            <p>
              {bn
                ? 'এখন পড়া চালিয়ে যেতে পারেন।'
                : 'Your access is ready. Continue reading.'}
            </p>
            <button onClick={onClose}>{bn ? 'চালিয়ে যান' : 'Continue'}</button>
          </>
        ) : (
          <>
            <div className="sc-form">
              <label>
                {bn ? 'যা কিনবেন' : 'Choose what to unlock'}
                <select
                  value={selected?.kind}
                  onChange={(e) =>
                    setSelected(options.find((x) => x.kind === e.target.value))
                  }
                >
                  {options.map((o) => (
                    <option key={o.kind} value={o.kind}>
                      {o.kind === 'series'
                        ? bn
                          ? 'সিরিজ পাস'
                          : 'Series pass'
                        : bn
                          ? 'এই কমিক'
                          : 'This comic'}{' '}
                      · {o.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {quote && (
              <p className="sc-balance">
                <RupokCoin /> {quote.coins}{' '}
                <small>{bn ? 'কয়েন' : 'coins'}</small>
              </p>
            )}
            <p>
              {bn ? 'আপনার ব্যালেন্স' : 'Your balance'}: {balance ?? '…'}{' '}
              {bn ? 'কয়েন' : 'coins'}
            </p>
            <button
              onClick={async () => {
                const r = await api.commerce('/account');
                if (r.ok) setBalance(r.data.balance);
              }}
            >
              {bn ? 'ব্যালেন্স রিফ্রেশ করুন' : 'Refresh balance'}
            </button>
            <p>
              {bn
                ? 'একই কয়েন গল্প, অরিজিনালস ও বুকস-এ ব্যবহার করতে পারবেন।'
                : 'One wallet for Stories, Originals and Books. Existing purchases remain yours.'}
            </p>
            <p>
              <a href={`${base}/account#coins`} target="_blank" rel="noopener">
                {bn ? 'কয়েন যোগ করুন' : 'Top up coins'}
              </a>
            </p>
            <button
              className="sc-primary"
              disabled={busy || !quote || balance < quote.coins}
              onClick={buy}
            >
              {bn ? 'কেনা নিশ্চিত করুন' : 'Confirm purchase'}
            </button>
          </>
        )}
        {error && (
          <p className="sc-error" role="alert">
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
