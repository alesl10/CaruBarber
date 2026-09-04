import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Servicio } from '../database/entities/servicio.entity';
import { Turno } from '../database/entities/turno.entity';
import { Usuario } from '../database/entities/usuario.entity';
import { HorariosModule } from '../horarios/horarios.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { ServiciosModule } from '../servicios/servicios.module';
import { TurnoPublicoController } from './turno-publico.controller';
import { TurnosController } from './turnos.controller';
import { TurnosService } from './turnos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Turno, Usuario, Servicio]),
    AuthModule,
    ServiciosModule,
    HorariosModule,
    NotificacionesModule,
  ],
  controllers: [TurnosController, TurnoPublicoController],
  providers: [TurnosService],
})
export class TurnosModule {}
