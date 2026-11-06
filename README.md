# SALM-APP · powered by REST IN GPS

Web app per la mappatura e la gestione digitale del patrimonio cimiteriale.
Demo sul **Cimitero di Ragusa Centro**, con dati fittizi.

## Avvio

```bash
npm install
npm run dev        # http://localhost:5180
npm run build      # build statica in dist/ (funziona da qualsiasi cartella del server)
```

## Cosa c'è

- **Dashboard**: mappa dall'alto e i widget del PDF (schede censite, ricerca, anagrafiche, report, gestione censimento, manutenzione, alert).
- **Mappa**: due viste (satellite Esri e planimetria vettoriale), nessuna chiave API. Filtri multipli collegati ai pin, colore per stato o per tipologia, legenda cliccabile, card del pin, vista estesa e link a Google Maps.
- **Griglia a parete**: i loculi di colombari e cappelle familiari, parete per parete, con ricerca per nome e scheda del posto selezionato.
- **Censimento**: avanzamento, quadranti da disegnare sulla mappa, operatori, verifiche assegnate, colombari e cappelle.
- **Nuovo rilievo**: il flusso REST IN GPS. Foto, GPS con segnaposto "stile app di consegna", classificazione, anagrafica, flag, ID automatico `CIM-RAG-000001` e QR.
- **Lettura della lapide**: dalla foto del rilievo SALM-APP legge nomi, cognomi, date di nascita e di morte e compila l'anagrafica. Funziona anche con le lapidi doppie, le date in lettere o in numeri romani, i simboli `*` e `†`, "in …" e "ved. …". Evidenzia i dati incerti, avvisa se il defunto risulta già censito, permette di selezionare solo la scritta o ruotare la foto. Si usa anche dalla modifica di una scheda esistente ("Leggi dalla foto"). Il riconoscimento gira sul dispositivo (Tesseract.js, modello italiano in `public/ocr`): nessuna chiave API, e dopo il primo uso funziona anche senza connessione.
- **Manutenzioni**: elenco, calendario e mappa. Da qui si creano alert e si chiude un intervento con la foto aggiornata.
- **Report**: scadenze delle concessioni (6 mesi), postazioni libere, lampade votive con l'Excel per fatturare, pagamenti (regolare/moroso), statistiche.
- **Esportazioni**: Excel dei filtri o dei totali con colonne a scelta, PDF multipli delle schede, etichette QR.
- **Impostazioni → Scheda Pro**: aggiungi o rinomina flag, menu a tendina e voci senza toccare il codice, con anteprima telefono e registro modifiche. Stessa cosa per stati, tipologie ed elenchi.

## Dati

- `scripts/genera-dati-demo.py` rigenera `public/demo/salmup-demo.json`. I perimetri vengono da OpenStreetMap (ODbL), le posizioni sono tracciate sull'ortofoto. Nominativi, date e stati sono **inventati**.
- I dati restano nel browser (IndexedDB). Da *Impostazioni → Cimitero e dati* si scarica un backup o si ripristina la demo.
- Per andare in produzione si sostituisce `src/data/persist.ts` con le chiamate a un backend.
- I file del riconoscimento (`public/ocr`) si copiano da soli dopo `npm install`; a mano: `npm run copia-ocr`. Le regole che dal testo ricavano i defunti sono in `src/lib/lapide.ts` e si provano con `node scripts/prova-lapide.ts`.
