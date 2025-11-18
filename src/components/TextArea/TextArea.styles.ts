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

export const EditorWrapper = styled.div`
  display: flex;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  transition: all 0.3s ease;
  background: ${({ theme }) => theme.colors.gray[50]};
  max-height: 500px;
  height: 500px;

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.blue};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.lightBlue};
  }

  @media (max-width: 768px) {
    max-height: 400px;
    height: 400px;
  }

  @media (max-width: 480px) {
    max-height: 300px;
    height: 300px;
  }
`;

export const LineNumbers = styled.div`
  background: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.subtleText};
  padding: 16px 8px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  text-align: right;
  user-select: none;
  overflow-y: auto;
  border-right: 2px solid ${({ theme }) => theme.colors.border};
  min-width: 50px;
  transition: all 0.3s ease;

  div {
    min-height: 22.4px;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    font-size: 13px;
    padding: 12px 6px;
    min-width: 40px;
  }
`;

export const TextAreaWrapper = styled.div`
  flex: 1;
  display: flex;
`;

export const StyledTextArea = styled.textarea`
  width: 100%;
  height: 100%;
  padding: 16px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.text};
  background: transparent;
  border: none;
  resize: none;
  overflow-y: auto;
  transition: all 0.3s ease;

  &::placeholder {
    color: ${({ theme }) => theme.colors.subtleText};
    font-family: system-ui, -apple-system, sans-serif;
  }

  &:focus {
    outline: none;
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray[100]};
    cursor: not-allowed;
    opacity: 0.6;
  }

  @media (max-width: 768px) {
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
