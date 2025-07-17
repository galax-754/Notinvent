import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Tipos de tema soportados
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextProps {
  theme: ThemeMode;
  actualTheme: 'light' | 'dark'; // El tema real aplicado (resuelve 'system')
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as ThemeMode) || 'system';
    }
    return 'system';
  });
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      return mq.matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Aplica la clase al <html> según el tema
  useEffect(() => {
    const root = window.document.documentElement;
    let resolvedTheme: 'light' | 'dark' = 'light';
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      resolvedTheme = mq.matches ? 'dark' : 'light';
      setActualTheme(resolvedTheme);
      // Listener para cambios en el sistema
      const handleChange = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? 'dark' : 'light';
        setActualTheme(newTheme);
        root.classList.remove('dark', 'light');
        root.classList.add(newTheme);
      };
      mq.addEventListener('change', handleChange);
      root.classList.remove('dark', 'light');
      root.classList.add(resolvedTheme);
      return () => mq.removeEventListener('change', handleChange);
    } else {
      resolvedTheme = theme;
      setActualTheme(resolvedTheme);
      root.classList.remove('dark', 'light');
      root.classList.add(resolvedTheme);
    }
    
  }, [theme]);

  // Guarda la preferencia en localStorage
  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Alternar entre claro y oscuro (no afecta 'system')
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

