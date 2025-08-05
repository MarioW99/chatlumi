import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'goldtag' | 'silbernacht';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isAutoMode: boolean;
  setAutoMode: (auto: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('goldtag');
  const [isAutoMode, setAutoMode] = useState(true);

  useEffect(() => {
    if (isAutoMode) {
      const hour = new Date().getHours();
      const autoTheme: Theme = (hour >= 6 && hour < 18) ? 'goldtag' : 'silbernacht';
      setTheme(autoTheme);
    }
  }, [isAutoMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'silbernacht');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'goldtag' ? 'silbernacht' : 'goldtag');
    setAutoMode(false);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isAutoMode, setAutoMode }}>
      {children}
    </ThemeContext.Provider>
  );
};