import styled from 'styled-components';

export const PageContainer = styled.div`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  transition: background 0.3s ease;
`;

export const Header = styled.header`
  background: ${({ theme }) => theme.gradients.primary};
  padding: 48px 24px;
  color: white;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 32px 16px;
  }

  @media (max-width: 480px) {
    padding: 24px 12px;
  }
`;

export const HeaderContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 24px;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    gap: 12px;
    flex-wrap: wrap;
  }
`;

export const Logo = styled.div`
  background: white;
  padding: 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${({ theme }) => theme.shadows.lg};

  svg {
    width: 32px;
    height: 32px;
  }

  @media (max-width: 768px) {
    padding: 12px;

    svg {
      width: 24px;
      height: 24px;
    }
  }

  @media (max-width: 400px) {
    padding: 8px;

    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

export const HeaderText = styled.div`
  flex: 1;

  @media (max-width: 768px) {
    flex: 0 1 auto;
    min-width: 0;
  }
`;

export const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;

  @media (max-width: 768px) {
    font-size: 20px;
    margin: 0 0 4px 0;
  }

  @media (max-width: 400px) {
    font-size: 16px;
    margin: 0 0 2px 0;
  }
`;

export const Subtitle = styled.p`
  font-size: 16px;
  margin: 0;
  opacity: 0.95;

  @media (max-width: 768px) {
    font-size: 12px;
  }

  @media (max-width: 400px) {
    font-size: 10px;
  }
`;

export const SecurityBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 12px 20px;
  border-radius: 24px;
  font-size: 13px;
  border: 1px solid rgba(255, 255, 255, 0.2);

  svg {
    width: 16px;
    height: 16px;
  }

  @media (max-width: 768px) {
    width: 100%;
    flex-basis: 100%;
    order: 3;
    padding: 10px 16px;
    font-size: 11px;
  }
`;

export const ThemeToggleButton = styled.button`
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: scale(1.05);
  }

  svg {
    width: 24px;
    height: 24px;
  }

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    margin-left: auto;

    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

export const ClearButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 15px;
    height: 15px;
  }

  @media (max-width: 768px) {
    padding: 6px 14px;
    font-size: 12px;
    gap: 5px;
    border-radius: 16px;

    svg {
      width: 13px;
      height: 13px;
    }
  }

  @media (max-width: 480px) {
    padding: 5px 10px;
    font-size: 11px;
    gap: 4px;
    border-radius: 14px;

    svg {
      width: 11px;
      height: 11px;
    }
  }
`;

export const Content = styled.main`
  max-width: 1400px;
  margin: -32px auto 0;
  padding: 0 24px 48px;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    margin: -24px auto 0;
    padding: 0 16px 32px;
  }

  @media (max-width: 480px) {
    margin: -20px auto 0;
    padding: 0 12px 24px;
  }

  @media (max-width: 400px) {
    margin: -16px auto 0;
    padding: 0 8px 20px;
  }
`;

export const Card = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  border-radius: 16px;
  padding: 32px;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  transition: background 0.3s ease;

  @media (max-width: 768px) {
    padding: 20px;
    border-radius: 12px;
  }

  @media (max-width: 480px) {
    padding: 16px;
    border-radius: 8px;
  }

  @media (max-width: 400px) {
    padding: 12px;
    border-radius: 8px;
  }
`;

export const TabsAndClearRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;

  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

export const TabsWrapper = styled.div`
  flex: 1;
  min-width: 0;

  @media (max-width: 1024px) {
    width: 100%;
  }
`;

export const InputSection = styled.section`
  margin-bottom: 24px;

  @media (max-width: 768px) {
    margin-bottom: 16px;
  }
`;

export const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 16px 0;
  transition: color 0.3s ease;

  @media (max-width: 768px) {
    font-size: 14px;
    margin: 0 0 12px 0;
  }
`;

export const OptionsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 24px;
  align-items: center;

  @media (max-width: 768px) {
    gap: 12px;
    row-gap: 16px;
  }

  @media (max-width: 480px) {
    gap: 8px;
    row-gap: 12px;
  }
`;

export const DualEditorContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

export const ActionButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  background: ${({ $variant, theme }) =>
    $variant === 'primary' ? theme.colors.purple : theme.colors.gray[100]};
  color: ${({ $variant, theme }) => ($variant === 'primary' ? 'white' : theme.colors.gray[700])};
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  white-space: nowrap;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.md};
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 18px;
    height: 18px;
  }

  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 13px;
    width: 100%;
    justify-content: center;
  }

  @media (max-width: 480px) {
    padding: 8px 16px;
    font-size: 12px;
    gap: 6px;

    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

export const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
  }
`;

export const ValidateButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }

  @media (max-width: 480px) {
    gap: 6px;
  }
`;
