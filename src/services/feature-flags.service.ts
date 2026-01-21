/**
 * Feature Flags Service
 * Controle de features para rollout gradual e testes A/B
 */

interface FeatureFlag {
  key: string;
  enabled: boolean;
  percentage?: number; // For gradual rollout
  userIds?: string[]; // Specific users
  environments?: string[]; // dev, staging, production
  startDate?: Date;
  endDate?: Date;
  metadata?: Record<string, unknown>;
}

type FeatureFlagConfig = Record<string, FeatureFlag>;

const DEFAULT_FLAGS: FeatureFlagConfig = {
  // UI Features
  'feature.dark-mode': {
    key: 'feature.dark-mode',
    enabled: true,
  },
  'feature.notifications': {
    key: 'feature.notifications',
    enabled: true,
  },
  'feature.keyboard-shortcuts': {
    key: 'feature.keyboard-shortcuts',
    enabled: true,
  },
  
  // Integration Features
  'integration.bitrix24': {
    key: 'integration.bitrix24',
    enabled: true,
    environments: ['production', 'staging'],
  },
  'integration.google-drive': {
    key: 'integration.google-drive',
    enabled: false,
  },
  'integration.whatsapp': {
    key: 'integration.whatsapp',
    enabled: false,
    percentage: 10, // 10% rollout
  },
  
  // Beta Features
  'beta.ai-insights': {
    key: 'beta.ai-insights',
    enabled: false,
    userIds: [], // Add specific beta testers
  },
  'beta.advanced-reports': {
    key: 'beta.advanced-reports',
    enabled: false,
    percentage: 20,
  },
  'beta.recurring-payments': {
    key: 'beta.recurring-payments',
    enabled: true,
  },
  
  // Experimental Features
  'experiment.new-dashboard': {
    key: 'experiment.new-dashboard',
    enabled: false,
    percentage: 5,
  },
  'experiment.inline-editing': {
    key: 'experiment.inline-editing',
    enabled: false,
  },
  
  // Maintenance Flags
  'maintenance.readonly': {
    key: 'maintenance.readonly',
    enabled: false,
  },
  'maintenance.banner': {
    key: 'maintenance.banner',
    enabled: false,
    metadata: {
      message: 'Manutenção programada: 22/01/2026 às 02:00',
    },
  },
};

class FeatureFlagsService {
  private flags: FeatureFlagConfig;
  private userId?: string;
  private environment: string;
  private overrides: Map<string, boolean> = new Map();

  constructor(flags: FeatureFlagConfig = DEFAULT_FLAGS) {
    this.flags = flags;
    this.environment = import.meta.env.MODE || 'development';
    this.loadOverridesFromStorage();
  }

