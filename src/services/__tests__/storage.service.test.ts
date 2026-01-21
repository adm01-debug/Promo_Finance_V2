import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { storageService } from '../storage.service';

describe('StorageService', () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    mockLocalStorage = {};

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => mockLocalStorage[key] || null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockLocalStorage[key] = value;
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      delete mockLocalStorage[key];
    });
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
      mockLocalStorage = {};
    });
    vi.spyOn(Storage.prototype, 'key').mockImplementation((index) => {
      return Object.keys(mockLocalStorage)[index] || null;
    });
    Object.defineProperty(Storage.prototype, 'length', {
      get: () => Object.keys(mockLocalStorage).length,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('get', () => {
    it('returns null for non-existent key', () => {
      const result = storageService.get('nonexistent');
      expect(result).toBeNull();
    });

    it('returns parsed JSON value', () => {
      mockLocalStorage['test'] = JSON.stringify({ name: 'John' });

      const result = storageService.get('test');
      expect(result).toEqual({ name: 'John' });
    });

    it('returns default value when key not found', () => {
      const result = storageService.get('nonexistent', { default: 'value' });
      expect(result).toEqual({ default: 'value' });
    });

    it('returns string value', () => {
      mockLocalStorage['string'] = JSON.stringify('hello');

      const result = storageService.get('string');
      expect(result).toBe('hello');
    });

    it('returns array value', () => {
      mockLocalStorage['array'] = JSON.stringify([1, 2, 3]);

      const result = storageService.get('array');
      expect(result).toEqual([1, 2, 3]);
    });

    it('handles invalid JSON gracefully', () => {
      mockLocalStorage['invalid'] = 'not valid json';

      const result = storageService.get('invalid');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('stores value as JSON string', () => {
      storageService.set('key', { value: 123 });

      expect(mockLocalStorage['key']).toBe(JSON.stringify({ value: 123 }));
    });

    it('stores string value', () => {
      storageService.set('string', 'hello');

      expect(mockLocalStorage['string']).toBe(JSON.stringify('hello'));
    });

    it('stores array value', () => {
      storageService.set('array', [1, 2, 3]);

      expect(mockLocalStorage['array']).toBe(JSON.stringify([1, 2, 3]));
    });

    it('stores boolean value', () => {
      storageService.set('bool', true);

      expect(mockLocalStorage['bool']).toBe(JSON.stringify(true));
    });

    it('stores null value', () => {
      storageService.set('null', null);

      expect(mockLocalStorage['null']).toBe(JSON.stringify(null));
    });

    it('stores with expiration', () => {
      const futureDate = Date.now() + 60000; // 1 minute from now
      storageService.set('expiring', 'value', { expiresAt: futureDate });

      const stored = JSON.parse(mockLocalStorage['expiring']);
      expect(stored.__expires__).toBe(futureDate);
    });
  });

  describe('remove', () => {
    it('removes item from storage', () => {
      mockLocalStorage['toRemove'] = JSON.stringify('value');

      storageService.remove('toRemove');

      expect(mockLocalStorage['toRemove']).toBeUndefined();
    });

    it('does not throw for non-existent key', () => {
      expect(() => storageService.remove('nonexistent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('clears all items', () => {
      mockLocalStorage['key1'] = 'value1';
      mockLocalStorage['key2'] = 'value2';

      storageService.clear();

      expect(Object.keys(mockLocalStorage).length).toBe(0);
    });
  });

  describe('has', () => {
    it('returns true for existing key', () => {
      mockLocalStorage['exists'] = JSON.stringify('value');

      expect(storageService.has('exists')).toBe(true);
    });

    it('returns false for non-existent key', () => {
      expect(storageService.has('nonexistent')).toBe(false);
    });
  });

  describe('keys', () => {
    it('returns all storage keys', () => {
      mockLocalStorage['key1'] = 'value1';
      mockLocalStorage['key2'] = 'value2';

      const keys = storageService.keys();

      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });

    it('returns empty array when storage is empty', () => {
      const keys = storageService.keys();

      expect(keys).toEqual([]);
    });
  });

  describe('expiration', () => {
    it('returns value if not expired', () => {
      const futureDate = Date.now() + 60000;
      mockLocalStorage['notExpired'] = JSON.stringify({
        __value__: 'data',
        __expires__: futureDate,
      });

      const result = storageService.get('notExpired');
      expect(result).toBe('data');
    });

    it('returns null and removes if expired', () => {
      const pastDate = Date.now() - 60000;
      mockLocalStorage['expired'] = JSON.stringify({
        __value__: 'data',
        __expires__: pastDate,
      });

      const result = storageService.get('expired');

      expect(result).toBeNull();
      expect(mockLocalStorage['expired']).toBeUndefined();
    });
  });

  describe('namespaced storage', () => {
    it('stores with namespace prefix', () => {
      const namespaced = storageService.namespace('app');
      namespaced.set('key', 'value');

      expect(mockLocalStorage['app:key']).toBe(JSON.stringify('value'));
    });

    it('retrieves with namespace prefix', () => {
      mockLocalStorage['app:key'] = JSON.stringify('value');

      const namespaced = storageService.namespace('app');
      const result = namespaced.get('key');

      expect(result).toBe('value');
    });

    it('removes with namespace prefix', () => {
      mockLocalStorage['app:key'] = JSON.stringify('value');

      const namespaced = storageService.namespace('app');
      namespaced.remove('key');

      expect(mockLocalStorage['app:key']).toBeUndefined();
    });

    it('clears only namespaced items', () => {
      mockLocalStorage['app:key1'] = 'value1';
      mockLocalStorage['app:key2'] = 'value2';
      mockLocalStorage['other:key'] = 'value3';

      const namespaced = storageService.namespace('app');
      namespaced.clear();

      expect(mockLocalStorage['app:key1']).toBeUndefined();
      expect(mockLocalStorage['app:key2']).toBeUndefined();
      expect(mockLocalStorage['other:key']).toBe('value3');
    });
  });

  describe('typed storage', () => {
    interface User {
      id: number;
      name: string;
    }

    it('stores and retrieves typed objects', () => {
      const user: User = { id: 1, name: 'John' };
      storageService.set<User>('user', user);

      const retrieved = storageService.get<User>('user');
      expect(retrieved).toEqual(user);
    });
  });

  describe('batch operations', () => {
    it('sets multiple items', () => {
      storageService.setMany({
        key1: 'value1',
        key2: 'value2',
        key3: { nested: true },
      });

      expect(mockLocalStorage['key1']).toBe(JSON.stringify('value1'));
      expect(mockLocalStorage['key2']).toBe(JSON.stringify('value2'));
      expect(mockLocalStorage['key3']).toBe(JSON.stringify({ nested: true }));
    });

    it('gets multiple items', () => {
      mockLocalStorage['key1'] = JSON.stringify('value1');
      mockLocalStorage['key2'] = JSON.stringify('value2');

      const result = storageService.getMany(['key1', 'key2', 'key3']);

      expect(result).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: null,
      });
    });

    it('removes multiple items', () => {
      mockLocalStorage['key1'] = 'value1';
      mockLocalStorage['key2'] = 'value2';
      mockLocalStorage['key3'] = 'value3';

      storageService.removeMany(['key1', 'key2']);

      expect(mockLocalStorage['key1']).toBeUndefined();
      expect(mockLocalStorage['key2']).toBeUndefined();
      expect(mockLocalStorage['key3']).toBe('value3');
    });
  });

  describe('size calculation', () => {
    it('calculates storage size', () => {
      mockLocalStorage['key1'] = 'a'.repeat(100);
      mockLocalStorage['key2'] = 'b'.repeat(200);

      const size = storageService.size();

      expect(size).toBeGreaterThan(0);
    });

    it('calculates size of specific key', () => {
      mockLocalStorage['key'] = 'a'.repeat(100);

      const size = storageService.sizeOf('key');

      expect(size).toBe(100);
    });
  });
});
