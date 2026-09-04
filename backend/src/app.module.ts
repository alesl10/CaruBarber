import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { HorariosModule } from './horarios/horarios.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { ServiciosModule } from './servicios/servicios.module';
import { TurnosModule } from './turnos/turnos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    ServiciosModule,
    HorariosModule,
    NotificacionesModule,
    TurnosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
