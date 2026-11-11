import { createContext, useState, useContext, useEffect } from 'react';

// État léger et rarement modifié : le thème -> Context (séance 6)
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('hh_theme') || 'light');

  useEffect(() => {
    localStorage.setItem('hh_theme', theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme doit etre utilise dans un ThemeProvider');
  return context;
}