'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { Rol } from '../lib/types';
import { colores, page } from '../lib/ui';

export function Protegido({
  rol,
  children,
}: {
  rol: Rol;
  children: React.ReactNode;
}) {
  const { user, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;
    if (!user) {
      router.replace(rol === 'admin' ? '/login' : '/');
    } else if (user.rol !== rol) {
      router.replace(user.rol === 'admin' ? '/admin' : '/');
    }
  }, [user, cargando, rol, router]);

  if (cargando || !user || user.rol !== rol) {
    return <main style={{ ...page, color: colores.textoSuave }}>Cargando…</main>;
  }

  return <>{children}</>;
}
