import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hudasoft • HR & Projects',
  description: 'Your people, projects and workdays, in one place.',
  icons: { icon: '/favicon.svg' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}