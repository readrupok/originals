import React, { useEffect, useRef, useState } from 'react';

export default function ScrollRail() {
  const railRef = useRef(null);
  const thumbRef = useRef(null);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth <= 1024 ||
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      (window.matchMedia && window.matchMedia('(hover: none)').matches)
    );
  });

  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        window.innerWidth <= 1024 ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
        (window.matchMedia && window.matchMedia('(hover: none)').matches);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const onScroll = () => {
      const r = railRef.current;
      const th = thumbRef.current;
      if (!r || !th) return;
      const H = document.documentElement.scrollHeight;
      const V = window.innerHeight;
      const track = r.clientHeight;
      const h = Math.max(44, track * Math.min(1, V / H));
      const max = Math.max(1, H - V);
      th.style.height = `${h}px`;
      th.style.transform = `translateY(${(window.scrollY / max) * (track - h)}px)`;
      r.style.opacity = H <= V + 4 ? '0' : '1';
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const ro = new ResizeObserver(onScroll);
    ro.observe(document.body);
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      ro.disconnect();
    };
  }, [isMobile]);

  if (isMobile) return null;

  const handlePointerDown = e => {
    const r = railRef.current;
    if (!r) return;
    e.preventDefault();

    const go = ev => {
      const b = r.getBoundingClientRect();
      const k = Math.min(1, Math.max(0, (ev.clientY - b.top) / b.height));
      window.scrollTo({
        top: k * (document.documentElement.scrollHeight - window.innerHeight),
        behavior: 'auto'
      });
    };

    go(e);

    const up = () => {
      window.removeEventListener('pointermove', go);
      window.removeEventListener('pointerup', up);
    };

    window.addEventListener('pointermove', go);
    window.addEventListener('pointerup', up);
  };

  // A thin line by the edge of the window; it widens under the pointer, and the
  // strip around it is wider still, so it stays easy to grab
  return (
    <div
      ref={railRef}
      onPointerDown={handlePointerDown}
      aria-hidden="true"
      className="custom-scroll-rail"
      style={{
        position: 'fixed',
        right: 2,
        top: 'calc(var(--nav-h, 72px) + 10px)',
        bottom: 12,
        width: 14,
        zIndex: 60,
        touchAction: 'none',
        transition: 'opacity .3s'
      }}
    >
      <span className="rail-track" />
      <div ref={thumbRef} className="rail-thumb" style={{ position: 'absolute', top: 0, height: 60 }} />
    </div>
  );
}
