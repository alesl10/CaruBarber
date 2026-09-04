'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Protegido } from '../../components/Protegido';
import { api } from '../../lib/api';
import { Disponibilidad, Servicio } from '../../lib/types';
import {
  avisoError,
  avisoOk,
  boton,
  card,
  chipEstado,
  colores,
  formatearPrecio,
  input,
  label,
  page,
  titulo,
} from '../../lib/ui';

function hoyISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function ReservarInner() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [servicioId, setServicioId] = useState<number | null>(null);
  const [fecha, setFecha] = useState(hoyISO());
  const [disp, setDisp] = useState<Disponibilidad | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  const servicio = useMemo(
    () => servicios.find((s) => s.id === servicioId) ?? null,
    [servicios, servicioId],
  );

  useEffect(() => {
    api<Servicio[]>('/servicios', { auth: false })
      .then((data) => {
        setServicios(data);
        if (data.length) setServicioId((prev) => prev ?? data[0].id);
      })
      .catch(() => setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los servicios.' }));
  }, []);

  const cargarDisponibilidad = useCallback(async () => {
    if (!servicioId || !fecha) return;
    setCargandoSlots(true);
    setSlot(null);
    try {
      const data = await api<Disponibilidad>(
        `/turnos/disponibilidad?fecha=${fecha}&servicioId=${servicioId}`,
      );
      setDisp(data);
    } catch (err: any) {
      setDisp(null);
      setMensaje({ tipo: 'error', texto: err.message || 'No se pudo cargar la disponibilidad.' });
    } finally {
      setCargandoSlots(false);
    }
  }, [servicioId, fecha]);

  useEffect(() => {
    cargarDisponibilidad();
  }, [cargarDisponibilidad]);

  async function reservar() {
    if (!servicioId || !slot) return;
    setEnviando(true);
    setMensaje(null);
    try {
      await api('/turnos', {
        body: { servicioId, fecha, horaInicio: slot, nota: nota.trim() || undefined },
      });
      setMensaje({
        tipo: 'ok',
        texto: `Turno solicitado para el ${fecha} a las ${slot}. Queda pendiente hasta que el barbero lo confirme.`,
      });
      setNota('');
      cargarDisponibilidad();
    } catch (err: any) {
      setMensaje({ tipo: 'error', texto: err.message || 'No se pudo reservar el turno.' });
      cargarDisponibilidad();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main style={page}>
      <h1 style={{ ...titulo, fontSize: 26, marginBottom: 18 }}>Reservar un turno</h1>

      {mensaje && (
        <div style={{ ...(mensaje.tipo === 'ok' ? avisoOk : avisoError), marginBottom: 20 }}>
          {mensaje.texto}
        </div>
      )}

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'minmax(260px, 1fr) 1.4fr' }}>
        <div style={{ ...card, display: 'grid', gap: 16, alignContent: 'start' }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <span style={label}>Servicio</span>
            {servicios.map((s) => {
              const sel = servicioId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setServicioId(s.id)}
                  style={{
                    textAlign: 'left',
                    border: `1px solid ${sel ? colores.oro : colores.borde}`,
                    background: sel ? 'rgba(212,175,55,0.12)' : colores.superficieAlt,
                    color: colores.texto,
                    borderRadius: 10,
                    padding: '10px 12px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{s.nombre}</div>
                  <div style={{ fontSize: 12, color: colores.textoSuave }}>
                    {s.duracionMinutos} min · {formatearPrecio(s.precio)}
                  </div>
                </button>
              );
            })}
          </div>

          <label style={label}>
            Fecha
            <input
              type="date"
              value={fecha}
              min={hoyISO()}
              onChange={(e) => setFecha(e.target.value)}
              style={input}
            />
          </label>

          <label style={label}>
            Nota para el barbero (opcional)
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={3}
              style={{ ...input, resize: 'vertical' }}
            />
          </label>
        </div>

        <div style={{ ...card, display: 'grid', gap: 12, alignContent: 'start' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <strong style={{ letterSpacing: '0.03em' }}>Horarios disponibles</strong>
            {servicio && (
              <span style={{ fontSize: 12, color: colores.textoSuave }}>
                Duración: {servicio.duracionMinutos} min
              </span>
            )}
          </div>

          {cargandoSlots ? (
            <div style={{ color: colores.textoSuave }}>Buscando horarios…</div>
          ) : !disp || disp.slots.length === 0 ? (
            <div style={{ color: colores.textoSuave }}>
              No hay horarios disponibles para esa fecha. Probá con otro día.
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {disp.slots.map((h) => {
                const sel = slot === h;
                return (
                  <button
                    key={h}
                    onClick={() => setSlot(h)}
                    style={{
                      border: `1px solid ${sel ? colores.oro : colores.borde}`,
                      background: sel ? 'rgba(212,175,55,0.16)' : colores.superficieAlt,
                      color: sel ? colores.oroClaro : colores.texto,
                      borderRadius: 999,
                      padding: '8px 14px',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: sel ? 600 : 400,
                    }}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
            <button onClick={reservar} disabled={!slot || enviando} style={boton(undefined, !slot || enviando)}>
              {enviando ? 'Reservando…' : 'Confirmar reserva'}
            </button>
            {slot && (
              <span style={{ fontSize: 13, color: colores.textoSuave }}>
                {servicio?.nombre} · {fecha} · {slot}
                <span style={{ marginLeft: 8, ...chipEstado('pendiente') }}>pendiente</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ReservarPage() {
  return (
    <Protegido rol="cliente">
      <ReservarInner />
    </Protegido>
  );
}
