/**
 * Utilidades para trabajar con horas en formato 'HH:MM' (24h) y minutos desde medianoche.
 * Las horas se guardan como string en la base; la comparación lexicográfica de 'HH:MM'
 * con cero a la izquierda es equivalente a la comparación numérica.
 */

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function esHoraValida(valor: string): boolean {
  return typeof valor === 'string' && HHMM_RE.test(valor);
}

export function hhmmToMin(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function minToHhmm(minutos: number): string {
  const total = ((minutos % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Suma minutos a una hora 'HH:MM' y devuelve la hora resultante (mismo día). */
export function sumarMinutos(hora: string, minutos: number): string {
  return minToHhmm(hhmmToMin(hora) + minutos);
}

/**
 * Devuelve true si los intervalos [aIni, aFin) y [bIni, bFin) se solapan.
 * Acepta strings 'HH:MM' o números (minutos). Si algún extremo es null/undefined,
 * no hay solapamiento.
 */
export function seSolapan(
  aIni: string | number | null | undefined,
  aFin: string | number | null | undefined,
  bIni: string | number | null | undefined,
  bFin: string | number | null | undefined,
): boolean {
  if (aIni == null || aFin == null || bIni == null || bFin == null) return false;
  const a1 = typeof aIni === 'string' ? hhmmToMin(aIni) : aIni;
  const a2 = typeof aFin === 'string' ? hhmmToMin(aFin) : aFin;
  const b1 = typeof bIni === 'string' ? hhmmToMin(bIni) : bIni;
  const b2 = typeof bFin === 'string' ? hhmmToMin(bFin) : bFin;
  return a1 < b2 && a2 > b1;
}

/** Fecha 'YYYY-MM-DD' de hoy en hora local. */
export function hoyISO(): string {
  const ahora = new Date();
  const offset = ahora.getTimezoneOffset() * 60000;
  return new Date(ahora.getTime() - offset).toISOString().slice(0, 10);
}

/** Día de la semana (0=domingo .. 6=sábado) de una fecha 'YYYY-MM-DD'. */
export function diaSemanaDe(fecha: string): number {
  return new Date(`${fecha}T00:00:00`).getDay();
}
