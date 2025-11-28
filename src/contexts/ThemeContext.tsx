'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load theme from localStorage or user preferences
    const savedTheme = localStorage.getItem('ai-chatbot-theme') as Theme | null;
    const userPrefs = localStorage.getItem('userPreferences');
    
    let initialTheme: Theme = 'light';
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      initialTheme = savedTheme;
    } else if (userPrefs) {
      try {
        const prefs = JSON.parse(userPrefs);
        if (prefs.theme === 'light' || prefs.theme === 'dark') {
          initialTheme = prefs.theme;
        }
      } catch (e) {
        console.error('Error parsing user preferences:', e);
      }
    }
    
    setThemeState(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    document.documentElement.dataset.theme = newTheme;
    localStorage.setItem('ai-chatbot-theme', newTheme);
    
    // Also save to userPreferences for consistency
    const userPrefs = localStorage.getItem('userPreferences');
    const existingData = userPrefs ? JSON.parse(userPrefs) : {};
    const updatedPrefs = {
      ...existingData,
      theme: newTheme,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('userPreferences', JSON.stringify(updatedPrefs));
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

