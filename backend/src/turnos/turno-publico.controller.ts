import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsIn } from 'class-validator';
import { TurnosService } from './turnos.service';

class AccionDto {
  @IsIn(['confirmar', 'cancelar'])
  accion: 'confirmar' | 'cancelar';
}

/**
 * Endpoints sin login, accesibles desde el link enviado por email / WhatsApp.
 * La autorización va en el token firmado.
 */
@Controller('turnos/publico')
export class TurnoPublicoController {
  constructor(private readonly turnosService: TurnosService) {}

  @Get(':token')
  ver(@Param('token') token: string) {
    return this.turnosService.verTurnoPorToken(token);
  }

  @Post(':token')
  accion(@Param('token') token: string, @Body() dto: AccionDto) {
    return this.turnosService.accionPorToken(token, dto.accion);
  }
}
