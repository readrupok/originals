import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import RupokCoin from './RupokCoin';
import './storiesCommerce.css';

export function useCoinBalance(enabled = true) {
  const [balance, setBalance] = useState(null);
  useEffect(() => {
    if (!enabled) { setBalance(null); return; }
    let active = true;
    const refresh = async () => {
      const result = await api.commerce('/account');
      if (active && result.ok) setBalance(result.data.balance);
    };
    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener('hashchange', refresh);
    const timer = setInterval(refresh, 30000);
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('hashchange', refresh); };
  }, [enabled]);
  return balance;
}

export default function CoinBalance({ lang, base, user }) {
  const balance = useCoinBalance(Boolean(user));
  if (!user) return null;
  const amount = balance === null ? '…' : balance.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US');
  return <a className="sc-nav-wallet" href={`${base}/account#coins`} aria-label={lang === 'bn' ? `আপনার ওয়ালেট: ${amount} কয়েন` : `Your wallet: ${amount} coins`}>
    <RupokCoin /><span>{amount}</span>
  </a>;
}
