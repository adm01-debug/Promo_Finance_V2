// Feature flags and runtime configuration management

// Types
interface FeatureFlag {
  name: string;
  enabled: boolean;
  description?: string;
  enabledFor?: string[]; // User IDs or roles
  percentage?: number; // 0-100 for gradual rollout
  metadata?: Record<string, unknown>;
}

interface RuntimeConfig {
  apiUrl: string;
  apiTimeout: number;
  maxRetries: number;
  debugMode: boolean;
  features: Record<string, FeatureFlag>;
  limits: {
    maxFileSize: number;
    maxExportRows: number;
    maxImportRows: number;
    sessionTimeout: number;
  };
  ui: {
    itemsPerPage: number;
    toastDuration: number;
    animationsEnabled: boolean;
    darkModeDefault: boolean;
  };
}

// Default configuration
const defaultConfig: RuntimeConfig = {
  apiUrl: import.meta.env.VITE_API_URL || '',
  apiTimeout: 30000,
  maxRetries: 3,
  debugMode: import.meta.env.DEV,
  features: {},
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxExportRows: 10000,
    maxImportRows: 5000,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  },
  ui: {
    itemsPerPage: 10,
    toastDuration: 5000,
    animationsEnabled: true,
    darkModeDefault: false,
  },
};

// Default feature flags
const defaultFeatures: Record<string, FeatureFlag> = {
  darkMode: {
    name: 'darkMode',
    enabled: true,
    description: 'Enable dark mode theme toggle',
  },
  exportPDF: {
    name: 'exportPDF',
    enabled: true,
    description: 'Enable PDF export functionality',
  },
  exportExcel: {
    name: 'exportExcel',
    enabled: true,
    description: 'Enable Excel export functionality',
  },
  importData: {
    name: 'importData',
    enabled: true,
    description: 'Enable data import functionality',
  },
  notifications: {
    name: 'notifications',
    enabled: true,
    description: 'Enable in-app notifications',
  },
  emailReminders: {
    name: 'emailReminders',
    enabled: false,
    description: 'Enable email reminders for due dates',
  },
  advancedReports: {
    name: 'advancedReports',
    enabled: true,
    description: 'Enable advanced reporting features',
  },
  multiCurrency: {
    name: 'multiCurrency',
    enabled: false,
    description: 'Enable multi-currency support',
  },
  apiIntegrations: {
    name: 'apiIntegrations',
    enabled: false,
    description: 'Enable third-party API integrations',
  },
  bulkActions: {
    name: 'bulkActions',
    enabled: true,
    description: 'Enable bulk action operations',
  },
  auditLog: {
    name: 'auditLog',
    enabled: false,
    description: 'Enable audit logging',
  },
  twoFactorAuth: {
    name: 'twoFactorAuth',
    enabled: false,
    description: 'Enable two-factor authentication',
  },
  recurrence: {
    name: 'recurrence',
    enabled: true,
    description: 'Enable recurring transactions',
  },
  attachments: {
    name: 'attachments',
    enabled: true,
    description: 'Enable file attachments',
  },
  categories: {
    name: 'categories',
    enabled: true,
    description: 'Enable category management',
  },
};

// Configuration manager class
class ConfigManager {
  private config: RuntimeConfig;
  private features: Record<string, FeatureFlag>;
  private userId?: string;
  private userRole?: string;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.config = { ...defaultConfig };
    this.features = { ...defaultFeatures };

