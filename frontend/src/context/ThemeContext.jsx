import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';

const themeStorageKey = 'collabdock-theme';
const ThemeContext = createContext(null);

export function getSavedTheme() {
  const savedTheme = window.localStorage.getItem(themeStorageKey);
  return savedTheme === 'dark' ? 'dark' : 'light';
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getSavedTheme);

  useLayoutEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  useEffect(() => {
    const syncTheme = (event) => {
      if (event.key !== themeStorageKey) return;
      setTheme(event.newValue === 'dark' ? 'dark' : 'light');
    };
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within ThemeProvider');
  return value;
}
