'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogoLockup } from '../../components/Logo';
import { useAuth } from '../../lib/auth';
import { avisoError, boton, card, colores, input, label, page } from '../../lib/ui';

/** Login del barbero (único rol que necesita cuenta: el cliente reserva sin registrarse). */
export default function LoginPage() {
  const { user, cargando, login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!cargando && user) {
      router.replace(user.rol === 'admin' ? '/admin' : '/');
    }
  }, [user, cargando, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'No se pudo iniciar sesión');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main style={{ ...page, maxWidth: 440, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', margin: '18px 0 26px', display: 'grid', justifyItems: 'center', gap: 12 }}>
        <LogoLockup ancho={210} />
        <p style={{ color: colores.textoSuave, margin: 0, fontSize: 14, letterSpacing: '0.02em' }}>
          Acceso del barbero para administrar la agenda.
        </p>
      </div>

      <div style={{ ...card, display: 'grid', gap: 16 }}>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <label style={label}>
            Email
            <input
              style={input}
              type="email"
              value={email}
              required
              autoFocus
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label style={label}>
            Contraseña
            <input
              style={input}
              type="password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <div style={avisoError}>{error}</div>}

          <button type="submit" style={boton(undefined, enviando)} disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>

      <p style={{ color: colores.textoTenue, fontSize: 12, marginTop: 16, textAlign: 'center' }}>
        Demo: admin@peluqueria.com / admin123
      </p>
    </main>
  );
}