    // Load from localStorage if available
    this.loadPersistedConfig();
  }

  // Load persisted configuration
  private loadPersistedConfig(): void {
    try {
      const persisted = localStorage.getItem('fh_config');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        this.config = { ...this.config, ...parsed };
      }

      const persistedFeatures = localStorage.getItem('fh_features');
      if (persistedFeatures) {
        const parsed = JSON.parse(persistedFeatures);
        this.features = { ...this.features, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load persisted config:', error);
    }
  }

  // Persist configuration
  private persistConfig(): void {
    try {
      localStorage.setItem('fh_config', JSON.stringify(this.config));
      localStorage.setItem('fh_features', JSON.stringify(this.features));
    } catch (error) {
      console.warn('Failed to persist config:', error);
    }
  }

  // Notify listeners of changes
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  // Set user context for feature targeting
  setUserContext(userId: string, role?: string): void {
    this.userId = userId;
    this.userRole = role;
  }

  // Get configuration value
  get<K extends keyof RuntimeConfig>(key: K): RuntimeConfig[K] {
    return this.config[key];
  }

  // Set configuration value
  set<K extends keyof RuntimeConfig>(key: K, value: RuntimeConfig[K]): void {
    this.config[key] = value;
    this.persistConfig();
    this.notifyListeners();
  }

  // Get all configuration
  getAll(): RuntimeConfig {
    return { ...this.config };
  }

  // Update multiple configuration values
  update(updates: Partial<RuntimeConfig>): void {
    this.config = { ...this.config, ...updates };
    this.persistConfig();
    this.notifyListeners();
  }

  // Check if feature is enabled
  isFeatureEnabled(featureName: string): boolean {
    const feature = this.features[featureName];
    
    if (!feature) {
      console.warn(`Feature "${featureName}" not found`);
      return false;
    }

    // Check if disabled globally
    if (!feature.enabled) {
      return false;
    }

    // Check user targeting
    if (feature.enabledFor && feature.enabledFor.length > 0) {
      if (!this.userId && !this.userRole) {
        return false;
      }
      
      const isTargeted = feature.enabledFor.includes(this.userId || '') ||
                        feature.enabledFor.includes(this.userRole || '');
      
      if (!isTargeted) {
        return false;
      }
    }

    // Check percentage rollout
    if (feature.percentage !== undefined && feature.percentage < 100) {
      if (!this.userId) {
        return false;
      }
      
      // Simple hash-based assignment
      const hash = this.hashString(this.userId + featureName);
      const userPercentile = hash % 100;
      
      return userPercentile < feature.percentage;
    }

    return true;
  }

  // Get feature flag
  getFeature(featureName: string): FeatureFlag | undefined {
    return this.features[featureName];
  }

  // Get all features
  getAllFeatures(): Record<string, FeatureFlag> {
    return { ...this.features };
  }

  // Get enabled features only
  getEnabledFeatures(): string[] {
    return Object.keys(this.features).filter((name) => this.isFeatureEnabled(name));
  }

  // Set feature flag
  setFeature(featureName: string, updates: Partial<FeatureFlag>): void {
    const existing = this.features[featureName] || {
      name: featureName,
      enabled: false,
    };
    
    this.features[featureName] = { ...existing, ...updates };
    this.persistConfig();
    this.notifyListeners();
  }

  // Enable feature
  enableFeature(featureName: string): void {
    this.setFeature(featureName, { enabled: true });
  }

  // Disable feature
  disableFeature(featureName: string): void {
    this.setFeature(featureName, { enabled: false });
  }

  // Toggle feature
  toggleFeature(featureName: string): boolean {
    const current = this.features[featureName]?.enabled ?? false;
    this.setFeature(featureName, { enabled: !current });
    return !current;
  }

  // Load remote configuration
  async loadRemoteConfig(url?: string): Promise<void> {
    const configUrl = url || import.meta.env.VITE_CONFIG_URL;
    
    if (!configUrl) {
      console.warn('No remote config URL configured');
      return;
    }

    try {
      const response = await fetch(configUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
      }

      const remoteConfig = await response.json();
      
      if (remoteConfig.config) {
        this.update(remoteConfig.config);
      }
      
      if (remoteConfig.features) {
        Object.entries(remoteConfig.features).forEach(([name, flag]) => {
          this.setFeature(name, flag as Partial<FeatureFlag>);
        });
      }

      console.log('Remote configuration loaded successfully');
    } catch (error) {
      console.error('Failed to load remote configuration:', error);
    }
  }

  // Subscribe to configuration changes
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Reset to defaults
  reset(): void {
    this.config = { ...defaultConfig };
    this.features = { ...defaultFeatures };
    localStorage.removeItem('fh_config');
    localStorage.removeItem('fh_features');
    this.notifyListeners();
  }

  // Simple string hash for percentage rollout
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

// Create singleton instance
export const config = new ConfigManager();

// Helper functions
export function isFeatureEnabled(featureName: string): boolean {
  return config.isFeatureEnabled(featureName);
}

export function getConfig<K extends keyof RuntimeConfig>(key: K): RuntimeConfig[K] {
  return config.get(key);
}

export function setConfig<K extends keyof RuntimeConfig>(key: K, value: RuntimeConfig[K]): void {
  config.set(key, value);
}

// React hook for feature flags
export function useFeatureFlag(featureName: string): boolean {
  return config.isFeatureEnabled(featureName);
}

// React hook for configuration
export function useConfig(): RuntimeConfig {
  return config.getAll();
}

// Export types
export type { FeatureFlag, RuntimeConfig };
export default config;
