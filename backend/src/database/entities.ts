import { BloqueoAgenda } from './entities/bloqueo-agenda.entity';
import { ConfiguracionAgenda } from './entities/configuracion.entity';
import { HorarioTrabajo } from './entities/horario-trabajo.entity';
import { Notificacion } from './entities/notificacion.entity';
import { Servicio } from './entities/servicio.entity';
import { Turno } from './entities/turno.entity';
import { Usuario } from './entities/usuario.entity';

/** Todas las entidades TypeORM, en un solo lugar (módulo de DB + script de esquema). */
export const ENTIDADES = [
  Usuario,
  Servicio,
  Turno,
  ConfiguracionAgenda,
  HorarioTrabajo,
  BloqueoAgenda,
  Notificacion,
];
