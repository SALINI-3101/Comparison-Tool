import styled from 'styled-components';

export const TabsHeader = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;

  @media (max-width: 768px) {
    gap: 6px;
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

  &:hover {
    background: ${({ $active, theme }) => ($active ? '#7c3aed' : theme.colors.gray[100])};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.lightPurple};
  }

  @media (max-width: 768px) {
    padding: 8px 16px;
    font-size: 13px;
  }
`;

export const TabsContent = styled.div`
  padding: 0;
`;

