import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// ThemeContext — глобален dark/light mode
// Истите бои како мобилната апликација (app_theme.dart)
//
// Light mode бои (од AppColors light):
//   background: #F0EDE6
//   cardBg:     #FFFFFF
//   textDark:   #1A1A1A
//   textMuted:  #8A8A8A
//   border:     #DDDDD8
//
// Dark mode бои (од AppColors dark):
//   background: #121212  (darkBackground)
//   cardBg:     #1E1E1E  (darkCardBg)
//   textDark:   #F0F0F0  (darkTextDark)
//   textMuted:  #9E9E9E  (darkTextMuted)
//   border:     #2C2C2C  (darkBorder)
// ─────────────────────────────────────────────────────────────────────────────

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('ls_theme');
    return saved ? saved === 'dark' : false; // default light
  });

  // Apply theme class to <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('ls_theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark(v => !v), []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
