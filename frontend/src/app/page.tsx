'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LogoLockup, TijeraRule } from '../components/Logo';
import { ServicioMedia } from '../components/ServicioMedia';
import { api } from '../lib/api';
import { hoyISO } from '../lib/fechas';
import { DIAS_SEMANA, HorarioTrabajo, Servicio } from '../lib/types';
import {
  boton,
  botonGhost,
  card,
  colores,
  formatearPrecio,
  fuenteDisplay,
  page,
  textoDorado,
  titulo,
} from '../lib/ui';

const ORDEN_SEMANA = [1, 2, 3, 4, 5, 6, 0]; // lunes primero

const VENTAJAS = [
  {
    icono: '📅',
    titulo: 'Elegís día y hora',
    texto: 'Calendario con los horarios realmente libres, al instante.',
  },
  {
    icono: '✍️',
    titulo: 'Sin crear cuenta',
    texto: 'Reservás con tu nombre, email y celular. Nada de contraseñas.',
  },
  {
    icono: '📩',
    titulo: 'Confirmación por email',
    texto: 'Te avisamos apenas el barbero confirma, con link para cancelar si hace falta.',
  },
];

function hoyDiaSemana() {
  return new Date(`${hoyISO()}T00:00:00`).getDay();
}

export default function LandingPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [horarios, setHorarios] = useState<HorarioTrabajo[]>([]);

  useEffect(() => {
    api<Servicio[]>('/servicios', { auth: false })
      .then(setServicios)
      .catch(() => undefined);
    api<HorarioTrabajo[]>('/horarios', { auth: false })
      .then(setHorarios)
      .catch(() => undefined);
  }, []);

  const hoy = hoyDiaSemana();
  const horariosPorDia = new Map(horarios.map((h) => [h.diaSemana, h]));

  return (
    <main style={page}>
      {/* Hero */}
      <section
        style={{
          textAlign: 'center',
          padding: '32px 12px 40px',
          display: 'grid',
          justifyItems: 'center',
          gap: 18,
        }}
      >
        <LogoLockup ancho={230} />
        <p
          style={{
            maxWidth: 480,
            margin: 0,
            fontSize: 16,
            color: colores.textoSuave,
            lineHeight: 1.5,
          }}
        >
          Cortes clásicos, prolijidad de barbería y turnos que se reservan en menos de un minuto.
        </p>
        <Link href="/reservar" style={{ ...boton(), fontSize: 15, padding: '14px 30px' }}>
          Reservar turno →
        </Link>
      </section>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <TijeraRule ancho={260} />
      </div>

      {/* Ventajas */}
      <section
        style={{
          display: 'grid',
          gap: 14,
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          margin: '36px 0',
        }}
      >
        {VENTAJAS.map((v) => (
          <div key={v.titulo} style={{ ...card, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{v.icono}</div>
            <strong style={{ fontFamily: fuenteDisplay, letterSpacing: '0.02em' }}>{v.titulo}</strong>
            <p style={{ color: colores.textoSuave, fontSize: 13, marginTop: 6, lineHeight: 1.4 }}>
              {v.texto}
            </p>
          </div>
        ))}
      </section>

      {/* Servicios */}
      {servicios.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ ...titulo, fontSize: 20, marginBottom: 16, textAlign: 'center' }}>
            Nuestros <span style={textoDorado}>servicios</span>
          </h2>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {servicios.map((s) => (
              <div key={s.id} style={{ ...card, padding: 0, overflow: 'hidden' }}>
                <ServicioMedia servicio={s} alto={160} />
                <div style={{ padding: 14, textAlign: 'center' }}>
                  <strong style={{ fontFamily: fuenteDisplay, fontSize: 15 }}>{s.nombre}</strong>
                  <div style={{ fontSize: 12, color: colores.textoSuave, marginTop: 4 }}>
                    {s.duracionMinutos} min
                  </div>
                  <div style={{ ...textoDorado, fontFamily: fuenteDisplay, fontSize: 18, fontWeight: 700, marginTop: 6 }}>
                    {formatearPrecio(s.precio)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Horarios */}
      {horarios.length > 0 && (
        <section style={{ ...card, maxWidth: 420, margin: '0 auto 40px' }}>
          <strong style={{ letterSpacing: '0.03em', display: 'block', marginBottom: 10 }}>
            Horarios de atención
          </strong>
          <div style={{ display: 'grid', gap: 4 }}>
            {ORDEN_SEMANA.map((dia) => {
              const h = horariosPorDia.get(dia);
              const esHoy = dia === hoy;
              return (
                <div
                  key={dia}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 13,
                    padding: '4px 8px',
                    borderRadius: 6,
                    background: esHoy ? 'rgba(212,175,55,0.10)' : 'transparent',
                    color: esHoy ? colores.oroClaro : colores.texto,
                  }}
                >
                  <span style={{ fontWeight: esHoy ? 700 : 400 }}>{DIAS_SEMANA[dia]}</span>
                  <span style={{ color: h?.activo ? undefined : colores.textoTenue }}>
                    {h?.activo ? `${h.horaApertura} a ${h.horaCierre}` : 'Cerrado'}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* CTA final */}
      <section style={{ textAlign: 'center', marginBottom: 24, display: 'grid', gap: 12, justifyItems: 'center' }}>
        <strong style={{ fontFamily: fuenteDisplay, fontSize: 18 }}>¿Listo para tu turno?</strong>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/reservar" style={boton()}>
            Reservar turno
          </Link>
          <Link href="/login" style={botonGhost()}>
            Soy el barbero
          </Link>
        </div>
      </section>
    </main>
  );
}
