import {
  BarChart3, ClipboardList, Download, LayoutDashboard, Map as MapIcon, Search, Settings, UserRound, Wrench,
} from 'lucide-react';
import { setUi, useStore } from '../data/store';
import { useDatiCimitero } from '../data/selectors';
import { href, useRotta } from '../router';
import { Logo } from './Logo';

const VOCI = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/mappa', label: 'Mappa', icon: MapIcon },
  { path: '/censimento', label: 'Censimento', icon: ClipboardList },
  { path: '/ricerca', label: 'Ricerca', icon: Search },
  { path: '/anagrafe', label: 'Anagrafe', icon: UserRound },
  { path: '/manutenzioni', label: 'Manutenzioni', icon: Wrench },
  { path: '/report', label: 'Report', icon: BarChart3 },
  { path: '/esportazioni', label: 'Esportazioni', icon: Download },
];

export function Sidebar() {
  const rotta = useRotta();
  const aperta = useStore((s) => s.ui.menuMobile);
  const { manutenzioni } = useDatiCimitero();
  const aperte = manutenzioni.filter((m) => m.stato === 'aperta').length;
  const attivo = (p: string) => (p === '/' ? rotta.path === '/' : rotta.path.startsWith(p));
  const chiudi = () => setUi({ menuMobile: false });

  return (
    <>
      <div className={`sidebar-backdrop ${aperta ? 'is-open' : ''}`} onClick={chiudi} />
      <aside className={`sidebar ${aperta ? 'is-open' : ''}`} aria-label="Menu principale">
        <a className="sidebar__brand" href={href('/')} onClick={chiudi}>
          <Logo dark size={40} />
        </a>
        <nav className="sidebar__nav">
          {VOCI.map((v) => (
            <a key={v.path} href={href(v.path)} className={`nav-item ${attivo(v.path) ? 'is-active' : ''}`} onClick={chiudi} title={v.label}>
              <v.icon size={20} />
              <span>{v.label}</span>
              {v.path === '/manutenzioni' && aperte > 0 && <b className="nav-item__badge nav-item__badge--danger">{aperte}</b>}
            </a>
          ))}
          <div className="nav-sep">Configurazione</div>
          <a href={href('/impostazioni')} className={`nav-item ${attivo('/impostazioni') ? 'is-active' : ''}`} onClick={chiudi} title="Impostazioni">
            <Settings size={20} />
            <span>Impostazioni</span>
          </a>
        </nav>
      </aside>
    </>
  );
}
