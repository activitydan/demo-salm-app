// Lettura delle lapidi: dal testo riconosciuto nella foto ricava i defunti (nome, cognome, sesso, date),
// con un'affidabilità per ogni dato, così l'operatore controlla solo quello che serve.
// Nessuna dipendenza: si prova anche da Node con `node scripts/prova-lapide.ts`.

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface ParolaOcr {
  testo: string;
  conf: number; // 0-100
  bbox: Box;
}

export interface RigaOcr {
  testo: string;
  conf: number; // 0-100
  bbox: Box;
  parole: ParolaOcr[];
}

export type Affidabilita = 'alta' | 'media' | 'bassa';
export type Sesso = 'M' | 'F';
export type CampoLetto = 'nome' | 'cognome' | 'sesso' | 'dataNascita' | 'dataMorte';

export interface DefuntoLetto {
  nome: string;
  cognome: string;
  sesso?: Sesso;
  dataNascita: string | null;
  dataMorte: string | null;
  /** Sulla lapide c'è solo l'anno: la data resta vuota e l'anno finisce nelle note. */
  annoNascita?: number;
  annoMorte?: number;
  eta?: number;
  /** "in Ruta", "ved. Ruta" */
  coniuge?: string;
  aff: Record<CampoLetto, Affidabilita>;
  /** Parole corrette rispetto al testo letto, per esempio "GIUSEPPF → Giuseppe". */
  corretti: string[];
  box: Box[];
}

export interface Lettura {
  defunti: DefuntoLetto[];
  /** "Ruta" da "Famiglia Ruta", tipico delle cappelle */
  famiglia?: string;
  /** Righe lette ma non usate (frasi, dediche) */
  epigrafe: string[];
  /** Quanto è "buona" la lettura: serve a scegliere tra due passaggi del riconoscimento. */
  punteggio: number;
}

export interface Dizionario {
  nomi: Map<string, Sesso | 'U'>;
  cognomi: Set<string>;
}

// ---------------------------------------------------------------------------
// Vocabolario
// ---------------------------------------------------------------------------

const NOMI_M =
  'ACHILLE ADOLFO ADRIANO AGATINO AGOSTINO ALBERTO ALDO ALESSANDRO ALESSIO ALFIO ALFONSO ALFREDO AMEDEO ANDREA ANGELO ANSELMO ANTONINO ANTONIO ARCANGELO ARMANDO ARTURO ATTILIO AUGUSTO BALDASSARE BARTOLO BARTOLOMEO BATTISTA BENEDETTO BENIAMINO BERNARDO BIAGIO BRUNO CALOGERO CARLO CARMELO CARMINE CESARE CIRO CLAUDIO CONCETTO CORRADINO CORRADO COSIMO COSTANTINO CRESCENZO CRISTIAN CRISTOFORO DAMIANO DANIELE DARIO DAVIDE DIEGO DINO DOMENICO DONATO EDOARDO EGIDIO ELIA ELIO EMANUELE EMILIO ENEA ENRICO ENZO ERASMO ERNESTO ETTORE EUGENIO FABIO FEDERICO FELICE FERDINANDO FILIBERTO FILIPPO FLAVIO FORTUNATO FRANCESCO FRANCO GABRIELE GAETANO GASPARE GENNARO GERARDO GERLANDO GIACOMO GIAMPIERO GIAN GIANCARLO GIANFRANCO GIANLUCA GIANNI GINO GIOACCHINO GIORGIO GIOSUE GIOVAN GIOVANBATTISTA GIOVANNI GIROLAMO GIULIANO GIULIO GIUSEPPE GIUSTO GREGORIO GUGLIELMO GUIDO IGNAZIO ISAIA ITALO LEOLUCA LEONARDO LIBORIO LORENZO LUCA LUCIANO LUCIO LUIGI MANLIO MARCELLO MARCO MARIANO MARINO MARIO MARTINO MASSIMILIANO MASSIMO MATTEO MATTIA MAURIZIO MAURO MELCHIORRE MICHELANGELO MICHELE MOSE NATALE NAZARENO NICOLA NICOLINO NICOLO NINO NUNZIO ORAZIO OSVALDO OTTAVIO PANCRAZIO PAOLINO PAOLO PASQUALE PELLEGRINO PIER PIERLUIGI PIERO PIETRO PIO PLACIDO PRIMO PROSPERO QUINTO RAFFAELE RAIMONDO REMO RENATO RENZO RICCARDO RINO ROBERTO ROCCO ROMANO ROSARIO RUGGERO SALVATORE SALVO SAMUELE SANDRO SANTO SANTI SAVERIO SEBASTIANO SECONDO SERAFINO SERGIO SILVESTRO SILVIO SIMONE SIRO SPIRIDIONE STANISLAO STEFANO TANCREDI TEODORO TINDARO TITO TOBIA TOMMASO TOTO TULLIO UGO UMBERTO VALENTINO VALERIO VENERANDO VINCENZINO VINCENZO VIRGILIO VITO VITTORIO ZACCARIA';
