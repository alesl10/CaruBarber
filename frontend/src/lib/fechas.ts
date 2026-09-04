/** Helpers de fecha en formato 'YYYY-MM-DD', siempre en hora local (sin drift de zona). */

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function hoyISO(): string {
  return toISO(new Date());
}

export function addDays(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function addMeses(iso: string, n: number): string {
  const d = parseISO(iso);
  d.setMonth(d.getMonth() + n);
  return toISO(d);
}

/** Lunes de la semana que contiene `iso`. */
export function inicioSemana(iso: string): string {
  const d = parseISO(iso);
  const dow = (d.getDay() + 6) % 7; // 0 = lunes
  d.setDate(d.getDate() - dow);
  return toISO(d);
}

export function rangoSemana(iso: string): { desde: string; hasta: string } {
  const desde = inicioSemana(iso);
  return { desde, hasta: addDays(desde, 6) };
}

export function rangoMes(iso: string): { desde: string; hasta: string } {
  const d = parseISO(iso);
  const desde = toISO(new Date(d.getFullYear(), d.getMonth(), 1));
  const hasta = toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  return { desde, hasta };
}

/** 42 días (6 semanas, lunes primero) que cubren el mes de `iso`, para la grilla del calendario. */
export function gridMes(iso: string): string[] {
  const { desde } = rangoMes(iso);
  const primer = inicioSemana(desde);
  return Array.from({ length: 42 }, (_, i) => addDays(primer, i));
}

export function mismoMes(a: string, b: string): boolean {
  return a.slice(0, 7) === b.slice(0, 7);
}

export function nombreMes(iso: string): string {
  const s = parseISO(iso).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function fechaLarga(iso: string): string {
  const s = parseISO(iso).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
