'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Protegido } from '../../../components/Protegido';
import { ServicioMedia } from '../../../components/ServicioMedia';
import { api } from '../../../lib/api';
import { Servicio } from '../../../lib/types';
import {
  avisoError,
  boton,
  botonChico,
  botonGhost,
  card,
  colores,
  formatearPrecio,
  fuenteDisplay,
  input,
  label,
  page,
  textoDorado,
  titulo,
} from '../../../lib/ui';

type FormServicio = {
  nombre: string;
  duracionMinutos: number;
  precio: number;
  imagenUrl: string;
};

const FORM_VACIO: FormServicio = { nombre: '', duracionMinutos: 45, precio: 1500, imagenUrl: '' };

function ServiciosInner() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [editando, setEditando] = useState<Servicio | 'nuevo' | null>(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      setServicios(await api<Servicio[]>('/servicios', { auth: false }));
      setError('');
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar los servicios.');
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function guardar(datos: FormServicio, id?: number) {
    const body = {
      nombre: datos.nombre,
      duracionMinutos: datos.duracionMinutos,
      precio: datos.precio,
      imagenUrl: datos.imagenUrl.trim() || null,
    };
    try {
      if (id) {
        await api(`/servicios/${id}`, { method: 'PATCH', body });
      } else {
        await api('/servicios', { body });
      }
      setEditando(null);
      cargar();
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar el servicio.');
    }
  }

  async function eliminar(id: number, nombre: string) {
    if (!window.confirm(`¿Quitar "${nombre}" de los servicios ofrecidos?`)) return;
    try {
      await api(`/servicios/${id}`, { method: 'DELETE' });
      cargar();
    } catch (err: any) {
      setError(err.message || 'No se pudo eliminar.');
    }
  }

  return (
    <main style={page}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <h1 style={{ ...titulo, fontSize: 26, margin: 0 }}>Servicios y duración</h1>
        <button onClick={() => setEditando('nuevo')} style={boton()}>
          + Nuevo servicio
        </button>
      </div>

      {error && <div style={{ ...avisoError, marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
        {servicios.map((s) => (
          <div
            key={s.id}
            style={{ ...card, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <ServicioMedia servicio={s} />
            <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              <strong style={{ fontFamily: fuenteDisplay, fontSize: 16, letterSpacing: '0.01em' }}>
                {s.nombre}
              </strong>
              <span
                style={{
                  alignSelf: 'start',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: colores.textoSuave,
                  border: `1px solid ${colores.bordeSuave}`,
                  borderRadius: 999,
                  padding: '2px 9px',
                }}
              >
                {s.duracionMinutos} min
              </span>
              <div style={{ ...textoDorado, fontFamily: fuenteDisplay, fontSize: 24, fontWeight: 700 }}>
                {formatearPrecio(s.precio)}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 10 }}>
                <button onClick={() => setEditando(s)} style={{ ...botonChico(colores.borde), flex: 1 }}>
                  Editar
                </button>
                <button onClick={() => eliminar(s.id, s.nombre)} style={botonChico(colores.rojo)}>
                  Quitar
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={() => setEditando('nuevo')}
          style={{
            ...card,
            background: 'transparent',
            border: `1.5px dashed ${colores.borde}`,
            minHeight: 230,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            color: colores.textoSuave,
          }}
        >
          <span style={{ fontSize: 30, lineHeight: 1, color: colores.oro }}>+</span>
          <span style={{ fontSize: 13, fontFamily: fuenteDisplay, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
            Nuevo servicio
          </span>
        </button>
      </div>

      {editando && (
        <ServicioModal
          servicio={editando === 'nuevo' ? null : editando}
          onClose={() => setEditando(null)}
          onGuardar={guardar}
        />
      )}
    </main>
  );
}

function ServicioModal({
  servicio,
  onClose,
  onGuardar,
}: {
  servicio: Servicio | null;
  onClose: () => void;
  onGuardar: (datos: FormServicio, id?: number) => void | Promise<void>;
}) {
  const [datos, setDatos] = useState<FormServicio>(
    servicio
      ? {
          nombre: servicio.nombre,
          duracionMinutos: servicio.duracionMinutos,
          precio: servicio.precio,
          imagenUrl: servicio.imagenUrl ?? '',
        }
      : FORM_VACIO,
  );
  const [guardando, setGuardando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    await onGuardar(datos, servicio?.id);
    setGuardando(false);
  }

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
        style={{ ...card, maxWidth: 460, width: '100%', display: 'grid', gap: 14 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: 16, letterSpacing: '0.03em' }}>
            {servicio ? 'Editar servicio' : 'Nuevo servicio'}
          </strong>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', lineHeight: 1, color: colores.textoSuave }}
          >
            ×
          </button>
        </div>

        <ServicioMedia servicio={{ nombre: datos.nombre || 'Servicio', imagenUrl: datos.imagenUrl }} alto={160} />

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <label style={label}>
            Nombre
            <input
              style={input}
              value={datos.nombre}
              required
              onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
            />
          </label>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
            <label style={label}>
              Duración (min)
              <input
                style={input}
                type="number"
                min={5}
                step={5}
                value={datos.duracionMinutos}
                onChange={(e) => setDatos({ ...datos, duracionMinutos: Number(e.target.value) })}
              />
            </label>
            <label style={label}>
              Precio
              <input
                style={input}
                type="number"
                min={0}
                value={datos.precio}
                onChange={(e) => setDatos({ ...datos, precio: Number(e.target.value) })}
              />
            </label>
          </div>
          <label style={label}>
            Imagen (opcional)
            <input
              style={input}
              type="text"
              placeholder="https://… o /nombre-de-archivo.jpg"
              value={datos.imagenUrl}
              onChange={(e) => setDatos({ ...datos, imagenUrl: e.target.value })}
            />
          </label>
          <div style={{ fontSize: 11, color: colores.textoTenue }}>
            Puede ser una URL o el nombre de un archivo subido a <code>frontend/public</code> (p. ej.{' '}
            <code>/barba.jpg</code>). Sin imagen se usa un ícono de la marca según el nombre del
            servicio.
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" style={boton(undefined, guardando)} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" onClick={onClose} style={botonGhost()}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ServiciosPage() {
  return (
    <Protegido rol="admin">
      <ServiciosInner />
    </Protegido>
  );
}
