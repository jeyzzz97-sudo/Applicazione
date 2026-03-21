import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  themeColor: string | null;
  setThemeColor: (color: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType>({ 
  theme: 'light', 
  toggleTheme: () => {},
  themeColor: null,
  setThemeColor: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('routine_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const [themeColor, setThemeColor] = useState<string | null>(() => {
    return localStorage.getItem('routine_theme_color') || null;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('routine_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (themeColor) {
      document.documentElement.style.setProperty('--accent', themeColor);
      document.documentElement.style.setProperty('--green', themeColor);
      
      if (theme === 'dark') {
        document.documentElement.style.setProperty('--bg', `color-mix(in srgb, ${themeColor} 15%, #050505)`);
        document.documentElement.style.setProperty('--bg2', `color-mix(in srgb, ${themeColor} 22%, #111111)`);
        document.documentElement.style.setProperty('--bg3', `color-mix(in srgb, ${themeColor} 35%, #1a1a1a)`);
        document.documentElement.style.setProperty('--sel', `color-mix(in srgb, ${themeColor} 25%, transparent)`);
        document.documentElement.style.setProperty('--glass', `color-mix(in srgb, ${themeColor} 15%, rgba(5,5,5,0.85))`);
      } else {
        document.documentElement.style.setProperty('--bg', `color-mix(in srgb, ${themeColor} 12%, #F8F9FA)`);
        document.documentElement.style.setProperty('--bg2', `color-mix(in srgb, ${themeColor} 5%, #FFFFFF)`);
        document.documentElement.style.setProperty('--bg3', `color-mix(in srgb, ${themeColor} 20%, #E9ECEF)`);
        document.documentElement.style.setProperty('--sel', `color-mix(in srgb, ${themeColor} 20%, transparent)`);
        document.documentElement.style.setProperty('--glass', `color-mix(in srgb, ${themeColor} 12%, rgba(248,249,250,0.85))`);
      }
      
      localStorage.setItem('routine_theme_color', themeColor);
    } else {
      document.documentElement.style.removeProperty('--accent');
      document.documentElement.style.removeProperty('--green');
      document.documentElement.style.removeProperty('--bg');
      document.documentElement.style.removeProperty('--bg2');
      document.documentElement.style.removeProperty('--bg3');
      document.documentElement.style.removeProperty('--sel');
      document.documentElement.style.removeProperty('--glass');
      localStorage.removeItem('routine_theme_color');
    }
  }, [themeColor, theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, themeColor, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
