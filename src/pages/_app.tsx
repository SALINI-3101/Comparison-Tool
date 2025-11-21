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
  // Initialize theme - use undefined to indicate we haven't checked yet
  const [themeMode, setThemeMode] = useState<ThemeMode | undefined>(undefined);

  // On mount, read the theme that was set by the blocking script
  useEffect(() => {
    // Read from data-theme attribute (set by _document.tsx blocking script)
    const dataTheme = document.documentElement.getAttribute('data-theme') as ThemeMode | null;
    if (dataTheme === 'dark' || dataTheme === 'light') {
      setThemeMode(dataTheme);
    } else {
      // Fallback to localStorage
      const savedTheme = localStorage.getItem('theme') as ThemeMode | null;
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeMode(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else {
        setThemeMode('light');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    }
  }, []);

  useEffect(() => {
    if (!themeMode) return;

    // Set data-theme attribute on HTML element
    document.documentElement.setAttribute('data-theme', themeMode);

    // Mark app as hydrated to prevent FOUC
    document.getElementById('__next')?.classList.add('hydrated');

    // Note: We're not preventing default drag/drop at window level
    // because it blocks access to dataTransfer.files in React handlers
    // Users should drop files only in the designated drop zones
  }, [themeMode]);

  const toggleTheme = () => {
    if (!themeMode) return;
    const newTheme = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Show a minimal loading state while determining theme
  if (!themeMode) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        color: '#374151',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#8B5CF6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
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

