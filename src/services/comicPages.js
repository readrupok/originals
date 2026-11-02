// Comic pages are served one rendered image at a time through an access-checked API.
// No PDF is ever sent to the browser.
import { getUserToken } from './api';

/**
 * Fetches page `n` of a comic as an object URL — from the English or the Bangla
 * PDF, whichever `lang` names. Resolves { url } or { status } on failure.
 */
export async function fetchPageImage(comicKey, n, lang) {
  const token = getUserToken();
  const q = lang === 'bn' ? '?lang=bn' : '';
  const res = await fetch(`/api/v1/client/comics/${encodeURIComponent(comicKey)}/page/${n}${q}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store'
  });
  if (!res.ok) return { status: res.status };
  return { url: URL.createObjectURL(await res.blob()) };
}
