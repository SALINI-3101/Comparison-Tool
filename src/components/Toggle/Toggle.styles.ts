import styled from 'styled-components';

export const ToggleContainer = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 12px;
  flex-wrap: nowrap;
  min-width: 0;

  @media (max-width: 768px) {
    gap: 8px;
  }
`;

export const ToggleLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  user-select: none;
  transition: color 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;

  @media (max-width: 768px) {
    font-size: 12px;
  }

  @media (max-width: 480px) {
    font-size: 11px;
  }
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
  flex-shrink: 0;

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

  @media (max-width: 768px) {
    width: 38px;
    height: 20px !important;
    min-height: 20px !important;
    border-radius: 10px;
  }

  @media (max-width: 480px) {
    width: 34px;
    height: 18px !important;
    min-height: 18px !important;
    border-radius: 9px;
  }

  @media (max-width: 400px) {
    width: 30px;
    height: 16px !important;
    min-height: 16px !important;
    border-radius: 8px;
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

  @media (max-width: 768px) {
    width: 16px;
    height: 16px;
    left: ${({ $isChecked }) => ($isChecked ? '20px' : '2px')};
  }

  @media (max-width: 480px) {
    width: 14px;
    height: 14px;
    left: ${({ $isChecked }) => ($isChecked ? '18px' : '2px')};
  }

  @media (max-width: 400px) {
    width: 12px;
    height: 12px;
    top: 2px;
    left: ${({ $isChecked }) => ($isChecked ? '16px' : '2px')};
  }
`;
