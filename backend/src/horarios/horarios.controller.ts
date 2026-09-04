import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  CreateBloqueoDto,
  UpdateConfiguracionDto,
  UpdateHorarioDto,
} from './dto/horarios.dto';
import { HorariosService } from './horarios.service';

@Controller('horarios')
export class HorariosController {
  constructor(private readonly horariosService: HorariosService) {}

  /** Público: el cliente necesita el horario para ver disponibilidad. */
  @Get()
  getSemana() {
    return this.horariosService.getSemana();
  }

  @Get('configuracion')
  getConfiguracion() {
    return this.horariosService.getConfiguracion();
  }

  @Put('configuracion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateConfiguracion(@Body() dto: UpdateConfiguracionDto) {
    return this.horariosService.updateConfiguracion(dto);
  }

  @Get('bloqueos')
  getBloqueos(@Query('desde') desde?: string) {
    return this.horariosService.getBloqueos(desde);
  }

  @Post('bloqueos')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  crearBloqueo(@Body() dto: CreateBloqueoDto) {
    return this.horariosService.crearBloqueo(dto);
  }

  @Delete('bloqueos/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  eliminarBloqueo(@Param('id', ParseIntPipe) id: number) {
    return this.horariosService.eliminarBloqueo(id);
  }

  @Put(':diaSemana')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateDia(
    @Param('diaSemana', ParseIntPipe) diaSemana: number,
    @Body() dto: UpdateHorarioDto,
  ) {
    return this.horariosService.updateDia(diaSemana, dto);
  }
}
