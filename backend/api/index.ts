import 'reflect-metadata';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * Handler serverless para Vercel. Carga el servidor Nest ya compilado (dist/, generado
 * por `npm run build` con tsc — decoradores + metadata intactos) y reusa la instancia
 * entre invocaciones de la misma función.
 */
type ExpressLike = (req: IncomingMessage, res: ServerResponse) => void;

let cached: Promise<ExpressLike> | undefined;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!cached) {
    // Import relativo a dist/ para evitar que el bundler de Vercel recompile Nest con esbuild
    // (esbuild no emite `emitDecoratorMetadata` y rompería la inyección de dependencias).
    cached = import('../dist/serverless.js').then(
      (m: { bootstrapServer: () => Promise<ExpressLike> }) => m.bootstrapServer(),
    );
  }
  const server = await cached;
  server(req, res);
}
