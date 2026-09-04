import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      ok: true,
      service: 'turnero-peluqueria-api',
      message: 'NestJS backend funcionando',
    };
  }
}