const NOMI_F =
  'ADELE ADELINA ADRIANA AGATA AGNESE ALBA ALDA ALESSANDRA ALICE AMALIA ANGELA ANGELINA ANNA ANNALISA ANNUNZIATA ANTONELLA ANTONIA ANTONINA ARCANGELA ASSUNTA AURORA BARBARA BEATRICE BENEDETTA BIAGIA BRUNA CALOGERA CARLA CARLOTTA CARMELA CARMELINA CARMEN CATERINA CECILIA CHIARA CLARA CLAUDIA CONCETTA CONCETTINA CORRADINA COSIMA CRISTINA DANIELA DOMENICA DONATA EDVIGE ELENA ELEONORA ELISABETTA ELVIRA EMANUELA EMMA ENZA ERMINIA EUGENIA FEDERICA FILIPPA FILOMENA FIORELLA FLORA FORTUNATA FRANCA FRANCESCA GABRIELLA GAETANA GEMMA GIACOMA GIACOMINA GIANNA GIORGIA GIOVANNA GIOVANNINA GIUDITTA GIULIA GIUSEPPA GIUSEPPINA GRAZIA GRAZIELLA IGNAZIA ILARIA IMMACOLATA INES IOLANDA IRENE IVANA LAURA LEONARDA LEONILDE LETIZIA LIBERA LIDIA LILIANA LINA LOREDANA LORENZA LUCIA LUCIANA LUCREZIA LUIGIA LUISA MADDALENA MAFALDA MARCELLA MARCELLINA MARGHERITA MARIA MARIAGRAZIA MARIANNA MARIELLA MARILENA MARINA MARISA MARTA MATILDE MICHELA MIRELLA MONICA NATALIA NATALINA NELLA NICOLETTA NINA NORMA NUNZIA NUNZIATINA OLGA ORAZIA ORNELLA PALMA PAOLA PAOLINA PASQUA PATRIZIA PIERA PIETRINA PROVVIDENZA RACHELE RAFFAELA RAFFAELLA REGINA RENATA RINA RITA ROBERTA ROMANA ROSA ROSALBA ROSALIA ROSALINDA ROSANNA ROSARIA ROSETTA ROSINA SALVATRICE SALVINA SANTA SANTINA SARA SEBASTIANA SERAFINA SERENA SILVANA SILVIA SIMONA SOFIA STELLA TERESA TERESINA TINA TOMMASA UMBERTA VALENTINA VALERIA VENERA VERONICA VINCENZA VINCENZINA VIOLA VITA VITTORIA VIVIANA ZINA';

/** Parole delle dediche e delle frasi: una riga che le contiene non è un nome. */
const STOP = new Set(
  'RIPOSA RIPOSI RIPOSANO RIPOSINO PACE QUI GIACE GIACCIONO RICORDO RICORDANO RICORDA RICORDATE AFFETTO AFFETTUOSO AMORE AMATA AMATO AMATISSIMA AMATISSIMO CARI CARA CARO CARISSIMA CARISSIMO TUOI TUA TUO TUE SUOI SUA SUO SUE FIGLI FIGLIO FIGLIA FIGLIE MOGLIE MARITO SPOSO SPOSA NIPOTI NIPOTE GENITORI FRATELLI FRATELLO SORELLA SORELLE POSERO POSE PREGATE PREGHIERA PREGHIERE PER LUI LEI LORO SEMPRE ETERNO ETERNA ETERNI DOLORE SIGNORE DIO CIELO CIELI MAMMA PAPA NONNO NONNA NONNI CON CHE NEL NELLA NEI NELLE ALLA ALLE ALLO AGLI AI AL DELLE MEMORIA ANIMA ANIME LUCE ADDOLORATI ADDOLORATA INCONSOLABILI INCONSOLABILE LACRIME ANGELI GESU VERGINE CROCE AMEN CUORE CUORI OGNI GIORNO MAI NON DIMENTICHEREMO TI VI CI MI SI NOI VOI NOSTRO NOSTRA NOSTRI NOSTRE ANNI ANNO ETA IL GLI UN UNA UNO COME DOVE QUANDO PIU TANTO TROPPO PRESTO OGGI REQUIEM AETERNAM RIP SPERANZA FEDE BONTA ESEMPIO LAVORO ONESTA GRAZIE TUTTI TUTTE E ED O HA HAI HANNO SEI SEMPRE VIVRAI VIVE VIVI RESTERAI ACCANTO INSIEME CASA PADRE MADRE NATO NATA MORTO MORTA MORTE DECEDUTO DECEDUTA DEFUNTO DEFUNTA SPENTO SPENTA NACQUE'.split(' '),
);

const TITOLI_M = new Set('DON SAC SACERDOTE MONS MONSIGNOR FRA SIGNOR SIG MAESTRO BARONE CONTE MARCHESE PRINCIPE DUCA CAV COMM UFF GR DOTT DOTTOR DOTTORE DR PROF PROFESSORE AVV AVVOCATO ING INGEGNERE RAG RAGIONIERE GEOM GEOMETRA ARCH ON ONOREVOLE MAR MARESCIALLO MLLO GEN GENERALE COL COLONNELLO CAP CAPITANO TEN TENENTE SERG SERGENTE BRIG BRIGADIERE APP APPUNTATO NOB'.split(' '));
const TITOLI_F = new Set('SUOR SR SIGRA SIGNORA SIGNORINA SIGNA DOTTORESSA DOTTSSA PROFESSORESSA PROFSSA MAESTRA BARONESSA CONTESSA MARCHESA PRINCIPESSA DUCHESSA'.split(' '));
/** Titoli che non dicono nulla sul sesso (dott., prof., cav. valgono per tutti nelle abbreviazioni). */
const TITOLI_NEUTRI = new Set('CAV COMM UFF GR DOTT DR PROF AVV ING RAG GEOM ARCH ON MAR MLLO GEN COL CAP TEN SERG BRIG APP NOB SIG'.split(' '));

const PREFISSI = new Set('DI DE DEL DELLA DELLO DEI DEGLI LA LO LI LE DA DAL DALLA DALLO SAN MC MAC'.split(' '));

/** Parole che introducono una data o l'età: tagliano la parte con il nome. */
const MARCATORI = new Set('N NATO NATA NACQUE M MORTO MORTA DEC DECEDUTO DECEDUTA DEF DEFUNTO DEFUNTA SPENTO SPENTA SPENTOSI SPENTASI SALITO SALITA TORNATO TORNATA VOLATO VOLATA * † ✝ + IL ANNI DI'.split(' '));

const MESI: [string, number][] = [
  ['GENNAIO', 1], ['FEBBRAIO', 2], ['MARZO', 3], ['APRILE', 4], ['MAGGIO', 5], ['GIUGNO', 6],
  ['LUGLIO', 7], ['AGOSTO', 8], ['SETTEMBRE', 9], ['OTTOBRE', 10], ['NOVEMBRE', 11], ['DICEMBRE', 12],
];
const ROMANI: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };

