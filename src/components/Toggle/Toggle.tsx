import React from 'react';
import { ToggleContainer, ToggleLabel, ToggleSwitch, ToggleThumb } from './Toggle.styles';

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange, disabled = false, className }) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <ToggleContainer className={className}>
      <ToggleSwitch
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        $isChecked={checked}
        onClick={handleToggle}
        disabled={disabled}
      >
        <ToggleThumb $isChecked={checked} />
      </ToggleSwitch>
      <ToggleLabel onClick={handleToggle}>{label}</ToggleLabel>
    </ToggleContainer>
  );
};
