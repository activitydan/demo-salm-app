import { useEffect, useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { aggiornaScheda, aggiungiFoto, toast, useStore } from '../../data/store';
import type { Scheda } from '../../data/types';
import { comprimiFoto, fotoUrl } from '../../lib/photo';
import { qrDataUrl, urlScheda } from '../../lib/qr';

export function QrImmagine({ id, size = 140, pubblica = true }: { id: string; size?: number; pubblica?: boolean }) {
  const [src, setSrc] = useState<string>('');
  useEffect(() => {
    let vivo = true;
    qrDataUrl(urlScheda(id, pubblica), Math.max(240, size * 2)).then((u) => vivo && setSrc(u));
    return () => {
      vivo = false;
    };
  }, [id, size, pubblica]);
  return src ? <img src={src} width={size} height={size} alt={`QR code della scheda ${id}`} style={{ imageRendering: 'pixelated' }} /> : <div style={{ width: size, height: size }} className="skeleton" />;
}

/** Input file che apre la fotocamera posteriore sul telefono. */
export function ScegliFoto({ onFoto, children, className, lato }: { onFoto: (dataUrl: string) => void; children: React.ReactNode; className?: string; lato?: number }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" className={className ?? 'btn btn--sm'} onClick={() => ref.current?.click()}>
        {children}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          try {
            onFoto(await comprimiFoto(f, lato));
          } catch {
            toast('Immagine non leggibile', 'errore');
          }
        }}
      />
    </>
  );
}

export function FotoScheda({ s, modificabile = true }: { s: Scheda; modificabile?: boolean }) {
  const foto = useStore((st) => st.foto);
  const vera = !!(s.fotoId && foto[s.fotoId]);
  return (
    <div className="foto">
      <img src={fotoUrl(s, foto)} alt={`Foto del manufatto ${s.id}`} />
      {modificabile && (
        <div className="foto__azione">
          <ScegliFoto
            className="btn btn--sm"
            onFoto={(u) => {
              const id = aggiungiFoto(u);
              aggiornaScheda(s.id, { fotoId: id }, 'Foto aggiornata');
              toast('Foto salvata nella scheda');
            }}
          >
            <Camera size={15} /> {vera ? 'Cambia foto' : 'Scatta / carica'}
          </ScegliFoto>
        </div>
      )}
    </div>
  );
}
