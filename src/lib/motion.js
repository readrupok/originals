// Small pieces of motion for the main site, installed once by App.
//
//   data-reveal         the element fades up when it first scrolls into view;
//                       style --reveal-delay staggers siblings
//   data-pow            a click on it throws a comic burst ("POW!") at the cursor
//
// Both do nothing when the reader asks for reduced motion, and reveal shows
// everything at once where IntersectionObserver is missing.

const calm = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function installReveal() {
  if (typeof window === 'undefined') return () => {};
  const root = document.documentElement;
  if (calm() || typeof IntersectionObserver === 'undefined') return () => {};
  root.classList.add('can-reveal');

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.setAttribute('data-revealed', '');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  const watch = scope => {
    if (scope.nodeType !== 1) return;
    if (scope.matches?.('[data-reveal]:not([data-revealed])')) io.observe(scope);
    scope.querySelectorAll?.('[data-reveal]:not([data-revealed])').forEach(el => io.observe(el));
  };
  watch(document.body);
  // Pages render after navigation; catch their sections as they mount
  const mo = new MutationObserver(list => list.forEach(m => m.addedNodes.forEach(watch)));
  mo.observe(document.body, { childList: true, subtree: true });

  return () => {
    io.disconnect();
    mo.disconnect();
    root.classList.remove('can-reveal');
  };
}

const WORDS = {
  en: ['POW!', 'ZAP!', 'BOOM!', 'WHAM!', 'KA-POW!'],
  bn: ['ধুম!', 'ঠাস!', 'ফটাস!', 'দুম!']
};

export function installPow() {
  if (typeof window === 'undefined') return () => {};
  const onClick = e => {
    if (e.button !== 0 || calm()) return;
    const el = e.target.closest?.('[data-pow]');
    if (!el) return;
    const lang = document.documentElement.lang === 'bn' ? 'bn' : 'en';
    const words = WORDS[lang];
    const burst = document.createElement('span');
    burst.className = 'pow-burst';
    burst.setAttribute('aria-hidden', 'true');
    burst.textContent = words[Math.floor(Math.random() * words.length)];
    burst.style.left = `${e.clientX}px`;
    burst.style.top = `${e.clientY}px`;
    burst.style.setProperty('--pow-tilt', `${Math.round(Math.random() * 24 - 12)}deg`);
    document.body.appendChild(burst);
    burst.addEventListener('animationend', () => burst.remove(), { once: true });
    setTimeout(() => burst.remove(), 1200);
  };
  document.addEventListener('click', onClick, true);
  return () => document.removeEventListener('click', onClick, true);
}
