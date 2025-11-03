/* eslint-disable @typescript-eslint/no-explicit-any */
// Mock styled-components for testing
import * as React from 'react';

// Mock styled component creator
const mockStyledComponent = (tag: string) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (_styles: unknown) => {
    const StyledComponent = ({ children, ...props }: any) => {
      return React.createElement(tag, props, children);
    };
    StyledComponent.displayName = `styled.${tag}`;
    return StyledComponent;
  };
};

const styled = new Proxy(
  {},
  {
    get: (_target, prop: string) => mockStyledComponent(prop),
  }
) as any;

styled.createGlobalStyle = () => () => null;
styled.ThemeProvider = ({ children }: { children: React.ReactNode }) => children;
styled.ServerStyleSheet = jest.fn().mockImplementation(() => ({
  collectStyles: (children: React.ReactNode) => children,
  getStyleTags: () => '',
  getStyleElement: () => [],
  seal: () => {},
}));

export default styled;
export { styled };
