'use client';

import { useCallback, useEffect, useState } from 'react';
import { Protegido } from '../../../components/Protegido';
import { api } from '../../../lib/api';
import {
  BloqueoAgenda,
  ConfiguracionAgenda,
  DIAS_SEMANA,
  HorarioTrabajo,
} from '../../../lib/types';
import {
  avisoError,
  avisoOk,
  boton,
  botonChico,
  card,
  colores,
  input,
  label,
  page,
  titulo,
} from '../../../lib/ui';

function hoyISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function HorariosInner() {
  const [semana, setSemana] = useState<HorarioTrabajo[]>([]);
  const [config, setConfig] = useState<ConfiguracionAgenda | null>(null);
  const [bloqueos, setBloqueos] = useState<BloqueoAgenda[]>([]);
  const [nuevoBloqueo, setNuevoBloqueo] = useState({ fecha: hoyISO(), horaInicio: '', horaFin: '', motivo: '' });
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [s, c, b] = await Promise.all([
        api<HorarioTrabajo[]>('/horarios', { auth: false }),
        api<ConfiguracionAgenda>('/horarios/configuracion', { auth: false }),
        api<BloqueoAgenda[]>(`/horarios/bloqueos?desde=${hoyISO()}`, { auth: false }),
      ]);
      setSemana(s);
      setConfig(c);
      setBloqueos(b);
    } catch (err: any) {
      setMsg({ tipo: 'error', texto: err.message || 'No se pudo cargar la configuración.' });
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function editarDia(dia: number, campo: keyof HorarioTrabajo, valor: string | boolean) {
    setSemana((prev) =>
      prev.map((h) => (h.diaSemana === dia ? { ...h, [campo]: valor } : h)),
    );
  }

  async function guardarDia(h: HorarioTrabajo) {
    setMsg(null);
    try {
      await api(`/horarios/${h.diaSemana}`, {
        method: 'PUT',
        body: {
          activo: h.activo,
          horaApertura: h.horaApertura,
          horaCierre: h.horaCierre,
          descansoInicio: h.descansoInicio || null,
          descansoFin: h.descansoFin || null,
        },
      });
      setMsg({ tipo: 'ok', texto: `${DIAS_SEMANA[h.diaSemana]} guardado.` });
      cargar();
    } catch (err: any) {
      setMsg({ tipo: 'error', texto: err.message || 'No se pudo guardar el día.' });
    }
  }

  async function guardarConfig() {
    if (!config) return;
    setMsg(null);
    try {
      await api('/horarios/configuracion', {
        method: 'PUT',
        body: {
          intervaloTurnos: config.intervaloTurnos,
          anticipacionMinimaHoras: config.anticipacionMinimaHoras,
        },
      });
      setMsg({ tipo: 'ok', texto: 'Configuración guardada.' });
    } catch (err: any) {
      setMsg({ tipo: 'error', texto: err.message || 'No se pudo guardar la configuración.' });
    }
  }

  async function crearBloqueo(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await api('/horarios/bloqueos', {
        body: {
          fecha: nuevoBloqueo.fecha,
          horaInicio: nuevoBloqueo.horaInicio || null,
          horaFin: nuevoBloqueo.horaFin || null,
          motivo: nuevoBloqueo.motivo || undefined,
        },
      });
      setNuevoBloqueo({ fecha: hoyISO(), horaInicio: '', horaFin: '', motivo: '' });
      cargar();
    } catch (err: any) {
      setMsg({ tipo: 'error', texto: err.message || 'No se pudo crear el bloqueo.' });
    }
  }

  async function eliminarBloqueo(id: number) {
    await api(`/horarios/bloqueos/${id}`, { method: 'DELETE' }).catch(() => {});
    cargar();
  }

  return (
    <main style={page}>
      <h1 style={{ ...titulo, fontSize: 26, marginBottom: 16 }}>Horarios y días de atención</h1>

      {msg && (
        <div style={{ ...(msg.tipo === 'ok' ? avisoOk : avisoError), marginBottom: 16 }}>
          {msg.texto}
        </div>
      )}

      <section style={{ ...card, marginBottom: 20 }}>
        <strong style={{ letterSpacing: '0.03em' }}>Horario semanal</strong>
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {semana.map((h) => (
            <div
              key={h.diaSemana}
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 70px 1fr 1fr auto',
                gap: 10,
                alignItems: 'center',
                padding: '8px 0',
                borderTop: `1px solid ${colores.bordeSuave}`,
                opacity: h.activo ? 1 : 0.5,
              }}
            >
              <span style={{ fontWeight: 600 }}>{DIAS_SEMANA[h.diaSemana]}</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: colores.textoSuave }}>
                <input
                  type="checkbox"
                  checked={h.activo}
                  onChange={(e) => editarDia(h.diaSemana, 'activo', e.target.checked)}
                  style={{ accentColor: colores.oro }}
                />
                Abre
              </label>
              <label style={label}>
                Apertura / Cierre
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    style={input}
                    type="time"
                    value={h.horaApertura}
                    onChange={(e) => editarDia(h.diaSemana, 'horaApertura', e.target.value)}
                  />
                  <input
                    style={input}
                    type="time"
                    value={h.horaCierre}
                    onChange={(e) => editarDia(h.diaSemana, 'horaCierre', e.target.value)}
                  />
                </div>
              </label>
              <label style={label}>
                Descanso (opcional)
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    style={input}
                    type="time"
                    value={h.descansoInicio ?? ''}
                    onChange={(e) => editarDia(h.diaSemana, 'descansoInicio', e.target.value)}
                  />
                  <input
                    style={input}
                    type="time"
                    value={h.descansoFin ?? ''}
                    onChange={(e) => editarDia(h.diaSemana, 'descansoFin', e.target.value)}
                  />
                </div>
              </label>
              <button onClick={() => guardarDia(h)} style={botonChico()}>
                Guardar
              </button>
            </div>
          ))}
        </div>
      </section>

      {config && (
        <section style={{ ...card, marginBottom: 20 }}>
          <strong style={{ letterSpacing: '0.03em' }}>Configuración de turnos</strong>
          <div style={{ display: 'flex', gap: 16, alignItems: 'end', marginTop: 12, flexWrap: 'wrap' }}>
            <label style={label}>
              Intervalo entre horarios (min)
              <input
                style={{ ...input, width: 120 }}
                type="number"
                min={5}
                max={120}
                step={5}
                value={config.intervaloTurnos}
                onChange={(e) => setConfig({ ...config, intervaloTurnos: Number(e.target.value) })}
              />
            </label>
            <label style={label}>
              Antelación mínima para reservar (horas)
              <input
                style={{ ...input, width: 120 }}
                type="number"
                min={0}
                max={168}
                value={config.anticipacionMinimaHoras}
                onChange={(e) =>
                  setConfig({ ...config, anticipacionMinimaHoras: Number(e.target.value) })
                }
              />
            </label>
            <button onClick={guardarConfig} style={boton()}>
              Guardar
            </button>
          </div>
        </section>
      )}

      <section style={card}>
        <strong style={{ letterSpacing: '0.03em' }}>
          Bloqueos de agenda (feriados, francos, vacaciones)
        </strong>
        <form
          onSubmit={crearBloqueo}
          style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr 1fr 2fr auto', alignItems: 'end', marginTop: 12 }}
        >
          <label style={label}>
            Fecha
            <input
              style={input}
              type="date"
              value={nuevoBloqueo.fecha}
              min={hoyISO()}
              required
              onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, fecha: e.target.value })}
            />
          </label>
          <label style={label}>
            Desde (vacío = todo el día)
            <input
              style={input}
              type="time"
              value={nuevoBloqueo.horaInicio}
              onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, horaInicio: e.target.value })}
            />
          </label>
          <label style={label}>
            Hasta
            <input
              style={input}
              type="time"
              value={nuevoBloqueo.horaFin}
              onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, horaFin: e.target.value })}
            />
          </label>
          <label style={label}>
            Motivo
            <input
              style={input}
              value={nuevoBloqueo.motivo}
              onChange={(e) => setNuevoBloqueo({ ...nuevoBloqueo, motivo: e.target.value })}
            />
          </label>
          <button type="submit" style={boton()}>
            Agregar
          </button>
        </form>

        <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
          {bloqueos.length === 0 ? (
            <div style={{ color: colores.textoSuave }}>No hay bloqueos próximos.</div>
          ) : (
            bloqueos.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: `1px solid ${colores.bordeSuave}`,
                  background: colores.superficieAlt,
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 14,
                }}
              >
                <span>
                  <strong>{b.fecha}</strong>{' '}
                  {b.horaInicio ? `${b.horaInicio}–${b.horaFin}` : 'todo el día'}
                  {b.motivo ? ` · ${b.motivo}` : ''}
                </span>
                <button onClick={() => eliminarBloqueo(b.id)} style={botonChico(colores.rojo)}>
                  Quitar
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

export default function HorariosPage() {
  return (
    <Protegido rol="admin">
      <HorariosInner />
    </Protegido>
  );
}
