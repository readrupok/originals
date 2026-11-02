export const INK = 'var(--ink, var(--ink, #151515))';

export const fieldStyle = {
  minHeight: 50,
  padding: '0 14px',
  borderRadius: 12,
  border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
  background: 'var(--card-2, #f9f7f1)',
  font: 'inherit',
  fontSize: 16,
  color: INK,
  width: '100%',
  boxSizing: 'border-box'
};

export const labelStyle = { display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, fontWeight: 700 };

export const inkButton = (accent = '#6f6758') => ({
  padding: '15px 22px',
  borderRadius: 14,
  border: `calc(2px * var(--bwk, 1)) solid var(--edge, #151515)`,
  background: 'var(--ink-bg, #151515)',
  color: '#fff',
  font: 'inherit',
  fontWeight: 800,
  fontSize: 16,
  cursor: 'pointer',
  boxShadow: `calc(5px * var(--shk, 1)) calc(5px * var(--shk, 1)) 0 ${accent}`
});

export const errorStyle = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '2px solid #b91c1c',
  background: '#fef2f2',
  color: '#991b1b',
  fontSize: 14,
  fontWeight: 600
};
