'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth';
import { colores, fuenteDisplay } from '../lib/ui';
import { Logo } from './Logo';

export function Nav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const links =
    user?.rol === 'admin'
      ? [
          { href: '/admin', label: 'Panel' },
          { href: '/admin/agenda', label: 'Agenda' },
          { href: '/admin/servicios', label: 'Servicios' },
          { href: '/admin/horarios', label: 'Horarios' },
        ]
      : [
          { href: '/reservar', label: 'Reservar' },
          { href: '/mis-turnos', label: 'Mis turnos' },
        ];

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '14px 22px',
        borderBottom: `1px solid ${colores.borde}`,
        background: 'rgba(20, 22, 27, 0.85)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
        <Link href="/" aria-label="Inicio">
          <Logo size={32} texto={17} />
        </Link>
        {user && (
          <nav style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {links.map((l) => {
              const activo = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{
                    fontFamily: fuenteDisplay,
                    fontSize: 13,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    paddingBottom: 2,
                    color: activo ? colores.oroClaro : colores.textoSuave,
                    borderBottom: `2px solid ${activo ? colores.oro : 'transparent'}`,
                  }}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
          <span style={{ color: colores.textoSuave, letterSpacing: '0.02em' }}>
            {user.nombre} · {user.rol}
          </span>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: `1px solid ${colores.borde}`,
              borderRadius: 8,
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: 12,
              color: colores.texto,
              fontFamily: fuenteDisplay,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            Salir
          </button>
        </div>
      )}
    </header>
  );
}
