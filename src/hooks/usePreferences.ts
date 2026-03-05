import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  dateFormat: string;
  timezone: string;
  dashboardLayout: 'default' | 'compact' | 'expanded';
  notifications: {
    email: boolean;
    push: boolean;
    contasVencer: boolean;
    contasAtrasadas: boolean;
    relatorioSemanal: boolean;
  };
  display: {
    rowsPerPage: number;
    showTotals: boolean;
    compactMode: boolean;
  };
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'pt-BR',
  currency: 'BRL',
  dateFormat: 'dd/MM/yyyy',
  timezone: 'America/Sao_Paulo',
  dashboardLayout: 'default',
  notifications: {
    email: true,
    push: true,
    contasVencer: true,
    contasAtrasadas: true,
    relatorioSemanal: false,
  },
  display: {
    rowsPerPage: 10,
    showTotals: true,
    compactMode: false,
  },
};

const STORAGE_KEY = 'finance-hub-preferences';

export function usePreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Save preferences
  const savePreferences = useCallback(
    async (newPreferences: Partial<UserPreferences>) => {
      const updated = { ...preferences, ...newPreferences };
      setPreferences(updated);
      setIsSaving(true);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        toast.success('Preferências salvas!');
      } catch (error) {
        console.error('Error saving preferences:', error);
        toast.error('Erro ao salvar preferências');
      } finally {
        setIsSaving(false);
      }
    },
    [preferences]
  );

  // Update single preference
  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      savePreferences({ [key]: value });
    },
    [savePreferences]
  );

  // Reset to defaults
  const resetPreferences = useCallback(async () => {
    setPreferences(defaultPreferences);
    setIsSaving(true);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPreferences));
      toast.success('Preferências restauradas!');
    } catch (error) {
      console.error('Error resetting preferences:', error);
      toast.error('Erro ao restaurar preferências');
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    preferences,
    isLoading,
    isSaving,
    savePreferences,
    updatePreference,
    resetPreferences,
  };
}

// Hook for specific preference
export function usePreference<K extends keyof UserPreferences>(key: K) {
  const { preferences, updatePreference, isLoading, isSaving } = usePreferences();

  return {
    value: preferences[key],
    setValue: (value: UserPreferences[K]) => updatePreference(key, value),
    isLoading,
    isSaving,
  };
}

export default usePreferences;
