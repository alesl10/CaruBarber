import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, UsuarioActual } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EstadoTurno } from '../database/entities/turno.entity';
import { CreateTurnoDto } from './dto/turno.dto';
import { TurnosService } from './turnos.service';

@Controller('turnos')
export class TurnosController {
  constructor(private readonly turnosService: TurnosService) {}

  /** Público: horarios libres para una fecha + servicio (para elegir turno sin login). */
  @Get('disponibilidad')
  disponibilidad(
    @Query('fecha') fecha: string,
    @Query('servicioId', ParseIntPipe) servicioId: number,
  ) {
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      throw new BadRequestException('Parámetro fecha (YYYY-MM-DD) requerido');
    }
    return this.turnosService.disponibilidad(fecha, servicioId);
  }

  /** Público: crear una reserva sin cuenta (nombre + email + celular en el body). */
  @Post()
  crear(@Body() dto: CreateTurnoDto) {
    return this.turnosService.crear(dto);
  }

  /** Turnos de un cliente que sí tiene cuenta (uso interno/futuro; el flujo público no la usa). */
  @Get('mios')
  @UseGuards(JwtAuthGuard)
  mios(@CurrentUser() user: UsuarioActual) {
    return this.turnosService.listarDeCliente(user.sub);
  }

  /** Métricas del panel (solo peluquero). Rango inclusive. */
  @Get('estadisticas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  estadisticas(@Query('desde') desde: string, @Query('hasta') hasta: string) {
    const re = /^\d{4}-\d{2}-\d{2}$/;
    if (!re.test(desde || '') || !re.test(hasta || '')) {
      throw new BadRequestException('Parámetros desde y hasta (YYYY-MM-DD) requeridos');
    }
    return this.turnosService.estadisticas(desde, hasta);
  }

  /** Agenda completa (solo peluquero). Filtra por día, por rango, y/o por estado. */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  listar(
    @Query('fecha') fecha?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('estado') estado?: EstadoTurno,
  ) {
    return this.turnosService.listarTodos({ fecha, desde, hasta, estado });
  }

  @Patch(':id/confirmar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  confirmar(@Param('id', ParseIntPipe) id: number) {
    return this.turnosService.confirmar(id);
  }

  @Patch(':id/realizar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  realizar(@Param('id', ParseIntPipe) id: number) {
    return this.turnosService.marcarRealizado(id);
  }

  /** El cliente sin cuenta cancela por el link firmado del email (ver TurnoPublicoController). */
  @Patch(':id/cancelar')
  @UseGuards(JwtAuthGuard)
  cancelar(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: UsuarioActual,
  ) {
    return this.turnosService.cancelar(id, user);
  }
}
