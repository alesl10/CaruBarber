import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Servicio } from '../database/entities/servicio.entity';
import { CreateServicioDto, UpdateServicioDto } from './dto/servicio.dto';

@Injectable()
export class ServiciosService {
  constructor(
    @InjectRepository(Servicio)
    private readonly servicioRepository: Repository<Servicio>,
  ) {}

  findAll() {
    return this.servicioRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOneActivo(id: number) {
    const servicio = await this.servicioRepository.findOne({ where: { id, activo: true } });
    if (!servicio) {
      throw new NotFoundException('Servicio inexistente o inactivo');
    }
    return servicio;
  }

  create(dto: CreateServicioDto) {
    return this.servicioRepository.save({
      nombre: dto.nombre,
      duracionMinutos: dto.duracionMinutos,
      precio: dto.precio,
      imagenUrl: dto.imagenUrl ?? null,
      activo: true,
    });
  }

  async update(id: number, dto: UpdateServicioDto) {
    const servicio = await this.servicioRepository.findOne({ where: { id } });
    if (!servicio) {
      throw new NotFoundException('Servicio no encontrado');
    }
    return this.servicioRepository.save({ ...servicio, ...dto });
  }

  async remove(id: number) {
    const servicio = await this.servicioRepository.findOne({ where: { id } });
    if (!servicio) {
      throw new NotFoundException('Servicio no encontrado');
    }
    servicio.activo = false;
    await this.servicioRepository.save(servicio);
    return { deleted: true, id };
  }
}
