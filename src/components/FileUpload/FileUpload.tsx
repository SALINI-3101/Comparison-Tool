import React, { useState, useCallback, useEffect } from 'react';
import { UploadContainer, DropZone, DropZoneText, FileInfo, FileInfoItem, RemoveButton } from './FileUpload.styles';

export interface FileUploadProps {
  onFileLoad: (content: string, fileName: string, fileSize: number, fileType: string) => void;
  acceptedTypes?: string[];
  label?: string;
  value?: string; // Add value prop to track external content
  onError?: (message: string) => void; // Add error callback
}

interface FileMetadata {
  name: string;
  size: number;
  type: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileLoad, acceptedTypes = ['.json', '.xml', '.txt'], label, value = '', onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);

  // Clear file metadata when external value is cleared
  useEffect(() => {
    if (value === '' && fileMetadata !== null) {
      setFileMetadata(null);
    }
  }, [value, fileMetadata]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'json':
        return 'JSON';
      case 'xml':
        return 'XML';
      case 'txt':
        return 'Text';
      default:
        return extension?.toUpperCase() || 'Unknown';
    }
  };

  const validateFile = useCallback((file: File): boolean => {
    const fileName = file.name.toLowerCase();
    return acceptedTypes.some(type => fileName.endsWith(type.replace('.', '')));
  }, [acceptedTypes]);

  const handleFile = useCallback((file: File) => {
    if (!validateFile(file)) {
      const errorMessage = `Please upload a valid file type: ${acceptedTypes.join(', ')}`;
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const metadata: FileMetadata = {
        name: file.name,
        size: file.size,
        type: getFileType(file.name),
      };
      setFileMetadata(metadata);
      onFileLoad(content, file.name, file.size, metadata.type);
    };
    reader.readAsText(file);
  }, [acceptedTypes, onFileLoad, onError, validateFile]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleRemove = () => {
    setFileMetadata(null);
    onFileLoad('', '', 0, '');
  };

  return (
    <UploadContainer>
      {!fileMetadata ? (
        <DropZone
          $isDragging={isDragging}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id={`file-input-${label}`}
          />
          <label htmlFor={`file-input-${label}`} style={{ cursor: 'pointer', width: '100%' }}>
            <DropZoneText $isDragging={isDragging}>
              {isDragging ? (
                <>📥 Drop file here</>
              ) : (
                <>
                  📁 Drag & drop file here or <span style={{ color: '#9333ea', textDecoration: 'underline' }}>browse</span>
                  <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.7 }}>
                    Supported: {acceptedTypes.join(', ')}
                  </div>
                </>
              )}
            </DropZoneText>
          </label>
        </DropZone>
      ) : (
        <FileInfo>
          <FileInfoItem>
            <strong>📄 File:</strong> {fileMetadata.name}
          </FileInfoItem>
          <FileInfoItem>
            <strong>📊 Type:</strong> {fileMetadata.type}
          </FileInfoItem>
          <FileInfoItem>
            <strong>💾 Size:</strong> {formatFileSize(fileMetadata.size)}
          </FileInfoItem>
          <RemoveButton onClick={handleRemove}>✕ Remove</RemoveButton>
        </FileInfo>
      )}
    </UploadContainer>
  );
};
