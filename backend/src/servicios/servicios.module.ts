import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Servicio } from '../database/entities/servicio.entity';
import { ServiciosController } from './servicios.controller';
import { ServiciosService } from './servicios.service';

@Module({
  imports: [TypeOrmModule.forFeature([Servicio]), AuthModule],
  controllers: [ServiciosController],
  providers: [ServiciosService],
  exports: [ServiciosService],
})
export class ServiciosModule {}
