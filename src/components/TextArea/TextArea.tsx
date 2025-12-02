import React, { useRef } from 'react';
import {
  TextAreaContainer,
  TextAreaLabel,
  StyledTextArea,
  LabelDot,
  EditorWrapper,
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

const TextAreaComponent: React.FC<TextAreaProps> = ({
  label,
  value,
  onChange,
  placeholder = '',
  disabled = false,
  labelColor,
  className,
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <TextAreaContainer className={className}>
      <TextAreaLabel>
        {labelColor && <LabelDot color={labelColor} />}
        {label}
      </TextAreaLabel>
      <EditorWrapper>
        <TextAreaWrapper>
          <StyledTextArea
            ref={textAreaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
          />
        </TextAreaWrapper>
      </EditorWrapper>
    </TextAreaContainer>
  );
};

TextAreaComponent.displayName = 'TextArea';

export const TextArea = React.memo(TextAreaComponent, (prevProps, nextProps) => {
  // Custom comparison: only re-render if value actually changed (reference equality for performance)
  // or if other props changed
  return (
    prevProps.value === nextProps.value &&
    prevProps.label === nextProps.label &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.labelColor === nextProps.labelColor &&
    prevProps.className === nextProps.className &&
    prevProps.onChange === nextProps.onChange
  );
});
