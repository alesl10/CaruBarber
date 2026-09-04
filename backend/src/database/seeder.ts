import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { ConfiguracionAgenda } from './entities/configuracion.entity';
import { HorarioTrabajo } from './entities/horario-trabajo.entity';
import { Servicio } from './entities/servicio.entity';
import { Usuario } from './entities/usuario.entity';

/**
 * Carga inicial idempotente. Corre al arrancar; si los datos ya existen no hace nada.
 * En serverless puede ejecutarse en cada cold start: por eso cada escritura va con
 * try/catch (dos instancias arrancando a la vez podrían chocar en la fila única).
 * Se puede desactivar con SEED_ON_BOOT=false.
 */
@Injectable()
export class DatabaseSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
    @InjectRepository(Servicio)
    private readonly servicios: Repository<Servicio>,
    @InjectRepository(HorarioTrabajo)
    private readonly horarios: Repository<HorarioTrabajo>,
    @InjectRepository(ConfiguracionAgenda)
    private readonly configuracion: Repository<ConfiguracionAgenda>,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get('SEED_ON_BOOT', 'true') === 'false') return;
    try {
      await this.seedUsuarios();
      await this.seedServicios();
      await this.seedHorarios();
      await this.seedConfiguracion();
    } catch (err) {
      this.logger.warn(`Seed omitido/parcial: ${(err as Error).message}`);
    }
  }

  private async seedUsuarios() {
    const demo = [
      { nombre: 'Peluquero', email: 'admin@peluqueria.com', password: 'admin123', rol: 'admin' as const },
      { nombre: 'Cliente Demo', email: 'cliente@peluqueria.com', password: 'cliente123', rol: 'cliente' as const },
    ];

    for (const u of demo) {
      const existe = await this.usuarios.findOne({ where: { email: u.email } });
      if (existe) continue;
      try {
        await this.usuarios.save({
          nombre: u.nombre,
          email: u.email,
          password: await bcrypt.hash(u.password, 10),
          rol: u.rol,
          telefono: null,
        });
        this.logger.log(`Usuario demo creado: ${u.email} / ${u.password}`);
      } catch {
        /* carrera con otra instancia: la fila ya existe */
      }
    }
  }

  private async seedServicios() {
    if ((await this.servicios.count()) > 0) return;
    try {
      await this.servicios.save([
        { nombre: 'Corte clásico', duracionMinutos: 45, precio: 1500, activo: true },
        { nombre: 'Corte + lavado', duracionMinutos: 60, precio: 2000, activo: true },
        { nombre: 'Barba', duracionMinutos: 30, precio: 900, activo: true },
      ]);
      this.logger.log('Servicios demo creados');
    } catch {
      /* ya sembrados por otra instancia */
    }
  }

  private async seedHorarios() {
    if ((await this.horarios.count()) > 0) return;

    const filas: Partial<HorarioTrabajo>[] = [];
    for (let dia = 0; dia <= 6; dia++) {
      if (dia === 0) {
        filas.push({ diaSemana: 0, activo: false, horaApertura: '09:00', horaCierre: '13:00', descansoInicio: null, descansoFin: null });
      } else if (dia === 6) {
        filas.push({ diaSemana: 6, activo: true, horaApertura: '09:00', horaCierre: '13:00', descansoInicio: null, descansoFin: null });
      } else {
        filas.push({ diaSemana: dia, activo: true, horaApertura: '09:00', horaCierre: '19:00', descansoInicio: '13:00', descansoFin: '14:00' });
      }
    }
    try {
      await this.horarios.save(filas);
      this.logger.log('Horario semanal por defecto creado');
    } catch {
      /* ya sembrado por otra instancia */
    }
  }

  private async seedConfiguracion() {
    const existe = await this.configuracion.findOne({ where: { id: 1 } });
    if (existe) return;
    try {
      await this.configuracion.save({ id: 1, intervaloTurnos: 15, anticipacionMinimaHoras: 0 });
      this.logger.log('Configuración de agenda por defecto creada');
    } catch {
      /* ya sembrada por otra instancia */
    }
  }
}
