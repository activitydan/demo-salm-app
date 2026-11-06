// Copia in public/ocr i file del motore di lettura delle lapidi (Tesseract.js) e il modello della lingua italiana,
// così l'app non dipende da CDN esterni e, dopo il primo uso, legge le lapidi anche senza connessione.
// Parte da sola dopo `npm install`; si può lanciare anche a mano: node scripts/copia-ocr.mjs
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const nm = join(root, 'node_modules');
const dest = join(root, 'public', 'ocr');
mkdirSync(dest, { recursive: true });

const file = [
  ['tesseract.js/dist/worker.min.js', 'worker.min.js'],
  ['tesseract.js-core/tesseract-core-lstm.wasm.js', 'tesseract-core-lstm.wasm.js'],
  ['tesseract.js-core/tesseract-core-simd-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js'],
  ['tesseract.js-core/tesseract-core-relaxedsimd-lstm.wasm.js', 'tesseract-core-relaxedsimd-lstm.wasm.js'],
  ['@tesseract.js-data/ita/4.0.0_best_int/ita.traineddata.gz', 'ita.traineddata.gz'],
];
for (const [da, a] of file) copyFileSync(join(nm, da), join(dest, a));
console.log(`OCR: ${file.length} file copiati in public/ocr`);
