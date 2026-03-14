// Secure storage utilities with optional encryption

// Types
interface StorageOptions {
  prefix?: string;
  ttl?: number; // Time to live in milliseconds
  encrypt?: boolean;
}

interface StoredItem<T> {
  value: T;
  expires?: number;
  encrypted?: boolean;
  version?: number;
}

// Simple XOR encryption (for basic obfuscation, not cryptographically secure)
// For production, use Web Crypto API
function simpleEncrypt(data: string, key: string): string {
  let result = '';
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);
}

function simpleDecrypt(data: string, key: string): string {
  const decoded = atob(data);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

// Get encryption key (in production, this should be more secure)
function getEncryptionKey(): string {
  return import.meta.env.VITE_STORAGE_KEY || 'promo-finance-default-key';
}

// Storage class
class SecureStorage {
  private prefix: string;
  private defaultTTL?: number;
  private useEncryption: boolean;
  private storageVersion: number = 1;

  constructor(options?: StorageOptions) {
    this.prefix = options?.prefix || 'fh_';
    this.defaultTTL = options?.ttl;
    this.useEncryption = options?.encrypt || false;
  }

  // Get full key with prefix
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  // Check if storage is available
  private isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Set item
  set<T>(key: string, value: T, options?: { ttl?: number; encrypt?: boolean }): boolean {
    if (!this.isAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      const ttl = options?.ttl || this.defaultTTL;
      const shouldEncrypt = options?.encrypt ?? this.useEncryption;

      const item: StoredItem<T> = {
        value,
        expires: ttl ? Date.now() + ttl : undefined,
        encrypted: shouldEncrypt,
        version: this.storageVersion,
      };

      let serialized = JSON.stringify(item);

      if (shouldEncrypt) {
        serialized = simpleEncrypt(serialized, getEncryptionKey());
      }

      localStorage.setItem(this.getKey(key), serialized);
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }

  // Get item
  get<T>(key: string, defaultValue?: T): T | null {
    if (!this.isAvailable()) {
      return defaultValue ?? null;
    }

    try {
      const raw = localStorage.getItem(this.getKey(key));
      
      if (!raw) {
        return defaultValue ?? null;
      }

      let data = raw;

      // Try to detect if encrypted (starts with base64 pattern)
      const isEncrypted = /^[A-Za-z0-9+/=]+$/.test(raw) && raw.length > 50;
      
      if (isEncrypted) {
        try {
          data = simpleDecrypt(raw, getEncryptionKey());
        } catch {
          // Not encrypted or wrong key
          data = raw;
        }
      }

      const item: StoredItem<T> = JSON.parse(data);

      // Check expiration
      if (item.expires && Date.now() > item.expires) {
        this.remove(key);
        return defaultValue ?? null;
      }

      return item.value;
    } catch (error) {
      console.error('Storage get error:', error);
      // Try to return raw value for backwards compatibility
      try {
        const raw = localStorage.getItem(this.getKey(key));
        return raw ? (JSON.parse(raw) as T) : (defaultValue ?? null);
      } catch {
        return defaultValue ?? null;
      }
    }
  }

  // Remove item
  remove(key: string): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }

  // Clear all items with prefix
  clear(): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(this.prefix));
      keys.forEach((k) => localStorage.removeItem(k));
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }

  // Check if key exists
  has(key: string): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    const value = this.get(key);
    return value !== null;
  }

  // Get all keys
  keys(): string[] {
    if (!this.isAvailable()) {
      return [];
    }

    return Object.keys(localStorage)
      .filter((k) => k.startsWith(this.prefix))
      .map((k) => k.slice(this.prefix.length));
  }

  // Get storage size
  size(): number {
    if (!this.isAvailable()) {
      return 0;
    }

    let total = 0;
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(this.prefix)) {
        total += localStorage.getItem(key)?.length || 0;
      }
    }
    return total;
  }

  // Clean expired items
  cleanExpired(): number {
    if (!this.isAvailable()) {
      return 0;
    }

    let cleaned = 0;
    const keys = this.keys();

    for (const key of keys) {
      const raw = localStorage.getItem(this.getKey(key));
      if (!raw) continue;

      try {
        let data = raw;
        const isEncrypted = /^[A-Za-z0-9+/=]+$/.test(raw) && raw.length > 50;
        
        if (isEncrypted) {
          data = simpleDecrypt(raw, getEncryptionKey());
        }

        const item = JSON.parse(data) as StoredItem<unknown>;
        
        if (item.expires && Date.now() > item.expires) {
          this.remove(key);
          cleaned++;
        }
      } catch {
        // Skip items that can't be parsed
      }
    }

    return cleaned;
  }
}

// Session storage version
class SecureSessionStorage extends SecureStorage {
  private sessionPrefix: string;

  constructor(options?: StorageOptions) {
    super(options);
    this.sessionPrefix = options?.prefix || 'fh_session_';
  }

  private getSessionKey(key: string): string {
    return `${this.sessionPrefix}${key}`;
  }

  set<T>(key: string, value: T, options?: { ttl?: number; encrypt?: boolean }): boolean {
    try {
      const item: StoredItem<T> = {
        value,
        expires: options?.ttl ? Date.now() + options.ttl : undefined,
      };

      sessionStorage.setItem(this.getSessionKey(key), JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('Session storage set error:', error);
      return false;
    }
  }

  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const raw = sessionStorage.getItem(this.getSessionKey(key));
      
      if (!raw) {
        return defaultValue ?? null;
      }

      const item: StoredItem<T> = JSON.parse(raw);

      if (item.expires && Date.now() > item.expires) {
        this.remove(key);
        return defaultValue ?? null;
      }

      return item.value;
    } catch (error) {
      console.error('Session storage get error:', error);
      return defaultValue ?? null;
    }
  }

  remove(key: string): boolean {
    try {
      sessionStorage.removeItem(this.getSessionKey(key));
      return true;
    } catch {
      return false;
    }
  }

  clear(): boolean {
    try {
      const keys = Object.keys(sessionStorage).filter((k) => k.startsWith(this.sessionPrefix));
      keys.forEach((k) => sessionStorage.removeItem(k));
      return true;
    } catch {
      return false;
    }
  }
}

// Create default instances
export const storage = new SecureStorage({
  prefix: 'fh_',
});

export const secureStorage = new SecureStorage({
  prefix: 'fh_secure_',
  encrypt: true,
});

export const sessionStore = new SecureSessionStorage({
  prefix: 'fh_session_',
});

// Convenience functions
export function setItem<T>(key: string, value: T, options?: StorageOptions): boolean {
  return storage.set(key, value, options);
}

export function getItem<T>(key: string, defaultValue?: T): T | null {
  return storage.get(key, defaultValue);
}

export function removeItem(key: string): boolean {
  return storage.remove(key);
}

// Auth token helpers
export function setAuthToken(token: string): boolean {
  return secureStorage.set('auth_token', token, { ttl: 7 * 24 * 60 * 60 * 1000 }); // 7 days
}

export function getAuthToken(): string | null {
  return secureStorage.get('auth_token');
}

export function removeAuthToken(): boolean {
  return secureStorage.remove('auth_token');
}

// User data helpers
export function setUserData<T>(data: T): boolean {
  return storage.set('user_data', data);
}

export function getUserData<T>(): T | null {
  return storage.get('user_data');
}

export function removeUserData(): boolean {
  return storage.remove('user_data');
}

// Export class for custom instances
export { SecureStorage, SecureSessionStorage };
