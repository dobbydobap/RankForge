'use client';

import { useEffect, useRef } from 'react';

// Soft light bubble that trails the cursor (landing page only).
// Pure rAF lerp + screen blend — no dependency. Skipped on touch devices.
export function CursorBubble() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      el.style.opacity = '1';
    };
    const loop = () => {
      x += (tx - x) * 0.15;
      y += (ty - y) * 0.15;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[60] h-72 w-72 rounded-full opacity-0 transition-opacity duration-500"
      style={{
        background:
          'radial-gradient(circle, rgba(255,255,255,0.12), rgba(255,255,255,0.04) 45%, rgba(255,255,255,0) 70%)',
        mixBlendMode: 'screen',
      }}
    />
  );
}
