'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { LogoBadge, Wordmark } from '../../../components/Logo';
import { api } from '../../../lib/api';
import { fechaLarga } from '../../../lib/fechas';
import { EstadoTurno } from '../../../lib/types';
import {
  avisoError,
  avisoOk,
  boton,
  card,
  chipEstado,
  colores,
  page,
  titulo,
} from '../../../lib/ui';

interface RespuestaPublica {
  rol: 'admin' | 'cliente';
  turno: {
    id: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    estado: EstadoTurno;
    servicioNombre: string;
    clienteNombre: string;
    notaCliente: string | null;
  };
  puede: { confirmar: boolean; cancelar: boolean };
}

export default function TurnoPublicoPage() {
  return (
    <Suspense fallback={<main style={{ ...page, maxWidth: 460, margin: '0 auto' }}>Cargando…</main>}>
      <TurnoPublico />
    </Suspense>
  );
}

function TurnoPublico() {
  const { token } = useParams<{ token: string }>();
  const accionSugerida = useSearchParams().get('accion');

  const [data, setData] = useState<RespuestaPublica | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [hecho, setHecho] = useState<'confirmar' | 'cancelar' | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setData(await api<RespuestaPublica>(`/turnos/publico/${token}`, { auth: false }));
      setError('');
    } catch (err: any) {
      setError(err.message || 'No se pudo abrir el turno.');
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function ejecutar(accion: 'confirmar' | 'cancelar') {
    setProcesando(true);
    setError('');
    try {
      await api(`/turnos/publico/${token}`, { method: 'POST', body: { accion }, auth: false });
      setHecho(accion);
      await cargar();
    } catch (err: any) {
      setError(err.message || 'No se pudo completar la acción.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <main style={{ ...page, maxWidth: 460, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 20px' }}>
        <LogoBadge size={40} />
        <Wordmark size={18} />
      </div>
      <h1 style={{ ...titulo, fontSize: 22, marginBottom: 16 }}>Gestión de turno</h1>

      {cargando && <div style={{ color: colores.textoSuave }}>Cargando…</div>}

      {error && !cargando && <div style={avisoError}>{error}</div>}

      {data && (
        <div style={{ ...card, display: 'grid', gap: 10 }}>
          <div style={{ fontSize: 14, display: 'grid', gap: 4 }}>
            <div>{fechaLarga(data.turno.fecha)}</div>
            <div style={{ fontWeight: 600 }}>
              {data.turno.horaInicio}–{data.turno.horaFin} · {data.turno.servicioNombre}
            </div>
            <div>Cliente: {data.turno.clienteNombre}</div>
            {data.turno.notaCliente && (
              <div style={{ color: colores.textoTenue }}>Nota: {data.turno.notaCliente}</div>
            )}
            <div style={{ marginTop: 4 }}>
              <span style={chipEstado(data.turno.estado)}>{data.turno.estado}</span>
            </div>
          </div>

          {hecho ? (
            <div style={hecho === 'confirmar' ? avisoOk : avisoError}>
              {hecho === 'confirmar'
                ? 'Turno confirmado. Se le avisó al cliente.'
                : 'Turno cancelado.'}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {data.puede.confirmar && (
                <button
                  onClick={() => ejecutar('confirmar')}
                  disabled={procesando}
                  style={{
                    ...boton(colores.verde, procesando),
                    outline: accionSugerida === 'confirmar' ? `2px solid ${colores.oro}` : 'none',
                    outlineOffset: 2,
                  }}
                >
                  Confirmar turno
                </button>
              )}
              {data.puede.cancelar && (
                <button
                  onClick={() => ejecutar('cancelar')}
                  disabled={procesando}
                  style={{
                    ...boton(colores.rojo, procesando),
                    outline: accionSugerida === 'cancelar' ? `2px solid ${colores.oro}` : 'none',
                    outlineOffset: 2,
                  }}
                >
                  Cancelar turno
                </button>
              )}
              {!data.puede.confirmar && !data.puede.cancelar && (
                <div style={{ color: colores.textoSuave, fontSize: 14 }}>
                  Este turno ya no admite cambios desde este enlace.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
