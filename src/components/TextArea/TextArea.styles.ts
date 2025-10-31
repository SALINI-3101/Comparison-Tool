import styled from 'styled-components';

export const TextAreaContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const TextAreaLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.3s ease;
`;

export const StyledTextArea = styled.textarea`
  width: 100%;
  min-height: 300px;
  padding: 16px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.gray[50]};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  resize: vertical;
  transition: all 0.3s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.subtleText};
    font-family: system-ui, -apple-system, sans-serif;
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.lightBlue};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray[100]};
    cursor: not-allowed;
    opacity: 0.6;
  }

  @media (max-width: 768px) {
    min-height: 200px;
    font-size: 13px;
    padding: 12px;
  }
`;

export const LabelDot = styled.span<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ color }) => color};
`;
