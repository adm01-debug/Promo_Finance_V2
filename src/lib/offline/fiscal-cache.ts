/**
 * Cache offline (IndexedDB) dos catálogos fiscais consultados.
 *
 * Motivação: os catálogos (UF/CNAE/NCM) mudam raramente, mas o contador
 * frequentemente consulta em campo/rede instável. Guardamos a última resposta
 * bem-sucedida por chave de consulta e a devolvemos quando a rede falha,
 * sinalizando explicitamente que o dado veio do cache (nunca silenciosamente).
 *
 * Degradação segura: se IndexedDB não existir (SSR, jsdom, modo privado),
 * todas as funções viram no-ops resolvidas.
 */

const DB_NAME = 'fiscal-cache';
const STORE = 'consultas';
const DB_VERSION = 1;

/** TTL padrão: 7 dias. Além disso o dado é considerado obsoleto e descartado. */
export const TTL_PADRAO_MS = 7 * 24 * 60 * 60 * 1000;

export interface EntradaCache<T> {
  chave: string;
  payload: T;
  gravadoEm: number;
}

function temIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

function abrir(): Promise<IDBDatabase | null> {
  if (!temIndexedDB()) return Promise.resolve(null);
  return new Promise((resolve) => {
    let req: IDBOpenDBRequest;
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'chave' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
}

function transacionar<R>(
  modo: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<R>,
): Promise<R | null> {
  return abrir().then(
    (db) =>
      new Promise<R | null>((resolve) => {
        if (!db) return resolve(null);
        try {
          const tx = db.transaction(STORE, modo);
          const req = fn(tx.objectStore(STORE));
          req.onsuccess = () => resolve(req.result ?? null);
          req.onerror = () => resolve(null);
          tx.oncomplete = () => db.close();
        } catch {
          resolve(null);
        }
      }),
  );
}

/** Chave estável e determinística a partir dos parâmetros da consulta. */
export function chaveConsulta(params: unknown): string {
  return JSON.stringify(params, Object.keys(params as object).sort());
}

export async function salvarConsulta<T>(chave: string, payload: T): Promise<void> {
  const entrada: EntradaCache<T> = { chave, payload, gravadoEm: Date.now() };
  await transacionar('readwrite', (s) => s.put(entrada));
}

/** Lê do cache respeitando o TTL; entradas expiradas são removidas. */
export async function lerConsulta<T>(
  chave: string,
  ttlMs: number = TTL_PADRAO_MS,
): Promise<EntradaCache<T> | null> {
  const entrada = (await transacionar<EntradaCache<T>>('readonly', (s) => s.get(chave))) as
    | EntradaCache<T>
    | null;
  if (!entrada) return null;
  if (Date.now() - entrada.gravadoEm > ttlMs) {
    await transacionar('readwrite', (s) => s.delete(chave));
    return null;
  }
  return entrada;
}

export async function limparCacheFiscal(): Promise<void> {
  await transacionar('readwrite', (s) => s.clear());
}
