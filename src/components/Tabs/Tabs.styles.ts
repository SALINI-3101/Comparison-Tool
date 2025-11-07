import styled from 'styled-components';

export const TabsHeader = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    gap: 6px;
    margin-bottom: 16px;
  }

  @media (max-width: 400px) {
    gap: 4px;
    margin-bottom: 12px;
  }
`;

export const TabButton = styled.button<{ $active: boolean }>`
  background: ${({ $active, theme }) => ($active ? theme.colors.purple : 'transparent')};
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: ${({ $active, theme }) => ($active ? theme.colors.white : theme.colors.text)};
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: ${({ $active, theme }) => ($active ? '#7c3aed' : theme.colors.gray[100])};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.lightPurple};
  }

  @media (max-width: 768px) {
    padding: 8px 10px;
    font-size: 11px;
    flex: 0 1 auto;
    min-width: fit-content;
  }

  @media (max-width: 480px) {
    padding: 6px 8px;
    font-size: 10px;
  }

  @media (max-width: 400px) {
    padding: 5px 6px;
    font-size: 9px;
    border-radius: 12px;
  }
`;

export const TabsContent = styled.div`
  padding: 0;
`;

