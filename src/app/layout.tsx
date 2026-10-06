import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const metadata: Metadata = {
  title: 'Spray Foam Bid Builder (working name)',
  description: 'Messy jobsite measurements to a branded spray-foam bid, plus a homeowner instant-quote widget. Demo build.',
  manifest: `${base}/manifest.webmanifest`,
  icons: {
    icon: [{ url: `${base}/icons/icon.svg`, type: 'image/svg+xml' }],
    apple: [{ url: `${base}/icons/apple-touch-icon.png` }],
  },
  appleWebApp: { capable: true, title: 'Bid Builder', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f766e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