// ---------------------------------------------------------------------------
// Utilità
// ---------------------------------------------------------------------------

/** Maiuscolo senza accenti: la chiave con cui si confrontano i nomi. */
export function chiave(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘`´]/g, "'")
    .toUpperCase()
    .replace(/[^A-Z' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "DI STEFANO" → "Di Stefano", "D'AMICO" → "D'Amico" */
export function bello(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[\s'-])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase())
    .trim();
}

/** Lettere che il riconoscimento scambia spesso tra loro: sostituirle costa la metà. */
const SIMILI = ['IL1T|', 'EF', 'OQD0', 'CG', 'B8', 'S5', 'Z2', 'UV', 'MN', 'RK', 'A4', 'HN'];
const costo = (x: string, y: string) => (x === y ? 0 : SIMILI.some((g) => g.includes(x) && g.includes(y)) ? 0.5 : 1);

function distanza(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 9;
  const v = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prec = v[0];
    v[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = v[j];
      v[j] = Math.min(v[j] + 1, v[j - 1] + 1, prec + costo(a[i - 1], b[j - 1]));
      prec = t;
    }
  }
  return v[b.length];
}

const mediana = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};
const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const unione = (bs: Box[]): Box => ({
  x0: Math.min(...bs.map((b) => b.x0)),
  y0: Math.min(...bs.map((b) => b.y0)),
  x1: Math.max(...bs.map((b) => b.x1)),
  y1: Math.max(...bs.map((b) => b.y1)),
});

function livello(v: number): Affidabilita {
  return v >= 0.72 ? 'alta' : v >= 0.5 ? 'media' : 'bassa';
}

// ---------------------------------------------------------------------------
// Dizionario dei nomi: quello di base più i nomi già censiti nel cimitero
// ---------------------------------------------------------------------------

export function creaDizionario(noti: { nome: string; cognome: string; sesso?: Sesso }[] = []): Dizionario {
  const nomi = new Map<string, Sesso | 'U'>();
  for (const n of NOMI_M.split(' ')) nomi.set(n, 'M');
  for (const n of NOMI_F.split(' ')) nomi.set(n, 'F');
  const cognomi = new Set<string>();
  for (const d of noti) {
    for (const p of chiave(d.nome).split(' ')) {
      if (p.length < 3 || PREFISSI.has(p)) continue;
      const g = nomi.get(p);
      if (!g) nomi.set(p, d.sesso ?? 'U');
      else if (d.sesso && g !== d.sesso && g === 'U') nomi.set(p, d.sesso);
    }
    const c = chiave(d.cognome);
    if (c.length >= 2) cognomi.add(c);
  }
  return { nomi, cognomi };
}

// ---------------------------------------------------------------------------
// Date
// ---------------------------------------------------------------------------

interface Evento {
  i: number; // posizione nella riga
  fine: number;
  iso: string | null; // null = solo anno
  anno: number;
  tipo: 'nascita' | 'morte' | null;
  conf: number;
}

const OGGI = new Date();

function iso(g: number, m: number, a: number): string | null {
  if (a < 1800 || a > OGGI.getFullYear() || m < 1 || m > 12 || g < 1 || g > 31) return null;
  const d = new Date(a, m - 1, g);
  if (d.getMonth() !== m - 1 || d > OGGI) return null;
  return `${a}-${String(m).padStart(2, '0')}-${String(g).padStart(2, '0')}`;
}

/** Nelle parole fatte quasi solo di cifre corregge le lettere che il riconoscimento confonde con i numeri. */
function riparaCifre(s: string): string {
  return s.replace(/\S+/g, (tok) => {
    const cifre = (tok.match(/\d/g) ?? []).length;
    const alnum = (tok.match(/[\dA-Za-z|!]/g) ?? []).length;
    if (cifre < 2 || cifre / alnum < 0.5) return tok;
    return tok.replace(/[OoQD]/g, '0').replace(/[ILl|i!]/g, '1').replace(/[Zz]/g, '2').replace(/[Ss]/g, '5').replace(/B/g, '8').replace(/[Gb]/g, '6').replace(/[gq]/g, '9');
  });
}

const numero = (s: string) => Number(s.replace(/[OoQD]/g, '0').replace(/[ILl|i!]/g, '1').replace(/[Zz]/g, '2').replace(/[Ss]/g, '5').replace(/B/g, '8').replace(/[Gb]/g, '6').replace(/\D/g, ''));

function mese(parola: string): number | null {
  const p = chiave(parola);
  if (p.length < 3) return null;
  for (const [nome, n] of MESI) if (p === nome || (p.length <= 5 && nome.startsWith(p))) return n;
  let meglio: number | null = null;
  let dmin = 3;
  for (const [nome, n] of MESI) {
    const d = distanza(p, nome);
    if (d < dmin && p.length >= 5) {
      dmin = d;
      meglio = n;
    }
  }
  return meglio;
}

function trovaDate(t: string): { eventi: Evento[]; resto: string } {
  let lavoro = t;
  const eventi: Evento[] = [];
  const copri = (i: number, n: number) => {
    lavoro = lavoro.slice(0, i) + ' '.repeat(n) + lavoro.slice(i + n);
  };
  // 12-III-1930
  // separatori anche doppi o sporchi ("3-/1930"): le venature del marmo aggiungono barre e trattini
  for (const m of t.matchAll(/(\d{1,2}|[\dOILl|]{1,2})\s*[.\-/\\ ]{1,2}\s*([XVI1l|]{1,4})\s*[.\-/\\ ]{1,2}\s*([\dOILl|SB]{4})(?![\d])/g)) {
    // "XI1" è XII letto male; "11" invece è novembre in cifre e lo prende il passaggio successivo
    if (!/[XV]/.test(m[2]) && !/^I+$/.test(m[2])) continue;
    const mese = ROMANI[m[2].replace(/[1l|]/g, 'I')];
    if (!mese) continue;
    const v = iso(numero(m[1]), mese, numero(m[3]));
    if (v) {
      eventi.push({ i: m.index!, fine: m.index! + m[0].length, iso: v, anno: Number(v.slice(0, 4)), tipo: null, conf: 1 });
      copri(m.index!, m[0].length);
    }
  }
  // 12 marzo 1930, 1° gennaio 1930
  for (const m of lavoro.matchAll(/(\d{1,2}|[\dOI|]{1,2})\s*[°º]?\s*[.\-/ ]?\s*(\p{L}{3,10})\.?\s*[.\-/ ]?\s*([\dOILl|SB]{4})(?![\d])/gu)) {
    const ms = mese(m[2]);
    if (!ms) continue;
    const v = iso(numero(m[1]), ms, numero(m[3]));
    if (v) {
      eventi.push({ i: m.index!, fine: m.index! + m[0].length, iso: v, anno: Number(v.slice(0, 4)), tipo: null, conf: 1 });
      copri(m.index!, m[0].length);
    }
  }
  // 12.3.1930, 12-03-1930, 12/3/1930
  lavoro = riparaCifre(lavoro);
  for (const m of lavoro.matchAll(/(?<!\d)(\d{1,2})\s*[.\-/,\\]{1,2}\s*(\d{1,2})\s*[.\-/,\\]{1,2}\s*(\d{4})(?!\d)/g)) {
    const v = iso(Number(m[1]), Number(m[2]), Number(m[3]));
    if (v) {
      eventi.push({ i: m.index!, fine: m.index! + m[0].length, iso: v, anno: Number(v.slice(0, 4)), tipo: null, conf: 1 });
      copri(m.index!, m[0].length);
    }
  }
  // solo l'anno: 1930
  for (const m of lavoro.matchAll(/(?<!\d)(1[89]\d{2}|20\d{2})(?!\d)/g)) {
    const a = Number(m[1]);
    if (a > OGGI.getFullYear()) continue;
    eventi.push({ i: m.index!, fine: m.index! + m[0].length, iso: null, anno: a, tipo: null, conf: 0.85 });
    copri(m.index!, m[0].length);
  }
  eventi.sort((a, b) => a.i - b.i);
  // tipo dal segno o dalla parola che precede la data
  let prec = 0;
  for (const e of eventi) {
    const prima = ` ${chiave(t.slice(prec, e.i).replace(/[*†✝+]/g, (c) => ` ${c === '*' ? 'NASCITAX' : 'MORTEX'} `))} `;
    const n = Math.max(...[/ (N|NATO|NATA|NACQUE|NASCITAX) /].map((r) => lastIndex(prima, r)));
    const mo = Math.max(...[/ (M|MORTO|MORTA|MORTE|DEC|DECEDUTO|DECEDUTA|DEF|DEFUNTO|DEFUNTA|SPENTO|SPENTA|SPENTOSI|SPENTASI|SALITO|SALITA|TORNATO|TORNATA|VOLATO|VOLATA|T|MORTEX) /].map((r) => lastIndex(prima, r)));
    if (n >= 0 || mo >= 0) e.tipo = n > mo ? 'nascita' : 'morte';
    prec = e.fine;
  }
  return { eventi, resto: lavoro };
}

function lastIndex(s: string, r: RegExp): number {
  let ultimo = -1;
  const g = new RegExp(r.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = g.exec(s))) {
    ultimo = m.index;
    g.lastIndex = m.index + 1;
  }
  return ultimo;
}

function trovaEta(resto: string): number | undefined {
  const r = resto.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const m = r.match(/\b(?:DI\s+|D')?(?:ANNI|AA|ETA'?)\.?\s*(\d{1,3})(?!\d)/) ?? r.match(/(?<!\d)(\d{1,3})\s*ANNI\b/);
  if (!m) return undefined;
  const n = Number(m[1]);
  return n > 0 && n < 116 ? n : undefined;
}

// ---------------------------------------------------------------------------
// Nomi
// ---------------------------------------------------------------------------

interface Nome {
  token: string[]; // in chiave, prefissi già uniti ("DI STEFANO")
  originali: string[]; // come letti, per il maiuscolo/minuscolo con gli accenti
  sesso?: Sesso;
  sessoForte: boolean;
  coniuge?: string;
  corretti: string[];
  noti: number; // quanti token sono nomi propri conosciuti
}

/** Parola da correggere: contiene cifre o simboli, o finisce in consonante (raro nei nomi italiani). */
function sospetta(t: string): boolean {
  return /[^A-Z']/.test(t) || /[BCDFGHJKLMNPQRSTVWXYZ]$/.test(t) || /[JKWXY]/.test(t);
}

/**
 * Il nome conosciuto più vicino alla parola letta, se è uno solo.
 * "lieve": la parola sembra normale, quindi si accetta solo una lettera scambiata con una simile
 * (GAFTANO → Gaetano) e solo verso un nome proprio, per non stravolgere cognomi rari.
 */
function correggi(t: string, diz: Dizionario, lieve = false): string | null {
  if (t.length < 4) return null;
  const soglia = lieve ? 0.5 : t.length >= 7 ? 2 : 1;
  let meglio: string | null = null;
  let dmin = Infinity;
  let pari = false;
  const prova = (c: string) => {
    const d = distanza(t, c);
    if (d > soglia) return;
    if (d < dmin) {
      dmin = d;
      meglio = c;
      pari = false;
    } else if (d === dmin && c !== meglio) pari = true;
  };
  for (const n of diz.nomi.keys()) prova(n);
  if (!lieve) for (const c of diz.cognomi) if (!c.includes(' ')) prova(c);
  return meglio && !pari ? meglio : null;
}

function leggiNome(testo: string, diz: Dizionario): Nome | null {
  let grezzi = testo
    .replace(/[’‘`´]/g, "'")
    .split(/\s+/)
    .map((p) => p.replace(/^[^\p{L}\d']+|[^\p{L}\d'.]+$/gu, ''))
    .filter(Boolean);
  // cifre lette al posto delle lettere: 0 → O, 1 → I, 5 → S, 8 → B; il resto dei simboli rende la parola sospetta
  grezzi = grezzi.map((p) => (/\p{L}/u.test(p) ? p.replace(/0/g, 'O').replace(/[1|]/g, 'I').replace(/5/g, 'S').replace(/8/g, 'B') : p));
  let sesso: Sesso | undefined;
  let sessoForte = false;
  // titoli in testa
  while (grezzi.length) {
    const k = chiave(grezzi[0].replace(/\./g, ''));
    if (TITOLI_F.has(k)) {
      sesso = 'F';
      sessoForte = true;
    } else if (TITOLI_M.has(k)) {
      if (!TITOLI_NEUTRI.has(k)) {
        sesso = 'M';
        sessoForte = true;
      }
    } else break;
    grezzi.shift();
  }
  // "in Ruta", "ved. Ruta": cognome del marito
  let coniuge: string | undefined;
  const iConiuge = grezzi.findIndex((p, i) => i > 0 && /^(IN|VED\.?|VEDOVA)$/i.test(p));
  if (iConiuge > 0) {
    const resto = grezzi.slice(iConiuge + 1).map((p) => p.replace(/\.$/, ''));
    if (resto.length && resto.length <= 3) {
      coniuge = `${/^in$/i.test(grezzi[iConiuge]) ? 'in' : 'ved.'} ${bello(resto.join(' '))}`;
      sesso = 'F';
      sessoForte = true;
    }
    grezzi = grezzi.slice(0, iConiuge);
  }
  grezzi = grezzi.map((p) => p.replace(/\.$/, '')).filter(Boolean);
  // le lapidi sono quasi sempre in maiuscolo: accanto a parole maiuscole, quelle in minuscolo sono rumore
  const maiuscola = (p: string) => p === p.toUpperCase() && /\p{L}{3}/u.test(p);
  if (grezzi.some(maiuscola)) grezzi = grezzi.filter((p) => p === p.toUpperCase());
  if (!grezzi.length || grezzi.length > 6) return null;
  const chiavi = grezzi.map((p) => chiave(p).replace(/\s/g, ''));
  if (chiavi.some((c) => !c || STOP.has(c) || c.length > 20)) return null;
  if (chiavi.some((c, i) => c.length === 1 && !(c === 'D' && i < chiavi.length - 1))) return null;
  // lettere vere: almeno l'80% dei caratteri
  const lettere = grezzi.join('').replace(/[^\p{L}]/gu, '').length;
  if (lettere < 0.8 * grezzi.join('').length || lettere < 3) return null;

  // correzioni dal dizionario
  const corretti: string[] = [];
  const token: string[] = [];
  const originali: string[] = [];
  for (let i = 0; i < chiavi.length; i++) {
    let c = chiavi[i];
    let o = grezzi[i];
    const strano = /[^\p{L}'.]/u.test(grezzi[i]) || sospetta(c);
    if (!diz.nomi.has(c) && !diz.cognomi.has(c) && !PREFISSI.has(c)) {
      const k = correggi(c, diz, !strano);
      if (k) {
        corretti.push(`${grezzi[i]} → ${bello(k)}`);
        c = k;
        o = k;
      }
    }
    token.push(c);
    originali.push(o);
  }
  // unisce i prefissi dei cognomi: DI STEFANO, LO PRESTI, D AMICO
  for (let i = token.length - 2; i >= 0; i--) {
    if (PREFISSI.has(token[i]) || token[i] === 'D' || token[i].endsWith("'")) {
      const sep = token[i] === 'D' || token[i].endsWith("'") ? '' : ' ';
      const pre = token[i] === 'D' ? "D'" : token[i];
      const preO = token[i] === 'D' ? "D'" : originali[i];
      token.splice(i, 2, pre + sep + token[i + 1]);
      originali.splice(i, 2, preO + sep + originali[i + 1]);
    }
  }
  const noti = token.filter((t) => diz.nomi.has(t)).length;
  return { token, originali, sesso, sessoForte, coniuge, corretti, noti };
}

