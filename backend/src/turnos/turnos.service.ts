import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { UsuarioActual } from '../auth/decorators/current-user.decorator';
import {
  diaSemanaDe,
  hhmmToMin,
  hoyISO,
  minToHhmm,
  seSolapan,
  sumarMinutos,
} from '../common/time.util';
import { BloqueoAgenda } from '../database/entities/bloqueo-agenda.entity';
import { Servicio } from '../database/entities/servicio.entity';
import { EstadoTurno, Turno } from '../database/entities/turno.entity';
import { Usuario } from '../database/entities/usuario.entity';
import { HorariosService } from '../horarios/horarios.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { NotificadorService } from '../notificaciones/notificador.service';
import { ServiciosService } from '../servicios/servicios.service';
import { CreateTurnoDto } from './dto/turno.dto';

type TurnoEnriquecido = Turno & {
  servicioNombre: string;
  servicioDuracion: number | null;
  servicioPrecio: number | null;
  clienteNombre: string;
  clienteEmail: string | null;
  clienteTelefono: string | null;
};

interface ContextoDia {
  activo: boolean;
  horaApertura: string;
  horaCierre: string;
  descansoInicio: string | null;
  descansoFin: string | null;
  bloqueos: BloqueoAgenda[];
  bloqueoDiaCompleto: boolean;
  ocupados: Turno[];
  intervaloTurnos: number;
  anticipacionMinimaHoras: number;
}

