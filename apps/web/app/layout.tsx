import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tenderhook — Morning Digest Preview',
  description:
    'Amendment red-lines and capability matches over SAM.gov fixtures — the M1 vertical slice, rendered read-only.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
