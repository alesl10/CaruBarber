import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ENTIDADES } from './entities';
import { ConfiguracionAgenda } from './entities/configuracion.entity';
import { HorarioTrabajo } from './entities/horario-trabajo.entity';
import { Servicio } from './entities/servicio.entity';
import { Usuario } from './entities/usuario.entity';
import { DatabaseSeeder } from './seeder';

/**
 * Con `DATABASE_URL` (p. ej. Supabase) usa PostgreSQL; si no, SQLite local (dev cero-config).
 * `DB_SYNC=true` deja que TypeORM cree/ajuste el esquema (útil solo en el primer deploy).
 */
function opcionesDb(config: ConfigService): TypeOrmModuleOptions {
  const url = config.get<string>('DATABASE_URL');

  if (url) {
    return {
      type: 'postgres',
      url,
      ssl: config.get('DB_SSL', 'true') === 'true' ? { rejectUnauthorized: false } : false,
      entities: ENTIDADES,
      synchronize: config.get('DB_SYNC', 'false') === 'true',
      logging: false,
      // Fallar rápido en serverless en vez de agotar el presupuesto de la función.
      retryAttempts: 2,
      retryDelay: 1500,
      extra: {
        max: Number(config.get('DB_POOL_MAX', 2)),
        connectionTimeoutMillis: 8000,
      },
    };
  }

  return {
    type: 'better-sqlite3',
    database: config.get<string>('DB_FILE', 'turnero.db'),
    entities: ENTIDADES,
    synchronize: true,
    logging: false,
  };
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: opcionesDb,
    }),
    TypeOrmModule.forFeature([Usuario, Servicio, HorarioTrabajo, ConfiguracionAgenda]),
  ],
  providers: [DatabaseSeeder],
})
export class DatabaseModule {}
