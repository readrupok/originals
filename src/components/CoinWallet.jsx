import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import RupokCoin from './RupokCoin';
import './storiesCommerce.css';

const date = (v) => new Date(v).toLocaleString();
const money = (v) =>
  `৳${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const copy = (lang, en, bn) => (lang === 'bn' ? bn : en);
function useResource(path) {
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function load() {
    const r = await api.commerce(path);
    if (r.ok) {
      setData(r.data);
      setError('');
    } else setError(r.error);
  }
  useEffect(() => {
    load();
  }, [path]);
  async function action(path, body, method = 'POST') {
    setBusy(true);
    setError('');
    try {
      const r = await api.commerce(path, body, method);
      if (!r.ok) {
        setError(r.error);
        return false;
      }
      await load();
      return r.data;
    } finally {
      setBusy(false);
    }
  }
  return { data, error, busy, action, load };
}
const Message = ({ error }) =>
  error ? (
    <p className="sc-error" role="alert">
      {error}
    </p>
  ) : null;
export function CoinAccount({ lang = 'en' }) {
  const { data, error, busy, action, load } = useResource('/account');
  const [form, setForm] = useState({
      coins: 120,
      method_id: '',
      sender: '',
      reference: ''
    }),
    [sent, setSent] = useState(false);
  if (!data)
    return (
      <div className="sc-panel">
        <Message error={error} />
        <p>
          {copy(lang, 'Loading coin account…', 'কয়েন অ্যাকাউন্ট লোড হচ্ছে…')}
        </p>
      </div>
    );
  const topupCoins = (amount) =>
    data.packages.find((p) => p.amount_bdt === Number(amount))?.coins ?? 0;
  const method = data.methods.find((m) => m.id === Number(form.method_id));
  return (
    <div className="sc-stack">
      <section className="sc-panel sc-wallet">
        <div className="sc-wallet-art" aria-hidden="true">
          <RupokCoin size="hero" />
          <span className="sc-spark sc-spark-one">✦</span>
          <span className="sc-spark sc-spark-two">✧</span>
          <RupokCoin size="small" />
        </div>
        <div className="sc-heading">
          <div>
            <p className="sc-eyebrow">RUPOK COINS</p>
            <h2>{copy(lang, 'Your coins', 'আপনার কয়েন')}</h2>
          </div>
          <button onClick={load}>{copy(lang, 'Refresh', 'রিফ্রেশ')}</button>
        </div>
        <strong className="sc-balance">
          <RupokCoin />
          {data.balance} <small>{copy(lang, 'coins', 'কয়েন')}</small>
        </strong>
        <p>
          {copy(
            lang,
            'Use your coins on Stories, Originals and Books. Top up ৳120 for 100 coins, ৳340 for 300 coins, or ৳750 for 700 coins.',
            'গল্প, অরিজিনালস ও বুকস-এ একই কয়েন ব্যবহার করুন। ৳১২০-এ ১০০ কয়েন, ৳৩৪০-এ ৩০০ কয়েন, ৳৭৫০-এ ৭০০ কয়েন।'
          )}
        </p>
        <a
          className="sc-wallet-cta"
          href="#coin-topup"
          onClick={(e) => {
            e.preventDefault();
            document
              .getElementById('coin-topup')
              ?.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
                  .matches
                  ? 'instant'
                  : 'smooth'
              });
          }}
        >
          {copy(lang, '＋ Add coins', '＋ কয়েন যোগ করুন')}
        </a>
        <div className="sc-wallet-purpose">
          {copy(
            lang,
            'A little coin. A whole new story.',
            'ছোট্ট একটি কয়েন। নতুন একটি গল্প।'
          )}
        </div>
        <Message error={error} />
      </section>
      <section className="sc-panel" id="coin-topup">
        <h3 className="sc-icon-heading">
          <RupokCoin />
          {copy(
            lang,
            'Top up with a manual payment',
            'ম্যানুয়াল পেমেন্টে কয়েন কিনুন'
          )}
        </h3>
        <p>
          {copy(
            lang,
            'Send the exact amount using an active method below, then submit the transfer details. Finance verifies the payment before crediting coins. An email confirms the decision.',
            'নিচের সক্রিয় মাধ্যমে সঠিক পরিমাণ পাঠিয়ে লেনদেনের তথ্য দিন। যাচাইয়ের পর কয়েন যোগ হবে এবং ইমেইলে জানানো হবে।'
          )}
        </p>
        {!data.methods.length ? (
          <p role="status">
            {copy(
              lang,
              'Payment methods are not available yet. Please check back later.',
              'পেমেন্ট মাধ্যম এখনো চালু হয়নি। পরে চেষ্টা করুন।'
            )}
          </p>
        ) : (
          <form
            className="sc-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const r = await action('/topups', {
                ...form,
                method_id: Number(form.method_id),
                amount_bdt: Number(form.coins)
              });
              if (r) {
                setSent(true);
                setForm({ ...form, reference: '' });
              }
            }}
          >
            <div
              className="sc-coin-packs"
              role="group"
              aria-label={copy(
                lang,
                'Choose coin amount',
                'কয়েনের পরিমাণ বেছে নিন'
              )}
            >
              {data.packages.map(({ amount_bdt: amount }, index) => (
                <button
                  type="button"
                  key={amount}
                  aria-pressed={Number(form.coins) === amount}
                  className="sc-coin-pack"
                  onClick={() => setForm({ ...form, coins: amount })}
                >
                  <span className="sc-pack-art" aria-hidden="true">
                    <RupokCoin size="pack" />
                    {index > 0 && <RupokCoin size="pack" />}
                    {index > 1 && <RupokCoin size="pack" />}
                  </span>
                  <strong>
                    {topupCoins(amount).toLocaleString(
                      lang === 'bn' ? 'bn-BD' : 'en-US'
                    )}{' '}
                    {copy(lang, 'coins', 'কয়েন')}
                  </strong>
                  <span>{money(amount)}</span>
                </button>
              ))}
            </div>
            <p className="sc-notice">
              {copy(lang, 'You will receive', 'আপনি পাবেন')}{' '}
              <strong>
                {topupCoins(form.coins)} {copy(lang, 'coins', 'কয়েন')}
              </strong>
            </p>
            <label>
              {copy(lang, 'Payment method', 'পেমেন্ট মাধ্যম')}
              <select
                required
                value={form.method_id}
                onChange={(e) =>
                  setForm({ ...form, method_id: e.target.value })
                }
              >
                <option value="">
                  {copy(lang, 'Choose a method', 'মাধ্যম নির্বাচন করুন')}
                </option>
                {data.methods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            {method && (
              <div className="sc-notice">
                <strong>
                  {method.name} · {method.account_number}
                </strong>
                <p>{method.account_name}</p>
                <p>
                  {lang === 'bn'
                    ? method.instructions_bn
                    : method.instructions_en}
                </p>
                <b>
                  {copy(lang, 'Send exactly', 'পাঠাবেন')} {money(form.coins)}
                </b>
              </div>
            )}
            <label>
              {copy(
                lang,
                'Your sending number / account',
                'যে নম্বর / অ্যাকাউন্ট থেকে পাঠিয়েছেন'
              )}
              <input
                required
                maxLength={60}
                value={form.sender}
                onChange={(e) => setForm({ ...form, sender: e.target.value })}
              />
            </label>
            <label>
              {copy(
                lang,
                'Transfer reference / transaction ID',
                'ট্রানজেকশন আইডি'
              )}
              <input
                required
                maxLength={40}
                value={form.reference}
                onChange={(e) =>
                  setForm({ ...form, reference: e.target.value })
                }
              />
            </label>
            <button className="sc-primary" disabled={busy}>
              {copy(lang, 'Submit for verification', 'যাচাইয়ের জন্য জমা দিন')}
            </button>
            {sent && (
              <p role="status">
                {copy(
                  lang,
                  'Submitted. Your coins will appear after approval; do not send the payment again.',
                  'জমা হয়েছে। অনুমোদনের পর কয়েন যোগ হবে; আবার টাকা পাঠাবেন না।'
                )}
              </p>
            )}
          </form>
        )}
      </section>
      <section className="sc-panel">
        <h3>{copy(lang, 'Top-up history', 'কয়েন কেনার ইতিহাস')}</h3>
        {!data.topups.length && (
          <p>{copy(lang, 'No top-ups yet.', 'এখনো কয়েন কেনা হয়নি।')}</p>
        )}
        {data.topups.map((t) => (
          <article className="sc-row" key={t.id}>
            <div>
              <b>
                <span className="sc-coin-value">
                  <RupokCoin />
                  {t.coins} {copy(lang, 'coins', 'কয়েন')}
                </span>{' '}
                · {t.status}
              </b>
              <p>
                {t.reference} · {date(t.created_at)}
              </p>
              {t.note && <p>{t.note}</p>}
            </div>
          </article>
        ))}
      </section>
      <section className="sc-panel">
        <h3>{copy(lang, 'Your purchases', 'আপনার কেনাকাটা')}</h3>
        {!data.purchases.length && (
          <p>
            {copy(
              lang,
              'Your purchases will appear here.',
              'কেনা লেখা এখানে দেখা যাবে।'
            )}
          </p>
        )}
        {data.purchases.map((p) => (
          <article className="sc-row" key={p.id}>
            <a
              href={
                p.url ||
                `${lang === 'en' ? '/en' : ''}/stories/${p.handle}/${p.key}`
              }
            >
              {p.title}
            </a>
            <span>
              <span className="sc-coin-value">
                <RupokCoin />
                {p.coins} {copy(lang, 'coins', 'কয়েন')}
              </span>{' '}
              ·{' '}
              {p.refunded_at
                ? 'Refunded'
                : p.status && p.status !== 'completed'
                  ? p.status
                  : date(p.created_at)}
            </span>
          </article>
        ))}
      </section>
      <details className="sc-panel">
        <summary>{copy(lang, 'Coin transactions', 'কয়েন লেনদেন')}</summary>
        {data.entries.map((e) => (
          <div className="sc-row" key={e.id}>
            <span>
              {e.kind.replaceAll('_', ' ')} · {date(e.created_at)}
            </span>
            <b>
              {e.delta > 0 ? '+' : ''}
              {e.delta}
            </b>
          </div>
        ))}
      </details>
    </div>
  );
}