  /**
   * Set current user for user-specific flags
   */
  setUser(userId: string): void {
    this.userId = userId;
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(key: string): boolean {
    // Check local overrides first (for testing)
    if (this.overrides.has(key)) {
      return this.overrides.get(key)!;
    }

    const flag = this.flags[key];
    if (!flag) {
      console.warn(`[FeatureFlags] Unknown flag: ${key}`);
      return false;
    }

    // Check if globally disabled
    if (!flag.enabled) {
      return false;
    }

    // Check environment
    if (flag.environments && !flag.environments.includes(this.environment)) {
      return false;
    }

    // Check date range
    const now = new Date();
    if (flag.startDate && now < flag.startDate) {
      return false;
    }
    if (flag.endDate && now > flag.endDate) {
      return false;
    }

    // Check specific users
    if (flag.userIds && flag.userIds.length > 0) {
      if (this.userId && flag.userIds.includes(this.userId)) {
        return true;
      }
      // If user IDs are specified but user is not in list, check percentage
    }

    // Check percentage rollout
    if (flag.percentage !== undefined && flag.percentage < 100) {
      return this.isInPercentage(key, flag.percentage);
    }

    return true;
  }

  /**
   * Get feature flag value with metadata
   */
  getFlag(key: string): FeatureFlag | null {
    return this.flags[key] || null;
  }

  /**
   * Get all flags
   */
  getAllFlags(): FeatureFlagConfig {
    return { ...this.flags };
  }

  /**
   * Get enabled features for current context
   */
  getEnabledFeatures(): string[] {
    return Object.keys(this.flags).filter((key) => this.isEnabled(key));
  }

  /**
   * Override flag locally (for testing)
   */
  override(key: string, enabled: boolean): void {
    this.overrides.set(key, enabled);
    this.saveOverridesToStorage();
  }

  /**
   * Clear override
   */
  clearOverride(key: string): void {
    this.overrides.delete(key);
    this.saveOverridesToStorage();
  }

  /**
   * Clear all overrides
   */
  clearAllOverrides(): void {
    this.overrides.clear();
    this.saveOverridesToStorage();
  }

  /**
   * Update flags from server
   */
  async fetchFlags(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch feature flags');
      }
      
      const remoteFlags = await response.json();
      this.flags = { ...this.flags, ...remoteFlags };
    } catch (error) {
      console.error('[FeatureFlags] Error fetching flags:', error);
    }
  }

  /**
   * Deterministic percentage check based on user ID
   */
  private isInPercentage(key: string, percentage: number): boolean {
    if (!this.userId) {
      // No user, use random
      return Math.random() * 100 < percentage;
    }

    // Create deterministic hash from userId + key
    const hash = this.hashCode(`${this.userId}-${key}`);
    const bucket = Math.abs(hash) % 100;
    return bucket < percentage;
  }

  /**
   * Simple hash function
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  /**
   * Load overrides from localStorage
   */
  private loadOverridesFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem('feature_flag_overrides');
      if (stored) {
        const overrides = JSON.parse(stored);
        this.overrides = new Map(Object.entries(overrides));
      }
    } catch (error) {
      console.error('[FeatureFlags] Error loading overrides:', error);
    }
  }

  /**
   * Save overrides to localStorage
   */
  private saveOverridesToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const overrides = Object.fromEntries(this.overrides);
      localStorage.setItem('feature_flag_overrides', JSON.stringify(overrides));
    } catch (error) {
      console.error('[FeatureFlags] Error saving overrides:', error);
    }
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagsService();

// Helper functions
export function isFeatureEnabled(key: string): boolean {
  return featureFlags.isEnabled(key);
}

export function getFeatureFlag(key: string): FeatureFlag | null {
  return featureFlags.getFlag(key);
}

// Feature flag keys as constants
export const FEATURES = {
  // UI
  DARK_MODE: 'feature.dark-mode',
  NOTIFICATIONS: 'feature.notifications',
  KEYBOARD_SHORTCUTS: 'feature.keyboard-shortcuts',
  
  // Integrations
  BITRIX24: 'integration.bitrix24',
  GOOGLE_DRIVE: 'integration.google-drive',
  WHATSAPP: 'integration.whatsapp',
  
  // Beta
  AI_INSIGHTS: 'beta.ai-insights',
  ADVANCED_REPORTS: 'beta.advanced-reports',
  RECURRING_PAYMENTS: 'beta.recurring-payments',
  
  // Experiments
  NEW_DASHBOARD: 'experiment.new-dashboard',
  INLINE_EDITING: 'experiment.inline-editing',
  
  // Maintenance
  READONLY: 'maintenance.readonly',
  BANNER: 'maintenance.banner',
} as const;

// React hook for feature flags
import { useState, useEffect } from 'react';

export function useFeatureFlag(key: string): boolean {
  const [enabled, setEnabled] = useState(() => featureFlags.isEnabled(key));

  useEffect(() => {
    // Re-check on mount in case flags were updated
    setEnabled(featureFlags.isEnabled(key));
  }, [key]);

  return enabled;
}

export function useFeatureFlags(keys: string[]): Record<string, boolean> {
  const [flags, setFlags] = useState<Record<string, boolean>>(() => {
    const result: Record<string, boolean> = {};
    keys.forEach((key) => {
      result[key] = featureFlags.isEnabled(key);
    });
    return result;
  });

  useEffect(() => {
    const result: Record<string, boolean> = {};
    keys.forEach((key) => {
      result[key] = featureFlags.isEnabled(key);
    });
    setFlags(result);
  }, [keys]);

  return flags;
}

export default featureFlags;
