// Riconoscimento del testo nelle foto delle lapidi, direttamente sul telefono o sul computer:
// Tesseract.js con il modello della lingua italiana. Nessuna chiave API e nessun servizio esterno.
// Il motore si carica solo quando serve (i file stanno in public/ocr) e dopo il primo uso resta in cache,
// quindi funziona anche nel cimitero senza connessione.
import type Tesseract from 'tesseract.js';
import { leggiLapide, type Box, type Dizionario, type Lettura, type RigaOcr } from './lapide';
import { caricaImmagine } from './photo';

/** Porzione della foto, in frazioni da 0 a 1. */
export interface Area {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RisultatoLettura {
  /** Righe lette, con le coordinate nella foto originale. */
  righe: RigaOcr[];
  lettura: Lettura;
  larghezza: number;
  altezza: number;
}

export type Avanzamento = (testo: string, frazione: number | null) => void;

let motore: Promise<Tesseract.Worker> | null = null;
let avvisa: Avanzamento | null = null;

const cartella = () => new URL('ocr/', document.baseURI).href;

function avviaMotore(): Promise<Tesseract.Worker> {
  if (!motore) {
    motore = (async () => {
      const T = (await import('tesseract.js')).default;
      const w = await T.createWorker('ita', T.OEM.LSTM_ONLY, {
        workerPath: `${cartella()}worker.min.js`,
        corePath: cartella(),
        langPath: cartella(),
        gzip: true,
        cacheMethod: 'write',
        workerBlobURL: false,
        logger: (m) => avvisa?.(/recogniz/.test(m.status) ? 'Leggo la scritta…' : 'Preparo il riconoscimento…', /recogniz/.test(m.status) ? m.progress : null),
      });
      await w.setParameters({ tessedit_pageseg_mode: T.PSM.AUTO, preserve_interword_spaces: '1', user_defined_dpi: '300' });
      return w;
    })();
    motore.catch(() => {
      motore = null;
    });
  }
  return motore;
}

/** Carica il motore in anticipo, così la prima lettura non aspetta il download. */
export function precaricaMotore() {
  avviaMotore().catch(() => undefined);
}

interface Preparata {
  canvas: HTMLCanvasElement;
  scala: number;
  ox: number;
  oy: number;
  W: number;
  H: number;
}

/**
 * Prepara la foto per il riconoscimento: ritaglio, ingrandimento, scala di grigi.
 * Su pietra scura (lettere chiare) inverte i colori. Nel modo "netto" rende il testo bianco e nero
 * con una soglia locale e toglie i puntini: serve con luce irregolare, riflessi e venature del marmo.
 * Niente aumento di contrasto: le lettere occupano poca superficie e uno stiramento le farebbe sparire.
 */
async function prepara(foto: string, area: Area | null, modo: 'grigio' | 'netto'): Promise<Preparata> {
  const img = await caricaImmagine(foto);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const a = area ?? { x: 0, y: 0, w: 1, h: 1 };
  const sx = Math.max(0, Math.round(a.x * W));
  const sy = Math.max(0, Math.round(a.y * H));
  const sw = Math.max(16, Math.min(W - sx, Math.round(a.w * W)));
  const sh = Math.max(16, Math.min(H - sy, Math.round(a.h * H)));
  const scala = Math.min(3, Math.max(1200, Math.min(2200, sw)) / sw);
  const cw = Math.round(sw * scala);
  const ch = Math.round(sh * scala);
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
  const dati = ctx.getImageData(0, 0, cw, ch);
  const d = dati.data;
  const n = cw * ch;
  const g = new Uint8ClampedArray(n);
  let somma = 0;
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    const v = (d[j] * 299 + d[j + 1] * 587 + d[j + 2] * 114) / 1000;
    g[i] = v;
    somma += v;
  }
  // pietra scura: lettere chiare su fondo scuro, il motore le vuole scure su chiaro
  if (somma / n < 105) for (let i = 0; i < n; i++) g[i] = 255 - g[i];
  if (modo === 'netto') {
    // soglia locale (Bradley): ogni pixel confrontato con la media del suo intorno
    const integ = new Uint32Array((cw + 1) * (ch + 1));
    for (let y = 1; y <= ch; y++) {
      let riga = 0;
      for (let x = 1; x <= cw; x++) {
        riga += g[(y - 1) * cw + (x - 1)];
        integ[y * (cw + 1) + x] = integ[(y - 1) * (cw + 1) + x] + riga;
      }
    }
    const r = Math.max(8, Math.round(cw / 32));
    const out = new Uint8ClampedArray(n);
    let neri = 0;
    for (let y = 0; y < ch; y++) {
      const y0 = Math.max(0, y - r);
      const y1 = Math.min(ch, y + r + 1);
      for (let x = 0; x < cw; x++) {
        const x0 = Math.max(0, x - r);
        const x1 = Math.min(cw, x + r + 1);
        const area = (x1 - x0) * (y1 - y0);
        const s = integ[y1 * (cw + 1) + x1] - integ[y0 * (cw + 1) + x1] - integ[y1 * (cw + 1) + x0] + integ[y0 * (cw + 1) + x0];
        const nero = g[y * cw + x] * area < s * 0.85;
        out[y * cw + x] = nero ? 0 : 255;
        if (nero) neri++;
      }
    }
    const capovolgi = neri > n / 2;
    for (let i = 0; i < n; i++) g[i] = capovolgi ? 255 - out[i] : out[i];
    togliPuntini(g, cw, ch, Math.round((cw / 400) ** 2));
  }
  for (let i = 0, j = 0; i < n; i++, j += 4) d[j] = d[j + 1] = d[j + 2] = g[i];
  ctx.putImageData(dati, 0, 0);
  return { canvas, scala, ox: sx, oy: sy, W, H };
}

