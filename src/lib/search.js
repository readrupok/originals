// Search is a panel over the page (components/SearchPanel.jsx), not a page of
// its own. Anything can open it — the search button in each bar, "/" or
// Ctrl/⌘ K, or an old /search?q= address — with an optional starting query.

export const SEARCH_EVENT = 'rupok:search';

export function openSearch(q = '') {
  window.dispatchEvent(new CustomEvent(SEARCH_EVENT, { detail: { q } }));
}
