import { useMemo } from 'react';
import { ArrowRight, CalendarDays, ClipboardCheck, ClipboardList, MapPinPlus, Maximize2, Search, Wrench } from 'lucide-react';
import { Calendario } from '../components/Calendario';
import { CemeteryMap } from '../components/map/CemeteryMap';
import { SceltaStileMappa } from '../components/Topbar';
import { Avatar, Ciambella, Dot, StatoBadge } from '../components/ui';
import { apriModale, resetFiltri, seleziona, setFiltri, useStore } from '../data/store';
import { conta, descrizioneScheda, useCimitero, useDatiCimitero, useSchedeCimitero } from '../data/selectors';
import { COLORI_OPERAZIONE, NOMI_OPERAZIONE } from '../data/pratiche';
import { aggiungiGiorni, dataOra, nomeCompleto, numero, oggiISO, percentuale } from '../lib/format';
import { useTelefono } from '../lib/schermo';
import { href, vai } from '../router';

function Widget({ titolo, icona, link, linkLabel = 'Apri', children, className, colore = '#1B5A8F' }: {
  titolo: string; icona: React.ReactNode; link?: string; linkLabel?: string; children: React.ReactNode; className?: string; colore?: string;
}) {
  return (
    <section className={`card widget ${className ?? ''}`}>
      <div className="widget__head">
        <h3><span className="widget__ico" style={{ background: `${colore}14`, color: colore }}>{icona}</span>{titolo}</h3>
        {link && <a className="widget__link" href={href(link)}>{linkLabel}<ArrowRight size={14} /></a>}
      </div>
      <div className="widget__body">{children}</div>
    </section>
  );
}

