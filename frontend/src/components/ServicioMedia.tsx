'use client';

import { useState } from 'react';
import { colores } from '../lib/ui';

type TipoIcono = 'corte' | 'barba' | 'lavado' | 'generico';

function detectarTipo(nombre: string): TipoIcono {
  const n = nombre.toLowerCase();
  if (n.includes('barba') || n.includes('afeit')) return 'barba';
  if (n.includes('lavado') || n.includes('shampoo') || n.includes('champ')) return 'lavado';
  if (n.includes('corte') || n.includes('pelo') || n.includes('cabello')) return 'corte';
  return 'generico';
}

const PROPS_ICONO = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 3,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Icono({ tipo }: { tipo: TipoIcono }) {
  if (tipo === 'barba') {
    return (
      <svg width={52} height={52} viewBox="0 0 64 64" {...PROPS_ICONO}>
        <path d="M20 14c0 13-4 21-4 29 0 11 7.5 17 16 17s16-6 16-17c0-8-4-16-4-29" />
        <path d="M23 43c2.5 5 5.5 7.5 9 7.5s6.5-2.5 9-7.5" />
        <line x1="25" y1="17" x2="25" y2="25" />
        <line x1="39" y1="17" x2="39" y2="25" />
      </svg>
    );
  }
  if (tipo === 'lavado') {
    return (
      <svg width={52} height={52} viewBox="0 0 64 64" {...PROPS_ICONO}>
        <path d="M32 7c8 12 17 23 17 33a17 17 0 1 1-34 0c0-10 9-21 17-33Z" />
        <path d="M23 41c0 5 4 9 9 9" />
      </svg>
    );
  }
  return (
    <svg width={52} height={52} viewBox="0 0 64 64" {...PROPS_ICONO}>
      <line x1="13" y1="51" x2="45" y2="19" />
      <line x1="45" y1="51" x2="13" y2="19" />
      <circle cx="10" cy="54" r="5" />
      <circle cx="10" cy="16" r="5" />
      <line x1="29" y1="35" x2="53" y2="35" />
    </svg>
  );
}

/** Cabecera de la card de un servicio: imagen real si hay `imagenUrl`, si no un ícono de marca. */
export function ServicioMedia({
  servicio,
  alto = 180,
}: {
  servicio: { nombre: string; imagenUrl?: string | null };
  alto?: number;
}) {
  const [fallo, setFallo] = useState(false);
  const mostrarImagen = !!servicio.imagenUrl && !fallo;

  return (
    <div
      style={{
        height: alto,
        borderRadius: '14px 14px 0 0',
        overflow: 'hidden',
        background:
          'radial-gradient(140px 100px at 28% 15%, rgba(212,175,55,0.20), transparent 70%), linear-gradient(160deg, #201B10 0%, #14161B 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: colores.oroClaro,
        flexShrink: 0,
      }}
    >
      {mostrarImagen ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={servicio.imagenUrl!}
          alt={servicio.nombre}
          onError={() => setFallo(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <Icono tipo={detectarTipo(servicio.nombre)} />
      )}
    </div>
  );
}
