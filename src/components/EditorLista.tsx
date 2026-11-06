import { useEffect, useState } from 'react';
import { Archive, ArchiveRestore, ArrowDown, ArrowUp, Plus, Save, Trash2, Undo2 } from 'lucide-react';
import { slug } from '../lib/format';
import { Field, Icona, ICONE, Modal } from './ui';

export interface Voce {
  id: string;
  label: string;
  colore?: string;
  descrizione?: string;
  icona?: string;
  archiviato?: boolean;
}

const TAVOLOZZA = ['#3F9A3C', '#79AA4F', '#E9BE1F', '#E07B22', '#D9473F', '#C0487A', '#8E5BB5', '#4F5FB8', '#2F6FB3', '#1E8C8C', '#8A6D3B', '#2F363D', '#9AA6B2', '#FFFFFF'];

export function SceltaColore({ valore, onChange }: { valore?: string; onChange: (c: string) => void }) {
  const [aperto, setAperto] = useState(false);
  return (
    <span style={{ position: 'relative' }}>
      <button type="button" className={`swatch ${valore?.toUpperCase() === '#FFFFFF' ? 'swatch--white' : ''}`} style={{ background: valore ?? '#9AA6B2' }} onClick={() => setAperto(!aperto)} aria-label="Scegli colore" />
      {aperto && (
        <span className="popover tavolozza" onMouseLeave={() => setAperto(false)}>
          {TAVOLOZZA.map((c) => (
            <button key={c} type="button" className={`swatch ${c === '#FFFFFF' ? 'swatch--white' : ''} ${c === valore ? 'is-on' : ''}`} style={{ background: c }} onClick={() => { onChange(c); setAperto(false); }} aria-label={c} />
          ))}
          <label className="swatch swatch--custom" title="Colore personalizzato">
            <input type="color" value={valore ?? '#9AA6B2'} onChange={(e) => onChange(e.target.value.toUpperCase())} />
          </label>
        </span>
      )}
    </span>
  );
}

/**
 * Editor generico di elenchi (opzioni dei menu a tendina, stati, tipologie, categorie...).
 * Le voci in uso non si cancellano alla cieca: si archiviano o si sostituiscono nei dati.
 */
