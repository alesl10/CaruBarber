import type { CSSProperties } from 'react';

/** Paleta CARU BARBER: carbón + dorado. */
export const colores = {
  fondo: '#14161B',
  superficie: '#1D2027',
  superficieAlt: '#262A32',
  borde: '#343A44',
  bordeSuave: '#2A2E37',
  texto: '#F1E9DA',
  textoSuave: '#9C9585',
  textoTenue: '#6E6A5F',
  oro: '#D4AF37',
  oroClaro: '#F2D98A',
  oroOscuro: '#9A751C',
  // estados
  ambar: '#E0A63C',
  azul: '#5C90E0',
  verde: '#54A96B',
  rojo: '#D75C57',
  // alias de compatibilidad
  primario: '#D4AF37',
  fondoSuave: '#1D2027',
};

export const oroGradiente =
  'linear-gradient(135deg, #9A751C 0%, #D4AF37 42%, #F2D98A 72%, #C9A24B 100%)';

export const fuenteDisplay = "var(--font-display), 'Oswald', system-ui, sans-serif";

export const page: CSSProperties = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: '28px 20px 72px',
  color: colores.texto,
};

export const titulo: CSSProperties = {
  fontFamily: fuenteDisplay,
  fontWeight: 600,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  margin: 0,
};

export const card: CSSProperties = {
  background: colores.superficie,
  border: `1px solid ${colores.borde}`,
  borderRadius: 14,
  padding: 20,
};

export const panelOro: CSSProperties = {
  background: 'linear-gradient(160deg, #20242D 0%, #16181D 100%)',
  border: `1px solid ${colores.oroOscuro}`,
  borderRadius: 14,
  padding: 20,
};

export const input: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 9,
  border: `1px solid ${colores.borde}`,
  background: colores.superficieAlt,
  color: colores.texto,
  fontSize: 14,
  boxSizing: 'border-box',
};

export const label: CSSProperties = {
  display: 'grid',
  gap: 5,
  fontSize: 11,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: colores.textoSuave,
};

/** Sin argumento = botón dorado (acción principal). Con color = botón sólido. */
export function boton(bg?: string, disabled = false): CSSProperties {
  const dorado = !bg;
  return {
    background: disabled ? '#3A3F49' : dorado ? oroGradiente : bg,
    color: disabled ? '#7C8089' : dorado ? '#1B1206' : '#fff',
    border: 'none',
    borderRadius: 9,
    padding: '10px 16px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    fontFamily: fuenteDisplay,
  };
}

export function botonChico(bg?: string): CSSProperties {
  const dorado = !bg;
  return {
    background: dorado ? oroGradiente : bg,
    color: dorado ? '#1B1206' : '#fff',
    border: 'none',
    borderRadius: 7,
    padding: '6px 11px',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    fontFamily: fuenteDisplay,
  };
}

export function botonGhost(activo = false): CSSProperties {
  return {
    background: activo ? 'rgba(212,175,55,0.12)' : 'transparent',
    color: activo ? colores.oroClaro : colores.texto,
    border: `1px solid ${activo ? colores.oroOscuro : colores.borde}`,
    borderRadius: 8,
    padding: '7px 12px',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: fuenteDisplay,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  };
}

export const colorEstado: Record<string, string> = {
  pendiente: colores.ambar,
  confirmado: colores.azul,
  realizado: colores.verde,
  cancelado: colores.rojo,
};

export function chipEstado(estado: string): CSSProperties {
  const c = colorEstado[estado] ?? colores.textoSuave;
  return {
    background: `${c}22`,
    color: c,
    border: `1px solid ${c}55`,
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  };
}

export const aviso: CSSProperties = {
  background: colores.superficieAlt,
  border: `1px solid ${colores.borde}`,
  padding: 12,
  borderRadius: 10,
  fontSize: 14,
  color: colores.texto,
};

export const avisoOk: CSSProperties = {
  ...aviso,
  background: 'rgba(84,169,107,0.12)',
  border: '1px solid rgba(84,169,107,0.40)',
};

export const avisoError: CSSProperties = {
  ...aviso,
  background: 'rgba(215,92,87,0.12)',
  border: '1px solid rgba(215,92,87,0.40)',
};

export const textoDorado: CSSProperties = {
  background: oroGradiente,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
};

export function formatearPrecio(valor: number | null | undefined): string {
  if (valor == null) return '';
  return valor.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });
}
