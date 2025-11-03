import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toggle } from '../Toggle';

describe('Toggle Component', () => {
  it('should render with label', () => {
    const mockOnChange = jest.fn();
    render(<Toggle label="Test Toggle" checked={false} onChange={mockOnChange} />);

    expect(screen.getByText('Test Toggle')).toBeInTheDocument();
  });

  it('should call onChange when clicked', () => {
    const mockOnChange = jest.fn();
    render(<Toggle label="Test Toggle" checked={false} onChange={mockOnChange} />);

    const toggleButton = screen.getByRole('switch');
    fireEvent.click(toggleButton);

    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('should reflect checked state', () => {
    const mockOnChange = jest.fn();
    render(<Toggle label="Test Toggle" checked={true} onChange={mockOnChange} />);

    const toggleButton = screen.getByRole('switch');
    expect(toggleButton).toHaveAttribute('aria-checked', 'true');
  });

  it('should not call onChange when disabled', () => {
    const mockOnChange = jest.fn();
    render(<Toggle label="Test Toggle" checked={false} onChange={mockOnChange} disabled={true} />);

    const toggleButton = screen.getByRole('switch');
    fireEvent.click(toggleButton);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should have correct aria-label', () => {
    const mockOnChange = jest.fn();
    render(<Toggle label="Accessibility Test" checked={false} onChange={mockOnChange} />);

    const toggleButton = screen.getByRole('switch');
    expect(toggleButton).toHaveAttribute('aria-label', 'Accessibility Test');
  });
});
