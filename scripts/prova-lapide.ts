// Prova della lettura delle lapidi senza fotocamera: testi come li restituisce il riconoscimento, errori compresi.
// Uso: node scripts/prova-lapide.ts
import { creaDizionario, leggiLapide, type RigaOcr } from '../src/lib/lapide.ts';

/** Costruisce le righe OCR: una stringa è una riga, un array [sinistra, destra] è una riga a due colonne. */
function righe(testo: (string | [string, string])[], conf = 88): RigaOcr[] {
  return testo.map((r, i) => {
    const y0 = 40 + i * 60;
    const parole: RigaOcr['parole'] = [];
    const metti = (s: string, x0: number) => {
      let x = x0;
      for (const w of s.split(' ').filter(Boolean)) {
        parole.push({ testo: w, conf, bbox: { x0: x, y0, x1: x + w.length * 22, y1: y0 + 40 } });
        x += w.length * 22 + 18;
      }
    };
    if (Array.isArray(r)) {
      metti(r[0], 60);
      metti(r[1], 900);
    } else metti(r, 300);
    return { testo: parole.map((p) => p.testo).join(' '), conf, bbox: { x0: parole[0].bbox.x0, y0, x1: parole[parole.length - 1].bbox.x1, y1: y0 + 40 }, parole };
  });
}

const diz = creaDizionario([{ nome: 'Corrado', cognome: 'Cannizzaro', sesso: 'M' }]);

const casi: { titolo: string; righe: (string | [string, string])[]; atteso: string }[] = [
  { titolo: 'Classica N./M.', righe: ['GIUSEPPE RUTA', 'N. 12-3-1930   M. 5-6-2001', 'I FIGLI POSERO'], atteso: 'Giuseppe Ruta M 1930-03-12 2001-06-05' },
  { titolo: 'Cognome prima del nome', righe: ['CANNIZZARO CORRADO', '1.2.1925 - 30.11.1999'], atteso: 'Corrado Cannizzaro M 1925-02-01 1999-11-30' },
  { titolo: 'Data a parole, nata/morta', righe: ['MARIA CONCETTA DI STEFANO', 'IN RUTA', 'NATA IL 4 NOVEMBRE 1934', 'MORTA IL 22 GENNAIO 2015'], atteso: 'Maria Concetta Di Stefano F 1934-11-04 2015-01-22 in Ruta' },
  { titolo: 'Mese romano e simboli', righe: ['CAV. SALVATORE LO PRESTI', '* 7-IX-1920  † 18-XII-1988'], atteso: 'Salvatore Lo Presti M 1920-09-07 1988-12-18' },
  { titolo: 'Errori di lettura', righe: ['GIOVANNl B1ANCHI', 'N. l2.O3.l94S  M. O5.06.2OO1'], atteso: 'Giovanni Bianchi M 1945-03-12 2001-06-05' },
  { titolo: 'Solo anni', righe: ['ROSA', 'CANNIZZARO', '1910 - 1987'], atteso: 'Rosa Cannizzaro F anni 1910-1987' },
  { titolo: 'Lapide doppia', righe: [['GAETANO RUTA', 'GIOVANNA LICITRA'], ['N. 3.5.1928', 'N. 9.8.1931'], ['M. 14.2.2004', 'M. 1.10.2019']], atteso: 'Gaetano Ruta + Giovanna Licitra' },
  { titolo: 'Famiglia con soli nomi', righe: ['FAMIGLIA SCROFANI', 'ORAZIO 1901 - 1970', 'VENERA 1905 - 1992'], atteso: 'Orazio Scrofani, Venera Scrofani' },
  { titolo: 'Età e data unica', righe: ['QUI RIPOSA', 'ANGELA MALANDRINO', 'DECEDUTA IL 3.4.1999', 'DI ANNI 71', 'I TUOI CARI'], atteso: 'Angela Malandrino F morte 1999-04-03 eta 71' },
  { titolo: 'Accenti e apostrofo', righe: ["NICOLÒ D'AMICO", '15.08.1940 - 02.02.2020'], atteso: "Nicolò D'Amico M" },
  { titolo: 'Nome in due righe', righe: ['FRANCESCO PAOLO', 'GIUFFRIDA', '12/7/1950 - 9/9/2010'], atteso: 'Francesco Paolo Giuffrida' },
  { titolo: 'Nome corretto', righe: ['SALVATORF IACONO', 'N. 1.1.1950 M. 2.2.2010'], atteso: 'Salvatore Iacono' },
];

