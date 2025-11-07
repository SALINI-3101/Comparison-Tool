import styled from 'styled-components';

export const UploadContainer = styled.div`
  margin-bottom: 12px;
`;

export const DropZone = styled.div<{ $isDragging: boolean }>`
  border: 2px dashed ${({ $isDragging, theme }) => ($isDragging ? theme.colors.purple : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 16px;
  text-align: center;
  background-color: ${({ $isDragging, theme }) => ($isDragging ? theme.colors.lightPurple : theme.colors.gray[50])};
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.purple};
    background-color: ${({ theme }) => theme.colors.lightPurple};
  }
`;

export const DropZoneText = styled.div<{ $isDragging: boolean }>`
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  font-weight: ${({ $isDragging }) => ($isDragging ? '600' : '500')};
  transition: color 0.3s ease;
`;

export const FileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background-color: ${({ theme }) => theme.colors.gray[50]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  transition: all 0.3s ease;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 8px;
    padding: 10px 12px;
    font-size: 12px;
  }
`;

export const FileInfoItem = styled.div`
  color: ${({ theme }) => theme.colors.text};
  transition: color 0.3s ease;
  word-break: break-word;

  strong {
    font-weight: 600;
    margin-right: 6px;
  }

  @media (max-width: 768px) {
    font-size: 11px;
  }
`;

export const RemoveButton = styled.button`
  margin-left: auto;
  padding: 6px 12px;
  background-color: ${({ theme }) => theme.colors.error};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;