/** Divide i token in nome e cognome: "GIUSEPPE RUTA", "RUTA GIUSEPPE", "MARIA CONCETTA DI STEFANO". */
function dividi(n: Nome, diz: Dizionario): { nome: string; cognome: string; certezzaNome: number; certezzaCognome: number } {
  const t = n.token;
  const o = n.originali;
  const isN = (x: string) => diz.nomi.has(x);
  const k = t.length;
  if (k === 1) return isN(t[0]) ? { nome: bello(o[0]), cognome: '', certezzaNome: 1, certezzaCognome: 0 } : { nome: '', cognome: bello(o[0]), certezzaNome: 0, certezzaCognome: 0.75 };
  // sigle corte prima del nome proprio ("FEE GAETANO LICITRA") sono rumore della lettura
  const primo = t.findIndex(isN);
  if (primo > 0 && t.slice(0, primo).every((x) => x.length <= 3 && !PREFISSI.has(x))) {
    return dividi({ ...n, token: t.slice(primo), originali: o.slice(primo) }, diz);
  }
  let testa = 0;
  while (testa < k && isN(t[testa])) testa++;
  let coda = 0;
  while (coda < k && isN(t[k - 1 - coda])) coda++;
  // cognome già censito nel cimitero: certo; altrimenti quasi certo se ha l'aspetto di un cognome italiano
  const cognomeNoto = (s: string) => (diz.cognomi.has(s) ? 1 : s.split(' ').some(sospetta) ? 0.6 : 0.86);
  if (testa > 0 && testa < k) {
    const quanti = Math.min(testa, 3);
    const cognome = t.slice(quanti).join(' ');
    return { nome: bello(o.slice(0, quanti).join(' ')), cognome: bello(o.slice(quanti).join(' ')), certezzaNome: 1, certezzaCognome: cognomeNoto(cognome) };
  }
  if (coda > 0 && coda < k) {
    const cognome = t.slice(0, k - coda).join(' ');
    return { nome: bello(o.slice(k - coda).join(' ')), cognome: bello(o.slice(0, k - coda).join(' ')), certezzaNome: 0.9, certezzaCognome: cognomeNoto(cognome) * 0.95 };
  }
  // tutti nomi propri (MARIO MARINO) o nessuno: si assume NOME COGNOME
  const quanti = testa === k && k >= 3 ? k - 1 : 1;
  return {
    nome: bello(o.slice(0, quanti).join(' ')),
    cognome: bello(o.slice(quanti).join(' ')),
    certezzaNome: testa === k ? 0.85 : 0.6,
    certezzaCognome: testa === k ? 0.8 : cognomeNoto(t.slice(quanti).join(' ')) * 0.75,
  };
}