for (const c of casi) {
  const l = leggiLapide(righe(c.righe), diz);
  console.log(`\n■ ${c.titolo}  (atteso: ${c.atteso})`);
  if (l.famiglia) console.log(`  famiglia: ${l.famiglia}`);
  for (const d of l.defunti) {
    const a = d.aff;
    console.log(
      `  → ${d.nome || '?'} [${a.nome}] | ${d.cognome || '?'} [${a.cognome}] | ${d.sesso ?? '?'} [${a.sesso}] | n ${d.dataNascita ?? (d.annoNascita ? `anno ${d.annoNascita}` : '—')} [${a.dataNascita}] | m ${d.dataMorte ?? (d.annoMorte ? `anno ${d.annoMorte}` : '—')} [${a.dataMorte}]` +
        `${d.eta !== undefined ? ` | età ${d.eta}` : ''}${d.coniuge ? ` | ${d.coniuge}` : ''}${d.corretti.length ? ` | corretti: ${d.corretti.join(', ')}` : ''}`,
    );
  }
  if (!l.defunti.length) console.log('  (nessun defunto)');
  if (l.epigrafe.length) console.log(`  epigrafe: ${l.epigrafe.join(' / ')}`);
}

// caso reale dal riconoscimento sul marmo: separatori doppi e barre spurie
console.log('\n■ Separatori sporchi');
for (const d of leggiLapide(righe(['GIUSEPPE RUTA', String.raw`N. 12-3-/1930\ M. 5-6-2001`]), diz).defunti) console.log(`  → ${d.nome} ${d.cognome} | n ${d.dataNascita} | m ${d.dataMorte}`);

// caso reale: il riconoscimento unisce i due nomi in una riga ma tiene separate le date delle due colonne
console.log('\n■ Lapide doppia letta a righe miste');
const miste: RigaOcr[] = [
  { testo: 'FAMIGLIA LICITRA', conf: 92, bbox: { x0: 500, y0: 120, x1: 1100, y1: 180 }, parole: [{ testo: 'FAMIGLIA', conf: 92, bbox: { x0: 500, y0: 120, x1: 800, y1: 180 } }, { testo: 'LICITRA', conf: 92, bbox: { x0: 830, y0: 120, x1: 1100, y1: 180 } }] },
  { testo: 'GAETANO LICITRA GIOVANNA SCROFANI', conf: 84, bbox: { x0: 180, y0: 350, x1: 1450, y1: 410 }, parole: [
    { testo: 'GAETANO', conf: 84, bbox: { x0: 180, y0: 350, x1: 420, y1: 410 } }, { testo: 'LICITRA', conf: 84, bbox: { x0: 440, y0: 350, x1: 680, y1: 410 } },
    { testo: 'GIOVANNA', conf: 84, bbox: { x0: 880, y0: 350, x1: 1150, y1: 410 } }, { testo: 'SCROFANI', conf: 84, bbox: { x0: 1170, y0: 350, x1: 1450, y1: 410 } }] },
  { testo: 'IN LICITRA', conf: 91, bbox: { x0: 1050, y0: 440, x1: 1290, y1: 480 }, parole: [{ testo: 'IN', conf: 91, bbox: { x0: 1050, y0: 440, x1: 1100, y1: 480 } }, { testo: 'LICITRA', conf: 91, bbox: { x0: 1120, y0: 440, x1: 1290, y1: 480 } }] },
  { testo: 'N. 3 MAGGIO 1928', conf: 73, bbox: { x0: 250, y0: 480, x1: 610, y1: 520 }, parole: [{ testo: 'N.', conf: 73, bbox: { x0: 250, y0: 480, x1: 290, y1: 520 } }, { testo: '3', conf: 73, bbox: { x0: 310, y0: 480, x1: 330, y1: 520 } }, { testo: 'MAGGIO', conf: 73, bbox: { x0: 350, y0: 480, x1: 500, y1: 520 } }, { testo: '1928', conf: 73, bbox: { x0: 520, y0: 480, x1: 610, y1: 520 } }] },
  { testo: 'N. 9-VIII-1931', conf: 84, bbox: { x0: 1020, y0: 520, x1: 1320, y1: 560 }, parole: [{ testo: 'N.', conf: 84, bbox: { x0: 1020, y0: 520, x1: 1060, y1: 560 } }, { testo: '9-VIII-1931', conf: 84, bbox: { x0: 1080, y0: 520, x1: 1320, y1: 560 } }] },
  { testo: 'M. 14 FEBBRAIO 2004', conf: 95, bbox: { x0: 220, y0: 560, x1: 640, y1: 600 }, parole: [{ testo: 'M.', conf: 95, bbox: { x0: 220, y0: 560, x1: 260, y1: 600 } }, { testo: '14', conf: 95, bbox: { x0: 280, y0: 560, x1: 320, y1: 600 } }, { testo: 'FEBBRAIO', conf: 95, bbox: { x0: 340, y0: 560, x1: 530, y1: 600 } }, { testo: '2004', conf: 95, bbox: { x0: 550, y0: 560, x1: 640, y1: 600 } }] },
  { testo: 'M. 1-X-2019', conf: 90, bbox: { x0: 1050, y0: 600, x1: 1290, y1: 640 }, parole: [{ testo: 'M.', conf: 90, bbox: { x0: 1050, y0: 600, x1: 1090, y1: 640 } }, { testo: '1-X-2019', conf: 90, bbox: { x0: 1110, y0: 600, x1: 1290, y1: 640 } }] },
];
const lm = leggiLapide(miste, diz);
for (const d of lm.defunti) console.log(`  → ${d.nome} ${d.cognome} ${d.sesso} | n ${d.dataNascita} | m ${d.dataMorte}${d.coniuge ? ` | ${d.coniuge}` : ''}`);

