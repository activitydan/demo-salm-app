import { createStore, del, get, set } from 'idb-keyval';

// I dati restano nel browser (IndexedDB). In produzione questo modulo si sostituisce
// con le chiamate al backend: il resto dell'app non cambia.
const archivio = createStore('salm-up', 'dati');

export const CHIAVI = {
  db: 'salmup:db:v1',
  config: 'salmup:config:v1',
  foto: 'salmup:foto:v1',
} as const;

export async function leggi<T>(chiave: string): Promise<T | undefined> {
  try {
    return await get<T>(chiave, archivio);
  } catch {
    return undefined;
  }
}

const timers = new Map<string, number>();

/** Salvataggio con debounce: evita di riscrivere tutto a ogni tasto premuto. */
export function salvaDopo(chiave: string, valore: unknown, ms = 500) {
  const t = timers.get(chiave);
  if (t) window.clearTimeout(t);
  timers.set(
    chiave,
    window.setTimeout(() => {
      timers.delete(chiave);
      set(chiave, valore, archivio).catch((e) => console.warn('Salvataggio non riuscito', e));
    }, ms),
  );
}

export async function cancellaTutto() {
  await Promise.all(Object.values(CHIAVI).map((k) => del(k, archivio)));
}
