import styled from 'styled-components';

export const ResultsContainer = styled.div`
  margin-top: 24px;
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  transition: border-color 0.3s ease;
`;

export const ResultsHeader = styled.div<{ $status: 'success' | 'error' | 'info' }>`
  background: ${({ $status, theme }) => {
    if ($status === 'success') return theme.colors.green || '#10b981';
    if ($status === 'error') return theme.colors.error;
    return theme.colors.blue;
  }};
  color: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;

  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
`;

export const ResultsBody = styled.div`
  background: ${({ theme }) => theme.colors.cardBackground};
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
  transition: background 0.3s ease;

  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export const DifferenceItem = styled.div`
  padding: 12px;
  margin-bottom: 12px;
  border-left: 3px solid ${({ theme }) => theme.colors.purple};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: 4px;
  transition: background 0.3s ease;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const DifferencePath = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  transition: color 0.3s ease;
`;

export const DifferenceValues = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const DifferenceValue = styled.div<{ $type: 'left' | 'right' }>`
  padding: 8px 12px;
  background: ${({ $type, theme }) => ($type === 'left' ? theme.colors.gray[100] : theme.colors.gray[100])};
  border-radius: 4px;
  border: 2px solid ${({ $type, theme }) => ($type === 'left' ? theme.colors.purple : theme.colors.blue)};
  transition: all 0.3s ease;
`;

export const ValueLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.subtleText};
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: color 0.3s ease;
`;

export const ValueContent = styled.pre`
  margin: 0;
  font-size: 13px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  color: ${({ theme }) => theme.colors.text};
  white-space: pre-wrap;
  word-break: break-word;
  transition: color 0.3s ease;
`;

export const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.gray[100]};
  padding: 12px 16px;
  border-radius: 6px;
  border: 2px solid ${({ theme }) => theme.colors.error};
  font-size: 14px;
  transition: all 0.3s ease;
`;

export const SuccessMessage = styled.div`
  color: ${({ theme }) => theme.colors.green};
  background: ${({ theme }) => theme.colors.gray[100]};
  padding: 12px 16px;
  border-radius: 6px;
  border: 2px solid ${({ theme }) => theme.colors.green};
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;

  svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.colors.subtleText};
  transition: color 0.3s ease;

  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
`;
