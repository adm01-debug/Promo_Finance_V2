/**
 * Revogação local reforçada após logout.
 *
 * Limpa storages, cookies não-HttpOnly, caches do Service Worker
 * e bancos IndexedDB de runtime para garantir que nenhuma área
 * protegida permaneça acessível depois do `signOut`.
 *
 * Cada etapa roda em try/catch isolado — uma falha nunca bloqueia
 * o restante do fluxo de logout.
 */
import type { QueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

/** Chaves do localStorage que devem sobreviver ao logout (não-sensíveis). */
export const PRESERVED_LOCAL_KEYS = new Set<string>([
  'theme',
  'language',
  'lang',
  'i18nextLng',
  'cookie-consent',
  'ip-mask-preference',
]);

/** Padrões de caches do Service Worker que devem ser apagados (mantém precache estático). */
const RUNTIME_CACHE_PATTERNS = [
  /^workbox-runtime/i,
  /^api-cache/i,
  /^runtime-/i,
  /-runtime$/i,
  /supabase/i,
];

/** Padrões de IndexedDB que devem ser apagados. */
const RUNTIME_IDB_PATTERNS = [
  /^workbox-/i,
  /^keyval-/i,
  /^lovable-cache/i,
  /^supabase/i,
];

function clearLocalStorage(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !PRESERVED_LOCAL_KEYS.has(key)) toRemove.push(key);
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    logger.warn('[auth-cleanup] localStorage clear failed', err);
  }
}

function clearSessionStorageSafe(): void {
  try {
    sessionStorage.clear();
  } catch (err) {
    logger.warn('[auth-cleanup] sessionStorage clear failed', err);
  }
}

function clearCookies(): void {
  try {
    const cookies = document.cookie ? document.cookie.split(';') : [];
    const host = window.location.hostname;
    const domainVariants = ['', `; domain=${host}`, `; domain=.${host}`];
    const expire = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0';

    cookies.forEach((raw) => {
      const eq = raw.indexOf('=');
      const name = (eq > -1 ? raw.substring(0, eq) : raw).trim();
      if (!name) return;
      domainVariants.forEach((dv) => {
        document.cookie = `${name}=; ${expire}; path=/${dv}`;
        document.cookie = `${name}=; ${expire}; path=${dv}`;
      });
    });
  } catch (err) {
    logger.warn('[auth-cleanup] cookies clear failed', err);
  }
}

async function clearRuntimeCaches(): Promise<void> {
  try {
    if (typeof caches === 'undefined') return;
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => RUNTIME_CACHE_PATTERNS.some((re) => re.test(k)))
        .map((k) => caches.delete(k).catch(() => false)),
    );
  } catch (err) {
    logger.warn('[auth-cleanup] caches clear failed', err);
  }
}

async function clearRuntimeIndexedDB(): Promise<void> {
  try {
    const idb = (indexedDB as unknown as {
      databases?: () => Promise<Array<{ name?: string }>>;
    });
    if (!idb.databases) return;
    const dbs = await idb.databases();
    await Promise.all(
      dbs
        .map((d) => d.name)
        .filter((name): name is string => !!name && RUNTIME_IDB_PATTERNS.some((re) => re.test(name)))
        .map(
          (name) =>
            new Promise<void>((resolve) => {
              try {
                const req = indexedDB.deleteDatabase(name);
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
                req.onblocked = () => resolve();
              } catch {
                resolve();
              }
            }),
        ),
    );
  } catch (err) {
    logger.warn('[auth-cleanup] indexedDB clear failed', err);
  }
}

/**
 * Executa o ciclo completo de revogação local. Idempotente.
 * Aceita o `QueryClient` para limpar o cache em memória do TanStack Query.
 */
export async function runAuthCleanup(queryClient?: QueryClient): Promise<void> {
  // 1. Cache em memória do TanStack Query (impede flash de dados sensíveis).
  try {
    queryClient?.clear();
  } catch (err) {
    logger.warn('[auth-cleanup] queryClient.clear failed', err);
  }

  // 2-6. Storages, cookies, caches do SW e IndexedDB.
  clearLocalStorage();
  clearSessionStorageSafe();
  clearCookies();
  await clearRuntimeCaches();
  await clearRuntimeIndexedDB();

  // 7. Notifica o resto do app para resetar state in-memory.
  try {
    window.dispatchEvent(new Event('app-logout-cleanup'));
  } catch {
    /* noop */
  }
}
