import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** Limpa a preferência salva e volta ao padrão dark. */
  resetTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_THEME: Theme = 'dark';
const STORAGE_KEY = 'theme';
const BOOTSTRAP_KEY = 'theme_bootstrap_v1';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      return stored ?? DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
      localStorage.setItem(BOOTSTRAP_KEY, '1');
    } catch { /* storage indisponível — ignora */ }

    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
      setIsDark(systemTheme === 'dark');
    } else {
      root.classList.add(theme);
      setIsDark(theme === 'dark');
    }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);

  const resetTheme = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(BOOTSTRAP_KEY);
    } catch { /* storage indisponível — ignora */ }
    // Reaplica o padrão imediatamente (o effect grava o bootstrap novamente).
    setThemeState(DEFAULT_THEME);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resetTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
