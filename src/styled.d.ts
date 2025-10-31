import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      primary: string;
      text: string;
      subtleText: string;
      border: string;
      error: string;
      white: string;
      background: string;
      cardBackground: string;
      purple: string;
      blue: string;
      pink: string;
      violet: string;
      green: string;
      lightPurple: string;
      lightBlue: string;
      gray: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
    };
    gradients: {
      primary: string;
      purple: string;
    };
    radii: {
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    spacing: (n: number) => string;
    shadows: {
      sm: string;
      md: string;
      lg: string;
    };
    breakpoints: {
      mobile: string;
      tablet: string;
      desktop: string;
      wide: string;
    };
  }
}

