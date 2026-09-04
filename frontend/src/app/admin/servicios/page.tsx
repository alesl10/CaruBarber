'use client';

import { useCallback, useEffect, useState } from 'react';
import { Protegido } from '../../../components/Protegido';
import { api } from '../../../lib/api';
import { Servicio } from '../../../lib/types';
import {
  avisoError,
  boton,
  botonChico,
  card,
  colores,
  input,
  label,
  page,
  titulo,
} from '../../../lib/ui';

function ServiciosInner() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [nuevo, setNuevo] = useState({ nombre: '', duracionMinutos: 45, precio: 1500 });
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

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/servicios', { body: nuevo });
      setNuevo({ nombre: '', duracionMinutos: 45, precio: 1500 });
      cargar();
    } catch (err: any) {
      setError(err.message || 'No se pudo crear el servicio.');
    }
  }

  async function guardar(s: Servicio) {
    try {
      await api(`/servicios/${s.id}`, {
        method: 'PATCH',
        body: { nombre: s.nombre, duracionMinutos: s.duracionMinutos, precio: s.precio },
      });
      cargar();
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar.');
    }
  }

  async function eliminar(id: number) {
    try {
      await api(`/servicios/${id}`, { method: 'DELETE' });
      cargar();
    } catch (err: any) {
      setError(err.message || 'No se pudo eliminar.');
    }
  }

  function editar(id: number, campo: keyof Servicio, valor: string) {
    setServicios((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, [campo]: campo === 'nombre' ? valor : Number(valor) }
          : s,
      ),
    );
  }

  return (
    <main style={page}>
      <h1 style={{ ...titulo, fontSize: 26, marginBottom: 16 }}>Servicios y duración</h1>

      {error && <div style={{ ...avisoError, marginBottom: 16 }}>{error}</div>}

      <div style={{ ...card, marginBottom: 20 }}>
        <strong style={{ letterSpacing: '0.03em' }}>Nuevo servicio</strong>
        <form
          onSubmit={crear}
          style={{ display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr 1fr auto', alignItems: 'end', marginTop: 10 }}
        >
          <label style={label}>
            Nombre
            <input
              style={input}
              value={nuevo.nombre}
              required
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            />
          </label>
          <label style={label}>
            Duración (min)
            <input
              style={input}
              type="number"
              min={5}
              step={5}
              value={nuevo.duracionMinutos}
              onChange={(e) => setNuevo({ ...nuevo, duracionMinutos: Number(e.target.value) })}
            />
          </label>
          <label style={label}>
            Precio
            <input
              style={input}
              type="number"
              min={0}
              value={nuevo.precio}
              onChange={(e) => setNuevo({ ...nuevo, precio: Number(e.target.value) })}
            />
          </label>
          <button type="submit" style={boton()}>
            Agregar
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {servicios.map((s) => (
          <div
            key={s.id}
            style={{
              ...card,
              display: 'grid',
              gap: 12,
              gridTemplateColumns: '2fr 1fr 1fr auto auto',
              alignItems: 'center',
            }}
          >
            <input style={input} value={s.nombre} onChange={(e) => editar(s.id, 'nombre', e.target.value)} />
            <input
              style={input}
              type="number"
              min={5}
              step={5}
              value={s.duracionMinutos}
              onChange={(e) => editar(s.id, 'duracionMinutos', e.target.value)}
            />
            <input
              style={input}
              type="number"
              min={0}
              value={s.precio}
              onChange={(e) => editar(s.id, 'precio', e.target.value)}
            />
            <button onClick={() => guardar(s)} style={botonChico(colores.azul)}>
              Guardar
            </button>
            <button onClick={() => eliminar(s.id)} style={botonChico(colores.rojo)}>
              Quitar
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}

export default function ServiciosPage() {
  return (
    <Protegido rol="admin">
      <ServiciosInner />
    </Protegido>
  );
}
