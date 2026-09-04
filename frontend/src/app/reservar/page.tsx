'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import {
  DIAS_CORTOS,
  addMeses,
  fechaLarga,
  gridMes,
  hoyISO,
  mismoMes,
  nombreMes,
  parseISO,
  rangoMes,
} from '../../lib/fechas';
import { BloqueoAgenda, Disponibilidad, HorarioTrabajo, Servicio } from '../../lib/types';
import {
  avisoError,
  avisoOk,
  boton,
  botonGhost,
  card,
  chipEstado,
  colores,
  formatearPrecio,
  fuenteDisplay,
  input,
  label,
  oroGradiente,
  page,
  titulo,
} from '../../lib/ui';

const CONTACTO_KEY = 'turnero.contacto';

interface Contacto {
  nombre: string;
  email: string;
  telefono: string;
}

function contactoGuardado(): Contacto {
  if (typeof window === 'undefined') return { nombre: '', email: '', telefono: '' };
  try {
    const crudo = window.localStorage.getItem(CONTACTO_KEY);
    if (!crudo) return { nombre: '', email: '', telefono: '' };
    const d = JSON.parse(crudo);
    return { nombre: d.nombre || '', email: d.email || '', telefono: d.telefono || '' };
  } catch {
    return { nombre: '', email: '', telefono: '' };
  }
}

function guardarContacto(c: Contacto) {
  try {
    window.localStorage.setItem(CONTACTO_KEY, JSON.stringify(c));
  } catch {
    /* almacenamiento no disponible */
  }
}

/** El servicio que se preselecciona al entrar (por nombre, no por id: el orden puede variar). */
function elegirServicioPorDefecto(lista: Servicio[]): number | null {
  if (!lista.length) return null;
  const clasico = lista.find((s) => {
    const n = s.nombre.toLowerCase();
    return n.includes('clásico') || n.includes('clasico');
  });
  return (clasico ?? lista[0]).id;
}

