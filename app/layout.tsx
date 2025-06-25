import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import BoltBadge from '@/components/BoltBadge';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MuseAI - AI-Powered Art Discovery',
  description: 'Discover and learn about artworks with AI-powered analysis, audio narration, and interactive conversations.',
  manifest: '/manifest.json',
  themeColor: '#1e3a8a',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  icons: {
    icon: [
      { url: '/images/LogoMuseAI.png', sizes: 'any', type: 'image/png' }
    ],
    apple: [
      { url: '/images/LogoMuseAI.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: '/images/LogoMuseAI.png'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/LogoMuseAI.png" type="image/png" />
        <meta name="theme-color" content="#1e3a8a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MuseAI" />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          {children}
        </div>
        
        {/* Bolt.new Badge - Global across all pages */}
        <BoltBadge />
        
        <Toaster />
      </body>
    </html>
  );
}