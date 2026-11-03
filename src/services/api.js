// ─── Rupok Client API Service ────────────────────────────────────────
// Relative base: works in:
//   dev  → Vite proxies /api to http://localhost:5000
//   prod → Nginx proxies /api to http://server:5000 (Docker)

import { readAccountToken, writeAccountToken } from './accountSession.js';
const BASE = '/api/v1';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const getUserToken = readAccountToken;
export const setUserToken = writeAccountToken;

function authHeader() {
  const token = getUserToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Reads a response as JSON, tolerating replies the API did not write.
 * A proxy that rejects a request itself (413 from nginx, 502 when the API is
 * down) answers with an HTML error page, and parsing that as JSON used to
 * surface as "Unexpected token '<'" — a message no reader can act on.
 */
async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { message: httpMessage(res.status) };
  }
}

function httpMessage(status) {
  if (status === 413) return 'The file is too large to upload';
  if (status === 401 || status === 403) return 'Your session has expired — please sign in again';
  if (status === 404) return 'That was not found';
  if (status === 429) return 'Too many requests — please wait a moment';
  if (status >= 500) return 'The server is unavailable right now — please try again';
  return `Request failed (HTTP ${status})`;
}

async function req(path, opts = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...authHeader(), ...opts.headers }
    });
    const json = await readJson(res);
    if (!res.ok) {
      const err = new Error(json.message || `HTTP ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return { ok: true, data: json.data ?? json, status: res.status };
  } catch (err) {
    console.warn(`[API] ${opts.method || 'GET'} ${path} failed:`, err.message);
    return { ok: false, error: err.message, status: err.status, data: null };
  }
}

const post = (path, body, method = 'POST') => req(path, { method, body: JSON.stringify(body) });

export const api = {
  commerce: (path, body, method='POST') => body === undefined ? req('/client/commerce'+path) : post('/client/commerce'+path, body, method),
  /** BFF aggregated home data: series + comics + stats in one request */
  getHome: (lang = 'en') => req(`/client/home?lang=${lang}`),

  getSeries: (lang = 'en') => req(`/client/series?lang=${lang}`),
  getSeriesByKey: (key, lang = 'en') => req(`/client/series/${key}?lang=${lang}`),
  getComics: (lang = 'en') => req(`/client/comics?lang=${lang}`),

  /** Comic page-by-page story content for the reader */
  getComicPages: (key, lang = 'en') => req(`/client/comics/${key}/pages?lang=${lang}`),

  /** Editable page copy for the given language (CMS → Page Content) */
  getContent: (lang = 'en') => req(`/client/content?lang=${lang}`),

  /** Reading progress (signed-in readers) */
  getProgress: () => req('/client/me/progress'),
  saveProgress: (key, page) => post(`/client/me/progress/${encodeURIComponent(key)}`, { page }, 'PUT'),

  /** Public site configuration (YouTube, founder info etc.) */
  getConfig: () => req('/client/config'),

  /** Page head (title, description, canonical, hreflang, Open Graph, structured data) for a path */
  /** Head data for a page; `path` is the address as it is on `site`. */
  getSeo: (path, site = 'main') => req(`/client/seo?path=${encodeURIComponent(path)}&site=${site}`),

  sendContact: payload => post('/client/contact', payload),

  /** Active manual payment methods (bKash numbers etc. configured in the CMS) */
  getPaymentMethods: () => req('/client/payment-methods'),

  /** Submits a manual payment for verification: { key, kind, methodId, senderNumber, transactionId } */
  submitOrder: payload => post('/client/commerce/platform-purchase', payload),

  // ── Reader account ──
  async register(payload) {
    const r = await post('/client/auth/register', payload);
    if (r.ok) setUserToken(r.data.token);
    return r;
  },
  async login(payload) {
    const r = await post('/client/auth/login', payload);
    if (r.ok) setUserToken(r.data.token);
    return r;
  },
  logout: () => setUserToken(null),
  me: () => req('/client/auth/me'),
  updateProfile: payload => post('/client/auth/profile', payload, 'PUT'),
  /** Ends every other session; the server hands this device a fresh token. */
  async changePassword(payload) {
    const r = await req('/client/auth/password', { method: 'PUT', body: JSON.stringify(payload) });
    if (r.ok && r.data?.token) setUserToken(r.data.token);
    return r;
  },
  myOrders: () => req('/client/me/orders'),

  // ── Password reset ──
  forgotPassword: email => post('/client/auth/forgot', { email }),
  async resetPassword(token, password) {
    const r = await req('/client/auth/reset', { method: 'POST', body: JSON.stringify({ token, password }) });
    if (r.ok && r.data?.token) setUserToken(r.data.token);
    return r;
  },

  // ── Search, following, notifications, reports ──
  search: q => req(`/client/search?q=${encodeURIComponent(q)}`),
  getFollow: (type, key) => req(`/client/follows/${type}/${encodeURIComponent(key)}`),
  follow: (type, key) => post(`/client/follows/${type}/${encodeURIComponent(key)}`, {}),
  unfollow: (type, key) => req(`/client/follows/${type}/${encodeURIComponent(key)}`, { method: 'DELETE' }),
  myFollows: () => req('/client/me/follows'),
  notifications: () => req('/client/me/notifications'),
  markNotificationsRead: (id = null) => post('/client/me/notifications/read', id ? { id } : {}),
  report: payload => post('/client/reports', payload),

  // ── The Author Programme ──
  myProgramme: () => req('/client/me/programme'),
  acceptAgreement: version => post('/client/me/programme/agreement', { version }),
  savePayoutDetails: payload => post('/client/me/programme/payout-details', payload, 'PUT'),
  setWorkPricing: (key, payload) => post(`/client/me/works/${encodeURIComponent(key)}/pricing`, payload, 'PUT'),
  requestPayout: () => post('/client/me/payouts', {}),

  // ── A reader's own data ──
  exportMyData: () => req('/client/me/export'),
  async deleteAccount(password, confirm) {
    const r = await req('/client/me', { method: 'DELETE', body: JSON.stringify({ password, confirm }) });
    if (r.ok) setUserToken(null);
    return r;
  },

  /** Analytics counters: 'visit' | 'comic_read' | 'video_view' | 'library_read' (fire-and-forget) */
  track: event => post('/client/track', { event }),
  trackPageView: (path, referrer, meta = {}) => {
    let clientVisitorId = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        clientVisitorId = localStorage.getItem('rupok_vid');
        if (!clientVisitorId) {
          clientVisitorId = 'v_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
          localStorage.setItem('rupok_vid', clientVisitorId);
        }
      }
    } catch {}
    return post('/client/track/pageview', { path, referrer, clientVisitorId, ...meta });
  },
  trackShare: ({ path, platform, entityType, entityKey }) => post('/client/track/share', { path, platform, entityType, entityKey }),

  // ── Library: public reads ──
  getLibrary: (params = {}) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== ''));
    return req(`/client/library${q.toString() ? `?${q}` : ''}`);
  },
  getWork: key => req(`/client/library/${encodeURIComponent(key)}`),
  getWorkChapter: (key, n) => req(`/client/library/${encodeURIComponent(key)}/chapters/${n}`),
  getAuthors: (lang = 'en') => req(`/client/authors?lang=${lang}`),
  getAuthor: (handle, lang = 'en') => req(`/client/authors/${encodeURIComponent(handle)}?lang=${lang}`),
  getLibraryComments: (key, chapter = null) =>
    req(`/client/library/${encodeURIComponent(key)}/comments${chapter !== null && chapter !== undefined ? `?chapter=${chapter}` : ''}`),
  postLibraryComment: (key, payload) =>
    post(`/client/library/${encodeURIComponent(key)}/comments`, payload),
  updateLibraryComment: (key, id, payload) =>
    post(`/client/library/${encodeURIComponent(key)}/comments/${id}`, payload, 'PUT'),
  deleteLibraryComment: (key, id) =>
    req(`/client/library/${encodeURIComponent(key)}/comments/${id}`, { method: 'DELETE' }),
  /** Author images are served by id — never by a URL the author supplied. */
  libraryImageUrl: id => {
    if (!id) return null;
    if (typeof id === 'string' && (id.startsWith('http') || id.startsWith('/'))) return id;
    return `${BASE}/client/library/images/${id}`;
  },

  // ── Becoming a author ──
  applyAsAuthor: payload => post('/client/author-applications', payload),
  myAuthorApplication: () => req('/client/me/author-application'),

  // ── The work desk ──
  myAuthor: () => req('/client/me/author'),
  myAuthorAnalytics: () => req('/client/me/analytics'),
  updateAuthorProfile: payload => post('/client/me/author', payload, 'PUT'),
  myWorks: () => req('/client/me/works'),
  myWork: key => req(`/client/me/works/${encodeURIComponent(key)}`),
  createWork: payload => post('/client/me/works', payload),
  updateWork: (key, payload) => post(`/client/me/works/${encodeURIComponent(key)}`, payload, 'PUT'),
  saveWorkBody: (key, body) => post(`/client/me/works/${encodeURIComponent(key)}/body`, { body }, 'PUT'),
  publishWork: key => post(`/client/me/works/${encodeURIComponent(key)}/publish`, {}),
  unpublishWork: key => post(`/client/me/works/${encodeURIComponent(key)}/unpublish`, {}),
  deleteWork: key => req(`/client/me/works/${encodeURIComponent(key)}`, { method: 'DELETE' }),

  listChapters: key => req(`/client/me/works/${encodeURIComponent(key)}/chapters`),
  myChapter: (key, n) => req(`/client/me/works/${encodeURIComponent(key)}/chapters/${n}`),
  createChapter: (key, payload) => post(`/client/me/works/${encodeURIComponent(key)}/chapters`, payload),
  updateChapter: (key, n, payload) => post(`/client/me/works/${encodeURIComponent(key)}/chapters/${n}`, payload, 'PUT'),
  saveChapterBody: (key, n, body) => post(`/client/me/works/${encodeURIComponent(key)}/chapters/${n}/body`, { body }, 'PUT'),
  publishChapter: (key, n, published = true) => post(`/client/me/works/${encodeURIComponent(key)}/chapters/${n}/publish`, { published }),
  deleteChapter: (key, n) => req(`/client/me/works/${encodeURIComponent(key)}/chapters/${n}`, { method: 'DELETE' }),

  /** Multipart upload — bypasses req()'s JSON content type. */
  async uploadLibraryImage(file, { purpose = 'inline', workKey, alt } = {}) {
    // Caught here rather than at the proxy, so the author is told what is wrong
    // with the file instead of waiting out an upload that cannot succeed.
    if (!file) return { ok: false, error: 'No image was chosen', data: null };
    if (!/^image\/(jpeg|png|webp)$/.test(file.type || '')) {
      return { ok: false, error: 'Choose a JPEG, PNG or WebP image', data: null };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: 'The image is larger than 5 MB', data: null };
    }
    const form = new FormData();
    if (purpose) form.append('purpose', purpose);
    if (workKey) form.append('work_key', workKey);
    if (alt) form.append('alt', alt);
    form.append('file', file);
    try {
      const res = await fetch(`${BASE}/client/me/images`, {
        method: 'POST',
        headers: { ...authHeader() },
        body: form
      });
      const json = await readJson(res);
      if (!res.ok) throw new Error(json.message || httpMessage(res.status));
      return { ok: true, data: json.data, status: res.status };
    } catch (err) {
      return { ok: false, error: err.message, data: null };
    }
  },
  myImages: () => req('/client/me/images'),
  deleteLibraryImage: id => req(`/client/me/images/${id}`, { method: 'DELETE' }),

  // ── Reading history for the library ──
  getLibraryProgress: (lang = 'en') => req(`/client/me/library-progress?lang=${lang}`),
  saveLibraryProgress: (key, payload) =>
    post(`/client/me/library-progress/${encodeURIComponent(key)}`, payload, 'PUT'),
  clearLibraryProgress: key =>
    req(`/client/me/library-progress/${encodeURIComponent(key)}`, { method: 'DELETE' }),

  checkHealth: () => req('/health')
};
