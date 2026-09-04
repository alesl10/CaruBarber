import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Turno } from '../database/entities/turno.entity';
import { Usuario } from '../database/entities/usuario.entity';
import { MailerService } from './mailer.service';
// WhatsApp (Twilio) desactivado. Para reactivar: ver notas al pie de este archivo,
// notificaciones.module.ts y las variables TWILIO_* en .env.example.
// import { WhatsappService } from './whatsapp.service';

export interface DatosTurno {
  turno: Turno;
  servicioNombre: string;
  cliente: { nombre: string; email: string | null; telefono: string | null };
}

/**
 * Manda los avisos "hacia afuera" (email) además de las notificaciones in-app.
 * Nunca lanza: si el envío falla, se loguea y sigue.
 */
@Injectable()
export class NotificadorService {
  private readonly logger = new Logger(NotificadorService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly mailer: MailerService,
    // private readonly whatsapp: WhatsappService,
    @InjectRepository(Usuario)
    private readonly usuarios: Repository<Usuario>,
  ) {}

  /** Turno nuevo → avisar al peluquero con links para confirmar / cancelar. */
  async turnoReservado(d: DatosTurno) {
    try {
      const peluquero = await this.contactoPeluquero();
      const linkConfirmar = this.link(d.turno.id, 'admin', 'confirmar');
      const linkCancelar = this.link(d.turno.id, 'admin', 'cancelar');
      const cuando = `${d.turno.fecha} a las ${d.turno.horaInicio}`;

      const texto =
        `Nuevo turno para el ${cuando}\n` +
        `Cliente: ${d.cliente.nombre}${d.cliente.telefono ? ` (${d.cliente.telefono})` : ''}\n` +
        `Servicio: ${d.servicioNombre}\n\n` +
        `Confirmar: ${linkConfirmar}\n` +
        `Cancelar: ${linkCancelar}`;

      await this.mailer.enviar({
        to: peluquero.email,
        subject: `Nuevo turno · ${cuando} · ${d.cliente.nombre}`,
        text: texto,
        html: this.htmlConAcciones(
          'Nuevo turno reservado',
          [
            ['Cuándo', cuando],
            ['Cliente', `${d.cliente.nombre}${d.cliente.telefono ? ` · ${d.cliente.telefono}` : ''}`],
            ['Servicio', d.servicioNombre],
          ],
          [
            { texto: 'Confirmar turno', url: linkConfirmar, color: '#166534' },
            { texto: 'Cancelar turno', url: linkCancelar, color: '#991b1b' },
          ],
        ),
      });

      // WhatsApp desactivado — avisaría al peluquero (peluquero.telefono).
    } catch (err) {
      this.logger.error(`turnoReservado: ${(err as Error).message}`);
    }
  }

  /** Turno confirmado → avisar al cliente. */
  async turnoConfirmado(d: DatosTurno) {
    try {
      const cuando = `${d.turno.fecha} a las ${d.turno.horaInicio}`;
      const linkCancelar = this.link(d.turno.id, 'cliente', 'cancelar');
      const texto =
        `Hola ${d.cliente.nombre}, tu turno para el ${cuando} (${d.servicioNombre}) quedó confirmado.\n\n` +
        `Si no podés asistir, cancelalo acá: ${linkCancelar}`;

      await this.mailer.enviar({
        to: d.cliente.email || '',
        subject: `Turno confirmado · ${cuando}`,
        text: texto,
        html: this.htmlConAcciones(
          '✅ Tu turno fue confirmado',
          [
            ['Cuándo', cuando],
            ['Servicio', d.servicioNombre],
          ],
          [{ texto: 'No puedo asistir — cancelar', url: linkCancelar, color: '#991b1b' }],
        ),
      });

      // WhatsApp desactivado — avisaría al cliente (d.cliente.telefono).
    } catch (err) {
      this.logger.error(`turnoConfirmado: ${(err as Error).message}`);
    }
  }

