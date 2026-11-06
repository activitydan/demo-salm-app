import { useEffect, useMemo, useRef, useState } from 'react';
import type L from 'leaflet';
import { LocateFixed, Maximize } from 'lucide-react';
import { useStore } from '../../data/store';
import { schedeDelCimitero } from '../../data/selectors';
import type { Cimitero, LatLng } from '../../data/types';
import { distanzaM, formatCoord, puntoNelPoligono } from '../../lib/geo';
import { CemeteryMap, ZoomControls } from './CemeteryMap';

/**
 * Selettore di posizione "stile app di consegna": la mappa scorre sotto un segnaposto fisso
 * al centro, e il punto confermato è il centro della mappa.
 */
export function LocationPicker({
  cimitero, valore, onChange, altezza = 380, mostraGps = true,
}: {
  cimitero: Cimitero;
  valore: LatLng;
  onChange: (p: LatLng) => void;
  altezza?: number;
  mostraGps?: boolean;
}) {
  const tutte = useStore((s) => s.db.schede);
  const strutture = useStore((s) => s.db.strutture);
  const [mappa, setMappa] = useState<L.Map | null>(null);
  const [trascina, setTrascina] = useState(false);
  const [precisione, setPrecisione] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const iniziale = useRef(valore);
  const cb = useRef(onChange);
  cb.current = onChange;

  const vicine = useMemo(() => {
    const c = iniziale.current;
    return schedeDelCimitero(tutte, cimitero.id).filter((s) => !s.posizione && distanzaM(c, [s.lat, s.lng]) < 90);
  }, [tutte, cimitero.id]);
  const str = useMemo(() => strutture.filter((s) => s.cimiteroId === cimitero.id), [strutture, cimitero.id]);

  useEffect(() => {
    if (!mappa) return;
    mappa.setView(iniziale.current, 20.5, { animate: false });
    const start = () => setTrascina(true);
    const end = () => {
      setTrascina(false);
      const c = mappa.getCenter();
      cb.current([c.lat, c.lng]);
    };
    mappa.on('movestart', start);
    mappa.on('moveend', end);
    return () => {
      mappa.off('movestart', start);
      mappa.off('moveend', end);
    };
  }, [mappa]);

  const usaGps = () => {
    if (!navigator.geolocation) {
      setMsg('Geolocalizzazione non disponibile su questo dispositivo');
      return;
    }
    setMsg('Ricerca del segnale GPS…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: LatLng = [pos.coords.latitude, pos.coords.longitude];
        setPrecisione(Math.round(pos.coords.accuracy));
        if (!puntoNelPoligono(p, cimitero.perimetro) && distanzaM(p, cimitero.centro) > 400) {
          setMsg(`Sei a ${(distanzaM(p, cimitero.centro) / 1000).toFixed(1)} km dal cimitero: resto sul punto attuale.`);
          return;
        }
        setMsg(null);
        mappa?.setView(p, 20.5);
      },
      () => setMsg('Permesso di localizzazione negato o segnale assente'),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  return (
    <div className="picker" style={{ height: altezza }}>
      <CemeteryMap
        cimitero={cimitero}
        schede={vicine}
        strutture={str}
        stile="satellite"
        compatta
        etichetteViali={false}
        segueVolo={false}
        onReady={setMappa}
      >
        <ZoomControls onLocate={() => mappa?.fitBounds(cimitero.perimetro as L.LatLngBoundsExpression, { padding: [20, 20] })} />
      </CemeteryMap>
      <div className={`picker__pin ${trascina ? 'is-moving' : ''}`} aria-hidden>
        <svg width="40" height="52" viewBox="0 0 40 52"><path d="M20 51C20 51 38 30 38 19A18 18 0 1 0 2 19C2 30 20 51 20 51Z" fill="#1B5A8F" stroke="#fff" strokeWidth="3" /><circle cx="20" cy="19" r="7" fill="#fff" /></svg>
        <span className="picker__shadow" />
      </div>
      <div className="picker__bar">
        <span className="mono small">{formatCoord(valore[0], valore[1])}{precisione !== null && <span className="muted"> · ±{precisione} m</span>}</span>
        <div className="row gap-4">
          {mostraGps && (
            <button type="button" className="btn btn--sm" onClick={usaGps}><LocateFixed size={14} />La mia posizione</button>
          )}
          <button type="button" className="btn btn--sm btn--icon" title="Torna al punto iniziale" onClick={() => mappa?.setView(iniziale.current, 20.5)}><Maximize size={14} /></button>
        </div>
      </div>
      {msg && <div className="picker__msg">{msg}</div>}
      <div className="picker__hint">Trascina la mappa: il punto è sotto il segnaposto</div>
    </div>
  );
}
