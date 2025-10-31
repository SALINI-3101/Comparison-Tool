import type { AppProps } from 'next/app';
import React, { useState, useEffect, createContext } from 'react';
import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from '../theme/theme';
import { ToastProvider } from '@/components/Toast';
import './globals.css';

export type ThemeMode = 'light' | 'dark';

export const ThemeContext = createContext<{
  themeMode: ThemeMode;
  toggleTheme: () => void;
}>({
  themeMode: 'light',
  toggleTheme: () => {},
});

function App({ Component, pageProps }: AppProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  if (!mounted) {
    return null;
  }

  const currentTheme = themeMode === 'light' ? lightTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
      <ThemeProvider theme={currentTheme}>
        <ToastProvider>
          <Component {...pageProps} />
        </ToastProvider>
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export default App;

