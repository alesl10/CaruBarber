import { fuenteDisplay, oroGradiente } from '../lib/ui';

/** Ratio real del recorte del isotipo (navaja + tijera en forma de "C"). */
const RATIO_MARK = 578 / 553;

/** Isotipo de la marca: navaja + tijera en forma de "C", en dorado (logo real de Caru Barber). */
export function LogoBadge({ size = 40 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-mark.png"
      alt="Caru Barber"
      width={size}
      height={Math.round(size * RATIO_MARK)}
      style={{ display: 'block', flexShrink: 0, objectFit: 'contain' }}
    />
  );
}

/** Divisor decorativo: línea — tijera — línea (como el pie del logo). */
export function TijeraRule({ ancho = 180 }: { ancho?: number }) {
  return (
    <svg width={ancho} height="14" viewBox="0 0 180 14" aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="oroRule" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#9A751C" stopOpacity="0" />
          <stop offset="0.5" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#9A751C" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="4" y1="7" x2="70" y2="7" stroke="url(#oroRule)" strokeWidth="1.5" />
      <line x1="110" y1="7" x2="176" y2="7" stroke="url(#oroRule)" strokeWidth="1.5" />
      <g stroke="#D4AF37" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <line x1="82" y1="3" x2="98" y2="11" />
        <line x1="98" y1="3" x2="82" y2="11" />
        <circle cx="80" cy="2.5" r="1.8" />
        <circle cx="100" cy="2.5" r="1.8" />
      </g>
    </svg>
  );
}

export function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        fontFamily: fuenteDisplay,
        fontWeight: 600,
        fontSize: size,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        background: oroGradiente,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        whiteSpace: 'nowrap',
      }}
    >
      Caru Barber
    </span>
  );
}

/** Logo completo (badge + wordmark) para navbar y encabezados. */
export function Logo({ size = 34, texto = 18 }: { size?: number; texto?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <LogoBadge size={size} />
      <Wordmark size={texto} />
    </span>
  );
}

/** Ratio real del recorte del lockup completo (badge + "CARU BARBER" + regla). */
const RATIO_LOCKUP = 834 / 1071;

/** Arte completo de la marca (badge + wordmark + regla), para pantallas de bienvenida. */
export function LogoLockup({ ancho = 260 }: { ancho?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-completo.png"
      alt="Caru Barber"
      width={ancho}
      height={Math.round(ancho * RATIO_LOCKUP)}
      style={{ display: 'block', margin: '0 auto' }}
    />
  );
}
