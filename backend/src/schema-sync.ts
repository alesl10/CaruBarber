import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ENTIDADES } from './database/entities';

/**
 * Crea/ajusta el esquema en la base apuntada por DATABASE_URL. Se corre una vez, a mano,
 * antes del primer deploy (así Vercel nunca necesita synchronize en runtime).
 *
 *   npm run build
 *   DATABASE_URL="postgresql://...supabase.co:5432/postgres" node dist/schema-sync.js
 *
 * Usar la conexión DIRECTA de Supabase (puerto 5432, host db.<ref>.supabase.co),
 * no el pooler, para este paso.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Falta la variable DATABASE_URL');
  }

  const ds = new DataSource({
    type: 'postgres',
    url,
    ssl: { rejectUnauthorized: false },
    entities: ENTIDADES,
  });

  await ds.initialize();
  await ds.synchronize();
  console.log('✔ Esquema sincronizado en la base.');
  await ds.destroy();
}

main().catch((err) => {
  console.error('✖ Falló la sincronización:', err.message);
  process.exit(1);
});
