import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Legacy Armoury Tome',
  description: 'Warhammer: The Old World Legacy Army Grimoire',
  icons: {
    icon: '/app-icon.png',
    apple: '/app-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}