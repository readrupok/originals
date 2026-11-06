// Keeps <head> in sync with the current page after in-app navigation.
// The first page load already arrives with a server-rendered head; this mirrors it for later pages.

function upsert(selector, create, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(create);
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function meta(key, value, property = false) {
  const attribute = property ? 'property' : 'name';
  const selector = `meta[${attribute}="${key}"]`;
  if (value == null || value === '') { document.head.querySelector(selector)?.remove(); return; }
  upsert(selector, 'meta', { [attribute]: key, content: String(value) });
}

export function applySeoHead(m) {
  if (!m) return;
  document.title = m.title;
  document.documentElement.lang = m.lang || 'bn';
  upsert('meta[name="description"]', 'meta', { name: 'description', content: m.description });
  upsert('meta[name="robots"]', 'meta', { name: 'robots', content: m.robots });
  upsert('link[rel="canonical"]', 'link', { rel: 'canonical', href: m.canonical });
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
  for (const a of [...(m.alternates || []), ...(m.xDefault ? [{ lang: 'x-default', href: m.xDefault }] : [])]) {
    upsert(`link[rel="alternate"][hreflang="${a.lang}"]`, 'link', { rel: 'alternate', hreflang: a.lang, href: a.href });
  }
  const og = { 'og:title': m.title, 'og:description': m.description, 'og:url': m.canonical, 'og:image': m.image, 'og:type': m.type,
    'og:image:alt': m.h1 || m.title, 'og:site_name': m.siteName, 'og:locale': m.locale, 'og:locale:alternate': m.altLocale,
    'article:published_time': m.published, 'article:modified_time': m.modified, 'article:author': m.authorUrl };
  for (const [p, v] of Object.entries(og)) meta(p, v, true);
  const tw = { 'twitter:card': 'summary_large_image', 'twitter:title': m.title, 'twitter:description': m.description, 'twitter:image': m.image, 'twitter:image:alt': m.h1 || m.title };
  for (const [n, v] of Object.entries(tw)) upsert(`meta[name="${n}"]`, 'meta', { name: n, content: v });
  const ld = upsert('script[data-seo="jsonld"]', 'script', { type: 'application/ld+json', 'data-seo': 'jsonld' });
  ld.textContent = JSON.stringify(m.jsonLd).replace(/</g, '\\u003c');
}
