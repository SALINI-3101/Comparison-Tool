export const lightTheme = {
  colors: {
    primary: '#111827',
    text: '#111827',
    subtleText: '#6b7280',
    border: '#e5e7eb',
    error: '#ef4444',
    white: '#ffffff',
    background: '#f9fafb',
    cardBackground: '#ffffff',
    purple: '#9333ea',
    blue: '#3b82f6',
    pink: '#ec4899',
    violet: '#8b5cf6',
    green: '#10b981',
    lightPurple: '#f3e8ff',
    lightBlue: '#dbeafe',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  gradients: {
    primary: 'linear-gradient(90deg, #9333ea 0%, #3b82f6 50%, #ec4899 100%)',
    purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  radii: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  spacing: (n: number) => `${n * 4}px`,
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px',
  },
} as const;

export const darkTheme = {
  colors: {
    primary: '#f9fafb',
    text: '#f9fafb',
    subtleText: '#9ca3af',
    border: '#374151',
    error: '#f87171',
    white: '#ffffff',
    background: '#111827',
    cardBackground: '#1f2937',
    purple: '#a855f7',
    blue: '#60a5fa',
    pink: '#f472b6',
    violet: '#a78bfa',
    green: '#34d399',
    lightPurple: '#2d1b4e',
    lightBlue: '#1e3a5f',
    gray: {
      50: '#1f2937',
      100: '#374151',
      200: '#4b5563',
      300: '#6b7280',
      400: '#9ca3af',
      500: '#d1d5db',
      600: '#e5e7eb',
      700: '#f3f4f6',
      800: '#f9fafb',
      900: '#ffffff',
    },
  },
  gradients: {
    primary: 'linear-gradient(90deg, #a855f7 0%, #60a5fa 50%, #f472b6 100%)',
    purple: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
  },
  radii: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  spacing: (n: number) => `${n * 4}px`,
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.4)',
  },
  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1440px',
  },
} as const;

export const theme = lightTheme;

export type AppTheme = typeof lightTheme;