@Injectable()
export class TurnosService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
    private readonly serviciosService: ServiciosService,
    private readonly horariosService: HorariosService,
    private readonly notificaciones: NotificacionesService,
    private readonly notificador: NotificadorService,
    private readonly jwt: JwtService,
  ) {}

  // ---------------------------------------------------------------------------
  // Disponibilidad
  // ---------------------------------------------------------------------------

  async disponibilidad(fecha: string, servicioId: number) {
    const servicio = await this.serviciosService.findOneActivo(servicioId);
    const duracionMinutos = servicio.duracionMinutos;
    const base = { fecha, servicioId, duracionMinutos, slots: [] as string[] };

    if (fecha < hoyISO()) return base;

    const ctx = await this.contextoDia(fecha);
    if (!ctx.activo || ctx.bloqueoDiaCompleto) return base;

    const paso = ctx.intervaloTurnos;
    const desde = hhmmToMin(ctx.horaApertura);
    const hasta = hhmmToMin(ctx.horaCierre) - duracionMinutos;
    const minInicio =
      fecha === hoyISO()
        ? this.ahoraEnMinutos() + ctx.anticipacionMinimaHoras * 60
        : -1;

    const slots: string[] = [];
    for (let t = desde; t <= hasta; t += paso) {
      if (t < minInicio) continue;
      const inicio = minToHhmm(t);
      if (this.slotLibre(inicio, duracionMinutos, ctx)) {
        slots.push(inicio);
      }
    }

    return { ...base, slots };
  }

  // ---------------------------------------------------------------------------
  // Crear turno (cliente)
  // ---------------------------------------------------------------------------

  /** Reserva sin cuenta: el cliente se identifica por email (se crea o reutiliza su ficha). */
  async crear(dto: CreateTurnoDto) {
    const servicio = await this.serviciosService.findOneActivo(dto.servicioId);
    const duracion = servicio.duracionMinutos;

    if (dto.fecha < hoyISO()) {
      throw new BadRequestException('No se puede reservar en una fecha pasada');
    }

    const ctx = await this.contextoDia(dto.fecha);
    if (!ctx.activo) {
      throw new BadRequestException('Ese día no hay atención');
    }
    if (ctx.bloqueoDiaCompleto) {
      throw new BadRequestException('Esa fecha está bloqueada en la agenda');
    }

    const inicioMin = hhmmToMin(dto.horaInicio);
    if (
      dto.fecha === hoyISO() &&
      inicioMin < this.ahoraEnMinutos() + ctx.anticipacionMinimaHoras * 60
    ) {
      throw new BadRequestException('El turno es demasiado sobre la hora');
    }

    if (!this.slotLibre(dto.horaInicio, duracion, ctx)) {
      throw new BadRequestException('El horario seleccionado no está disponible');
    }

    const cliente = await this.resolverCliente(dto);

    const horaFin = sumarMinutos(dto.horaInicio, duracion);
    const turno = await this.turnoRepository.save({
      clienteId: cliente.id,
      servicioId: servicio.id,
      fecha: dto.fecha,
      horaInicio: dto.horaInicio,
      horaFin,
      estado: 'pendiente' as EstadoTurno,
      notaCliente: dto.nota ?? null,
    });

    await this.notificaciones.crear({
      destinatarioRol: 'admin',
      tipo: 'turno_reservado',
      turnoId: turno.id,
      mensaje: `${cliente.nombre} reservó un turno para el ${dto.fecha} a las ${dto.horaInicio} · ${servicio.nombre}`,
    });

    const enriquecido = (await this.enriquecer([turno]))[0];
    const datos = this.datosPara(turno, enriquecido);
    this.notificador.turnoReservado(datos).catch(() => undefined);
    this.notificador.turnoRecibido(datos).catch(() => undefined);

    return enriquecido;
  }

  /**
   * Busca al cliente por email (no distingue mayúsculas) o lo crea sin contraseña
   * (no tiene cuenta ni login: se lo identifica solo por su email en cada reserva).
   * Si el email ya pertenece a otro rol (p. ej. el admin), no se le pisan los datos.
   */
  private async resolverCliente(datos: { nombre: string; email: string; telefono: string }) {
    const email = datos.email.trim().toLowerCase();
    const existente = await this.usuarioRepository.findOne({ where: { email } });

    if (existente) {
      if (existente.rol === 'cliente') {
        const cambios: Partial<Usuario> = {};
        if (datos.nombre && datos.nombre !== existente.nombre) cambios.nombre = datos.nombre;
        if (datos.telefono && datos.telefono !== existente.telefono) cambios.telefono = datos.telefono;
        if (Object.keys(cambios).length) {
          Object.assign(existente, cambios);
          await this.usuarioRepository.save(existente);
        }
      }
      return existente;
    }

    return this.usuarioRepository.save({
      nombre: datos.nombre,
      email,
      password: null,
      rol: 'cliente' as const,
      telefono: datos.telefono,
    });
  }

  // ---------------------------------------------------------------------------
  // Consultas
  // ---------------------------------------------------------------------------

  async listarTodos(filtros: {
    fecha?: string;
    desde?: string;
    hasta?: string;
    estado?: EstadoTurno;
  }) {
    const where: Record<string, unknown> = {};
    if (filtros.fecha) {
      where.fecha = filtros.fecha;
    } else if (filtros.desde && filtros.hasta) {
      where.fecha = Between(filtros.desde, filtros.hasta);
    } else if (filtros.desde) {
      where.fecha = Between(filtros.desde, '9999-12-31');
    } else if (filtros.hasta) {
      where.fecha = Between('0000-01-01', filtros.hasta);
    }
    if (filtros.estado) where.estado = filtros.estado;

    const turnos = await this.turnoRepository.find({
      where,
      order: { fecha: 'ASC', horaInicio: 'ASC' },
    });
    return this.enriquecer(turnos);
  }

  /** Métricas para el panel del peluquero, sobre un rango de fechas (inclusive). */
  async estadisticas(desde: string, hasta: string) {
    const turnos = await this.turnoRepository.find({
      where: { fecha: Between(desde, hasta) },
    });

    const servicios = await this.servicioRepository.find();
    const precioPorId = new Map(servicios.map((s) => [s.id, Number(s.precio) || 0]));
    const nombrePorId = new Map(servicios.map((s) => [s.id, s.nombre]));

    const resumen = {
      rango: { desde, hasta },
      pendientes: 0,
      confirmados: 0,
      realizados: 0,
      cancelados: 0,
      totalTurnos: turnos.length,
      recaudado: 0,
      recaudadoProyectado: 0,
    };

    const porServicioMap = new Map<
      number,
      { servicioId: number; nombre: string; precio: number; realizados: number; monto: number }
    >();

    // Serie temporal: una fila por día del rango (para los gráficos del panel).
    const serieMap = new Map<
      string,
      {
        fecha: string;
        pendientes: number;
        confirmados: number;
        realizados: number;
        cancelados: number;
        recaudado: number;
      }
    >();
    const fin = new Date(`${hasta}T00:00:00`);
    const inicio = new Date(`${desde}T00:00:00`);
    const dias = (fin.getTime() - inicio.getTime()) / 86400000;
    for (
      let f = new Date(inicio);
      f <= fin && dias >= 0 && dias <= 370;
      f.setDate(f.getDate() + 1)
    ) {
      const iso = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(
        f.getDate(),
      ).padStart(2, '0')}`;
      serieMap.set(iso, {
        fecha: iso,
        pendientes: 0,
        confirmados: 0,
        realizados: 0,
        cancelados: 0,
        recaudado: 0,
      });
    }

    for (const t of turnos) {
      if (t.estado === 'pendiente') resumen.pendientes++;
      else if (t.estado === 'confirmado') resumen.confirmados++;
      else if (t.estado === 'realizado') resumen.realizados++;
      else if (t.estado === 'cancelado') resumen.cancelados++;

      const precio = precioPorId.get(t.servicioId) ?? 0;
      if (t.estado === 'realizado') resumen.recaudado += precio;
      if (t.estado === 'confirmado') resumen.recaudadoProyectado += precio;

      const filaDia = serieMap.get(t.fecha);
      if (filaDia) {
        if (t.estado === 'pendiente') filaDia.pendientes++;
        else if (t.estado === 'confirmado') filaDia.confirmados++;
        else if (t.estado === 'realizado') filaDia.realizados++;
        else if (t.estado === 'cancelado') filaDia.cancelados++;
        if (t.estado === 'realizado') filaDia.recaudado += precio;
      }

      if (t.estado === 'realizado') {
        const fila =
          porServicioMap.get(t.servicioId) ??
          {
            servicioId: t.servicioId,
            nombre: nombrePorId.get(t.servicioId) ?? 'Servicio',
            precio,
            realizados: 0,
            monto: 0,
          };
        fila.realizados++;
        fila.monto += precio;
        porServicioMap.set(t.servicioId, fila);
      }
    }

    return {
      ...resumen,
      porServicio: [...porServicioMap.values()].sort((a, b) => b.monto - a.monto),
      serie: [...serieMap.values()],
    };
  }

  async listarDeCliente(clienteId: number) {
    const turnos = await this.turnoRepository.find({
      where: { clienteId },
      order: { fecha: 'DESC', horaInicio: 'DESC' },
    });
    return this.enriquecer(turnos);
  }

  // ---------------------------------------------------------------------------
  // Aprobar / cancelar
  // ---------------------------------------------------------------------------

  async confirmar(id: number) {
    const turno = await this.buscar(id);
    if (turno.estado === 'cancelado') {
      throw new BadRequestException('El turno está cancelado, no se puede confirmar');
    }
    if (turno.estado === 'realizado') {
      throw new BadRequestException('El turno ya fue marcado como realizado');
    }

    turno.estado = 'confirmado';
    await this.turnoRepository.save(turno);
    await this.notificaciones.marcarLeidasDeTurnoAdmin(id);
    await this.notificaciones.crear({
      destinatarioRol: 'cliente',
      destinatarioId: turno.clienteId,
      tipo: 'turno_confirmado',
      turnoId: id,
      mensaje: `El peluquero confirmó tu turno del ${turno.fecha} a las ${turno.horaInicio}`,
    });

    const enriquecido = (await this.enriquecer([turno]))[0];
    this.notificador
      .turnoConfirmado(this.datosPara(turno, enriquecido))
      .catch(() => undefined);

    return enriquecido;
  }

  /** El peluquero marca que el turno se atendió; alimenta las métricas y lo recaudado. */
  async marcarRealizado(id: number) {
    const turno = await this.buscar(id);
    if (turno.estado === 'cancelado') {
      throw new BadRequestException('El turno está cancelado');
    }
    if (turno.estado === 'realizado') {
      return (await this.enriquecer([turno]))[0];
    }

    turno.estado = 'realizado';
    await this.turnoRepository.save(turno);
    await this.notificaciones.marcarLeidasDeTurnoAdmin(id);
    return (await this.enriquecer([turno]))[0];
  }

  async cancelar(id: number, usuario: UsuarioActual) {
    const turno = await this.buscar(id);

    const esDueño = turno.clienteId === usuario.sub;
    if (usuario.rol !== 'admin' && !esDueño) {
      throw new ForbiddenException('No podés cancelar este turno');
    }

    return this._cancelar(turno, usuario.rol === 'admin' ? 'admin' : 'cliente');
  }

  private async _cancelar(turno: Turno, canceladoPor: 'admin' | 'cliente') {
    if (turno.estado === 'realizado') {
      throw new BadRequestException('El turno ya fue realizado, no se puede cancelar');
    }

    const previo = turno.estado;
    const enriquecido = (await this.enriquecer([turno]))[0];

    if (previo !== 'cancelado') {
      turno.estado = 'cancelado';
      await this.turnoRepository.save(turno);
      await this.notificaciones.marcarLeidasDeTurnoAdmin(turno.id);

      if (canceladoPor === 'admin') {
        await this.notificaciones.crear({
          destinatarioRol: 'cliente',
          destinatarioId: turno.clienteId,
          tipo: 'turno_cancelado',
          turnoId: turno.id,
          mensaje: `El peluquero canceló tu turno del ${turno.fecha} a las ${turno.horaInicio}`,
        });
      } else {
        await this.notificaciones.crear({
          destinatarioRol: 'admin',
          tipo: 'turno_cancelado',
          turnoId: turno.id,
          mensaje: `${enriquecido.clienteNombre} canceló su turno del ${turno.fecha} a las ${turno.horaInicio}`,
        });
      }

      this.notificador
        .turnoCancelado(this.datosPara(turno, enriquecido), canceladoPor)
        .catch(() => undefined);
    }

    return (await this.enriquecer([turno]))[0];
  }

  // ---------------------------------------------------------------------------
  // Acciones desde el link del email / WhatsApp (sin login)
  // ---------------------------------------------------------------------------

  async verTurnoPorToken(token: string) {
    const { turnoId, rol } = this.verificarTokenAccion(token);
    const e = (await this.enriquecer([await this.buscar(turnoId)]))[0];
    return {
      rol,
      turno: {
        id: e.id,
        fecha: e.fecha,
        horaInicio: e.horaInicio,
        horaFin: e.horaFin,
        estado: e.estado,
        servicioNombre: e.servicioNombre,
        clienteNombre: e.clienteNombre,
        notaCliente: e.notaCliente,
      },
      puede: {
        confirmar: rol === 'admin' && e.estado === 'pendiente',
        cancelar: e.estado !== 'cancelado' && e.estado !== 'realizado',
      },
    };
  }

  async accionPorToken(token: string, accion: 'confirmar' | 'cancelar') {
    const { turnoId, rol } = this.verificarTokenAccion(token);

    if (accion === 'confirmar') {
      if (rol !== 'admin') {
        throw new ForbiddenException('Este enlace no permite confirmar el turno');
      }
      return this.confirmar(turnoId);
    }

    const turno = await this.buscar(turnoId);
    return this._cancelar(turno, rol === 'admin' ? 'admin' : 'cliente');
  }

  private verificarTokenAccion(token: string): {
    turnoId: number;
    rol: 'admin' | 'cliente';
  } {
    let payload: { turnoId?: number; rol?: string; typ?: string };
    try {
      payload = this.jwt.verify(token);
    } catch {
      throw new BadRequestException('El enlace no es válido o ya expiró');
    }
    if (payload.typ !== 'accion' || !payload.turnoId) {
      throw new BadRequestException('Enlace inválido');
    }
    return {
      turnoId: Number(payload.turnoId),
      rol: payload.rol === 'admin' ? 'admin' : 'cliente',
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers privados
  // ---------------------------------------------------------------------------

  private async buscar(id: number) {
    const turno = await this.turnoRepository.findOne({ where: { id } });
    if (!turno) {
      throw new NotFoundException('Turno no encontrado');
    }
    return turno;
  }

  private datosPara(turno: Turno, e: TurnoEnriquecido) {
    return {
      turno,
      servicioNombre: e.servicioNombre,
      cliente: {
        nombre: e.clienteNombre,
        email: e.clienteEmail,
        telefono: e.clienteTelefono,
      },
    };
  }

  private ahoraEnMinutos() {
    const ahora = new Date();
    return ahora.getHours() * 60 + ahora.getMinutes();
  }

  private async contextoDia(fecha: string): Promise<ContextoDia> {
    const horario = await this.horariosService.getDia(diaSemanaDe(fecha));
    const bloqueos = await this.horariosService.getBloqueosDe(fecha);
    const config = await this.horariosService.getConfiguracion();
    const turnos = await this.turnoRepository.find({ where: { fecha } });

    return {
      activo: horario.activo,
      horaApertura: horario.horaApertura,
      horaCierre: horario.horaCierre,
      descansoInicio: horario.descansoInicio,
      descansoFin: horario.descansoFin,
      bloqueos,
      bloqueoDiaCompleto: bloqueos.some((b) => !b.horaInicio),
      ocupados: turnos.filter((t) => t.estado !== 'cancelado'),
      intervaloTurnos: config.intervaloTurnos,
      anticipacionMinimaHoras: config.anticipacionMinimaHoras,
    };
  }

  private slotLibre(
    inicio: string,
    duracion: number,
    ctx: ContextoDia,
    ignorarTurnoId?: number,
  ): boolean {
    const fin = sumarMinutos(inicio, duracion);

    if (hhmmToMin(inicio) < hhmmToMin(ctx.horaApertura)) return false;
    if (hhmmToMin(fin) > hhmmToMin(ctx.horaCierre)) return false;

    if (seSolapan(inicio, fin, ctx.descansoInicio, ctx.descansoFin)) return false;

    for (const b of ctx.bloqueos) {
      if (!b.horaInicio) return false;
      if (seSolapan(inicio, fin, b.horaInicio, b.horaFin)) return false;
    }

    for (const t of ctx.ocupados) {
      if (ignorarTurnoId && t.id === ignorarTurnoId) continue;
      if (seSolapan(inicio, fin, t.horaInicio, t.horaFin)) return false;
    }

    return true;
  }

  /** Agrega nombre de servicio y datos del cliente para las vistas. */
  private async enriquecer(turnos: Turno[]): Promise<TurnoEnriquecido[]> {
    if (turnos.length === 0) return [];

    const servicioIds = [...new Set(turnos.map((t) => t.servicioId))];
    const clienteIds = [...new Set(turnos.map((t) => t.clienteId))];

    const [servicios, clientes] = await Promise.all([
      servicioIds.length
        ? this.servicioRepository.find({ where: { id: In(servicioIds) } })
        : Promise.resolve([]),
      clienteIds.length
        ? this.usuarioRepository.find({ where: { id: In(clienteIds) } })
        : Promise.resolve([]),
    ]);

    const servicioPorId = new Map(servicios.map((s) => [s.id, s]));
    const clientePorId = new Map(clientes.map((c) => [c.id, c]));

    return turnos.map((t) => {
      const servicio = servicioPorId.get(t.servicioId);
      const cliente = clientePorId.get(t.clienteId);
      return {
        ...t,
        servicioNombre: servicio?.nombre ?? 'Servicio',
        servicioDuracion: servicio?.duracionMinutos ?? null,
        servicioPrecio: servicio?.precio ?? null,
        clienteNombre: cliente?.nombre ?? 'Cliente',
        clienteEmail: cliente?.email ?? null,
        clienteTelefono: cliente?.telefono ?? null,
      };
    });
  }
}
