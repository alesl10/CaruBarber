import { SetMetadata } from '@nestjs/common';
import { RolUsuario } from '../../database/entities/usuario.entity';

export const ROLES_KEY = 'roles';

/** Restringe un endpoint a los roles indicados. Requiere JwtAuthGuard + RolesGuard. */
export const Roles = (...roles: RolUsuario[]) => SetMetadata(ROLES_KEY, roles);