  /** Turno cancelado → avisar a la otra parte. */
  async turnoCancelado(d: DatosTurno, canceladoPor: 'admin' | 'cliente') {
    try {
      const cuando = `${d.turno.fecha} a las ${d.turno.horaInicio}`;
      if (canceladoPor === 'admin') {
        const texto = `Hola ${d.cliente.nombre}, tu turno del ${cuando} (${d.servicioNombre}) fue cancelado por la peluquería.`;
        await this.mailer.enviar({
          to: d.cliente.email || '',
          subject: `Turno cancelado · ${cuando}`,
          text: texto,
          html: this.htmlConAcciones('Turno cancelado', [
            ['Cuándo', cuando],
            ['Servicio', d.servicioNombre],
          ]),
        });
        // WhatsApp desactivado — avisaría al cliente (d.cliente.telefono).
      } else {
        const peluquero = await this.contactoPeluquero();
        const texto = `${d.cliente.nombre} canceló su turno del ${cuando} (${d.servicioNombre}).`;
        await this.mailer.enviar({
          to: peluquero.email,
          subject: `Turno cancelado por el cliente · ${cuando}`,
          text: texto,
          html: this.htmlConAcciones('Turno cancelado por el cliente', [
            ['Cuándo', cuando],
            ['Cliente', d.cliente.nombre],
            ['Servicio', d.servicioNombre],
          ]),
        });
        // WhatsApp desactivado — avisaría al peluquero (peluquero.telefono).
      }
    } catch (err) {
      this.logger.error(`turnoCancelado: ${(err as Error).message}`);
    }
  }

  // ---------------------------------------------------------------------------

  private async contactoPeluquero() {
    const emailEnv = this.config.get<string>('PELUQUERO_EMAIL');
    if (emailEnv) return { email: emailEnv };

    const admin = await this.usuarios.findOne({ where: { rol: 'admin' } });
    return { email: admin?.email || 'admin@peluqueria.com' };
  }

  private baseUrl() {
    const publico = this.config.get<string>('PUBLIC_APP_URL');
    if (publico) return publico.replace(/\/$/, '');
    const front = this.config.get<string>('FRONTEND_URL');
    if (front) return front.split(',')[0].replace(/\/$/, '');
    return 'http://localhost:3000';
  }

  /** Link público con token firmado que lleva a la pantalla de confirmar/cancelar. */
  private link(turnoId: number, rol: 'admin' | 'cliente', accion: 'confirmar' | 'cancelar') {
    const token = this.jwt.sign(
      { turnoId, rol, typ: 'accion' },
      { expiresIn: this.config.get<string>('ACCION_LINK_EXPIRES', '45d') as any },
    );
    return `${this.baseUrl()}/turno/${token}?accion=${accion}`;
  }

  private htmlConAcciones(
    titulo: string,
    filas: [string, string][],
    acciones: { texto: string; url: string; color: string }[] = [],
  ) {
    const detalle = filas
      .map(
        ([k, v]) =>
          `<tr><td style="padding:4px 12px 4px 0;color:#666">${k}</td><td style="padding:4px 0"><strong>${v}</strong></td></tr>`,
      )
      .join('');
    const botones = acciones
      .map(
        (a) =>
          `<a href="${a.url}" style="display:inline-block;margin:6px 8px 0 0;padding:10px 18px;background:${a.color};color:#fff;text-decoration:none;border-radius:8px;font-weight:600">${a.texto}</a>`,
      )
      .join('');
    return `<div style="font-family:system-ui,Arial,sans-serif;max-width:520px">
  <h2 style="margin:0 0 12px">${titulo}</h2>
  <table style="border-collapse:collapse;font-size:14px">${detalle}</table>
  ${botones ? `<div style="margin-top:16px">${botones}</div>` : ''}
  <p style="color:#999;font-size:12px;margin-top:20px">Turnero Peluquería</p>
</div>`;
  }
}

/*
 * ─── Cómo reactivar los avisos por WhatsApp (Twilio) ──────────────────────────
 * 1. En notificaciones.module.ts: descomentar el import y el provider WhatsappService.
 * 2. En este archivo: descomentar el import y el parámetro `whatsapp` del constructor,
 *    y en contactoPeluquero() volver a resolver el teléfono
 *    (PELUQUERO_WHATSAPP || admin.telefono).
 * 3. Reemplazar cada línea "// WhatsApp desactivado — avisaría a ..." por:
 *      await this.whatsapp.enviar(<telefono>, `<mensaje>`);
 * 4. Completar TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM en .env.
 * La implementación del envío ya está en whatsapp.service.ts.
 */
