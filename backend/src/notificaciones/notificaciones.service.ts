import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notificacion,
  TipoNotificacion,
} from '../database/entities/notificacion.entity';

interface CrearNotificacion {
  destinatarioRol: 'admin' | 'cliente';
  destinatarioId?: number | null;
  tipo: TipoNotificacion;
  turnoId: number;
  mensaje: string;
}

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private readonly repo: Repository<Notificacion>,
  ) {}

  crear(data: CrearNotificacion) {
    return this.repo.save({
      destinatarioRol: data.destinatarioRol,
      destinatarioId: data.destinatarioId ?? null,
      tipo: data.tipo,
      turnoId: data.turnoId,
      mensaje: data.mensaje,
      leida: false,
    });
  }

  /** Notificaciones del peluquero (rol admin). */
  listarAdmin(soloNoLeidas = false) {
    return this.repo.find({
      where: { destinatarioRol: 'admin', ...(soloNoLeidas ? { leida: false } : {}) },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  /** Notificaciones dirigidas a un cliente puntual. */
  listarCliente(clienteId: number, soloNoLeidas = false) {
    return this.repo.find({
      where: {
        destinatarioId: clienteId,
        ...(soloNoLeidas ? { leida: false } : {}),
      },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  async contarNoLeidasAdmin() {
    return { count: await this.repo.count({ where: { destinatarioRol: 'admin', leida: false } }) };
  }

  async contarNoLeidasCliente(clienteId: number) {
    return { count: await this.repo.count({ where: { destinatarioId: clienteId, leida: false } }) };
  }

  async marcarLeida(id: number) {
    const notif = await this.repo.findOne({ where: { id } });
    if (!notif) {
      throw new NotFoundException('Notificación no encontrada');
    }
    notif.leida = true;
    return this.repo.save(notif);
  }

  async marcarTodasAdmin() {
    await this.repo.update({ destinatarioRol: 'admin', leida: false }, { leida: true });
    return { ok: true };
  }

  async marcarTodasCliente(clienteId: number) {
    await this.repo.update({ destinatarioId: clienteId, leida: false }, { leida: true });
    return { ok: true };
  }

  /** Marca como leídas las notificaciones del peluquero asociadas a un turno. */
  async marcarLeidasDeTurnoAdmin(turnoId: number) {
    await this.repo.update({ turnoId, destinatarioRol: 'admin', leida: false }, { leida: true });
  }
}