export function EditorLista({
  voci, onSalva, usi, onElimina, conColore = true, conDescrizione = false, conIcona = false, nomeVoce = 'voce', minimo = 1, compatto,
}: {
  voci: Voce[];
  onSalva: (voci: Voce[], descrizione: string) => void;
  usi?: (id: string) => number;
  onElimina?: (id: string, sostituto: string | null) => void;
  conColore?: boolean;
  conDescrizione?: boolean;
  conIcona?: boolean;
  nomeVoce?: string;
  minimo?: number;
  compatto?: boolean;
}) {
  const [bozza, setBozza] = useState<Voce[]>(voci);
  const [elimina, setElimina] = useState<Voce | null>(null);
  const [sostituto, setSostituto] = useState<string>('');
  useEffect(() => setBozza(voci), [voci]);
  const modificato = JSON.stringify(bozza) !== JSON.stringify(voci);
  const set = (i: number, p: Partial<Voce>) => setBozza(bozza.map((v, j) => (j === i ? { ...v, ...p } : v)));
  const sposta = (i: number, d: number) => {
    const n = [...bozza];
    const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    setBozza(n);
  };
  const aggiungi = () => {
    const base = `nuova ${nomeVoce}`;
    let id = slug(base);
    let k = 2;
    while (bozza.some((v) => v.id === id)) id = `${slug(base)}_${k++}`;
    setBozza([...bozza, { id, label: `Nuova ${nomeVoce}`, colore: conColore ? TAVOLOZZA[bozza.length % 12] : undefined, icona: conIcona ? 'box' : undefined }]);
  };
  const salva = () => {
    const vuote = bozza.filter((v) => !v.label.trim());
    if (vuote.length) return;
    const aggiunte = bozza.filter((v) => !voci.some((x) => x.id === v.id)).map((v) => v.label);
    const rinominate = bozza.filter((v) => voci.some((x) => x.id === v.id && x.label !== v.label)).map((v) => `${voci.find((x) => x.id === v.id)!.label} → ${v.label}`);
    const parti = [aggiunte.length ? `aggiunte: ${aggiunte.join(', ')}` : '', rinominate.length ? `rinominate: ${rinominate.join(', ')}` : ''].filter(Boolean);
    onSalva(bozza, parti.join(' · ') || 'ordine, colori o descrizioni aggiornati');
  };

  return (
    <div className="lista-ed">
      {bozza.map((v, i) => {
        const n = usi ? usi(v.id) : 0;
        return (
          <div key={v.id} className={`lista-ed__row ${v.archiviato ? 'is-arch' : ''}`}>
            <div className="lista-ed__ord">
              <button type="button" className="btn btn--xs btn--icon btn--ghost" onClick={() => sposta(i, -1)} disabled={i === 0} aria-label="Su"><ArrowUp size={13} /></button>
              <button type="button" className="btn btn--xs btn--icon btn--ghost" onClick={() => sposta(i, 1)} disabled={i === bozza.length - 1} aria-label="Giù"><ArrowDown size={13} /></button>
            </div>
            {conColore && <SceltaColore valore={v.colore} onChange={(c) => set(i, { colore: c })} />}
            {conIcona && (
              <select className="select select--sm" style={{ width: 58, paddingRight: 20 }} value={v.icona} onChange={(e) => set(i, { icona: e.target.value })} aria-label="Icona">
                {Object.keys(ICONE).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            )}
            {conIcona && <Icona nome={v.icona} size={16} color={v.colore} />}
            <input className={`input ${compatto ? 'input--sm' : ''}`} value={v.label} onChange={(e) => set(i, { label: e.target.value })} aria-label={`Nome ${nomeVoce}`} style={{ flex: 2 }} />
            {conDescrizione && <input className={`input ${compatto ? 'input--sm' : ''}`} value={v.descrizione ?? ''} placeholder="Descrizione" onChange={(e) => set(i, { descrizione: e.target.value })} style={{ flex: 3 }} />}
            {usi && <span className="lista-ed__usi" title="Schede che usano questa voce">{n}</span>}
            <button type="button" className="btn btn--xs btn--icon btn--ghost" title={v.archiviato ? 'Ripristina' : 'Archivia: non si potrà più scegliere, i dati restano'} onClick={() => set(i, { archiviato: !v.archiviato })}>
              {v.archiviato ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            </button>
            <button
              type="button"
              className="btn btn--xs btn--icon btn--ghost btn--danger"
              title="Elimina"
              disabled={bozza.length <= minimo}
              onClick={() => {
                const giaSalvata = voci.some((x) => x.id === v.id);
                if (!giaSalvata || !n) {
                  const nuova = bozza.filter((x) => x.id !== v.id);
                  setBozza(nuova);
                  if (giaSalvata) onSalva(nuova, `eliminata: ${v.label}`);
                  return;
                }
                setSostituto(bozza.find((x) => x.id !== v.id && !x.archiviato)?.id ?? '');
                setElimina(v);
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      })}
      <div className="row row--between mt-8 row--wrap gap-8">
        <button type="button" className="btn btn--sm" onClick={aggiungi}><Plus size={14} />Aggiungi {nomeVoce}</button>
        {modificato && (
          <div className="row gap-4">
            <button type="button" className="btn btn--sm btn--ghost" onClick={() => setBozza(voci)}><Undo2 size={14} />Annulla</button>
            <button type="button" className="btn btn--sm btn--primary" onClick={salva} disabled={bozza.some((v) => !v.label.trim())}><Save size={14} />Salva</button>
          </div>
        )}
      </div>
      {elimina && (
        <Modal
          titolo={`Eliminare “${elimina.label}”?`}
          sottotitolo={`${usi?.(elimina.id) ?? 0} schede usano questa ${nomeVoce}. Scegli cosa assegnare al suo posto.`}
          onClose={() => setElimina(null)}
          footer={
            <>
              <button className="btn" onClick={() => setElimina(null)}>Annulla</button>
              <button className="btn btn--danger" onClick={() => { onElimina?.(elimina.id, sostituto || null); const nuova = bozza.filter((x) => x.id !== elimina.id); setBozza(nuova); onSalva(nuova, `eliminata: ${elimina.label}`); setElimina(null); }}>Sostituisci ed elimina</button>
            </>
          }
        >
          <Field label="Sostituisci con">
            <select className="select" value={sostituto} onChange={(e) => setSostituto(e.target.value)}>
              {onElimina && minimo === 0 && <option value="">Lascia vuoto</option>}
              {bozza.filter((x) => x.id !== elimina.id).map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
            </select>
          </Field>
          <p className="small muted mt-12">In alternativa puoi archiviarla: non comparirà più tra le scelte, ma le schede esistenti la conservano.</p>
        </Modal>
      )}
    </div>
  );
}
