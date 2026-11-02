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

export function applySeoHead(m) {
  if (!m) return;
  document.title = m.title;
  upsert('meta[name="description"]', 'meta', { name: 'description', content: m.description });
  upsert('meta[name="robots"]', 'meta', { name: 'robots', content: m.robots });
  upsert('link[rel="canonical"]', 'link', { rel: 'canonical', href: m.canonical });
  for (const a of m.alternates || []) {
    upsert(`link[rel="alternate"][hreflang="${a.lang}"]`, 'link', { rel: 'alternate', hreflang: a.lang, href: a.href });
  }
  upsert('link[rel="alternate"][hreflang="x-default"]', 'link', { rel: 'alternate', hreflang: 'x-default', href: m.xDefault });
  const og = { 'og:title': m.title, 'og:description': m.description, 'og:url': m.canonical, 'og:image': m.image, 'og:type': m.type };
  for (const [p, v] of Object.entries(og)) upsert(`meta[property="${p}"]`, 'meta', { property: p, content: v });
  const tw = { 'twitter:title': m.title, 'twitter:description': m.description, 'twitter:image': m.image };
  for (const [n, v] of Object.entries(tw)) upsert(`meta[name="${n}"]`, 'meta', { name: n, content: v });
  const ld = upsert('script[data-seo="jsonld"]', 'script', { type: 'application/ld+json', 'data-seo': 'jsonld' });
  ld.textContent = JSON.stringify(m.jsonLd);
}