function sessoDa(nome: string, diz: Dizionario): { s?: Sesso; c: number } {
  const primo = chiave(nome).split(' ')[0];
  if (!primo) return { c: 0 };
  const g = diz.nomi.get(primo);
  if (g === 'M' || g === 'F') return { s: g, c: 0.95 };
  if (primo.endsWith('A')) return { s: 'F', c: 0.6 };
  if (primo.endsWith('O')) return { s: 'M', c: 0.6 };
  return { c: 0 };
}

// ---------------------------------------------------------------------------
// Righe → frammenti → defunti
// ---------------------------------------------------------------------------

interface Frammento {
  testo: string;
  conf: number;
  box: Box;
}

interface Disposizione {
  flussi: Frammento[][];
  comuni: Frammento[];
}

/**
 * Spezza le righe dove c'è un grande vuoto tra le parole. Se il vuoto si ripete, la lapide può essere
 * a due colonne (marito e moglie): restituisce sia la lettura a una colonna sia quella a due,
 * e leggiLapide tiene quella che dà il risultato più coerente.
 */
function frammenti(righe: RigaOcr[]): Disposizione[] {
  const fr: Frammento[] = [];
  const tagli: number[] = [];
  for (const r of righe) {
    const ws = r.parole.filter((w) => w.testo.trim());
    if (!ws.length) {
      if (r.testo.trim()) fr.push({ testo: r.testo.trim(), conf: r.conf, box: r.bbox });
      continue;
    }
    const h = mediana(ws.map((w) => w.bbox.y1 - w.bbox.y0)) || 10;
    const gruppi: ParolaOcr[][] = [[ws[0]]];
    for (let i = 1; i < ws.length; i++) {
      const gap = ws[i].bbox.x0 - ws[i - 1].bbox.x1;
      if (gap > 2.5 * h) {
        tagli.push((ws[i].bbox.x0 + ws[i - 1].bbox.x1) / 2);
        gruppi.push([ws[i]]);
      } else gruppi[gruppi.length - 1].push(ws[i]);
    }
    for (const g of gruppi) fr.push({ testo: g.map((w) => w.testo).join(' '), conf: media(g.map((w) => w.conf)), box: unione(g.map((w) => w.bbox)) });
  }
  const una: Disposizione = { flussi: [fr], comuni: [] };
  if (!tagli.length) return [una];
  // due colonne: ogni frammento va a sinistra o a destra del vuoto, dall'alto in basso
  const x = mediana(tagli);
  const sx: Frammento[] = [];
  const dx: Frammento[] = [];
  const comuni: Frammento[] = [];
  for (const f of fr) (f.box.x1 <= x ? sx : f.box.x0 >= x ? dx : comuni).push(f);
  if (sx.length < 2 || dx.length < 2) return [una];
  const perY = (a: Frammento, b: Frammento) => a.box.y0 - b.box.y0;
  return [una, { flussi: [sx.sort(perY), dx.sort(perY)], comuni: comuni.sort(perY) }];
}

