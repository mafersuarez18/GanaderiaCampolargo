import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Cola de escrituras pendientes cuando no hay conexión: guarda cada
// mutación (POST/PATCH/PUT/DELETE) que falló por falta de red en
// IndexedDB, para reintentarla más tarde. clienteAxios.ts es quien decide
// cuándo encolar (ver su interceptor de respuesta) y quién la reproduce
// (sincronizarPendientes) — este módulo solo es el almacenamiento y un
// pub/sub simple para que la UI (el indicador en la barra superior)
// reaccione sin tener que hacer polling.
//
// Limitación conocida: solo sirve para escrituras "simples", que no
// necesitan el id que devuelve el servidor para completar otro paso del
// mismo flujo (por eso clienteAxios.ts nunca encola, por ejemplo, la
// creación de una raza o un medicamento nuevo que se usa de inmediato para
// crear el animal/tratamiento — esas fallan al instante en vez de quedar
// en una cola que no podría completarlas).

export interface PeticionPendiente {
  id?: number;
  metodo: 'post' | 'patch' | 'put' | 'delete';
  url: string;
  datos?: unknown;
  descripcion: string; // texto legible para la UI, ej. "Nueva consulta médica"
  creadoEn: number;
}

interface EsquemaCola extends DBSchema {
  pendientes: {
    key: number;
    value: PeticionPendiente;
  };
}

let promesaDB: Promise<IDBPDatabase<EsquemaCola>> | null = null;

function obtenerDB() {
  if (!promesaDB) {
    promesaDB = openDB<EsquemaCola>('campolargo-cola-offline', 1, {
      upgrade(db) {
        db.createObjectStore('pendientes', { keyPath: 'id', autoIncrement: true });
      },
    });
  }
  return promesaDB;
}

export async function encolarPeticion(peticion: Omit<PeticionPendiente, 'id' | 'creadoEn'>): Promise<void> {
  const db = await obtenerDB();
  await db.add('pendientes', { ...peticion, creadoEn: Date.now() });
  notificarCambio();
}

export async function obtenerPendientes(): Promise<PeticionPendiente[]> {
  const db = await obtenerDB();
  return db.getAll('pendientes');
}

export async function contarPendientes(): Promise<number> {
  const db = await obtenerDB();
  return db.count('pendientes');
}

export async function eliminarPendiente(id: number): Promise<void> {
  const db = await obtenerDB();
  await db.delete('pendientes', id);
  notificarCambio();
}

// ── Suscripción para la UI ──────────────────────────────────────────────────
type Escucha = () => void;
const escuchas = new Set<Escucha>();

export function suscribirseACola(cb: Escucha): () => void {
  escuchas.add(cb);
  return () => escuchas.delete(cb);
}

export function notificarCambio(): void {
  escuchas.forEach((cb) => cb());
}
