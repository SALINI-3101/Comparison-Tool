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

export const DifferenceItem = styled.div<{ $diffType?: 'added' | 'removed' | 'modified' }>`
  padding: 12px;
  margin-bottom: 12px;
  background: ${({ theme }) => theme.colors.background === '#111827' ? 'rgba(255, 255, 255, 0.05)' : theme.colors.gray[50]};
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
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const DifferenceTypeBadge = styled.span<{ $type: 'added' | 'removed' | 'modified' }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${({ $type, theme }) => {
    if ($type === 'added') return theme.colors.green || '#10b981';
    if ($type === 'removed') return theme.colors.error || '#ef4444';
    return theme.colors.purple || '#a855f7';
  }};
  color: white;
`;

export const DifferenceValues = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const DifferenceValue = styled.div<{ $type: 'left' | 'right'; $diffType?: 'added' | 'removed' | 'modified' }>`
  padding: 4px;
  background: ${({ theme }) => theme.colors.background === '#111827' ? 'rgba(255, 255, 255, 0.08)' : theme.colors.cardBackground};
  border-radius: 6px;
  border: 2px solid ${({ $type, theme, $diffType }) => {
    if ($diffType === 'added') return '#10b981';
    if ($diffType === 'removed') return '#ef4444';
    if ($diffType === 'modified') return '#f97316';
    return $type === 'left' ? theme.colors.purple : theme.colors.blue;
  }};
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

export const ValueContent = styled.pre<{ $diffType?: 'added' | 'removed' | 'modified' }>`
  margin: 0;
  padding: 8px;
  font-size: 13px;
  font-family: 'Segoe UI', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Consolas', 'Monaco', 'Courier New', monospace;
  color: ${({ theme }) => theme.colors.text};
  white-space: pre-wrap;
  word-break: break-word;
  transition: all 0.3s ease;
  background-color: transparent;
  border-radius: 4px;
  overflow-x: auto;

  .line-diff,
  .line-added,
  .line-removed,
  .line-same {
    display: flex;
    align-items: baseline;
    padding: 4px 8px;
    margin: 0;
    min-height: 24px;
    line-height: 1.6;
  }

  .line-added {
    background-color: ${({ theme }) => theme.colors.background === '#111827' ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0'};
  }

  .line-removed {
    background-color: ${({ theme }) => theme.colors.background === '#111827' ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'};
  }

  .line-diff {
    background-color: ${({ theme, $diffType }) => {
      if ($diffType === 'added') return theme.colors.background === '#111827' ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0';
      if ($diffType === 'removed') return theme.colors.background === '#111827' ? 'rgba(239, 68, 68, 0.3)' : '#fecaca';
      if ($diffType === 'modified') return theme.colors.background === '#111827' ? 'rgba(251, 191, 36, 0.3)' : '#fde68a';
      return 'transparent';
    }};
  }

  .line-same {
    background-color: transparent;
  }

  .line-number {
    display: inline-block;
    min-width: 40px;
    padding-right: 12px;
    margin-right: 12px;
    color: ${({ theme }) => theme.colors.subtleText};
    text-align: right;
    user-select: none;
    flex-shrink: 0;
    border-right: 1px solid ${({ theme }) => theme.colors.border};
    font-weight: 600;
  }

  mark {
    background-color: ${({ theme }) => theme.colors.background === '#111827' ? '#fbbf24' : '#fbbf24'};
    color: ${({ theme }) => theme.colors.background === '#111827' ? '#000000' : '#000000'};
    padding: 2px 4px;
    border-radius: 2px;
    font-weight: 700;
    display: inline;
    vertical-align: baseline;
    line-height: inherit;
  }
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

export const StatisticsRow = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: ${({ theme }) => theme.colors.gray[50]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-wrap: wrap;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    padding: 12px 16px;
    gap: 8px;
  }
`;

export const StatisticBadge = styled.div<{ $type: 'added' | 'removed' | 'modified' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  background: ${({ $type }) => {
    if ($type === 'added') return '#10b981';
    if ($type === 'removed') return '#ef4444';
    return '#f97316'; // Orange for modified
  }};
  color: white;
  border: 2px solid ${({ $type }) => {
    if ($type === 'added') return '#059669';
    if ($type === 'removed') return '#dc2626';
    return '#ea580c'; // Darker orange for modified
  }};
  transition: all 0.2s ease;

  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 12px;
  }
`;

export const FilterRow = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  background: ${({ theme }) => theme.colors.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  flex-wrap: wrap;
  align-items: center;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    padding: 10px 16px;
    gap: 6px;
  }
`;

export const FilterLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.subtleText};
  margin-right: 4px;
  transition: color 0.3s ease;

  @media (max-width: 768px) {
    font-size: 12px;
  }
`;

export const FilterPill = styled.button<{ $type: 'added' | 'removed' | 'modified'; $active: boolean }>`
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 2px solid ${({ $type, $active }) => {
    if (!$active) return '#d1d5db';
    if ($type === 'added') return '#10b981';
    if ($type === 'removed') return '#ef4444';
    return '#f97316';
  }};
  background: ${({ $type, $active }) => {
    if (!$active) return 'transparent';
    if ($type === 'added') return '#10b981';
    if ($type === 'removed') return '#ef4444';
    return '#f97316';
  }};
  color: ${({ $active, theme }) => ($active ? 'white' : theme.colors.text)};
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.8;
    transform: scale(1.05);
  }

  @media (max-width: 768px) {
    padding: 5px 12px;
    font-size: 11px;
  }
`;
