import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RolUsuario } from '../../database/entities/usuario.entity';

export interface UsuarioActual {
  sub: number;
  email: string;
  nombre: string;
  rol: RolUsuario;
}

/** Devuelve el payload del JWT ya verificado por JwtAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioActual => {
    return ctx.switchToHttp().getRequest().user;
  },
);
