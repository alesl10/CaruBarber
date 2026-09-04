import { fuenteDisplay, oroGradiente } from '../lib/ui';

/** Monograma "C" con navaja y tijera, en dorado. */
export function LogoBadge({ size = 40 }: { size?: number }) {
  const id = 'oroLogo';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Caru Barber"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9A751C" />
          <stop offset="0.42" stopColor="#D4AF37" />
          <stop offset="0.72" stopColor="#F2D98A" />
          <stop offset="1" stopColor="#C9A24B" />
        </linearGradient>
      </defs>

      <circle cx="50" cy="50" r="45" fill="none" stroke={`url(#${id})`} strokeWidth="2" opacity="0.4" />

      {/* C */}
      <path
        d="M74 27 A31 31 0 1 0 74 73"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="9"
        strokeLinecap="round"
      />

      {/* navaja recta arriba */}
      <g stroke={`url(#${id})`} strokeWidth="4.5" strokeLinecap="round">
        <line x1="45" y1="29" x2="77" y2="19" />
        <line x1="77" y1="19" x2="88" y2="23" />
      </g>

      {/* tijera */}
      <g stroke={`url(#${id})`} strokeWidth="3.4" fill="none" strokeLinecap="round">
        <line x1="41" y1="59" x2="63" y2="75" />
        <line x1="63" y1="59" x2="41" y2="75" />
        <circle cx="38" cy="57.5" r="3" />
        <circle cx="66" cy="57.5" r="3" />
      </g>
    </svg>
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
