import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, UsuarioActual } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificacionesService } from './notificaciones.service';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
  constructor(private readonly service: NotificacionesService) {}

  @Get()
  listar(
    @CurrentUser() user: UsuarioActual,
    @Query('noLeidas') noLeidas?: string,
  ) {
    const soloNoLeidas = noLeidas === 'true';
    return user.rol === 'admin'
      ? this.service.listarAdmin(soloNoLeidas)
      : this.service.listarCliente(user.sub, soloNoLeidas);
  }

  @Get('no-leidas/count')
  contar(@CurrentUser() user: UsuarioActual) {
    return user.rol === 'admin'
      ? this.service.contarNoLeidasAdmin()
      : this.service.contarNoLeidasCliente(user.sub);
  }

  @Patch('leer-todas')
  leerTodas(@CurrentUser() user: UsuarioActual) {
    return user.rol === 'admin'
      ? this.service.marcarTodasAdmin()
      : this.service.marcarTodasCliente(user.sub);
  }

  @Patch(':id/leida')
  leida(@Param('id', ParseIntPipe) id: number) {
    return this.service.marcarLeida(id);
  }
}