console.log('\n■ Mese romano letto male e titolo');
for (const d of leggiLapide(righe(['CAV. SALVATORE CANNIZZO', 'NATO IL 7 SETTEMBRE 1931', 'MORTO IL 18-XI1-2012', 'LA MOGLIE E 1 FIGLI']), diz).defunti) console.log(`  → ${d.nome} ${d.cognome} ${d.sesso} | n ${d.dataNascita} | m ${d.dataMorte}`);
console.log('■ Novembre in cifre con la I');
for (const d of leggiLapide(righe(['ROSA LICITRA', '3-I1-1940 - 18-11-2012']), diz).defunti) console.log(`  → ${d.nome} ${d.cognome} | n ${d.dataNascita} | m ${d.dataMorte}`);
console.log('■ Lettera simile in un nome normale, cognomi rari intatti');
for (const d of leggiLapide(righe(['GAFTANO LICITRA', 'N. 3 MAGGIO 1928 M. 14 FEBBRAIO 2004']), diz).defunti) console.log(`  → ${d.nome} ${d.cognome} ${d.sesso} | ${d.corretti.join(', ')}`);
for (const d of leggiLapide(righe(['GIUSEPPE RUTA', '1930 - 2001']), diz).defunti) console.log(`  → ${d.nome} ${d.cognome} | ${d.corretti.join(', ') || 'nessuna correzione'}`);
for (const d of leggiLapide(righe(['MARIO MANNO', '1930 - 2001']), diz).defunti) console.log(`  → ${d.nome} ${d.cognome} | ${d.corretti.join(', ') || 'nessuna correzione'}`);
console.log('■ "IN RUTA" letto attaccato, rumore "PIER"');
for (const d of leggiLapide(righe(['MARIA CONCETTA DI STEFANO', 'INRUTA', '4.11.1934 - 22.1.2015', 'PIER']), diz).defunti) console.log(`  → ${d.nome} ${d.cognome} ${d.coniuge ?? ''} | n ${d.dataNascita} | m ${d.dataMorte}`);
for (const d of leggiLapide(righe(['INES LICITRA', '1.2.1930 - 3.4.2000']), diz).defunti) console.log(`  → ${d.nome} ${d.cognome} ${d.sesso} ${d.coniuge ?? ''}`);
