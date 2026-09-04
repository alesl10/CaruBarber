'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Protegido } from '../../../components/Protegido';
import { AccionTurno, FilaTurno, TurnoModal } from '../../../components/turnos';
import { api } from '../../../lib/api';
import {
  DIAS_CORTOS,
  addDays,
  addMeses,
  fechaLarga,
  gridMes,
  hoyISO,
  mismoMes,
  nombreMes,
  rangoMes,
  rangoSemana,
} from '../../../lib/fechas';
import { EstadoTurno, Turno } from '../../../lib/types';
import {
  avisoError,
  botonGhost,
  card,
  chipEstado,
  colorEstado,
  colores,
  input,
  page,
  titulo as tituloStyle,
} from '../../../lib/ui';

type Vista = 'dia' | 'semana' | 'mes';

function AgendaInner() {
  const [vista, setVista] = useState<Vista>('dia');
  const [ancla, setAncla] = useState(hoyISO());
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [modal, setModal] = useState<Turno | null>(null);
  const [error, setError] = useState('');

  const rango = useMemo(() => {
    if (vista === 'dia') return { desde: ancla, hasta: ancla };
    if (vista === 'semana') return rangoSemana(ancla);
    const dias = gridMes(ancla);
    return { desde: dias[0], hasta: dias[dias.length - 1] };
  }, [vista, ancla]);

  const cargar = useCallback(async () => {
    try {
      const qs =
        rango.desde === rango.hasta
          ? `fecha=${rango.desde}`
          : `desde=${rango.desde}&hasta=${rango.hasta}`;
      setTurnos(await api<Turno[]>(`/turnos?${qs}`));
      setError('');
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la agenda.');
    }
  }, [rango]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function accion(id: number, tipo: AccionTurno) {
    try {
      await api(`/turnos/${id}/${tipo}`, { method: 'PATCH' });
      cargar();
    } catch (err: any) {
      setError(err.message || 'No se pudo completar la acción.');
    }
  }

  function navegar(dir: -1 | 1) {
    if (vista === 'dia') setAncla((a) => addDays(a, dir));
    else if (vista === 'semana') setAncla((a) => addDays(a, dir * 7));
    else setAncla((a) => addMeses(a, dir));
  }

  const titulo =
    vista === 'dia'
      ? fechaLarga(ancla)
      : vista === 'semana'
        ? `Semana del ${rangoSemana(ancla).desde} al ${rangoSemana(ancla).hasta}`
        : nombreMes(ancla);

  return (
    <main style={page}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <h1 style={{ ...tituloStyle, fontSize: 26 }}>Agenda</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['dia', 'semana', 'mes'] as Vista[]).map((v) => (
            <button key={v} onClick={() => setVista(v)} style={botonGhost(vista === v)}>
              {v === 'dia' ? 'Día' : v === 'semana' ? 'Semana' : 'Mes'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => navegar(-1)} style={botonGhost()}>
          ◀
        </button>
        <button onClick={() => setAncla(hoyISO())} style={botonGhost()}>
          Hoy
        </button>
        <button onClick={() => navegar(1)} style={botonGhost()}>
          ▶
        </button>
        <strong style={{ fontSize: 15, letterSpacing: '0.02em' }}>{titulo}</strong>
        {vista === 'dia' && (
          <input
            type="date"
            value={ancla}
            onChange={(e) => setAncla(e.target.value)}
            style={{ ...input, width: 'auto' }}
          />
        )}
      </div>

      <ResumenEstados turnos={turnos} />

      {error && <div style={{ ...avisoError, marginBottom: 16 }}>{error}</div>}

      {vista === 'dia' && <VistaDia turnos={turnos} onAccion={accion} />}
      {vista === 'semana' && (
        <VistaSemana
          ancla={ancla}
          turnos={turnos}
          onTurno={setModal}
          onDia={(d) => {
            setAncla(d);
            setVista('dia');
          }}
        />
      )}
      {vista === 'mes' && (
        <VistaMes
          ancla={ancla}
          turnos={turnos}
          onDia={(d) => {
            setAncla(d);
            setVista('dia');
          }}
        />
      )}

      {modal && <TurnoModal turno={modal} onClose={() => setModal(null)} onAccion={accion} />}
    </main>
  );
}

const ESTADOS_RESUMEN: { estado: EstadoTurno; label: string }[] = [
  { estado: 'pendiente', label: 'pendientes' },
  { estado: 'confirmado', label: 'confirmados' },
  { estado: 'realizado', label: 'realizados' },
  { estado: 'cancelado', label: 'cancelados' },
];

/** Cuántos turnos hay, por estado, dentro del rango que se está mirando (día/semana/mes). */
function ResumenEstados({ turnos }: { turnos: Turno[] }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          padding: '3px 10px',
          borderRadius: 999,
          border: `1px solid ${colores.borde}`,
          color: colores.textoSuave,
        }}
      >
        {turnos.length} turno{turnos.length !== 1 ? 's' : ''} en total
      </span>
      {ESTADOS_RESUMEN.map(({ estado, label }) => {
        const n = turnos.filter((t) => t.estado === estado).length;
        if (!n) return null;
        return (
          <span key={estado} style={chipEstado(estado)}>
            {n} {label}
          </span>
        );
      })}
    </div>
  );
}