interface Analisi {
  f: Frammento;
  testo: string;
  eventi: Evento[];
  eta?: number;
  famiglia?: string;
  nome: Nome | null;
  soloConiuge?: string;
  sesso?: Sesso;
}

function analizza(f: Frammento, diz: Dizionario): Analisi {
  const testo = f.testo
    .normalize('NFC')
    .replace(/[“”«»"]/g, ' ')
    .replace(/[—–_]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
  const { eventi, resto } = trovaDate(testo);
  const eta = trovaEta(resto);
  const k = chiave(testo);
  const sesso: Sesso | undefined = /\b(NATA|MORTA|DECEDUTA|SPENTA|SPENTASI|DEFUNTA|SALITA|TORNATA|VOLATA)\b/.test(k) ? 'F' : /\b(NATO|MORTO|DECEDUTO|SPENTO|SPENTOSI|DEFUNTO|SALITO|TORNATO|VOLATO)\b/.test(k) ? 'M' : undefined;
  const fam = k.match(/^FAM(?:IGLIA|IGLIE)? (.+)$/);
  if (fam) return { f, testo, eventi, eta, sesso, famiglia: bello(fam[1].split(' E ')[0]), nome: null };
  // "IN RUTA", anche letto attaccato ("INRUTA"), purché non sia un nome come Ines o Innocenza
  const coniuge = testo.match(/^(IN|VED\.?|VEDOVA)\s+([\p{L}' ]{2,30})$/u) ?? (/^(IN|VED\.?)\p{L}{3,}$/u.test(testo) && !diz.nomi.has(k) ? testo.match(/^(IN|VED\.?)(\p{L}{3,})$/u) : null);
  if (coniuge) return { f, testo, eventi, eta, sesso: 'F', nome: null, soloConiuge: `${coniuge[1] === 'IN' ? 'in' : 'ved.'} ${bello(coniuge[2])}` };
  // la parte con il nome è quella prima della prima data o del primo marcatore
  let parte = eventi.length ? testo.slice(0, eventi[0].i) : testo;
  const parole = parte.split(' ').filter(Boolean);
  // "DI" è un marcatore solo in "di anni 71": altrimenti è il prefisso di un cognome (Di Stefano)
  const marc = (p: string, i: number) => MARCATORI.has(p.replace(/[.:,]/g, '')) && (p !== 'DI' || /^ANNI/.test(parole[i + 1] ?? ''));
  const iMarc = parole.findIndex(marc);
  if (iMarc >= 0) parte = parole.slice(0, iMarc).join(' ');
  return { f, testo, eventi, eta, sesso, nome: parte.trim() ? leggiNome(parte, diz) : null };
}

interface Bozza {
  nome: Nome | null;
  eventi: Evento[];
  eta?: number;
  sesso?: Sesso;
  coniuge?: string;
  confNome: number;
  box: Box[];
}

function segmenta(an: Analisi[], epigrafe: string[], fam: { v?: string }): Bozza[] {
  const out: Bozza[] = [];
  let cur: Bozza | null = null;
  let ultimaNome = -9;
  for (let k = 0; k < an.length; k++) {
    const a = an[k];
    if (a.famiglia) {
      fam.v = a.famiglia;
      continue;
    }
    if (a.soloConiuge && cur) {
      cur.coniuge = a.soloConiuge;
      cur.sesso = 'F';
      cur.box.push(a.f.box);
      continue;
    }
    const haDate = a.eventi.length > 0 || a.eta !== undefined;
    let nome = a.nome;
    // senza nomi propri conosciuti la riga vale come nome solo se subito dopo arrivano le date
    // e comunque deve essere stata letta con una certa sicurezza: le venature producono finte parole
    if (nome && nome.noti === 0 && !haDate) {
      const dopo = an.slice(k + 1, k + 3);
      if (a.f.conf < 60 || !dopo.some((x) => x.eventi.length > 0 && !x.nome)) nome = null;
    }
    if (nome) {
      const unisci =
        cur && cur.nome && cur.eventi.length === 0 && ultimaNome === k - 1 && cur.nome.token.length + nome.token.length <= 3;
      if (unisci && cur && cur.nome) {
        cur.nome = {
          ...cur.nome,
          token: [...cur.nome.token, ...nome.token],
          originali: [...cur.nome.originali, ...nome.originali],
          corretti: [...cur.nome.corretti, ...nome.corretti],
          noti: cur.nome.noti + nome.noti,
          coniuge: cur.nome.coniuge ?? nome.coniuge,
          sesso: cur.nome.sesso ?? nome.sesso,
          sessoForte: cur.nome.sessoForte || nome.sessoForte,
        };
        cur.confNome = (cur.confNome + a.f.conf) / 2;
        cur.box.push(a.f.box);
      } else {
        cur = { nome, eventi: [], confNome: a.f.conf, box: [a.f.box] };
        out.push(cur);
      }
      ultimaNome = k;
    } else if (!haDate) {
      if (a.testo.replace(/[^\p{L}\d]/gu, '').length >= 2) epigrafe.push(bello(a.testo));
      continue;
    }
    if (haDate) {
      if (!cur || (!nome && cur.eventi.some((e) => e.tipo === 'morte') && a.eventi.some((e) => e.tipo === 'nascita'))) {
        cur = { nome: null, eventi: [], confNome: 0, box: [] };
        out.push(cur);
      }
      for (const e of a.eventi) cur.eventi.push({ ...e, conf: e.conf * (a.f.conf / 100) });
      if (a.eta !== undefined) cur.eta = a.eta;
      if (!nome) cur.box.push(a.f.box);
    }
    if (a.sesso && cur) cur.sesso = a.sesso;
  }
  return out;
}

function completa(b: Bozza, diz: Dizionario, famiglia: string | undefined): DefuntoLetto {
  const c = b.confNome / 100;
  let nome = '';
  let cognome = '';
  let aNome = 0;
  let aCognome = 0;
  if (b.nome) {
    const d = dividi(b.nome, diz);
    nome = d.nome;
    cognome = d.cognome;
    const pen = b.nome.corretti.length ? 0.85 : 1;
    aNome = c * d.certezzaNome * pen;
    aCognome = c * d.certezzaCognome * pen;
  }
  if (!cognome && famiglia) {
    cognome = famiglia;
    aCognome = 0.6;
  }
  // date
  const piene = b.eventi.filter((e) => e.iso);
  let nascita = piene.find((e) => e.tipo === 'nascita');
  let morte = piene.find((e) => e.tipo === 'morte');
  let fNascita = 1;
  let fMorte = 1;
  const libere = piene.filter((e) => !e.tipo).sort((x, y) => x.iso!.localeCompare(y.iso!));
  if (!nascita && !morte && libere.length >= 2) {
    nascita = libere[0];
    morte = libere[libere.length - 1];
    fNascita = fMorte = 0.92;
  } else {
    for (const e of libere) {
      if (!morte && (!nascita || e.iso! > nascita.iso!)) {
        morte = e;
        fMorte = nascita ? 0.9 : 0.7;
      } else if (!nascita && morte && e.iso! < morte.iso!) {
        nascita = e;
        fNascita = 0.9;
      }
    }
  }
  if (nascita && morte && nascita.iso! > morte.iso!) {
    [nascita, morte] = [morte, nascita];
    fNascita = fMorte = 0.6;
  }
  // solo anni, quando manca la data completa
  const anni = b.eventi.filter((e) => !e.iso);
  let annoNascita = nascita ? undefined : anni.find((e) => e.tipo === 'nascita')?.anno;
  let annoMorte = morte ? undefined : anni.find((e) => e.tipo === 'morte')?.anno;
  const lib = anni.filter((e) => !e.tipo).map((e) => e.anno).sort((x, y) => x - y);
  const serveN = !nascita && annoNascita === undefined;
  const serveM = !morte && annoMorte === undefined;
  if (lib.length) {
    if (serveN && serveM) {
      if (lib.length >= 2) {
        annoNascita = lib[0];
        annoMorte = lib[lib.length - 1];
      } else annoMorte = lib[0]; // un solo anno: di solito è quello della morte
    } else if (serveN) annoNascita = lib[0];
    else if (serveM) annoMorte = lib[lib.length - 1];
  }
  const aN = annoNascita ?? (nascita ? Number(nascita.iso!.slice(0, 4)) : undefined);
  const aM = annoMorte ?? (morte ? Number(morte.iso!.slice(0, 4)) : undefined);
  if (aN !== undefined && aM !== undefined && aN > aM) {
    if (annoNascita !== undefined && annoMorte !== undefined) [annoNascita, annoMorte] = [annoMorte, annoNascita];
    else if (annoNascita !== undefined) annoNascita = undefined;
    else if (annoMorte !== undefined) annoMorte = undefined;
  }
  // sesso
  let sesso: Sesso | undefined;
  let aSesso = 0;
  if (b.sesso) {
    sesso = b.sesso;
    aSesso = 1;
  } else if (b.nome?.sesso) {
    sesso = b.nome.sesso;
    aSesso = b.nome.sessoForte ? 1 : 0.8;
  } else if (nome) {
    const s = sessoDa(nome, diz);
    sesso = s.s;
    aSesso = s.c;
  }
  const eta = b.eta;
  const vecchio = nascita && morte && Number(morte.iso!.slice(0, 4)) - Number(nascita.iso!.slice(0, 4)) > 115;
  return {
    nome,
    cognome,
    sesso,
    dataNascita: nascita?.iso ?? null,
    dataMorte: morte?.iso ?? null,
    annoNascita,
    annoMorte,
    eta,
    coniuge: b.nome?.coniuge ?? b.coniuge,
    aff: {
      nome: nome ? livello(aNome) : 'bassa',
      cognome: cognome ? livello(aCognome) : 'bassa',
      sesso: sesso ? livello(aSesso) : 'bassa',
      dataNascita: nascita ? livello(nascita.conf * fNascita * (vecchio ? 0.5 : 1)) : 'bassa',
      dataMorte: morte ? livello(morte.conf * fMorte * (vecchio ? 0.5 : 1)) : 'bassa',
    },
    corretti: b.nome?.corretti ?? [],
    box: b.box,
  };
}

/** Dal testo riconosciuto ai defunti della lapide. */
export function leggiLapide(righe: RigaOcr[], diz: Dizionario): Lettura {
  let migliore: Lettura | null = null;
  for (const disp of frammenti(righe)) {
    const l = leggiDisposizione(disp, diz);
    if (!migliore || l.punteggio > migliore.punteggio) migliore = l;
  }
  return migliore!;
}

function leggiDisposizione({ flussi, comuni }: Disposizione, diz: Dizionario): Lettura {
  const epigrafe: string[] = [];
  const fam: { v?: string } = {};
  // le righe che attraversano le due colonne: di solito "Famiglia …" o una dedica
  for (const f of comuni) {
    const a = analizza(f, diz);
    if (a.famiglia) fam.v = a.famiglia;
    else if (a.nome && a.nome.token.length === 1 && a.nome.noti === 0) fam.v = bello(a.nome.originali[0]);
    else epigrafe.push(bello(a.testo));
  }
  let bozze: Bozza[] = [];
  for (const fl of flussi) bozze.push(...segmenta(fl.map((f) => analizza(f, diz)), epigrafe, fam));
  // un "nome" senza nomi propri conosciuti e senza date, accanto a defunti veri, è una lettura sbagliata
  // lo stesso vale per una parola sola ("PIER") letta nel rumore
  if (bozze.some((b) => b.eventi.length))
    bozze = bozze.filter((b) => b.eventi.length || b.eta !== undefined || ((b.nome?.noti ?? 0) > 0 && (b.nome?.token.length ?? 0) >= 2 && b.confNome >= 50));
  const visti = new Set<string>();
  const defunti = bozze
    .map((b) => completa(b, diz, fam.v))
    .filter((d) => d.nome || d.cognome || d.dataMorte || d.dataNascita || d.annoMorte)
    .filter((d) => {
      const k = `${chiave(d.nome)}|${chiave(d.cognome)}|${d.dataNascita}|${d.dataMorte}`;
      if (visti.has(k)) return false;
      visti.add(k);
      return true;
    });
  const punti = (v: Affidabilita) => (v === 'alta' ? 1 : v === 'media' ? 0.6 : 0.2);
  const punteggio = defunti.reduce(
    (t, d) =>
      t +
      (d.nome ? 2 * punti(d.aff.nome) : 0) +
      (d.cognome ? 2 * punti(d.aff.cognome) : 0) +
      (d.dataNascita ? 2 * punti(d.aff.dataNascita) : d.annoNascita ? 0.8 : 0) +
      (d.dataMorte ? 2 * punti(d.aff.dataMorte) : d.annoMorte ? 0.8 : 0) +
      // coerenza: un nome con le sue date vale di più; date senza nome sono un segno di lettura sbagliata
      (!(d.nome || d.cognome) ? -2 : d.dataNascita || d.dataMorte || d.annoNascita || d.annoMorte ? 1 : 0),
    0,
  );
  return { defunti, famiglia: fam.v, epigrafe, punteggio };
}

/** Note per la scheda con quello che la lapide dice ma i campi non contengono (solo anni, età, "in …"). */
export function noteDaLettura(defunti: DefuntoLetto[]): string[] {
  const note: string[] = [];
  for (const d of defunti) {
    const chi = [d.nome, d.cognome].filter(Boolean).join(' ') || 'Defunto senza nome leggibile';
    const pezzi: string[] = [];
    if (d.coniuge) pezzi.push(d.coniuge);
    if (!d.dataNascita && d.annoNascita) pezzi.push(`nato/a nel ${d.annoNascita}`);
    if (!d.dataMorte && d.annoMorte) pezzi.push(`morto/a nel ${d.annoMorte}`);
    if (d.eta !== undefined) pezzi.push(`di anni ${d.eta}`);
    if (pezzi.length) note.push(`Dalla lapide: ${chi}, ${pezzi.join(', ')}.`);
  }
  return note;
}
