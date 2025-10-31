import styled from 'styled-components';

export const ToggleContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 12px;
`;

export const ToggleLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  user-select: none;
  transition: color 0.3s ease;
`;

export const ToggleSwitch = styled.button<{ $isChecked: boolean }>`
  position: relative;
  width: 44px;
  height: 24px;
  background: ${({ $isChecked, theme }) =>
    $isChecked ? theme.colors.blue : theme.colors.gray[300]};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  padding: 0;

  &:hover {
    background: ${({ $isChecked, theme }) =>
      $isChecked ? '#2563eb' : theme.colors.gray[400]};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const ToggleThumb = styled.span<{ $isChecked: boolean }>`
  position: absolute;
  top: 2px;
  left: ${({ $isChecked }) => ($isChecked ? '22px' : '2px')};
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: left 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;
