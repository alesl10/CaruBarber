'use client';

import { Fragment, type ReactNode } from 'react';
import { DIAS_CORTOS, parseISO } from '../lib/fechas';
import type { EstadisticaDia, EstadisticaServicio } from '../lib/types';
import { card, colores, colorEstado, formatearPrecio, fuenteDisplay } from '../lib/ui';

const W = 660;
const H = 210;
const PAD = { top: 14, right: 14, bottom: 26, left: 50 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

function montoCorto(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `$${Math.round(v / 1000)}k`;
  return `$${Math.round(v)}`;
}

function etiquetaDia(fecha: string, total: number): string {
  const d = parseISO(fecha);
  if (total <= 8) return DIAS_CORTOS[(d.getDay() + 6) % 7];
  return String(d.getDate());
}

function Contenedor({ titulo, children, vacio }: { titulo: string; children: ReactNode; vacio?: boolean }) {
  return (
    <div style={card}>
      <strong style={{ letterSpacing: '0.03em', fontSize: 14 }}>{titulo}</strong>
      {vacio ? (
        <div style={{ color: colores.textoSuave, marginTop: 10, fontSize: 13 }}>
          Todavía no hay datos en este período.
        </div>
      ) : (
        <div style={{ marginTop: 10, width: '100%', overflowX: 'auto' }}>{children}</div>
      )}
    </div>
  );
}

function Ejes({ max, formato }: { max: number; formato: (v: number) => string }) {
  const lineas = [0, 0.25, 0.5, 0.75, 1];
  return (
    <>
      {lineas.map((f) => {
        const y = PAD.top + INNER_H * (1 - f);
        return (
          <Fragment key={f}>
            <line
              x1={PAD.left}
              x2={PAD.left + INNER_W}
              y1={y}
              y2={y}
              stroke={colores.bordeSuave}
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={y + 3}
              textAnchor="end"
              fontSize={10}
              fill={colores.textoTenue}
            >
              {formato(max * f)}
            </text>
          </Fragment>
        );
      })}
    </>
  );
}

function EtiquetasX({ serie }: { serie: EstadisticaDia[] }) {
  const n = serie.length;
  const paso = Math.max(1, Math.ceil(n / 12));
  const bw = INNER_W / n;
  return (
    <>
      {serie.map((d, i) => {
        if (i % paso !== 0 && i !== n - 1) return null;
        return (
          <text
            key={d.fecha}
            x={PAD.left + bw * (i + 0.5)}
            y={H - 8}
            textAnchor="middle"
            fontSize={10}
            fill={colores.textoTenue}
          >
            {etiquetaDia(d.fecha, n)}
          </text>
        );
      })}
    </>
  );
}

/** Barras: recaudado por día (cortes realizados). */
export function GraficoRecaudado({ serie }: { serie: EstadisticaDia[] }) {
  const total = serie.reduce((s, d) => s + d.recaudado, 0);
  const max = Math.max(...serie.map((d) => d.recaudado), 1);
  const bw = INNER_W / serie.length;

  return (
    <Contenedor titulo="Recaudado por día" vacio={total === 0}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: serie.length > 14 ? 520 : undefined, display: 'block' }}>
        <Ejes max={max} formato={montoCorto} />
        {serie.map((d, i) => {
          const h = (d.recaudado / max) * INNER_H;
          return (
            <rect
              key={d.fecha}
              x={PAD.left + bw * i + bw * 0.18}
              y={PAD.top + INNER_H - h}
              width={bw * 0.64}
              height={h}
              rx={2}
              fill={colores.oro}
            >
              <title>{`${d.fecha} · ${formatearPrecio(d.recaudado)} · ${d.realizados} corte(s)`}</title>
            </rect>
          );
        })}
        <EtiquetasX serie={serie} />
      </svg>
    </Contenedor>
  );
}

const CAPAS: { key: keyof EstadisticaDia; estado: string }[] = [
  { key: 'realizados', estado: 'realizado' },
  { key: 'confirmados', estado: 'confirmado' },
  { key: 'pendientes', estado: 'pendiente' },
  { key: 'cancelados', estado: 'cancelado' },
];

/** Barras apiladas: turnos por día, por estado. */
export function GraficoTurnos({ serie }: { serie: EstadisticaDia[] }) {
  const totalDia = (d: EstadisticaDia) =>
    d.pendientes + d.confirmados + d.realizados + d.cancelados;
  const total = serie.reduce((s, d) => s + totalDia(d), 0);
  const max = Math.max(...serie.map(totalDia), 1);
  const bw = INNER_W / serie.length;

  return (
    <Contenedor titulo="Turnos por día" vacio={total === 0}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: serie.length > 14 ? 520 : undefined, display: 'block' }}>
        <Ejes max={max} formato={(v) => String(Math.round(v))} />
        {serie.map((d, i) => {
          let acum = 0;
          return (
            <g key={d.fecha}>
              {CAPAS.map(({ key, estado }) => {
                const val = d[key] as number;
                if (!val) return null;
                const h = (val / max) * INNER_H;
                const y = PAD.top + INNER_H - acum - h;
                acum += h;
                return (
                  <rect
                    key={estado}
                    x={PAD.left + bw * i + bw * 0.18}
                    y={y}
                    width={bw * 0.64}
                    height={h}
                    fill={colorEstado[estado]}
                  >
                    <title>{`${d.fecha} · ${val} ${estado}(s)`}</title>
                  </rect>
                );
              })}
            </g>
          );
        })}
        <EtiquetasX serie={serie} />
      </svg>
      <Leyenda items={CAPAS.map((c) => ({ color: colorEstado[c.estado], texto: c.estado }))} />
    </Contenedor>
  );
}

function Leyenda({ items }: { items: { color: string; texto: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 8 }}>
      {items.map((it) => (
        <span key={it.texto} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: colores.textoSuave }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: it.color }} />
          {it.texto}
        </span>
      ))}
    </div>
  );
}

/** Barras horizontales: recaudación por servicio (cortes realizados). */
export function GraficoServicios({ porServicio }: { porServicio: EstadisticaServicio[] }) {
  const max = Math.max(...porServicio.map((s) => s.monto), 1);

  return (
    <Contenedor titulo="Recaudación por servicio" vacio={porServicio.length === 0}>
      <div style={{ display: 'grid', gap: 10 }}>
        {porServicio.map((s) => (
          <div key={s.servicioId} style={{ display: 'grid', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, gap: 10 }}>
              <span>
                {s.nombre}{' '}
                <span style={{ color: colores.textoTenue }}>· {s.realizados}</span>
              </span>
              <strong style={{ fontFamily: fuenteDisplay }}>{formatearPrecio(s.monto)}</strong>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: colores.superficieAlt, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(s.monto / max) * 100}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, #9A751C, #D4AF37, #F2D98A)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Contenedor>
  );
}
