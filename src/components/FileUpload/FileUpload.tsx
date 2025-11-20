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
  const [isLoading, setIsLoading] = useState(false);

  // Check if value is empty - if so, don't show file metadata
  const isEmpty = value === '' || value === null || value === undefined;
  const shouldShowMetadata = !isEmpty && fileMetadata !== null;

  // Clear fileMetadata when value becomes empty (e.g., after Reset button)
  useEffect(() => {
    if (isEmpty && fileMetadata !== null) {
      setFileMetadata(null);
    }
  }, [isEmpty, fileMetadata]);

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

  const handleFile = useCallback(async (file: File) => {
    // Check file size limit (2MB = 2 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_FILE_SIZE) {
      const errorMessage = `File size exceeds 2MB limit. File size: ${formatFileSize(file.size)}`;
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
      return;
    }

    if (!validateFile(file)) {
      const errorMessage = `Please upload a valid file type: ${acceptedTypes.join(', ')}`;
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
      return;
    }

    // Set loading state to true
    setIsLoading(true);

    // Use async file reading with Promise wrapper
    const readFileAsync = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });
    };

    try {
      const content = await readFileAsync(file);

      // Use setTimeout to defer the state update and callback
      setTimeout(() => {
        const metadata: FileMetadata = {
          name: file.name,
          size: file.size,
          type: getFileType(file.name),
        };
        setFileMetadata(metadata);
        onFileLoad(content, file.name, file.size, metadata.type);
        setIsLoading(false); // Stop loading after file is processed
      }, 0);
    } catch {
      const errorMessage = 'Failed to read file. Please try again.';
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
      setIsLoading(false); // Stop loading on error
    }
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
    // Reset the input value to allow uploading the same file again
    e.target.value = '';
  };

  const handleRemove = () => {
    setFileMetadata(null);
    onFileLoad('', '', 0, '');
  };

  return (
    <UploadContainer>
      {isLoading ? (
        <DropZone $isDragging={false}>
          <DropZoneText $isDragging={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '3px solid #e5e7eb',
                borderTop: '3px solid #9333ea',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              <span>Loading file...</span>
            </div>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </DropZoneText>
        </DropZone>
      ) : !shouldShowMetadata ? (
        <DropZone
          $isDragging={isDragging}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-drop-zone="true"
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
                    Supported: {acceptedTypes.join(', ')} (Max: 2MB)
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
