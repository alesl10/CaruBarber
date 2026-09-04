export type Rol = 'admin' | 'cliente';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  telefono: string | null;
}

export interface Servicio {
  id: number;
  nombre: string;
  duracionMinutos: number;
  precio: number;
  activo: boolean;
}

export type EstadoTurno = 'pendiente' | 'confirmado' | 'realizado' | 'cancelado';

export interface Turno {
  id: number;
  clienteId: number;
  servicioId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: EstadoTurno;
  notaCliente: string | null;
  createdAt: string;
  servicioNombre: string;
  servicioDuracion: number | null;
  servicioPrecio: number | null;
  clienteNombre: string;
  clienteTelefono: string | null;
}

export interface HorarioTrabajo {
  id: number;
  diaSemana: number;
  activo: boolean;
  horaApertura: string;
  horaCierre: string;
  descansoInicio: string | null;
  descansoFin: string | null;
}

export interface BloqueoAgenda {
  id: number;
  fecha: string;
  horaInicio: string | null;
  horaFin: string | null;
  motivo: string;
  createdAt: string;
}

export interface ConfiguracionAgenda {
  id: number;
  intervaloTurnos: number;
  anticipacionMinimaHoras: number;
}

export interface Notificacion {
  id: number;
  destinatarioRol: string;
  destinatarioId: number | null;
  tipo: 'turno_reservado' | 'turno_confirmado' | 'turno_cancelado';
  turnoId: number;
  mensaje: string;
  leida: boolean;
  createdAt: string;
}

export interface Disponibilidad {
  fecha: string;
  servicioId: number;
  duracionMinutos: number;
  slots: string[];
}

export interface EstadisticaServicio {
  servicioId: number;
  nombre: string;
  precio: number;
  realizados: number;
  monto: number;
}

export interface Estadisticas {
  rango: { desde: string; hasta: string };
  pendientes: number;
  confirmados: number;
  realizados: number;
  cancelados: number;
  totalTurnos: number;
  recaudado: number;
  recaudadoProyectado: number;
  porServicio: EstadisticaServicio[];
}

export const DIAS_SEMANA = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];