function ordenar(turnos: Turno[]) {
  return [...turnos].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
}

function VistaDia({
  turnos,
  onAccion,
}: {
  turnos: Turno[];
  onAccion: (id: number, tipo: AccionTurno) => void;
}) {
  const lista = ordenar(turnos);
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {lista.length === 0 ? (
        <div style={{ color: colores.textoSuave }}>No hay turnos para este día.</div>
      ) : (
        lista.map((t) => <FilaTurno key={t.id} turno={t} onAccion={onAccion} />)
      )}
    </div>
  );
}

function VistaSemana({
  ancla,
  turnos,
  onTurno,
  onDia,
}: {
  ancla: string;
  turnos: Turno[];
  onTurno: (t: Turno) => void;
  onDia: (fecha: string) => void;
}) {
  const { desde } = rangoSemana(ancla);
  const dias = Array.from({ length: 7 }, (_, i) => addDays(desde, i));
  const hoy = hoyISO();

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(150px, 1fr))', gap: 8, minWidth: 900 }}>
        {dias.map((d, i) => {
          const delDia = ordenar(turnos.filter((t) => t.fecha === d));
          return (
            <div
              key={d}
              style={{
                ...card,
                padding: 10,
                background: d === hoy ? 'rgba(212,175,55,0.08)' : colores.superficie,
                borderColor: d === hoy ? colores.oroOscuro : colores.borde,
              }}
            >
              <button
                onClick={() => onDia(d)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', color: colores.texto }}
              >
                <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {DIAS_CORTOS[i]}
                </div>
                <div style={{ fontSize: 12, color: colores.textoSuave }}>
                  {d.slice(8)}/{d.slice(5, 7)}
                </div>
              </button>
              <div style={{ display: 'grid', gap: 4, marginTop: 8 }}>
                {delDia.length === 0 && <div style={{ fontSize: 12, color: colores.textoTenue }}>—</div>}
                {delDia.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onTurno(t)}
                    style={{
                      textAlign: 'left',
                      border: 'none',
                      borderLeft: `3px solid ${colorEstado[t.estado]}`,
                      background: colores.superficieAlt,
                      color: colores.texto,
                      borderRadius: 4,
                      padding: '4px 6px',
                      cursor: 'pointer',
                      fontSize: 12,
                      opacity: t.estado === 'cancelado' ? 0.55 : 1,
                    }}
                  >
                    <strong>{t.horaInicio}</strong> {t.servicioNombre}
                    <div style={{ color: colores.textoSuave }}>{t.clienteNombre}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VistaMes({
  ancla,
  turnos,
  onDia,
}: {
  ancla: string;
  turnos: Turno[];
  onDia: (fecha: string) => void;
}) {
  const dias = gridMes(ancla);
  const hoy = hoyISO();
  const { desde: primerDelMes } = rangoMes(ancla);

  const porDia = useMemo(() => {
    const m = new Map<string, Turno[]>();
    for (const t of turnos) {
      if (!m.has(t.fecha)) m.set(t.fecha, []);
      m.get(t.fecha)!.push(t);
    }
    return m;
  }, [turnos]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 700 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {DIAS_CORTOS.map((d) => (
            <div
              key={d}
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: colores.textoSuave,
                padding: '4px 6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {dias.map((d) => {
            const delDia = porDia.get(d) ?? [];
            const activos = delDia.filter((t) => t.estado !== 'cancelado');
            const fuera = !mismoMes(d, primerDelMes);
            return (
              <button
                key={d}
                onClick={() => onDia(d)}
                style={{
                  textAlign: 'left',
                  border: `1px solid ${d === hoy ? colores.oro : colores.bordeSuave}`,
                  background: fuera ? 'rgba(255,255,255,0.015)' : colores.superficie,
                  color: colores.texto,
                  borderRadius: 8,
                  padding: 8,
                  minHeight: 76,
                  cursor: 'pointer',
                  opacity: fuera ? 0.4 : 1,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700 }}>{Number(d.slice(8))}</div>
                {activos.length > 0 && (
                  <div style={{ fontSize: 12, marginTop: 4, color: colores.textoSuave }}>
                    {activos.length} turno{activos.length > 1 ? 's' : ''}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 3, marginTop: 4, flexWrap: 'wrap' }}>
                  {(['pendiente', 'confirmado', 'realizado', 'cancelado'] as const).map((e) => {
                    const n = delDia.filter((t) => t.estado === e).length;
                    if (!n) return null;
                    return (
                      <span
                        key={e}
                        title={`${n} ${e}`}
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#12140f',
                          background: colorEstado[e],
                          borderRadius: 4,
                          padding: '0 4px',
                        }}
                      >
                        {n}
                      </span>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 12, color: colores.textoSuave, flexWrap: 'wrap' }}>
          {(['pendiente', 'confirmado', 'realizado', 'cancelado'] as const).map((e) => (
            <span key={e} style={{ display: 'flex', alignItems: 'center', gap: 4, textTransform: 'capitalize' }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: colorEstado[e], display: 'inline-block' }} />
              {e}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AgendaPage() {
  return (
    <Protegido rol="admin">
      <AgendaInner />
    </Protegido>
  );
}