export default function ReservarPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [servicioId, setServicioId] = useState<number | null>(null);
  const [fecha, setFecha] = useState(hoyISO());
  const [mesAncla, setMesAncla] = useState(hoyISO());
  const [horarios, setHorarios] = useState<HorarioTrabajo[]>([]);
  const [bloqueos, setBloqueos] = useState<BloqueoAgenda[]>([]);
  const [disp, setDisp] = useState<Disponibilidad | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [contacto, setContacto] = useState<Contacto>({ nombre: '', email: '', telefono: '' });
  const [nota, setNota] = useState('');
  const [cargandoSlots, setCargandoSlots] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Recordar los datos de contacto del último turno reservado en este navegador (sin cuenta).
  useEffect(() => {
    setContacto(contactoGuardado());
  }, []);

  const servicio = useMemo(
    () => servicios.find((s) => s.id === servicioId) ?? null,
    [servicios, servicioId],
  );

  useEffect(() => {
    api<Servicio[]>('/servicios', { auth: false })
      .then((data) => {
        setServicios(data);
        setServicioId((prev) => prev ?? elegirServicioPorDefecto(data));
      })
      .catch(() => setMensaje({ tipo: 'error', texto: 'No se pudieron cargar los servicios.' }));
  }, []);

  useEffect(() => {
    Promise.all([
      api<HorarioTrabajo[]>('/horarios', { auth: false }),
      api<BloqueoAgenda[]>(`/horarios/bloqueos?desde=${hoyISO()}`, { auth: false }),
    ])
      .then(([h, b]) => {
        setHorarios(h);
        setBloqueos(b);
      })
      .catch(() => undefined);
  }, []);

  const cargarDisponibilidad = useCallback(async () => {
    if (!servicioId || !fecha) return;
    setCargandoSlots(true);
    setSlot(null);
    try {
      const data = await api<Disponibilidad>(
        `/turnos/disponibilidad?fecha=${fecha}&servicioId=${servicioId}`,
        { auth: false },
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
    const nombre = contacto.nombre.trim();
    const email = contacto.email.trim();
    const telefono = contacto.telefono.trim();
    if (!nombre || !email || !telefono) {
      setMensaje({ tipo: 'error', texto: 'Completá nombre, email y celular para reservar.' });
      return;
    }

    setEnviando(true);
    setMensaje(null);
    try {
      await api('/turnos', {
        auth: false,
        body: {
          servicioId,
          fecha,
          horaInicio: slot,
          nombre,
          email,
          telefono,
          nota: nota.trim() || undefined,
        },
      });
      guardarContacto({ nombre, email, telefono });
      setMensaje({
        tipo: 'ok',
        texto: `Turno solicitado para el ${fecha} a las ${slot}. Te llega un email a ${email} y, cuando el barbero lo confirme, otro aviso ahí mismo.`,
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

      <div style={{ display: 'grid', gap: 20, maxWidth: 640, margin: '0 auto' }}>
        <div style={card}>
          <Calendario
            mesAncla={mesAncla}
            fechaSel={fecha}
            horarios={horarios}
            bloqueos={bloqueos}
            onCambiarMes={(dir) => setMesAncla((m) => addMeses(m, dir))}
            onSeleccionar={setFecha}
          />

          <div style={{ borderTop: `1px solid ${colores.bordeSuave}`, margin: '18px 0 14px' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
            <strong style={{ letterSpacing: '0.03em' }}>Horarios para {fechaLarga(fecha)}</strong>
            {servicio && (
              <span style={{ fontSize: 12, color: colores.textoSuave }}>
                Duración: {servicio.duracionMinutos} min
              </span>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            {cargandoSlots ? (
              <div style={{ color: colores.textoSuave }}>Buscando horarios…</div>
            ) : !disp || disp.slots.length === 0 ? (
              <div style={{ color: colores.textoSuave }}>
                No hay horarios disponibles para ese día. Probá con otra fecha en el calendario.
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
                        background: sel ? oroGradiente : colores.superficieAlt,
                        color: sel ? '#1B1206' : colores.texto,
                        borderRadius: 999,
                        padding: '8px 14px',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: sel ? 700 : 400,
                      }}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ ...card, display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <span style={label}>Servicio</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
                      padding: '8px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.nombre}</div>
                    <div style={{ fontSize: 11, color: colores.textoSuave }}>
                      {s.duracionMinutos} min · {formatearPrecio(s.precio)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            <label style={label}>
              Nombre
              <input
                style={input}
                value={contacto.nombre}
                required
                onChange={(e) => setContacto({ ...contacto, nombre: e.target.value })}
              />
            </label>
            <label style={label}>
              Email
              <input
                style={input}
                type="email"
                value={contacto.email}
                required
                onChange={(e) => setContacto({ ...contacto, email: e.target.value })}
              />
            </label>
            <label style={label}>
              Celular
              <input
                style={input}
                type="tel"
                value={contacto.telefono}
                required
                onChange={(e) => setContacto({ ...contacto, telefono: e.target.value })}
              />
            </label>
          </div>

          <label style={label}>
            Nota para el barbero (opcional)
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={2}
              style={{ ...input, resize: 'vertical' }}
            />
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
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

function Calendario({
  mesAncla,
  fechaSel,
  horarios,
  bloqueos,
  onCambiarMes,
  onSeleccionar,
}: {
  mesAncla: string;
  fechaSel: string;
  horarios: HorarioTrabajo[];
  bloqueos: BloqueoAgenda[];
  onCambiarMes: (dir: -1 | 1) => void;
  onSeleccionar: (fecha: string) => void;
}) {
  const dias = gridMes(mesAncla);
  const hoy = hoyISO();
  const { desde: primerDelMes } = rangoMes(mesAncla);

  const activoPorDiaSemana = useMemo(
    () => new Map(horarios.map((h) => [h.diaSemana, h.activo])),
    [horarios],
  );
  const bloqueadosCompletos = useMemo(
    () => new Set(bloqueos.filter((b) => !b.horaInicio).map((b) => b.fecha)),
    [bloqueos],
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <button onClick={() => onCambiarMes(-1)} style={botonGhost()} aria-label="Mes anterior">
          ◀
        </button>
        <strong style={{ fontFamily: fuenteDisplay, fontSize: 16, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {nombreMes(mesAncla)}
        </strong>
        <button onClick={() => onCambiarMes(1)} style={botonGhost()} aria-label="Mes siguiente">
          ▶
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {DIAS_CORTOS.map((d) => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: colores.textoSuave,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {dias.map((d) => {
          const fueraDeMes = !mismoMes(d, primerDelMes);
          const esPasado = d < hoy;
          const diaSemana = parseISO(d).getDay();
          const inactivoSemanal = activoPorDiaSemana.get(diaSemana) === false;
          const bloqueado = bloqueadosCompletos.has(d);
          const deshabilitado = esPasado || inactivoSemanal || bloqueado;
          const seleccionado = d === fechaSel;
          const esHoy = d === hoy;

          return (
            <button
              key={d}
              disabled={deshabilitado}
              onClick={() => onSeleccionar(d)}
              title={inactivoSemanal ? 'No hay atención ese día' : bloqueado ? 'Día bloqueado' : undefined}
              style={{
                aspectRatio: '1',
                borderRadius: 10,
                border: `1px solid ${seleccionado ? colores.oro : esHoy ? colores.oroOscuro : colores.bordeSuave}`,
                background: seleccionado ? oroGradiente : 'transparent',
                color: seleccionado ? '#1B1206' : deshabilitado ? colores.textoTenue : colores.texto,
                opacity: fueraDeMes && !seleccionado ? 0.35 : 1,
                cursor: deshabilitado ? 'not-allowed' : 'pointer',
                fontWeight: seleccionado || esHoy ? 700 : 500,
                fontSize: 14,
              }}
            >
              {Number(d.slice(8))}
            </button>
          );
        })}
      </div>
    </div>
  );
}
