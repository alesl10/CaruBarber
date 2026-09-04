import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BloqueoAgenda } from '../database/entities/bloqueo-agenda.entity';
import { ConfiguracionAgenda } from '../database/entities/configuracion.entity';
import { HorarioTrabajo } from '../database/entities/horario-trabajo.entity';
import { HorariosController } from './horarios.controller';
import { HorariosService } from './horarios.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([HorarioTrabajo, BloqueoAgenda, ConfiguracionAgenda]),
    AuthModule,
  ],
  controllers: [HorariosController],
  providers: [HorariosService],
  exports: [HorariosService],
})
export class HorariosModule {}
