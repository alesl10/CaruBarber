/**
 * URL del frontend en producción. Se usa como fallback de CORS y de los links de los
 * emails cuando `FRONTEND_URL` / `PUBLIC_APP_URL` no están seteadas en el entorno.
 */
export const FRONTEND_URL_DEFAULT = 'https://caru-barber-front.vercel.app';

/** Normaliza una URL de origen: sin espacios ni barras finales. */
export function normalizarOrigen(url: string): string {
  return url.trim().replace(/\/+$/, '');
}

/**
 * Lista de orígenes permitidos por CORS: el default de prod + los que vengan en
 * `FRONTEND_URL` (separados por coma), sin duplicados ni barras finales.
 */
export function origenesPermitidos(frontendUrlEnv?: string): string[] {
  const extra = (frontendUrlEnv || '')
    .split(',')
    .map(normalizarOrigen)
    .filter(Boolean);
  return [...new Set([FRONTEND_URL_DEFAULT, ...extra])];
}
