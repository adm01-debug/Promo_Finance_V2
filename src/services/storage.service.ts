interface StorageOptions {
  expiresAt?: number;
  expiresIn?: number; // milliseconds
}

interface StoredValue<T> {
  __value__: T;
  __expires__?: number;
}

class StorageService {
  private storage: Storage;
  private prefix: string;

  constructor(storage: Storage = localStorage, prefix: string = '') {
    this.storage = storage;
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  private isExpired(item: StoredValue<unknown>): boolean {
    if (!item.__expires__) return false;
    return Date.now() > item.__expires__;
  }

  private wrap<T>(value: T, options?: StorageOptions): string {
    const data: StoredValue<T> | T = options?.expiresAt || options?.expiresIn
      ? {
          __value__: value,
          __expires__: options.expiresAt || (options.expiresIn ? Date.now() + options.expiresIn : undefined),
        }
      : value;
    return JSON.stringify(data);
  }

  private unwrap<T>(data: string): T | null {
    try {
      const parsed = JSON.parse(data);

      // Check if it's a wrapped value with expiration
      if (parsed && typeof parsed === 'object' && '__value__' in parsed) {
        const stored = parsed as StoredValue<T>;
        if (this.isExpired(stored)) {
          return null;
        }
        return stored.__value__;
      }

      return parsed as T;
    } catch {
      return null;
    }
  }

  get<T>(key: string, defaultValue?: T): T | null {
    const fullKey = this.getKey(key);
    const data = this.storage.getItem(fullKey);

    if (data === null) {
      return defaultValue ?? null;
    }

    const value = this.unwrap<T>(data);

    if (value === null) {
      // If expired, remove the item
      this.remove(key);
      return defaultValue ?? null;
    }

    return value;
  }

  set<T>(key: string, value: T, options?: StorageOptions): void {
    const fullKey = this.getKey(key);
    const data = this.wrap(value, options);
    this.storage.setItem(fullKey, data);
  }

  remove(key: string): void {
    const fullKey = this.getKey(key);
    this.storage.removeItem(fullKey);
  }

  clear(): void {
    if (this.prefix) {
      // Only clear items with our prefix
      const keysToRemove: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith(`${this.prefix}:`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => this.storage.removeItem(key));
    } else {
      this.storage.clear();
    }
  }

  has(key: string): boolean {
    const fullKey = this.getKey(key);
    return this.storage.getItem(fullKey) !== null;
  }

  keys(): string[] {
    const allKeys: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key) {
        if (this.prefix) {
          if (key.startsWith(`${this.prefix}:`)) {
            allKeys.push(key.slice(this.prefix.length + 1));
          }
        } else {
          allKeys.push(key);
        }
      }
    }
    return allKeys;
  }

  namespace(prefix: string): StorageService {
    const newPrefix = this.prefix ? `${this.prefix}:${prefix}` : prefix;
    return new StorageService(this.storage, newPrefix);
  }

  // Batch operations
  getMany<T>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    keys.forEach((key) => {
      result[key] = this.get<T>(key);
    });
    return result;
  }

  setMany<T>(items: Record<string, T>, options?: StorageOptions): void {
    Object.entries(items).forEach(([key, value]) => {
      this.set(key, value, options);
    });
  }

  removeMany(keys: string[]): void {
    keys.forEach((key) => this.remove(key));
  }

  // Size calculations
  size(): number {
    let totalSize = 0;
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key) {
        if (!this.prefix || key.startsWith(`${this.prefix}:`)) {
          totalSize += key.length + (this.storage.getItem(key)?.length || 0);
        }
      }
    }
    return totalSize;
  }

  sizeOf(key: string): number {
    const fullKey = this.getKey(key);
    const value = this.storage.getItem(fullKey);
    return value?.length || 0;
  }

  // Update value
  update<T>(key: string, updater: (current: T | null) => T, options?: StorageOptions): T {
    const current = this.get<T>(key);
    const updated = updater(current);
    this.set(key, updated, options);
    return updated;
  }

  // Increment/Decrement for numbers
  increment(key: string, amount: number = 1): number {
    return this.update<number>(key, (current) => (current || 0) + amount);
  }

  decrement(key: string, amount: number = 1): number {
    return this.update<number>(key, (current) => (current || 0) - amount);
  }

  // Array helpers
  push<T>(key: string, item: T): T[] {
    return this.update<T[]>(key, (current) => [...(current || []), item]);
  }

  pop<T>(key: string): T | undefined {
    let poppedItem: T | undefined;
    this.update<T[]>(key, (current) => {
      if (!current || current.length === 0) return [];
      poppedItem = current[current.length - 1];
      return current.slice(0, -1);
    });
    return poppedItem;
  }

  // Object helpers
  setProperty<T extends Record<string, unknown>>(
    key: string,
    property: keyof T,
    value: T[keyof T]
  ): T {
    return this.update<T>(key, (current) => ({
      ...(current || ({} as T)),
      [property]: value,
    }));
  }

  removeProperty<T extends Record<string, unknown>>(key: string, property: keyof T): T {
    return this.update<T>(key, (current) => {
      if (!current) return {} as T;
      const { [property]: _, ...rest } = current;
      return rest as T;
    });
  }

  // Session storage helper
  static session(prefix?: string): StorageService {
    return new StorageService(sessionStorage, prefix);
  }

  // Check storage availability
  static isAvailable(type: 'localStorage' | 'sessionStorage' = 'localStorage'): boolean {
    try {
      const storage = type === 'localStorage' ? localStorage : sessionStorage;
      const testKey = '__storage_test__';
      storage.setItem(testKey, testKey);
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  // Get remaining quota (approximate)
  getRemainingQuota(): number {
    try {
      // Most browsers have 5-10MB limit
      const testKey = '__quota_test__';
      let testData = 'x'.repeat(1024); // 1KB
      let total = 0;

      while (true) {
        try {
          this.storage.setItem(testKey, testData);
          total += testData.length;
          testData += testData;
        } catch {
          break;
        }
      }

      this.storage.removeItem(testKey);
      return total;
    } catch {
      return 0;
    }
  }
}

// Export singleton instance for localStorage
export const storageService = new StorageService();

// Export session storage instance
export const sessionStorageService = StorageService.session();

// Export namespaced instances
export const authStorage = storageService.namespace('auth');
export const userStorage = storageService.namespace('user');
export const cacheStorage = storageService.namespace('cache');
export const settingsStorage = storageService.namespace('settings');

// Export class for custom instances
export { StorageService };
