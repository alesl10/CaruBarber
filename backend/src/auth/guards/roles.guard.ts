import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolUsuario } from '../../database/entities/usuario.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

/** Debe usarse después de JwtAuthGuard: lee req.user.rol. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requeridos = this.reflector.getAllAndOverride<RolUsuario[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requeridos || requeridos.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user || !requeridos.includes(user.rol)) {
      throw new ForbiddenException('No tenés permiso para esta acción');
    }
    return true;
  }
}
