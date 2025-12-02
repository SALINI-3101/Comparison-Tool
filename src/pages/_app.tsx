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
  // Initialize with light theme to match server render
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  // Sync with actual theme immediately after hydration
  useEffect(() => {
    // Read from data-theme attribute (set by _document.tsx blocking script)
    const dataTheme = document.documentElement.getAttribute('data-theme') as ThemeMode | null;
    if (dataTheme === 'dark' || dataTheme === 'light') {
      setThemeMode(dataTheme);
    } else {
      // Fallback to localStorage
      try {
        const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setThemeMode(savedTheme);
          document.documentElement.setAttribute('data-theme', savedTheme);
        } else {
          document.documentElement.setAttribute('data-theme', 'light');
        }
      } catch {
        // localStorage might be disabled
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }

    // Mark as mounted
    setMounted(true);

    // Add preload class initially to disable transitions
    document.body.classList.add('preload');

    // Remove preload class after a short delay to enable transitions
    const timer = setTimeout(() => {
      document.body.classList.remove('preload');
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Don't render anything until mounted to prevent flash
  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
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

