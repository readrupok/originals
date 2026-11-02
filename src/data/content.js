export const BD = '০১২৩৪৫৬৭৮৯';
// A theme token: the main site defines none, so it falls back to the ink itself
export const INK = 'var(--ink, #151515)';
export const ACC0 = '#6f6758';

export const num = (v, lang = 'en') => {
  const s = String(v);
  return lang === 'bn' ? s.replace(/\d/g, d => BD[d]) : s;
};

export const pad = i => String(i).padStart(2, '0');

// UI copy now lives in the database (site_content) and is edited in the CMS → Page Content.

export const ROUTES = ['', 'stories', 'series', 'comics', 'authors', 'watch', 'studio', 'contact'];

// The kinds of work the Stories section carries. This is the only place they
// are hardcoded in the client — their labels come from the CMS (`writerKinds`),
// so adding a kind means this array plus that content row, nothing else.
export const WORK_KINDS = ['story', 'series', 'poetry'];
// Terms, Privacy, Refunds and Community Guidelines — one Legal page renders all four.
export const LEGAL_PAGES = ['terms', 'privacy', 'refunds', 'guidelines'];

/** Fills {placeholders} in a site-copy string; unknown ones are left visible. */
export const fill = (text, vars) =>
  String(text || '').replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
