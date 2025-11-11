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

  useEffect(() => {
    // Always set theme to light mode and clear any saved theme preference
    setThemeMode('light');
    localStorage.removeItem('theme');

    // Mark app as hydrated to prevent FOUC
    document.getElementById('__next')?.classList.add('hydrated');

    // Note: We're not preventing default drag/drop at window level
    // because it blocks access to dataTransfer.files in React handlers
    // Users should drop files only in the designated drop zones
  }, []);

  const toggleTheme = () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    // Theme preference is not saved anymore - always starts in light mode
  };

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

