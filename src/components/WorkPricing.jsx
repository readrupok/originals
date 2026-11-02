import React, { useEffect, useState } from 'react';
import { INK, fill } from '../data/content';
import { api } from '../services/api';
import { errorStyle, fieldStyle, inkButton, labelStyle } from './formStyles';
import { ICheck, ISpinner } from './icons';

const card = {
  display: 'flex', flexDirection: 'column', gap: 16, padding: 'clamp(18px, 2.2vw, 26px)',
  border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, borderRadius: 18, background: 'var(--card, var(--card, #fff))', boxShadow: `calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 ${INK}`
};

/**
 * The editor's Price tab. An author outside the programme sees why they cannot
 * sell; one who has not finished joining is pointed back to the desk; a ready
 * author chooses free or paid, a price inside the limits and, for a serial,
 * how many chapters stay free.
 */
export default function WorkPricing({ piece, t, lang, num, onSaved }) {
  const [prog, setProg] = useState(null);
  const [isPaid, setIsPaid] = useState(!!piece.is_paid);
  const [price, setPrice] = useState(() => String(piece.price_bdt || '').replace(/[^\d]/g, ''));
  const [freeChapters, setFreeChapters] = useState(piece.free_chapters ?? 1);
  const [state, setState] = useState({ busy: false, error: '', saved: false });

  useEffect(() => {
    api.myProgramme().then(r => setProg(r.ok ? r.data : { blockers: ['not_enabled'], settings: {} }));
  }, []);

  if (!prog) return <section style={card}><ISpinner /></section>;

  const s = prog.settings;
  const ready = prog.blockers.length === 0;
  const vars = { min: num(s.priceMin, lang), max: num(s.priceMax, lang), share: num(s.sharePct, lang) };

  const save = async e => {
    e.preventDefault();
    setState({ busy: true, error: '', saved: false });
    const r = await api.setWorkPricing(piece.key, { is_paid: isPaid, price: Number(price), free_chapters: Number(freeChapters) });
    if (!r.ok) { setState({ busy: false, error: r.error, saved: false }); return; }
    setState({ busy: false, error: '', saved: true });
    onSaved?.(r.data);
  };

  // Not in the programme: say so, and still allow making a paid piece free.
  if (!ready && !piece.is_paid) {
    return (
      <section style={card}>
        <strong style={{ fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontSize: 18 }}>{t.priceTitle}</strong>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          {prog.blockers.includes('not_enabled') ? t.priceLocked : t.priceSetup}
        </p>
      </section>
    );
  }

  const option = (value, label) => (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12,
      border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`, cursor: 'pointer', fontWeight: isPaid === value ? 800 : 600,
      background: isPaid === value ? 'var(--paper, var(--paper, #f4f1ea))' : 'var(--card, var(--card, #fff))'
    }}>
      <input type="radio" name="pricing" checked={isPaid === value} onChange={() => setIsPaid(value)}
        disabled={value && !ready} style={{ accentColor: INK }} />
      {label}
    </label>
  );

  return (
    <form onSubmit={save} style={card} aria-label={t.priceTitle}>
      <strong style={{ fontFamily: "var(--font-display, 'Sora', 'Hind Siliguri', sans-serif)", fontSize: 18 }}>{t.priceTitle}</strong>
      <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {option(false, t.priceFree)}
        {option(true, t.pricePaid)}
      </div>

      {isPaid && (
        <>
          <label style={labelStyle}>
            {t.priceAmount}
            <input
              type="number" inputMode="numeric" min={s.priceMin} max={s.priceMax} step="1" required
              value={price} onChange={e => setPrice(e.target.value)} style={{ ...fieldStyle, maxWidth: 220 }}
            />
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--muted, #6b675e)' }}>{fill(t.priceRange, vars)}</span>
          </label>

          {piece.kind === 'series' ? (
            <label style={labelStyle}>
              {t.priceFreeChapters}
              <select value={freeChapters} onChange={e => setFreeChapters(e.target.value)} style={{ ...fieldStyle, maxWidth: 220 }}>
                {[0, 1, 2, 3].map(n => <option key={n} value={n}>{num(n, lang)}</option>)}
              </select>
            </label>
          ) : (
            <span style={{ fontSize: 14, color: 'var(--muted-2, #55524a)' }}>{t.pricePreviewNote}</span>
          )}
        </>
      )}

      {state.error && <div role="alert" style={errorStyle}>{state.error}</div>}
      <button type="submit" disabled={state.busy} style={{ ...inkButton(), alignSelf: 'flex-start' }}>
        {state.busy ? <ISpinner /> : state.saved ? <><ICheck /> {t.progSaved}</> : t.priceSave}
      </button>
    </form>
  );
}
