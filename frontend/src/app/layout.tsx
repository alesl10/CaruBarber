import './globals.css';
import type { Metadata } from 'next';
import { Inter, Oswald } from 'next/font/google';
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${oswald.variable}`}>
      <body style={{ margin: 0 }}>
        <AuthProvider>
          <Nav />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
