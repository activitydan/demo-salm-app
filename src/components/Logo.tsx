import { markDataUrl } from '../lib/brand';

export function Mark({ size = 42, variante = 'chiaro' }: { size?: number; variante?: 'chiaro' | 'scuro' }) {
  return <img className="mark" src={markDataUrl(variante)} width={size} height={Math.round((size * 96) / 116)} alt="" />;
}

export function Wordmark({ dark, small }: { dark?: boolean; small?: boolean }) {
  return (
    <span className={`wordmark ${dark ? 'wordmark--dark' : ''}`}>
      <span className="wordmark__name" style={small ? { fontSize: 19 } : undefined}>
        SALM-<span className="wordmark__up">APP</span>
      </span>
      <span className="wordmark__sub">
        POWERED BY <b>REST IN</b> <i>GPS</i>
      </span>
    </span>
  );
}

export function Logo({ dark, size = 42 }: { dark?: boolean; size?: number }) {
  return (
    <span className="row" style={{ gap: 10 }} aria-label="SALM-APP, powered by REST IN GPS">
      <Mark size={size} variante={dark ? 'scuro' : 'chiaro'} />
      <Wordmark dark={dark} />
    </span>
  );
}
