import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { BloqueoAgenda } from '../database/entities/bloqueo-agenda.entity';
import { ConfiguracionAgenda } from '../database/entities/configuracion.entity';
import { HorarioTrabajo } from '../database/entities/horario-trabajo.entity';
import { hhmmToMin } from '../common/time.util';
import {
  CreateBloqueoDto,
  UpdateConfiguracionDto,
  UpdateHorarioDto,
} from './dto/horarios.dto';

@Injectable()
export class HorariosService {
  constructor(
    @InjectRepository(HorarioTrabajo)
    private readonly horarios: Repository<HorarioTrabajo>,
    @InjectRepository(BloqueoAgenda)
    private readonly bloqueos: Repository<BloqueoAgenda>,
    @InjectRepository(ConfiguracionAgenda)
    private readonly configuracion: Repository<ConfiguracionAgenda>,
  ) {}

  getSemana() {
    return this.horarios.find({ order: { diaSemana: 'ASC' } });
  }

  async getDia(diaSemana: number) {
    const horario = await this.horarios.findOne({ where: { diaSemana } });
    if (!horario) {
      throw new NotFoundException(`No hay horario para el día ${diaSemana}`);
    }
    return horario;
  }

  async updateDia(diaSemana: number, dto: UpdateHorarioDto) {
    const horario = await this.getDia(diaSemana);

    if (hhmmToMin(dto.horaApertura) >= hhmmToMin(dto.horaCierre)) {
      throw new BadRequestException('La hora de apertura debe ser anterior a la de cierre');
    }

    const descansoInicio = dto.descansoInicio ?? null;
    const descansoFin = dto.descansoFin ?? null;
    if ((descansoInicio === null) !== (descansoFin === null)) {
      throw new BadRequestException('El descanso necesita inicio y fin, o ninguno de los dos');
    }
    if (descansoInicio && descansoFin) {
      if (hhmmToMin(descansoInicio) >= hhmmToMin(descansoFin)) {
        throw new BadRequestException('El inicio del descanso debe ser anterior a su fin');
      }
      if (
        hhmmToMin(descansoInicio) < hhmmToMin(dto.horaApertura) ||
        hhmmToMin(descansoFin) > hhmmToMin(dto.horaCierre)
      ) {
        throw new BadRequestException('El descanso debe estar dentro del horario de atención');
      }
    }

    horario.activo = dto.activo;
    horario.horaApertura = dto.horaApertura;
    horario.horaCierre = dto.horaCierre;
    horario.descansoInicio = descansoInicio;
    horario.descansoFin = descansoFin;
    return this.horarios.save(horario);
  }

  getBloqueos(desde?: string) {
    return this.bloqueos.find({
      where: desde ? { fecha: MoreThanOrEqual(desde) } : {},
      order: { fecha: 'ASC' },
    });
  }

  getBloqueosDe(fecha: string) {
    return this.bloqueos.find({ where: { fecha } });
  }

  crearBloqueo(dto: CreateBloqueoDto) {
    const horaInicio = dto.horaInicio ?? null;
    const horaFin = dto.horaFin ?? null;
    if ((horaInicio === null) !== (horaFin === null)) {
      throw new BadRequestException('El bloqueo por franja necesita hora de inicio y fin');
    }
    if (horaInicio && horaFin && hhmmToMin(horaInicio) >= hhmmToMin(horaFin)) {
      throw new BadRequestException('La hora de inicio del bloqueo debe ser anterior a la de fin');
    }
    return this.bloqueos.save({
      fecha: dto.fecha,
      horaInicio,
      horaFin,
      motivo: dto.motivo ?? '',
    });
  }

  async eliminarBloqueo(id: number) {
    const bloqueo = await this.bloqueos.findOne({ where: { id } });
    if (!bloqueo) {
      throw new NotFoundException('Bloqueo no encontrado');
    }
    await this.bloqueos.remove(bloqueo);
    return { deleted: true, id };
  }

  async getConfiguracion() {
    let config = await this.configuracion.findOne({ where: { id: 1 } });
    if (!config) {
      config = await this.configuracion.save({
        id: 1,
        intervaloTurnos: 15,
        anticipacionMinimaHoras: 0,
      });
    }
    return config;
  }

  async updateConfiguracion(dto: UpdateConfiguracionDto) {
    const config = await this.getConfiguracion();
    if (dto.intervaloTurnos !== undefined) config.intervaloTurnos = dto.intervaloTurnos;
    if (dto.anticipacionMinimaHoras !== undefined) {
      config.anticipacionMinimaHoras = dto.anticipacionMinimaHoras;
    }
    return this.configuracion.save(config);
  }
}
