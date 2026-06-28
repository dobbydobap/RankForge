'use client';

import { useRef } from 'react';
import Link from 'next/link';

// A link that nudges toward the cursor on hover (pairs with the cursor bubble).
export function MagneticLink({
  href,
  children,
  className = '',
  strength = 0.35,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };
  const reset = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <Link
      ref={ref}
      href={href}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={`inline-flex will-change-transform transition-transform duration-200 ease-out ${className}`}
    >
      {children}
    </Link>
  );
}
