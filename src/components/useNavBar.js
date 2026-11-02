import { useEffect, useRef, useState } from 'react';

// How every Rupok navigation bar behaves (Navigation on the main site, SiteNav
// on Stories and Originals). The bar's states, read on every scroll frame:
//   scrolled  — false at the very top: the bar is transparent, with no rule
//   dark      — over a section marked data-nav-tone="dark" (hit-tested under
//               the middle of the bar, so a rotated band counts only where it is)
//   hidden    — scrolling down past the first screen; any scroll up, focus in
//               the bar or an open menu brings it back. Never with reduced motion.
// It also publishes the bar's height as --nav-h, and while the menu is open
// keeps the page still, closes on Escape and on widening past `wideAt`.
export default function useNavBar({ routeKey, menuOpen, setMenuOpen, wideAt = 980 }) {
  const navRef = useRef(null);
  const [bar, setBar] = useState({ scrolled: false, dark: false, hidden: false });

  useEffect(() => {
    const el = navRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--nav-h', `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = navRef.current;
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let lastY = window.scrollY;
    let hidden = false;
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const h = el?.offsetHeight || 68;
      const dark = (document.elementsFromPoint?.(window.innerWidth / 2, h / 2) || [])
        .some(n => !el?.contains(n) && n.closest?.('[data-nav-tone="dark"]'));
      const focused = el?.contains(document.activeElement) && document.activeElement !== document.body;
      if (y < h * 2 || calm?.matches || focused) hidden = false;
      else if (y > lastY + 6) hidden = true;
      else if (y < lastY - 6) hidden = false;
      if (Math.abs(y - lastY) > 6 || y < h * 2) lastY = y;
      const next = { scrolled: y > 8, dark, hidden };
      setBar(prev => (next.scrolled === prev.scrolled && next.dark === prev.dark && next.hidden === prev.hidden ? prev : next));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read); };
    // Keyboard focus moving into the bar shows it
    const onFocus = () => { hidden = false; setBar(prev => (prev.hidden ? { ...prev, hidden: false } : prev)); };
    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    el?.addEventListener('focusin', onFocus);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      el?.removeEventListener('focusin', onFocus);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [routeKey]);

  // A new page starts with the bar in view and the menu closed
  useEffect(() => {
    setMenuOpen(false);
    setBar(prev => ({ ...prev, hidden: false }));
  }, [routeKey, setMenuOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = e => { if (e.key === 'Escape') setMenuOpen(false); };
    const wide = window.matchMedia(`(min-width: ${wideAt}px)`);
    const onWide = () => { if (wide.matches) setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    wide.addEventListener?.('change', onWide);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      wide.removeEventListener?.('change', onWide);
    };
  }, [menuOpen, setMenuOpen, wideAt]);

  return { navRef, bar };
}
