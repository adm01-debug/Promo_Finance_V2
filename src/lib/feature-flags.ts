/**
 * Feature Flags
 * Controla features baseado em variáveis de ambiente
 */

export const featureFlags = {
  // Core features
  expertAI: import.meta.env.VITE_ENABLE_EXPERT === 'true',
  openFinance: import.meta.env.VITE_ENABLE_OPEN_FINANCE === 'true',
  analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  pwa: import.meta.env.VITE_ENABLE_PWA === 'true',
  serviceWorker: import.meta.env.VITE_ENABLE_SERVICE_WORKER === 'true',
  
  // Environment
  isDevelopment: import.meta.env.VITE_ENVIRONMENT === 'development',
  isStaging: import.meta.env.VITE_ENVIRONMENT === 'staging',
  isProduction: import.meta.env.VITE_ENVIRONMENT === 'production',
  
  // Debug
  debug: import.meta.env.VITE_DEBUG === 'true',
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
} as const;

export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return featureFlags[feature] === true;
}

export function getEnvironment(): 'development' | 'staging' | 'production' {
  return import.meta.env.VITE_ENVIRONMENT as any || 'development';
}
