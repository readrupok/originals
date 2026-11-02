// Shared browser session for sibling Rupok platforms. API requests still use
// Authorization headers; this cookie is storage, never ambient API authority.
const KEY = 'rupok-account-token';
function suffix() {
  const host = window.location.hostname;
  const parent = host.replace(/^(stories|originals|books)\./, '');
  return parent !== host ? `; Domain=${parent}` : '';
}
export function readAccountToken() {
  if (typeof document === 'undefined') return null;
  const value = document.cookie.split('; ').find(x => x.startsWith(KEY + '='));
  return value ? decodeURIComponent(value.slice(KEY.length + 1)) : null;
}
export function writeAccountToken(token) {
  if (typeof document === 'undefined') return;
  document.cookie = `${KEY}=${token ? encodeURIComponent(token) : ''}; Path=/; Max-Age=${token ? 120 * 86400 : 0}; SameSite=Lax${suffix()}${window.location.protocol === 'https:' ? '; Secure' : ''}`;
}
