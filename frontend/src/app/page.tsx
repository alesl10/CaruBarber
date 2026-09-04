'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogoBadge, TijeraRule, Wordmark } from '../components/Logo';
import { useAuth } from '../lib/auth';
import {
  avisoError,
  boton,
  botonGhost,
  card,
  colores,
  input,
  label,
  page,
} from '../lib/ui';

export default function HomePage() {
  const { user, cargando, login, register } = useAuth();
  const router = useRouter();

  const [modo, setModo] = useState<'login' | 'registro'>('login');
  const [form, setForm] = useState({ nombre: '', email: '', password: '', telefono: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!cargando && user) {
      router.replace(user.rol === 'admin' ? '/admin' : '/reservar');
    }
  }, [user, cargando, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      if (modo === 'login') {
        await login(form.email.trim(), form.password);
      } else {
        await register({
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          password: form.password,
          telefono: form.telefono.trim() || undefined,
        });
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo completar la operación');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main style={{ ...page, maxWidth: 440 }}>
      <div style={{ textAlign: 'center', margin: '18px 0 26px', display: 'grid', justifyItems: 'center', gap: 12 }}>
        <LogoBadge size={92} />
        <Wordmark size={30} />
        <TijeraRule ancho={200} />
        <p style={{ color: colores.textoSuave, margin: 0, fontSize: 14, letterSpacing: '0.02em' }}>
          Reservá tu turno o ingresá como barbero para administrar la agenda.
        </p>
      </div>

      <div style={{ ...card, display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setModo('login')}
            style={{ ...botonGhost(modo === 'login'), flex: 1 }}
          >
            Iniciar sesión
          </button>
          <button
            onClick={() => setModo('registro')}
            style={{ ...botonGhost(modo === 'registro'), flex: 1 }}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          {modo === 'registro' && (
            <label style={label}>
              Nombre
              <input
                style={input}
                value={form.nombre}
                required
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </label>
          )}

          <label style={label}>
            Email
            <input
              style={input}
              type="email"
              value={form.email}
              required
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>

          <label style={label}>
            Contraseña
            <input
              style={input}
              type="password"
              value={form.password}
              required
              minLength={6}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>

          {modo === 'registro' && (
            <label style={label}>
              Teléfono (opcional)
              <input
                style={input}
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </label>
          )}

          {error && <div style={avisoError}>{error}</div>}

          <button type="submit" style={boton(undefined, enviando)} disabled={enviando}>
            {enviando ? 'Procesando…' : modo === 'login' ? 'Entrar' : 'Registrarme'}
          </button>
        </form>
      </div>

      <p style={{ color: colores.textoTenue, fontSize: 12, marginTop: 16, textAlign: 'center' }}>
        Demo: cliente@peluqueria.com / cliente123 · admin@peluqueria.com / admin123
      </p>
    </main>
  );
}
