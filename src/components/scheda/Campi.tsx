import { Check } from 'lucide-react';
import type { CampoDef, ValoreCampo } from '../../data/types';
import { Dot, Icona } from '../ui';

/** Input generato dalla definizione del campo: aggiungere un campo in Impostazioni lo fa comparire qui. */
export function InputCampo({ campo, valore, onChange, compatto }: { campo: CampoDef; valore: ValoreCampo; onChange: (v: ValoreCampo) => void; compatto?: boolean }) {
  const opzioni = (campo.opzioni ?? []).filter((o) => !o.archiviata || o.id === valore || (Array.isArray(valore) && valore.includes(o.id)));
  switch (campo.tipo) {
    case 'flag':
      return (
        <button type="button" className={`chip ${compatto ? 'chip--sm' : ''} ${valore === true ? 'is-on' : ''}`} onClick={() => onChange(!(valore === true))} aria-pressed={valore === true}>
          <span className="chip__box">{valore === true && <Check size={11} strokeWidth={3.5} />}</span>
          {campo.icona && <Icona nome={campo.icona} size={14} />}
          {campo.label}
        </button>
      );
    case 'select':
      return (
        <select className={`select ${compatto ? 'select--sm' : ''}`} value={String(valore ?? '')} onChange={(e) => onChange(e.target.value || null)}>
          <option value="">—</option>
          {opzioni.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
              {o.archiviata ? ' (archiviata)' : ''}
            </option>
          ))}
        </select>
      );
    case 'multiselect': {
      const sel = Array.isArray(valore) ? valore : [];
      return (
        <div className="row row--wrap gap-4">
          {opzioni.map((o) => {
            const on = sel.includes(o.id);
            return (
              <button key={o.id} type="button" className={`chip chip--sm ${on ? 'is-on' : ''}`} onClick={() => onChange(on ? sel.filter((x) => x !== o.id) : [...sel, o.id])}>
                {o.colore && <Dot colore={o.colore} />}
                {o.label}
              </button>
            );
          })}
          {!opzioni.length && <span className="small muted">Nessuna opzione configurata</span>}
        </div>
      );
    }
    case 'testo_lungo':
      return <textarea className="textarea" value={String(valore ?? '')} onChange={(e) => onChange(e.target.value)} rows={3} />;
    case 'numero':
    case 'importo':
      return (
        <div className="input-suffix">
          <input
            className={`input ${compatto ? 'input--sm' : ''}`}
            type="number"
            step={campo.tipo === 'importo' ? '0.01' : 'any'}
            value={typeof valore === 'number' ? valore : ''}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          />
          {(campo.unita || campo.tipo === 'importo') && <span>{campo.unita ?? '€'}</span>}
        </div>
      );
    case 'data':
      return <input className={`input ${compatto ? 'input--sm' : ''}`} type="date" value={String(valore ?? '')} onChange={(e) => onChange(e.target.value || null)} />;
    default:
      return <input className={`input ${compatto ? 'input--sm' : ''}`} value={String(valore ?? '')} onChange={(e) => onChange(e.target.value)} />;
  }
}

/** Visualizzazione di un valore select con il suo colore. */
export function ValoreOpzione({ campo, valore }: { campo: CampoDef; valore: ValoreCampo }) {
  const o = campo.opzioni?.find((x) => x.id === valore);
  if (!o) return <>—</>;
  return (
    <span className="row gap-4" style={{ display: 'inline-flex' }}>
      {o.colore && <Dot colore={o.colore} />}
      {o.label}
    </span>
  );
}
