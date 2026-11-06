import type { LatLng, Quadrante, Viale } from '../data/types';

export function puntoNelPoligono(p: LatLng, poly: LatLng[]): boolean {
  const [y, x] = p;
  let dentro = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

/** Distanza in metri (approssimazione equirettangolare, ottima su scala cimitero). */
export function distanzaM(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const x = ((b[1] - a[1]) * Math.PI) / 180 * Math.cos((((a[0] + b[0]) / 2) * Math.PI) / 180);
  const y = ((b[0] - a[0]) * Math.PI) / 180;
  return Math.sqrt(x * x + y * y) * R;
}

function distanzaSegmentoM(p: LatLng, a: LatLng, b: LatLng): number {
  const k = Math.cos((p[0] * Math.PI) / 180);
  const px = p[1] * k, py = p[0];
  const ax = a[1] * k, ay = a[0];
  const bx = b[1] * k, by = b[0];
  const dx = bx - ax, dy = by - ay;
  const t = dx === 0 && dy === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return distanzaM(p, [ay + t * dy, (ax + t * dx) / k]);
}

export function vialePiuVicino(p: LatLng, viali: Viale[]): string {
  let best = '';
  let bd = Infinity;
  for (const v of viali) {
    for (let i = 0; i < v.tracciato.length - 1; i++) {
      const d = distanzaSegmentoM(p, v.tracciato[i], v.tracciato[i + 1]);
      if (d < bd) {
        bd = d;
        best = v.nome;
      }
    }
  }
  return best;
}

export function quadranteDi(p: LatLng, quadranti: Quadrante[]): Quadrante | undefined {
  return quadranti.find((q) => puntoNelPoligono(p, q.poligono));
}

export function centroide(poly: LatLng[]): LatLng {
  const n = poly.length;
  return [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n];
}

export function areaM2(poly: LatLng[]): number {
  if (poly.length < 3) return 0;
  const o = poly[0];
  const k = Math.cos((o[0] * Math.PI) / 180) * 111320;
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += (p[1] - o[1]) * k * ((q[0] - o[0]) * 110540) - (q[1] - o[1]) * k * ((p[0] - o[0]) * 110540);
  }
  return Math.abs(a / 2);
}

export function formatCoord(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

// Collegamenti a Google Maps (URL ufficiali "Maps URLs", non richiedono chiavi API)
export function googleMapsPunto(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(7)},${lng.toFixed(7)}`;
}

export function googleMapsIndicazioni(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(7)},${lng.toFixed(7)}&travelmode=walking`;
}
