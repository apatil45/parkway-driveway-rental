/**
 * Comprehensive tests for Select component
 * Tests all functionality including options, validation, and accessibility
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Select from '@/components/ui/Select';

describe('Select Component', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  it('renders options', () => {
    render(<Select options={options} />);
    
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('handles selection', async () => {
    const handleChange = jest.fn();
    render(<Select options={options} onChange={handleChange} />);
    
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'option2');
    
    expect(handleChange).toHaveBeenCalled();
    expect(select).toHaveValue('option2');
  });

  it('shows placeholder', () => {
    render(<Select options={options} placeholder="Select an option" />);
    
    expect(screen.getByText('Select an option')).toBeInTheDocument();
    const placeholderOption = screen.getByText('Select an option');
    expect(placeholderOption).toBeDisabled();
  });

  it('renders with label', () => {
    render(<Select options={options} label="Choose Option" />);
    
    expect(screen.getByLabelText('Choose Option')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Select options={options} error="This field is required" />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass('text-red-600');
  });

  it('shows helper text when no error', () => {
    render(<Select options={options} helperText="Please select an option" />);
    
    expect(screen.getByText('Please select an option')).toBeInTheDocument();
    expect(screen.getByText('Please select an option')).toHaveClass('text-gray-500');
  });

  it('does not show helper text when error is present', () => {
    render(
      <Select 
        options={options} 
        error="Error message" 
        helperText="Helper text" 
      />
    );
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<Select options={options} disabled />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('handles disabled options', () => {
    const optionsWithDisabled = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2', disabled: true },
      { value: 'option3', label: 'Option 3' },
    ];
    
    render(<Select options={optionsWithDisabled} />);
    
    const select = screen.getByRole('combobox');
    const option2 = screen.getByText('Option 2');
    expect(option2).toBeDisabled();
  });

  it('handles required validation', () => {
    render(<Select options={options} required />);
    
    const select = screen.getByRole('combobox');
    expect(select).toBeRequired();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Select options={options} className="custom-select" />
    );
    
    const select = container.querySelector('select');
    expect(select).toHaveClass('custom-select');
  });

  it('has proper error styling when error is present', () => {
    const { container } = render(
      <Select options={options} error="Error" />
    );
    
    const select = container.querySelector('select');
    expect(select).toHaveClass('border-red-300');
    expect(select).toHaveClass('focus:ring-red-500');
  });

  it('has proper default styling when no error', () => {
    const { container } = render(<Select options={options} />);
    
    const select = container.querySelector('select');
    expect(select).toHaveClass('border-gray-300');
  });

  it('generates unique id when not provided', () => {
    const { container } = render(<Select options={options} label="Test" />);
    
    const select = container.querySelector('select');
    const label = container.querySelector('label');
    expect(select?.id).toBeTruthy();
    expect(label?.htmlFor).toBe(select?.id);
  });

  it('uses provided id', () => {
    const { container } = render(
      <Select options={options} id="custom-id" label="Test" />
    );
    
    const select = container.querySelector('select');
    expect(select?.id).toBe('custom-id');
  });

  it('handles empty options array', () => {
    render(<Select options={[]} placeholder="No options" />);
    
    expect(screen.getByText('No options')).toBeInTheDocument();
    const select = screen.getByRole('combobox');
    expect(select.querySelectorAll('option')).toHaveLength(1); // Only placeholder
  });

  it('handles value prop', () => {
    render(<Select options={options} value="option2" />);
    
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('option2');
  });
});