export function Dashboard() {
  const cimitero = useCimitero();
  const schede = useSchedeCimitero();
  const config = useStore((s) => s.config);
  const db = useStore((s) => s.db);
  const stileMappa = useStore((s) => s.ui.stileMappa);
  // sul telefono la Dashboard è la stessa del computer, in colonna: mappa piccola in alto, poi i riquadri
  const telefono = useTelefono();
  const { quadranti, strutture, viali, aree, manutenzioni } = useDatiCimitero();
  const domani = aggiungiGiorni(oggiISO(), 1);
  const agenda = useMemo(() => db.pratiche.filter((p) => p.stato === 'programmata' && p.dataOra && p.cimiteroId === cimitero?.id && (p.dataOra.startsWith(oggiISO()) || p.dataOra.startsWith(domani))).sort((a, b) => a.dataOra!.localeCompare(b.dataOra!)), [db.pratiche, cimitero?.id, domani]);
  const oggi = oggiISO();

  const stimate = quadranti.reduce((t, x) => t + x.stimaManufatti, 0);
  const perStato = useMemo(() => conta(schede, (s) => s.stato), [schede]);
  const defunti = useMemo(() => schede.reduce((t, s) => t + s.defunti.length, 0), [schede]);
  const recenti = useMemo(() => [...schede].sort((a, b) => b.rilevatoIl.localeCompare(a.rilevatoIl)).slice(0, 5), [schede]);
  const settimana = useMemo(() => schede.filter((s) => s.rilevatoIl.slice(0, 10) >= aggiungiGiorni(oggi, -7)).length, [schede, oggi]);
  const urgenti = manutenzioni.filter((m) => m.stato !== 'risolta' && m.stato !== 'annullata' && m.priorita === 'urgente').length;

  if (!cimitero) return null;
  const tutte = telefono ? '&tutte=1' : '';
  const vaiMappa = (patch: Parameters<typeof setFiltri>[0]) => {
    resetFiltri();
    setFiltri(patch);
    vai('/mappa');
  };

  return (
    <div className={`page page--home ${telefono ? 'page--home-tel' : ''}`}>
      {/* senza intestazione: "Nuovo rilievo" sta nella barra in alto, come nel frame Figma */}
      <h1 className="sr-only">Dashboard · {cimitero.nome}</h1>
      <div className="bento">
        <section className="card bento__map">
          <CemeteryMap
            cimitero={cimitero}
            schede={schede}
            strutture={strutture}
            viali={viali}
            aree={aree}
            stile={stileMappa}
            compatta
            ferma={telefono}
            etichetteViali={false}
            segueVolo={false}
            onSelect={(id) => {
              seleziona(id, { pannello: false });
              vai('/mappa');
            }}
          />
          <div className="bento__map-top">
            <div className="bento__map-seg"><SceltaStileMappa /></div>
            <a className="btn btn--sm" href={href('/mappa')}><Maximize2 size={14} />{telefono ? 'Schermo intero' : 'Apri la mappa'}</a>
          </div>
          <div className="bento__map-legend">
            {config.stati.filter((s) => !s.archiviato).map((s) => (
              <button key={s.id} className="legend__item" onClick={() => vaiMappa({ stati: [s.id] })} title="Vedi sulla mappa">
                <Dot colore={s.colore} />
                {s.label}
                <b className="mono">{numero(perStato[s.id] ?? 0)}</b>
              </button>
            ))}
          </div>
        </section>

        {telefono && (
          <div className="bento__azioni azioni-grid">
            <button className="azione azione--verde" onClick={() => vai('/rilievo')}><MapPinPlus size={18} />Nuovo rilievo</button>
            <button className="azione" onClick={() => vai('/ricerca')}><Search size={18} />Ricerca</button>
            <button className="azione" onClick={() => apriModale({ tipo: 'manutenzione' })}><Wrench size={18} />Segnala</button>
            <button className="azione" onClick={() => vai('/censimento?tab=verifiche')}><ClipboardCheck size={18} />Verifiche</button>
          </div>
        )}

        <Widget titolo="Agenda di oggi" icona={<CalendarDays size={16} />} colore="#2F6FB3" link={telefono ? undefined : '/operazioni?tab=agenda'} linkLabel="Apri l'agenda" className="bento__alert">
          <div className="alert-list">
            {agenda.length === 0 && <p className="small muted">Nessuna operazione oggi e domani.</p>}
            {(telefono ? agenda.slice(0, 5) : agenda).map((p) => (
              <a key={p.id} className="alert-item" href={href(telefono ? `/scheda/${p.schedaId}` : `/operazioni?id=${p.id}`)}>
                <span className="alert-dot" style={{ background: COLORI_OPERAZIONE[p.tipo] }} />
                <span className="grow">
                  <b>{p.dataOra!.slice(11, 16)} · {NOMI_OPERAZIONE[p.tipo]} · {nomeCompleto(p.defunto)}</b>
                  <span className="small muted">{p.schedaId} · {(p.operatoriIds ?? []).map((id) => db.operatori.find((o) => o.id === id)?.nome).filter(Boolean).join(', ')}</span>
                </span>
                <span className="tiny faint nowrap">{p.dataOra!.startsWith(oggi) ? 'oggi' : 'domani'}</span>
              </a>
            ))}
            {telefono && agenda.length > 5 && <p className="small muted">E altre {agenda.length - 5}: le trovi nel calendario qui sotto.</p>}
          </div>
        </Widget>

        {/* il calendario grande, sotto tutta la mappa: tutto ciò che è in programma */}
        <div className="bento__cal"><Calendario /></div>

        <Widget titolo="Censimento" icona={<ClipboardList size={16} />} link={telefono ? '/censimento?tab=verifiche' : '/censimento'} linkLabel={telefono ? 'Verifiche' : 'Apri'} className="bento__censite">
          <div className="row gap-16">
            <Ciambella
              size={112}
              spessore={13}
              dati={[{ id: 'c', label: 'Censite', valore: schede.length, colore: '#79AA4F' }, { id: 'r', label: 'Da censire', valore: Math.max(0, stimate - schede.length), colore: '#E2E7EE' }]}
              centro={<div className="display" style={{ fontSize: 21, fontWeight: 800 }}>{stimate ? percentuale(schede.length, stimate) : 0}%</div>}
              sotto={<div className="tiny muted">censito</div>}
            />
            <div className="col gap-4 grow">
              <div className="kpi__value">{numero(schede.length)}<small>/ {numero(stimate)} schede</small></div>
              <div className="small muted">+{numero(settimana)} negli ultimi 7 giorni</div>
              <div className="small muted">{numero(defunti)} defunti registrati</div>
            </div>
          </div>
        </Widget>

        <Widget titolo="Manutenzione" icona={<Wrench size={16} />} link="/manutenzioni" colore="#E07B22" className="bento__manut">
          <div className="mini-kpis">
            <a href={href(`/manutenzioni?stato=aperta${tutte}`)}><b>{manutenzioni.filter((m) => m.stato === 'aperta').length}</b><span>aperte</span></a>
            <a href={href(`/manutenzioni?stato=programmata${tutte}`)}><b>{manutenzioni.filter((m) => m.stato === 'programmata').length}</b><span>programmate</span></a>
            <a href={href(`/manutenzioni?stato=risolta${tutte}`)}><b>{manutenzioni.filter((m) => m.stato === 'risolta').length}</b><span>risolte</span></a>
            <a href={href(telefono ? '/manutenzioni?tutte=1' : '/manutenzioni')} className="is-danger"><b>{urgenti}</b><span>urgenti</span></a>
          </div>
        </Widget>

        <Widget titolo="Attività recente" icona={<ClipboardList size={16} />} colore="#79AA4F" className="bento__attivita">
          <div className="list">
            {recenti.map((s) => {
              const op = db.operatori.find((o) => o.id === s.rilevatoDa);
              return (
                <button key={s.id} className="list-item" style={{ padding: '7px 2px' }} onClick={() => seleziona(s.id)}>
                  {op ? <Avatar nome={op.nome} colore={op.colore} size="sm" /> : <Avatar nome="Ufficio" size="sm" />}
                  <span className="grow" style={{ minWidth: 0 }}>
                    <b className="ellipsis" style={{ display: 'block' }}>{descrizioneScheda(s)}</b>
                    <span className="tiny muted">{op?.nome ?? 'Ufficio'} · {dataOra(s.rilevatoIl)}</span>
                  </span>
                  <StatoBadge stato={s.stato} small />
                </button>
              );
            })}
          </div>
        </Widget>
      </div>
    </div>
  );
}
