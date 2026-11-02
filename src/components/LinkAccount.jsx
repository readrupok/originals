import React, { useState } from 'react';
import { api, getUserToken } from '../services/api';

export default function LinkAccount({ lang, onLinked, onCancel }) {
  const bn = lang === 'bn';
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/v1/account/link-studio', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${getUserToken()}` }, body: JSON.stringify({ password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setPassword('');
      await onLinked();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.65)', display: 'grid', placeItems: 'center', padding: 24 }}>
    <section role="dialog" aria-modal="true" aria-labelledby="link-account-title" style={{ maxWidth: 440, padding: 28, borderRadius: 18, background: 'var(--card, #fff)', color: 'var(--ink, #151515)' }}>
      <h2 id="link-account-title">{bn ? 'আপনার রূপক অ্যাকাউন্ট যুক্ত করুন' : 'Link your Rupok account'}</h2>
      <p>{bn ? 'আপনার আগের স্টোরিজ প্রোফাইল, লেখা এবং কেনাকাটা রাখতে আগের স্টোরিজ পাসওয়ার্ড দিন।' : 'Enter your previous Stories password to keep your existing profile, writing and purchases with this Rupok account.'}</p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <label htmlFor="previous-stories-password">{bn ? 'আগের স্টোরিজ পাসওয়ার্ড' : 'Previous Stories password'}</label>
        <input id="previous-stories-password" type="password" autoComplete="current-password" autoFocus required value={password} onChange={e => setPassword(e.target.value)} style={{ padding: 12, font: 'inherit' }} />
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={busy} style={{ padding: 12, font: 'inherit', fontWeight: 700 }}>{busy ? '…' : bn ? 'অ্যাকাউন্ট যুক্ত করুন' : 'Link account'}</button>
        <button type="button" disabled={busy} onClick={() => { api.logout(); onCancel(); }}>{bn ? 'সাইন আউট' : 'Sign out'}</button>
      </form>
    </section>
  </div>;
}
