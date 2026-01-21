import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'accountant' | 'viewer';
}

interface Company {
  id: string;
  name: string;
  cnpj?: string;
  logo?: string;
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  locale: 'pt-BR' | 'en-US';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  currency: 'BRL' | 'USD' | 'EUR';
  sidebarCollapsed: boolean;
  notifications: {
    email: boolean;
    push: boolean;
    vencimentos: boolean;
    pagamentos: boolean;
  };
}

interface AppState {
  user: User | null;
  company: Company | null;
  settings: AppSettings;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AppContextValue extends AppState {
  // Auth actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  
  // Company actions
  setCompany: (company: Company) => void;
  
  // Settings actions
  updateSettings: (settings: Partial<AppSettings>) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

// Default settings
const defaultSettings: AppSettings = {
  theme: 'system',
  locale: 'pt-BR',
  dateFormat: 'DD/MM/YYYY',
  currency: 'BRL',
  sidebarCollapsed: false,
  notifications: {
    email: true,
    push: true,
    vencimentos: true,
    pagamentos: true,
  },
};

// Initial state
const initialState: AppState = {
  user: null,
  company: null,
  settings: defaultSettings,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Context
const AppContext = createContext<AppContextValue | null>(null);

// Storage keys
const STORAGE_KEYS = {
  USER: 'finance-hub-user',
  COMPANY: 'finance-hub-company',
  SETTINGS: 'finance-hub-settings',
  TOKEN: 'finance-hub-token',
};

// Provider
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, setState] = useState<AppState>(initialState);

  // Load persisted state on mount
  useEffect(() => {
    const loadPersistedState = () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        const storedCompany = localStorage.getItem(STORAGE_KEYS.COMPANY);
        const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);

        setState((prev) => ({
          ...prev,
          user: storedUser ? JSON.parse(storedUser) : null,
          company: storedCompany ? JSON.parse(storedCompany) : null,
          settings: storedSettings ? { ...defaultSettings, ...JSON.parse(storedSettings) } : defaultSettings,
          isAuthenticated: !!storedToken,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Error loading persisted state:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadPersistedState();
  }, []);

  // Apply theme
  useEffect(() => {
    const { theme } = state.settings;
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [state.settings.theme]);

  // Auth actions
  const login = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock user for demo
      const user: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        role: 'admin',
      };

      const token = 'mock-token-' + Date.now();

      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);

      setState((prev) => ({
        ...prev,
        user,
        isAuthenticated: true,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: 'Falha no login. Verifique suas credenciais.',
        isLoading: false,
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);

    setState((prev) => ({
      ...prev,
      user: null,
      isAuthenticated: false,
    }));
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setState((prev) => {
      if (!prev.user) return prev;

      const updatedUser = { ...prev.user, ...updates };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

      return { ...prev, user: updatedUser };
    });
  }, []);

  // Company actions
  const setCompany = useCallback((company: Company) => {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(company));
    setState((prev) => ({ ...prev, company }));
  }, []);

  // Settings actions
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setState((prev) => {
      const updatedSettings = { ...prev.settings, ...updates };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));

      return { ...prev, settings: updatedSettings };
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setState((prev) => {
      const themes: AppSettings['theme'][] = ['light', 'dark', 'system'];
      const currentIndex = themes.indexOf(prev.settings.theme);
      const nextTheme = themes[(currentIndex + 1) % themes.length];

      const updatedSettings = { ...prev.settings, theme: nextTheme };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));

      return { ...prev, settings: updatedSettings };
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setState((prev) => {
      const updatedSettings = {
        ...prev.settings,
        sidebarCollapsed: !prev.settings.sidebarCollapsed,
      };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));

      return { ...prev, settings: updatedSettings };
    });
  }, []);

  // UI actions
  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const value: AppContextValue = {
    ...state,
    login,
    logout,
    updateUser,
    setCompany,
    updateSettings,
    toggleTheme,
    toggleSidebar,
    setLoading,
    setError,
    clearError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook
export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Shortcut hooks
export function useUser() {
  const { user, updateUser, isAuthenticated } = useApp();
  return { user, updateUser, isAuthenticated };
}

export function useCompany() {
  const { company, setCompany } = useApp();
  return { company, setCompany };
}

export function useSettings() {
  const { settings, updateSettings, toggleTheme, toggleSidebar } = useApp();
  return { settings, updateSettings, toggleTheme, toggleSidebar };
}

export function useAuth() {
  const { login, logout, isAuthenticated, user, isLoading } = useApp();
  return { login, logout, isAuthenticated, user, isLoading };
}

export default AppProvider;
