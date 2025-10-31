import React from 'react';
import { TextAreaContainer, TextAreaLabel, StyledTextArea, LabelDot } from './TextArea.styles';

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
  return (
    <TextAreaContainer className={className}>
      <TextAreaLabel>
        {labelColor && <LabelDot color={labelColor} />}
        {label}
      </TextAreaLabel>
      <StyledTextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </TextAreaContainer>
  );
};