/**
 * Toglie dall'immagine in bianco e nero i puntini isolati più piccoli di un trattino: grana della pietra,
 * venature spezzate, bordi della foto. Senza, il motore non trova le righe di testo.
 */
function togliPuntini(g: Uint8ClampedArray, cw: number, ch: number, minimo: number) {
  const n = cw * ch;
  const visto = new Uint8Array(n);
  const coda = new Int32Array(n);
  for (let p = 0; p < n; p++) {
    if (g[p] !== 0 || visto[p]) continue;
    let t = 0;
    let h = 0;
    coda[t++] = p;
    visto[p] = 1;
    while (h < t) {
      const q = coda[h++];
      const qx = q % cw;
      const qy = (q - qx) / cw;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = qx + dx;
          const ny = qy + dy;
          if (nx < 0 || ny < 0 || nx >= cw || ny >= ch) continue;
          const r = ny * cw + nx;
          if (g[r] === 0 && !visto[r]) {
            visto[r] = 1;
            coda[t++] = r;
          }
        }
    }
    if (t < minimo) for (let k = 0; k < t; k++) g[coda[k]] = 255;
  }
}

async function riconosci(p: Preparata): Promise<RigaOcr[]> {
  const w = await avviaMotore();
  const { data } = await w.recognize(p.canvas, {}, { text: true, blocks: true });
  const box = (b: Tesseract.Bbox): Box => ({ x0: p.ox + b.x0 / p.scala, y0: p.oy + b.y0 / p.scala, x1: p.ox + b.x1 / p.scala, y1: p.oy + b.y1 / p.scala });
  const righe: RigaOcr[] = [];
  for (const b of data.blocks ?? [])
    for (const par of b.paragraphs)
      for (const l of par.lines) {
        const parole = l.words
          .map((w) => ({ testo: w.text.trim(), conf: w.confidence, bbox: box(w.bbox) }))
          // via il rumore delle venature: parole senza lettere o cifre, o quasi illeggibili
          .filter((w) => /[\p{L}\d]/u.test(w.testo) && !(w.conf < 35 && w.testo.length <= 2));
        const testo = parole.map((w) => w.testo).join(' ');
        const utili = testo.replace(/[^\p{L}\d]/gu, '').length;
        if (!parole.length || utili < 2 || utili < 0.5 * testo.replace(/\s/g, '').length || l.confidence < 20) continue;
        righe.push({ testo, conf: l.confidence, bbox: box(l.bbox), parole });
      }
  return righe;
}

/**
 * Unisce le righe di due passaggi: dove leggono la stessa riga tiene quella più sicura, il resto lo somma.
 * Così un passaggio può dare il nome e l'altro le date.
 */
function unisciRighe(a: RigaOcr[], b: RigaOcr[]): RigaOcr[] {
  const sovrapposte = (x: Box, y: Box) => {
    const v = Math.min(x.y1, y.y1) - Math.max(x.y0, y.y0);
    const o = Math.min(x.x1, y.x1) - Math.max(x.x0, y.x0);
    return v > 0.5 * Math.min(x.y1 - x.y0, y.y1 - y.y0) && o > 0;
  };
  const out = [...a];
  for (const r of b) {
    const i = out.findIndex((x) => sovrapposte(x.bbox, r.bbox));
    if (i < 0) out.push(r);
    else if (r.conf > out[i].conf + 8) out[i] = r;
  }
  return out.sort((x, y) => x.bbox.y0 - y.bbox.y0 || x.bbox.x0 - y.bbox.x0);
}

/**
 * Legge la foto (o la porzione scelta) e ne ricava i defunti.
 * Due passaggi: la foto in grigi e il testo reso bianco e nero. Ognuno può perdere qualcosa
 * (una colonna, una riga di date), quindi si prova anche a unire le righe dei due e si tiene
 * la lettura più coerente.
 */
export async function leggiFoto(foto: string, area: Area | null, diz: Dizionario, onAvanzamento?: Avanzamento): Promise<RisultatoLettura> {
  avvisa = onAvanzamento ?? null;
  try {
    onAvanzamento?.('Preparo il riconoscimento…', null);
    const p1 = await prepara(foto, area, 'grigio');
    const r1 = await riconosci(p1);
    let migliore: RisultatoLettura = { righe: r1, lettura: leggiLapide(r1, diz), larghezza: p1.W, altezza: p1.H };
    onAvanzamento?.('Ricontrollo con più contrasto…', null);
    const p2 = await prepara(foto, area, 'netto');
    const r2 = await riconosci(p2);
    for (const righe of [r2, unisciRighe(r1, r2)]) {
      const l = leggiLapide(righe, diz);
      if (l.punteggio > migliore.lettura.punteggio) migliore = { righe, lettura: l, larghezza: p2.W, altezza: p2.H };
    }
    return migliore;
  } finally {
    avvisa = null;
  }
}
