import React, { useRef, useEffect, useState } from 'react';
import {
  TextAreaContainer,
  TextAreaLabel,
  StyledTextArea,
  LabelDot,
  EditorWrapper,
  LineNumbers,
  TextAreaWrapper
} from './TextArea.styles';

export interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  labelColor?: string;
  className?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
  disabled = false,
  labelColor,
  className,
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [lineCount, setLineCount] = useState(1);

  // Update line count when value changes
  useEffect(() => {
    const lines = value.split('\n').length;
    setLineCount(lines);
  }, [value]);

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textAreaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textAreaRef.current.scrollTop;
    }
  };

  return (
    <TextAreaContainer className={className}>
      <TextAreaLabel>
        {labelColor && <LabelDot color={labelColor} />}
        {label}
      </TextAreaLabel>
      <EditorWrapper>
        <LineNumbers ref={lineNumbersRef}>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </LineNumbers>
        <TextAreaWrapper>
          <StyledTextArea
            ref={textAreaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            placeholder={placeholder}
            disabled={disabled}
          />
        </TextAreaWrapper>
      </EditorWrapper>
    </TextAreaContainer>
  );
};
