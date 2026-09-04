import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Envío de emails. Usa el SMTP de `.env` si está configurado; si no, crea una cuenta de prueba
 * de Ethereal al arrancar y loguea el link de vista previa de cada mail (modo desarrollo).
 */
@Injectable()
export class MailerService implements OnModuleInit {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter | null = null;
  private from = 'Turnero Peluquería <no-reply@turnero.local>';
  private modo: 'smtp' | 'ethereal' | 'desactivado' = 'desactivado';

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const host = this.config.get<string>('SMTP_HOST');
    this.from = this.config.get<string>('MAIL_FROM') || this.from;

    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get('SMTP_PORT', 587)),
        secure: this.config.get('SMTP_SECURE') === 'true',
        auth: this.config.get<string>('SMTP_USER')
          ? {
              user: this.config.get<string>('SMTP_USER'),
              pass: this.config.get<string>('SMTP_PASS'),
            }
          : undefined,
      });
      this.modo = 'smtp';
      this.logger.log(`Email por SMTP: ${host}`);
      return;
    }

    // En producción sin SMTP: no intentar Ethereal (evita una llamada de red en cada
    // cold start de la función serverless). Los emails quedan desactivados.
    if (this.config.get('NODE_ENV') === 'production') {
      this.logger.warn('SMTP no configurado en producción: los emails quedan desactivados.');
      return;
    }

    // Dev sin SMTP: cuenta de prueba automática (los mails no llegan a destino real,
    // pero se puede ver cada uno en el link de preview que se loguea).
    try {
      const cuenta = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: cuenta.user, pass: cuenta.pass },
      });
      this.modo = 'ethereal';
      this.logger.warn(
        'SMTP no configurado: usando cuenta de prueba Ethereal. Los emails no se entregan; revisá el link de preview en los logs.',
      );
    } catch (err) {
      this.logger.error(`No se pudo iniciar el email de prueba: ${(err as Error).message}`);
    }
  }

  get disponible() {
    return this.transporter !== null;
  }

  async enviar(mail: Mail): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Email omitido (transporte no disponible): "${mail.subject}" -> ${mail.to}`);
      return;
    }
    try {
      const info = await this.transporter.sendMail({ ...mail, from: this.from });
      const preview = nodemailer.getTestMessageUrl(info);
      if (preview) {
        this.logger.log(`Email "${mail.subject}" -> ${mail.to} · preview: ${preview}`);
      } else {
        this.logger.log(`Email "${mail.subject}" -> ${mail.to} (${this.modo})`);
      }
    } catch (err) {
      this.logger.error(`Falló el envío de email a ${mail.to}: ${(err as Error).message}`);
    }
  }
}
