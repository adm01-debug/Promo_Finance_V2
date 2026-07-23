import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createImportCheckpoint,
  peekImportCheckpoint,
  clearImportCheckpoint,
  quickHash,
} from '../import-checkpoint';

/**
 * Backing map real para localStorage — o setup global costuma mockar sem estado.
 * Restauramos ao final para não vazar entre suítes.
 */
const originalLocalStorage = globalThis.localStorage;

function installMemoryStorage(): Storage {
  const store = new Map<string, string>();
  const mem: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (k) => {
      store.delete(k);
    },
    setItem: (k, v) => {
      store.set(k, String(v));
    },
  };
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: mem,
  });
  return mem;
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('import-checkpoint', () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: originalLocalStorage,
    });
    vi.useRealTimers();
  });

  describe('createImportCheckpoint', () => {
    it('confirma refs e persiste após microtask', async () => {
      const ck = createImportCheckpoint('empresa:arq:100:hash', 100);
      ck.confirm('r1');
      ck.confirm('r2');
      expect(ck.size()).toBe(2);
      expect(ck.has('r1')).toBe(true);
      expect(ck.refs().sort()).toEqual(['r1', 'r2']);

      await flushMicrotasks();
      const raw = window.localStorage.getItem('import-checkpoint:empresa:arq:100:hash');
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.refs.sort()).toEqual(['r1', 'r2']);
      expect(parsed.total).toBe(100);
    });

    it('ignora refs vazias e duplicadas', () => {
      const ck = createImportCheckpoint('k', 10);
      ck.confirm('');
      ck.confirm('r');
      ck.confirm('r');
      expect(ck.size()).toBe(1);
    });

    it('faz throttle de múltiplas confirmações em um único write', async () => {
      const ck = createImportCheckpoint('throttle', 10);
      const spy = vi.spyOn(window.localStorage, 'setItem');
      ck.confirm('a');
      ck.confirm('b');
      ck.confirm('c');
      expect(spy).not.toHaveBeenCalled();
      await flushMicrotasks();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('clear() remove o item do storage', async () => {
      const ck = createImportCheckpoint('kx', 5);
      ck.confirm('a');
      await flushMicrotasks();
      expect(window.localStorage.getItem('import-checkpoint:kx')).toBeTruthy();
      ck.clear();
      expect(window.localStorage.getItem('import-checkpoint:kx')).toBeNull();
      expect(ck.size()).toBe(0);
    });

    it('retoma refs previamente persistidas', async () => {
      const first = createImportCheckpoint('resume', 50);
      first.confirm('x');
      first.confirm('y');
      await flushMicrotasks();
      const second = createImportCheckpoint('resume', 50);
      expect(second.size()).toBe(2);
      expect(second.has('x')).toBe(true);
      expect(second.has('y')).toBe(true);
    });

    it('descarta checkpoint expirado (TTL)', async () => {
      const key = 'expired';
      const storageKey = 'import-checkpoint:' + key;
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ refs: ['a', 'b'], total: 3, updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 30 }),
      );
      const ck = createImportCheckpoint(key, 3);
      expect(ck.size()).toBe(0);
      expect(window.localStorage.getItem(storageKey)).toBeNull();
    });

    it('descarta quando total diverge significativamente (>5%)', () => {
      const key = 'divtotal';
      window.localStorage.setItem(
        'import-checkpoint:' + key,
        JSON.stringify({ refs: ['a'], total: 1000, updatedAt: Date.now() }),
      );
      const ck = createImportCheckpoint(key, 500);
      expect(ck.size()).toBe(0);
    });

    it('tolera JSON inválido no storage', () => {
      window.localStorage.setItem('import-checkpoint:bad', '{not json');
      const ck = createImportCheckpoint('bad', 10);
      expect(ck.size()).toBe(0);
    });

    it('ignora falha de setItem (quota) silenciosamente', async () => {
      const ck = createImportCheckpoint('quota', 10);
      vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      expect(() => {
        ck.confirm('r1');
      }).not.toThrow();
      await flushMicrotasks();
      expect(ck.size()).toBe(1);
    });
  });

  describe('peekImportCheckpoint', () => {
    it('retorna null quando não há checkpoint', () => {
      expect(peekImportCheckpoint('inexistente')).toBeNull();
    });

    it('retorna payload íntegro', async () => {
      const ck = createImportCheckpoint('peek', 10);
      ck.confirm('a');
      await flushMicrotasks();
      const snap = peekImportCheckpoint('peek');
      expect(snap).not.toBeNull();
      expect(snap!.refs).toEqual(['a']);
      expect(snap!.total).toBe(10);
      expect(typeof snap!.updatedAt).toBe('number');
    });

    it('descarta e retorna null quando expirado', () => {
      window.localStorage.setItem(
        'import-checkpoint:old',
        JSON.stringify({ refs: ['a'], total: 1, updatedAt: 0 }),
      );
      expect(peekImportCheckpoint('old')).toBeNull();
      expect(window.localStorage.getItem('import-checkpoint:old')).toBeNull();
    });

    it('retorna null quando JSON malformado', () => {
      window.localStorage.setItem('import-checkpoint:corrupt', '{x');
      expect(peekImportCheckpoint('corrupt')).toBeNull();
    });

    it('retorna null quando refs não é array', () => {
      window.localStorage.setItem(
        'import-checkpoint:shape',
        JSON.stringify({ refs: 'nope', total: 1, updatedAt: Date.now() }),
      );
      expect(peekImportCheckpoint('shape')).toBeNull();
    });
  });

  describe('clearImportCheckpoint', () => {
    it('remove entrada existente', async () => {
      const ck = createImportCheckpoint('rm', 5);
      ck.confirm('a');
      await flushMicrotasks();
      clearImportCheckpoint('rm');
      expect(window.localStorage.getItem('import-checkpoint:rm')).toBeNull();
    });

    it('não lança se chave inexistente', () => {
      expect(() => clearImportCheckpoint('nao-existe')).not.toThrow();
    });
  });

  describe('quickHash (FNV-1a 32-bit)', () => {
    it('produz hash hex de 8 caracteres', () => {
      expect(quickHash('abc')).toMatch(/^[0-9a-f]{8}$/);
    });

    it('é determinístico', () => {
      expect(quickHash('mesma-string')).toBe(quickHash('mesma-string'));
    });

    it('gera hashes distintos para entradas diferentes', () => {
      expect(quickHash('a')).not.toBe(quickHash('b'));
      expect(quickHash('lorem')).not.toBe(quickHash('ipsum'));
    });

    it('lida com string vazia', () => {
      expect(quickHash('')).toMatch(/^[0-9a-f]{8}$/);
    });
  });
});
