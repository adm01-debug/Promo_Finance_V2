import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

  // Load preferences
  useEffect(() => {
    const loadPreferences = async () => {
      setIsLoading(true);
      try {
        // First try localStorage for quick load
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setPreferences({ ...defaultPreferences, ...parsed });
        }

        // Then try to load from database if user is authenticated
        if (user) {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (data && !error) {
            const dbPreferences = {
              theme: data.theme || defaultPreferences.theme,
              language: data.language || defaultPreferences.language,
              currency: data.currency || defaultPreferences.currency,
              dateFormat: data.date_format || defaultPreferences.dateFormat,
              timezone: data.timezone || defaultPreferences.timezone,
              dashboardLayout: data.dashboard_layout || defaultPreferences.dashboardLayout,
              notifications: data.notifications || defaultPreferences.notifications,
              display: data.display || defaultPreferences.display,
            };
            setPreferences(dbPreferences);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dbPreferences));
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  // Save preferences
  const savePreferences = useCallback(
    async (newPreferences: Partial<UserPreferences>) => {
      const updated = { ...preferences, ...newPreferences };
      setPreferences(updated);
      setIsSaving(true);

      try {
        // Save to localStorage immediately
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        // Save to database if authenticated
        if (user) {
          const { error } = await supabase
            .from('user_preferences')
            .upsert({
              user_id: user.id,
              theme: updated.theme,
              language: updated.language,
              currency: updated.currency,
              date_format: updated.dateFormat,
              timezone: updated.timezone,
              dashboard_layout: updated.dashboardLayout,
              notifications: updated.notifications,
              display: updated.display,
              updated_at: new Date().toISOString(),
            });

          if (error) throw error;
        }

        toast.success('Preferências salvas!');
      } catch (error) {
        console.error('Error saving preferences:', error);
        toast.error('Erro ao salvar preferências');
      } finally {
        setIsSaving(false);
      }
    },
    [preferences, user]
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

      if (user) {
        const { error } = await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            theme: defaultPreferences.theme,
            language: defaultPreferences.language,
            currency: defaultPreferences.currency,
            date_format: defaultPreferences.dateFormat,
            timezone: defaultPreferences.timezone,
            dashboard_layout: defaultPreferences.dashboardLayout,
            notifications: defaultPreferences.notifications,
            display: defaultPreferences.display,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      toast.success('Preferências restauradas!');
    } catch (error) {
      console.error('Error resetting preferences:', error);
      toast.error('Erro ao restaurar preferências');
    } finally {
      setIsSaving(false);
    }
  }, [user]);

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
