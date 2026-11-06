import QRCode from 'qrcode';

/** URL che il QR porta sulla lapide: apre la scheda pubblica di quel manufatto. */
export function urlScheda(id: string, pubblica = true): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/${pubblica ? 'qr' : 'scheda'}/${encodeURIComponent(id)}`;
}

const cache = new Map<string, Promise<string>>();

export function qrDataUrl(testo: string, lato = 320): Promise<string> {
  const chiave = `${lato}|${testo}`;
  let p = cache.get(chiave);
  if (!p) {
    p = QRCode.toDataURL(testo, { margin: 1, width: lato, errorCorrectionLevel: 'M', color: { dark: '#0A2F55', light: '#FFFFFF' } });
    cache.set(chiave, p);
  }
  return p;
}
