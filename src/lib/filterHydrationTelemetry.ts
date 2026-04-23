/**
 * Telemetria de hidratação dos filtros gerenciados.
 *
 * Cada vez que `useManagedFilters` termina sua hidratação inicial (sucesso
 * ou falha lendo Supabase / localStorage), um evento é registrado num buffer
 * in-memory + persistido como espelho leve no `localStorage` para sobreviver
 * a navegações SPA. A tela `/configuracoes/filtros-salvos` assina o buffer
 * via `subscribeHydrationEvents` e exibe um card destacando falhas recentes.
 *
 * Não usa Supabase para evitar loops com o próprio fluxo que está sendo
 * monitorado. O buffer é limitado para não vazar memória.
 */

export type HydrationStatus = 'success' | 'error';

export interface HydrationEvent {
  /** Identificador da entidade (ex: 'clientes'). */
  entityType: string;
  status: HydrationStatus;
  /** Origem dos dados aplicados na hidratação. */
  source: 'supabase' | 'localStorage' | 'defaults' | 'none';
  /** Mensagem de erro, quando status='error'. */
  errorMessage?: string;
  /** Detalhe opcional sobre qual etapa falhou. */
  stage?: 'supabase-read' | 'localStorage-read' | 'merge';
  /** ISO timestamp. */
  at: string;
}

const BUFFER_MAX = 100;
const STORAGE_KEY = 'filter-hydration-events';

const buffer: HydrationEvent[] = [];
const listeners = new Set<(events: HydrationEvent[]) => void>();
let hydratedFromStorage = false;

function loadFromStorage(): void {
  if (hydratedFromStorage) return;
  hydratedFromStorage = true;
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      for (const item of parsed.slice(-BUFFER_MAX)) {
        if (item && typeof item === 'object' && typeof item.entityType === 'string') {
          buffer.push(item as HydrationEvent);
        }
      }
    }
  } catch {
    /* ignora storage inválido */
  }
}

function persistToStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buffer.slice(-BUFFER_MAX)));
  } catch {
    /* quota cheia: silencioso */
  }
}

function notify(): void {
  const snapshot = buffer.slice();
  for (const listener of listeners) {
    try {
      listener(snapshot);
    } catch {
      /* listeners não devem derrubar o produtor */
    }
  }
}

/**
 * Registra um evento de hidratação. Mantém o buffer limitado em FIFO.
 */
export function recordHydrationEvent(event: Omit<HydrationEvent, 'at'>): void {
  loadFromStorage();
  const entry: HydrationEvent = { ...event, at: new Date().toISOString() };
  buffer.push(entry);
  if (buffer.length > BUFFER_MAX) buffer.splice(0, buffer.length - BUFFER_MAX);
  persistToStorage();
  notify();
}

/** Snapshot atual de eventos (mais antigo primeiro). */
export function getHydrationEvents(): HydrationEvent[] {
  loadFromStorage();
  return buffer.slice();
}

/** Filtra apenas eventos com status='error'. */
export function getHydrationFailures(): HydrationEvent[] {
  return getHydrationEvents().filter((e) => e.status === 'error');
}

/**
 * Assina mudanças. Retorna função de unsubscribe. Dispara imediatamente com
 * o snapshot atual (sincrônico) para o consumidor receber o histórico.
 */
export function subscribeHydrationEvents(
  listener: (events: HydrationEvent[]) => void,
): () => void {
  loadFromStorage();
  listeners.add(listener);
  // Disparo inicial assíncrono — evita re-entrância dentro do useEffect que assina
  queueMicrotask(() => listener(buffer.slice()));
  return () => {
    listeners.delete(listener);
  };
}

/** Limpa o buffer (UI usa após o usuário marcar como reconhecido). */
export function clearHydrationEvents(): void {
  buffer.splice(0, buffer.length);
  persistToStorage();
  notify();
}
