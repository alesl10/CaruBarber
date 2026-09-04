import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Oswald } from 'next/font/google';
import { Footer } from '../components/Footer';
import { Nav } from '../components/Nav';
import { AuthProvider } from '../lib/auth';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
});

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Caru Barber · Turnos',
  description: 'Reserva y administración de turnos — Caru Barber',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Caru Barber',
  },
};

export const viewport: Viewport = {
  themeColor: '#14161B',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${oswald.variable}`}>
      <body style={{ margin: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AuthProvider>
          <Nav />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
