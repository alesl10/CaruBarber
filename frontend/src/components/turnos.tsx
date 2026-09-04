'use client';

import { fechaLarga } from '../lib/fechas';
import { Turno } from '../lib/types';
import {
  botonChico,
  card,
  chipEstado,
  colores,
  formatearPrecio,
} from '../lib/ui';

export type AccionTurno = 'confirmar' | 'realizar' | 'cancelar';

export function AccionesTurno({
  turno,
  onAccion,
}: {
  turno: Turno;
  onAccion: (id: number, accion: AccionTurno) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {turno.estado === 'pendiente' && (
        <button onClick={() => onAccion(turno.id, 'confirmar')} style={botonChico(colores.azul)}>
          Confirmar
        </button>
      )}
      {turno.estado === 'confirmado' && (
        <button onClick={() => onAccion(turno.id, 'realizar')} style={botonChico(colores.verde)}>
          Marcar realizado
        </button>
      )}
      {turno.estado !== 'cancelado' && turno.estado !== 'realizado' && (
        <button onClick={() => onAccion(turno.id, 'cancelar')} style={botonChico(colores.rojo)}>
          Cancelar
        </button>
      )}
    </div>
  );
}

export function FilaTurno({
  turno,
  onAccion,
  mostrarFecha = false,
}: {
  turno: Turno;
  onAccion: (id: number, accion: AccionTurno) => void;
  mostrarFecha?: boolean;
}) {
  return (
    <div
      style={{
        border: `1px solid ${colores.bordeSuave}`,
        background: colores.superficieAlt,
        borderRadius: 11,
        padding: 13,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        opacity: turno.estado === 'cancelado' ? 0.5 : 1,
      }}
    >
      <div>
        <div style={{ fontWeight: 600 }}>
          {turno.horaInicio}–{turno.horaFin} · {turno.servicioNombre}
          {turno.servicioPrecio != null && (
            <span style={{ fontWeight: 400, color: colores.textoSuave }}>
              {' '}
              · {formatearPrecio(turno.servicioPrecio)}
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, color: colores.textoSuave }}>
          {turno.clienteNombre}
          {turno.clienteTelefono ? ` · ${turno.clienteTelefono}` : ''}
          {mostrarFecha ? ` · ${turno.fecha}` : ''}
        </div>
        {turno.notaCliente && (
          <div style={{ fontSize: 12, color: colores.textoTenue, marginTop: 4 }}>
            Nota: {turno.notaCliente}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={chipEstado(turno.estado)}>{turno.estado}</span>
        <AccionesTurno turno={turno} onAccion={onAccion} />
      </div>
    </div>
  );
}

export function TurnoModal({
  turno,
  onClose,
  onAccion,
}: {
  turno: Turno;
  onClose: () => void;
  onAccion: (id: number, accion: AccionTurno) => void;
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ ...card, maxWidth: 420, width: '100%', display: 'grid', gap: 10 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: 15, letterSpacing: '0.03em' }}>Turno #{turno.id}</strong>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              cursor: 'pointer',
              lineHeight: 1,
              color: colores.textoSuave,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ fontSize: 14, display: 'grid', gap: 4 }}>
          <div>{fechaLarga(turno.fecha)}</div>
          <div style={{ fontWeight: 600 }}>
            {turno.horaInicio}–{turno.horaFin} · {turno.servicioNombre}
          </div>
          <div>
            {turno.clienteNombre}
            {turno.clienteTelefono ? ` · ${turno.clienteTelefono}` : ''}
          </div>
          {turno.servicioPrecio != null && <div>{formatearPrecio(turno.servicioPrecio)}</div>}
          {turno.notaCliente && (
            <div style={{ color: colores.textoTenue }}>Nota: {turno.notaCliente}</div>
          )}
          <div style={{ marginTop: 4 }}>
            <span style={chipEstado(turno.estado)}>{turno.estado}</span>
          </div>
        </div>
        <div style={{ marginTop: 6 }}>
          <AccionesTurno
            turno={turno}
            onAccion={(id, accion) => {
              onAccion(id, accion);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
