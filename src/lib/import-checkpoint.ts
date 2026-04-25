/**
 * Checkpoint persistente para importações em lote.
 *
 * Permite retomar uma importação interrompida (falha, fechamento de aba,
 * crash) pulando os lançamentos cuja `ref` já foi confirmada com sucesso.
 *
 * - Storage: `localStorage` (escopo por navegador/usuário).
 * - Identificador: `key` estável fornecida pelo chamador — tipicamente
 *   `${empresaId}:${arquivoNome}:${tamanho}:${hashConteudo}` — para que
 *   re-uploads do mesmo arquivo sejam reconhecidos.
 * - Tolerante a JSON inválido / quota exceeded / SSR.
 */

const PREFIX = 'import-checkpoint:';
/** TTL padrão (7 dias). Checkpoints mais antigos são descartados. */
const DEFAULT_TTL_MS = 7 * 24 * 3600 * 1000;

interface CheckpointPayload {
  /** Lista de refs já confirmadas com sucesso. */
  refs: string[];
  /** Total esperado de itens (para validar coerência ao retomar). */
  total: number;
  /** Timestamp da última atualização. */
  updatedAt: number;
}

export interface ImportCheckpoint {
  /** Marca uma `ref` como confirmada e persiste imediatamente. */
  confirm: (ref: string) => void;
  /** Retorna `true` se a `ref` já foi confirmada anteriormente. */
  has: (ref: string) => boolean;
  /** Quantidade de refs confirmadas. */
  size: () => number;
  /** Snapshot das refs confirmadas (cópia). */
  refs: () => string[];
  /** Remove o checkpoint do storage. */
  clear: () => void;
}

export function createImportCheckpoint(key: string, total: number, ttlMs = DEFAULT_TTL_MS): ImportCheckpoint {
  const storageKey = PREFIX + key;
  const set = loadInto(storageKey, total, ttlMs);

  // Throttle de escrita — múltiplas confirmações próximas viram 1 write.
  let pending = false;
  const flush = () => {
    pending = false;
    persist(storageKey, { refs: [...set], total, updatedAt: Date.now() });
  };
  const scheduleFlush = () => {
    if (pending) return;
    pending = true;
    if (typeof queueMicrotask === 'function') queueMicrotask(flush);
    else setTimeout(flush, 0);
  };

  return {
    confirm: (ref: string) => {
      if (!ref || set.has(ref)) return;
      set.add(ref);
      scheduleFlush();
    },
    has: (ref: string) => set.has(ref),
    size: () => set.size,
    refs: () => [...set],
    clear: () => {
      set.clear();
      try {
        if (typeof window !== 'undefined') window.localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
    },
  };
}

/**
 * Lê o checkpoint atual sem instanciar o controlador. Útil para detectar a
 * existência de um progresso retomável e oferecer a opção ao usuário antes
 * de começar (ex.: "Retomar 320 de 1.000 já importados").
 */
export function peekImportCheckpoint(key: string, ttlMs = DEFAULT_TTL_MS):
  | { refs: string[]; total: number; updatedAt: number }
  | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckpointPayload;
    if (!parsed || !Array.isArray(parsed.refs)) return null;
    if (Date.now() - (parsed.updatedAt ?? 0) > ttlMs) {
      window.localStorage.removeItem(PREFIX + key);
      return null;
    }
    return { refs: parsed.refs, total: parsed.total ?? 0, updatedAt: parsed.updatedAt ?? 0 };
  } catch {
    return null;
  }
}

/** Remove o checkpoint manualmente (ex.: ao concluir 100% com sucesso). */
export function clearImportCheckpoint(key: string) {
  try {
    if (typeof window !== 'undefined') window.localStorage.removeItem(PREFIX + key);
  } catch {
    /* ignore */
  }
}

/**
 * Hash leve e síncrono (FNV-1a 32-bit) — usado para gerar uma componente
 * estável da `checkpointKey` a partir do conteúdo do arquivo, sem depender
 * da Web Crypto (que é assíncrona). Não é seguro criptograficamente, mas é
 * ótimo para identificar o mesmo arquivo entre sessões.
 */
export function quickHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function loadInto(storageKey: string, total: number, ttlMs: number): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as CheckpointPayload;
    if (!parsed || !Array.isArray(parsed.refs)) return new Set();
    // Expira checkpoints velhos.
    if (Date.now() - (parsed.updatedAt ?? 0) > ttlMs) {
      window.localStorage.removeItem(storageKey);
      return new Set();
    }
    // Coerência: total mudou drasticamente → trata como arquivo diferente.
    if (parsed.total && total && Math.abs(parsed.total - total) > Math.max(5, total * 0.05)) {
      window.localStorage.removeItem(storageKey);
      return new Set();
    }
    return new Set(parsed.refs);
  } catch {
    return new Set();
  }
}

function persist(storageKey: string, payload: CheckpointPayload) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    /* quota / privacy errors são ignorados — checkpoint é best-effort. */
  }
}
