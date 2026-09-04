'use client';

import { useCallback, useEffect, useState } from 'react';
import { Protegido } from '../../components/Protegido';
import { api } from '../../lib/api';
import { Notificacion, Turno } from '../../lib/types';
import {
  avisoError,
  avisoOk,
  botonChico,
  card,
  chipEstado,
  colores,
  page,
  titulo,
} from '../../lib/ui';

function MisTurnosInner() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [notis, setNotis] = useState<Notificacion[]>([]);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [t, n] = await Promise.all([
        api<Turno[]>('/turnos/mios'),
        api<Notificacion[]>('/notificaciones'),
      ]);
      setTurnos(t);
      setNotis(n);
      setError('');
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar.');
    }
  }, []);

  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 20000);
    return () => clearInterval(id);
  }, [cargar]);

  async function cancelar(id: number) {
    try {
      await api(`/turnos/${id}/cancelar`, { method: 'PATCH' });
      cargar();
    } catch (err: any) {
      setError(err.message || 'No se pudo cancelar.');
    }
  }

  async function marcarLeidas() {
    await api('/notificaciones/leer-todas', { method: 'PATCH' }).catch(() => {});
    cargar();
  }

  const noLeidas = notis.filter((n) => !n.leida);

  return (
    <main style={page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ ...titulo, fontSize: 26, marginBottom: 16 }}>Mis turnos</h1>
        <span style={{ fontSize: 11, color: colores.textoTenue, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Se actualiza solo
        </span>
      </div>

      {error && <div style={{ ...avisoError, marginBottom: 16 }}>{error}</div>}

      {noLeidas.length > 0 && (
        <div style={{ ...avisoOk, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong>Novedades ({noLeidas.length})</strong>
            <button onClick={marcarLeidas} style={botonChico(colores.borde)}>
              Marcar leídas
            </button>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>
            {noLeidas.map((n) => (
              <li key={n.id} style={{ fontSize: 14 }}>
                {n.mensaje}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {turnos.length === 0 ? (
          <div style={{ color: colores.textoSuave }}>Todavía no reservaste ningún turno.</div>
        ) : (
          turnos.map((t) => (
            <div
              key={t.id}
              style={{
                ...card,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
                opacity: t.estado === 'cancelado' ? 0.55 : 1,
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{t.servicioNombre}</div>
                <div style={{ fontSize: 14, color: colores.textoSuave }}>
                  {t.fecha} · {t.horaInicio}–{t.horaFin}
                </div>
                {t.notaCliente && (
                  <div style={{ fontSize: 12, color: colores.textoTenue, marginTop: 4 }}>
                    Nota: {t.notaCliente}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={chipEstado(t.estado)}>{t.estado}</span>
                {t.estado !== 'cancelado' && t.estado !== 'realizado' && (
                  <button onClick={() => cancelar(t.id)} style={botonChico(colores.rojo)}>
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

export default function MisTurnosPage() {
  return (
    <Protegido rol="cliente">
      <MisTurnosInner />
    </Protegido>
  );
}
