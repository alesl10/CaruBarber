import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * DESACTIVADO: este servicio no está registrado en NotificacionesModule y nadie lo inyecta.
 * Se deja como base para reactivar los avisos por WhatsApp más adelante
 * (ver el instructivo al pie de notificador.service.ts).
 *
 * Envío de WhatsApp vía la API de Twilio. Solo se activa si están las variables
 * TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_WHATSAPP_FROM en `.env`.
 * Sin esas variables, `enviar()` no hace nada (no rompe el flujo).
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private readonly config: ConfigService) {}

  get disponible() {
    return Boolean(
      this.config.get('TWILIO_ACCOUNT_SID') &&
        this.config.get('TWILIO_AUTH_TOKEN') &&
        this.config.get('TWILIO_WHATSAPP_FROM'),
    );
  }

  /** `to` en formato internacional, p. ej. "+5491122334455" (con o sin el prefijo whatsapp:). */
  async enviar(to: string | null | undefined, mensaje: string): Promise<void> {
    if (!this.disponible || !to) return;

    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID')!;
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN')!;
    const from = this.normalizar(this.config.get<string>('TWILIO_WHATSAPP_FROM')!);
    const destino = this.normalizar(to);

    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ From: from, To: destino, Body: mensaje }),
        },
      );
      if (!res.ok) {
        const detalle = await res.text();
        this.logger.error(`Twilio respondió ${res.status}: ${detalle}`);
      } else {
        this.logger.log(`WhatsApp enviado a ${destino}`);
      }
    } catch (err) {
      this.logger.error(`Falló el envío de WhatsApp a ${destino}: ${(err as Error).message}`);
    }
  }

  private normalizar(numero: string) {
    const limpio = numero.replace(/^whatsapp:/, '').trim();
    return `whatsapp:${limpio}`;
  }
}
