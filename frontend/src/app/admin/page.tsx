'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Protegido } from '../../components/Protegido';
import { AccionTurno, FilaTurno } from '../../components/turnos';
import { api } from '../../lib/api';
import { hoyISO, nombreMes, rangoMes, rangoSemana } from '../../lib/fechas';
import { Estadisticas, Notificacion, Turno } from '../../lib/types';
import {
  avisoError,
  botonChico,
  botonGhost,
  card,
  colorEstado,
  colores,
  formatearPrecio,
  fuenteDisplay,
  page,
  textoDorado,
  titulo,
} from '../../lib/ui';

type Periodo = 'hoy' | 'semana' | 'mes';

function rangoDe(periodo: Periodo) {
  const hoy = hoyISO();
  if (periodo === 'hoy') return { desde: hoy, hasta: hoy };
  if (periodo === 'semana') return rangoSemana(hoy);
  return rangoMes(hoy);
}

function etiquetaPeriodo(periodo: Periodo) {
  if (periodo === 'hoy') return 'hoy';
  if (periodo === 'semana') return 'esta semana';
  return nombreMes(hoyISO());
}

function PanelInner() {
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [stats, setStats] = useState<Estadisticas | null>(null);
  const [pendientes, setPendientes] = useState<Turno[]>([]);
  const [notis, setNotis] = useState<Notificacion[]>([]);
  const [error, setError] = useState('');

  const rango = useMemo(() => rangoDe(periodo), [periodo]);

  const cargarStats = useCallback(async () => {
    try {
      setStats(
        await api<Estadisticas>(`/turnos/estadisticas?desde=${rango.desde}&hasta=${rango.hasta}`),
      );
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar las métricas.');
    }
  }, [rango]);

  const cargarOperativo = useCallback(async () => {
    try {
      const [p, n] = await Promise.all([
        api<Turno[]>('/turnos?estado=pendiente'),
        api<Notificacion[]>('/notificaciones'),
      ]);
      setPendientes(p);
      setNotis(n);
      setError('');
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar.');
    }
  }, []);

  useEffect(() => {
    cargarStats();
  }, [cargarStats]);

  useEffect(() => {
    cargarOperativo();
    const id = setInterval(() => {
      cargarOperativo();
      cargarStats();
    }, 15000);
    return () => clearInterval(id);
  }, [cargarOperativo, cargarStats]);

  async function accion(id: number, tipo: AccionTurno) {
    try {
      await api(`/turnos/${id}/${tipo}`, { method: 'PATCH' });
      await Promise.all([cargarOperativo(), cargarStats()]);
    } catch (err: any) {
      setError(err.message || 'No se pudo completar la acción.');
    }
  }

  async function marcarLeidas() {
    await api('/notificaciones/leer-todas', { method: 'PATCH' }).catch(() => {});
    cargarOperativo();
  }

  const noLeidas = notis.filter((n) => !n.leida);

  return (
    <main style={page}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <h1 style={{ ...titulo, fontSize: 26 }}>Panel</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['hoy', 'semana', 'mes'] as Periodo[]).map((p) => (
            <button key={p} onClick={() => setPeriodo(p)} style={botonGhost(periodo === p)}>
              {p}
            </button>
          ))}
        </div>
        {noLeidas.length > 0 && (
          <span
            style={{
              background: colorEstado.cancelado,
              color: '#fff',
              borderRadius: 999,
              padding: '2px 10px',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {noLeidas.length} nueva{noLeidas.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {error && <div style={{ ...avisoError, marginBottom: 16 }}>{error}</div>}

      <p style={{ color: colores.textoSuave, marginTop: 0, fontSize: 13 }}>
        Métricas de <strong style={{ color: colores.texto }}>{etiquetaPeriodo(periodo)}</strong>
        {stats ? ` · ${stats.rango.desde} a ${stats.rango.hasta}` : ''}
      </p>

      <section
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          marginBottom: 16,
        }}
      >
        <Kpi titulo="Cortes realizados" valor={stats?.realizados ?? '—'} color={colorEstado.realizado} />
        <Kpi titulo="Turnos pendientes" valor={stats?.pendientes ?? '—'} color={colorEstado.pendiente} />
        <Kpi titulo="Turnos confirmados" valor={stats?.confirmados ?? '—'} color={colorEstado.confirmado} />
        <Kpi titulo="Turnos cancelados" valor={stats?.cancelados ?? '—'} color={colorEstado.cancelado} />
      </section>

      <section
        style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 24 }}
      >
        <div
          style={{
            ...card,
            background: 'linear-gradient(160deg, #201B10 0%, #14161B 100%)',
            border: `1px solid ${colores.oroOscuro}`,
          }}
        >
          <div style={{ fontSize: 11, color: colores.textoSuave, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Recaudado ({etiquetaPeriodo(periodo)})
          </div>
          <div style={{ ...textoDorado, fontSize: 32, fontWeight: 700, marginTop: 4, fontFamily: fuenteDisplay }}>
            {stats ? formatearPrecio(stats.recaudado) : '—'}
          </div>
          <div style={{ fontSize: 12, color: colores.textoTenue, marginTop: 6 }}>
            Sobre {stats?.realizados ?? 0} cortes realizados
          </div>
        </div>
        <div style={card}>
          <div style={{ fontSize: 11, color: colores.textoSuave, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Por cobrar (confirmados)
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4, fontFamily: fuenteDisplay }}>
            {stats ? formatearPrecio(stats.recaudadoProyectado) : '—'}
          </div>
          <div style={{ fontSize: 12, color: colores.textoTenue, marginTop: 6 }}>
            {stats?.confirmados ?? 0} turnos agendados sin atender
          </div>
        </div>
      </section>

      <section style={{ ...card, marginBottom: 24 }}>
        <strong style={{ letterSpacing: '0.03em' }}>
          Recaudación por servicio ({etiquetaPeriodo(periodo)})
        </strong>
        {!stats || stats.porServicio.length === 0 ? (
          <div style={{ color: colores.textoSuave, marginTop: 8 }}>
            Todavía no hay cortes realizados en este período.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10, fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: colores.textoSuave, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '6px 4px' }}>Servicio</th>
                <th style={{ padding: '6px 4px' }}>Precio</th>
                <th style={{ padding: '6px 4px' }}>Realizados</th>
                <th style={{ padding: '6px 4px', textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {stats.porServicio.map((s) => (
                <tr key={s.servicioId} style={{ borderTop: `1px solid ${colores.bordeSuave}` }}>
                  <td style={{ padding: '7px 4px' }}>{s.nombre}</td>
                  <td style={{ padding: '7px 4px', color: colores.textoSuave }}>{formatearPrecio(s.precio)}</td>
                  <td style={{ padding: '7px 4px' }}>{s.realizados}</td>
                  <td style={{ padding: '7px 4px', textAlign: 'right', fontWeight: 600 }}>
                    {formatearPrecio(s.monto)}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: `2px solid ${colores.borde}` }}>
                <td style={{ padding: '7px 4px', fontWeight: 700 }} colSpan={3}>
                  Total
                </td>
                <td style={{ padding: '7px 4px', textAlign: 'right', fontWeight: 700, ...textoDorado }}>
                  {formatearPrecio(stats.recaudado)}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </section>

      <section style={{ ...card, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <strong style={{ letterSpacing: '0.03em' }}>Notificaciones</strong>
          {noLeidas.length > 0 && (
            <button onClick={marcarLeidas} style={botonChico(colores.borde)}>
              Marcar todas leídas
            </button>
          )}
        </div>
        {notis.length === 0 ? (
          <div style={{ color: colores.textoSuave }}>Sin notificaciones.</div>
        ) : (
          <div style={{ display: 'grid', gap: 6 }}>
            {notis.slice(0, 10).map((n) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: n.leida ? 'transparent' : 'rgba(212,175,55,0.08)',
                  border: `1px solid ${n.leida ? colores.bordeSuave : colores.oroOscuro}`,
                  fontSize: 14,
                }}
              >
                <span>{n.mensaje}</span>
                <span style={{ color: colores.textoTenue, fontSize: 12, whiteSpace: 'nowrap' }}>
                  {new Date(n.createdAt).toLocaleString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <strong style={{ letterSpacing: '0.03em' }}>Solicitudes pendientes ({pendientes.length})</strong>
          <Link href="/admin/agenda" style={{ fontSize: 13, color: colores.oroClaro }}>
            Ver agenda completa →
          </Link>
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {pendientes.length === 0 ? (
            <div style={{ color: colores.textoSuave }}>No hay turnos esperando confirmación.</div>
          ) : (
            pendientes.map((t) => <FilaTurno key={t.id} turno={t} onAccion={accion} mostrarFecha />)
          )}
        </div>
      </section>
    </main>
  );
}

function Kpi({ titulo: t, valor, color }: { titulo: string; valor: number | string; color: string }) {
  return (
    <div style={{ ...card, borderTop: `3px solid ${color}`, background: 'linear-gradient(180deg, #1F232B, #191C22)' }}>
      <div style={{ fontSize: 11, color: colores.textoSuave, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {t}
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, marginTop: 2, fontFamily: fuenteDisplay }}>{valor}</div>
    </div>
  );
}

export default function PanelPage() {
  return (
    <Protegido rol="admin">
      <PanelInner />
    </Protegido>
  );
}
