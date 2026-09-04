import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Notificacion } from '../database/entities/notificacion.entity';
import { Usuario } from '../database/entities/usuario.entity';
import { MailerService } from './mailer.service';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesService } from './notificaciones.service';
import { NotificadorService } from './notificador.service';
// WhatsApp (Twilio) desactivado — descomentar para reactivar (ver notificador.service.ts).
// import { WhatsappService } from './whatsapp.service';

@Module({
  imports: [TypeOrmModule.forFeature([Notificacion, Usuario]), AuthModule],
  controllers: [NotificacionesController],
  providers: [
    NotificacionesService,
    MailerService,
    // WhatsappService,
    NotificadorService,
  ],
  exports: [NotificacionesService, NotificadorService],
})
export class NotificacionesModule {}
