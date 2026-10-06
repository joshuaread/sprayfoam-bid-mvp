'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { BASE_PATH } from '@/lib/format';
import { APP_NAME } from '@/lib/models';

const NAV = [
  { href: '/', label: 'Home' },
  { href: '/estimate/', label: 'New estimate' },
  { href: '/estimates/', label: 'Estimates' },
  { href: '/customers/', label: 'Customers' },
  { href: '/leads/', label: 'Leads' },
  { href: '/price-book/', label: 'Price book' },
  { href: '/widget-setup/', label: 'Widget' },
  { href: '/settings/', label: 'Settings' },
  { href: '/pricing/', label: 'Pricing' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/';
  const isEmbed = pathname.startsWith('/embed');

  useEffect(() => {
    if (isEmbed) return;
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` }).catch(() => {});
    }
  }, [isEmbed]);

  if (isEmbed) return <>{children}</>;

  return (
    <div className="min-h-screen">
      <div className="bg-amber-400 px-3 py-1.5 text-center text-xs font-semibold text-amber-950" role="status" data-testid="demo-banner">
        DEMO MODE: no login, no billing. Data is saved only in this browser. Sample prices are placeholders.
      </div>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2">
          <Link href="/" className="shrink-0 text-sm font-bold text-teal-800">
            {APP_NAME} <span className="font-normal text-slate-500">(working name)</span>
          </Link>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 pb-2 text-sm" aria-label="Main">
          {NAV.map((n) => {
            const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`shrink-0 rounded-full px-3 py-1 ${active ? 'bg-teal-700 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-3 pb-40 pt-4">{children}</main>
    </div>
  );
}
