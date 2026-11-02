import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { IUserPlus, IUserCheck, ISpinner } from './icons';

const INK = 'var(--ink, var(--ink, #151515))';

/**
 * Follow a series (by key) or an author (by handle). A reader who is not signed
 * in is sent to the account page rather than shown a dead button — following
 * is a reason to make an account.
 */
export default function FollowButton({ type, targetKey, user, t, num, lang, base = '', hint = true, isSelf = false }) {
  const [state, setState] = useState({ following: false, followers: 0, loaded: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    api.getFollow(type, targetKey).then(r => {
      if (live && r.ok) setState({ ...r.data, loaded: true });
    });
    return () => { live = false; };
    // Re-read when the reader signs in or out: "following" depends on who asks.
  }, [type, targetKey, user?.id]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const r = state.following ? await api.unfollow(type, targetKey) : await api.follow(type, targetKey);
    if (r.ok) setState({ ...r.data, loaded: true });
    else setError(r.error);
    setBusy(false);
  };

  const count = state.followers
    ? (t.followers || '{n}').replace('{n}', num ? num(state.followers, lang) : state.followers)
    : null;
  const hintText = type === 'series' ? t.followHintSeries : t.followHintAuthor;

  const button = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    padding: '0 18px',
    borderRadius: 12,
    border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
    background: state.following ? 'var(--card, var(--card, #fff))' : 'var(--ink-bg, #151515)',
    color: state.following ? INK : '#f4f1ea',
    font: 'inherit',
    fontWeight: 800,
    fontSize: 15,
    cursor: 'pointer',
    textDecoration: 'none',
    boxShadow: 'calc(4px * var(--shk, 1)) calc(4px * var(--shk, 1)) 0 var(--acc, #6f6758)'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {isSelf ? null : user ? (
          <button type="button" onClick={toggle} disabled={busy} aria-pressed={state.following} style={button}>
            {busy ? <ISpinner /> : state.following ? <IUserCheck /> : <IUserPlus />}
            {state.following ? t.following : t.followBtn}
          </button>
        ) : (
          <a href={`${base}/account`} style={button}>
            <IUserPlus /> {t.followBtn}
          </a>
        )}
        {count && <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--muted-2, #55524a)' }}>{count}</span>}
      </div>
      {hint && !state.following && !isSelf && hintText && (
        <span style={{ fontSize: 13, color: 'var(--muted, #6b675e)' }}>{hintText}</span>
      )}
      {error && <span role="alert" style={{ fontSize: 13, color: '#991b1b', fontWeight: 600 }}>{error}</span>}
    </div>
  );
}
