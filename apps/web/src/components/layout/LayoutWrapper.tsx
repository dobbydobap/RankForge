'use client';

import { usePathname } from 'next/navigation';
import { AppLayout } from './AppLayout';

// Pages that should NOT have the sidebar
const STANDALONE_PAGES = ['/', '/login', '/register'];
// Pages that need full-screen (no sidebar)
const FULLSCREEN_PAGES = ['/problems/']; // problem detail with editor

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Landing, auth pages — no sidebar
  if (STANDALONE_PAGES.includes(pathname)) {
    return <>{children}</>;
  }

  // Problem detail page (has its own full-screen editor layout)
  if (pathname.match(/^\/problems\/[^/]+$/)) {
    return <>{children}</>;
  }

  // All other pages get the sidebar layout
  return <AppLayout>{children}</AppLayout>;
}
