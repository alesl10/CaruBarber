import { colores, fuenteDisplay } from '../lib/ui';

export function Footer() {
  return (
    <footer
      style={{
        borderTop: `1px solid ${colores.borde}`,
        padding: '14px 22px',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
        paddingLeft: 'max(22px, env(safe-area-inset-left))',
        paddingRight: 'max(22px, env(safe-area-inset-right))',
        textAlign: 'center',
        fontSize: 12,
        color: colores.textoTenue,
        letterSpacing: '0.02em',
      }}
    >
      <span style={{ fontFamily: fuenteDisplay, color: colores.textoSuave }}>Caru Barber</span>
      {' · '}
      Turnero © {new Date().getFullYear()}
    </footer>
  );
}
